import { type User, type InsertUser, type Project, type InsertProject, type GeneratedFile, type InsertFile, type SecurityScan, type InsertSecurityScan } from "@shared/schema";
import { DatabaseStorage } from "./db";

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

  // Download history
  createDownload(event: InsertDownload): Promise<Download>;
  getDownloads(limit?: number): Promise<Download[]>;

  // Security scan methods
  createSecurityScan(scan: InsertSecurityScan): Promise<SecurityScan>;
  getSecurityScanByProject(projectId: string): Promise<SecurityScan | undefined>;
}

// Use database storage for actual persistence
export const storage = new DatabaseStorage();
