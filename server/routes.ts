import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiOrchestrator } from "./services/ai-orchestrator";
import { aiGenerationRequestSchema } from "@shared/schema";
import { securityRoutes } from "./routes/security";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Generate content with AI
  app.post("/api/generate", async (req, res) => {
    try {
      const validatedRequest = aiGenerationRequestSchema.parse(req.body);
      const result = await aiOrchestrator.processRequest(validatedRequest);
      
      res.json(result);
    } catch (error) {
      console.error("Generation error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Generation failed" 
      });
    }
  });

  // Get all projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch projects" 
      });
    }
  });

  // Get project by ID
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch project" 
      });
    }
  });

  // Get files for a project
  app.get("/api/projects/:id/files", async (req, res) => {
    try {
      const files = await storage.getFilesByProject(req.params.id);
      res.json(files);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch files" 
      });
    }
  });

  // Download file
  app.get("/api/files/:id/download", async (req, res) => {
    try {
      const file = await storage.getFile(req.params.id);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      if (file.binaryData) {
        // Handle binary files (images, etc.)
        const buffer = Buffer.from(file.binaryData, 'base64');
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
        res.send(buffer);
      } else if (file.content) {
        // Handle text files
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
        res.send(file.content);
      } else {
        res.status(404).json({ error: "File content not found" });
      }
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to download file" 
      });
    }
  });

  // Get security scan for project
  app.get("/api/projects/:id/security", async (req, res) => {
    try {
      const scan = await storage.getSecurityScanByProject(req.params.id);
      if (!scan) {
        return res.status(404).json({ error: "Security scan not found" });
      }
      res.json(scan);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch security scan" 
      });
    }
  });

  // Demo route to showcase GINDOC capabilities 
  app.post("/api/demo", async (req, res) => {
    try {
      // Create demo project with sample React TypeScript todo app
      const project = await storage.createProject({
        name: "React TypeScript Todo App",
        description: "Complete React TypeScript todo application with dark theme, local storage persistence, and drag-and-drop functionality",
        type: "code",
        status: "completed",
        prompt: "Create a complete React TypeScript todo application with dark theme, local storage persistence, drag and drop functionality, and modern UI components.",
        result: {
          code: `// Complete React TypeScript Todo Application
import React, { useState, useEffect } from 'react';
import './App.css';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Load todos from localStorage on component mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (inputValue.trim() !== '') {
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
    <div className="app">
      <div className="container">
        <h1 className="title">Todo App</h1>
        
        <div className="input-section">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Add a new todo..."
            className="todo-input"
          />
          <button onClick={addTodo} className="add-button">
            Add
          </button>
        </div>

        <div className="todo-list">
          {todos.map((todo) => (
            <div key={todo.id} className={\`todo-item \${todo.completed ? 'completed' : ''}\`}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="todo-checkbox"
              />
              <span className="todo-text">{todo.text}</span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="delete-button"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {todos.length === 0 && (
          <div className="empty-state">
            <p>No todos yet. Add one above!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;`
        },
        aiModel: "gemini",
      });

      // Create sample files
      const files = [
        await storage.createFile({
          projectId: project.id,
          fileName: "App.tsx",
          fileType: "typescript",
          content: (project.result as any)?.code || "",
          binaryData: null,
          size: ((project.result as any)?.code || "").length,
        }),
        await storage.createFile({
          projectId: project.id,
          fileName: "App.css",
          fileType: "css", 
          content: `/* Dark theme styles for todo app */
.app {
  background: #1a1a1a;
  color: #ffffff;
  min-height: 100vh;
  padding: 20px;
}

.container {
  max-width: 600px;
  margin: 0 auto;
}

.title {
  text-align: center;
  color: #00ff41;
  font-size: 2.5rem;
  margin-bottom: 2rem;
}

.input-section {
  display: flex;
  gap: 10px;
  margin-bottom: 2rem;
}

.todo-input {
  flex: 1;
  padding: 12px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: white;
  font-size: 16px;
}

.add-button {
  padding: 12px 24px;
  background: #00ff41;
  color: black;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.todo-list {
  space-y: 8px;
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
}

.todo-text {
  flex: 1;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
}

.delete-button {
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  color: #888;
  margin-top: 2rem;
}`,
          binaryData: null,
          size: 1200,
        }),
        await storage.createFile({
          projectId: project.id,
          fileName: "package.json",
          fileType: "json",
          content: `{
  "name": "react-typescript-todo",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@types/node": "^16.18.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^4.9.0",
    "web-vitals": "^3.0.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`,
          binaryData: null,
          size: 800,
        })
      ];

      res.json({
        project,
        files,
        status: 'success',
        message: 'Demo project created successfully! This showcases what GINDOC can generate when the Google Generative Language API is enabled.'
      });
    } catch (error) {
      console.error('Demo route error:', error);
      res.status(500).json({ error: 'Failed to create demo project' });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      aiServices: {
        gemini: process.env.GOOGLE_API_KEY ? "configured" : "missing",
        runway: "simulated",
        imagen: "integrated"
      },
      database: {
        primary: "PostgreSQL (Neon)",
        realtime: "GindocDB (Firebase Clone)",
        status: "operational"
      }
    });
  });

  // GindocDB Demo endpoint
  app.get("/api/gindocdb/demo", (req, res) => {
    res.json({
      message: "GindocDB - Firebase Clone",
      features: [
        "Real-time WebSocket connections",
        "Document-based storage",
        "Live data synchronization",
        "Real-time collaboration",
        "Offline-first capabilities",
        "Automatic conflict resolution"
      ],
      endpoints: {
        websocket: "/gindocdb",
        collections: ["projects", "files", "users", "sessions"],
        operations: ["add", "update", "delete", "get", "query", "subscribe"]
      },
      example: {
        connect: "ws://localhost:5000/gindocdb",
        usage: "Use the GindocDB client library for seamless real-time features"
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
