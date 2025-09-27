import { UserStorage } from "./user-storage";
import { ProductStorage } from "./product-storage";
import { PharmaceuticalStorage } from "./pharmaceutical-storage";
import { FinancialStorage } from "./financial-storage";
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { and, desc, eq, gte, lte, like } from "drizzle-orm";
import { db } from "../db";
import { customers, suppliers, sales, saleItems, purchaseOrders, purchaseOrderItems, backups, backupSettings, inventoryTransactions, salesReports, systemPreferences, quotations, quotationItems, orders, orderItems, orderFees, warehouses, warehouseLocations, stockMovements, inventoryAdjustments, expenses, expenseCategories } from "@shared/schema";
export class DatabaseStorage {
    constructor() {
        this.userStorage = new UserStorage();
        this.productStorage = new ProductStorage();
        this.pharmaceuticalStorage = new PharmaceuticalStorage();
        this.financialStorage = new FinancialStorage();
        // Delegate User Management methods
        this.getUsers = () => this.userStorage.getUsers();
        this.getUser = (id) => this.userStorage.getUser(id);
        this.getUserByUsername = (username) => this.userStorage.getUserByUsername(username);
        this.createUser = (user) => this.userStorage.createUser(user);
        this.updateUser = (id, user) => this.userStorage.updateUser(id, user);
        this.deactivateUser = (id) => this.userStorage.deactivateUser(id);
        this.getUserPermissions = (userId) => this.userStorage.getUserPermissions(userId);
        this.getUserPermissionsByModule = (userId, moduleName) => this.userStorage.getUserPermissionsByModule(userId, moduleName);
        this.createUserPermission = (permission) => this.userStorage.createUserPermission(permission);
        this.updateUserPermission = (userId, moduleName, accessGranted) => this.userStorage.updateUserPermission(userId, moduleName, accessGranted);
        this.deleteUserPermission = (userId, moduleName) => this.userStorage.deleteUserPermission(userId, moduleName);
        this.getRolePermissions = (role) => this.userStorage.getRolePermissions(role);
        this.createRolePermission = (permission) => this.userStorage.createRolePermission(permission);
        this.deleteRolePermission = (id) => this.userStorage.deleteRolePermission(id);
        this.getLoginLogs = (limit) => this.userStorage.getLoginLogs(limit);
        this.createLoginLog = (log) => this.userStorage.createLoginLog(log);
        // Delegate Product Management methods
        this.getProducts = (filters) => this.productStorage.getProducts(filters);
        this.getProductsByCategory = (categoryId) => this.productStorage.getProductsByCategory(categoryId);
        this.getProductsByStatus = (status) => this.productStorage.getProductsByStatus(status);
        this.getLowStockProducts = () => this.productStorage.getLowStockProducts();
        this.getProduct = (id) => this.productStorage.getProduct(id);
        this.getProductBySku = (sku) => this.productStorage.getProductBySku(sku);
        this.createProduct = (product) => this.productStorage.createProduct(product);
        this.updateProduct = (id, product) => this.productStorage.updateProduct(id, product);
        this.deleteProduct = (id) => this.productStorage.deleteProduct(id);
        this.getProductCategories = () => this.productStorage.getProductCategories();
        this.getProductCategory = (id) => this.productStorage.getProductCategory(id);
        this.createProductCategory = (category) => this.productStorage.createProductCategory(category);
        this.updateProductCategory = (id, category) => this.productStorage.updateProductCategory(id, category);
        this.deleteProductCategory = (id) => this.productStorage.deleteProductCategory(id);
        // Delegate Pharmaceutical methods
        this.getBatches = (filters) => this.pharmaceuticalStorage.getBatches(filters);
        this.getBatch = (id) => this.pharmaceuticalStorage.getBatch(id);
        this.getBatchByNumber = (batchNumber) => this.pharmaceuticalStorage.getBatchByNumber(batchNumber);
        this.getBatchesByProduct = (productId) => this.pharmaceuticalStorage.getBatchesByProduct(productId);
        this.getBatchesByStatus = (status) => this.pharmaceuticalStorage.getBatchesByStatus(status);
        this.getExpiringBatches = (days) => this.pharmaceuticalStorage.getExpiringBatches(days);
        this.createBatch = (batch) => this.pharmaceuticalStorage.createBatch(batch);
        this.updateBatch = (id, data) => this.pharmaceuticalStorage.updateBatch(id, data);
        this.deleteBatch = (id) => this.pharmaceuticalStorage.deleteBatch(id);
        this.getProductFormulations = (productId) => this.pharmaceuticalStorage.getProductFormulations(productId);
        this.getFormulation = (id) => this.pharmaceuticalStorage.getFormulation(id);
        this.createFormulation = (formulation) => this.pharmaceuticalStorage.createFormulation(formulation);
        this.updateFormulation = (id, data) => this.pharmaceuticalStorage.updateFormulation(id, data);
        this.deleteFormulation = (id) => this.pharmaceuticalStorage.deleteFormulation(id);
        this.getProductSafety = (productId) => this.pharmaceuticalStorage.getProductSafety(productId);
        this.createProductSafety = (safety) => this.pharmaceuticalStorage.createProductSafety(safety);
        this.updateProductSafety = (productId, data) => this.pharmaceuticalStorage.updateProductSafety(productId, data);
        this.deleteProductSafety = (productId) => this.pharmaceuticalStorage.deleteProductSafety(productId);
        this.getQualityTests = (batchId) => this.pharmaceuticalStorage.getQualityTests(batchId);
        this.getQualityTest = (id) => this.pharmaceuticalStorage.getQualityTest(id);
        this.getQualityTestsByBatch = (batchId) => this.pharmaceuticalStorage.getQualityTestsByBatch(batchId);
        this.createQualityTest = (test) => this.pharmaceuticalStorage.createQualityTest(test);
        this.updateQualityTest = (id, data) => this.pharmaceuticalStorage.updateQualityTest(id, data);
        this.deleteQualityTest = (id) => this.pharmaceuticalStorage.deleteQualityTest(id);
        this.getRegulatorySubmissions = (productId, status) => this.pharmaceuticalStorage.getRegulatorySubmissions(productId, status);
        this.getRegulatorySubmission = (id) => this.pharmaceuticalStorage.getRegulatorySubmission(id);
        this.createRegulatorySubmission = (submission) => this.pharmaceuticalStorage.createRegulatorySubmission(submission);
        this.updateRegulatorySubmission = (id, data) => this.pharmaceuticalStorage.updateRegulatorySubmission(id, data);
        this.deleteRegulatorySubmission = (id) => this.pharmaceuticalStorage.deleteRegulatorySubmission(id);
        // Delegate Financial methods
        this.getAccounts = (type) => this.financialStorage.getAccounts(type);
        this.getAccount = (id) => this.financialStorage.getAccount(id);
        this.getAccountByCode = (code) => this.financialStorage.getAccountByCode(code);
        this.createAccount = (account) => this.financialStorage.createAccount(account);
        this.updateAccount = (id, data) => this.financialStorage.updateAccount(id, data);
        this.deleteAccount = (id) => this.financialStorage.deleteAccount(id);
        this.getJournalEntries = (filters) => this.financialStorage.getJournalEntries(filters);
        this.getJournalEntry = (id) => this.financialStorage.getJournalEntry(id);
        this.getJournalLines = (journalId) => this.financialStorage.getJournalLines(journalId);
        this.createJournalEntry = (entry) => this.financialStorage.createJournalEntry(entry);
        this.createJournalLine = (line) => this.financialStorage.createJournalLine(line);
        this.updateJournalEntry = (id, data) => this.financialStorage.updateJournalEntry(id, data);
        this.deleteJournalEntry = (id) => this.financialStorage.deleteJournalEntry(id);
        this.getCustomerPayments = (filters) => this.financialStorage.getCustomerPayments(filters);
        this.getCustomerPayment = (id) => this.financialStorage.getCustomerPayment(id);
        this.getPaymentAllocations = (paymentId) => this.financialStorage.getPaymentAllocations(paymentId);
        this.createCustomerPayment = (payment) => this.financialStorage.createCustomerPayment(payment);
        this.createPaymentAllocation = (allocation) => this.financialStorage.createPaymentAllocation(allocation);
        this.updateCustomerPayment = (id, data) => this.financialStorage.updateCustomerPayment(id, data);
        this.deleteCustomerPayment = (id) => this.financialStorage.deleteCustomerPayment(id);
        this.backupDir = path.join(process.cwd(), 'backups');
        fs.mkdir(this.backupDir, { recursive: true }).catch(err => {
            console.error('Failed to create backup directory:', err);
        });
    }
    // Expense Category Management
    async getExpenseCategories() {
        return await db.select().from(expenseCategories);
    }
    async createExpenseCategory(category) {
        const [newCategory] = await db.insert(expenseCategories).values(category).returning();
        return newCategory;
    }
    async updateExpenseCategory(id, category) {
        const [updated] = await db.update(expenseCategories)
            .set({ ...category })
            .where(eq(expenseCategories.id, id))
            .returning();
        return updated;
    }
    async deleteExpenseCategory(id) {
        const result = await db.delete(expenseCategories).where(eq(expenseCategories.id, id)).returning();
        return result.length > 0;
    }
    // Expense Management
    async getExpenses(filters) {
        let query = db.select().from(expenses);
        if (filters?.categoryId) {
            query = query.where(eq(expenses.categoryId, filters.categoryId));
        }
        if (filters?.status) {
            query = query.where(eq(expenses.status, filters.status));
        }
        return await query.orderBy(desc(expenses.createdAt));
    }
    async getExpense(id) {
        const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
        return expense;
    }
    async createExpense(expense) {
        const [newExpense] = await db.insert(expenses).values(expense).returning();
        return newExpense;
    }
    async updateExpense(id, expense) {
        const [updated] = await db.update(expenses)
            .set({ ...expense, updatedAt: new Date() })
            .where(eq(expenses.id, id))
            .returning();
        return updated;
    }
    async deleteExpense(id) {
        const result = await db.delete(expenses).where(eq(expenses.id, id)).returning();
        return result.length > 0;
    }
    // Customer Management - Direct implementation
    async getCustomers() {
        return await db.select().from(customers).orderBy(customers.name);
    }
    async getCustomer(id) {
        const [customer] = await db.select().from(customers).where(eq(customers.id, id));
        return customer;
    }
    async createCustomer(customer) {
        const [newCustomer] = await db.insert(customers).values(customer).returning();
        return newCustomer;
    }
    async updateCustomer(id, customerData) {
        const [updated] = await db.update(customers)
            .set({ ...customerData, updatedAt: new Date() })
            .where(eq(customers.id, id))
            .returning();
        return updated;
    }
    async deleteCustomer(id) {
        const result = await db.delete(customers).where(eq(customers.id, id)).returning();
        return result.length > 0;
    }
    // Supplier Management - Direct implementation
    async getSuppliers() {
        return await db.select().from(suppliers).orderBy(suppliers.name);
    }
    async getSupplier(id) {
        const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
        return supplier;
    }
    async createSupplier(supplier) {
        const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
        return newSupplier;
    }
    async updateSupplier(id, supplierData) {
        const [updated] = await db.update(suppliers)
            .set({ ...supplierData, updatedAt: new Date() })
            .where(eq(suppliers.id, id))
            .returning();
        return updated;
    }
    async deleteSupplier(id) {
        const result = await db.delete(suppliers).where(eq(suppliers.id, id)).returning();
        return result.length > 0;
    }
    // Sales Management
    async getSales(query, customerId, status) {
        let dbQuery = db.select().from(sales);
        const conditions = [];
        if (query) {
            conditions.push(like(sales.referenceNumber, `%${query}%`));
        }
        if (customerId) {
            conditions.push(eq(sales.customerId, customerId));
        }
        if (status) {
            conditions.push(eq(sales.status, status));
        }
        if (conditions.length > 0) {
            dbQuery = dbQuery.where(and(...conditions));
        }
        return await dbQuery.orderBy(desc(sales.createdAt));
    }
    async getSale(id) {
        const [sale] = await db.select().from(sales).where(eq(sales.id, id));
        return sale;
    }
    async getSaleItems(saleId) {
        return await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
    }
    async createSale(sale) {
        const [newSale] = await db.insert(sales).values(sale).returning();
        return newSale;
    }
    async createSaleItem(item) {
        const [newItem] = await db.insert(saleItems).values(item).returning();
        return newItem;
    }
    async updateSale(id, data) {
        const [updated] = await db.update(sales)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(sales.id, id))
            .returning();
        return updated;
    }
    async deleteSale(id) {
        const result = await db.delete(sales).where(eq(sales.id, id)).returning();
        return result.length > 0;
    }
    async deleteSaleItems(saleId) {
        const result = await db.delete(saleItems).where(eq(saleItems.saleId, saleId)).returning();
        return result.length > 0;
    }
    // Warehouse and Inventory Management
    async getWarehouses() {
        return await db.select().from(warehouses).where(eq(warehouses.isActive, true));
    }
    async getWarehouse(id) {
        const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, id));
        return warehouse;
    }
    async getWarehouseLocations(warehouseId) {
        if (warehouseId) {
            return await db.select().from(warehouseLocations)
                .where(and(eq(warehouseLocations.warehouseId, warehouseId), eq(warehouseLocations.isActive, true)));
        }
        return await db.select().from(warehouseLocations).where(eq(warehouseLocations.isActive, true));
    }
    async getWarehouseLocation(id) {
        const [location] = await db.select().from(warehouseLocations).where(eq(warehouseLocations.id, id));
        return location;
    }
    async createWarehouse(warehouse) {
        const [newWarehouse] = await db.insert(warehouses).values(warehouse).returning();
        return newWarehouse;
    }
    async createWarehouseLocation(location) {
        const [newLocation] = await db.insert(warehouseLocations).values(location).returning();
        return newLocation;
    }
    async updateWarehouse(id, data) {
        const [updated] = await db.update(warehouses)
            .set(data)
            .where(eq(warehouses.id, id))
            .returning();
        return updated;
    }
    async updateWarehouseLocation(id, data) {
        const [updated] = await db.update(warehouseLocations)
            .set(data)
            .where(eq(warehouseLocations.id, id))
            .returning();
        return updated;
    }
    async deleteWarehouse(id) {
        const [updated] = await db.update(warehouses)
            .set({ isActive: false })
            .where(eq(warehouses.id, id))
            .returning();
        return updated !== undefined;
    }
    async deleteWarehouseLocation(id) {
        const [updated] = await db.update(warehouseLocations)
            .set({ isActive: false })
            .where(eq(warehouseLocations.id, id))
            .returning();
        return updated !== undefined;
    }
    async getStockMovements(filters) {
        let query = db.select().from(stockMovements);
        const conditions = [];
        if (filters?.productId) {
            conditions.push(eq(stockMovements.productId, filters.productId));
        }
        if (filters?.dateFrom) {
            conditions.push(gte(stockMovements.movementDate, new Date(filters.dateFrom)));
        }
        if (filters?.dateTo) {
            conditions.push(lte(stockMovements.movementDate, new Date(filters.dateTo)));
        }
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        return await query.orderBy(desc(stockMovements.movementDate));
    }
    async getStockMovement(id) {
        const [movement] = await db.select().from(stockMovements).where(eq(stockMovements.id, id));
        return movement;
    }
    async createStockMovement(movement) {
        const [newMovement] = await db.insert(stockMovements).values(movement).returning();
        return newMovement;
    }
    async updateStockMovement(id, data) {
        const [updated] = await db.update(stockMovements)
            .set(data)
            .where(eq(stockMovements.id, id))
            .returning();
        return updated;
    }
    async deleteStockMovement(id) {
        const result = await db.delete(stockMovements).where(eq(stockMovements.id, id)).returning();
        return result.length > 0;
    }
    async getInventoryAdjustments(filters) {
        let query = db.select().from(inventoryAdjustments);
        const conditions = [];
        if (filters?.productId) {
            conditions.push(eq(inventoryAdjustments.productId, filters.productId));
        }
        if (filters?.dateFrom) {
            conditions.push(gte(inventoryAdjustments.adjustmentDate, new Date(filters.dateFrom)));
        }
        if (filters?.dateTo) {
            conditions.push(lte(inventoryAdjustments.adjustmentDate, new Date(filters.dateTo)));
        }
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        return await query.orderBy(desc(inventoryAdjustments.adjustmentDate));
    }
    async getInventoryAdjustment(id) {
        const [adjustment] = await db.select().from(inventoryAdjustments).where(eq(inventoryAdjustments.id, id));
        return adjustment;
    }
    async createInventoryAdjustment(adjustment) {
        const [newAdjustment] = await db.insert(inventoryAdjustments).values(adjustment).returning();
        return newAdjustment;
    }
    async updateInventoryAdjustment(id, data) {
        const [updated] = await db.update(inventoryAdjustments)
            .set(data)
            .where(eq(inventoryAdjustments.id, id))
            .returning();
        return updated;
    }
    async deleteInventoryAdjustment(id) {
        const result = await db.delete(inventoryAdjustments).where(eq(inventoryAdjustments.id, id)).returning();
        return result.length > 0;
    }
    // Legacy method implementations that need to be maintained for backward compatibility
    // These methods are kept minimal and delegate to appropriate modular storage when possible
    async getPurchaseOrders() {
        return await db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt));
    }
    async getPurchaseOrder(id) {
        const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
        return order;
    }
    async getPurchaseOrderItems(purchaseOrderId) {
        return await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));
    }
    async createPurchaseOrder(order) {
        const [newOrder] = await db.insert(purchaseOrders).values(order).returning();
        return newOrder;
    }
    async updatePurchaseOrder(id, data) {
        const [updated] = await db.update(purchaseOrders)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(purchaseOrders.id, id))
            .returning();
        return updated;
    }
    async deletePurchaseOrder(id) {
        const result = await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id)).returning();
        return result.length > 0;
    }
    async getInventoryTransactions() {
        return await db.select().from(inventoryTransactions).orderBy(desc(inventoryTransactions.transactionDate));
    }
    async createInventoryTransaction(transaction) {
        const [newTransaction] = await db.insert(inventoryTransactions).values(transaction).returning();
        return newTransaction;
    }
    async getSalesReports() {
        return await db.select().from(salesReports).orderBy(desc(salesReports.createdAt));
    }
    async createSalesReport(report) {
        const [newReport] = await db.insert(salesReports).values(report).returning();
        return newReport;
    }
    async getBackups() {
        return await db.select().from(backups).orderBy(desc(backups.createdAt));
    }
    async getLatestBackup() {
        const [latest] = await db.select().from(backups)
            .where(eq(backups.status, 'completed'))
            .orderBy(desc(backups.timestamp))
            .limit(1);
        return latest;
    }
    async cleanupOldBackups() {
        try {
            // Keep only the last 10 successful backups
            const oldBackups = await db.select().from(backups)
                .orderBy(desc(backups.timestamp))
                .offset(10);
            for (const backup of oldBackups) {
                try {
                    // Delete backup files from filesystem (using filename as path)
                    const backupPath = path.join(this.backupDir, backup.filename);
                    await fs.unlink(backupPath).catch(() => { });
                    // Delete backup record from database
                    await db.delete(backups).where(eq(backups.id, backup.id));
                    console.log(`🔥 BACKUP CLEANUP: Removed old backup ${backup.filename}`);
                }
                catch (error) {
                    console.error(`🔥 BACKUP CLEANUP ERROR: Failed to delete backup ${backup.filename}:`, error);
                }
            }
        }
        catch (error) {
            console.error('🔥 BACKUP CLEANUP ERROR: Failed to cleanup old backups:', error);
        }
    }
    async getBackupSettings() {
        const [settings] = await db.select().from(backupSettings).limit(1);
        return settings;
    }
    async updateBackupSettings(settings) {
        const [updated] = await db.update(backupSettings)
            .set(settings)
            .returning();
        return updated;
    }
    async performBackup(type) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const dbBackupFilename = `backup_${timestamp}.sql`;
        const uploadsBackupFilename = `uploads_${timestamp}.tar.gz`;
        const dbBackupPath = path.join(this.backupDir, dbBackupFilename);
        const uploadsBackupPath = path.join(this.backupDir, uploadsBackupFilename);
        try {
            console.log('🔥 BACKUP: Starting real backup process...');
            // Create backup directory if it doesn't exist
            await fs.mkdir(this.backupDir, { recursive: true });
            // 1. Backup database using pg_dump
            console.log('🔥 BACKUP: Creating database backup...');
            const dbResult = await new Promise((resolve) => {
                const pgDump = spawn('pg_dump', [
                    '--verbose',
                    '--clean',
                    '--no-owner',
                    '--no-privileges',
                    '--format=plain',
                    `--file=${dbBackupPath}`,
                    process.env.DATABASE_URL
                ], {
                    env: {
                        ...process.env,
                        PGPASSWORD: process.env.PGPASSWORD
                    }
                });
                pgDump.on('close', (code) => {
                    console.log(`🔥 BACKUP: pg_dump process exited with code ${code}`);
                    resolve(code === 0);
                });
                pgDump.on('error', (error) => {
                    console.error('🔥 BACKUP ERROR: pg_dump failed:', error);
                    resolve(false);
                });
            });
            if (!dbResult) {
                throw new Error('Database backup failed');
            }
            // 2. Backup uploads directory if it exists
            console.log('🔥 BACKUP: Creating uploads backup...');
            const uploadsDir = path.join(process.cwd(), 'uploads');
            let uploadsResult = true;
            try {
                await fs.access(uploadsDir);
                uploadsResult = await new Promise((resolve) => {
                    const tar = spawn('tar', [
                        '-czf',
                        uploadsBackupPath,
                        '-C',
                        process.cwd(),
                        'uploads'
                    ]);
                    tar.on('close', (code) => {
                        console.log(`🔥 BACKUP: tar process exited with code ${code}`);
                        resolve(code === 0);
                    });
                    tar.on('error', (error) => {
                        console.error('🔥 BACKUP ERROR: tar failed:', error);
                        resolve(false);
                    });
                });
            }
            catch (error) {
                console.log('🔥 BACKUP: No uploads directory found, skipping...');
                // Create empty file to maintain consistency
                await fs.writeFile(uploadsBackupPath, '');
            }
            // 3. Calculate backup sizes
            let dbSize = 0;
            let uploadsSize = 0;
            try {
                const dbStats = await fs.stat(dbBackupPath);
                dbSize = dbStats.size;
                const uploadsStats = await fs.stat(uploadsBackupPath);
                uploadsSize = uploadsStats.size;
            }
            catch (error) {
                console.error('🔥 BACKUP WARNING: Could not get file sizes:', error);
            }
            // 4. Clean up old backups (keep last 10)
            await this.cleanupOldBackups();
            // 5. Create backup record
            const backupData = {
                filename: dbBackupFilename,
                type,
                status: (dbResult && uploadsResult) ? 'completed' : 'failed',
                size: dbSize,
                timestamp: new Date()
            };
            const [backup] = await db.insert(backups).values(backupData).returning();
            console.log(`🔥 BACKUP: ${backup.status === 'completed' ? 'SUCCESS' : 'FAILED'}`);
            console.log(`🔥 BACKUP: Database: ${(dbSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`🔥 BACKUP: Uploads: ${(uploadsSize / 1024 / 1024).toFixed(2)} MB`);
            return backup;
        }
        catch (error) {
            console.error('🔥 BACKUP ERROR: Backup failed:', error);
            // Create failed backup record
            const backupData = {
                filename: dbBackupFilename,
                type,
                status: 'failed',
                size: 0,
                timestamp: new Date()
            };
            const [backup] = await db.insert(backups).values(backupData).returning();
            return backup;
        }
    }
    async restoreFromBackup(backupId) {
        try {
            console.log('🔥 RESTORE: Starting database restore process...');
            // Get backup details
            const [backup] = await db.select().from(backups).where(eq(backups.id, backupId));
            if (!backup) {
                console.error('🔥 RESTORE ERROR: Backup not found');
                return false;
            }
            if (backup.status !== 'completed') {
                console.error('🔥 RESTORE ERROR: Cannot restore from incomplete backup');
                return false;
            }
            // Check if backup file exists
            const backupPath = path.join(this.backupDir, backup.filename);
            try {
                await fs.access(backupPath);
            }
            catch (error) {
                console.error('🔥 RESTORE ERROR: Backup file not found:', backupPath);
                return false;
            }
            console.log('🔥 RESTORE: Restoring database from:', backupPath);
            // Restore database using psql
            const restoreResult = await new Promise((resolve) => {
                const psql = spawn('psql', [
                    '--quiet',
                    '--file=' + backupPath,
                    process.env.DATABASE_URL
                ], {
                    env: {
                        ...process.env,
                        PGPASSWORD: process.env.PGPASSWORD
                    }
                });
                psql.on('close', (code) => {
                    console.log(`🔥 RESTORE: psql process exited with code ${code}`);
                    resolve(code === 0);
                });
                psql.on('error', (error) => {
                    console.error('🔥 RESTORE ERROR: psql failed:', error);
                    resolve(false);
                });
            });
            if (!restoreResult) {
                console.error('🔥 RESTORE ERROR: Database restore failed');
                return false;
            }
            // Try to restore uploads if available (based on filename pattern)
            const uploadsBackupFilename = backup.filename.replace('backup_', 'uploads_').replace('.sql', '.tar.gz');
            const uploadsBackupPath = path.join(this.backupDir, uploadsBackupFilename);
            try {
                await fs.access(uploadsBackupPath);
                console.log('🔥 RESTORE: Restoring uploads from:', uploadsBackupPath);
                const uploadsRestoreResult = await new Promise((resolve) => {
                    const tar = spawn('tar', [
                        '-xzf',
                        uploadsBackupPath,
                        '-C',
                        process.cwd()
                    ]);
                    tar.on('close', (code) => {
                        console.log(`🔥 RESTORE: tar process exited with code ${code}`);
                        resolve(code === 0);
                    });
                    tar.on('error', (error) => {
                        console.error('🔥 RESTORE WARNING: uploads restore failed:', error);
                        resolve(true); // Don't fail the entire restore for uploads
                    });
                });
                if (uploadsRestoreResult) {
                    console.log('🔥 RESTORE: Uploads restored successfully');
                }
            }
            catch (error) {
                console.log('🔥 RESTORE: No uploads backup found, skipping...');
            }
            console.log('🔥 RESTORE: Database restore completed successfully');
            return true;
        }
        catch (error) {
            console.error('🔥 RESTORE ERROR: Restore failed:', error);
            return false;
        }
    }
    async getSystemPreferences() {
        return await db.select().from(systemPreferences);
    }
    async getSystemPreferencesByCategory(category) {
        return await db.select().from(systemPreferences).where(eq(systemPreferences.category, category));
    }
    async getSystemPreference(key) {
        const [preference] = await db.select().from(systemPreferences).where(eq(systemPreferences.key, key));
        return preference;
    }
    async createSystemPreference(preference) {
        const [newPreference] = await db.insert(systemPreferences).values(preference).returning();
        return newPreference;
    }
    async updateSystemPreference(key, value) {
        const [updated] = await db.update(systemPreferences)
            .set({ value, updatedAt: new Date() })
            .where(eq(systemPreferences.key, key))
            .returning();
        return updated;
    }
    async getQuotations(query, status, date) {
        let dbQuery = db.select().from(quotations);
        const conditions = [];
        if (query) {
            conditions.push(like(quotations.quotationNumber, `%${query}%`));
        }
        if (status) {
            conditions.push(eq(quotations.status, status));
        }
        if (date) {
            conditions.push(eq(quotations.quotationDate, date));
        }
        if (conditions.length > 0) {
            dbQuery = dbQuery.where(and(...conditions));
        }
        return await dbQuery.orderBy(desc(quotations.createdAt));
    }
    async getQuotation(id) {
        const [quotation] = await db.select().from(quotations).where(eq(quotations.id, id));
        return quotation;
    }
    async getQuotationItems(quotationId) {
        return await db.select().from(quotationItems).where(eq(quotationItems.quotationId, quotationId));
    }
    async createQuotation(quotation) {
        const [newQuotation] = await db.insert(quotations).values(quotation).returning();
        return newQuotation;
    }
    async createQuotationItem(item) {
        const [newItem] = await db.insert(quotationItems).values(item).returning();
        return newItem;
    }
    async updateQuotation(id, data) {
        const [updated] = await db.update(quotations)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(quotations.id, id))
            .returning();
        return updated;
    }
    async deleteQuotation(id) {
        const result = await db.delete(quotations).where(eq(quotations.id, id)).returning();
        return result.length > 0;
    }
    async deleteQuotationItems(quotationId) {
        const result = await db.delete(quotationItems).where(eq(quotationItems.quotationId, quotationId)).returning();
        return result.length > 0;
    }
    async getOrders(query, orderType, status) {
        let dbQuery = db.select().from(orders);
        const conditions = [];
        if (query) {
            conditions.push(like(orders.orderNumber, `%${query}%`));
        }
        if (orderType) {
            conditions.push(eq(orders.orderType, orderType));
        }
        if (status) {
            conditions.push(eq(orders.status, status));
        }
        if (conditions.length > 0) {
            dbQuery = dbQuery.where(and(...conditions));
        }
        return await dbQuery.orderBy(desc(orders.createdAt));
    }
    async getOrder(id) {
        const [order] = await db.select().from(orders).where(eq(orders.id, id));
        return order;
    }
    async getOrderItems(orderId) {
        return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    }
    async getOrderFees(orderId) {
        return await db.select().from(orderFees).where(eq(orderFees.orderId, orderId));
    }
    async createOrder(order) {
        const [newOrder] = await db.insert(orders).values(order).returning();
        return newOrder;
    }
    async createOrderItem(item) {
        const [newItem] = await db.insert(orderItems).values(item).returning();
        return newItem;
    }
    async createOrderFee(fee) {
        const [newFee] = await db.insert(orderFees).values(fee).returning();
        return newFee;
    }
    async updateOrder(id, data) {
        const [updated] = await db.update(orders)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(orders.id, id))
            .returning();
        return updated;
    }
    async deleteOrder(id) {
        const result = await db.delete(orders).where(eq(orders.id, id)).returning();
        return result.length > 0;
    }
    async deleteOrderItems(orderId) {
        const result = await db.delete(orderItems).where(eq(orderItems.orderId, orderId)).returning();
        return result.length > 0;
    }
    async deleteOrderFees(orderId) {
        const result = await db.delete(orderFees).where(eq(orderFees.orderId, orderId)).returning();
        return result.length > 0;
    }
}
export const storage = new DatabaseStorage();
