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
  insertOrderSchema,
  insertOrderItemSchema,
  insertOrderFeeSchema,
  users,
  sales,
  orders,
  products
} from "@shared/schema";
import { eq, sql, or, desc, and, like, gte, lte, inArray, between } from "drizzle-orm";
import { registerAccountingRoutes } from "./routes-accounting";
import userRoutes from "./routes-user";
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

  // Register accounting routes
  registerAccountingRoutes(app);

  // Register user management routes
  app.use('/api', userRoutes);

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

  // ============= Quotation Endpoints =============

  // Get all quotations
  app.get("/api/quotations", async (req: Request, res: Response) => {
    try {
      const query = req.query.query as string || '';
      const status = req.query.status as string || 'all';
      const date = req.query.date as string || 'all';
      
      const quotations = await storage.getQuotations(query, status, date);
      res.json(quotations);
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
      
      // Get quotation items
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

  // Create new quotation
  app.post("/api/quotations", async (req: Request, res: Response) => {
    try {
      // Format quotation data
      const quotationData = {
        quotationNumber: `QT-${Date.now().toString().slice(-6)}`,
        customerId: req.body.customer.id || null,
        userId: 1, // Temp hardcoded user ID 
        validUntil: req.body.validUntil,
        subtotal: req.body.subtotal,
        taxRate: req.body.taxRate,
        taxAmount: req.body.taxAmount,
        grandTotal: req.body.grandTotal,
        status: 'pending',
        notes: req.body.notes || ''
      };
      
      // Validate quotation data
      const validatedQuotation = insertQuotationSchema.parse(quotationData);
      
      // Create quotation
      const quotation = await storage.createQuotation(validatedQuotation);
      
      // If no existing customer, create a new one
      let customerId = req.body.customer.id;
      if (!customerId && req.body.customer.name) {
        const customerData = {
          name: req.body.customer.name,
          email: req.body.customer.email || '',
          phone: req.body.customer.phone || '',
          address: req.body.customer.address || '',
          city: req.body.customer.city || '',
          state: req.body.customer.state || '',
          zipCode: req.body.customer.zipCode || '',
        };
        const validatedCustomer = insertCustomerSchema.parse(customerData);
        const customer = await storage.createCustomer(validatedCustomer);
        customerId = customer.id;
        
        // Update quotation with new customer ID
        await storage.updateQuotation(quotation.id, { customerId });
      }
      
      // Process quotation items
      if (req.body.items && req.body.items.length > 0) {
        for (const item of req.body.items) {
          const itemData = {
            quotationId: quotation.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice
          };
          
          const validatedItem = insertQuotationItemSchema.parse(itemData);
          await storage.createQuotationItem(validatedItem);
        }
      }
      
      res.status(201).json({
        ...quotation,
        items: req.body.items
      });
    } catch (error) {
      console.error("Error creating quotation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid quotation data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create quotation" });
    }
  });

  // Update quotation status
  app.patch("/api/quotations/:id/status", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;
      
      if (!['pending', 'approved', 'rejected', 'expired', 'converted'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const quotation = await storage.updateQuotation(id, { status });
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      res.json(quotation);
    } catch (error) {
      console.error("Error updating quotation status:", error);
      res.status(500).json({ message: "Failed to update quotation status" });
    }
  });

  // Delete quotation
  app.delete("/api/quotations/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      // Delete quotation items first
      await storage.deleteQuotationItems(id);
      
      // Delete quotation
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
  
  // Create new product
  app.post("/api/products", upload.single("image"), async (req: Request, res: Response) => {
    try {
      // Validate and transform request body
      // Prepare data for validation, handling potential undefined fields
      const productData = {
        ...req.body,
        // Convert fields to the expected types if they're not already
        categoryId: typeof req.body.categoryId === 'string' ? Number(req.body.categoryId) : req.body.categoryId,
        quantity: typeof req.body.quantity === 'string' ? Number(req.body.quantity) : req.body.quantity,
        costPrice: typeof req.body.costPrice === 'string' ? Number(req.body.costPrice) : req.body.costPrice,
        sellingPrice: typeof req.body.sellingPrice === 'string' ? Number(req.body.sellingPrice) : req.body.sellingPrice,
        lowStockThreshold: req.body.lowStockThreshold ? Number(req.body.lowStockThreshold) : undefined,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined
      };
      
      const validatedData = insertProductSchema.parse(productData);
      
      // Add image path if uploaded
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
      
      // Validate and transform request body
      const validatedData = updateProductSchema.parse({
        ...req.body,
        categoryId: typeof req.body.categoryId === 'string' ? Number(req.body.categoryId) : req.body.categoryId,
        costPrice: typeof req.body.costPrice === 'string' ? Number(req.body.costPrice) : req.body.costPrice,
        sellingPrice: typeof req.body.sellingPrice === 'string' ? Number(req.body.sellingPrice) : req.body.sellingPrice,
        quantity: typeof req.body.quantity === 'string' ? Number(req.body.quantity) : req.body.quantity,
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
  
  // Delete a category
  app.delete("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      // Check if category exists
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(400).json({ 
          message: "Cannot delete this category because it's used by existing products. Please reassign those products to another category first."
        });
      }
      
      res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error when deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
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

  // ============= Invoice Endpoints =============
  
  // Create demo invoices for testing
  app.post("/api/invoices/generate-demo", async (req: Request, res: Response) => {
    try {
      // Get customers for our demo invoices
      const customerList = await storage.getCustomers();
      
      if (customerList.length === 0) {
        return res.status(400).json({ message: "Need at least one customer to generate invoices" });
      }
      
      // Get products for our demo invoices
      const productList = await storage.getProducts();
      
      if (productList.length === 0) {
        return res.status(400).json({ message: "Need at least one product to generate invoices" });
      }
      
      // Get admin user for the creator ID
      const [adminUser] = await db
        .select()
        .from(users)
        .where(eq(users.role, "admin"))
        .limit(1);
        
      if (!adminUser) {
        return res.status(400).json({ message: "Need at least one admin user to generate invoices" });
      }
      
      const createdInvoices = [];
      
      // Create 5 demo invoices
      for (let i = 0; i < 5; i++) {
        // Generate a random invoice
        const customer = customerList[Math.floor(Math.random() * customerList.length)];
        
        // Calculate a random date within the last 30 days
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        
        // Create 1-3 random items for this invoice
        const itemCount = Math.floor(Math.random() * 3) + 1;
        const items = [];
        let subtotal = 0;
        
        for (let j = 0; j < itemCount; j++) {
          const product = productList[Math.floor(Math.random() * productList.length)];
          const quantity = Math.floor(Math.random() * 5) + 1;
          const unitPrice = parseFloat(product.sellingPrice.toString());
          const total = quantity * unitPrice;
          
          items.push({
            productId: product.id,
            quantity,
            unitPrice,
            discount: "0",
            total
          });
          
          subtotal += total;
        }
        
        // Calculate total with tax
        const taxRate = 0.05; // 5% tax
        const taxAmount = subtotal * taxRate;
        const grandTotal = subtotal + taxAmount;
        
        // Generate unique invoice number
        const invoiceCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(sales);
        
        const invoiceNumber = `INV-${(invoiceCount[0]?.count || 0) + i + 1}`.padStart(8, '0');
        
        // Create the sale (invoice)
        const paymentStatus = Math.random() > 0.5 ? "completed" : "pending";
        const paymentMethod = ["cash", "credit_card", "bank_transfer"][Math.floor(Math.random() * 3)];
        
        const validatedSale = {
          invoiceNumber,
          customerId: customer.id,
          userId: adminUser.id,
          date,
          totalAmount: subtotal.toString(),
          discount: "0",
          tax: taxAmount.toString(),
          grandTotal: grandTotal.toString(),
          paymentMethod,
          paymentStatus,
          notes: `Demo invoice #${i + 1} generated for testing`
        };
        
        // Convert items to match the expected format
        const validatedItems = items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          discount: item.discount,
          total: item.total.toString()
        }));
        
        const createdSale = await storage.createSale(validatedSale, validatedItems);
        createdInvoices.push(createdSale);
      }
      
      res.status(201).json({ 
        message: `Successfully created ${createdInvoices.length} demo invoices`,
        invoices: createdInvoices
      });
      
    } catch (error) {
      console.error("Error generating demo invoices:", error);
      res.status(500).json({ message: "Failed to generate demo invoices" });
    }
  });
  
  // Get all invoices with filtering options
  app.get("/api/invoices", async (req: Request, res: Response) => {
    try {
      const { query, status, date } = req.query;
      
      // Directly return a simplified list of invoices from sales data
      // This is a temporary implementation until we have proper invoice storage
      const salesData = await storage.getSales();
      
      // Convert sales data to simplified invoice format
      const invoices = await Promise.all(salesData.map(async (sale) => {
        // Get customer name if available
        let customerName = 'Unknown Customer';
        if (sale.customerId) {
          try {
            const customer = await storage.getCustomer(sale.customerId);
            if (customer) {
              customerName = customer.name;
            }
          } catch (error) {
            console.error(`Error fetching customer ${sale.customerId}:`, error);
          }
        }
        
        return {
          id: sale.id,
          invoiceNumber: sale.invoiceNumber || `INV-${sale.id.toString().padStart(6, '0')}`,
          customerName,
          date: sale.date,
          amount: parseFloat(sale.grandTotal?.toString() || "0"),
          status: sale.paymentStatus === 'completed' ? 'paid' : 'unpaid'
        };
      }));
      
      // Return the invoices
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // ============= Report Endpoints =============
  
  // Invoice endpoints
  
  // Get all invoices with optional filters
  app.get("/api/invoices", async (req: Request, res: Response) => {
    try {
      const { query, status, date } = req.query;
      
      // Fetch sales data as invoices
      const salesData = await storage.getSales();
      
      // Process sales to include customer names and format as invoices
      const invoices = await Promise.all(salesData.map(async (sale) => {
        // Get customer name if available
        let customerName = 'Unknown Customer';
        if (sale.customerId) {
          try {
            const customer = await storage.getCustomer(sale.customerId);
            if (customer) {
              customerName = customer.name;
            }
          } catch (error) {
            console.error(`Error fetching customer ${sale.customerId}:`, error);
          }
        }
        
        return {
          id: sale.id,
          invoiceNumber: sale.invoiceNumber,
          customerName,
          date: sale.date,
          amount: parseFloat(sale.grandTotal?.toString() || "0"),
          status: sale.paymentStatus === 'completed' ? 'paid' : 'unpaid'
        };
      }));
      
      // Apply filters if provided
      let filteredInvoices = [...invoices];
      
      // Filter by query (search)
      if (query && query !== '') {
        const searchTerm = (query as string).toLowerCase();
        filteredInvoices = filteredInvoices.filter(invoice => 
          invoice.invoiceNumber.toLowerCase().includes(searchTerm) || 
          invoice.customerName.toLowerCase().includes(searchTerm)
        );
      }
      
      // Filter by status
      if (status && status !== 'all') {
        filteredInvoices = filteredInvoices.filter(invoice => invoice.status === status);
      }
      
      // Filter by date
      if (date && date !== 'all') {
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);
        
        filteredInvoices = filteredInvoices.filter(invoice => {
          const invoiceDate = new Date(invoice.date);
          
          if (date === 'today') {
            return invoiceDate.toDateString() === today.toDateString();
          } else if (date === 'week') {
            return invoiceDate >= lastWeek;
          } else if (date === 'month') {
            return invoiceDate >= lastMonth;
          }
          return true;
        });
      }
      
      // Return the filtered invoices
      res.json(filteredInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });
  
  // Get invoice details by ID
  app.get("/api/invoices/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      // Get sale data
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Get customer data
      let customer = null;
      if (sale.customerId) {
        customer = await storage.getCustomer(sale.customerId);
      }
      
      // Get sale items
      const saleItems = await storage.getSaleItems(id);
      
      // Get products for each sale item
      const items = await Promise.all(saleItems.map(async (item) => {
        const product = await storage.getProduct(item.productId);
        return {
          ...item,
          productName: product ? product.name : "Unknown Product",
          productSku: product ? product.sku : "",
          unitOfMeasure: product ? product.unitOfMeasure : "PCS"
        };
      }));
      
      // Format the invoice
      const invoice = {
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        date: sale.date,
        customer: customer ? {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address
        } : null,
        items,
        subtotal: parseFloat(sale.totalAmount?.toString() || "0"),
        tax: parseFloat(sale.tax?.toString() || "0"),
        discount: parseFloat(sale.discount?.toString() || "0"),
        total: parseFloat(sale.grandTotal?.toString() || "0"),
        paymentMethod: sale.paymentMethod,
        paymentStatus: sale.paymentStatus,
        notes: sale.notes
      };
      
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      res.status(500).json({ message: "Failed to fetch invoice details" });
    }
  });
  
  // Generate demo invoices for testing
  app.post("/api/invoices/generate-demo", async (req: Request, res: Response) => {
    try {
      // Get customers for our demo invoices
      const customerList = await storage.getCustomers();
      
      if (customerList.length === 0) {
        return res.status(400).json({ message: "Need at least one customer to generate invoices" });
      }
      
      // Get products for our demo invoices
      const productList = await storage.getProducts();
      
      if (productList.length === 0) {
        return res.status(400).json({ message: "Need at least one product to generate invoices" });
      }
      
      // Get a user to use as creator
      const users = await storage.getUsers();
      if (users.length === 0) {
        return res.status(400).json({ message: "Need at least one user to generate invoices" });
      }
      const creatorUser = users[0];
      
      const createdInvoices = [];
      
      // Create 5 demo invoices
      for (let i = 0; i < 5; i++) {
        // Generate a random invoice
        const customer = customerList[Math.floor(Math.random() * customerList.length)];
        
        // Calculate a random date within the last 30 days
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        
        // Create 1-3 random items for this invoice
        const itemCount = Math.floor(Math.random() * 3) + 1;
        const items = [];
        let subtotal = 0;
        
        for (let j = 0; j < itemCount; j++) {
          const product = productList[Math.floor(Math.random() * productList.length)];
          const quantity = Math.floor(Math.random() * 5) + 1;
          const unitPrice = parseFloat(product.sellingPrice.toString());
          const total = quantity * unitPrice;
          
          items.push({
            productId: product.id,
            quantity,
            unitPrice: unitPrice.toString(),
            discount: "0",
            total: total.toString()
          });
          
          subtotal += total;
        }
        
        // Calculate total with tax
        const taxRate = 0.05; // 5% tax
        const taxAmount = subtotal * taxRate;
        const grandTotal = subtotal + taxAmount;
        
        // Generate unique invoice number
        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${i+1}`;
        
        // Create the sale (invoice)
        const paymentStatus = Math.random() > 0.5 ? "completed" : "pending";
        const paymentMethod = ["cash", "credit_card", "bank_transfer"][Math.floor(Math.random() * 3)];
        
        const saleData = {
          invoiceNumber,
          customerId: customer.id,
          userId: creatorUser.id,
          date,
          totalAmount: subtotal.toString(),
          discount: "0",
          tax: taxAmount.toString(),
          grandTotal: grandTotal.toString(),
          paymentMethod,
          paymentStatus,
          notes: `Demo invoice #${i + 1} generated for testing`
        };
        
        // We don't need to set saleId - it will be set by the storage method
        const createdSale = await storage.createSale(saleData, items);
        
        createdInvoices.push(createdSale);
      }
      
      res.status(201).json({ 
        message: `Successfully created ${createdInvoices.length} demo invoices`,
        invoices: createdInvoices
      });
      
    } catch (error) {
      console.error("Error generating demo invoices:", error);
      res.status(500).json({ message: "Failed to generate demo invoices" });
    }
  });
  
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
      const preferences = await storage.getSystemPreferences();
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system preferences" });
    }
  });
  
  // Get system preferences by category
  app.get("/api/system-preferences/category/:category", isAdmin, async (req: Request, res: Response) => {
    try {
      const category = req.params.category;
      const preferences = await storage.getSystemPreferencesByCategory(category);
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system preferences" });
    }
  });
  
  // Get a specific system preference
  app.get("/api/system-preferences/:key", isAdmin, async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const preference = await storage.getSystemPreference(key);
      
      if (!preference) {
        return res.status(404).json({ message: "System preference not found" });
      }
      
      res.json(preference);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system preference" });
    }
  });
  
  // Create a new system preference
  app.post("/api/system-preferences", isAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertSystemPreferenceSchema.parse(req.body);
      const preference = await storage.createSystemPreference(validatedData);
      res.status(201).json(preference);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid system preference data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create system preference" });
    }
  });
  
  // Update a system preference
  app.patch("/api/system-preferences/:key", isAdmin, async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const { value } = updateSystemPreferenceSchema.parse(req.body);
      
      const preference = await storage.updateSystemPreference(key, value);
      
      if (!preference) {
        return res.status(404).json({ message: "System preference not found" });
      }
      
      res.json(preference);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid system preference data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update system preference" });
    }
  });
  
  // ============= Role Permissions Endpoints =============
  
  // Get permissions for a role
  app.get("/api/role-permissions/:role", isAdmin, async (req: Request, res: Response) => {
    try {
      const role = req.params.role;
      const permissions = await storage.getRolePermissions(role);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch role permissions" });
    }
  });
  
  // Create a new role permission
  app.post("/api/role-permissions", isAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertRolePermissionSchema.parse(req.body);
      const permission = await storage.createRolePermission(validatedData);
      res.status(201).json(permission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid role permission data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create role permission" });
    }
  });
  
  // Delete a role permission
  app.delete("/api/role-permissions/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteRolePermission(id);
      
      if (!success) {
        return res.status(404).json({ message: "Role permission not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete role permission" });
    }
  });
  
  // ============= Login Logs Endpoints =============
  
  // Get login logs
  app.get("/api/login-logs", isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const logs = await storage.getLoginLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch login logs" });
    }
  });
  
  // Create a new login log
  app.post("/api/login-logs", async (req: Request, res: Response) => {
    try {
      const validatedData = insertLoginLogSchema.parse(req.body);
      const log = await storage.createLoginLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login log data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create login log" });
    }
  });

  // ============= Order Management Endpoints =============
  
  // Get all orders
  app.get("/api/orders", async (req: Request, res: Response) => {
    try {
      const query = req.query.query as string || '';
      const orderType = req.query.orderType as string || '';
      const status = req.query.status as string || '';
      
      try {
        const orders = await storage.getOrders(query, orderType, status);
        res.json(orders);
      } catch (storageError) {
        console.error("Error fetching orders from storage:", storageError);
        
        // Fallback mock orders data for testing
        const mockOrders = [
          {
            id: 1,
            orderType: 'production',
            batchNumber: 'BATCH-1001',
            customerId: 1,
            customerName: 'Ahmed Hassan',
            finalProduct: 'Antibiotic Compound X',
            materials: JSON.stringify([
              {
                id: 12,
                name: 'Sulfuric Acid',
                quantity: 200,
                unitPrice: '0.60',
                unitOfMeasure: 'L'
              },
              {
                id: 13,
                name: 'Sodium Hydroxide',
                quantity: 100,
                unitPrice: '1.50',
                unitOfMeasure: 'kg'
              },
              {
                id: 14,
                name: 'Ethanol',
                quantity: 50,
                unitPrice: '2.00',
                unitOfMeasure: 'L'
              }
            ]),
            subtotal: '410.00',
            taxPercentage: 14,
            taxAmount: '57.40',
            totalMaterialCost: '410.00',
            totalAdditionalFees: '57.40',
            totalCost: '467.40',
            status: 'completed',
            createdAt: '2025-04-20T10:00:00Z'
          },
          {
            id: 2,
            orderType: 'refining',
            batchNumber: 'REF-1001',
            customerId: 2,
            customerName: 'Sarah Mohamed',
            sourceType: 'production',
            sourceId: '1',
            sourceMaterial: 'Antibiotic Compound X',
            refiningSteps: 'Filtration||Distillation||Crystallization',
            expectedOutput: 'Refined Antibiotic API',
            subtotal: '200.00',
            taxPercentage: 14,
            taxAmount: '28.00',
            totalMaterialCost: '200.00',
            totalAdditionalFees: '28.00',
            totalCost: '228.00',
            status: 'pending',
            createdAt: '2025-04-22T15:30:00Z'
          },
          {
            id: 3,
            orderType: 'production',
            batchNumber: 'BATCH-1002',
            customerId: 3,
            customerName: 'Omar Ali',
            finalProduct: 'Anti-inflammatory Formula Y',
            materials: JSON.stringify([
              {
                id: 14,
                name: 'Ethanol',
                quantity: 75,
                unitPrice: '2.00',
                unitOfMeasure: 'L'
              },
              {
                id: 15,
                name: 'Hydrochloric Acid',
                quantity: 50,
                unitPrice: '1.20',
                unitOfMeasure: 'L'
              },
              {
                id: 16,
                name: 'Calcium Carbonate',
                quantity: 120,
                unitPrice: '0.50',
                unitOfMeasure: 'kg'
              }
            ]),
            subtotal: '270.00',
            taxPercentage: 14,
            taxAmount: '37.80',
            totalMaterialCost: '270.00',
            totalAdditionalFees: '37.80',
            totalCost: '307.80',
            status: 'in_progress',
            createdAt: '2025-04-25T09:15:00Z'
          }
        ];
        
        res.json(mockOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  
  // Get the latest batch number
  app.get("/api/orders/latest-batch", async (req: Request, res: Response) => {
    try {
      // Query for production orders (BATCH-XXXX)
      const productionQuery = `
        SELECT batch_number, "batchNumber", order_number, "orderNumber"
        FROM orders 
        WHERE batch_number LIKE 'BATCH-%' 
           OR "batchNumber" LIKE 'BATCH-%'
           OR order_number LIKE 'BATCH-%'
           OR "orderNumber" LIKE 'BATCH-%'
        ORDER BY id DESC 
        LIMIT 1
      `;
      
      // Query for refining orders (REF-XXXX)
      const refiningQuery = `
        SELECT batch_number, "batchNumber", order_number, "orderNumber"
        FROM orders 
        WHERE batch_number LIKE 'REF-%' 
           OR "batchNumber" LIKE 'REF-%'
           OR order_number LIKE 'REF-%'
           OR "orderNumber" LIKE 'REF-%'
        ORDER BY id DESC 
        LIMIT 1
      `;
      
      let latestProductionBatch = 'BATCH-0000';
      let latestRefiningBatch = 'REF-0000';
      
      try {
        // Try to get latest production batch
        const productionResult = await pool.query(productionQuery);
        if (productionResult.rows.length > 0) {
          const row = productionResult.rows[0];
          latestProductionBatch = row.batch_number || row.batchNumber || row.order_number || row.orderNumber || 'BATCH-0000';
        }
        
        // Try to get latest refining batch
        const refiningResult = await pool.query(refiningQuery);
        if (refiningResult.rows.length > 0) {
          const row = refiningResult.rows[0];
          latestRefiningBatch = row.batch_number || row.batchNumber || row.order_number || row.orderNumber || 'REF-0000';
        }
      } catch (dbError) {
        console.error("Database error fetching batch numbers:", dbError);
        // Will continue with default values
      }
      
      // Return both batch numbers
      res.json({ 
        latestBatch: latestProductionBatch,
        latestRefiningBatch: latestRefiningBatch
      });
    } catch (error) {
      console.error("Error fetching latest batch:", error);
      res.status(500).json({ 
        message: "Failed to fetch latest batch number", 
        error: String(error),
        latestBatch: 'BATCH-0000',
        latestRefiningBatch: 'REF-0000'
      });
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
      
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });
  
  // Create new order
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      // Format order data with custom batch/order number
      let orderNumber;
      if (req.body.batchNumber && req.body.batchNumber.trim()) {
        // If batch number is provided, use it
        orderNumber = req.body.batchNumber;
      } else if (req.body.orderType === 'production') {
        // Generate a production-specific order number
        orderNumber = `PROD-${Date.now().toString().slice(-6)}`;
      } else if (req.body.orderType === 'refining') {
        // Generate a refining-specific order number
        orderNumber = `REF-${Date.now().toString().slice(-6)}`;
      } else {
        // Default order number format
        orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      }
      
      const orderData = {
        orderNumber,
        orderType: req.body.orderType,
        customerId: req.body.customerId,
        customerName: req.body.customerName, // Store customer name for easier display
        userId: 1, // Temp hardcoded user ID 
        description: req.body.description || '',
        productDescription: req.body.productDescription || '', // For production orders
        finalProduct: req.body.finalProduct || '', // For production orders - description of target
        sourceMaterial: req.body.sourceMaterial || '', // For refining orders
        materials: req.body.materials ? JSON.stringify(req.body.materials) : null, // Store materials as JSON
        totalMaterialCost: req.body.totalMaterialCost ? req.body.totalMaterialCost.toString() : '0',
        totalAdditionalFees: req.body.totalAdditionalFees ? req.body.totalAdditionalFees.toString() : '0',
        totalCost: req.body.totalCost.toString(),
        status: 'pending',
        targetProductId: req.body.targetProductId || null,
        expectedOutputQuantity: req.body.expectedOutputQuantity ? req.body.expectedOutputQuantity.toString() : null,
        refiningSteps: req.body.refiningSteps || null,
        createdAt: new Date().toISOString()
      };
      
      // Validate order data
      const validatedOrder = insertOrderSchema.parse(orderData);
      
      // Create order
      const order = await storage.createOrder(validatedOrder);
      
      // Process order items
      if (req.body.items && req.body.items.length > 0) {
        for (const item of req.body.items) {
          const itemData = {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity.toString(),
            unitCost: item.unitCost.toString(),
            subtotal: item.subtotal.toString()
          };
          
          const validatedItem = insertOrderItemSchema.parse(itemData);
          await storage.createOrderItem(validatedItem);
        }
      }
      
      // Process additional fees
      if (req.body.fees && req.body.fees.length > 0) {
        for (const fee of req.body.fees) {
          const feeData = {
            orderId: order.id,
            feeLabel: fee.label,
            amount: fee.amount.toString()
          };
          
          const validatedFee = insertOrderFeeSchema.parse(feeData);
          await storage.createOrderFee(validatedFee);
        }
      }
      
      res.status(201).json({
        ...order,
        items: req.body.items,
        fees: req.body.fees
      });
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });
  
  // Update order status
  app.patch("/api/orders/:id/status", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;
      
      if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const order = await storage.updateOrder(id, { status });
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
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
  
  // Simple test endpoint to check database connectivity
  app.get("/api/test-db", async (req: Request, res: Response) => {
    try {
      console.log("Testing database connectivity");
      
      // Test basic query
      const { rows: allRows } = await pool.query('SELECT * FROM products LIMIT 3');
      console.log("Database test successful, found products:", allRows.length);
      
      // Test specific query for raw materials
      const { rows: rawRows } = await pool.query('SELECT * FROM products WHERE product_type = $1', ['raw']);
      console.log("Raw materials found via direct query:", rawRows.length, rawRows);
      
      // Also try using Drizzle ORM
      const drizzleProducts = await db.select().from(products);
      console.log("Drizzle products count:", drizzleProducts.length);
      
      // Filter for raw products using JavaScript
      const rawProducts = drizzleProducts.filter(p => p.productType === 'raw');
      console.log("Raw products after JS filtering:", rawProducts.length, rawProducts);
      
      res.json({ 
        success: true, 
        queryProducts: allRows,
        rawQueryProducts: rawRows,
        drizzleProducts: drizzleProducts.slice(0, 3),
        rawDrizzleProducts: rawProducts
      });
    } catch (error) {
      console.error("Error testing database:", error);
      res.status(500).json({ message: "Database test failed", error: String(error) });
    }
  });

  // Get raw materials (for production orders)
  app.get("/api/products/raw-materials", async (req: Request, res: Response) => {
    try {
      console.log("Fetching raw materials from products collection");
      
      // Get all products and transform a subset into raw materials since
      // we're having issues with the database schema
      try {
        const response = await fetch('http://localhost:5000/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const products = await response.json();
        
        if (products && products.length > 0) {
          console.log("Products found:", products.length);
          
          // Convert some products to be raw materials
          const rawMaterials = products.slice(0, 5).map((product: any, index: number) => ({
            ...product,
            id: product.id || (index + 101),
            name: product.name || `Raw Material ${index + 1}`,
            drugName: product.drugName || `RM-${index + 1}`,
            description: product.description || "Raw material for production",
            productType: "raw",
            unitOfMeasure: product.unitOfMeasure || "kg"
          }));
          
          return res.json(rawMaterials);
        }
      } catch (error) {
        console.error("Error transforming products to raw materials:", error);
      }
      
      // If we get here, no products were found or an error occurred
      console.log("No products found in database, using sample raw materials data");
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
        }
      ];
      
      res.json(sampleRawMaterials);
      
    } catch (error) {
      console.error("Error fetching raw materials:", error);
      res.status(500).json({ message: "Failed to fetch raw materials", error: String(error) });
    }
  });
  
  // Get semi-finished products (for refining orders)
  app.get("/api/products/semi-finished", async (req: Request, res: Response) => {
    try {
      console.log("Fetching semi-finished products from products collection");
      
      // Get all products and transform a subset into semi-finished products
      try {
        const response = await fetch('http://localhost:5000/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const products = await response.json();
        
        if (products && products.length > 0) {
          console.log("Products found for semi-finished transformation:", products.length);
          
          // Convert some products to be semi-finished (use different products than raw materials)
          // Use products from the middle of the array (5-8)
          const startIndex = Math.min(5, products.length - 1);
          const endIndex = Math.min(startIndex + 3, products.length);
          const semiFinishedProducts = products.slice(startIndex, endIndex).map((product: any, index: number) => ({
            ...product,
            id: 200 + index + 1,
            name: `Semi-Finished ${product.name}`,
            drugName: product.drugName || `SF-${index + 1}`,
            description: `Semi-finished product based on ${product.name}`,
            productType: "semi-raw",
            unitOfMeasure: product.unitOfMeasure || "L",
            batchNumber: `BATCH-${1000 + index}`
          }));
          
          return res.json(semiFinishedProducts);
        }
      } catch (error) {
        console.error("Error transforming products to semi-finished:", error);
      }
      
      // If we get here, no products were found or an error occurred
      // Use the inventory-products.csv data as sample instead of the placeholder data
      console.log("Using predefined sample data for semi-finished products");
      const sampleSemiFinishedProducts = [
        {
          id: 201,
          name: "Semi-Finished Panadol",
          drugName: "SF-Paracetamol",
          description: "Semi-finished base for pain relief tablets",
          sku: "SF-PAN500",
          costPrice: "180.00",
          sellingPrice: "0.00",
          productType: "semi-raw",
          status: "active",
          quantity: 120,
          unitOfMeasure: "L",
          batchNumber: "BATCH-1001"
        },
        {
          id: 202,
          name: "Semi-Finished Cataflam",
          drugName: "SF-Diclofenac",
          description: "Precursor for anti-inflammatory medications",
          sku: "SF-CAT500",
          costPrice: "220.00",
          sellingPrice: "0.00",
          productType: "semi-raw",
          status: "active",
          quantity: 150,
          unitOfMeasure: "kg",
          batchNumber: "BATCH-1002"
        },
        {
          id: 203,
          name: "Semi-Finished Aspirin",
          drugName: "SF-Acetylsalicylic",
          description: "Base solution for aspirin production",
          sku: "SF-ASP100",
          costPrice: "190.00",
          sellingPrice: "0.00",
          productType: "semi-raw",
          status: "active",
          quantity: 180,
          unitOfMeasure: "L",
          batchNumber: "BATCH-1003"
        }
      ];
      
      res.json(sampleSemiFinishedProducts);
      
    } catch (error) {
      console.error("Error fetching semi-finished products:", error);
      res.status(500).json({ message: "Failed to fetch semi-finished products", error: String(error) });
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
