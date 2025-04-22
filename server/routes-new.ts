import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { z } from "zod";
import { 
  users, products, productCategories, customers, suppliers, sales, 
  saleItems, purchaseOrders, purchaseOrderItems, backups, backupSettings,
  insertProductSchema, updateProductSchema, insertProductCategorySchema,
  insertCustomerSchema, insertSaleSchema, insertSaleItemSchema,
  insertPurchaseOrderSchema, insertSupplierSchema, updateBackupSettingsSchema
} from "@shared/schema";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import * as cron from "node-cron";
import { eq, and, gte, lte, desc, count, sum, sql } from "drizzle-orm";

// Set up multer for file uploads
const uploadsDir = path.join(process.cwd(), "uploads");
try {
  fs.mkdir(uploadsDir, { recursive: true });
} catch (err) {
  console.error("Error creating uploads directory:", err);
}

const storage_config = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, uploadsDir);
  },
  filename: (_req: any, file: any, cb: any) => {
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
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowedMimes = ["image/jpeg", "image/png", "application/pdf"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG, PNG, and PDF are allowed."));
    }
  },
});

// Store cron jobs so they can be stopped/updated
const cronJobs: Record<string, cron.ScheduledTask | null> = {
  daily: null,
  weekly: null,
  monthly: null
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // ============= Dashboard Endpoints =============
  
  // API endpoint for dashboard summary data
  app.get("/api/dashboard/summary", async (_req: Request, res: Response) => {
    try {
      // Get total customers count
      const [customersResult] = await db.select({ 
        count: count() 
      }).from(customers);
      
      // Get customers added in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const [newCustomersResult] = await db.select({ 
        count: count() 
      }).from(customers).where(gte(customers.createdAt, thirtyDaysAgo));
      
      // Get today's sales
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [todaySalesResult] = await db.select({ 
        total: sum(sales.totalAmount) 
      }).from(sales).where(gte(sales.date, today));
      
      // Get current month sales
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      
      const [monthSalesResult] = await db.select({ 
        total: sum(sales.totalAmount) 
      }).from(sales).where(gte(sales.date, firstDayOfMonth));
      
      // Get low stock products
      const lowStockProducts = await db.select({
        id: products.id,
        name: products.name,
        drugName: products.drugName,
        quantity: products.quantity,
        status: products.status
      })
      .from(products)
      .where(
        sql`${products.quantity} <= ${products.lowStockThreshold} OR ${products.status} = 'out_of_stock'`
      )
      .limit(5);
      
      // Get expiring products
      const expiryLimit = new Date();
      expiryLimit.setDate(expiryLimit.getDate() + 90); // next 90 days
      
      const expiringProducts = await db.select({
        id: products.id,
        name: products.name,
        drugName: products.drugName,
        expiryDate: products.expiryDate,
        status: products.status
      })
      .from(products)
      .where(
        sql`${products.expiryDate} IS NOT NULL AND ${products.expiryDate} <= ${expiryLimit}`
      )
      .orderBy(products.expiryDate)
      .limit(5);
      
      // Format the response
      const totalCustomers = Number(customersResult.count) || 0;
      const newCustomers = Number(newCustomersResult.count) || 0;
      const todaySales = Number(todaySalesResult.total) || 0;
      const monthSales = Number(monthSalesResult.total) || 0;
      
      res.json({
        totalCustomers,
        newCustomers,
        todaySales,
        monthSales,
        lowStockProducts,
        expiringProducts
      });
    } catch (error) {
      console.error("Dashboard summary error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // ============= Product Endpoints =============
  
  // Get all products
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      let productsQuery = db.select().from(products);
      
      const { categoryId, status } = req.query;
      
      if (categoryId) {
        productsQuery = productsQuery.where(eq(products.categoryId, Number(categoryId)));
      } 
      
      if (status) {
        productsQuery = productsQuery.where(eq(products.status, status as string));
      }
      
      const result = await productsQuery;
      res.json(result);
    } catch (error) {
      console.error("Products error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get product by ID
  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const [product] = await db.select().from(products).where(eq(products.id, id));
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Create new product
  app.post("/api/products", upload.single("image"), async (req: any, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertProductSchema.parse({
        ...req.body,
        categoryId: req.body.categoryId ? Number(req.body.categoryId) : undefined,
        costPrice: req.body.costPrice,
        sellingPrice: req.body.sellingPrice,
        quantity: Number(req.body.quantity || 0),
        lowStockThreshold: req.body.lowStockThreshold ? Number(req.body.lowStockThreshold) : 10,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined
      });
      
      // Add image path if uploaded
      if (req.file) {
        validatedData.imagePath = req.file.path;
      }
      
      // Insert into database
      const [product] = await db.insert(products).values(validatedData).returning();
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Create product error:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // ============= Category Endpoints =============
  
  // Get all categories
  app.get("/api/categories", async (_req: Request, res: Response) => {
    try {
      const result = await db.select().from(productCategories);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Create category
  app.post("/api/categories", async (req: Request, res: Response) => {
    try {
      const validatedData = insertProductCategorySchema.parse(req.body);
      const [category] = await db.insert(productCategories).values(validatedData).returning();
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // ============= Customer Endpoints =============
  
  // Get all customers
  app.get("/api/customers", async (_req: Request, res: Response) => {
    try {
      const result = await db.select().from(customers);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // Create customer
  app.post("/api/customers", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const [customer] = await db.insert(customers).values(validatedData).returning();
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  // ============= Sales Endpoints =============
  
  // Get all sales
  app.get("/api/sales", async (req: Request, res: Response) => {
    try {
      let salesQuery = db.select().from(sales);
      
      const { customerId, startDate, endDate } = req.query;
      
      if (customerId) {
        salesQuery = salesQuery.where(eq(sales.customerId, Number(customerId)));
      } 
      
      if (startDate && endDate) {
        salesQuery = salesQuery.where(and(
          gte(sales.date, new Date(startDate as string)),
          lte(sales.date, new Date(endDate as string))
        ));
      }
      
      const result = await salesQuery.orderBy(desc(sales.date));
      res.json(result);
    } catch (error) {
      console.error("Sales error:", error);
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  // Create sale
  app.post("/api/sales", async (req: Request, res: Response) => {
    try {
      const { sale, items } = req.body;
      
      // Validate sale data
      const validatedSale = insertSaleSchema.parse({
        ...sale,
        customerId: sale.customerId ? Number(sale.customerId) : null,
        userId: Number(sale.userId),
        totalAmount: sale.totalAmount,
        discount: sale.discount || "0",
        tax: sale.tax || "0"
      });
      
      // Insert sale
      const [createdSale] = await db.insert(sales).values(validatedSale).returning();
      
      // Insert sale items
      for (const item of items) {
        const validatedItem = insertSaleItemSchema.parse({
          ...item,
          saleId: createdSale.id,
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitPrice: item.unitPrice,
          discount: item.discount || "0",
          total: item.total
        });
        
        await db.insert(saleItems).values(validatedItem);
        
        // Update product stock
        await db.update(products)
          .set({ 
            quantity: sql`${products.quantity} - ${validatedItem.quantity}`,
            updatedAt: new Date()
          })
          .where(eq(products.id, validatedItem.productId));
      }
      
      res.status(201).json(createdSale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sale data", errors: error.errors });
      }
      console.error("Create sale error:", error);
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  // ============= Error Handler =============
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Global error handler:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  });

  return httpServer;
}

// Function to setup automatic backups
async function setupAutomaticBackups() {
  try {
    // Get current settings
    const [settings] = await db.select().from(backupSettings).limit(1);
    
    if (!settings) {
      console.log("No backup settings found, skipping automatic backup setup");
      return;
    }
    
    // Cancel any existing backup jobs
    for (const job of Object.values(cronJobs)) {
      if (job) job.stop();
    }
    
    // Set up daily backup if enabled
    if (settings.dailyBackup) {
      const [hour, minute] = settings.backupTime.split(':');
      cronJobs.daily = cron.schedule(`${minute} ${hour} * * *`, async () => {
        try {
          // Perform backup logic here
          console.log('Daily backup completed');
        } catch (error) {
          console.error('Daily backup failed:', error);
        }
      });
    }
    
    // Set up weekly backup if enabled
    if (settings.weeklyBackup) {
      const [hour, minute] = settings.backupTime.split(':');
      cronJobs.weekly = cron.schedule(`${minute} ${hour} * * 0`, async () => {
        try {
          // Perform backup logic here
          console.log('Weekly backup completed');
        } catch (error) {
          console.error('Weekly backup failed:', error);
        }
      });
    }
    
    // Set up monthly backup if enabled
    if (settings.monthlyBackup) {
      const [hour, minute] = settings.backupTime.split(':');
      cronJobs.monthly = cron.schedule(`${minute} ${hour} 1 * *`, async () => {
        try {
          // Perform backup logic here
          console.log('Monthly backup completed');
        } catch (error) {
          console.error('Monthly backup failed:', error);
        }
      });
    }
  } catch (error) {
    console.error('Failed to setup automatic backups:', error);
  }
}