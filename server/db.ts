import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import {
  users,
  projects,
  generatedFiles,
  securityScans,
  downloads,
  type User,
  type InsertUser,
  type Project,
  type InsertProject,
  type GeneratedFile,
  type InsertFile,
  type SecurityScan,
  type InsertSecurityScan,
  type Download,
  type InsertDownload
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { IStorage } from "./storage";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10
});
export const db = drizzle(pool);

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Failed to get user');
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw new Error('Failed to get user by username');
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [newUser] = await db.insert(users).values(user).returning();
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  // Project methods
  async createProject(project: InsertProject): Promise<Project> {
    try {
      const [newProject] = await db.insert(projects).values({
        ...project,
        status: project.status || 'processing',
      }).returning();
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error('Failed to create project');
    }
  }

  async getProject(id: string): Promise<Project | undefined> {
    try {
      const [project] = await db.select().from(projects).where(eq(projects.id, id));
      return project;
    } catch (error) {
      console.error('Error getting project:', error);
      throw new Error('Failed to get project');
    }
  }

  async getProjects(): Promise<Project[]> {
    try {
      return await db.select().from(projects).orderBy(desc(projects.createdAt));
    } catch (error) {
      console.error('Error getting projects:', error);
      throw new Error('Failed to get projects');
    }
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  // File methods
  async createFile(file: InsertFile): Promise<GeneratedFile> {
    const [newFile] = await db.insert(generatedFiles).values(file).returning();
    return newFile;
  }

  async getFilesByProject(projectId: string): Promise<GeneratedFile[]> {
    return await db
      .select()
      .from(generatedFiles)
      .where(eq(generatedFiles.projectId, projectId));
  }

  async getFile(id: string): Promise<GeneratedFile | undefined> {
    const [file] = await db.select().from(generatedFiles).where(eq(generatedFiles.id, id));
    return file;
  }

  async updateFile(id: string, updates: Partial<GeneratedFile>): Promise<GeneratedFile> {
    const payload: any = { ...updates };
    if ('size' in payload && typeof payload.size !== 'number') delete payload.size;
    const [row] = await db
      .update(generatedFiles)
      .set(payload)
      .where(eq(generatedFiles.id, id))
      .returning();
    return row;
  }

  // Download history
  async createDownload(event: InsertDownload): Promise<Download> {
    const [row] = await db.insert(downloads).values(event).returning();
    return row;
  }

  async getDownloads(limit = 20): Promise<Download[]> {
    try {
      return await db
        .select()
        .from(downloads)
        .orderBy(desc(downloads.downloadedAt))
        .limit(limit);
    } catch (error: any) {
      const msg = typeof error?.message === 'string' ? error.message : '';
      if (msg.includes('relation "downloads" does not exist')) {
        return [];
      }
      console.error('Error getting downloads:', error);
      throw new Error('Failed to get downloads');
    }
  }

  // Security scan methods
  async createSecurityScan(scan: InsertSecurityScan): Promise<SecurityScan> {
    const [newScan] = await db.insert(securityScans).values({
      ...scan,
      vulnerabilities: scan.vulnerabilities || [],
      codeQuality: scan.codeQuality || 'A+',
      blockchainSecurity: scan.blockchainSecurity || 'SECURE',
      recommendations: scan.recommendations || [],
    }).returning();
    return newScan;
  }

  async getSecurityScanByProject(projectId: string): Promise<SecurityScan | undefined> {
    const [scan] = await db
      .select()
      .from(securityScans)
      .where(eq(securityScans.projectId, projectId));
    return scan;
  }
}
