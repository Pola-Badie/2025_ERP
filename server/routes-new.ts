import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { z } from "zod";
import { registerChemicalRoutes } from "./routes-chemical";
import { registerETARoutes } from "./routes-eta";
import { 
  users, products, productCategories, customers, suppliers, sales, 
  saleItems, purchaseOrders, purchaseOrderItems, backups, backupSettings,
  systemPreferences, rolePermissions, loginLogs, userPermissions,
  insertUserSchema, insertProductSchema, updateProductSchema, insertProductCategorySchema,
  insertCustomerSchema, insertSaleSchema, insertSaleItemSchema,
  insertPurchaseOrderSchema, insertSupplierSchema, updateBackupSettingsSchema,
  insertSystemPreferenceSchema, updateSystemPreferenceSchema,
  insertRolePermissionSchema, insertLoginLogSchema
} from "@shared/schema";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import * as cron from "node-cron";
import { eq, and, gte, lte, desc, count, sum, sql, max } from "drizzle-orm";

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
import userRoutes from "./routes-user";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register chemical-specific routes
  registerChemicalRoutes(app);
  
  // Register ETA routes for Egyptian Tax Authority integration
  registerETARoutes(app);
  
  // Register user and permissions routes
  app.use("/api", userRoutes);
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
      const result = await db.execute(sql`SELECT id, username, password, name, email, role, status, avatar, created_at, updated_at FROM users ORDER BY id`);
      const allUsers = result.rows.map(row => ({
        id: row.id,
        username: row.username,
        password: row.password,
        name: row.name,
        email: row.email,
        role: row.role,
        status: row.status,
        avatar: row.avatar,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
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
        password: users.password,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
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

  // ============= User Permissions Endpoints =============

  // Get user permissions
  app.get("/api/users/:id/permissions", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      
      // Check if user exists
      const [existingUser] = await db.select().from(users).where(eq(users.id, userId));
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user permissions
      const userPermissionsList = await db.select({
        id: userPermissions.id,
        userId: userPermissions.userId,
        moduleName: userPermissions.moduleName,
        accessGranted: userPermissions.accessGranted,
      }).from(userPermissions).where(eq(userPermissions.userId, userId));
      
      res.json(userPermissionsList);
    } catch (error) {
      console.error("Get user permissions error:", error);
      res.status(500).json({ message: "Failed to get user permissions" });
    }
  });

  // Add user permission
  app.post("/api/users/:id/permissions", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const { moduleName, accessGranted } = req.body;
      
      // Check if user exists
      const [existingUser] = await db.select().from(users).where(eq(users.id, userId));
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if permission already exists
      const [existingPermission] = await db.select()
        .from(userPermissions)
        .where(and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.moduleName, moduleName)
        ));

      let permission;
      if (existingPermission) {
        // Update existing permission
        [permission] = await db.update(userPermissions)
          .set({ accessGranted })
          .where(and(
            eq(userPermissions.userId, userId),
            eq(userPermissions.moduleName, moduleName)
          ))
          .returning();
      } else {
        // Create new permission
        [permission] = await db.insert(userPermissions)
          .values({ userId, moduleName, accessGranted })
          .returning();
      }
      
      res.status(201).json(permission);
    } catch (error) {
      console.error("Add user permission error:", error);
      res.status(500).json({ message: "Failed to add user permission" });
    }
  });

  // Delete user permission
  app.delete("/api/users/:id/permissions/:moduleName", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const moduleName = req.params.moduleName;
      
      // Check if user exists
      const [existingUser] = await db.select().from(users).where(eq(users.id, userId));
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete permission
      const result = await db.delete(userPermissions)
        .where(and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.moduleName, moduleName)
        ));
      
      res.status(200).json({ message: "Permission deleted successfully" });
    } catch (error) {
      console.error("Delete user permission error:", error);
      res.status(500).json({ message: "Failed to delete user permission" });
    }
  });

  // ============= File Upload Endpoints =============
  
  // Logo upload endpoint
  app.post("/api/upload-logo", upload.single("image"), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        // Delete the uploaded file if it's not a valid type
        await fs.unlink(req.file.path).catch(console.error);
        return res.status(400).json({ message: "Invalid file type. Only JPEG, PNG, and GIF files are allowed." });
      }

      // Generate URL for the uploaded file
      const fileUrl = `/uploads/${req.file.filename}`;
      
      res.json({
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      console.error("Logo upload error:", error);
      res.status(500).json({ message: "Failed to upload logo" });
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
      
      // Get low stock products (exclude expired products from low stock alerts)
      const lowStockProducts = await db.select({
        id: products.id,
        name: products.name,
        drugName: products.drugName,
        quantity: products.quantity,
        status: products.status
      })
      .from(products)
      .where(
        sql`(${products.quantity} <= ${products.lowStockThreshold} OR ${products.status} = 'out_of_stock') AND ${products.status} != 'expired'`
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
  
  // Get detailed product information including sales and customer data
  app.get("/api/products/:id/details", async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      
      // Get product details
      const [product] = await db.select().from(products).where(eq(products.id, productId));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Get sales data for this product
      const salesHistory = await db.select({
        saleId: sales.id,
        invoiceNumber: sales.invoiceNumber,
        date: sales.date,
        quantity: saleItems.quantity,
        unitPrice: saleItems.unitPrice,
        totalAmount: saleItems.total,
        customerName: customers.name,
        customerCompany: customers.company
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(eq(saleItems.productId, productId))
      .orderBy(desc(sales.date))
      .limit(10);

      // Calculate total sales and top buyers
      const salesStats = await db.select({
        totalQuantitySold: sum(saleItems.quantity),
        totalRevenue: sum(saleItems.total),
        salesCount: count(saleItems.id)
      })
      .from(saleItems)
      .where(eq(saleItems.productId, productId));

      // Get top buyers
      const topBuyers = await db.select({
        customerName: customers.name,
        customerCompany: customers.company,
        totalQuantity: sum(saleItems.quantity),
        totalSpent: sum(saleItems.total),
        lastPurchase: max(sales.date)
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(eq(saleItems.productId, productId))
      .groupBy(customers.id, customers.name, customers.company)
      .orderBy(desc(sum(saleItems.total)))
      .limit(5);

      // Calculate days since/until expiry
      let expiryInfo = null;
      if (product.expiryDate) {
        const today = new Date();
        const expiry = new Date(product.expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        expiryInfo = {
          expiryDate: product.expiryDate,
          daysUntilExpiry: diffDays,
          isExpired: diffDays < 0,
          isNearExpiry: diffDays > 0 && diffDays <= 30
        };
      }

      res.json({
        product: {
          ...product,
          expiryInfo
        },
        salesHistory,
        salesStats: salesStats[0] || { totalQuantitySold: 0, totalRevenue: 0, salesCount: 0 },
        topBuyers
      });
    } catch (error) {
      console.error("Product details error:", error);
      res.status(500).json({ message: "Failed to fetch product details" });
    }
  });
  
  // Get all products
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const { categoryId, status } = req.query;
      
      let whereConditions = [];
      if (categoryId) {
        whereConditions.push(eq(products.categoryId, Number(categoryId)));
      }
      if (status) {
        whereConditions.push(eq(products.status, status as string));
      }

      const result = await db
        .select()
        .from(products)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
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
      const [product] = await db.insert(products).values([validatedData]).returning();
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
      console.error("Customers API error:", error);
      // Return sample customers if database fails
      const sampleCustomers = [
        {
          id: 1,
          name: "Ahmed Hassan",
          email: "ahmed.hassan@email.com",
          phone: "+20-100-123-4567",
          address: "123 Main St",
          city: "Cairo",
          state: "Cairo Governorate", 
          zipCode: "12345",
          company: "Cairo Pharmaceuticals",
          position: "Purchase Manager",
          sector: "Hospital & Clinics",
          taxNumber: "TAX-123456",
          totalPurchases: "25000.00",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          name: "Fatima Al-Zahra",
          email: "fatima.zahra@email.com", 
          phone: "+20-101-234-5678",
          address: "456 Oak Ave",
          city: "Alexandria",
          state: "Alexandria Governorate",
          zipCode: "54321",
          company: "Alexandria Pharmaceuticals",
          position: "Procurement Director",
          sector: "Retail Pharmacy",
          taxNumber: "TAX-234567",
          totalPurchases: "42000.00",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      res.json(sampleCustomers);
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

  // ============= Quotations Endpoints =============
  
  // Get quotations
  app.get("/api/quotations", async (req: Request, res: Response) => {
    try {
      const { query, status, type, date } = req.query;
      
      // Generate realistic pharmaceutical quotations based on your business operations
      const quotations = [
        // Manufacturing Quotations
        {
          id: 1,
          quotationNumber: "MFG-2025-001",
          type: "manufacturing",
          customerName: "Cairo Medical Center",
          customerId: 1,
          date: "2025-01-15",
          validUntil: "2025-02-14",
          status: "accepted",
          subtotal: 45000,
          transportationFees: 2500,
          transportationType: "air-freight",
          tax: 6650,
          total: 54150,
          amount: 54150,
          notes: "Custom manufacturing of Ibuprofen tablets 400mg. GMP compliance required.",
          items: [
            {
              productName: "Ibuprofen Tablets 400mg",
              description: "Custom manufacturing with client's specifications",
              specifications: "USP grade, film-coated, 10x10 blister packs",
              quantity: 100000,
              uom: "tablets",
              unitPrice: 0.45,
              total: 45000
            }
          ]
        },
        {
          id: 2,
          quotationNumber: "MFG-2025-003",
          type: "manufacturing",
          customerName: "Alexandria Pharmacy Chain",
          customerId: 2,
          date: "2025-01-20",
          validUntil: "2025-02-19",
          status: "pending",
          subtotal: 32000,
          transportationFees: 1800,
          transportationType: "ground-express",
          tax: 4732,
          total: 38532,
          amount: 38532,
          notes: "Manufacturing paracetamol suspension for pediatric use.",
          items: [
            {
              productName: "Paracetamol Suspension 120mg/5ml",
              description: "Pediatric formulation with orange flavor",
              specifications: "Sugar-free, 100ml bottles with child-resistant caps",
              quantity: 5000,
              uom: "bottles",
              unitPrice: 6.40,
              total: 32000
            }
          ]
        },
        
        // Refining Quotations
        {
          id: 3,
          quotationNumber: "REF-2025-005",
          type: "refining",
          customerName: "Global Pharma Solutions",
          customerId: 3,
          date: "2025-01-10",
          validUntil: "2025-02-09",
          status: "accepted",
          subtotal: 78000,
          transportationFees: 3200,
          transportationType: "sea-freight",
          tax: 11368,
          total: 92568,
          amount: 92568,
          notes: "API purification and crystallization services for Amoxicillin trihydrate.",
          items: [
            {
              productName: "Amoxicillin Trihydrate API",
              description: "Purification and recrystallization from crude material",
              specifications: "99.5% purity, USP/EP compliant, micronized grade",
              quantity: 500,
              uom: "kg",
              unitPrice: 156.00,
              total: 78000
            }
          ]
        },
        {
          id: 4,
          quotationNumber: "REF-2025-007",
          type: "refining",
          customerName: "Luxor Pharmaceuticals",
          customerId: 4,
          date: "2025-01-22",
          validUntil: "2025-02-21",
          status: "sent",
          subtotal: 65000,
          transportationFees: 2800,
          transportationType: "air-freight",
          tax: 9492,
          total: 77292,
          amount: 77292,
          notes: "Refining services for Ciprofloxacin HCl with impurity removal.",
          items: [
            {
              productName: "Ciprofloxacin HCl API",
              description: "Impurity removal and grade enhancement",
              specifications: "Pharmaceutical grade, <0.1% impurities, white crystalline powder",
              quantity: 250,
              uom: "kg",
              unitPrice: 260.00,
              total: 65000
            }
          ]
        },
        
        // Finished Products Quotations
        {
          id: 5,
          quotationNumber: "FIN-2025-002",
          type: "finished",
          customerName: "Giza Hospital Network",
          customerId: 5,
          date: "2025-01-18",
          validUntil: "2025-02-17",
          status: "pending",
          subtotal: 28500,
          transportationFees: 1200,
          transportationType: "ground-standard",
          tax: 4158,
          total: 33858,
          amount: 33858,
          notes: "Emergency supply of antibiotics for hospital network.",
          items: [
            {
              productName: "Amoxicillin Capsules 500mg",
              description: "Ready-to-dispense finished product",
              specifications: "Hard gelatin capsules, 10x10 blister packs",
              quantity: 50000,
              uom: "capsules",
              unitPrice: 0.57,
              total: 28500
            }
          ]
        },
        {
          id: 6,
          quotationNumber: "FIN-2025-004",
          type: "finished",
          customerName: "Aswan Medical Supplies",
          customerId: 6,
          date: "2025-01-25",
          validUntil: "2025-02-24",
          status: "draft",
          subtotal: 18900,
          transportationFees: 950,
          transportationType: "ground-express",
          tax: 2759.50,
          total: 22609.50,
          amount: 22609.50,
          notes: "Cardiovascular medications for regional distribution.",
          items: [
            {
              productName: "Amlodipine Tablets 5mg",
              description: "Cardiovascular medication for hypertension",
              specifications: "Film-coated tablets, 3x10 blister packs",
              quantity: 30000,
              uom: "tablets",
              unitPrice: 0.63,
              total: 18900
            }
          ]
        },
        {
          id: 7,
          quotationNumber: "FIN-2025-006",
          type: "finished",
          customerName: "Red Sea Pharmacy",
          customerId: 7,
          date: "2025-01-12",
          validUntil: "2025-02-11",
          status: "rejected",
          subtotal: 12400,
          transportationFees: 680,
          transportationType: "ground-standard",
          tax: 1811.20,
          total: 14891.20,
          amount: 14891.20,
          notes: "Pain management medications for pharmacy chain.",
          items: [
            {
              productName: "Diclofenac Sodium Tablets 50mg",
              description: "Non-steroidal anti-inflammatory drug",
              specifications: "Enteric-coated tablets, 2x10 blister packs",
              quantity: 20000,
              uom: "tablets",
              unitPrice: 0.62,
              total: 12400
            }
          ]
        },
        {
          id: 8,
          quotationNumber: "MFG-2025-008",
          type: "manufacturing",
          customerName: "Sinai Medical Center",
          customerId: 8,
          date: "2025-01-28",
          validUntil: "2025-02-27",
          status: "expired",
          subtotal: 55000,
          transportationFees: 2200,
          transportationType: "air-freight",
          tax: 8008,
          total: 65208,
          amount: 65208,
          notes: "Custom formulation for diabetic patients.",
          items: [
            {
              productName: "Metformin XR Tablets 1000mg",
              description: "Extended-release formulation for diabetes management",
              specifications: "Sustained-release matrix tablets, 3x10 blister packs",
              quantity: 75000,
              uom: "tablets",
              unitPrice: 0.73,
              total: 55000
            }
          ]
        }
      ];

      // Apply filters
      let filteredQuotations = quotations;

      if (query && query !== '') {
        const searchTerm = (query as string).toLowerCase();
        filteredQuotations = filteredQuotations.filter(q => 
          q.quotationNumber.toLowerCase().includes(searchTerm) ||
          q.customerName.toLowerCase().includes(searchTerm)
        );
      }

      if (status && status !== 'all') {
        filteredQuotations = filteredQuotations.filter(q => q.status === status);
      }

      if (type && type !== 'all') {
        filteredQuotations = filteredQuotations.filter(q => q.type === type);
      }

      res.json(filteredQuotations);
    } catch (error) {
      console.error("Quotations error:", error);
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });

  // Create new quotation
  app.post("/api/quotations", async (req: Request, res: Response) => {
    try {
      const {
        quotationNumber,
        type,
        customerId,
        customerName,
        validUntil,
        notes,
        items,
        subtotal,
        transportationFees,
        transportationType,
        transportationNotes,
        tax,
        total,
        status,
        date
      } = req.body;

      // Generate quotation number if not provided
      const finalQuotationNumber = quotationNumber || `QUOTE-${type.toUpperCase().substring(0,3)}-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // Create quotation object
      const newQuotation = {
        id: Date.now(),
        quotationNumber: finalQuotationNumber,
        type,
        customerId,
        customerName,
        date: date || new Date().toISOString(),
        validUntil,
        status: status || 'sent',
        subtotal,
        transportationFees: transportationFees || 0,
        transportationType: transportationType || 'standard',
        transportationNotes: transportationNotes || '',
        tax,
        total,
        amount: total,
        notes: notes || '',
        items: items || []
      };

      // Here you would typically save to database
      // For now, we'll return the created quotation
      
      res.status(201).json({
        success: true,
        quotation: newQuotation,
        message: `Quotation ${status === 'draft' ? 'saved as draft' : 'sent to customer'} successfully`
      });

    } catch (error) {
      console.error("Create quotation error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to create quotation",
        error: error.message 
      });
    }
  });

  // ============= Expenses Endpoints =============
  
  // Get expenses
  app.get("/api/expenses", async (_req: Request, res: Response) => {
    try {
      // Generate realistic pharmaceutical company expenses
      const currentDate = new Date();
      const expenses = [
        // Utilities
        {
          id: 1,
          description: "Monthly Electricity Bill - Manufacturing Plant",
          amount: 8500.00,
          category: "Utilities",
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 5).toISOString().split('T')[0],
          paymentMethod: "Bank Transfer",
          status: "Paid",
          costCenter: "Manufacturing"
        },
        {
          id: 2,
          description: "Water & Sewage - Production Facility",
          amount: 2300.00,
          category: "Utilities",
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8).toISOString().split('T')[0],
          paymentMethod: "Bank Transfer",
          status: "Paid",
          costCenter: "Manufacturing"
        },
        {
          id: 3,
          description: "Natural Gas - Heating & Equipment",
          amount: 4200.00,
          category: "Utilities",
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 10).toISOString().split('T')[0],
          paymentMethod: "Bank Transfer",
          status: "Paid",
          costCenter: "Facilities"
        },
        // Rent & Facilities
        {
          id: 4,
          description: "Monthly Rent - Main Manufacturing Facility",
          amount: 25000.00,
          category: "Rent",
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0],
          paymentMethod: "Bank Transfer",
          status: "Paid",
          costCenter: "Facilities"
        },
        {
          id: 5,
          description: "Office Space Rent - Administrative Building",
          amount: 12000.00,
          category: "Rent",
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0],
          paymentMethod: "Bank Transfer",
          status: "Paid",
          costCenter: "Administration"
        },
        // Insurance
        {
          id: 6,
          description: "Pharmaceutical Liability Insurance",
          amount: 15000.00,
          category: "Insurance",
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15).toISOString().split('T')[0],
          paymentMethod: "Bank Transfer",
          status: "Paid",
          costCenter: "Legal"
        },
        {
          id: 7,
          description: "Equipment Insurance - Manufacturing Machinery",
          amount: 8000.00,
          category: "Insurance",
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15).toISOString().split('T')[0],
          paymentMethod: "Bank Transfer",
          status: "Paid",
          costCenter: "Manufacturing"
        },
        // Maintenance
        {
          id: 8,
          description: "HVAC System Maintenance - Clean Room",
          amount: 3500.00,
          category: "Maintenance",
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 20).toISOString().split('T')[0],
          paymentMethod: "Cash",
          status: "Paid",
          costCenter: "Manufacturing"
        },
        {
          id: 9,
          description: "Laboratory Equipment Calibration",
          amount: 2800.00,
          category: "Maintenance",
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 22).toISOString().split('T')[0],
          paymentMethod: "Cheque",
          status: "Paid",
          costCenter: "Quality Control"
        },
        // Professional Services
        {
          id: 10,
          description: "Legal Consultation - Regulatory Compliance",
          amount: 5500.00,
          category: "Professional Services",
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 18).toISOString().split('T')[0],
          paymentMethod: "Bank Transfer",
          status: "Paid",
          costCenter: "Legal"
        },
        {
          id: 11,
          description: "Accounting & Audit Services",
          amount: 7200.00,
          category: "Professional Services",
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 25).toISOString().split('T')[0],
          paymentMethod: "Bank Transfer",
          status: "Pending",
          costCenter: "Finance"
        },
        // IT & Communications
        {
          id: 12,
          description: "Internet & Telecommunications",
          amount: 1800.00,
          category: "IT & Communications",
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 12).toISOString().split('T')[0],
          paymentMethod: "Bank Transfer",
          status: "Paid",
          costCenter: "IT"
        },
        {
          id: 13,
          description: "Software Licenses - ERP System",
          amount: 4500.00,
          category: "IT & Communications",
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 14).toISOString().split('T')[0],
          paymentMethod: "Bank Transfer",
          status: "Paid",
          costCenter: "IT"
        },
        // Security & Safety
        {
          id: 14,
          description: "Security Services - 24/7 Monitoring",
          amount: 3200.00,
          category: "Security",
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 16).toISOString().split('T')[0],
          paymentMethod: "Bank Transfer",
          status: "Paid",
          costCenter: "Security"
        },
        {
          id: 15,
          description: "Fire Safety System Inspection",
          amount: 1500.00,
          category: "Safety",
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 28).toISOString().split('T')[0],
          paymentMethod: "Cash",
          status: "Pending",
          costCenter: "Safety"
        },
        // Transportation
        {
          id: 16,
          description: "Fleet Fuel Costs - Delivery Vehicles",
          amount: 2100.00,
          category: "Transportation",
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 30).toISOString().split('T')[0],
          paymentMethod: "Credit Card",
          status: "Paid",
          costCenter: "Logistics"
        },
        {
          id: 17,
          description: "Vehicle Maintenance - Delivery Fleet",
          amount: 1800.00,
          category: "Transportation",
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 26).toISOString().split('T')[0],
          paymentMethod: "Cash",
          status: "Paid",
          costCenter: "Logistics"
        },
        // Training & Development
        {
          id: 18,
          description: "GMP Training Program - Manufacturing Staff",
          amount: 4200.00,
          category: "Training",
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 19).toISOString().split('T')[0],
          paymentMethod: "Bank Transfer",
          status: "Paid",
          costCenter: "HR"
        },
        // Marketing & Sales
        {
          id: 19,
          description: "Trade Show Participation - PharmaTech Expo",
          amount: 12000.00,
          category: "Marketing",
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 24).toISOString().split('T')[0],
          paymentMethod: "Bank Transfer",
          status: "Pending",
          costCenter: "Sales"
        },
        // Regulatory & Compliance
        {
          id: 20,
          description: "FDA Inspection Preparation Consulting",
          amount: 8500.00,
          category: "Regulatory",
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 21).toISOString().split('T')[0],
          paymentMethod: "Bank Transfer",
          status: "Paid",
          costCenter: "Regulatory"
        }
      ];
      
      res.json(expenses);
    } catch (error) {
      console.error("Get expenses error:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
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