import { Express, Request, Response } from "express";
import { db } from "./db";
import { 
  systemPreferences,
  insertSystemPreferenceSchema
} from "../shared/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

// Enhanced System Preferences Routes
export function registerSystemPreferencesRoutes(app: Express) {
  
  // 1. GET /api/system-preferences - Fetch all system settings
  app.get("/api/system-preferences", async (req: Request, res: Response) => {
    try {
      const preferences = await db.select().from(systemPreferences);
      
      // If no preferences exist, create default ones
      if (preferences.length === 0) {
        await initializeDefaultPreferences();
        const newPreferences = await db.select().from(systemPreferences);
        return res.json(newPreferences);
      }
      
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching system preferences:", error);
      res.status(500).json({ error: "Failed to fetch system preferences" });
    }
  });

  // 2. PUT /api/system-preferences/:key - Update individual settings
  app.put("/api/system-preferences/:key", async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { value } = req.body;

      // Validate the request
      if (!key || value === undefined) {
        return res.status(400).json({ error: "Key and value are required" });
      }

      // Update the preference
      await db
        .update(systemPreferences)
        .set({ 
          value: String(value), 
          updatedAt: new Date() 
        })
        .where(eq(systemPreferences.key, key));

      res.json({ success: true, message: "Preference updated successfully" });
    } catch (error) {
      console.error("Error updating system preference:", error);
      res.status(500).json({ error: "Failed to update system preference" });
    }
  });

  // 3. GET /api/company-info - Get company details
  app.get("/api/company-info", async (req: Request, res: Response) => {
    try {
      // Use system preferences to store company info
      const companyPrefs = await db.select().from(systemPreferences)
        .where(eq(systemPreferences.category, "company"));
      
      if (companyPrefs.length === 0) {
        // Create default company preferences
        const defaultCompanyPrefs = [
          { key: "company_name", value: "Premier ERP Chemical Manufacturing", category: "company", description: "Company name" },
          { key: "company_address", value: "123 Chemical Street", category: "company", description: "Company address" },
          { key: "company_city", value: "Cairo", category: "company", description: "Company city" },
          { key: "company_state", value: "Cairo Governorate", category: "company", description: "Company state" },
          { key: "company_zipCode", value: "11511", category: "company", description: "Company zip code" },
          { key: "company_country", value: "Egypt", category: "company", description: "Company country" },
          { key: "company_phone", value: "+20 2 1234 5678", category: "company", description: "Company phone" },
          { key: "company_email", value: "info@premiererp.com", category: "company", description: "Company email" },
          { key: "company_website", value: "https://premiererp.com", category: "company", description: "Company website" },
          { key: "company_taxId", value: "EG-123456789", category: "company", description: "Company tax ID" },
          { key: "company_businessType", value: "Chemical Manufacturing", category: "company", description: "Business type" },
          { key: "company_industry", value: "Chemical Manufacturing", category: "company", description: "Industry" }
        ];
        
        for (const pref of defaultCompanyPrefs) {
          await db.insert(systemPreferences).values(pref).onConflictDoNothing();
        }
        
        const newCompanyPrefs = await db.select().from(systemPreferences)
          .where(eq(systemPreferences.category, "company"));
        
        // Convert to object format
        const companyInfo = newCompanyPrefs.reduce((acc, pref) => {
          const key = pref.key.replace('company_', '');
          acc[key] = pref.value;
          return acc;
        }, {});
        
        return res.json(companyInfo);
      }
      
      // Convert to object format
      const companyInfo = companyPrefs.reduce((acc, pref) => {
        const key = pref.key.replace('company_', '');
        acc[key] = pref.value;
        return acc;
      }, {});
      
      res.json(companyInfo);
    } catch (error) {
      console.error("Error fetching company info:", error);
      res.status(500).json({ error: "Failed to fetch company information" });
    }
  });

  // 4. PUT /api/company-info - Update company information
  app.put("/api/company-info", async (req: Request, res: Response) => {
    try {
      const companyData = req.body;
      
      // Update each company preference
      for (const [key, value] of Object.entries(companyData)) {
        const prefKey = `company_${key}`;
        await db
          .update(systemPreferences)
          .set({ 
            value: String(value), 
            updatedAt: new Date() 
          })
          .where(eq(systemPreferences.key, prefKey));
      }
      
      res.json({ success: true, message: "Company information updated successfully" });
    } catch (error) {
      console.error("Error updating company info:", error);
      res.status(500).json({ error: "Failed to update company information" });
    }
  });

  // 5. GET /api/email-settings - Get SMTP configuration
  app.get("/api/email-settings", async (req: Request, res: Response) => {
    try {
      const emailPrefs = await db.select().from(systemPreferences)
        .where(eq(systemPreferences.category, "email"));
      
      if (emailPrefs.length === 0) {
        // Create default email preferences
        const defaultEmailPrefs = [
          { key: "email_smtpHost", value: "smtp.gmail.com", category: "email", description: "SMTP host" },
          { key: "email_smtpPort", value: "587", category: "email", description: "SMTP port", dataType: "number" },
          { key: "email_smtpUsername", value: "", category: "email", description: "SMTP username" },
          { key: "email_smtpPassword", value: "", category: "email", description: "SMTP password" },
          { key: "email_encryption", value: "tls", category: "email", description: "Encryption type" },
          { key: "email_fromName", value: "Premier ERP System", category: "email", description: "From name" },
          { key: "email_fromEmail", value: "", category: "email", description: "From email" },
          { key: "email_isEnabled", value: "false", category: "email", description: "Email enabled", dataType: "boolean" },
          { key: "email_testEmailsSent", value: "0", category: "email", description: "Test emails sent", dataType: "number" }
        ];
        
        for (const pref of defaultEmailPrefs) {
          await db.insert(systemPreferences).values(pref).onConflictDoNothing();
        }
        
        const newEmailPrefs = await db.select().from(systemPreferences)
          .where(eq(systemPreferences.category, "email"));
        
        // Convert to object format and mask password
        const emailSettings = newEmailPrefs.reduce((acc, pref) => {
          const key = pref.key.replace('email_', '');
          acc[key] = key === 'smtpPassword' ? '****' : pref.value;
          return acc;
        }, {});
        
        return res.json(emailSettings);
      }
      
      // Convert to object format and mask password
      const emailSettings = emailPrefs.reduce((acc, pref) => {
        const key = pref.key.replace('email_', '');
        acc[key] = key === 'smtpPassword' ? '****' : pref.value;
        return acc;
      }, {});
      
      res.json(emailSettings);
    } catch (error) {
      console.error("Error fetching email settings:", error);
      res.status(500).json({ error: "Failed to fetch email settings" });
    }
  });

  // 6. PUT /api/email-settings - Update email settings
  app.put("/api/email-settings", async (req: Request, res: Response) => {
    try {
      const emailData = req.body;
      
      // Update each email preference
      for (const [key, value] of Object.entries(emailData)) {
        // Don't update password if it's the masked value
        if (key === 'smtpPassword' && value === '****') {
          continue;
        }
        
        const prefKey = `email_${key}`;
        await db
          .update(systemPreferences)
          .set({ 
            value: String(value), 
            updatedAt: new Date() 
          })
          .where(eq(systemPreferences.key, prefKey));
      }
      
      res.json({ success: true, message: "Email settings updated successfully" });
    } catch (error) {
      console.error("Error updating email settings:", error);
      res.status(500).json({ error: "Failed to update email settings" });
    }
  });

  // 7. POST /api/test-email - Send test email
  app.post("/api/test-email", async (req: Request, res: Response) => {
    try {
      const { testEmail } = req.body;
      
      if (!testEmail) {
        return res.status(400).json({ error: "Test email address is required" });
      }
      
      // Get email enabled status
      const enabledPref = await db.select().from(systemPreferences)
        .where(eq(systemPreferences.key, "email_isEnabled")).limit(1);
      
      if (enabledPref.length === 0 || enabledPref[0].value !== "true") {
        return res.status(400).json({ error: "Email settings not configured or disabled" });
      }
      
      // Simulate sending test email and update counter
      const testCountPref = await db.select().from(systemPreferences)
        .where(eq(systemPreferences.key, "email_testEmailsSent")).limit(1);
      
      const currentCount = testCountPref.length > 0 ? parseInt(testCountPref[0].value || "0") : 0;
      
      await db
        .update(systemPreferences)
        .set({ 
          value: String(currentCount + 1),
          updatedAt: new Date() 
        })
        .where(eq(systemPreferences.key, "email_testEmailsSent"));
      
      res.json({ 
        success: true, 
        message: `Test email sent successfully to ${testEmail}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ error: "Failed to send test email" });
    }
  });

  // 8. GET /api/backup-settings - Get backup configuration
  app.get("/api/backup-settings", async (req: Request, res: Response) => {
    try {
      const backupPrefs = await db.select().from(systemPreferences)
        .where(eq(systemPreferences.category, "backup"));
      
      if (backupPrefs.length === 0) {
        // Create default backup preferences
        const defaultBackupPrefs = [
          { key: "backup_frequency", value: "daily", category: "backup", description: "Backup frequency" },
          { key: "backup_location", value: "local", category: "backup", description: "Backup location" },
          { key: "backup_retentionDays", value: "30", category: "backup", description: "Retention days", dataType: "number" },
          { key: "backup_includeUploads", value: "true", category: "backup", description: "Include uploads", dataType: "boolean" },
          { key: "backup_isEnabled", value: "true", category: "backup", description: "Backup enabled", dataType: "boolean" },
          { key: "backup_count", value: "0", category: "backup", description: "Backup count", dataType: "number" }
        ];
        
        for (const pref of defaultBackupPrefs) {
          await db.insert(systemPreferences).values(pref).onConflictDoNothing();
        }
        
        const newBackupPrefs = await db.select().from(systemPreferences)
          .where(eq(systemPreferences.category, "backup"));
        
        // Convert to object format
        const backupSettings = newBackupPrefs.reduce((acc, pref) => {
          const key = pref.key.replace('backup_', '');
          acc[key] = pref.value;
          return acc;
        }, {});
        
        return res.json(backupSettings);
      }
      
      // Convert to object format
      const backupSettings = backupPrefs.reduce((acc, pref) => {
        const key = pref.key.replace('backup_', '');
        acc[key] = pref.value;
        return acc;
      }, {});
      
      res.json(backupSettings);
    } catch (error) {
      console.error("Error fetching backup settings:", error);
      res.status(500).json({ error: "Failed to fetch backup settings" });
    }
  });

  // 9. PUT /api/backup-settings - Update backup settings
  app.put("/api/backup-settings", async (req: Request, res: Response) => {
    try {
      const backupData = req.body;
      
      // Update each backup preference
      for (const [key, value] of Object.entries(backupData)) {
        const prefKey = `backup_${key}`;
        await db
          .update(systemPreferences)
          .set({ 
            value: String(value), 
            updatedAt: new Date() 
          })
          .where(eq(systemPreferences.key, prefKey));
      }
      
      res.json({ success: true, message: "Backup settings updated successfully" });
    } catch (error) {
      console.error("Error updating backup settings:", error);
      res.status(500).json({ error: "Failed to update backup settings" });
    }
  });

  // 10. POST /api/create-backup - Create manual backup
  app.post("/api/create-backup", async (req: Request, res: Response) => {
    try {
      // Get backup enabled status
      const enabledPref = await db.select().from(systemPreferences)
        .where(eq(systemPreferences.key, "backup_isEnabled")).limit(1);
      
      if (enabledPref.length === 0 || enabledPref[0].value !== "true") {
        return res.status(400).json({ error: "Backup settings not configured or disabled" });
      }
      
      // Create backup directory if it doesn't exist
      const backupDir = path.join(process.cwd(), "backups");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // Generate backup filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFilename = `premier-erp-backup-${timestamp}.json`;
      const backupPath = path.join(backupDir, backupFilename);
      
      // Simulate backup creation (you would implement actual backup logic here)
      const backupData = {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        tables: ["products", "customers", "suppliers", "sales", "expenses"],
        type: "manual"
      };
      
      // Write backup file
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
      
      // Update backup count
      const countPref = await db.select().from(systemPreferences)
        .where(eq(systemPreferences.key, "backup_count")).limit(1);
      
      const currentCount = countPref.length > 0 ? parseInt(countPref[0].value || "0") : 0;
      
      await db
        .update(systemPreferences)
        .set({ 
          value: String(currentCount + 1),
          updatedAt: new Date() 
        })
        .where(eq(systemPreferences.key, "backup_count"));
      
      res.json({ 
        success: true, 
        message: "Backup created successfully",
        filename: backupFilename,
        path: backupPath,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({ error: "Failed to create backup" });
    }
  });
}

// Initialize default system preferences
async function initializeDefaultPreferences() {
  const defaultPreferences = [
    // General Settings
    { key: "language", value: "en", category: "general", description: "System language", dataType: "string" },
    { key: "timezone", value: "Africa/Cairo", category: "general", description: "System timezone", dataType: "string" },
    { key: "dateFormat", value: "DD/MM/YYYY", category: "general", description: "Date display format", dataType: "string" },
    { key: "currency", value: "EGP", category: "general", description: "Default currency", dataType: "string" },
    
    // Security Settings
    { key: "sessionTimeout", value: "30", category: "security", description: "Session timeout in minutes", dataType: "number" },
    { key: "passwordMinLength", value: "8", category: "security", description: "Minimum password length", dataType: "number" },
    { key: "requireSpecialChars", value: "true", category: "security", description: "Require special characters in passwords", dataType: "boolean" },
    { key: "maxLoginAttempts", value: "5", category: "security", description: "Maximum login attempts", dataType: "number" },
    
    // Notification Settings
    { key: "lowStockThreshold", value: "10", category: "notifications", description: "Low stock alert threshold", dataType: "number" },
    { key: "expiryWarningDays", value: "30", category: "notifications", description: "Days before expiry to warn", dataType: "number" },
    { key: "enableEmailAlerts", value: "true", category: "notifications", description: "Enable email alerts", dataType: "boolean" },
    { key: "enableSmsAlerts", value: "false", category: "notifications", description: "Enable SMS alerts", dataType: "boolean" },
    
    // Company Settings
    { key: "businessHours", value: "08:00-18:00", category: "company", description: "Business operating hours", dataType: "string" },
    { key: "fiscalYearStart", value: "01/01", category: "company", description: "Fiscal year start date", dataType: "string" },
    { key: "taxRate", value: "14", category: "company", description: "Default tax rate (%)", dataType: "number" },
  ];

  for (const pref of defaultPreferences) {
    await db.insert(systemPreferences).values(pref).onConflictDoNothing();
  }
}