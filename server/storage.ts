import { 
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  expenses, type Expense, type InsertExpense, type UpdateExpenseStatus,
  backups, type Backup, type InsertBackup,
  backupSettings, type BackupSettings, type UpdateBackupSettings 
} from "@shared/schema";
import { promises as fs } from 'fs';
import path from 'path';

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Expense methods
  getExpenses(): Promise<Expense[]>;
  getExpensesByUser(userId: number): Promise<Expense[]>;
  getExpensesByStatus(status: string): Promise<Expense[]>;
  getExpensesByCategory(category: string): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpenseStatus(id: number, update: UpdateExpenseStatus): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;
  
  // Backup methods
  getBackups(): Promise<Backup[]>;
  getLatestBackup(): Promise<Backup | undefined>;
  createBackup(backup: InsertBackup): Promise<Backup>;
  
  // Backup settings methods
  getBackupSettings(): Promise<BackupSettings>;
  updateBackupSettings(settings: UpdateBackupSettings): Promise<BackupSettings>;
  
  // Backup and recovery operations
  performBackup(type: string): Promise<Backup>;
  restoreFromBackup(backupId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private expenses: Map<number, Expense>;
  private backups: Map<number, Backup>;
  private backupSettings: BackupSettings;
  private currentUserId: number;
  private currentCategoryId: number;
  private currentExpenseId: number;
  private currentBackupId: number;
  private backupDir: string;
  
  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.expenses = new Map();
    this.backups = new Map();
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentExpenseId = 1;
    this.currentBackupId = 1;
    this.backupDir = path.join(process.cwd(), 'backups');
    
    // Initialize with default backup settings
    this.backupSettings = {
      id: 1,
      dailyBackup: true,
      weeklyBackup: true,
      monthlyBackup: true,
      backupTime: "02:00",
      retentionDays: 30
    };
    
    // Initialize with default categories
    this.initializeDefaultData();
  }
  
  private initializeDefaultData() {
    // Add default categories
    const defaultCategories: InsertCategory[] = [
      { name: 'Marketing', color: '#8b5cf6' },
      { name: 'Travel', color: '#f59e0b' },
      { name: 'Office Supplies', color: '#10b981' },
      { name: 'Client Entertainment', color: '#3b82f6' },
      { name: 'Software', color: '#0ea5e9' },
      { name: 'Administrative', color: '#6b7280' }
    ];
    
    defaultCategories.forEach(category => {
      this.createCategory(category);
    });
    
    // Add a default user
    this.createUser({
      username: 'agent',
      password: 'password',
      name: 'Michael Foster',
      role: 'agent'
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }
  
  // Expense methods
  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values());
  }
  
  async getExpensesByUser(userId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      (expense) => expense.userId === userId
    );
  }
  
  async getExpensesByStatus(status: string): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      (expense) => expense.status === status
    );
  }
  
  async getExpensesByCategory(category: string): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      (expense) => expense.category === category
    );
  }
  
  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }
  
  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.currentExpenseId++;
    const expense: Expense = { 
      ...insertExpense, 
      id,
      status: "pending",
      approvedById: undefined,
      approvedAt: undefined,
      rejectionReason: undefined
    };
    this.expenses.set(id, expense);
    return expense;
  }
  
  async updateExpenseStatus(id: number, update: UpdateExpenseStatus): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense) return undefined;
    
    const updatedExpense: Expense = {
      ...expense,
      status: update.status,
      approvedById: update.approvedById,
      approvedAt: update.status === 'approved' ? new Date() : expense.approvedAt,
      rejectionReason: update.rejectionReason
    };
    
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }
  
  async deleteExpense(id: number): Promise<boolean> {
    return this.expenses.delete(id);
  }
  
  // Backup methods
  async getBackups(): Promise<Backup[]> {
    return Array.from(this.backups.values());
  }
  
  async getLatestBackup(): Promise<Backup | undefined> {
    const backups = Array.from(this.backups.values());
    if (backups.length === 0) return undefined;
    
    return backups.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  }
  
  async createBackup(insertBackup: InsertBackup): Promise<Backup> {
    const id = this.currentBackupId++;
    const backup: Backup = { 
      ...insertBackup, 
      id,
      timestamp: new Date()
    };
    this.backups.set(id, backup);
    return backup;
  }
  
  // Backup settings methods
  async getBackupSettings(): Promise<BackupSettings> {
    return this.backupSettings;
  }
  
  async updateBackupSettings(settings: UpdateBackupSettings): Promise<BackupSettings> {
    this.backupSettings = {
      ...this.backupSettings,
      ...settings
    };
    return this.backupSettings;
  }
  
  // Backup and recovery operations
  async performBackup(type: string): Promise<Backup> {
    try {
      // Create backup directory if it doesn't exist
      try {
        await fs.mkdir(this.backupDir, { recursive: true });
      } catch (err) {
        console.error('Error creating backup directory:', err);
      }
      
      // Prepare backup data
      const backupData = {
        users: Array.from(this.users.values()),
        categories: Array.from(this.categories.values()),
        expenses: Array.from(this.expenses.values()),
        timestamp: new Date().toISOString()
      };
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${type}-${timestamp}.json`;
      const filePath = path.join(this.backupDir, filename);
      
      // Write backup file
      await fs.writeFile(filePath, JSON.stringify(backupData, null, 2), 'utf8');
      
      // Get file size
      const stats = await fs.stat(filePath);
      const size = stats.size;
      
      // Create backup record
      return await this.createBackup({
        filename,
        size,
        status: 'completed',
        type
      });
    } catch (error) {
      console.error('Backup error:', error);
      
      // Create failed backup record
      return await this.createBackup({
        filename: `failed-backup-${type}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
        size: 0,
        status: 'failed',
        type
      });
    }
  }
  
  async restoreFromBackup(backupId: number): Promise<boolean> {
    try {
      const backup = await this.getBackup(backupId);
      if (!backup) return false;
      
      const filePath = path.join(this.backupDir, backup.filename);
      
      // Read backup file
      const backupDataStr = await fs.readFile(filePath, 'utf8');
      const backupData = JSON.parse(backupDataStr);
      
      // Restore data
      this.users.clear();
      this.categories.clear();
      this.expenses.clear();
      
      backupData.users.forEach((user: User) => {
        this.users.set(user.id, user);
      });
      
      backupData.categories.forEach((category: Category) => {
        this.categories.set(category.id, category);
      });
      
      backupData.expenses.forEach((expense: Expense) => {
        this.expenses.set(expense.id, expense);
      });
      
      // Update current IDs
      this.currentUserId = Math.max(...backupData.users.map((u: User) => u.id)) + 1;
      this.currentCategoryId = Math.max(...backupData.categories.map((c: Category) => c.id)) + 1;
      this.currentExpenseId = Math.max(...backupData.expenses.map((e: Expense) => e.id)) + 1;
      
      return true;
    } catch (error) {
      console.error('Restore error:', error);
      return false;
    }
  }
  
  private async getBackup(id: number): Promise<Backup | undefined> {
    return this.backups.get(id);
  }
}

export const storage = new MemStorage();
