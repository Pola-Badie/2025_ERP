import {
  users, type User, type InsertUser,
  userPermissions, type UserPermission, type InsertUserPermission,
  products, type Product, type InsertProduct, type UpdateProduct,
  productCategories, type ProductCategory, type InsertProductCategory,
  customers, type Customer, type InsertCustomer,
  suppliers, type Supplier, type InsertSupplier,
  sales, type Sale, type InsertSale,
  saleItems, type SaleItem, type InsertSaleItem,
  purchaseOrders, type PurchaseOrder, type InsertPurchaseOrder,
  purchaseOrderItems, type PurchaseOrderItem,
  backups, type Backup, type InsertBackup,
  backupSettings, type BackupSettings, type UpdateBackupSettings,
  inventoryTransactions, type InventoryTransaction,
  salesReports, type SalesReport, type InsertSalesReport,
  systemPreferences, type SystemPreference, type InsertSystemPreference, type UpdateSystemPreference,
  rolePermissions, type RolePermission, type InsertRolePermission,
  loginLogs, type LoginLog, type InsertLoginLog,
  quotations, type Quotation, type InsertQuotation,
  quotationItems, type QuotationItem, type InsertQuotationItem,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem,
  orderFees, type OrderFee, type InsertOrderFee,
  // New pharmaceutical tables
  batches, type Batch, type InsertBatch,
  productFormulations, type ProductFormulation, type InsertProductFormulation,
  productSafety, type ProductSafety, type InsertProductSafety,
  qualityTests, type QualityTest, type InsertQualityTest,
  productionOrders, type ProductionOrder, type InsertProductionOrder,
  productionMaterials, type ProductionMaterial,
  productLabels, type ProductLabel, type InsertProductLabel,
  regulatorySubmissions, type RegulatorySubmission, type InsertRegulatorySubmission,
  inventoryAdjustments, type InventoryAdjustment, type InsertInventoryAdjustment,
  warehouses, type Warehouse, type InsertWarehouse,
  warehouseLocations, type WarehouseLocation, type InsertWarehouseLocation,
  stockMovements, type StockMovement, type InsertStockMovement,
  // Financial tables
  accounts, type Account, type InsertAccount,
  journalEntries, type JournalEntry, type InsertJournalEntry,
  journalLines, type JournalLine, type InsertJournalLine,
  financialPeriods, type FinancialPeriod, type InsertFinancialPeriod,
  accountingPeriods, type AccountingPeriod, type InsertAccountingPeriod,
  customerPayments, type CustomerPayment, type InsertCustomerPayment,
  paymentAllocations, type PaymentAllocation, type InsertPaymentAllocation,
  financialReports, type FinancialReport, type InsertFinancialReport,
  accountsReceivable, type AccountsReceivable, type InsertAccountsReceivable,
  accountsPayable, type AccountsPayable, type InsertAccountsPayable,
  taxRates, type TaxRate, type InsertTaxRate,
  currencies, type Currency, type InsertCurrency,
  bankAccounts, type BankAccount, type InsertBankAccount,
  budgets, type Budget, type InsertBudget,
  budgetCategories, type BudgetCategory,
  assets, type Asset, type InsertAsset,
  maintenanceRecords, type MaintenanceRecord,
  // HR tables
  departments, type Department, type InsertDepartment,
  employeeProfiles, type EmployeeProfile, type InsertEmployeeProfile,
  // Document management
  documentTypes, type DocumentType,
  documents, type Document, type InsertDocument,
  // Notifications
  notificationTemplates, type NotificationTemplate,
  notifications, type Notification, type InsertNotification,
  // Reports and analytics
  reportDefinitions, type ReportDefinition,
  reportInstances, type ReportInstance,
  // Integration
  integrationConfigs, type IntegrationConfig,
  syncLogs, type SyncLog,
  auditLogs, type AuditLog
} from "@shared/schema";
import { promises as fs } from 'fs';
import path from 'path';
import { and, asc, count, desc, eq, gte, lte, sql, sum } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // User methods
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deactivateUser(id: number): Promise<boolean>;
  
  // User permission methods
  getUserPermissions(userId: number): Promise<UserPermission[]>;
  getUserPermissionsByModule(userId: number, moduleName: string): Promise<UserPermission | undefined>;
  createUserPermission(permission: InsertUserPermission): Promise<UserPermission>;
  updateUserPermission(userId: number, moduleName: string, accessGranted: boolean): Promise<UserPermission | undefined>;
  deleteUserPermission(userId: number, moduleName: string): Promise<boolean>;
  
  // Product methods
  getProducts(filters?: { type?: string; status?: string; categoryId?: number }): Promise<Product[]>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  getProductsByStatus(status: string): Promise<Product[]>;
  getLowStockProducts(): Promise<Product[]>;
  getExpiringProducts(daysThreshold: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: UpdateProduct): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Category methods
  getCategories(): Promise<ProductCategory[]>;
  getCategory(id: number): Promise<ProductCategory | undefined>;
  createCategory(category: InsertProductCategory): Promise<ProductCategory>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Customer methods
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getTotalCustomersCount(): Promise<number>;
  getNewCustomersCount(days: number): Promise<number>;
  
  // Supplier methods
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  
  // Sales methods
  getSales(): Promise<Sale[]>;
  getSalesByDate(startDate: Date, endDate: Date): Promise<Sale[]>;
  getSalesByCustomer(customerId: number): Promise<Sale[]>;
  getSale(id: number): Promise<Sale | undefined>;
  createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<Sale>;
  getTodaySalesTotal(): Promise<number>;
  getMonthSalesTotal(): Promise<number>;
  
  // Purchase methods
  getPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined>;
  createPurchaseOrder(order: InsertPurchaseOrder, items: any[]): Promise<PurchaseOrder>;
  
  // Report methods
  getSalesReport(startDate: Date, endDate: Date): Promise<SalesReport | undefined>;
  createSalesReport(report: InsertSalesReport): Promise<SalesReport>;
  
  // Backup methods
  getBackups(): Promise<Backup[]>;
  getLatestBackup(): Promise<Backup | undefined>;
  createBackup(backup: InsertBackup): Promise<Backup>;
  
  // Backup settings methods
  getBackupSettings(): Promise<BackupSettings>;
  updateBackupSettings(settings: UpdateBackupSettings): Promise<BackupSettings>;
  
  // Backup and recovery operations
  performBackup(type: string): Promise<Backup>;
  restoreFromBackup(backupId: number): Promise<boolean>;
  
  // System preferences methods
  getSystemPreferences(): Promise<SystemPreference[]>;
  getSystemPreferencesByCategory(category: string): Promise<SystemPreference[]>;
  getSystemPreference(key: string): Promise<SystemPreference | undefined>;
  createSystemPreference(preference: InsertSystemPreference): Promise<SystemPreference>;
  updateSystemPreference(key: string, value: any): Promise<SystemPreference | undefined>;
  
  // Role permissions methods
  getRolePermissions(role: string): Promise<RolePermission[]>;
  createRolePermission(permission: InsertRolePermission): Promise<RolePermission>;
  deleteRolePermission(id: number): Promise<boolean>;
  
  // Login logs methods
  getLoginLogs(limit?: number): Promise<LoginLog[]>;
  createLoginLog(log: InsertLoginLog): Promise<LoginLog>;
  
  // Quotation methods
  getQuotations(query: string, status: string, date: string): Promise<Quotation[]>;
  getQuotation(id: number): Promise<Quotation | undefined>;
  getQuotationItems(quotationId: number): Promise<QuotationItem[]>;
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem>;
  updateQuotation(id: number, data: Partial<Quotation>): Promise<Quotation | undefined>;
  deleteQuotation(id: number): Promise<boolean>;
  deleteQuotationItems(quotationId: number): Promise<boolean>;
  
  // Order Management methods
  getOrders(query?: string, orderType?: string, status?: string): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  getOrderFees(orderId: number): Promise<OrderFee[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  createOrderFee(fee: InsertOrderFee): Promise<OrderFee>;
  updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;
  deleteOrderItems(orderId: number): Promise<boolean>;
  deleteOrderFees(orderId: number): Promise<boolean>;

  // Batch Management methods
  getBatches(filters?: { productId?: number; status?: string; supplierId?: number }): Promise<Batch[]>;
  getBatch(id: number): Promise<Batch | undefined>;
  getBatchByNumber(batchNumber: string): Promise<Batch | undefined>;
  getBatchesByProduct(productId: number): Promise<Batch[]>;
  getBatchesByStatus(status: string): Promise<Batch[]>;
  getExpiringBatches(days: number): Promise<Batch[]>;
  createBatch(batch: InsertBatch): Promise<Batch>;
  updateBatch(id: number, data: Partial<Batch>): Promise<Batch | undefined>;
  deleteBatch(id: number): Promise<boolean>;

  // Product Formulation methods
  getProductFormulations(productId: number): Promise<ProductFormulation[]>;
  getFormulation(id: number): Promise<ProductFormulation | undefined>;
  createFormulation(formulation: InsertProductFormulation): Promise<ProductFormulation>;
  updateFormulation(id: number, data: Partial<ProductFormulation>): Promise<ProductFormulation | undefined>;
  deleteFormulation(id: number): Promise<boolean>;

  // Product Safety methods
  getProductSafety(productId: number): Promise<ProductSafety | undefined>;
  createProductSafety(safety: InsertProductSafety): Promise<ProductSafety>;
  updateProductSafety(productId: number, data: Partial<ProductSafety>): Promise<ProductSafety | undefined>;
  deleteProductSafety(productId: number): Promise<boolean>;

  // Quality Control methods
  getQualityTests(batchId?: number): Promise<QualityTest[]>;
  getQualityTest(id: number): Promise<QualityTest | undefined>;
  getQualityTestsByBatch(batchId: number): Promise<QualityTest[]>;
  createQualityTest(test: InsertQualityTest): Promise<QualityTest>;
  updateQualityTest(id: number, data: Partial<QualityTest>): Promise<QualityTest | undefined>;
  deleteQualityTest(id: number): Promise<boolean>;

  // Production Order methods
  getProductionOrders(filters?: { status?: string; productId?: number }): Promise<ProductionOrder[]>;
  getProductionOrder(id: number): Promise<ProductionOrder | undefined>;
  getProductionMaterials(productionOrderId: number): Promise<ProductionMaterial[]>;
  createProductionOrder(order: InsertProductionOrder): Promise<ProductionOrder>;
  updateProductionOrder(id: number, data: Partial<ProductionOrder>): Promise<ProductionOrder | undefined>;
  deleteProductionOrder(id: number): Promise<boolean>;

  // Product Label methods
  getProductLabels(productId?: number, batchId?: number): Promise<ProductLabel[]>;
  getProductLabel(id: number): Promise<ProductLabel | undefined>;
  createProductLabel(label: InsertProductLabel): Promise<ProductLabel>;
  updateProductLabel(id: number, data: Partial<ProductLabel>): Promise<ProductLabel | undefined>;
  deleteProductLabel(id: number): Promise<boolean>;

  // Regulatory Submission methods
  getRegulatorySubmissions(productId?: number, status?: string): Promise<RegulatorySubmission[]>;
  getRegulatorySubmission(id: number): Promise<RegulatorySubmission | undefined>;
  createRegulatorySubmission(submission: InsertRegulatorySubmission): Promise<RegulatorySubmission>;
  updateRegulatorySubmission(id: number, data: Partial<RegulatorySubmission>): Promise<RegulatorySubmission | undefined>;
  deleteRegulatorySubmission(id: number): Promise<boolean>;

  // Inventory Adjustment methods
  getInventoryAdjustments(filters?: { productId?: number; dateFrom?: string; dateTo?: string }): Promise<InventoryAdjustment[]>;
  getInventoryAdjustment(id: number): Promise<InventoryAdjustment | undefined>;
  createInventoryAdjustment(adjustment: InsertInventoryAdjustment): Promise<InventoryAdjustment>;
  updateInventoryAdjustment(id: number, data: Partial<InventoryAdjustment>): Promise<InventoryAdjustment | undefined>;
  deleteInventoryAdjustment(id: number): Promise<boolean>;

  // Warehouse Management methods
  getWarehouses(): Promise<Warehouse[]>;
  getWarehouse(id: number): Promise<Warehouse | undefined>;
  getWarehouseLocations(warehouseId?: number): Promise<WarehouseLocation[]>;
  getWarehouseLocation(id: number): Promise<WarehouseLocation | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  createWarehouseLocation(location: InsertWarehouseLocation): Promise<WarehouseLocation>;
  updateWarehouse(id: number, data: Partial<Warehouse>): Promise<Warehouse | undefined>;
  updateWarehouseLocation(id: number, data: Partial<WarehouseLocation>): Promise<WarehouseLocation | undefined>;
  deleteWarehouse(id: number): Promise<boolean>;
  deleteWarehouseLocation(id: number): Promise<boolean>;

  // Stock Movement methods
  getStockMovements(filters?: { productId?: number; dateFrom?: string; dateTo?: string }): Promise<StockMovement[]>;
  getStockMovement(id: number): Promise<StockMovement | undefined>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
  updateStockMovement(id: number, data: Partial<StockMovement>): Promise<StockMovement | undefined>;
  deleteStockMovement(id: number): Promise<boolean>;

  // Financial - Account methods
  getAccounts(type?: string): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  getAccountByCode(code: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, data: Partial<Account>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;

  // Journal Entry methods
  getJournalEntries(filters?: { dateFrom?: string; dateTo?: string; status?: string }): Promise<JournalEntry[]>;
  getJournalEntry(id: number): Promise<JournalEntry | undefined>;
  getJournalLines(journalId: number): Promise<JournalLine[]>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  createJournalLine(line: InsertJournalLine): Promise<JournalLine>;
  updateJournalEntry(id: number, data: Partial<JournalEntry>): Promise<JournalEntry | undefined>;
  deleteJournalEntry(id: number): Promise<boolean>;

  // Financial Period methods
  getFinancialPeriods(): Promise<FinancialPeriod[]>;
  getFinancialPeriod(id: number): Promise<FinancialPeriod | undefined>;
  getCurrentFinancialPeriod(): Promise<FinancialPeriod | undefined>;
  createFinancialPeriod(period: InsertFinancialPeriod): Promise<FinancialPeriod>;
  updateFinancialPeriod(id: number, data: Partial<FinancialPeriod>): Promise<FinancialPeriod | undefined>;
  deleteFinancialPeriod(id: number): Promise<boolean>;

  // Customer Payment methods
  getCustomerPayments(filters?: { customerId?: number; dateFrom?: string; dateTo?: string }): Promise<CustomerPayment[]>;
  getCustomerPayment(id: number): Promise<CustomerPayment | undefined>;
  getPaymentAllocations(paymentId: number): Promise<PaymentAllocation[]>;
  createCustomerPayment(payment: InsertCustomerPayment): Promise<CustomerPayment>;
  createPaymentAllocation(allocation: InsertPaymentAllocation): Promise<PaymentAllocation>;
  updateCustomerPayment(id: number, data: Partial<CustomerPayment>): Promise<CustomerPayment | undefined>;
  deleteCustomerPayment(id: number): Promise<boolean>;

  // Tax Rate methods
  getTaxRates(active?: boolean): Promise<TaxRate[]>;
  getTaxRate(id: number): Promise<TaxRate | undefined>;
  createTaxRate(taxRate: InsertTaxRate): Promise<TaxRate>;
  updateTaxRate(id: number, data: Partial<TaxRate>): Promise<TaxRate | undefined>;
  deleteTaxRate(id: number): Promise<boolean>;

  // Currency methods
  getCurrencies(active?: boolean): Promise<Currency[]>;
  getCurrency(id: number): Promise<Currency | undefined>;
  getBaseCurrency(): Promise<Currency | undefined>;
  createCurrency(currency: InsertCurrency): Promise<Currency>;
  updateCurrency(id: number, data: Partial<Currency>): Promise<Currency | undefined>;
  deleteCurrency(id: number): Promise<boolean>;

  // Bank Account methods
  getBankAccounts(active?: boolean): Promise<BankAccount[]>;
  getBankAccount(id: number): Promise<BankAccount | undefined>;
  createBankAccount(account: InsertBankAccount): Promise<BankAccount>;
  updateBankAccount(id: number, data: Partial<BankAccount>): Promise<BankAccount | undefined>;
  deleteBankAccount(id: number): Promise<boolean>;

  // Budget methods
  getBudgets(year?: number): Promise<Budget[]>;
  getBudget(id: number): Promise<Budget | undefined>;
  getBudgetCategories(budgetId: number): Promise<BudgetCategory[]>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, data: Partial<Budget>): Promise<Budget | undefined>;
  deleteBudget(id: number): Promise<boolean>;

  // Asset methods
  getAssets(category?: string, status?: string): Promise<Asset[]>;
  getAsset(id: number): Promise<Asset | undefined>;
  getMaintenanceRecords(assetId: number): Promise<MaintenanceRecord[]>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: number, data: Partial<Asset>): Promise<Asset | undefined>;
  deleteAsset(id: number): Promise<boolean>;

  // Department methods
  getDepartments(active?: boolean): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, data: Partial<Department>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;

  // Employee Profile methods
  getEmployeeProfiles(departmentId?: number): Promise<EmployeeProfile[]>;
  getEmployeeProfile(id: number): Promise<EmployeeProfile | undefined>;
  getEmployeeByUserId(userId: number): Promise<EmployeeProfile | undefined>;
  createEmployeeProfile(profile: InsertEmployeeProfile): Promise<EmployeeProfile>;
  updateEmployeeProfile(id: number, data: Partial<EmployeeProfile>): Promise<EmployeeProfile | undefined>;
  deleteEmployeeProfile(id: number): Promise<boolean>;

  // Document methods
  getDocuments(entityType?: string, entityId?: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentTypes(): Promise<DocumentType[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, data: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;

  // Notification methods
  getNotifications(userId: number, unreadOnly?: boolean): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationTemplates(): Promise<NotificationTemplate[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  private backupDir: string;
  
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    
    // Ensure backup directory exists
    fs.mkdir(this.backupDir, { recursive: true }).catch(err => {
      console.error('Error creating backup directory:', err);
    });
  }
  
  // User methods
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  async deactivateUser(id: number): Promise<boolean> {
    const [user] = await db.update(users)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return !!user;
  }
  
  // User permissions methods
  async getUserPermissions(userId: number): Promise<UserPermission[]> {
    return db.select().from(userPermissions).where(eq(userPermissions.userId, userId));
  }
  
  async getUserPermissionsByModule(userId: number, moduleName: string): Promise<UserPermission | undefined> {
    const [permission] = await db.select().from(userPermissions)
      .where(and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.moduleName, moduleName)
      ));
    return permission;
  }
  
  async createUserPermission(permission: InsertUserPermission): Promise<UserPermission> {
    const [createdPermission] = await db.insert(userPermissions).values(permission).returning();
    return createdPermission;
  }
  
  async updateUserPermission(userId: number, moduleName: string, accessGranted: boolean): Promise<UserPermission | undefined> {
    const [permission] = await db.update(userPermissions)
      .set({ accessGranted, updatedAt: new Date() })
      .where(and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.moduleName, moduleName)
      ))
      .returning();
    
    // If no record exists, create one
    if (!permission) {
      return this.createUserPermission({
        userId,
        moduleName,
        accessGranted
      });
    }
    
    return permission;
  }
  
  async deleteUserPermission(userId: number, moduleName: string): Promise<boolean> {
    await db.delete(userPermissions)
      .where(and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.moduleName, moduleName)
      ));
    return true;
  }
  
  // Product methods
  async getProducts(filters?: { type?: string; status?: string; categoryId?: number }): Promise<Product[]> {
    let query = db.select().from(products);
    
    if (filters) {
      const conditions = [];
      
      if (filters.type !== undefined) {
        conditions.push(eq(products.productType, filters.type));
      }
      
      if (filters.status !== undefined) {
        conditions.push(eq(products.status, filters.status));
      }
      
      if (filters.categoryId !== undefined) {
        conditions.push(eq(products.categoryId, filters.categoryId));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query;
  }
  
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return this.getProducts({ categoryId });
  }
  
  async getProductsByStatus(status: string): Promise<Product[]> {
    return this.getProducts({ status });
  }
  
  async getLowStockProducts(): Promise<Product[]> {
    return db.select().from(products)
      .where(sql`${products.quantity} <= ${products.lowStockThreshold}`);
  }
  
  async getExpiringProducts(daysThreshold: number): Promise<Product[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysThreshold);
    
    return db.select().from(products)
      .where(and(
        sql`${products.expiryDate} IS NOT NULL`,
        sql`${products.expiryDate} <= ${targetDate}`,
        sql`${products.status} != 'expired'`
      ));
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    const [createdProduct] = await db.insert(products).values(product).returning();
    return createdProduct;
  }
  
  async updateProduct(id: number, updatedProduct: UpdateProduct): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set({ ...updatedProduct, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return true; // Assuming successful if no error is thrown
  }
  
  // Category methods
  async getCategories(): Promise<ProductCategory[]> {
    return db.select().from(productCategories);
  }
  
  async getCategory(id: number): Promise<ProductCategory | undefined> {
    const [category] = await db.select().from(productCategories).where(eq(productCategories.id, id));
    return category;
  }
  
  async createCategory(category: InsertProductCategory): Promise<ProductCategory> {
    const [createdCategory] = await db.insert(productCategories).values(category).returning();
    return createdCategory;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    try {
      // First check if any products are using this category
      const productsUsingCategory = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.categoryId, id));
      
      if (productsUsingCategory.length > 0) {
        // Category is in use, cannot delete
        console.log(`Category ${id} cannot be deleted, it's used by ${productsUsingCategory.length} product(s)`);
        return false;
      }
      
      // If no products using it, proceed with deletion
      const result = await db.delete(productCategories).where(eq(productCategories.id, id));
      console.log(`Category ${id} deleted successfully`);
      return true;
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      return false;
    }
  }
  
  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers);
  }
  
  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }
  
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [createdCustomer] = await db.insert(customers).values(customer).returning();
    return createdCustomer;
  }
  
  async getTotalCustomersCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(customers);
    return result.count;
  }
  
  async getNewCustomersCount(days: number): Promise<number> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - days);
    
    const [result] = await db.select({ count: count() })
      .from(customers)
      .where(gte(customers.createdAt, targetDate));
    
    return result.count;
  }
  
  // Supplier methods
  async getSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers);
  }
  
  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }
  
  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [createdSupplier] = await db.insert(suppliers).values(supplier).returning();
    return createdSupplier;
  }
  
  // Sales methods
  async getSales(): Promise<Sale[]> {
    return db.select().from(sales).orderBy(desc(sales.date));
  }
  
  async getSalesByDate(startDate: Date, endDate: Date): Promise<Sale[]> {
    return db.select().from(sales)
      .where(and(
        gte(sales.date, startDate),
        lte(sales.date, endDate)
      ))
      .orderBy(desc(sales.date));
  }
  
  async getSalesByCustomer(customerId: number): Promise<Sale[]> {
    return db.select().from(sales)
      .where(eq(sales.customerId, customerId))
      .orderBy(desc(sales.date));
  }
  
  async getSale(id: number): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale;
  }
  
  async getSaleItems(saleId: number): Promise<SaleItem[]> {
    return db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
  }
  
  async createSale(saleData: InsertSale, saleItemsData: InsertSaleItem[]): Promise<Sale> {
    // Start a transaction
    // Note: For simplicity, this doesn't use a transaction, but in production you should
    const [sale] = await db.insert(sales).values(saleData).returning();
    
    // Insert sale items with the sale ID
    for (const item of saleItemsData) {
      await db.insert(saleItems).values({
        ...item,
        saleId: sale.id
      });
      
      // Update product stock
      const product = await this.getProduct(item.productId);
      if (product) {
        await this.updateProduct(product.id, {
          quantity: product.quantity - item.quantity
        });
        
        // Record inventory transaction
        await db.insert(inventoryTransactions).values({
          productId: item.productId,
          transactionType: 'sale',
          quantity: -item.quantity,
          referenceId: sale.id,
          referenceType: 'sale',
          userId: saleData.userId,
          date: new Date()
        });
      }
    }
    
    return sale;
  }
  
  async getTodaySalesTotal(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [result] = await db.select({ total: sum(sales.totalAmount) })
      .from(sales)
      .where(gte(sales.date, today));
    
    return Number(result.total) || 0;
  }
  
  async getMonthSalesTotal(): Promise<number> {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    const [result] = await db.select({ total: sum(sales.totalAmount) })
      .from(sales)
      .where(gte(sales.date, firstDayOfMonth));
    
    return Number(result.total) || 0;
  }
  
  // Purchase methods
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.orderDate));
  }
  
  async getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined> {
    const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    return order;
  }
  
  async createPurchaseOrder(orderData: InsertPurchaseOrder, items: any[]): Promise<PurchaseOrder> {
    // Start a transaction
    // Note: For simplicity, this doesn't use a transaction, but in production you should
    const [order] = await db.insert(purchaseOrders).values(orderData).returning();
    
    // Insert purchase items
    for (const item of items) {
      await db.insert(purchaseOrderItems).values({
        ...item,
        purchaseOrderId: order.id
      });
    }
    
    return order;
  }
  
  // Report methods
  async getSalesReport(startDate: Date, endDate: Date): Promise<SalesReport | undefined> {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const [report] = await db.select().from(salesReports)
      .where(sql`${salesReports.reportDate} >= ${startDateStr} AND ${salesReports.reportDate} <= ${endDateStr}`)
      .orderBy(desc(salesReports.reportDate))
      .limit(1);
    
    return report;
  }
  
  async createSalesReport(report: InsertSalesReport): Promise<SalesReport> {
    const [createdReport] = await db.insert(salesReports).values(report).returning();
    return createdReport;
  }
  
  // Backup methods
  async getBackups(): Promise<Backup[]> {
    return db.select().from(backups).orderBy(desc(backups.timestamp));
  }
  
  async getLatestBackup(): Promise<Backup | undefined> {
    const [backup] = await db.select().from(backups)
      .orderBy(desc(backups.timestamp))
      .limit(1);
    
    return backup;
  }
  
  async createBackup(backup: InsertBackup): Promise<Backup> {
    const [createdBackup] = await db.insert(backups).values({
      ...backup,
      timestamp: new Date()
    }).returning();
    
    return createdBackup;
  }
  
  // Backup settings methods
  async getBackupSettings(): Promise<BackupSettings> {
    const [settings] = await db.select().from(backupSettings).limit(1);
    
    if (!settings) {
      // Create default settings if none exist
      return this.createDefaultBackupSettings();
    }
    
    return settings;
  }
  
  private async createDefaultBackupSettings(): Promise<BackupSettings> {
    const [settings] = await db.insert(backupSettings).values({
      dailyBackup: true,
      weeklyBackup: true,
      monthlyBackup: true,
      backupTime: "02:00",
      retentionDays: 30
    }).returning();
    
    return settings;
  }
  
  async updateBackupSettings(settings: UpdateBackupSettings): Promise<BackupSettings> {
    // Get current settings or create default ones
    const currentSettings = await this.getBackupSettings();
    
    const [updatedSettings] = await db.update(backupSettings)
      .set(settings)
      .where(eq(backupSettings.id, currentSettings.id))
      .returning();
    
    return updatedSettings;
  }
  
  // Backup and recovery operations
  async performBackup(type: string): Promise<Backup> {
    try {
      // Ensure backup directory exists
      await fs.mkdir(this.backupDir, { recursive: true });
      
      // Get all data to back up
      const allUsers = await db.select().from(users);
      const allProducts = await db.select().from(products);
      const allCategories = await db.select().from(productCategories);
      const allCustomers = await db.select().from(customers);
      const allSuppliers = await db.select().from(suppliers);
      const allSales = await db.select().from(sales);
      const allSaleItems = await db.select().from(saleItems);
      const allPurchases = await db.select().from(purchaseOrders);
      const allPurchaseItems = await db.select().from(purchaseOrderItems);
      
      // Prepare backup data
      const backupData = {
        users: allUsers,
        products: allProducts,
        categories: allCategories,
        customers: allCustomers,
        suppliers: allSuppliers,
        sales: allSales,
        saleItems: allSaleItems,
        purchases: allPurchases,
        purchaseItems: allPurchaseItems,
        timestamp: new Date().toISOString()
      };
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${type}-${timestamp}.json`;
      const filePath = path.join(this.backupDir, filename);
      
      // Write backup file
      await fs.writeFile(filePath, JSON.stringify(backupData, null, 2), 'utf8');
      
      // Get file size
      const stats = await fs.stat(filePath);
      const size = stats.size;
      
      // Create backup record
      return await this.createBackup({
        filename,
        size,
        status: 'completed',
        type
      });
    } catch (error) {
      console.error('Backup error:', error);
      
      // Create failed backup record
      return await this.createBackup({
        filename: `failed-backup-${type}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
        size: 0,
        status: 'failed',
        type
      });
    }
  }
  
  async restoreFromBackup(backupId: number): Promise<boolean> {
    try {
      const backup = await this.getBackup(backupId);
      if (!backup) return false;
      
      const filePath = path.join(this.backupDir, backup.filename);
      
      // Read backup file
      const backupDataStr = await fs.readFile(filePath, 'utf8');
      const backupData = JSON.parse(backupDataStr);
      
      // This is simplified. In a real application, you'd need:
      // 1. A transaction to ensure all or nothing
      // 2. Clear all existing data (or have a migration strategy)
      // 3. Restore all data from the backup
      // 4. Handle foreign key constraints properly
      
      // Just an example of restoring users
      for (const user of backupData.users) {
        await db.insert(users).values(user).onConflictDoUpdate({
          target: users.id,
          set: user
        });
      }
      
      // Continue with other tables...
      
      return true;
    } catch (error) {
      console.error('Restore error:', error);
      return false;
    }
  }
  
  private async getBackup(id: number): Promise<Backup | undefined> {
    const [backup] = await db.select().from(backups).where(eq(backups.id, id));
    return backup;
  }
  
  // System Preferences methods
  async getSystemPreferences(): Promise<SystemPreference[]> {
    return db.select().from(systemPreferences).orderBy(asc(systemPreferences.category), asc(systemPreferences.key));
  }
  
  async getSystemPreferencesByCategory(category: string): Promise<SystemPreference[]> {
    return db.select().from(systemPreferences)
      .where(eq(systemPreferences.category, category))
      .orderBy(asc(systemPreferences.key));
  }
  
  async getSystemPreference(key: string): Promise<SystemPreference | undefined> {
    const [preference] = await db.select().from(systemPreferences).where(eq(systemPreferences.key, key));
    return preference;
  }
  
  async createSystemPreference(preference: InsertSystemPreference): Promise<SystemPreference> {
    const [createdPreference] = await db.insert(systemPreferences).values(preference).returning();
    return createdPreference;
  }
  
  async updateSystemPreference(key: string, value: any): Promise<SystemPreference | undefined> {
    const [updatedPreference] = await db.update(systemPreferences)
      .set({ 
        value, 
        updatedAt: new Date() 
      })
      .where(eq(systemPreferences.key, key))
      .returning();
    
    return updatedPreference;
  }
  
  // Role Permissions methods
  async getRolePermissions(role: string): Promise<RolePermission[]> {
    return db.select().from(rolePermissions)
      .where(eq(rolePermissions.role, role));
  }
  
  async createRolePermission(permission: InsertRolePermission): Promise<RolePermission> {
    const [createdPermission] = await db.insert(rolePermissions).values(permission).returning();
    return createdPermission;
  }
  
  async deleteRolePermission(id: number): Promise<boolean> {
    await db.delete(rolePermissions).where(eq(rolePermissions.id, id));
    return true;
  }
  
  // Login Logs methods
  async getLoginLogs(limit: number = 100): Promise<LoginLog[]> {
    return db.select().from(loginLogs)
      .orderBy(desc(loginLogs.timestamp))
      .limit(limit);
  }
  
  async createLoginLog(log: InsertLoginLog): Promise<LoginLog> {
    const [createdLog] = await db.insert(loginLogs).values(log).returning();
    return createdLog;
  }
  
  // Quotation methods
  async getQuotations(query: string, status: string, date: string): Promise<Quotation[]> {
    // Base query
    let quotationsQuery = db.select({
      quotation: quotations,
      customer: customers
    })
    .from(quotations)
    .leftJoin(customers, eq(quotations.customerId, customers.id))
    .orderBy(desc(quotations.createdAt));
    
    // Apply filters if provided
    if (query && query.trim() !== '') {
      // Search by quotation number or customer name
      quotationsQuery = quotationsQuery.where(
        sql`LOWER(${quotations.quotationNumber}) LIKE LOWER(${'%' + query + '%'}) OR 
            LOWER(${customers.name}) LIKE LOWER(${'%' + query + '%'})`
      );
    }
    
    if (status && status !== 'all') {
      quotationsQuery = quotationsQuery.where(eq(quotations.status, status));
    }
    
    if (date && date !== 'all') {
      let dateFilter: Date;
      
      switch (date) {
        case 'today':
          dateFilter = new Date();
          dateFilter.setHours(0, 0, 0, 0);
          quotationsQuery = quotationsQuery.where(gte(quotations.issueDate, dateFilter));
          break;
        case 'week':
          dateFilter = new Date();
          dateFilter.setDate(dateFilter.getDate() - 7);
          quotationsQuery = quotationsQuery.where(gte(quotations.issueDate, dateFilter));
          break;
        case 'month':
          dateFilter = new Date();
          dateFilter.setMonth(dateFilter.getMonth() - 1);
          quotationsQuery = quotationsQuery.where(gte(quotations.issueDate, dateFilter));
          break;
        case 'year':
          dateFilter = new Date();
          dateFilter.setFullYear(dateFilter.getFullYear() - 1);
          quotationsQuery = quotationsQuery.where(gte(quotations.issueDate, dateFilter));
          break;
      }
    }
    
    const result = await quotationsQuery;
    
    // Transform the result to include customer data
    return result.map(row => ({
      ...row.quotation,
      customer: row.customer
    })) as Quotation[];
  }
  
  async getQuotation(id: number): Promise<Quotation | undefined> {
    const [result] = await db.select({
      quotation: quotations,
      customer: customers
    })
    .from(quotations)
    .leftJoin(customers, eq(quotations.customerId, customers.id))
    .where(eq(quotations.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.quotation,
      customer: result.customer
    } as unknown as Quotation;
  }
  
  async getQuotationItems(quotationId: number): Promise<QuotationItem[]> {
    const items = await db.select({
      item: quotationItems,
      product: products
    })
    .from(quotationItems)
    .innerJoin(products, eq(quotationItems.productId, products.id))
    .where(eq(quotationItems.quotationId, quotationId));
    
    return items.map(row => ({
      ...row.item,
      product: row.product
    })) as unknown as QuotationItem[];
  }
  
  async createQuotation(quotation: InsertQuotation): Promise<Quotation> {
    const [createdQuotation] = await db.insert(quotations).values(quotation).returning();
    return createdQuotation;
  }
  
  async createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem> {
    const [createdItem] = await db.insert(quotationItems).values(item).returning();
    return createdItem;
  }
  
  async updateQuotation(id: number, data: Partial<Quotation>): Promise<Quotation | undefined> {
    const [updatedQuotation] = await db.update(quotations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(quotations.id, id))
      .returning();
    
    return updatedQuotation;
  }
  
  async deleteQuotation(id: number): Promise<boolean> {
    await db.delete(quotations).where(eq(quotations.id, id));
    return true;
  }
  
  async deleteQuotationItems(quotationId: number): Promise<boolean> {
    await db.delete(quotationItems).where(eq(quotationItems.quotationId, quotationId));
    return true;
  }

  // ============ Order Management Methods ============
  
  // Get all orders with filtering
  async getOrders(query: string = '', orderType: string = '', status: string = ''): Promise<Order[]> {
    let ordersList = db.select({
      order: orders,
      customer: customers
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .orderBy(desc(orders.createdAt));
    
    // Apply filters if provided
    if (orderType && orderType !== 'all') {
      ordersList = ordersList.where(eq(orders.orderType, orderType));
    }
    
    if (status && status !== 'all') {
      ordersList = ordersList.where(eq(orders.status, status));
    }
    
    if (query && query.trim() !== '') {
      ordersList = ordersList.where(
        sql`LOWER(${orders.orderNumber}) LIKE LOWER(${'%' + query + '%'}) OR 
            LOWER(${orders.description || ''}) LIKE LOWER(${'%' + query + '%'}) OR
            LOWER(${customers.name || ''}) LIKE LOWER(${'%' + query + '%'})`
      );
    }
    
    // Execute query
    const results = await ordersList;
    
    // Transform results
    return results.map(row => ({
      ...row.order,
      customer: row.customer
    })) as unknown as Order[];
  }
  
  // Get order by ID with details
  async getOrder(id: number): Promise<Order | undefined> {
    const result = await db.select({
      order: orders,
      customer: customers
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.id, id))
    .limit(1);
    
    if (result.length === 0) return undefined;
    
    // Get related items and fees
    const items = await this.getOrderItems(id);
    const fees = await this.getOrderFees(id);
    
    // If it's a refining order, get target product details
    let targetProduct = undefined;
    if (result[0].order.targetProductId) {
      targetProduct = await this.getProduct(result[0].order.targetProductId);
    }
    
    return {
      ...result[0].order,
      customer: result[0].customer,
      items,
      fees,
      targetProduct
    } as unknown as Order;
  }
  
  // Get order items for a specific order
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    const items = await db.select({
      item: orderItems,
      product: products
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));
    
    return items.map(row => ({
      ...row.item,
      product: row.product
    })) as unknown as OrderItem[];
  }
  
  // Get order fees for a specific order
  async getOrderFees(orderId: number): Promise<OrderFee[]> {
    return db.select().from(orderFees).where(eq(orderFees.orderId, orderId));
  }
  
  // Create new order
  async createOrder(order: InsertOrder): Promise<Order> {
    const [createdOrder] = await db.insert(orders).values(order).returning();
    return createdOrder;
  }
  
  // Create order item
  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [createdItem] = await db.insert(orderItems).values(item).returning();
    return createdItem;
  }
  
  // Create order fee
  async createOrderFee(fee: InsertOrderFee): Promise<OrderFee> {
    const [createdFee] = await db.insert(orderFees).values(fee).returning();
    return createdFee;
  }
  
  // Update order
  async updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined> {
    const [updatedOrder] = await db.update(orders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }
  
  // Delete order
  async deleteOrder(id: number): Promise<boolean> {
    // Delete related items and fees first
    await this.deleteOrderItems(id);
    await this.deleteOrderFees(id);
    
    // Then delete the order
    await db.delete(orders).where(eq(orders.id, id));
    return true;
  }
  
  // Delete order items
  async deleteOrderItems(orderId: number): Promise<boolean> {
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
    return true;
  }
  
  // Delete order fees
  async deleteOrderFees(orderId: number): Promise<boolean> {
    await db.delete(orderFees).where(eq(orderFees.orderId, orderId));
    return true;
  }
  
  // Supplier methods
  async getSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers).orderBy(asc(suppliers.name));
  }
  
  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }
  
  async createSupplier(supplierData: InsertSupplier): Promise<Supplier> {
    const [supplier] = await db.insert(suppliers).values({
      ...supplierData,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return supplier;
  }
  
  async updateSupplier(id: number, supplierData: InsertSupplier): Promise<Supplier | undefined> {
    const [updatedSupplier] = await db.update(suppliers)
      .set({
        ...supplierData,
        updatedAt: new Date()
      })
      .where(eq(suppliers.id, id))
      .returning();
    return updatedSupplier;
  }
  
  async deleteSupplier(id: number): Promise<boolean> {
    const result = await db.delete(suppliers)
      .where(eq(suppliers.id, id))
      .returning();
    return result.length > 0;
  }

  // Batch Management implementations
  async getBatches(filters?: { productId?: number; status?: string; supplierId?: number }): Promise<Batch[]> {
    let query = db.select().from(batches);
    
    if (filters?.productId) {
      query = query.where(eq(batches.productId, filters.productId));
    }
    if (filters?.status) {
      query = query.where(eq(batches.status, filters.status));
    }
    if (filters?.supplierId) {
      query = query.where(eq(batches.supplierId, filters.supplierId));
    }
    
    return await query.orderBy(desc(batches.createdAt));
  }

  async getBatch(id: number): Promise<Batch | undefined> {
    const [batch] = await db.select().from(batches).where(eq(batches.id, id));
    return batch;
  }

  async getBatchByNumber(batchNumber: string): Promise<Batch | undefined> {
    const [batch] = await db.select().from(batches).where(eq(batches.batchNumber, batchNumber));
    return batch;
  }

  async getBatchesByProduct(productId: number): Promise<Batch[]> {
    return await db.select().from(batches).where(eq(batches.productId, productId));
  }

  async getBatchesByStatus(status: string): Promise<Batch[]> {
    return await db.select().from(batches).where(eq(batches.status, status));
  }

  async getExpiringBatches(days: number): Promise<Batch[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return await db.select().from(batches).where(lte(batches.expiryDate, futureDate.toISOString().split('T')[0]));
  }

  async createBatch(batch: InsertBatch): Promise<Batch> {
    const [newBatch] = await db.insert(batches).values(batch).returning();
    return newBatch;
  }

  async updateBatch(id: number, data: Partial<Batch>): Promise<Batch | undefined> {
    const [updated] = await db.update(batches)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(batches.id, id))
      .returning();
    return updated;
  }

  async deleteBatch(id: number): Promise<boolean> {
    const result = await db.delete(batches).where(eq(batches.id, id)).returning();
    return result.length > 0;
  }

  // Product Formulation implementations
  async getProductFormulations(productId: number): Promise<ProductFormulation[]> {
    return await db.select().from(productFormulations).where(eq(productFormulations.productId, productId));
  }

  async getFormulation(id: number): Promise<ProductFormulation | undefined> {
    const [formulation] = await db.select().from(productFormulations).where(eq(productFormulations.id, id));
    return formulation;
  }

  async createFormulation(formulation: InsertProductFormulation): Promise<ProductFormulation> {
    const [newFormulation] = await db.insert(productFormulations).values(formulation).returning();
    return newFormulation;
  }

  async updateFormulation(id: number, data: Partial<ProductFormulation>): Promise<ProductFormulation | undefined> {
    const [updated] = await db.update(productFormulations)
      .set(data)
      .where(eq(productFormulations.id, id))
      .returning();
    return updated;
  }

  async deleteFormulation(id: number): Promise<boolean> {
    const result = await db.delete(productFormulations).where(eq(productFormulations.id, id)).returning();
    return result.length > 0;
  }

  // Product Safety implementations
  async getProductSafety(productId: number): Promise<ProductSafety | undefined> {
    const [safety] = await db.select().from(productSafety).where(eq(productSafety.productId, productId));
    return safety;
  }

  async createProductSafety(safety: InsertProductSafety): Promise<ProductSafety> {
    const [newSafety] = await db.insert(productSafety).values(safety).returning();
    return newSafety;
  }

  async updateProductSafety(productId: number, data: Partial<ProductSafety>): Promise<ProductSafety | undefined> {
    const [updated] = await db.update(productSafety)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(productSafety.productId, productId))
      .returning();
    return updated;
  }

  async deleteProductSafety(productId: number): Promise<boolean> {
    const result = await db.delete(productSafety).where(eq(productSafety.productId, productId)).returning();
    return result.length > 0;
  }

  // Quality Control implementations
  async getQualityTests(batchId?: number): Promise<QualityTest[]> {
    if (batchId) {
      return await db.select().from(qualityTests).where(eq(qualityTests.batchId, batchId));
    }
    return await db.select().from(qualityTests).orderBy(desc(qualityTests.testDate));
  }

  async getQualityTest(id: number): Promise<QualityTest | undefined> {
    const [test] = await db.select().from(qualityTests).where(eq(qualityTests.id, id));
    return test;
  }

  async getQualityTestsByBatch(batchId: number): Promise<QualityTest[]> {
    return await db.select().from(qualityTests).where(eq(qualityTests.batchId, batchId));
  }

  async createQualityTest(test: InsertQualityTest): Promise<QualityTest> {
    const [newTest] = await db.insert(qualityTests).values(test).returning();
    return newTest;
  }

  async updateQualityTest(id: number, data: Partial<QualityTest>): Promise<QualityTest | undefined> {
    const [updated] = await db.update(qualityTests)
      .set(data)
      .where(eq(qualityTests.id, id))
      .returning();
    return updated;
  }

  async deleteQualityTest(id: number): Promise<boolean> {
    const result = await db.delete(qualityTests).where(eq(qualityTests.id, id)).returning();
    return result.length > 0;
  }

  // Production Order implementations
  async getProductionOrders(filters?: { status?: string; productId?: number }): Promise<ProductionOrder[]> {
    let query = db.select().from(productionOrders);
    
    if (filters?.status) {
      query = query.where(eq(productionOrders.status, filters.status));
    }
    if (filters?.productId) {
      query = query.where(eq(productionOrders.productId, filters.productId));
    }
    
    return await query.orderBy(desc(productionOrders.createdAt));
  }

  async getProductionOrder(id: number): Promise<ProductionOrder | undefined> {
    const [order] = await db.select().from(productionOrders).where(eq(productionOrders.id, id));
    return order;
  }

  async getProductionMaterials(productionOrderId: number): Promise<ProductionMaterial[]> {
    return await db.select().from(productionMaterials).where(eq(productionMaterials.productionOrderId, productionOrderId));
  }

  async createProductionOrder(order: InsertProductionOrder): Promise<ProductionOrder> {
    const [newOrder] = await db.insert(productionOrders).values(order).returning();
    return newOrder;
  }

  async updateProductionOrder(id: number, data: Partial<ProductionOrder>): Promise<ProductionOrder | undefined> {
    const [updated] = await db.update(productionOrders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(productionOrders.id, id))
      .returning();
    return updated;
  }

  async deleteProductionOrder(id: number): Promise<boolean> {
    const result = await db.delete(productionOrders).where(eq(productionOrders.id, id)).returning();
    return result.length > 0;
  }

  // Product Label implementations
  async getProductLabels(productId?: number, batchId?: number): Promise<ProductLabel[]> {
    let query = db.select().from(productLabels);
    
    if (productId) {
      query = query.where(eq(productLabels.productId, productId));
    }
    if (batchId) {
      query = query.where(eq(productLabels.batchId, batchId));
    }
    
    return await query.orderBy(desc(productLabels.createdAt));
  }

  async getProductLabel(id: number): Promise<ProductLabel | undefined> {
    const [label] = await db.select().from(productLabels).where(eq(productLabels.id, id));
    return label;
  }

  async createProductLabel(label: InsertProductLabel): Promise<ProductLabel> {
    const [newLabel] = await db.insert(productLabels).values(label).returning();
    return newLabel;
  }

  async updateProductLabel(id: number, data: Partial<ProductLabel>): Promise<ProductLabel | undefined> {
    const [updated] = await db.update(productLabels)
      .set(data)
      .where(eq(productLabels.id, id))
      .returning();
    return updated;
  }

  async deleteProductLabel(id: number): Promise<boolean> {
    const result = await db.delete(productLabels).where(eq(productLabels.id, id)).returning();
    return result.length > 0;
  }

  // Regulatory Submission implementations
  async getRegulatorySubmissions(productId?: number, status?: string): Promise<RegulatorySubmission[]> {
    let query = db.select().from(regulatorySubmissions);
    
    if (productId) {
      query = query.where(eq(regulatorySubmissions.productId, productId));
    }
    if (status) {
      query = query.where(eq(regulatorySubmissions.status, status));
    }
    
    return await query.orderBy(desc(regulatorySubmissions.submissionDate));
  }

  async getRegulatorySubmission(id: number): Promise<RegulatorySubmission | undefined> {
    const [submission] = await db.select().from(regulatorySubmissions).where(eq(regulatorySubmissions.id, id));
    return submission;
  }

  async createRegulatorySubmission(submission: InsertRegulatorySubmission): Promise<RegulatorySubmission> {
    const [newSubmission] = await db.insert(regulatorySubmissions).values(submission).returning();
    return newSubmission;
  }

  async updateRegulatorySubmission(id: number, data: Partial<RegulatorySubmission>): Promise<RegulatorySubmission | undefined> {
    const [updated] = await db.update(regulatorySubmissions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(regulatorySubmissions.id, id))
      .returning();
    return updated;
  }

  async deleteRegulatorySubmission(id: number): Promise<boolean> {
    const result = await db.delete(regulatorySubmissions).where(eq(regulatorySubmissions.id, id)).returning();
    return result.length > 0;
  }

  // Inventory Adjustment implementations
  async getInventoryAdjustments(filters?: { productId?: number; dateFrom?: string; dateTo?: string }): Promise<InventoryAdjustment[]> {
    let query = db.select().from(inventoryAdjustments);
    
    if (filters?.productId) {
      query = query.where(eq(inventoryAdjustments.productId, filters.productId));
    }
    if (filters?.dateFrom) {
      query = query.where(gte(inventoryAdjustments.adjustmentDate, new Date(filters.dateFrom)));
    }
    if (filters?.dateTo) {
      query = query.where(lte(inventoryAdjustments.adjustmentDate, new Date(filters.dateTo)));
    }
    
    return await query.orderBy(desc(inventoryAdjustments.adjustmentDate));
  }

  async getInventoryAdjustment(id: number): Promise<InventoryAdjustment | undefined> {
    const [adjustment] = await db.select().from(inventoryAdjustments).where(eq(inventoryAdjustments.id, id));
    return adjustment;
  }

  async createInventoryAdjustment(adjustment: InsertInventoryAdjustment): Promise<InventoryAdjustment> {
    const [newAdjustment] = await db.insert(inventoryAdjustments).values(adjustment).returning();
    return newAdjustment;
  }

  async updateInventoryAdjustment(id: number, data: Partial<InventoryAdjustment>): Promise<InventoryAdjustment | undefined> {
    const [updated] = await db.update(inventoryAdjustments)
      .set(data)
      .where(eq(inventoryAdjustments.id, id))
      .returning();
    return updated;
  }

  async deleteInventoryAdjustment(id: number): Promise<boolean> {
    const result = await db.delete(inventoryAdjustments).where(eq(inventoryAdjustments.id, id)).returning();
    return result.length > 0;
  }

  // Warehouse Management implementations
  async getWarehouses(): Promise<Warehouse[]> {
    return await db.select().from(warehouses).where(eq(warehouses.isActive, true));
  }

  async getWarehouse(id: number): Promise<Warehouse | undefined> {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return warehouse;
  }

  async getWarehouseLocations(warehouseId?: number): Promise<WarehouseLocation[]> {
    if (warehouseId) {
      return await db.select().from(warehouseLocations)
        .where(and(eq(warehouseLocations.warehouseId, warehouseId), eq(warehouseLocations.isActive, true)));
    }
    return await db.select().from(warehouseLocations).where(eq(warehouseLocations.isActive, true));
  }

  async getWarehouseLocation(id: number): Promise<WarehouseLocation | undefined> {
    const [location] = await db.select().from(warehouseLocations).where(eq(warehouseLocations.id, id));
    return location;
  }

  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    const [newWarehouse] = await db.insert(warehouses).values(warehouse).returning();
    return newWarehouse;
  }

  async createWarehouseLocation(location: InsertWarehouseLocation): Promise<WarehouseLocation> {
    const [newLocation] = await db.insert(warehouseLocations).values(location).returning();
    return newLocation;
  }

  async updateWarehouse(id: number, data: Partial<Warehouse>): Promise<Warehouse | undefined> {
    const [updated] = await db.update(warehouses)
      .set(data)
      .where(eq(warehouses.id, id))
      .returning();
    return updated;
  }

  async updateWarehouseLocation(id: number, data: Partial<WarehouseLocation>): Promise<WarehouseLocation | undefined> {
    const [updated] = await db.update(warehouseLocations)
      .set(data)
      .where(eq(warehouseLocations.id, id))
      .returning();
    return updated;
  }

  async deleteWarehouse(id: number): Promise<boolean> {
    const [updated] = await db.update(warehouses)
      .set({ isActive: false })
      .where(eq(warehouses.id, id))
      .returning();
    return updated !== undefined;
  }

  async deleteWarehouseLocation(id: number): Promise<boolean> {
    const [updated] = await db.update(warehouseLocations)
      .set({ isActive: false })
      .where(eq(warehouseLocations.id, id))
      .returning();
    return updated !== undefined;
  }

  // Stock Movement implementations
  async getStockMovements(filters?: { productId?: number; dateFrom?: string; dateTo?: string }): Promise<StockMovement[]> {
    let query = db.select().from(stockMovements);
    
    if (filters?.productId) {
      query = query.where(eq(stockMovements.productId, filters.productId));
    }
    if (filters?.dateFrom) {
      query = query.where(gte(stockMovements.movementDate, new Date(filters.dateFrom)));
    }
    if (filters?.dateTo) {
      query = query.where(lte(stockMovements.movementDate, new Date(filters.dateTo)));
    }
    
    return await query.orderBy(desc(stockMovements.movementDate));
  }

  async getStockMovement(id: number): Promise<StockMovement | undefined> {
    const [movement] = await db.select().from(stockMovements).where(eq(stockMovements.id, id));
    return movement;
  }

  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
    const [newMovement] = await db.insert(stockMovements).values(movement).returning();
    return newMovement;
  }

  async updateStockMovement(id: number, data: Partial<StockMovement>): Promise<StockMovement | undefined> {
    const [updated] = await db.update(stockMovements)
      .set(data)
      .where(eq(stockMovements.id, id))
      .returning();
    return updated;
  }

  async deleteStockMovement(id: number): Promise<boolean> {
    const result = await db.delete(stockMovements).where(eq(stockMovements.id, id)).returning();
    return result.length > 0;
  }

  // Financial - Account implementations
  async getAccounts(type?: string): Promise<Account[]> {
    if (type) {
      return await db.select().from(accounts).where(and(eq(accounts.type, type), eq(accounts.isActive, true)));
    }
    return await db.select().from(accounts).where(eq(accounts.isActive, true));
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
  }

  async getAccountByCode(code: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.code, code));
    return account;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async updateAccount(id: number, data: Partial<Account>): Promise<Account | undefined> {
    const [updated] = await db.update(accounts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    return updated;
  }

  async deleteAccount(id: number): Promise<boolean> {
    const [updated] = await db.update(accounts)
      .set({ isActive: false })
      .where(eq(accounts.id, id))
      .returning();
    return updated !== undefined;
  }

  // Journal Entry implementations
  async getJournalEntries(filters?: { dateFrom?: string; dateTo?: string; status?: string }): Promise<JournalEntry[]> {
    let query = db.select().from(journalEntries);
    
    if (filters?.dateFrom) {
      query = query.where(gte(journalEntries.date, filters.dateFrom));
    }
    if (filters?.dateTo) {
      query = query.where(lte(journalEntries.date, filters.dateTo));
    }
    if (filters?.status) {
      query = query.where(eq(journalEntries.status, filters.status));
    }
    
    return await query.orderBy(desc(journalEntries.date));
  }

  async getJournalEntry(id: number): Promise<JournalEntry | undefined> {
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
    return entry;
  }

  async getJournalLines(journalId: number): Promise<JournalLine[]> {
    return await db.select().from(journalLines)
      .where(eq(journalLines.journalId, journalId))
      .orderBy(asc(journalLines.position));
  }

  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const [newEntry] = await db.insert(journalEntries).values(entry).returning();
    return newEntry;
  }

  async createJournalLine(line: InsertJournalLine): Promise<JournalLine> {
    const [newLine] = await db.insert(journalLines).values(line).returning();
    return newLine;
  }

  async updateJournalEntry(id: number, data: Partial<JournalEntry>): Promise<JournalEntry | undefined> {
    const [updated] = await db.update(journalEntries)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(journalEntries.id, id))
      .returning();
    return updated;
  }

  async deleteJournalEntry(id: number): Promise<boolean> {
    const result = await db.delete(journalEntries).where(eq(journalEntries.id, id)).returning();
    return result.length > 0;
  }

  // Financial Period implementations
  async getFinancialPeriods(): Promise<FinancialPeriod[]> {
    return await db.select().from(financialPeriods).orderBy(desc(financialPeriods.startDate));
  }

  async getFinancialPeriod(id: number): Promise<FinancialPeriod | undefined> {
    const [period] = await db.select().from(financialPeriods).where(eq(financialPeriods.id, id));
    return period;
  }

  async getCurrentFinancialPeriod(): Promise<FinancialPeriod | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const [period] = await db.select().from(financialPeriods)
      .where(and(
        lte(financialPeriods.startDate, today),
        gte(financialPeriods.endDate, today),
        eq(financialPeriods.status, 'open')
      ));
    return period;
  }

  async createFinancialPeriod(period: InsertFinancialPeriod): Promise<FinancialPeriod> {
    const [newPeriod] = await db.insert(financialPeriods).values(period).returning();
    return newPeriod;
  }

  async updateFinancialPeriod(id: number, data: Partial<FinancialPeriod>): Promise<FinancialPeriod | undefined> {
    const [updated] = await db.update(financialPeriods)
      .set(data)
      .where(eq(financialPeriods.id, id))
      .returning();
    return updated;
  }

  async deleteFinancialPeriod(id: number): Promise<boolean> {
    const result = await db.delete(financialPeriods).where(eq(financialPeriods.id, id)).returning();
    return result.length > 0;
  }

  // Customer Payment implementations
  async getCustomerPayments(filters?: { customerId?: number; dateFrom?: string; dateTo?: string }): Promise<CustomerPayment[]> {
    let query = db.select().from(customerPayments);
    
    if (filters?.customerId) {
      query = query.where(eq(customerPayments.customerId, filters.customerId));
    }
    if (filters?.dateFrom) {
      query = query.where(gte(customerPayments.paymentDate, filters.dateFrom));
    }
    if (filters?.dateTo) {
      query = query.where(lte(customerPayments.paymentDate, filters.dateTo));
    }
    
    return await query.orderBy(desc(customerPayments.paymentDate));
  }

  async getCustomerPayment(id: number): Promise<CustomerPayment | undefined> {
    const [payment] = await db.select().from(customerPayments).where(eq(customerPayments.id, id));
    return payment;
  }

  async getPaymentAllocations(paymentId: number): Promise<PaymentAllocation[]> {
    return await db.select().from(paymentAllocations).where(eq(paymentAllocations.paymentId, paymentId));
  }

  async createCustomerPayment(payment: InsertCustomerPayment): Promise<CustomerPayment> {
    const [newPayment] = await db.insert(customerPayments).values(payment).returning();
    return newPayment;
  }

  async createPaymentAllocation(allocation: InsertPaymentAllocation): Promise<PaymentAllocation> {
    const [newAllocation] = await db.insert(paymentAllocations).values(allocation).returning();
    return newAllocation;
  }

  async updateCustomerPayment(id: number, data: Partial<CustomerPayment>): Promise<CustomerPayment | undefined> {
    const [updated] = await db.update(customerPayments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customerPayments.id, id))
      .returning();
    return updated;
  }

  async deleteCustomerPayment(id: number): Promise<boolean> {
    const result = await db.delete(customerPayments).where(eq(customerPayments.id, id)).returning();
    return result.length > 0;
  }

  // Tax Rate implementations
  async getTaxRates(active?: boolean): Promise<TaxRate[]> {
    if (active !== undefined) {
      return await db.select().from(taxRates).where(eq(taxRates.isActive, active));
    }
    return await db.select().from(taxRates);
  }

  async getTaxRate(id: number): Promise<TaxRate | undefined> {
    const [taxRate] = await db.select().from(taxRates).where(eq(taxRates.id, id));
    return taxRate;
  }

  async createTaxRate(taxRate: InsertTaxRate): Promise<TaxRate> {
    const [newTaxRate] = await db.insert(taxRates).values(taxRate).returning();
    return newTaxRate;
  }

  async updateTaxRate(id: number, data: Partial<TaxRate>): Promise<TaxRate | undefined> {
    const [updated] = await db.update(taxRates)
      .set(data)
      .where(eq(taxRates.id, id))
      .returning();
    return updated;
  }

  async deleteTaxRate(id: number): Promise<boolean> {
    const [updated] = await db.update(taxRates)
      .set({ isActive: false })
      .where(eq(taxRates.id, id))
      .returning();
    return updated !== undefined;
  }

  // Currency implementations
  async getCurrencies(active?: boolean): Promise<Currency[]> {
    if (active !== undefined) {
      return await db.select().from(currencies).where(eq(currencies.isActive, active));
    }
    return await db.select().from(currencies);
  }

  async getCurrency(id: number): Promise<Currency | undefined> {
    const [currency] = await db.select().from(currencies).where(eq(currencies.id, id));
    return currency;
  }

  async getBaseCurrency(): Promise<Currency | undefined> {
    const [currency] = await db.select().from(currencies)
      .where(and(eq(currencies.isBaseCurrency, true), eq(currencies.isActive, true)));
    return currency;
  }

  async createCurrency(currency: InsertCurrency): Promise<Currency> {
    const [newCurrency] = await db.insert(currencies).values(currency).returning();
    return newCurrency;
  }

  async updateCurrency(id: number, data: Partial<Currency>): Promise<Currency | undefined> {
    const [updated] = await db.update(currencies)
      .set({ ...data, lastUpdated: new Date() })
      .where(eq(currencies.id, id))
      .returning();
    return updated;
  }

  async deleteCurrency(id: number): Promise<boolean> {
    const [updated] = await db.update(currencies)
      .set({ isActive: false })
      .where(eq(currencies.id, id))
      .returning();
    return updated !== undefined;
  }

  // Bank Account implementations
  async getBankAccounts(active?: boolean): Promise<BankAccount[]> {
    if (active !== undefined) {
      return await db.select().from(bankAccounts).where(eq(bankAccounts.isActive, active));
    }
    return await db.select().from(bankAccounts);
  }

  async getBankAccount(id: number): Promise<BankAccount | undefined> {
    const [account] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));
    return account;
  }

  async createBankAccount(account: InsertBankAccount): Promise<BankAccount> {
    const [newAccount] = await db.insert(bankAccounts).values(account).returning();
    return newAccount;
  }

  async updateBankAccount(id: number, data: Partial<BankAccount>): Promise<BankAccount | undefined> {
    const [updated] = await db.update(bankAccounts)
      .set(data)
      .where(eq(bankAccounts.id, id))
      .returning();
    return updated;
  }

  async deleteBankAccount(id: number): Promise<boolean> {
    const [updated] = await db.update(bankAccounts)
      .set({ isActive: false })
      .where(eq(bankAccounts.id, id))
      .returning();
    return updated !== undefined;
  }

  // Budget implementations
  async getBudgets(year?: number): Promise<Budget[]> {
    if (year) {
      return await db.select().from(budgets).where(eq(budgets.budgetYear, year));
    }
    return await db.select().from(budgets).orderBy(desc(budgets.budgetYear));
  }

  async getBudget(id: number): Promise<Budget | undefined> {
    const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
    return budget;
  }

  async getBudgetCategories(budgetId: number): Promise<BudgetCategory[]> {
    return await db.select().from(budgetCategories).where(eq(budgetCategories.budgetId, budgetId));
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const [newBudget] = await db.insert(budgets).values(budget).returning();
    return newBudget;
  }

  async updateBudget(id: number, data: Partial<Budget>): Promise<Budget | undefined> {
    const [updated] = await db.update(budgets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(budgets.id, id))
      .returning();
    return updated;
  }

  async deleteBudget(id: number): Promise<boolean> {
    const result = await db.delete(budgets).where(eq(budgets.id, id)).returning();
    return result.length > 0;
  }

  // Asset implementations
  async getAssets(category?: string, status?: string): Promise<Asset[]> {
    let query = db.select().from(assets);
    
    if (category) {
      query = query.where(eq(assets.category, category));
    }
    if (status) {
      query = query.where(eq(assets.status, status));
    }
    
    return await query.orderBy(desc(assets.createdAt));
  }

  async getAsset(id: number): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset;
  }

  async getMaintenanceRecords(assetId: number): Promise<MaintenanceRecord[]> {
    return await db.select().from(maintenanceRecords)
      .where(eq(maintenanceRecords.assetId, assetId))
      .orderBy(desc(maintenanceRecords.performedDate));
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const [newAsset] = await db.insert(assets).values(asset).returning();
    return newAsset;
  }

  async updateAsset(id: number, data: Partial<Asset>): Promise<Asset | undefined> {
    const [updated] = await db.update(assets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    return updated;
  }

  async deleteAsset(id: number): Promise<boolean> {
    const result = await db.delete(assets).where(eq(assets.id, id)).returning();
    return result.length > 0;
  }

  // Department implementations
  async getDepartments(active?: boolean): Promise<Department[]> {
    if (active !== undefined) {
      return await db.select().from(departments).where(eq(departments.isActive, active));
    }
    return await db.select().from(departments);
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department;
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [newDepartment] = await db.insert(departments).values(department).returning();
    return newDepartment;
  }

  async updateDepartment(id: number, data: Partial<Department>): Promise<Department | undefined> {
    const [updated] = await db.update(departments)
      .set(data)
      .where(eq(departments.id, id))
      .returning();
    return updated;
  }

  async deleteDepartment(id: number): Promise<boolean> {
    const [updated] = await db.update(departments)
      .set({ isActive: false })
      .where(eq(departments.id, id))
      .returning();
    return updated !== undefined;
  }

  // Employee Profile implementations
  async getEmployeeProfiles(departmentId?: number): Promise<EmployeeProfile[]> {
    if (departmentId) {
      return await db.select().from(employeeProfiles)
        .where(and(eq(employeeProfiles.departmentId, departmentId), eq(employeeProfiles.isActive, true)));
    }
    return await db.select().from(employeeProfiles).where(eq(employeeProfiles.isActive, true));
  }

  async getEmployeeProfile(id: number): Promise<EmployeeProfile | undefined> {
    const [profile] = await db.select().from(employeeProfiles).where(eq(employeeProfiles.id, id));
    return profile;
  }

  async getEmployeeByUserId(userId: number): Promise<EmployeeProfile | undefined> {
    const [profile] = await db.select().from(employeeProfiles).where(eq(employeeProfiles.userId, userId));
    return profile;
  }

  async createEmployeeProfile(profile: InsertEmployeeProfile): Promise<EmployeeProfile> {
    const [newProfile] = await db.insert(employeeProfiles).values(profile).returning();
    return newProfile;
  }

  async updateEmployeeProfile(id: number, data: Partial<EmployeeProfile>): Promise<EmployeeProfile | undefined> {
    const [updated] = await db.update(employeeProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(employeeProfiles.id, id))
      .returning();
    return updated;
  }

  async deleteEmployeeProfile(id: number): Promise<boolean> {
    const [updated] = await db.update(employeeProfiles)
      .set({ isActive: false })
      .where(eq(employeeProfiles.id, id))
      .returning();
    return updated !== undefined;
  }

  // Document implementations
  async getDocuments(entityType?: string, entityId?: number): Promise<Document[]> {
    let query = db.select().from(documents).where(eq(documents.isActive, true));
    
    if (entityType) {
      query = query.where(eq(documents.entityType, entityType));
    }
    if (entityId) {
      query = query.where(eq(documents.entityId, entityId));
    }
    
    return await query.orderBy(desc(documents.uploadedAt));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async getDocumentTypes(): Promise<DocumentType[]> {
    return await db.select().from(documentTypes).where(eq(documentTypes.isActive, true));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async updateDocument(id: number, data: Partial<Document>): Promise<Document | undefined> {
    const [updated] = await db.update(documents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const [updated] = await db.update(documents)
      .set({ isActive: false })
      .where(eq(documents.id, id))
      .returning();
    return updated !== undefined;
  }

  // Notification implementations
  async getNotifications(userId: number, unreadOnly?: boolean): Promise<Notification[]> {
    let query = db.select().from(notifications).where(eq(notifications.userId, userId));
    
    if (unreadOnly) {
      query = query.where(eq(notifications.isRead, false));
    }
    
    return await query.orderBy(desc(notifications.createdAt));
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    return await db.select().from(notificationTemplates).where(eq(notificationTemplates.isActive, true));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const [updated] = await db.update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return updated !== undefined;
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
