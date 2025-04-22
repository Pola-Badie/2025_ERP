import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision, date, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  role: text("role").default("staff").notNull(), // admin, staff, manager
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Product management
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  drugName: text("drug_name").notNull(),
  categoryId: integer("category_id").references(() => productCategories.id),
  description: text("description"),
  sku: text("sku").notNull().unique(),
  barcode: text("barcode"),
  costPrice: numeric("cost_price").notNull(),
  sellingPrice: numeric("selling_price").notNull(),
  quantity: integer("quantity").default(0).notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(10),
  expiryDate: date("expiry_date"),
  status: text("status").default("active").notNull(), // 'active', 'expired', 'out_of_stock', 'near'
  manufacturer: text("manufacturer"),
  imagePath: text("image_path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customer management
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  totalPurchases: numeric("total_purchases").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sales management
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  totalAmount: numeric("total_amount").notNull(),
  discount: numeric("discount").default("0"),
  tax: numeric("tax").default("0"),
  grandTotal: numeric("grand_total").notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").default("completed").notNull(), // 'pending', 'completed', 'failed'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price").notNull(),
  discount: numeric("discount").default("0"),
  total: numeric("total").notNull(),
});

// Suppliers management
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Purchase orders
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  poNumber: text("po_number").notNull().unique(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  orderDate: timestamp("order_date").defaultNow().notNull(),
  expectedDeliveryDate: date("expected_delivery_date"),
  status: text("status").default("pending").notNull(), // 'pending', 'received', 'cancelled'
  totalAmount: numeric("total_amount").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id").references(() => purchaseOrders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price").notNull(),
  total: numeric("total").notNull(),
  receivedQuantity: integer("received_quantity").default(0),
});

// Inventory transactions
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  transactionType: text("transaction_type").notNull(), // 'purchase', 'sale', 'adjustment', 'return'
  quantity: integer("quantity").notNull(), // Positive for in, negative for out
  referenceId: integer("reference_id"), // ID from sales, purchases, etc.
  referenceType: text("reference_type"), // 'sale', 'purchase', 'adjustment'
  notes: text("notes"),
  date: timestamp("date").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
});

// Invoices and Receipts
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  saleId: integer("sale_id").references(() => sales.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  dueDate: date("due_date"),
  totalAmount: numeric("total_amount").notNull(),
  status: text("status").default("unpaid").notNull(), // 'paid', 'unpaid', 'partial', 'overdue'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// System backups
export const backups = pgTable("backups", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  filename: text("filename").notNull(),
  size: integer("size").notNull(),
  status: text("status").notNull(),
  type: text("type").notNull(), // 'manual', 'daily', 'weekly', 'monthly'
});

export const backupSettings = pgTable("backup_settings", {
  id: serial("id").primaryKey(),
  dailyBackup: boolean("daily_backup").notNull().default(true),
  weeklyBackup: boolean("weekly_backup").notNull().default(true),
  monthlyBackup: boolean("monthly_backup").notNull().default(true),
  backupTime: text("backup_time").notNull().default("02:00"), // 24-hour format
  retentionDays: integer("retention_days").notNull().default(30),
});

// Reports
export const salesReports = pgTable("sales_reports", {
  id: serial("id").primaryKey(),
  reportDate: date("report_date").notNull(),
  totalSales: numeric("total_sales").notNull(),
  totalOrders: integer("total_orders").notNull(),
  newCustomers: integer("new_customers").default(0),
  topSellingProduct: integer("top_selling_product").references(() => products.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
});

export const insertProductCategorySchema = createInsertSchema(productCategories).pick({
  name: true,
  description: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  drugName: true,
  categoryId: true,
  description: true,
  sku: true,
  barcode: true,
  costPrice: true,
  sellingPrice: true,
  quantity: true,
  lowStockThreshold: true,
  expiryDate: true,
  status: true,
  manufacturer: true,
  imagePath: true,
});

export const insertCustomerSchema = createInsertSchema(customers).pick({
  name: true,
  email: true,
  phone: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
});

export const insertSaleSchema = createInsertSchema(sales).pick({
  invoiceNumber: true,
  customerId: true,
  userId: true,
  totalAmount: true,
  discount: true,
  tax: true,
  grandTotal: true,
  paymentMethod: true,
  paymentStatus: true,
  notes: true,
});

export const insertSaleItemSchema = createInsertSchema(saleItems).pick({
  saleId: true,
  productId: true,
  quantity: true,
  unitPrice: true,
  discount: true,
  total: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).pick({
  name: true,
  contactPerson: true,
  email: true,
  phone: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).pick({
  poNumber: true,
  supplierId: true,
  userId: true,
  expectedDeliveryDate: true,
  status: true,
  totalAmount: true,
  notes: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).pick({
  invoiceNumber: true,
  saleId: true,
  customerId: true,
  dueDate: true,
  totalAmount: true,
  status: true,
});

export const insertBackupSchema = createInsertSchema(backups).pick({
  filename: true,
  size: true,
  status: true,
  type: true,
});

export const updateBackupSettingsSchema = createInsertSchema(backupSettings).pick({
  dailyBackup: true,
  weeklyBackup: true,
  monthlyBackup: true,
  backupTime: true,
  retentionDays: true,
});

export const insertSalesReportSchema = createInsertSchema(salesReports).pick({
  reportDate: true,
  totalSales: true,
  totalOrders: true,
  newCustomers: true,
  topSellingProduct: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;
export type ProductCategory = typeof productCategories.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof sales.$inferSelect;

export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type SaleItem = typeof saleItems.$inferSelect;

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertBackup = z.infer<typeof insertBackupSchema>;
export type Backup = typeof backups.$inferSelect;

export type UpdateBackupSettings = z.infer<typeof updateBackupSettingsSchema>;
export type BackupSettings = typeof backupSettings.$inferSelect;

export type InsertSalesReport = z.infer<typeof insertSalesReportSchema>;
export type SalesReport = typeof salesReports.$inferSelect;

// Create an update product schema
export const updateProductSchema = z.object({
  name: z.string().optional(),
  drugName: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.number().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  costPrice: z.number().optional(),
  sellingPrice: z.number().optional(),
  quantity: z.number().optional(),
  lowStockThreshold: z.number().optional(),
  expiryDate: z.date().optional(),
  manufacturer: z.string().optional(),
  status: z.string().optional(),
  imagePath: z.string().optional(),
  updatedAt: z.date().optional()
});

export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
