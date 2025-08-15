import { type User, type InsertUser, type Project, type InsertProject, type GeneratedFile, type InsertFile, type SecurityScan, type InsertSecurityScan } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project methods
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: string): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined>;
  
  // File methods
  createFile(file: InsertFile): Promise<GeneratedFile>;
  getFilesByProject(projectId: string): Promise<GeneratedFile[]>;
  getFile(id: string): Promise<GeneratedFile | undefined>;
  
  // Security scan methods
  createSecurityScan(scan: InsertSecurityScan): Promise<SecurityScan>;
  getSecurityScanByProject(projectId: string): Promise<SecurityScan | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private files: Map<string, GeneratedFile>;
  private securityScans: Map<string, SecurityScan>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.files = new Map();
    this.securityScans = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      ...insertProject,
      id,
      createdAt: new Date(),
      userId: null,
      status: insertProject.status || 'processing',
      result: insertProject.result || null,
      description: insertProject.description || null,
    };
    this.projects.set(id, project);
    return project;
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const existing = this.projects.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.projects.set(id, updated);
    return updated;
  }

  async createFile(insertFile: InsertFile): Promise<GeneratedFile> {
    const id = randomUUID();
    const file: GeneratedFile = {
      ...insertFile,
      id,
      createdAt: new Date(),
      content: insertFile.content || null,
      binaryData: insertFile.binaryData || null,
      size: insertFile.size || 0,
      downloadUrl: insertFile.downloadUrl || null,
    };
    this.files.set(id, file);
    return file;
  }

  async getFilesByProject(projectId: string): Promise<GeneratedFile[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.projectId === projectId
    );
  }

  async getFile(id: string): Promise<GeneratedFile | undefined> {
    return this.files.get(id);
  }

  async createSecurityScan(insertScan: InsertSecurityScan): Promise<SecurityScan> {
    const id = randomUUID();
    const scan: SecurityScan = {
      ...insertScan,
      id,
      createdAt: new Date(),
      vulnerabilities: insertScan.vulnerabilities || [],
      codeQuality: insertScan.codeQuality || 'A+',
      blockchainSecurity: insertScan.blockchainSecurity || 'SECURE',
      recommendations: insertScan.recommendations || [],
    };
    this.securityScans.set(id, scan);
    return scan;
  }

  async getSecurityScanByProject(projectId: string): Promise<SecurityScan | undefined> {
    return Array.from(this.securityScans.values()).find(
      (scan) => scan.projectId === projectId
    );
  }
}

export const storage = new MemStorage();
