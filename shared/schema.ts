import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision, date, numeric, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  role: text("role").default("staff").notNull(), // admin, sales_rep, inventory_manager, accountant, manager
  status: text("status").default("active").notNull(), // active, inactive, suspended
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User module permissions
export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  moduleName: text("module_name").notNull(), // dashboard, inventory, expenses, accounting, etc.
  accessGranted: boolean("access_granted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  unitOfMeasure: text("unit_of_measure").default("PCS").notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(10),
  expiryDate: date("expiry_date"),
  status: text("status").default("active").notNull(), // 'active', 'expired', 'out_of_stock', 'near'
  manufacturer: text("manufacturer"),
  location: text("location"),
  shelf: text("shelf"),
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

// Quotations
export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  quotationNumber: text("quotation_number").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  validUntil: date("valid_until").notNull(),
  subtotal: numeric("subtotal").notNull(),
  taxRate: numeric("tax_rate").default("0"),
  taxAmount: numeric("tax_amount").default("0"),
  grandTotal: numeric("grand_total").notNull(),
  status: text("status").default("pending").notNull(), // 'pending', 'approved', 'rejected', 'expired', 'converted'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quotationItems = pgTable("quotation_items", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id").references(() => quotations.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price").notNull(),
  total: numeric("total").notNull(),
});

// System preferences
export const systemPreferences = pgTable("system_preferences", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  category: text("category").notNull(), // 'user_management', 'inventory', 'financial', 'notifications', 'company'
  label: text("label").notNull(),
  description: text("description"),
  dataType: text("data_type").notNull(), // 'string', 'number', 'boolean', 'json', 'select'
  options: jsonb("options"), // For select types, array of options
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// System role permissions
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(), // 'admin', 'sales_rep', 'inventory_manager'
  resource: text("resource").notNull(), // 'users', 'products', 'sales', etc.
  action: text("action").notNull(), // 'create', 'read', 'update', 'delete'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Login activity logs
export const loginLogs = pgTable("login_logs", {
  id: serial("id").primaryKey(), 
  userId: integer("user_id").references(() => users.id).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  success: boolean("success").notNull(),
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

// Accounting Module

// Chart of Accounts
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // E.g., "1000", "2000", etc.
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // Asset, Liability, Equity, Income, Expense
  subtype: text("subtype"), // E.g., "Current Asset", "Fixed Asset", etc.
  description: text("description"),
  parentId: integer("parent_id").references(() => accounts.id), // For hierarchy
  isActive: boolean("is_active").default(true).notNull(),
  balance: numeric("balance").default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Journal Entries
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  entryNumber: text("entry_number").notNull().unique(),
  date: date("date").notNull(),
  reference: text("reference"), // For linking to external documents
  memo: text("memo"),
  status: text("status").default("posted").notNull(), // draft, posted, etc.
  totalDebit: numeric("total_debit").notNull(),
  totalCredit: numeric("total_credit").notNull(),
  sourceType: text("source_type"), // manual, sale, purchase, etc.
  sourceId: integer("source_id"), // ID of the source document
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Journal Entry Lines
export const journalLines = pgTable("journal_lines", {
  id: serial("id").primaryKey(),
  journalId: integer("journal_id").references(() => journalEntries.id).notNull(),
  accountId: integer("account_id").references(() => accounts.id).notNull(),
  description: text("description"),
  debit: numeric("debit").default("0"),
  credit: numeric("credit").default("0"),
  position: integer("position").notNull(), // For ordering
});

// Financial Periods
export const financialPeriods = pgTable("financial_periods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status").default("open").notNull(), // open, closed, etc.
  isFiscalYear: boolean("is_fiscal_year").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Accounting Periods
export const accountingPeriods = pgTable("accounting_periods", {
  id: serial("id").primaryKey(),
  periodName: text("period_name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status").default("open").notNull(), // open, closed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customer Payments
export const customerPayments = pgTable("customer_payments", {
  id: serial("id").primaryKey(),
  paymentNumber: text("payment_number").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  amount: numeric("amount").notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, cheque, bankTransfer, creditCard, other
  reference: text("reference"),
  notes: text("notes"),
  status: text("status").default("completed").notNull(), // completed, pending, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payment Allocations (to track which invoices were paid)
export const paymentAllocations = pgTable("payment_allocations", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id").references(() => customerPayments.id).notNull(),
  invoiceId: integer("invoice_id").references(() => sales.id).notNull(),
  amount: numeric("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Financial Reports
export const financialReports = pgTable("financial_reports", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // pnl, balance_sheet, cash_flow
  name: text("name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  data: jsonb("data").notNull(), // Stored report data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
});

// Accounts Receivable (for tracking customer balances)
export const accountsReceivable = pgTable("accounts_receivable", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  amount: numeric("amount").notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status").default("outstanding").notNull(), // outstanding, partial, paid
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Accounts Payable (for tracking vendor bills)
export const accountsPayable = pgTable("accounts_payable", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  purchaseOrderId: integer("purchase_order_id").references(() => purchaseOrders.id),
  amount: numeric("amount").notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status").default("outstanding").notNull(), // outstanding, partial, paid
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// The parent-child relationship for accounts is already handled by the column reference
// We don't need to explicitly define the foreign key with Drizzle this way

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
  status: true,
  avatar: true,
});

export const insertUserPermissionSchema = createInsertSchema(userPermissions).pick({
  userId: true,
  moduleName: true,
  accessGranted: true,
});

export const insertProductCategorySchema = createInsertSchema(productCategories).pick({
  name: true,
  description: true,
});

export const insertProductSchema = createInsertSchema(products)
  .pick({
    name: true,
    drugName: true,
    categoryId: true,
    description: true,
    sku: true,
    barcode: true,
    costPrice: true,
    sellingPrice: true,
    quantity: true,
    unitOfMeasure: true,
    lowStockThreshold: true,
    expiryDate: true,
    status: true,
    manufacturer: true,
    location: true,
    shelf: true,
    imagePath: true,
  })
  .extend({
    // Override the numeric fields to accept either string or number
    costPrice: z.union([z.string(), z.number()]),
    sellingPrice: z.union([z.string(), z.number()]),
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

export const insertQuotationSchema = createInsertSchema(quotations).pick({
  quotationNumber: true,
  customerId: true,
  userId: true,
  validUntil: true,
  subtotal: true,
  taxRate: true,
  taxAmount: true,
  grandTotal: true,
  status: true,
  notes: true,
});

export const insertQuotationItemSchema = createInsertSchema(quotationItems).pick({
  quotationId: true,
  productId: true,
  quantity: true,
  unitPrice: true,
  total: true,
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

export const insertSystemPreferenceSchema = createInsertSchema(systemPreferences).pick({
  key: true,
  value: true,
  category: true,
  label: true,
  description: true,
  dataType: true,
  options: true,
});

export const updateSystemPreferenceSchema = z.object({
  value: z.any(),
  updatedAt: z.date().optional(),
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).pick({
  role: true,
  resource: true,
  action: true,
});

export const insertLoginLogSchema = createInsertSchema(loginLogs).pick({
  userId: true,
  ipAddress: true,
  userAgent: true,
  success: true,
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

export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type Quotation = typeof quotations.$inferSelect;

export type InsertQuotationItem = z.infer<typeof insertQuotationItemSchema>;
export type QuotationItem = typeof quotationItems.$inferSelect;

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
  costPrice: z.union([z.string(), z.number()]).optional(),
  sellingPrice: z.union([z.string(), z.number()]).optional(),
  quantity: z.union([z.string(), z.number()]).optional(),
  unitOfMeasure: z.string().optional(),
  lowStockThreshold: z.number().optional(),
  expiryDate: z.date().optional(),
  manufacturer: z.string().optional(),
  location: z.string().optional(),
  shelf: z.string().optional(),
  status: z.string().optional(),
  imagePath: z.string().optional(),
  updatedAt: z.date().optional()
});

export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;

export type InsertSystemPreference = z.infer<typeof insertSystemPreferenceSchema>;
export type SystemPreference = typeof systemPreferences.$inferSelect;
export type UpdateSystemPreference = z.infer<typeof updateSystemPreferenceSchema>;

export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;

export type InsertLoginLog = z.infer<typeof insertLoginLogSchema>;
export type LoginLog = typeof loginLogs.$inferSelect;

// Accounting module schemas and types
export const insertAccountSchema = createInsertSchema(accounts).pick({
  code: true,
  name: true,
  type: true,
  subtype: true,
  description: true,
  parentId: true,
  isActive: true,
});

export const insertAccountingPeriodSchema = createInsertSchema(accountingPeriods).pick({
  periodName: true,
  startDate: true,
  endDate: true,
  status: true,
});

export const insertCustomerPaymentSchema = createInsertSchema(customerPayments).pick({
  paymentNumber: true,
  customerId: true,
  amount: true,
  paymentDate: true,
  paymentMethod: true,
  reference: true,
  notes: true,
  status: true,
});

export const insertPaymentAllocationSchema = createInsertSchema(paymentAllocations).pick({
  paymentId: true,
  invoiceId: true,
  amount: true,
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).pick({
  entryNumber: true,
  date: true,
  reference: true,
  memo: true,
  status: true,
  totalDebit: true,
  totalCredit: true,
  sourceType: true,
  sourceId: true,
  userId: true,
});

export const insertJournalLineSchema = createInsertSchema(journalLines).pick({
  journalId: true,
  accountId: true,
  description: true,
  debit: true,
  credit: true,
  position: true,
});

export const insertFinancialPeriodSchema = createInsertSchema(financialPeriods).pick({
  name: true,
  startDate: true,
  endDate: true,
  status: true,
  isFiscalYear: true,
});

export const insertFinancialReportSchema = createInsertSchema(financialReports).pick({
  type: true,
  name: true,
  startDate: true,
  endDate: true,
  data: true,
  userId: true,
});

export const insertAccountsReceivableSchema = createInsertSchema(accountsReceivable).pick({
  customerId: true,
  invoiceId: true,
  amount: true,
  dueDate: true,
  status: true,
});

export const insertAccountsPayableSchema = createInsertSchema(accountsPayable).pick({
  supplierId: true,
  purchaseOrderId: true,
  amount: true,
  dueDate: true,
  status: true,
});

// Accounting module types
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;

export type InsertJournalLine = z.infer<typeof insertJournalLineSchema>;
export type JournalLine = typeof journalLines.$inferSelect;

export type InsertFinancialPeriod = z.infer<typeof insertFinancialPeriodSchema>;
export type FinancialPeriod = typeof financialPeriods.$inferSelect;

export type InsertFinancialReport = z.infer<typeof insertFinancialReportSchema>;
export type FinancialReport = typeof financialReports.$inferSelect;

export type InsertAccountsReceivable = z.infer<typeof insertAccountsReceivableSchema>;
export type AccountsReceivable = typeof accountsReceivable.$inferSelect;

export type InsertAccountsPayable = z.infer<typeof insertAccountsPayableSchema>;
export type AccountsPayable = typeof accountsPayable.$inferSelect;

export type InsertAccountingPeriod = z.infer<typeof insertAccountingPeriodSchema>;
export type AccountingPeriod = typeof accountingPeriods.$inferSelect;

export type InsertCustomerPayment = z.infer<typeof insertCustomerPaymentSchema>;
export type CustomerPayment = typeof customerPayments.$inferSelect;

export type InsertPaymentAllocation = z.infer<typeof insertPaymentAllocationSchema>;
export type PaymentAllocation = typeof paymentAllocations.$inferSelect;

export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;
export type UserPermission = typeof userPermissions.$inferSelect;
