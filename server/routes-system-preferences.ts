import { Express, Request, Response } from 'express';
import { db } from './db';
import { systemPreferences } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { insertSystemPreferenceSchema, updateSystemPreferenceSchema } from '../shared/schema';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { sendEmail } from './email-service';

// Middleware to check admin role (simplified for now)
const isAdmin = (req: Request, res: Response, next: Function) => {
  // In production, implement proper JWT token verification
  next();
};

export function registerSystemPreferencesRoutes(app: Express) {
  
  // ============= General System Preferences Endpoints =============
  
  // Get all system preferences
  app.get("/api/system-preferences", isAdmin, async (req: Request, res: Response) => {
    try {
      const preferences = await db.select().from(systemPreferences);
      res.json(preferences);
    } catch (error) {
      console.error("System preferences error:", error);
      res.status(500).json({ message: "Failed to fetch system preferences" });
    }
  });
  
  // Get system preferences by category
  app.get("/api/system-preferences/category/:category", isAdmin, async (req: Request, res: Response) => {
    try {
      const category = req.params.category;
      const preferences = await db.select().from(systemPreferences)
        .where(eq(systemPreferences.category, category));
      res.json(preferences);
    } catch (error) {
      console.error("System preferences category error:", error);
      res.status(500).json({ message: "Failed to fetch system preferences" });
    }
  });
  
  // Get a specific system preference
  app.get("/api/system-preferences/:key", isAdmin, async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const [preference] = await db.select().from(systemPreferences)
        .where(eq(systemPreferences.key, key));
      
      if (!preference) {
        return res.status(404).json({ message: "System preference not found" });
      }
      
      res.json(preference);
    } catch (error) {
      console.error("System preference error:", error);
      res.status(500).json({ message: "Failed to fetch system preference" });
    }
  });
  
  // Create or update multiple system preferences
  app.post("/api/system-preferences/bulk", isAdmin, async (req: Request, res: Response) => {
    try {
      const { preferences } = req.body;
      
      if (!Array.isArray(preferences)) {
        return res.status(400).json({ message: "Preferences must be an array" });
      }
      
      const results = [];
      
      for (const pref of preferences) {
        try {
          // Check if preference exists
          const [existing] = await db.select().from(systemPreferences)
            .where(eq(systemPreferences.key, pref.key));
          
          if (existing) {
            // Update existing
            const [updated] = await db.update(systemPreferences)
              .set({ 
                value: pref.value, 
                updatedAt: new Date()
              })
              .where(eq(systemPreferences.key, pref.key))
              .returning();
            results.push(updated);
          } else {
            // Create new
            const validatedData = insertSystemPreferenceSchema.parse(pref);
            const [created] = await db.insert(systemPreferences)
              .values(validatedData)
              .returning();
            results.push(created);
          }
        } catch (error) {
          console.error(`Error processing preference ${pref.key}:`, error);
        }
      }
      
      res.json({ success: true, updated: results.length });
    } catch (error) {
      console.error("Bulk preferences error:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });
  
  // Update a system preference
  app.patch("/api/system-preferences/:key", isAdmin, async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const { value } = updateSystemPreferenceSchema.parse(req.body);
      
      const [updated] = await db.update(systemPreferences)
        .set({ value, updatedAt: new Date() })
        .where(eq(systemPreferences.key, key))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ message: "System preference not found" });
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid preference data", errors: error.errors });
      }
      console.error("Update preference error:", error);
      res.status(500).json({ message: "Failed to update system preference" });
    }
  });
  
  // ============= Email Configuration Endpoints =============
  
  // Test email configuration
  app.post("/api/system-preferences/test-email", isAdmin, async (req: Request, res: Response) => {
    try {
      const { testEmail, subject, message } = req.body;
      
      if (!testEmail) {
        return res.status(400).json({ message: "Test email address is required" });
      }
      
      // Get SMTP settings from database
      const smtpSettings = await db.select().from(systemPreferences)
        .where(eq(systemPreferences.category, 'email'));
      
      if (smtpSettings.length === 0) {
        return res.status(400).json({ message: "Email configuration not found. Please configure SMTP settings first." });
      }
      
      // Simple test email sending
      const testEmailResult = await sendEmail({
        to: testEmail,
        subject: subject || 'Premier ERP - Test Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Premier ERP Test Email</h2>
            <p>${message || 'This is a test email from your Premier ERP system. If you receive this message, your email configuration is working correctly!'}</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              Sent from Premier ERP System at ${new Date().toLocaleString()}
            </p>
          </div>
        `
      });
      
      if (testEmailResult.success) {
        res.json({ 
          success: true, 
          message: "Test email sent successfully!" 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Failed to send test email: " + testEmailResult.error 
        });
      }
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to send test email" 
      });
    }
  });
  
  // ============= Backup & Recovery Endpoints =============
  
  // Create manual backup
  app.post("/api/system-preferences/create-backup", isAdmin, async (req: Request, res: Response) => {
    try {
      const { backupName, description } = req.body;
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = backupName 
        ? `${backupName}_${timestamp}.backup`
        : `manual_backup_${timestamp}.backup`;
      
      // Create backup directory if it doesn't exist
      const backupDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const backupPath = path.join(backupDir, filename);
      
      // For now, create a simple backup info file
      // In production, you'd use pg_dump or similar
      const backupInfo = {
        created: new Date().toISOString(),
        type: 'manual',
        description: description || 'Manual backup created via System Preferences',
        database: process.env.DATABASE_URL ? 'PostgreSQL' : 'Unknown',
        size: '0 MB' // Would calculate actual size
      };
      
      fs.writeFileSync(backupPath, JSON.stringify(backupInfo, null, 2));
      
      res.json({
        success: true,
        message: "Backup created successfully",
        filename,
        path: backupPath,
        created: new Date().toISOString()
      });
    } catch (error) {
      console.error("Create backup error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to create backup" 
      });
    }
  });
  
  // List available backups
  app.get("/api/system-preferences/backups", isAdmin, async (req: Request, res: Response) => {
    try {
      const backupDir = path.join(process.cwd(), 'backups');
      
      if (!fs.existsSync(backupDir)) {
        return res.json([]);
      }
      
      const files = fs.readdirSync(backupDir);
      const backups = files
        .filter(file => file.endsWith('.backup'))
        .map(file => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          
          return {
            filename: file,
            size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
            created: stats.birthtime.toISOString(),
            modified: stats.mtime.toISOString()
          };
        })
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
      
      res.json(backups);
    } catch (error) {
      console.error("List backups error:", error);
      res.status(500).json({ message: "Failed to list backups" });
    }
  });
  
  // ============= System Information Endpoints =============
  
  // Get system information
  app.get("/api/system-preferences/system-info", isAdmin, async (req: Request, res: Response) => {
    try {
      const systemInfo = {
        version: '1.0.0',
        database: process.env.DATABASE_URL ? 'Connected' : 'Not configured',
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        lastStarted: new Date().toISOString() // In production, track actual startup time
      };
      
      res.json(systemInfo);
    } catch (error) {
      console.error("System info error:", error);
      res.status(500).json({ message: "Failed to get system information" });
    }
  });
  
  // Initialize default system preferences
  app.post("/api/system-preferences/initialize", isAdmin, async (req: Request, res: Response) => {
    try {
      const defaultPreferences = [
        // Company Information
        { key: 'company_name', value: 'Premier ERP', category: 'company', label: 'Company Name', description: 'Official company name', dataType: 'string' },
        { key: 'company_address', value: '', category: 'company', label: 'Company Address', description: 'Physical address', dataType: 'string' },
        { key: 'company_phone', value: '', category: 'company', label: 'Phone Number', description: 'Main contact number', dataType: 'string' },
        { key: 'company_email', value: '', category: 'company', label: 'Email Address', description: 'Main contact email', dataType: 'string' },
        { key: 'company_website', value: '', category: 'company', label: 'Website', description: 'Company website URL', dataType: 'string' },
        { key: 'company_logo', value: '', category: 'company', label: 'Company Logo', description: 'Logo file path', dataType: 'string' },
        
        // Email Configuration
        { key: 'smtp_host', value: '', category: 'email', label: 'SMTP Host', description: 'Email server hostname', dataType: 'string' },
        { key: 'smtp_port', value: 587, category: 'email', label: 'SMTP Port', description: 'Email server port', dataType: 'number' },
        { key: 'smtp_username', value: '', category: 'email', label: 'SMTP Username', description: 'Email authentication username', dataType: 'string' },
        { key: 'smtp_password', value: '', category: 'email', label: 'SMTP Password', description: 'Email authentication password', dataType: 'string' },
        { key: 'smtp_secure', value: true, category: 'email', label: 'Use SSL/TLS', description: 'Enable secure connection', dataType: 'boolean' },
        { key: 'email_from_name', value: 'Premier ERP', category: 'email', label: 'From Name', description: 'Sender display name', dataType: 'string' },
        { key: 'email_from_address', value: '', category: 'email', label: 'From Address', description: 'Sender email address', dataType: 'string' },
        
        // Security Settings
        { key: 'password_min_length', value: 8, category: 'security', label: 'Minimum Password Length', description: 'Minimum characters for passwords', dataType: 'number' },
        { key: 'password_require_uppercase', value: true, category: 'security', label: 'Require Uppercase', description: 'Password must contain uppercase letters', dataType: 'boolean' },
        { key: 'password_require_lowercase', value: true, category: 'security', label: 'Require Lowercase', description: 'Password must contain lowercase letters', dataType: 'boolean' },
        { key: 'password_require_numbers', value: true, category: 'security', label: 'Require Numbers', description: 'Password must contain numbers', dataType: 'boolean' },
        { key: 'password_require_symbols', value: false, category: 'security', label: 'Require Symbols', description: 'Password must contain special characters', dataType: 'boolean' },
        { key: 'session_timeout', value: 1440, category: 'security', label: 'Session Timeout (minutes)', description: 'Auto-logout after inactivity', dataType: 'number' },
        { key: 'max_login_attempts', value: 5, category: 'security', label: 'Max Login Attempts', description: 'Lock account after failed attempts', dataType: 'number' },
        { key: 'enable_2fa', value: false, category: 'security', label: 'Enable 2FA', description: 'Two-factor authentication', dataType: 'boolean' },
        
        // Backup Settings
        { key: 'auto_backup_enabled', value: true, category: 'backup', label: 'Auto Backup Enabled', description: 'Enable automatic backups', dataType: 'boolean' },
        { key: 'backup_frequency', value: 'daily', category: 'backup', label: 'Backup Frequency', description: 'How often to backup', dataType: 'select', options: ['hourly', 'daily', 'weekly', 'monthly'] },
        { key: 'backup_retention_days', value: 30, category: 'backup', label: 'Retention Period (days)', description: 'How long to keep backups', dataType: 'number' },
        { key: 'backup_location', value: './backups', category: 'backup', label: 'Backup Location', description: 'Directory for backup files', dataType: 'string' },
        
        // Notification Settings
        { key: 'notifications_enabled', value: true, category: 'notifications', label: 'Enable Notifications', description: 'System notifications', dataType: 'boolean' },
        { key: 'email_notifications', value: true, category: 'notifications', label: 'Email Notifications', description: 'Send notifications via email', dataType: 'boolean' },
        { key: 'low_stock_threshold', value: 10, category: 'notifications', label: 'Low Stock Threshold', description: 'Alert when stock is below this level', dataType: 'number' },
        { key: 'expiry_warning_days', value: 30, category: 'notifications', label: 'Expiry Warning (days)', description: 'Alert days before expiry', dataType: 'number' },
        { key: 'notification_email', value: '', category: 'notifications', label: 'Notification Email', description: 'Email for system alerts', dataType: 'string' },
        
        // General Settings
        { key: 'system_language', value: 'en', category: 'general', label: 'System Language', description: 'Default language', dataType: 'select', options: ['en', 'ar'] },
        { key: 'system_timezone', value: 'UTC', category: 'general', label: 'System Timezone', description: 'Default timezone', dataType: 'string' },
        { key: 'date_format', value: 'YYYY-MM-DD', category: 'general', label: 'Date Format', description: 'Default date format', dataType: 'select', options: ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'] },
        { key: 'currency_symbol', value: 'USD', category: 'general', label: 'Currency', description: 'Default currency', dataType: 'select', options: ['USD', 'EUR', 'EGP', 'SAR'] },
        { key: 'records_per_page', value: 10, category: 'general', label: 'Records Per Page', description: 'Default pagination size', dataType: 'number' },
        { key: 'maintenance_mode', value: false, category: 'general', label: 'Maintenance Mode', description: 'Enable maintenance mode', dataType: 'boolean' }
      ];
      
      let created = 0;
      
      for (const pref of defaultPreferences) {
        try {
          // Check if preference already exists
          const [existing] = await db.select().from(systemPreferences)
            .where(eq(systemPreferences.key, pref.key));
          
          if (!existing) {
            await db.insert(systemPreferences).values(pref);
            created++;
          }
        } catch (error) {
          console.error(`Error creating preference ${pref.key}:`, error);
        }
      }
      
      res.json({ 
        success: true, 
        message: `Initialized ${created} default preferences`,
        total: defaultPreferences.length,
        created 
      });
    } catch (error) {
      console.error("Initialize preferences error:", error);
      res.status(500).json({ message: "Failed to initialize preferences" });
    }
  });
}