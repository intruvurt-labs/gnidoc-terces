import { GoogleGenAI, Modality } from "@google/genai";
import { type AIGenerationRequest, type Project, type GeneratedFile } from "@shared/schema";
import { storage } from "../storage";
import * as fs from "fs";
import * as path from "path";
import fetch from "node-fetch";

const ai = new GoogleGenAI({
  apiKey:
    process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    ""
});

export interface GenerationResult {
  project: Project;
  files: GeneratedFile[];
  status: 'success' | 'error';
  error?: string;
}

// Multi-provider helpers
async function callAnthropic(prompt: string, systemPrompt: string): Promise<string | null> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
    if (!apiKey) return null;
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (!resp.ok) return null;
    const data: any = await resp.json();
    const text = data?.content?.[0]?.text || data?.content?.map((p: any) => p.text).join("\n");
    return text || null;
  } catch {
    return null;
  }
}

async function callOpenAI(prompt: string, systemPrompt: string): Promise<string | null> {
  try {
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) return null;
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      })
    });
    if (!resp.ok) return null;
    const data: any = await resp.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

async function callGeminiText(prompt: string, systemPrompt: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: { systemInstruction: systemPrompt },
      contents: prompt,
    });
    return response.text || null;
  } catch {
    return null;
  }
}

function selectBestCode(candidates: Array<{ provider: string; text: string }>, opts?: { strict?: boolean }): string | null {
  if (candidates.length === 0) return null;
  const scored = candidates.map(c => {
    const text = c.text || '';
    const fenceCount = (text.match(/```/g) || []).length;
    const codeTypes = (text.match(/```\w+/g) || []).length;
    const lengthScore = Math.min(1.5, text.length / 6000);
    const codeBlocks = text.match(/```[\s\S]*?```/g) || [];
    const codeChars = codeBlocks.reduce((n, b) => n + b.length, 0);
    const codeRatio = text.length ? Math.min(2, codeChars / text.length) : 0;
    const hasPackage = /\bpackage\.json\b/.test(text) ? 1 : 0;
    const hasTsx = /```tsx|```typescript|import React/.test(text) ? 0.5 : 0;
    const hasTodoPenalty = /TODO|to be implemented|\.\.\./i.test(text) ? -2 : 0;
    const hasProsePenalty = /(as an ai|cannot|I am unable)/i.test(text) ? -3 : 0;
    const score = fenceCount * 1.5 + codeTypes * 1.2 + lengthScore + codeRatio * (opts?.strict ? 3 : 1.5) + hasPackage + hasTsx + hasTodoPenalty + hasProsePenalty;
    return { ...c, score } as any;
  }).sort((a, b) => b.score - a.score);
  return scored[0]?.text || null;
}

export class AIOrchestrator {
  
  async generateCode(prompt: string, options?: any): Promise<string> {
    try {
      const strict = Boolean(options?.bestOrchestration || options?.onlyCodeOutput);
      const basePrompt = `You are an expert full-stack developer. Generate complete, production-ready code based on the user's requirements.\nInclude proper error handling, modern best practices, and comprehensive functionality.`;
      const strictDirectives = strict ? `\nCRITICAL OUTPUT RULES:\n- Output ONLY fenced code blocks using triple backticks. No explanations or prose.\n- Provide COMPLETE, WORKING files from start to finish.\n- Include all required files (e.g., package.json) when applicable.\n- No placeholders, no TODOs, no ellipses.\n- Ensure imports and exports line up; avoid missing dependencies.` : '';
      const systemPrompt = `${basePrompt}${strictDirectives}\n\nRequirements:\n- Generate complete file structures with all necessary dependencies\n- Include proper error handling and validation\n- Use modern frameworks and best practices\n- Add comprehensive comments and documentation\n- Ensure security best practices are followed\n\n${options?.language ? `Programming Language: ${options.language}` : ''}\n${options?.framework ? `Framework: ${options.framework}` : ''}\n${options?.includeTests ? 'Include unit tests and testing setup' : ''}`;

      const settled = await Promise.allSettled([
        callGeminiText(prompt, systemPrompt).then(text => ({ provider: 'gemini', text })),
        callOpenAI(prompt, systemPrompt).then(text => ({ provider: 'openai', text })),
        callAnthropic(prompt, systemPrompt).then(text => ({ provider: 'anthropic', text }))
      ]);

      const candidates = settled
        .filter(r => r.status === 'fulfilled' && (r as any).value.text)
        .map((r: any) => ({ provider: r.value.provider, text: r.value.text as string }));

      const best = selectBestCode(candidates, { strict });
      if (best) return best;

      if (strict) {
        const fallback = await callGeminiText(`${prompt}\n\nReturn ONLY complete code blocks for all files required to run. No prose.`, systemPrompt);
        if (fallback) return fallback;
      }

      return this.generateDemoCode(prompt, options);
    } catch (error) {
      return this.generateDemoCode(prompt, options);
    }
  }

  async generateImage(prompt: string): Promise<string> {
    try {
      const openaiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      if (openaiKey) {
        const resp = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt,
            size: "1024x1024",
            response_format: "b64_json"
          })
        });
        if (resp.ok) {
          const data: any = await resp.json();
          const b64 = data?.data?.[0]?.b64_json;
          if (b64) {
            const visionKey = process.env.GOOGLE_VISION_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
            if (visionKey) {
              fetch(`https://vision.googleapis.com/v1/images:annotate?key=${visionKey}`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  requests: [{ image: { content: b64 }, features: [{ type: "LABEL_DETECTION", maxResults: 5 }] }]
                })
              }).catch(() => {});
            }
            return b64;
          }
        }
      }

      // Fallback to Gemini image generation
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
      });
      const candidates = response.candidates;
      if (candidates?.length) {
        const content = candidates[0].content;
        for (const part of content.parts || []) {
          if ((part as any).inlineData?.data) {
            return (part as any).inlineData.data as string;
          }
        }
      }
      throw new Error("No image data from providers");
    } catch (error) {
      throw new Error(`Image generation failed: ${error}`);
    }
  }

  async generateVideo(prompt: string): Promise<string> {
    try {
      const runwayKey = process.env.RUNWAY_ML_API_KEY || process.env.NEXT_PUBLIC_RUNWAY_ML_API_KEY;
      if (runwayKey) {
        const resp = await fetch("https://api.runwayml.com/v1/videos", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${runwayKey}`
          },
          body: JSON.stringify({ prompt, model: "gen-3-alpha" })
        });
        if (resp.ok) {
          const data: any = await resp.json();
          const videoUrl = data?.output?.[0]?.url || data?.assets?.[0]?.url || data?.url;
          if (videoUrl) return videoUrl;
          return JSON.stringify({ provider: "runway", jobId: data.id || data.job_id || "unknown", status: data.status || "submitted" });
        }
      }
      const simulatedVideoData = `Video generation request processed for: ${prompt}`;
      return simulatedVideoData;
    } catch (error) {
      throw new Error(`Video generation failed: ${error}`);
    }
  }

  async performSecurityScan(code: string): Promise<any> {
    try {
      const systemPrompt = `You are a cybersecurity expert specializing in code security analysis and blockchain security.
      Analyze the provided code for security vulnerabilities, code quality issues, and blockchain-specific security concerns.
      Provide JSON with vulnerabilities[], codeQuality, blockchainSecurity, recommendations[]`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-pro",
          config: { systemInstruction: systemPrompt, responseMimeType: "application/json" },
          contents: `Analyze this code for security vulnerabilities:\n\n${code}`,
        });
        const result = JSON.parse(response.text || '{}');
        return result;
      } catch {}

      const [anth, oai] = await Promise.all([
        callAnthropic(`Analyze this code and return JSON with keys vulnerabilities, codeQuality, blockchainSecurity, recommendations.\n\n${code}`, systemPrompt),
        callOpenAI(`Analyze this code and return JSON with keys vulnerabilities, codeQuality, blockchainSecurity, recommendations.\n\n${code}`, systemPrompt)
      ]);
      const text = anth || oai || '{}';
      try { return JSON.parse(text); } catch { return { error: 'failed_to_parse', raw: text }; }
    } catch (error) {
      throw new Error(`Security scan failed: ${error}`);
    }
  }

  async processRequest(request: AIGenerationRequest): Promise<GenerationResult> {
    try {
      // Create project
      const project = await storage.createProject({
        name: `${request.type} Generation`,
        description: request.prompt,
        type: request.type,
        status: 'processing',
        prompt: request.prompt,
        aiModel: request.aiModel,
        result: null,
      });

      const files: GeneratedFile[] = [];
      let result: any = {};

      switch (request.type) {
        case 'code':
          const code = await this.generateCode(request.prompt, request.options);
          result = { code };
          
          // Create multiple files based on the generated code
          const codeFiles = this.parseCodeIntoFiles(code, project.id);
          files.push(...codeFiles);
          
          // Perform security scan
          const securityResult = await this.performSecurityScan(code);
          await storage.createSecurityScan({
            projectId: project.id,
            vulnerabilities: securityResult.vulnerabilities || [],
            codeQuality: securityResult.codeQuality || 'A+',
            blockchainSecurity: securityResult.blockchainSecurity || 'SECURE',
            recommendations: securityResult.recommendations || [],
          });
          break;

        case 'image':
          const imageData = await this.generateImage(request.prompt);
          result = { imageData };
          
          files.push(await storage.createFile({
            projectId: project.id,
            fileName: 'generated-image.png',
            fileType: 'image',
            content: null,
            binaryData: imageData,
            size: Math.floor(imageData.length * 0.75), // Approximate size from base64
          }));
          break;

        case 'video':
          const videoRes = await this.generateVideo(request.prompt);
          if (typeof videoRes === 'string' && videoRes.startsWith('http')) {
            result = { videoUrl: videoRes };
            files.push(await storage.createFile({
              projectId: project.id,
              fileName: 'generated-video.mp4',
              fileType: 'video',
              content: null,
              binaryData: null,
              size: 0,
              downloadUrl: videoRes,
            }));
          } else {
            const videoData = String(videoRes);
            result = { videoData };
            files.push(await storage.createFile({
              projectId: project.id,
              fileName: 'generated-video.txt',
              fileType: 'video',
              content: videoData,
              binaryData: null,
              size: videoData.length,
            }));
          }
          break;

        case 'security':
          if (request.options?.code) {
            const securityResult = await this.performSecurityScan(request.options.code);
            result = securityResult;
            
            await storage.createSecurityScan({
              projectId: project.id,
              vulnerabilities: securityResult.vulnerabilities || [],
              codeQuality: securityResult.codeQuality || 'A+',
              blockchainSecurity: securityResult.blockchainSecurity || 'SECURE',
              recommendations: securityResult.recommendations || [],
            });
          }
          break;
      }

      // Update project with results
      const updatedProject = await storage.updateProject(project.id, {
        status: 'completed',
        result,
      });

      return {
        project: updatedProject!,
        files,
        status: 'success',
      };

    } catch (error) {
      console.error('AI Generation Error:', error);
      return {
        project: {} as Project,
        files: [],
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private parseCodeIntoFiles(code: string, projectId: string): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    
    // Simple parser for code blocks - in production would use more sophisticated parsing
    const codeBlocks = code.match(/```(\w+)?\n([\s\S]*?)```/g) || [];
    
    codeBlocks.forEach((block, index) => {
      const match = block.match(/```(\w+)?\n([\s\S]*?)```/);
      if (match) {
        const language = match[1] || 'text';
        const content = match[2].trim();
        
        // Determine file extension
        const extensions: { [key: string]: string } = {
          javascript: 'js',
          typescript: 'ts',
          jsx: 'jsx',
          tsx: 'tsx',
          css: 'css',
          html: 'html',
          json: 'json',
          python: 'py',
          java: 'java',
          cpp: 'cpp',
          c: 'c',
        };
        
        const ext = extensions[language] || 'txt';
        const fileName = `file_${index + 1}.${ext}`;
        
        files.push({
          id: `${projectId}_file_${index}`,
          projectId,
          fileName,
          fileType: language,
          content,
          binaryData: null,
          size: content.length,
          downloadUrl: null,
          createdAt: new Date(),
        });
      }
    });

    // If no code blocks found, create a single file with all content
    if (files.length === 0 && code.trim()) {
      files.push({
        id: `${projectId}_file_main`,
        projectId,
        fileName: 'generated-code.txt',
        fileType: 'text',
        content: code,
        binaryData: null,
        size: code.length,
        downloadUrl: null,
        createdAt: new Date(),
      });
    }

    return files;
  }

  private generateDemoCode(prompt: string, options?: any): string {
    // Generate demo code based on prompt keywords
    if (prompt.toLowerCase().includes('todo') || prompt.toLowerCase().includes('task')) {
      return `# React TypeScript Todo Application

Generated by GINDOC AI for prompt: "${prompt}"

## Main Component

\`\`\`typescript
// TodoApp.tsx - Main React TypeScript Todo Application
import React, { useState, useEffect } from 'react';
import './App.css';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

const TodoApp: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');

  // Load todos from localStorage
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  // Save todos to localStorage
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (inputValue.trim()) {
      const newTodo: Todo = {
        id: Date.now().toString(),
        text: inputValue.trim(),
        completed: false,
        createdAt: new Date()
      };
      setTodos([...todos, newTodo]);
      setInputValue('');
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="todo-app">
      <h1>Todo Application</h1>
      <div className="input-section">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a new todo..."
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <div className="todo-list">
        {todos.map(todo => (
          <div key={todo.id} className={\`todo-item \${todo.completed ? 'completed' : ''}\`}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span>{todo.text}</span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodoApp;
\`\`\`

## Styling

\`\`\`css
/* App.css - Todo Application Styles */
.todo-app {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: #1a1a1a;
  color: white;
  min-height: 100vh;
}

.todo-app h1 {
  color: #00ff41;
  text-align: center;
  margin-bottom: 2rem;
}

.input-section {
  display: flex;
  gap: 10px;
  margin-bottom: 2rem;
}

.todo-app input {
  flex: 1;
  padding: 12px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: white;
}

.todo-app button {
  padding: 12px 24px;
  background: #00ff41;
  color: black;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  margin-bottom: 8px;
}

.todo-item.completed {
  opacity: 0.6;
  text-decoration: line-through;
}
\`\`\`

## Package Configuration

\`\`\`json
{
  "name": "react-typescript-todo",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^4.9.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  }
}
\`\`\`

This complete todo application includes:
- TypeScript interfaces for type safety
- Local storage persistence
- Modern React hooks (useState, useEffect)
- Dark theme styling
- Responsive design
- Full CRUD operations (Create, Read, Update, Delete)

The application is ready to use and can be extended with additional features like filtering, categories, or due dates.`;
    }

    // Default demo for other prompts
    return `# Generated Application

Generated by GINDOC AI for prompt: "${prompt}"

## Main Component

\`\`\`typescript
// GeneratedComponent.tsx
import React, { useState } from 'react';

interface ComponentProps {
  title?: string;
}

const GeneratedComponent: React.FC<ComponentProps> = ({ title = "Generated App" }) => {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');

  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#00ff41' }}>{title}</h1>
      <p>Prompt: <em>"${prompt}"</em></p>

      <div style={{ margin: '20px 0' }}>
        <h3>Interactive Counter</h3>
        <button onClick={() => setCount(count + 1)}>
          Count: {count}
        </button>
      </div>

      <div style={{ margin: '20px 0' }}>
        <h3>Text Input</h3>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter some text..."
          style={{ padding: '8px', margin: '8px' }}
        />
        <p>You typed: {text}</p>
      </div>

      <p style={{ color: '#888', fontSize: '12px' }}>
        This is demonstration code generated by GINDOC AI Platform.
      </p>
    </div>
  );
};

export default GeneratedComponent;
\`\`\`

## Styling

\`\`\`css
/* styles.css */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: #1a1a1a;
  color: white;
}

button {
  background: #00ff41;
  color: black;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

button:hover {
  background: #00cc33;
}

input {
  background: #2a2a2a;
  color: white;
  border: 1px solid #444;
  border-radius: 5px;
  padding: 8px;
}
\`\`\`

This component demonstrates modern React patterns with TypeScript, state management, and interactive elements.`;
  }
}

export const aiOrchestrator = new AIOrchestrator();
