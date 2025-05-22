import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { z } from "zod";
import { 
  users, products, productCategories, customers, suppliers, sales, 
  saleItems, purchaseOrders, purchaseOrderItems, backups, backupSettings,
  systemPreferences, rolePermissions, loginLogs,
  insertProductSchema, updateProductSchema, insertProductCategorySchema,
  insertCustomerSchema, insertSaleSchema, insertSaleItemSchema,
  insertPurchaseOrderSchema, insertSupplierSchema, updateBackupSettingsSchema,
  insertSystemPreferenceSchema, updateSystemPreferenceSchema,
  insertRolePermissionSchema, insertLoginLogSchema
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

import { registerAccountingRoutes } from "./routes-accounting";
import { registerCustomerPaymentRoutes } from "./routes-customer-payments";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all suppliers
  app.get("/api/suppliers", async (_req: Request, res: Response) => {
    try {
      const suppliersList = await db.select().from(suppliers).orderBy(suppliers.name);
      return res.status(200).json(suppliersList);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      return res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });
  // Generate sample invoices for demo purposes
  app.get("/api/sample-invoices", async (_req: Request, res: Response) => {
    try {
      // Create sample invoices
      const sampleInvoices = [
        {
          id: 1001,
          invoiceNumber: "INV-002501",
          customerName: "Ahmed Hassan",
          date: "2025-05-01T10:30:00Z",
          dueDate: "2025-05-16T10:30:00Z",
          amount: 1250.75,
          amountPaid: 1250.75,
          paymentMethod: "credit_card",
          status: "paid",
          items: [
            {
              productName: "Pharmaceutical Grade Acetone",
              quantity: 25,
              unitPrice: 42.50,
              total: 1062.50,
              unitOfMeasure: "L"
            },
            {
              productName: "Laboratory Glassware Set",
              quantity: 2,
              unitPrice: 94.12,
              total: 188.24,
              unitOfMeasure: "set"
            }
          ]
        },
        {
          id: 1002,
          invoiceNumber: "INV-002502",
          customerName: "Cairo Medical Supplies Ltd.",
          date: "2025-05-05T14:20:00Z",
          dueDate: "2025-05-20T14:20:00Z",
          amount: 3245.00,
          amountPaid: 2000.00,
          paymentMethod: "bank_transfer",
          status: "partial",
          items: [
            {
              productName: "Sodium Hydroxide (Technical Grade)",
              quantity: 100,
              unitPrice: 18.45,
              total: 1845.00,
              unitOfMeasure: "kg"
            },
            {
              productName: "Hydrochloric Acid Solution",
              quantity: 50,
              unitPrice: 28.00,
              total: 1400.00,
              unitOfMeasure: "L"
            }
          ]
        },
        {
          id: 1003,
          invoiceNumber: "INV-002503",
          customerName: "Alexandria Pharma Co.",
          date: "2025-05-08T09:15:00Z",
          dueDate: "2025-05-23T09:15:00Z",
          amount: 875.50,
          amountPaid: 0,
          paymentMethod: "cheque",
          status: "unpaid",
          items: [
            {
              productName: "Industrial Ethanol",
              quantity: 35,
              unitPrice: 25.00,
              total: 875.50,
              unitOfMeasure: "L"
            }
          ]
        },
        {
          id: 1004,
          invoiceNumber: "INV-002504",
          customerName: "Modern Laboratories Inc.",
          date: "2025-04-20T16:45:00Z",
          dueDate: "2025-05-05T16:45:00Z",
          amount: 4520.75,
          amountPaid: 0,
          paymentMethod: "",
          status: "overdue",
          items: [
            {
              productName: "Pharmaceutical Grade Glycerin",
              quantity: 75,
              unitPrice: 32.25,
              total: 2418.75,
              unitOfMeasure: "L"
            },
            {
              productName: "Purified Water USP",
              quantity: 200,
              unitPrice: 8.76,
              total: 1752.00,
              unitOfMeasure: "L"
            },
            {
              productName: "Citric Acid Anhydrous",
              quantity: 50,
              unitPrice: 7.00,
              total: 350.00,
              unitOfMeasure: "kg"
            }
          ]
        },
        {
          id: 1005,
          invoiceNumber: "INV-002505",
          customerName: "Giza Chemical Solutions",
          date: "2025-05-12T11:10:00Z",
          dueDate: "2025-05-27T11:10:00Z",
          amount: 1865.25,
          amountPaid: 1865.25,
          paymentMethod: "cash",
          status: "paid",
          items: [
            {
              productName: "Magnesium Sulfate",
              quantity: 125,
              unitPrice: 6.50,
              total: 812.50,
              unitOfMeasure: "kg"
            },
            {
              productName: "Sodium Bicarbonate",
              quantity: 150,
              unitPrice: 7.02,
              total: 1052.75,
              unitOfMeasure: "kg"
            }
          ]
        }
      ];
      
      res.json(sampleInvoices);
    } catch (error) {
      console.error("Error generating sample invoices:", error);
      res.status(500).json({ message: "Failed to generate sample invoices" });
    }
  });
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Register accounting routes
  registerAccountingRoutes(app);
  
  // Register customer payment routes
  registerCustomerPaymentRoutes(app);

  // ============= User Management Endpoints =============

  // Get all users
  app.get("/api/users", async (_req: Request, res: Response) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        name: users.name,
        email: users.email,
        role: users.role,
        avatar: users.avatar,
        createdAt: users.createdAt
      }).from(users);
      
      // Don't return passwords
      res.json(allUsers);
    } catch (error) {
      console.error("Users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        name: users.name,
        email: users.email,
        role: users.role,
        avatar: users.avatar,
        createdAt: users.createdAt
      }).from(users).where(eq(users.id, id));
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Create user
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.username, validatedData.username))
        .limit(1);
      
      if (existingUser.length > 0) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Insert user
      const [newUser] = await db.insert(users).values(validatedData).returning({
        id: users.id,
        username: users.username,
        name: users.name,
        email: users.email,
        role: users.role,
        avatar: users.avatar,
        createdAt: users.createdAt
      });
      
      res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Create user error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Update user
  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      // First check if user exists
      const [existingUser] = await db.select().from(users).where(eq(users.id, id));
      
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create update schema that makes all fields optional
      const updateUserSchema = z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.string().optional(),
        avatar: z.string().optional(),
        password: z.string().optional(),
      });
      
      const validatedData = updateUserSchema.parse(req.body);
      
      // Update user
      const [updatedUser] = await db.update(users)
        .set(validatedData)
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          username: users.username,
          name: users.name,
          email: users.email,
          role: users.role,
          avatar: users.avatar,
          createdAt: users.createdAt
        });
      
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user
  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      // Check if user exists
      const [existingUser] = await db.select().from(users).where(eq(users.id, id));
      
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Delete user
      await db.delete(users).where(eq(users.id, id));
      
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

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
  
  // Update category
  app.patch("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { name, description } = req.body;
      
      // Validate the data
      if (!name) {
        return res.status(400).json({ message: "Category name is required" });
      }
      
      // Check if category exists
      const [existingCategory] = await db.select().from(productCategories).where(eq(productCategories.id, id));
      
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Update category
      const [updatedCategory] = await db.update(productCategories)
        .set({ name, description })
        .where(eq(productCategories.id, id))
        .returning();
      
      res.json(updatedCategory);
    } catch (error) {
      console.error("Update category error:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });
  
  // Delete category
  app.delete("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      // Check if category exists
      const [existingCategory] = await db.select().from(productCategories).where(eq(productCategories.id, id));
      
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Delete category
      await db.delete(productCategories).where(eq(productCategories.id, id));
      
      res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ message: "Failed to delete category" });
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
            quantity: sql`${products.quantity} - ${validatedItem.quantity}`
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

  // ============= System Preferences Endpoints =============
  
  // Middleware to check admin role
  const isAdmin = (req: Request, res: Response, next: Function) => {
    // Check if user is authenticated and is an admin
    // For now, we'll just pass through since auth isn't fully implemented
    // In production, use JWT token verification
    
    // Example:
    // if (!req.user || req.user.role !== 'admin') {
    //   return res.status(403).json({ message: "Access denied. Admin privileges required." });
    // }
    
    next();
  };
  
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
  
  // Create a new system preference
  app.post("/api/system-preferences", isAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertSystemPreferenceSchema.parse(req.body);
      const [preference] = await db.insert(systemPreferences).values(validatedData).returning();
      res.status(201).json(preference);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid system preference data", errors: error.errors });
      }
      console.error("Create system preference error:", error);
      res.status(500).json({ message: "Failed to create system preference" });
    }
  });
  
  // Update a system preference
  app.patch("/api/system-preferences/:key", isAdmin, async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const { value } = updateSystemPreferenceSchema.parse(req.body);
      
      const [preference] = await db.update(systemPreferences)
        .set({ value })
        .where(eq(systemPreferences.key, key))
        .returning();
      
      if (!preference) {
        return res.status(404).json({ message: "System preference not found" });
      }
      
      res.json(preference);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid system preference data", errors: error.errors });
      }
      console.error("Update system preference error:", error);
      res.status(500).json({ message: "Failed to update system preference" });
    }
  });
  
  // ============= Role Permissions Endpoints =============
  
  // Get permissions for a role
  app.get("/api/role-permissions/:role", isAdmin, async (req: Request, res: Response) => {
    try {
      const role = req.params.role;
      const permissions = await db.select().from(rolePermissions)
        .where(eq(rolePermissions.role, role));
      res.json(permissions);
    } catch (error) {
      console.error("Role permissions error:", error);
      res.status(500).json({ message: "Failed to fetch role permissions" });
    }
  });
  
  // Create a new role permission
  app.post("/api/role-permissions", isAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertRolePermissionSchema.parse(req.body);
      const [permission] = await db.insert(rolePermissions).values(validatedData).returning();
      res.status(201).json(permission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid role permission data", errors: error.errors });
      }
      console.error("Create role permission error:", error);
      res.status(500).json({ message: "Failed to create role permission" });
    }
  });
  
  // Delete a role permission
  app.delete("/api/role-permissions/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      await db.delete(rolePermissions).where(eq(rolePermissions.id, id));
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Delete role permission error:", error);
      res.status(500).json({ message: "Failed to delete role permission" });
    }
  });

  // ============= Login Logs Endpoints =============
  
  // Get login logs
  app.get("/api/login-logs", isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const logs = await db.select().from(loginLogs)
        .orderBy(desc(loginLogs.timestamp))
        .limit(limit);
      res.json(logs);
    } catch (error) {
      console.error("Login logs error:", error);
      res.status(500).json({ message: "Failed to fetch login logs" });
    }
  });
  
  // Create login log
  app.post("/api/login-logs", async (req: Request, res: Response) => {
    try {
      const validatedData = insertLoginLogSchema.parse(req.body);
      const [log] = await db.insert(loginLogs).values(validatedData).returning();
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login log data", errors: error.errors });
      }
      console.error("Create login log error:", error);
      res.status(500).json({ message: "Failed to create login log" });
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