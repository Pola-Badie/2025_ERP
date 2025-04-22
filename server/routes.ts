import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { z } from "zod";
import { 
  insertProductSchema,
  updateProductSchema,
  insertCustomerSchema,
  insertSaleSchema,
  insertSaleItemSchema,
  updateBackupSettingsSchema,
  insertPurchaseOrderSchema,
  insertSupplierSchema,
  insertProductCategorySchema
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

  // ============= User Endpoints =============
  
  // Get all users
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      // Fetch all users from database
      const [users] = await db.select().from(users);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ============= Product Endpoints =============
  
  // Get all products
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      let products;
      const { categoryId, status } = req.query;
      
      if (categoryId) {
        products = await storage.getProductsByCategory(Number(categoryId));
      } else if (status) {
        products = await storage.getProductsByStatus(status as string);
      } else {
        products = await storage.getProducts();
      }
      
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get products with low stock
  app.get("/api/products/low-stock", async (req: Request, res: Response) => {
    try {
      const products = await storage.getLowStockProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock products" });
    }
  });

  // Get expiring products
  app.get("/api/products/expiring", async (req: Request, res: Response) => {
    try {
      const days = Number(req.query.days) || 30;
      const products = await storage.getExpiringProducts(days);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expiring products" });
    }
  });

  // Get product by ID
  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Create new product
  app.post("/api/products", upload.single("image"), async (req: Request, res: Response) => {
    try {
      // Validate and transform request body
      const validatedData = insertProductSchema.parse({
        ...req.body,
        categoryId: req.body.categoryId ? Number(req.body.categoryId) : undefined,
        costPrice: Number(req.body.costPrice),
        sellingPrice: Number(req.body.sellingPrice),
        quantity: Number(req.body.quantity),
        lowStockThreshold: req.body.lowStockThreshold ? Number(req.body.lowStockThreshold) : undefined,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined
      });
      
      // Add image path if uploaded
      if (req.file) {
        validatedData.imagePath = req.file.path;
      }
      
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Update product
  app.patch("/api/products/:id", upload.single("image"), async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      // Validate and transform request body
      const validatedData = updateProductSchema.parse({
        ...req.body,
        categoryId: req.body.categoryId ? Number(req.body.categoryId) : undefined,
        costPrice: req.body.costPrice ? Number(req.body.costPrice) : undefined,
        sellingPrice: req.body.sellingPrice ? Number(req.body.sellingPrice) : undefined,
        quantity: req.body.quantity ? Number(req.body.quantity) : undefined,
        lowStockThreshold: req.body.lowStockThreshold ? Number(req.body.lowStockThreshold) : undefined,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined
      });
      
      // Add image path if uploaded
      if (req.file) {
        validatedData.imagePath = req.file.path;
      }
      
      const product = await storage.updateProduct(id, validatedData);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Delete product
  app.delete("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteProduct(id);
      
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // ============= Category Endpoints =============
  
  // Get all categories
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Create new category
  app.post("/api/categories", async (req: Request, res: Response) => {
    try {
      const validatedData = insertProductCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
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
  app.get("/api/customers", async (req: Request, res: Response) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // Get customer by ID
  app.get("/api/customers/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  // Create new customer
  app.post("/api/customers", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  // Get customer stats
  app.get("/api/customers/stats", async (req: Request, res: Response) => {
    try {
      const totalCustomers = await storage.getTotalCustomersCount();
      const newCustomers = await storage.getNewCustomersCount(30); // Last 30 days
      
      res.json({
        totalCustomers,
        newCustomers
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer statistics" });
    }
  });

  // ============= Supplier Endpoints =============
  
  // Get all suppliers
  app.get("/api/suppliers", async (req: Request, res: Response) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  // Get supplier by ID
  app.get("/api/suppliers/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const supplier = await storage.getSupplier(id);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch supplier" });
    }
  });

  // Create new supplier
  app.post("/api/suppliers", async (req: Request, res: Response) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  // ============= Sales Endpoints =============
  
  // Get all sales
  app.get("/api/sales", async (req: Request, res: Response) => {
    try {
      let sales;
      const { customerId, startDate, endDate } = req.query;
      
      if (customerId) {
        sales = await storage.getSalesByCustomer(Number(customerId));
      } else if (startDate && endDate) {
        sales = await storage.getSalesByDate(new Date(startDate as string), new Date(endDate as string));
      } else {
        sales = await storage.getSales();
      }
      
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  // Get sales statistics
  app.get("/api/sales/stats", async (req: Request, res: Response) => {
    try {
      const todaySalesTotal = await storage.getTodaySalesTotal();
      const monthSalesTotal = await storage.getMonthSalesTotal();
      
      res.json({
        todaySalesTotal,
        monthSalesTotal
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales statistics" });
    }
  });

  // Create new sale
  app.post("/api/sales", async (req: Request, res: Response) => {
    try {
      const { sale, items } = req.body;
      
      // Validate sale data
      const validatedSale = insertSaleSchema.parse({
        ...sale,
        customerId: sale.customerId ? Number(sale.customerId) : null,
        userId: Number(sale.userId),
        totalAmount: Number(sale.totalAmount),
        discount: sale.discount ? Number(sale.discount) : 0,
        tax: sale.tax ? Number(sale.tax) : 0
      });
      
      // Validate each item
      const validatedItems = [];
      for (const item of items) {
        const validatedItem = insertSaleItemSchema.parse({
          ...item,
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discount: item.discount ? Number(item.discount) : 0,
          total: Number(item.total)
        });
        validatedItems.push(validatedItem);
      }
      
      const createdSale = await storage.createSale(validatedSale, validatedItems);
      res.status(201).json(createdSale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sale data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  // ============= Purchase Endpoints =============
  
  // Get all purchase orders
  app.get("/api/purchases", async (req: Request, res: Response) => {
    try {
      const purchases = await storage.getPurchaseOrders();
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });

  // Create new purchase order
  app.post("/api/purchases", async (req: Request, res: Response) => {
    try {
      const { order, items } = req.body;
      
      // Validate purchase order data
      const validatedOrder = insertPurchaseOrderSchema.parse({
        ...order,
        supplierId: Number(order.supplierId),
        userId: Number(order.userId),
        totalAmount: Number(order.totalAmount),
        expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate) : undefined
      });
      
      // Validate each item
      const validatedItems = [];
      for (const item of items) {
        validatedItems.push({
          ...item,
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined
        });
      }
      
      const createdOrder = await storage.createPurchaseOrder(validatedOrder, validatedItems);
      res.status(201).json(createdOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid purchase order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create purchase order" });
    }
  });

  // ============= Report Endpoints =============
  
  // Generate sales report
  app.get("/api/reports/sales", async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const report = await storage.getSalesReport(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate sales report" });
    }
  });

  // ============= Backup Endpoints =============
  
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
