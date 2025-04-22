import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertExpenseSchema, 
  updateExpenseStatusSchema,
  updateBackupSettingsSchema
} from "@shared/schema";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import * as cron from "node-cron";

// Set up multer for receipt uploads
const uploadsDir = path.join(process.cwd(), "uploads");
try {
  fs.mkdir(uploadsDir, { recursive: true });
} catch (err) {
  console.error("Error creating uploads directory:", err);
}

const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "application/pdf"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG, PNG, and PDF are allowed."));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Schedule automatic backups
  setupAutomaticBackups();

  // Get all categories
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get all expenses
  app.get("/api/expenses", async (req: Request, res: Response) => {
    try {
      let expenses;
      const { userId, status, category } = req.query;
      
      if (userId) {
        expenses = await storage.getExpensesByUser(Number(userId));
      } else if (status) {
        expenses = await storage.getExpensesByStatus(status as string);
      } else if (category) {
        expenses = await storage.getExpensesByCategory(category as string);
      } else {
        expenses = await storage.getExpenses();
      }
      
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  // Get expense by ID
  app.get("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const expense = await storage.getExpense(id);
      
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expense" });
    }
  });

  // Create new expense with receipt upload
  app.post("/api/expenses", upload.single("receipt"), async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertExpenseSchema.parse({
        ...req.body,
        userId: Number(req.body.userId),
        amount: Number(req.body.amount),
        date: new Date(req.body.date)
      });
      
      // Add receipt path if uploaded
      if (req.file) {
        validatedData.receiptPath = req.file.path;
      }
      
      const expense = await storage.createExpense(validatedData);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  // Update expense status (approve/reject)
  app.patch("/api/expenses/:id/status", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const validatedData = updateExpenseStatusSchema.parse(req.body);
      
      const updatedExpense = await storage.updateExpenseStatus(id, validatedData);
      
      if (!updatedExpense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.json(updatedExpense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid status data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update expense status" });
    }
  });

  // Delete expense
  app.delete("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteExpense(id);
      
      if (!success) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Get all backups
  app.get("/api/backups", async (req: Request, res: Response) => {
    try {
      const backups = await storage.getBackups();
      res.json(backups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch backups" });
    }
  });

  // Get latest backup
  app.get("/api/backups/latest", async (req: Request, res: Response) => {
    try {
      const backup = await storage.getLatestBackup();
      
      if (!backup) {
        return res.status(404).json({ message: "No backups found" });
      }
      
      res.json(backup);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch latest backup" });
    }
  });

  // Create manual backup
  app.post("/api/backups", async (req: Request, res: Response) => {
    try {
      const { type = "manual" } = req.body;
      const backup = await storage.performBackup(type);
      res.status(201).json(backup);
    } catch (error) {
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  // Restore from backup
  app.post("/api/backups/:id/restore", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.restoreFromBackup(id);
      
      if (!success) {
        return res.status(400).json({ message: "Failed to restore from backup" });
      }
      
      res.json({ message: "Successfully restored from backup" });
    } catch (error) {
      res.status(500).json({ message: "Failed to restore from backup" });
    }
  });

  // Get backup settings
  app.get("/api/backup-settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getBackupSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch backup settings" });
    }
  });

  // Update backup settings
  app.patch("/api/backup-settings", async (req: Request, res: Response) => {
    try {
      const validatedData = updateBackupSettingsSchema.parse(req.body);
      const updatedSettings = await storage.updateBackupSettings(validatedData);
      
      // Reconfigure automatic backups after settings update
      setupAutomaticBackups();
      
      res.json(updatedSettings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update backup settings" });
    }
  });

  return httpServer;
}

// Function to setup automatic backups
async function setupAutomaticBackups() {
  try {
    // Get current settings
    const settings = await storage.getBackupSettings();
    
    // Cancel any existing backup jobs
    for (const job of Object.values(cronJobs)) {
      if (job) job.stop();
    }
    
    // Set up daily backup if enabled
    if (settings.dailyBackup) {
      const [hour, minute] = settings.backupTime.split(':');
      cronJobs.daily = cron.schedule(`${minute} ${hour} * * *`, async () => {
        await storage.performBackup('daily');
        console.log('Daily backup completed');
      });
    }
    
    // Set up weekly backup if enabled
    if (settings.weeklyBackup) {
      const [hour, minute] = settings.backupTime.split(':');
      cronJobs.weekly = cron.schedule(`${minute} ${hour} * * 0`, async () => {
        await storage.performBackup('weekly');
        console.log('Weekly backup completed');
      });
    }
    
    // Set up monthly backup if enabled
    if (settings.monthlyBackup) {
      const [hour, minute] = settings.backupTime.split(':');
      cronJobs.monthly = cron.schedule(`${minute} ${hour} 1 * *`, async () => {
        await storage.performBackup('monthly');
        console.log('Monthly backup completed');
      });
    }
  } catch (error) {
    console.error('Failed to setup automatic backups:', error);
  }
}

// Store cron jobs so they can be stopped/updated
const cronJobs: Record<string, cron.ScheduledTask | null> = {
  daily: null,
  weekly: null,
  monthly: null
};
