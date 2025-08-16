import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import {
  users,
  projects,
  generatedFiles,
  securityScans,
  type User,
  type InsertUser,
  type Project,
  type InsertProject,
  type GeneratedFile,
  type InsertFile,
  type SecurityScan,
  type InsertSecurityScan
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
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Project methods
  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values({
      ...project,
      status: project.status || 'processing',
    }).returning();
    return newProject;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
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
