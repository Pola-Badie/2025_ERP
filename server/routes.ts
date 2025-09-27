
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db, pool } from "./db";
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
  insertProductCategorySchema,
  insertSystemPreferenceSchema,
  updateSystemPreferenceSchema,
  insertRolePermissionSchema,
  insertLoginLogSchema,
  insertQuotationSchema,
  insertQuotationItemSchema,
  insertQuotationPackagingItemSchema,
  quotationPackagingItems,
  insertOrderSchema,
  insertOrderItemSchema,
  insertOrderFeeSchema,
  insertExpenseSchema,
  insertWarehouseSchema,
  insertWarehouseInventorySchema,
  updateWarehouseInventorySchema,
  users,
  sales,
  orders,
  products,
  warehouseInventory,
  warehouses,
  expenseCategories,
  expenses,
  backupSettings,
  backups
} from "@shared/schema";
import { eq, sql, or, desc, and, like, gte, lte, inArray, between } from "drizzle-orm";
import { registerAccountingRoutes } from "./routes-accounting";
import userRoutes from "./routes-user";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import * as cron from "node-cron";

// Declare cronJobs object to hold cron job instances
const cronJobs: {
  daily?: cron.ScheduledTask;
  weekly?: cron.ScheduledTask;
  monthly?: cron.ScheduledTask;
} = {};

// Setup automatic backups function
async function setupAutomaticBackups() {
  try {
    // Stop existing cron jobs
    Object.values(cronJobs).forEach(job => {
      if (job) {
        job.destroy();
      }
    });

    // Get backup settings
    const backupSettingsList = await db.select().from(backupSettings).limit(1);
    const settings = backupSettingsList[0];

    if (!settings || !settings.dailyBackup) {
      console.log('Automatic backups are disabled');
      return;
    }

    // Schedule daily backup
    if (settings.dailyBackup) {
      const backupTime = settings.backupTime || '02:00';
      const [hour, minute] = backupTime.split(':');
      
      cronJobs.daily = cron.schedule(`${minute} ${hour} * * *`, async () => {
        console.log('Running scheduled daily backup...');
        try {
          await storage.performBackup('daily');
        } catch (error) {
          console.error('Daily backup failed:', error);
        }
      }, {
        timezone: 'Africa/Cairo'
      });
      
      console.log(`Daily backup scheduled at ${backupTime}`);
    }

    // Schedule weekly backup
    if (settings.weeklyBackup) {
      const backupTime = settings.backupTime || '02:00';
      const [hour, minute] = backupTime.split(':');
      
      cronJobs.weekly = cron.schedule(`${minute} ${hour} * * 0`, async () => {
        console.log('Running scheduled weekly backup...');
        try {
          await storage.performBackup('weekly');
        } catch (error) {
          console.error('Weekly backup failed:', error);
        }
      }, {
        timezone: 'Africa/Cairo'
      });
      
      console.log(`Weekly backup scheduled at ${backupTime} on Sundays`);
    }

    // Schedule monthly backup
    if (settings.monthlyBackup) {
      const backupTime = settings.backupTime || '02:00';
      const [hour, minute] = backupTime.split(':');
      
      cronJobs.monthly = cron.schedule(`${minute} ${hour} 1 * *`, async () => {
        console.log('Running scheduled monthly backup...');
        try {
          await storage.performBackup('monthly');
        } catch (error) {
          console.error('Monthly backup failed:', error);
        }
      }, {
        timezone: 'Africa/Cairo'
      });
      
      console.log(`Monthly backup scheduled at ${backupTime} on the 1st of each month`);
    }

  } catch (error) {
    console.error('Failed to setup automatic backups:', error);
  }
}

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

  // Register accounting routes
  registerAccountingRoutes(app);

  // Register user management routes
  app.use('/api', userRoutes);

  // Register payment processing routes
  try {
    const { registerPaymentProcessingRoutes } = require("./routes-payment-processing");
    registerPaymentProcessingRoutes(app);
  } catch (err) {
    console.log("Payment processing routes not loaded:", err);
  }

  // Schedule automatic backups
  setupAutomaticBackups();

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

  // Get raw materials (for production orders)
  app.get("/api/products/raw-materials", (req: Request, res: Response) => {
    try {
      console.log("Fetching raw materials for chemical orders");

      // Sample raw materials data for chemical orders
      const sampleRawMaterials = [
        {
          id: 101,
          name: "Sulfuric Acid",
          drugName: "H2SO4",
          description: "Strong mineral acid with many industrial applications",
          sku: "RAW-001",
          costPrice: "120.00",
          sellingPrice: "0.00",
          productType: "raw",
          status: "active",
          quantity: 500,
          unitOfMeasure: "L"
        },
        {
          id: 102,
          name: "Sodium Hydroxide",
          drugName: "NaOH",
          description: "Highly caustic base and alkali salt",
          sku: "RAW-002",
          costPrice: "150.00",
          sellingPrice: "0.00",
          productType: "raw",
          status: "active",
          quantity: 350,
          unitOfMeasure: "kg"
        },
        {
          id: 103,
          name: "Ethanol",
          drugName: "C2H5OH",
          description: "Primary alcohol used as a solvent",
          sku: "RAW-003",
          costPrice: "95.00",
          sellingPrice: "0.00",
          productType: "raw",
          status: "active",
          quantity: 200,
          unitOfMeasure: "L"
        },
        {
          id: 104,
          name: "Hydrochloric Acid",
          drugName: "HCl",
          description: "Strong acid with applications in laboratory and industrial settings",
          sku: "RAW-004",
          costPrice: "110.00",
          sellingPrice: "0.00",
          productType: "raw",
          status: "active",
          quantity: 300,
          unitOfMeasure: "L"
        },
        {
          id: 105,
          name: "Citric Acid",
          drugName: "C6H8O7",
          description: "Weak organic acid found in citrus fruits, used as preservative and flavoring",
          sku: "RAW-005",
          costPrice: "85.00",
          sellingPrice: "0.00",
          productType: "raw",
          status: "active",
          quantity: 250,
          unitOfMeasure: "kg"
        }
      ];

      res.json(sampleRawMaterials);

    } catch (error) {
      console.error("Error fetching raw materials:", error);
      res.status(500).json({ message: "Failed to fetch raw materials", error: String(error) });
    }
  });

  // Get semi-finished products (for refining orders)
  app.get("/api/products/semi-finished", (req: Request, res: Response) => {
    try {
      console.log("Fetching semi-finished products for chemical orders");

      const sampleSemiFinishedProducts = [
        {
          id: 201,
          name: "Acetylsalicylic Acid Solution",
          drugName: "C9H8O4 Solution",
          description: "Semi-refined acetylsalicylic acid solution ready for final processing",
          sku: "SF-001",
          costPrice: "250.00",
          sellingPrice: "0.00",
          productType: "semi-raw",
          status: "active",
          quantity: 150,
          unitOfMeasure: "L",
          batchNumber: "CHEM-0001-250522"
        },
        {
          id: 202,
          name: "Paracetamol Base",
          drugName: "C8H9NO2 Base",
          description: "Partially processed paracetamol base compound",
          sku: "SF-002",
          costPrice: "220.00",
          sellingPrice: "0.00",
          productType: "semi-raw",
          status: "active",
          quantity: 100,
          unitOfMeasure: "kg",
          batchNumber: "CHEM-0002-250522"
        },
        {
          id: 203,
          name: "Caffeine Isolate",
          drugName: "C8H10N4O2 Isolate",
          description: "Purified caffeine extract in intermediate form",
          sku: "SF-003",
          costPrice: "280.00",
          sellingPrice: "0.00",
          productType: "semi-raw",
          status: "active",
          quantity: 75,
          unitOfMeasure: "kg",
          batchNumber: "CHEM-0003-250522"
        },
        {
          id: 204,
          name: "Diclofenac Sodium Base",
          drugName: "C14H10Cl2NNaO2 Base",
          description: "Semi-processed diclofenac sodium for pharmaceutical applications",
          sku: "SF-004",
          costPrice: "310.00",
          sellingPrice: "0.00",
          productType: "semi-raw",
          status: "active",
          quantity: 60,
          unitOfMeasure: "kg",
          batchNumber: "CHEM-0004-250522"
        },
        {
          id: 205,
          name: "Ibuprofen Intermediate",
          drugName: "C13H18O2 Intermediate",
          description: "Partially refined ibuprofen for anti-inflammatory medications",
          sku: "SF-005",
          costPrice: "245.00",
          sellingPrice: "0.00",
          productType: "semi-raw",
          status: "active",
          quantity: 120,
          unitOfMeasure: "kg",
          batchNumber: "CHEM-0005-250522"
        }
      ];

      res.json(sampleSemiFinishedProducts);

    } catch (error) {
      console.error("Error fetching semi-finished products:", error);
      res.status(500).json({ message: "Failed to fetch semi-finished products", error: String(error) });
    }
  });

  // Create new product
  app.post("/api/products", upload.single("image"), async (req: Request, res: Response) => {
    try {
      const productData = {
        ...req.body,
        categoryId: typeof req.body.categoryId === 'string' ? Number(req.body.categoryId) : req.body.categoryId,
        quantity: typeof req.body.quantity === 'string' ? Number(req.body.quantity) : req.body.quantity,
        costPrice: typeof req.body.costPrice === 'string' ? Number(req.body.costPrice) : req.body.costPrice,
        sellingPrice: typeof req.body.sellingPrice === 'string' ? Number(req.body.sellingPrice) : req.body.sellingPrice,
        lowStockThreshold: req.body.lowStockThreshold ? Number(req.body.lowStockThreshold) : undefined,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined
      };

      const validatedData = insertProductSchema.parse(productData);

      if (req.file) {
        validatedData.imagePath = req.file.path;
      }

      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);

      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }

      res.status(500).json({ message: "Failed to create product", error: String(error) });
    }
  });

  // Update product
  app.patch("/api/products/:id", upload.single("image"), async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      console.log('🔥 PRODUCT UPDATE - Raw request body:', JSON.stringify(req.body, null, 2));

      const validatedData = updateProductSchema.parse({
        ...req.body,
        categoryId: typeof req.body.categoryId === 'string' ? Number(req.body.categoryId) : req.body.categoryId,
        costPrice: typeof req.body.costPrice === 'string' ? Number(req.body.costPrice) : req.body.costPrice,
        sellingPrice: typeof req.body.sellingPrice === 'string' ? Number(req.body.sellingPrice) : req.body.sellingPrice,
        quantity: typeof req.body.quantity === 'string' ? Number(req.body.quantity) : req.body.quantity,
        lowStockThreshold: req.body.lowStockThreshold ? Number(req.body.lowStockThreshold) : undefined,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined
      });

      console.log('🔥 PRODUCT UPDATE - Validated data:', JSON.stringify(validatedData, null, 2));

      if (req.file) {
        validatedData.imagePath = req.file.path;
      }

      const product = await storage.updateProduct(id, validatedData);

      console.log('🔥 PRODUCT UPDATE - Updated product result:', JSON.stringify(product, null, 2));

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      console.error('🔥 PRODUCT UPDATE - Error:', error);
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

  // ============= Quotation Endpoints =============

  // Default terms and conditions for quotations
  const DEFAULT_TERMS_CONDITIONS = `1. Validity: This quotation is valid for 30 days from the date of issue.

2. Payment Terms: 50% advance payment required upon order confirmation. Balance due upon completion/delivery.

3. Quality Assurance: All pharmaceutical services comply with GMP standards and regulatory requirements as per Egyptian Drug Authority guidelines.

4. Delivery: Delivery times are estimates and subject to production schedules, regulatory approvals, and raw material availability.

5. Changes: Any changes to specifications, quantities, or requirements after quotation acceptance may affect pricing and delivery timelines.

6. Liability: Our liability is limited to the value of services provided. We maintain comprehensive insurance coverage for pharmaceutical operations.`;

  // Get all quotations
  app.get("/api/quotations", async (req: Request, res: Response) => {
    try {
      console.log("Fetching quotations from database...");

      const { query, status, date } = req.query;
      const quotations = await storage.getQuotations(
        (query as string) || '', 
        (status as string) || '', 
        (date as string) || ''
      );
      console.log(`Found ${quotations.length} quotations in database`);

      if (quotations.length > 0) {
        console.log('First quotation from storage:', {
          id: quotations[0].id,
          quotationNumber: quotations[0].quotationNumber,
          customerId: quotations[0].customerId,
          termsAndConditions: quotations[0].termsAndConditions ? 'HAS_TERMS' : 'NO_TERMS'
        });
      }

      const transformedQuotations = await Promise.all(
        quotations.map(async (quotation) => {
          let customerName = "Unknown Customer";
          if (quotation.customerId) {
            try {
              const customer = await storage.getCustomer(quotation.customerId);
              customerName = customer?.name || "Unknown Customer";
            } catch (error) {
              console.error("Error fetching customer:", error);
            }
          }

          let items = [];
          try {
            const quotationItems = await storage.getQuotationItems(quotation.id);
            items = await Promise.all(
              quotationItems.map(async (item) => {
                let productName = "Unknown Product";
                try {
                  const product = await storage.getProduct(item.productId);
                  productName = product?.name || "Unknown Product";
                } catch (error) {
                  console.error("Error fetching product:", error);
                }

                return {
                  id: item.id.toString(),
                  type: "finished",
                  productName: productName,
                  description: productName,
                  quantity: parseInt(item.quantity.toString()),
                  uom: "piece",
                  unitPrice: parseFloat(item.unitPrice.toString()),
                  total: parseFloat(item.total.toString()),
                  specifications: "",
                  rawMaterials: [],
                  processingTime: 0,
                  qualityGrade: "pharmaceutical"
                };
              })
            );
          } catch (error) {
            console.error("Error fetching quotation items:", error);
          }

          let packagingItems = [];
          try {
            const dbPackagingItems = await db.select()
              .from(quotationPackagingItems)
              .where(eq(quotationPackagingItems.quotationId, quotation.id))
              .orderBy(quotationPackagingItems.id);

            packagingItems = dbPackagingItems.map(item => ({
              id: item.id.toString(),
              type: item.type || 'container',
              description: item.description || '',
              quantity: parseInt(item.quantity?.toString() || '1'),
              unitPrice: parseFloat(item.unitPrice?.toString() || '0'),
              total: parseFloat(item.total?.toString() || '0'),
              notes: item.notes || ''
            }));
          } catch (error) {
            console.error("Error fetching packaging items:", error);
          }

          return {
            id: quotation.id,
            quotationNumber: quotation.quotationNumber,
            type: "finished",
            customerName: customerName,
            customerId: quotation.customerId || 0,
            date: quotation.issueDate ? new Date(quotation.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            validUntil: quotation.validUntil ? new Date(quotation.validUntil).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            notes: quotation.notes || "",
            subtotal: parseFloat(quotation.subtotal?.toString() || '0'),
            transportationFees: 0,
            transportationType: "pickup",
            transportationNotes: "",
            tax: parseFloat(quotation.taxAmount?.toString() || '0'),
            total: parseFloat(quotation.grandTotal?.toString() || '0'),
            amount: parseFloat(quotation.grandTotal?.toString() || '0'),
            status: quotation.status || 'pending',
            termsAndConditions: "HARDCODED TERMS TEST - This should appear in API response",
            items: items,
            packagingItems: packagingItems
          };
        })
      );

      // Apply query filters from frontend
      let filteredQuotations = [...transformedQuotations];

      if (query && query !== '') {
        const searchTerm = (query as string).toLowerCase();
        filteredQuotations = filteredQuotations.filter(quotation =>
          quotation.quotationNumber.toLowerCase().includes(searchTerm) ||
          quotation.customerName.toLowerCase().includes(searchTerm) ||
          quotation.items.some(item => 
            item.productName.toLowerCase().includes(searchTerm)
          )
        );
      }

      if (status && status !== 'all') {
        filteredQuotations = filteredQuotations.filter(quotation => quotation.status === status);
      }

      if (date !== 'all') {
        const now = new Date();
        filteredQuotations = filteredQuotations.filter(q => {
          const quotationDate = new Date(q.date);
          switch (date) {
            case 'today':
              return quotationDate.toDateString() === now.toDateString();
            case 'week':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              return quotationDate >= weekAgo;
            case 'month':
              const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
              return quotationDate >= monthAgo;
            case 'year':
              const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
              return quotationDate >= yearAgo;
            default:
              return true;
          }
        });
      }

      console.log(`🗃️ QUOTATIONS: Returning ${filteredQuotations.length} from DB (no static fallback)`);

      if (filteredQuotations.length > 0) {
        console.log('🔍 FIRST QUOTATION HAS TERMS:', !!filteredQuotations[0].termsAndConditions);
        console.log('🔍 TERMS LENGTH:', filteredQuotations[0].termsAndConditions?.length || 'UNDEFINED');
      }

      res.json(filteredQuotations);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });

  // Get quotation by ID
  app.get("/api/quotations/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const quotation = await storage.getQuotation(id);

      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      const items = await storage.getQuotationItems(id);

      res.json({
        ...quotation,
        items
      });
    } catch (error) {
      console.error("Error fetching quotation:", error);
      res.status(500).json({ message: "Failed to fetch quotation" });
    }
  });

  // Update quotation status
  app.patch("/api/quotations/:id/status", async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const id = Number(req.params.id);

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      await storage.updateQuotationStatus(id, status);
      res.json({ message: "Status updated successfully" });
    } catch (error) {
      console.error("Error updating quotation status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Delete quotation
  app.delete("/api/quotations/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteQuotation(id);

      if (!success) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting quotation:", error);
      res.status(500).json({ message: "Failed to delete quotation" });
    }
  });

  // Create new quotation
  app.post("/api/quotations", async (req: Request, res: Response) => {
    try {
      console.log("POST /api/quotations body keys:", Object.keys(req.body));
      console.log("packagingItems type:", typeof req.body.packagingItems, "length:", req.body.packagingItems?.length);

      const rawPackagingItems = req.body.packagingItems ?? req.body.packaging_items ?? req.body.packaging;
      let packagingItems = [];

      if (rawPackagingItems) {
        if (Array.isArray(rawPackagingItems)) {
          packagingItems = rawPackagingItems;
        } else if (typeof rawPackagingItems === 'string') {
          try {
            packagingItems = JSON.parse(rawPackagingItems);
          } catch (parseError) {
            console.error("Failed to parse packagingItems string:", parseError);
            packagingItems = [];
          }
        } else if (typeof rawPackagingItems === 'object') {
          packagingItems = [rawPackagingItems];
        }
      }

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

      console.log("Creating quotation with data:", { 
        quotationNumber, 
        customerId, 
        items: items?.length || 0, 
        packagingItems: packagingItems?.length || 0 
      });

      const finalQuotationNumber = quotationNumber || `QUO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      const quotationData = {
        quotationNumber: finalQuotationNumber,
        customerId: customerId || null,
        userId: 1,
        issueDate: date ? new Date(date) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        subtotal: parseFloat(subtotal?.toString() || '0'),
        taxRate: tax && subtotal ? (Number(tax) / Number(subtotal) * 100) : 0,
        taxAmount: parseFloat(tax?.toString() || '0'),
        totalAmount: parseFloat(total?.toString() || '0'),
        grandTotal: parseFloat(total?.toString() || '0'),
        status: status || 'pending',
        notes: notes || null,
      };

      const quotation = await storage.createQuotation(quotationData);
      console.log("Created quotation:", quotation.id);

      if (items && items.length > 0) {
        console.log("Saving", items.length, "quotation items");
        for (const item of items) {
          const itemData = {
            quotationId: quotation.id,
            productId: item.productId || 1,
            quantity: Number(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice?.toString() || '0'),
            discount: parseFloat(item.discount?.toString() || '0'),
            total: parseFloat(item.total?.toString() || '0'),
          };
          await storage.createQuotationItem(itemData);
        }
      }

      if (packagingItems && packagingItems.length > 0) {
        console.log("Processing", packagingItems.length, "packaging items");

        for (let i = 0; i < packagingItems.length; i++) {
          const packagingItem = packagingItems[i];
          console.log(`Processing packaging item ${i + 1}:`, packagingItem);

          try {
            const rawPackagingItemData = {
              quotationId: quotation.id,
              type: packagingItem.type || 'container',
              description: packagingItem.description || '',
              quantity: Number(packagingItem.quantity) || 1,
              unitPrice: parseFloat(packagingItem.unitPrice?.toString() || '0').toString(),
              total: parseFloat(packagingItem.total?.toString() || '0').toString(),
              notes: packagingItem.notes || null
            };

            console.log(`Raw packaging item data ${i + 1}:`, rawPackagingItemData);

            const validatedPackagingItemData = insertQuotationPackagingItemSchema.parse(rawPackagingItemData);
            console.log(`Validated packaging item data ${i + 1}:`, validatedPackagingItemData);

            const insertResult = await db.insert(quotationPackagingItems).values(validatedPackagingItemData);
            console.log(`Successfully saved packaging item ${i + 1}:`, insertResult);

          } catch (validationError) {
            console.error(`Validation error for packaging item ${i + 1}:`, validationError);
            if (validationError instanceof z.ZodError) {
              console.error("Zod validation details:", validationError.errors);
            }
            throw validationError;
          }
        }
      }

      res.status(201).json({
        success: true,
        quotation: quotation,
        message: `Quotation ${status === 'draft' ? 'saved as draft' : 'created'} successfully`
      });

    } catch (error) {
      console.error("Create quotation error:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid quotation data", errors: error.errors });
      }

      res.status(500).json({ message: "Failed to create quotation", error: String(error) });
    }
  });

  // ============= Customer Endpoints =============
  // Get all customers
  app.get("/api/customers", async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      const customers = await storage.getCustomers(query as string || '');
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
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
      console.error("Error fetching customer:", error);
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
      console.error("Error creating customer:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  // Update customer
  app.patch("/api/customers/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const validatedData = insertCustomerSchema.parse(req.body); // Reusing insert schema for update as fields are similar
      const customer = await storage.updateCustomer(id, validatedData);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  // Delete customer
  app.delete("/api/customers/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteCustomer(id);
      if (!success) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // ============= Sales Endpoints =============
  // Get all sales
  app.get("/api/sales", async (req: Request, res: Response) => {
    try {
      const { query, date } = req.query;
      const sales = await storage.getSales(query as string || '', date as string || 'all');
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  // Get sale by ID
  app.get("/api/sales/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      // Fetch sale items
      const saleItems = await storage.getSaleItems(id);
      res.json({ ...sale, items: saleItems });
    } catch (error) {
      console.error("Error fetching sale:", error);
      res.status(500).json({ message: "Failed to fetch sale" });
    }
  });

  // Create new sale
  app.post("/api/sales", async (req: Request, res: Response) => {
    try {
      const { items, ...saleData } = req.body;
      const validatedSaleData = insertSaleSchema.parse(saleData);
      const sale = await storage.createSale(validatedSaleData);

      if (items && items.length > 0) {
        for (const item of items) {
          const validatedItemData = insertSaleItemSchema.parse({
            ...item,
            saleId: sale.id,
          });
          await storage.createSaleItem(validatedItemData);
        }
      }
      res.status(201).json(sale);
    } catch (error) {
      console.error("Error creating sale:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sale data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  // Update sale
  app.patch("/api/sales/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { items, ...saleData } = req.body;
      const validatedSaleData = insertSaleSchema.parse(saleData); // Reusing insert schema for update
      const sale = await storage.updateSale(id, validatedSaleData);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }

      // Update sale items
      if (items) {
        // Delete existing items and insert new ones
        await storage.deleteSaleItems(id);
        for (const item of items) {
          const validatedItemData = insertSaleItemSchema.parse({
            ...item,
            saleId: id,
          });
          await storage.createSaleItem(validatedItemData);
        }
      }
      res.json(sale);
    } catch (error) {
      console.error("Error updating sale:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sale data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update sale" });
    }
  });

  // Delete sale
  app.delete("/api/sales/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteSale(id);
      if (!success) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting sale:", error);
      res.status(500).json({ message: "Failed to delete sale" });
    }
  });

  // ============= Purchase Order Endpoints =============
  // Get all purchase orders
  app.get("/api/purchase-orders", async (req: Request, res: Response) => {
    try {
      const { query, status } = req.query;
      const orders = await storage.getPurchaseOrders(query as string || '', status as string || 'all');
      res.json(orders);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });

  // Get purchase order by ID
  app.get("/api/purchase-orders/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const order = await storage.getPurchaseOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching purchase order:", error);
      res.status(500).json({ message: "Failed to fetch purchase order" });
    }
  });

  // Create new purchase order
  app.post("/api/purchase-orders", async (req: Request, res: Response) => {
    try {
      const validatedData = insertPurchaseOrderSchema.parse(req.body);
      const order = await storage.createPurchaseOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating purchase order:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid purchase order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create purchase order" });
    }
  });

  // Update purchase order
  app.patch("/api/purchase-orders/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const validatedData = insertPurchaseOrderSchema.parse(req.body); // Reusing insert schema for update
      const order = await storage.updatePurchaseOrder(id, validatedData);
      if (!order) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error updating purchase order:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid purchase order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update purchase order" });
    }
  });

  // Delete purchase order
  app.delete("/api/purchase-orders/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deletePurchaseOrder(id);
      if (!success) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting purchase order:", error);
      res.status(500).json({ message: "Failed to delete purchase order" });
    }
  });

  // ============= Supplier Endpoints =============
  // Get all suppliers
  app.get("/api/suppliers", async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      const suppliers = await storage.getSuppliers(query as string || '');
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
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
      console.error("Error fetching supplier:", error);
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
      console.error("Error creating supplier:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  // Update supplier
  app.patch("/api/suppliers/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const validatedData = insertSupplierSchema.parse(req.body); // Reusing insert schema for update
      const supplier = await storage.updateSupplier(id, validatedData);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  // Delete supplier
  app.delete("/api/suppliers/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteSupplier(id);
      if (!success) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // ============= Product Category Endpoints =============
  // Get all product categories
  app.get("/api/product-categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getProductCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching product categories:", error);
      res.status(500).json({ message: "Failed to fetch product categories" });
    }
  });

  // Create new product category
  app.post("/api/product-categories", async (req: Request, res: Response) => {
    try {
      const validatedData = insertProductCategorySchema.parse(req.body);
      const category = await storage.createProductCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating product category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product category" });
    }
  });

  // Update product category
  app.patch("/api/product-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const validatedData = insertProductCategorySchema.parse(req.body); // Reusing insert schema for update
      const category = await storage.updateProductCategory(id, validatedData);
      if (!category) {
        return res.status(404).json({ message: "Product category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating product category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product category" });
    }
  });

  // Delete product category
  app.delete("/api/product-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteProductCategory(id);
      if (!success) {
        return res.status(404).json({ message: "Product category not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product category:", error);
      res.status(500).json({ message: "Failed to delete product category" });
    }
  });

  // ============= System Preference Endpoints =============
  // Get system preferences
  app.get("/api/system-preferences", async (req: Request, res: Response) => {
    try {
      const preferences = await storage.getSystemPreferences();
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching system preferences:", error);
      res.status(500).json({ message: "Failed to fetch system preferences" });
    }
  });

  // Update system preferences
  app.patch("/api/system-preferences/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const validatedData = updateSystemPreferenceSchema.parse(req.body);
      const preferences = await storage.updateSystemPreference(id, validatedData);
      if (!preferences) {
        return res.status(404).json({ message: "System preferences not found" });
      }
      res.json(preferences);
    } catch (error) {
      console.error("Error updating system preferences:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid system preferences data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update system preferences" });
    }
  });

  // ============= Backup Settings Endpoints =============
  // Get backup settings
  app.get("/api/backup-settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getBackupSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching backup settings:", error);
      res.status(500).json({ message: "Failed to fetch backup settings" });
    }
  });

  // Update backup settings
  app.patch("/api/backup-settings", async (req: Request, res: Response) => {
    try {
      const validatedData = updateBackupSettingsSchema.parse(req.body);
      const settings = await storage.updateBackupSettings(validatedData);
      // Re-setup cron jobs based on new settings
      setupAutomaticBackups();
      res.json(settings);
    } catch (error) {
      console.error("Error updating backup settings:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid backup settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update backup settings" });
    }
  });

  // ============= Log Endpoints =============
  // Get login logs
  app.get("/api/login-logs", async (req: Request, res: Response) => {
    try {
      const logs = await storage.getLoginLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching login logs:", error);
      res.status(500).json({ message: "Failed to fetch login logs" });
    }
  });

  // ============= Role Permission Endpoints =============
  // Get all role permissions
  app.get("/api/role-permissions", async (req: Request, res: Response) => {
    try {
      const permissions = await storage.getRolePermissions();
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ message: "Failed to fetch role permissions" });
    }
  });

  // Create role permission
  app.post("/api/role-permissions", async (req: Request, res: Response) => {
    try {
      const validatedData = insertRolePermissionSchema.parse(req.body);
      const permission = await storage.createRolePermission(validatedData);
      res.status(201).json(permission);
    } catch (error) {
      console.error("Error creating role permission:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid role permission data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create role permission" });
    }
  });

  // Update role permission
  app.patch("/api/role-permissions/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const validatedData = insertRolePermissionSchema.parse(req.body); // Reusing insert schema for update
      const permission = await storage.updateRolePermission(id, validatedData);
      if (!permission) {
        return res.status(404).json({ message: "Role permission not found" });
      }
      res.json(permission);
    } catch (error) {
      console.error("Error updating role permission:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid role permission data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update role permission" });
    }
  });

  // Delete role permission
  app.delete("/api/role-permissions/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteRolePermission(id);
      if (!success) {
        return res.status(404).json({ message: "Role permission not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting role permission:", error);
      res.status(500).json({ message: "Failed to delete role permission" });
    }
  });

  // ============= Warehouse Endpoints =============
  // Get all warehouses
  app.get('/api/warehouses', async (req: Request, res: Response) => {
    try {
      const warehouses = await storage.getWarehouses();
      res.json(warehouses);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      res.status(500).json({ message: 'Failed to fetch warehouses' });
    }
  });

  // Create a new warehouse
  app.post('/api/warehouses', async (req: Request, res: Response) => {
    try {
      const validatedData = insertWarehouseSchema.parse(req.body);
      const warehouse = await storage.createWarehouse(validatedData);
      res.status(201).json(warehouse);
    } catch (error) {
      console.error('Error creating warehouse:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid warehouse data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create warehouse' });
    }
  });

  // Update a warehouse
  app.patch('/api/warehouses/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const validatedData = insertWarehouseSchema.parse(req.body); // Reusing insert schema for update
      const warehouse = await storage.updateWarehouse(id, validatedData);
      if (!warehouse) {
        return res.status(404).json({ message: 'Warehouse not found' });
      }
      res.json(warehouse);
    } catch (error) {
      console.error('Error updating warehouse:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid warehouse data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update warehouse' });
    }
  });

  // Delete a warehouse
  app.delete('/api/warehouses/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteWarehouse(id);
      if (!success) {
        return res.status(404).json({ message: 'Warehouse not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      res.status(500).json({ message: 'Failed to delete warehouse' });
    }
  });

  // ============= Warehouse Inventory Endpoints =============
  // Get warehouse inventory
  app.get('/api/warehouse-inventory', async (req: Request, res: Response) => {
    try {
      const inventory = await storage.getWarehouseInventory();
      res.json(inventory);
    } catch (error) {
      console.error('Error fetching warehouse inventory:', error);
      res.status(500).json({ message: 'Failed to fetch warehouse inventory' });
    }
  });

  // Add item to warehouse inventory
  app.post('/api/warehouse-inventory', async (req: Request, res: Response) => {
    try {
      const validatedData = insertWarehouseInventorySchema.parse(req.body);
      const inventoryItem = await storage.addWarehouseInventory(validatedData);
      res.status(201).json(inventoryItem);
    } catch (error) {
      console.error('Error adding to warehouse inventory:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid inventory data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to add to warehouse inventory' });
    }
  });

  // Update warehouse inventory item
  app.patch('/api/warehouse-inventory/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const validatedData = updateWarehouseInventorySchema.parse(req.body);
      const inventoryItem = await storage.updateWarehouseInventory(id, validatedData);
      if (!inventoryItem) {
        return res.status(404).json({ message: 'Inventory item not found' });
      }
      res.json(inventoryItem);
    } catch (error) {
      console.error('Error updating warehouse inventory:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid inventory data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update warehouse inventory' });
    }
  });

  // Remove item from warehouse inventory
  app.delete('/api/warehouse-inventory/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteWarehouseInventory(id);
      if (!success) {
        return res.status(404).json({ message: 'Inventory item not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting from warehouse inventory:', error);
      res.status(500).json({ message: 'Failed to delete from warehouse inventory' });
    }
  });

  // ============= Expense Category Endpoints =============
  // Get all expense categories
  app.get("/api/expense-categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getExpenseCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching expense categories:", error);
      res.status(500).json({ message: "Failed to fetch expense categories" });
    }
  });

  // Create new expense category
  app.post("/api/expense-categories", async (req: Request, res: Response) => {
    try {
      const validatedData = insertExpenseCategorySchema.parse(req.body);
      const category = await storage.createExpenseCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating expense category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid expense category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create expense category" });
    }
  });

  // Update expense category
  app.patch("/api/expense-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const validatedData = insertExpenseCategorySchema.parse(req.body); // Reusing insert schema for update
      const category = await storage.updateExpenseCategory(id, validatedData);
      if (!category) {
        return res.status(404).json({ message: "Expense category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating expense category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid expense category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update expense category" });
    }
  });

  // Delete expense category
  app.delete("/api/expense-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteExpenseCategory(id);
      if (!success) {
        return res.status(404).json({ message: "Expense category not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense category:", error);
      res.status(500).json({ message: "Failed to delete expense category" });
    }
  });

  // ============= Expense Endpoints =============
  // Get all expenses
  app.get("/api/expenses", async (req: Request, res: Response) => {
    try {
      const { query, date, categoryId } = req.query;
      const expenses = await storage.getExpenses(
        query as string || '',
        date as string || 'all',
        categoryId ? Number(categoryId) : undefined
      );
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
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
      console.error("Error fetching expense:", error);
      res.status(500).json({ message: "Failed to fetch expense" });
    }
  });

  // Create new expense
  app.post("/api/expenses", async (req: Request, res: Response) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validatedData);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  // Update expense
  app.patch("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const validatedData = insertExpenseSchema.parse(req.body); // Reusing insert schema for update
      const expense = await storage.updateExpense(id, validatedData);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      console.error("Error updating expense:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update expense" });
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
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // ============= Order Endpoints =============
  // Get all orders
  app.get("/api/orders", async (req: Request, res: Response) => {
    try {
      const { query, status, date } = req.query;
      const orders = await storage.getOrders(
        query as string || '',
        status as string || 'all',
        date as string || 'all'
      );
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get order by ID
  app.get("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      // Fetch order items and fees
      const orderItems = await storage.getOrderItems(id);
      const orderFees = await storage.getOrderFees(id);
      res.json({ ...order, items: orderItems, fees: orderFees });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Create new order
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const { items, fees, ...orderData } = req.body;
      const validatedOrderData = insertOrderSchema.parse(orderData);
      const order = await storage.createOrder(validatedOrderData);

      if (items && items.length > 0) {
        for (const item of items) {
          const validatedItemData = insertOrderItemSchema.parse({
            ...item,
            orderId: order.id,
          });
          await storage.createOrderItem(validatedItemData);
        }
      }

      if (fees && fees.length > 0) {
        for (const fee of fees) {
          const validatedFeeData = insertOrderFeeSchema.parse({
            ...fee,
            orderId: order.id,
          });
          await storage.createOrderFee(validatedFeeData);
        }
      }

      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Update order
  app.patch("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { items, fees, ...orderData } = req.body;
      const validatedOrderData = insertOrderSchema.parse(orderData); // Reusing insert schema for update
      const order = await storage.updateOrder(id, validatedOrderData);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Update order items
      if (items) {
        await storage.deleteOrderItems(id);
        for (const item of items) {
          const validatedItemData = insertOrderItemSchema.parse({
            ...item,
            orderId: id,
          });
          await storage.createOrderItem(validatedItemData);
        }
      }

      // Update order fees
      if (fees) {
        await storage.deleteOrderFees(id);
        for (const fee of fees) {
          const validatedFeeData = insertOrderFeeSchema.parse({
            ...fee,
            orderId: id,
          });
          await storage.createOrderFee(validatedFeeData);
        }
      }

      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Delete order
  app.delete("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteOrder(id);
      if (!success) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  return httpServer;
}
