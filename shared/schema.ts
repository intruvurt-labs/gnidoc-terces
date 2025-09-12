import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'code', 'image', 'video', 'security'
  status: text("status").notNull().default('processing'), // 'processing', 'completed', 'failed'
  prompt: text("prompt").notNull(),
  result: jsonb("result"), // Generated content and metadata
  aiModel: text("ai_model").notNull(), // 'gemini', 'runway', 'imagen'
  createdAt: timestamp("created_at").defaultNow(),
  userId: varchar("user_id"),
});

export const generatedFiles = pgTable("generated_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // 'javascript', 'typescript', 'css', 'html', 'image', 'video'
  content: text("content"), // For text files
  binaryData: text("binary_data"), // Base64 encoded for binary files
  size: integer("size").notNull().default(0),
  downloadUrl: text("download_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const securityScans = pgTable("security_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  vulnerabilities: jsonb("vulnerabilities").default([]),
  codeQuality: text("code_quality").default('A+'),
  blockchainSecurity: text("blockchain_security").default('SECURE'),
  recommendations: jsonb("recommendations").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const downloads = pgTable("downloads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileId: varchar("file_id").notNull(),
  projectId: varchar("project_id").notNull(),
  fileName: text("file_name").notNull(),
  size: integer("size").default(0),
  downloadUrl: text("download_url"),
  downloadedAt: timestamp("downloaded_at").defaultNow(),
});

// Insert schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export const insertFileSchema = createInsertSchema(generatedFiles).omit({
  id: true,
  createdAt: true,
});

export const insertSecurityScanSchema = createInsertSchema(securityScans).omit({
  id: true,
  createdAt: true,
});

export const insertDownloadSchema = createInsertSchema(downloads).omit({
  id: true,
  downloadedAt: true,
});

// Types
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type GeneratedFile = typeof generatedFiles.$inferSelect;
export type InsertSecurityScan = z.infer<typeof insertSecurityScanSchema>;
export type SecurityScan = typeof securityScans.$inferSelect;
export type InsertDownload = z.infer<typeof insertDownloadSchema>;
export type Download = typeof downloads.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// AI Generation Request Types
export const aiGenerationRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  type: z.enum(['code', 'image', 'video', 'security']),
  aiModel: z.enum(['gemini', 'runway', 'imagen']),
  options: z.object({
    language: z.string().optional(),
    framework: z.string().optional(),
    includeTests: z.boolean().optional(),
    stylePreferences: z.string().optional(),
    code: z.string().optional(), // For security scans
    files: z.array(z.object({
      name: z.string(),
      content: z.string(),
      type: z.string()
    })).optional(), // For file uploads
  }).optional(),
});

export type AIGenerationRequest = z.infer<typeof aiGenerationRequestSchema>;
