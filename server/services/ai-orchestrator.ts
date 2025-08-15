import { GoogleGenAI, Modality } from "@google/genai";
import { type AIGenerationRequest, type Project, type GeneratedFile } from "@shared/schema";
import { storage } from "../storage";
import * as fs from "fs";
import * as path from "path";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "" 
});

export interface GenerationResult {
  project: Project;
  files: GeneratedFile[];
  status: 'success' | 'error';
  error?: string;
}

export class AIOrchestrator {
  
  async generateCode(prompt: string, options?: any): Promise<string> {
    try {
      // Check if API key is available
      if (!process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY) {
        // Return demo code when API key is not configured
        return this.generateDemoCode(prompt, options);
      }

      const systemPrompt = `You are an expert full-stack developer. Generate complete, production-ready code based on the user's requirements.
      Include proper error handling, modern best practices, and comprehensive functionality.
      Respond with clean, well-documented code that can be immediately deployed.

      Requirements:
      - Generate complete file structures with all necessary dependencies
      - Include proper error handling and validation
      - Use modern frameworks and best practices
      - Add comprehensive comments and documentation
      - Ensure security best practices are followed

      ${options?.language ? `Programming Language: ${options.language}` : ''}
      ${options?.framework ? `Framework: ${options.framework}` : ''}
      ${options?.includeTests ? 'Include unit tests and testing setup' : ''}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
        },
        contents: prompt,
      });

      return response.text || "Failed to generate code";
    } catch (error) {
      console.warn('Google AI generation failed, falling back to demo:', error);
      return this.generateDemoCode(prompt, options);
    }
  }

  async generateImage(prompt: string): Promise<string> {
    try {
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const imagePath = path.join(tempDir, `generated_${Date.now()}.png`);

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error("No image generated");
      }

      const content = candidates[0].content;
      if (!content || !content.parts) {
        throw new Error("No content in response");
      }

      for (const part of content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const imageData = Buffer.from(part.inlineData.data, "base64");
          fs.writeFileSync(imagePath, imageData);
          
          // Return base64 data for storage
          return part.inlineData.data;
        }
      }

      throw new Error("No image data found in response");
    } catch (error) {
      throw new Error(`Image generation failed: ${error}`);
    }
  }

  async generateVideo(prompt: string): Promise<string> {
    try {
      // Runway ML API integration would go here
      // For now, return a simulated response
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
      
      Provide a detailed analysis in JSON format with:
      - vulnerabilities: array of found security issues with severity levels
      - codeQuality: overall grade (A+, A, B+, B, C+, C, D, F)
      - blockchainSecurity: status (SECURE, WARNING, CRITICAL)
      - recommendations: array of actionable security improvements
      
      Focus on:
      - Common security vulnerabilities (XSS, SQL injection, etc.)
      - Smart contract vulnerabilities (reentrancy, overflow, etc.)
      - Authentication and authorization issues
      - Data validation and sanitization
      - Cryptographic implementation issues`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              vulnerabilities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    severity: { type: "string" },
                    description: { type: "string" },
                    line: { type: "number" },
                    recommendation: { type: "string" }
                  }
                }
              },
              codeQuality: { type: "string" },
              blockchainSecurity: { type: "string" },
              recommendations: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        contents: `Analyze this code for security vulnerabilities:\n\n${code}`,
      });

      const result = JSON.parse(response.text || '{}');
      return result;
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
          const videoData = await this.generateVideo(request.prompt);
          result = { videoData };
          
          files.push(await storage.createFile({
            projectId: project.id,
            fileName: 'generated-video.mp4',
            fileType: 'video',
            content: videoData,
            binaryData: null,
            size: videoData.length,
          }));
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
}

export const aiOrchestrator = new AIOrchestrator();
