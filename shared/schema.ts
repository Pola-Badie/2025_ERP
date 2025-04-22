import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  role: text("role").default("agent"),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default('#3b82f6'),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  amount: doublePrecision("amount").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  notes: text("notes"),
  receiptPath: text("receipt_path"),
  status: text("status").notNull().default("pending"),
  approvedById: integer("approved_by_id"),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
});

export const backups = pgTable("backups", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  filename: text("filename").notNull(),
  size: integer("size").notNull(),
  status: text("status").notNull(),
  type: text("type").notNull(), // daily, weekly, monthly
});

export const backupSettings = pgTable("backup_settings", {
  id: serial("id").primaryKey(),
  dailyBackup: boolean("daily_backup").notNull().default(true),
  weeklyBackup: boolean("weekly_backup").notNull().default(true),
  monthlyBackup: boolean("monthly_backup").notNull().default(true),
  backupTime: text("backup_time").notNull().default("02:00"), // 24-hour format
  retentionDays: integer("retention_days").notNull().default(30),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  color: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  userId: true,
  date: true,
  amount: true,
  description: true,
  category: true,
  notes: true,
  receiptPath: true,
});

export const updateExpenseStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  approvedById: z.number().optional(),
  rejectionReason: z.string().optional(),
});

export const insertBackupSchema = createInsertSchema(backups).pick({
  filename: true,
  size: true,
  status: true,
  type: true,
});

export const updateBackupSettingsSchema = createInsertSchema(backupSettings).pick({
  dailyBackup: true,
  weeklyBackup: true,
  monthlyBackup: true,
  backupTime: true,
  retentionDays: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
export type UpdateExpenseStatus = z.infer<typeof updateExpenseStatusSchema>;

export type InsertBackup = z.infer<typeof insertBackupSchema>;
export type Backup = typeof backups.$inferSelect;

export type UpdateBackupSettings = z.infer<typeof updateBackupSettingsSchema>;
export type BackupSettings = typeof backupSettings.$inferSelect;
