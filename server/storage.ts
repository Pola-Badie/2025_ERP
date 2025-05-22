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
  orderFees, type OrderFee, type InsertOrderFee
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
}

export const storage = new DatabaseStorage();
