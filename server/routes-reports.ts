import { Express, Request, Response } from 'express';
import { db } from './db';
import { products, customers, productCategories, sales, saleItems, suppliers, purchaseOrders, inventoryTransactions, invoices, expenses } from '../shared/schema';
import { eq, sql, desc, gte, lte, and } from 'drizzle-orm';

export function registerReportsRoutes(app: Express) {
  // Sales Reports
  app.get("/api/reports/sales", async (req: Request, res: Response) => {
    try {
      // Get actual sales data from database
      const actualSales = await db
        .select({
          id: sales.id,
          invoiceNumber: sales.invoiceNumber,
          date: sales.date,
          totalAmount: sales.totalAmount,
          grandTotal: sales.grandTotal,
          paymentMethod: sales.paymentMethod,
          paymentStatus: sales.paymentStatus
        })
        .from(sales)
        .orderBy(desc(sales.date));

      // Get sales with customer details
      const salesWithCustomers = await db
        .select({
          saleId: sales.id,
          customerName: customers.name,
          company: customers.company,
          totalAmount: sales.totalAmount,
          date: sales.date
        })
        .from(sales)
        .leftJoin(customers, eq(sales.customerId, customers.id));

      // Calculate actual metrics
      const totalSales = actualSales.reduce((sum, sale) => sum + parseFloat(sale.grandTotal?.toString() || '0'), 0);
      const transactionCount = actualSales.length;
      const averageOrderValue = transactionCount > 0 ? totalSales / transactionCount : 0;

      // Get top selling categories from actual sales data
      const topCategories = await db
        .select({
          categoryName: productCategories.name,
          totalSales: sql<number>`sum(CAST(${saleItems.total} as DECIMAL))`,
          transactionCount: sql<number>`count(*)`
        })
        .from(saleItems)
        .innerJoin(products, eq(saleItems.productId, products.id))
        .innerJoin(productCategories, eq(products.categoryId, productCategories.id))
        .groupBy(productCategories.name)
        .orderBy(desc(sql`sum(CAST(${saleItems.total} as DECIMAL))`))
        .limit(1);

      const topCategory = topCategories[0]?.categoryName || 'Antibiotics';

      // Generate sales trend from actual data (last 15 days)
      const salesTrend = [];
      for (let i = 14; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        const daySales = actualSales.filter(sale => {
          const saleDate = new Date(sale.date).toISOString().split('T')[0];
          return saleDate === dateStr;
        });

        const dayTotal = daySales.reduce((sum, sale) => sum + parseFloat(sale.grandTotal?.toString() || '0'), 0);
        
        salesTrend.push({
          date: dateStr,
          amount: Math.round(dayTotal),
          transactions: daySales.length
        });
      }

      res.json({
        summary: {
          totalSales: Math.round(totalSales),
          transactionCount,
          averageOrderValue: Math.round(averageOrderValue),
          topCategory
        },
        chartData: salesTrend,
        transactions: actualSales.slice(0, 20)
      });
    } catch (error) {
      console.error('Sales report error:', error);
      res.status(500).json({ error: 'Failed to generate sales report' });
    }
  });

  // Financial Reports
  app.get("/api/reports/financial", async (req: Request, res: Response) => {
    try {
      const productsData = await db.select().from(products);
      
      const totalAssets = productsData.reduce((sum, product) => {
        const cost = parseFloat(product.costPrice?.toString() || '0');
        const qty = product.quantity || 0;
        return sum + (cost * qty);
      }, 0);

      const totalRevenue = productsData.reduce((sum, product) => {
        const price = parseFloat(product.sellingPrice?.toString() || '0');
        const qty = product.quantity || 0;
        return sum + (price * qty);
      }, 0);

      const monthlyTrends = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        monthlyTrends.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: totalRevenue * (0.8 + Math.random() * 0.4) / 12,
          expenses: totalAssets * (0.7 + Math.random() * 0.6) / 12,
          profit: (totalRevenue - totalAssets) * (0.5 + Math.random() * 0.5) / 12
        });
      }

      res.json({
        balanceSheet: {
          assets: totalAssets,
          liabilities: totalAssets * 0.3,
          equity: totalAssets * 0.7,
          totalAssets: totalAssets,
          totalLiabilitiesAndEquity: totalAssets
        },
        profitLoss: {
          revenue: totalRevenue,
          expenses: totalAssets,
          grossProfit: totalRevenue - totalAssets,
          netProfit: totalRevenue - totalAssets
        },
        monthlyTrends,
        cashFlow: {
          operatingActivities: totalRevenue * 0.7,
          investingActivities: -totalAssets * 0.1,
          financingActivities: totalAssets * 0.2
        }
      });
    } catch (error) {
      console.error('Financial report error:', error);
      res.status(500).json({ error: 'Failed to generate financial report' });
    }
  });

  // Inventory Reports
  app.get("/api/reports/inventory", async (req: Request, res: Response) => {
    try {
      const inventoryData = await db
        .select({
          id: products.id,
          name: products.name,
          drugName: products.drugName,
          sku: products.sku,
          quantity: products.quantity,
          lowStockThreshold: products.lowStockThreshold,
          sellingPrice: products.sellingPrice,
          costPrice: products.costPrice,
          expiryDate: products.expiryDate,
          status: products.status,
          categoryId: products.categoryId,
          manufacturer: products.manufacturer,
          location: products.location
        })
        .from(products);

      // Get categories count
      const categories = await db.select().from(productCategories);
      const categoriesCount = categories.length;

      const totalProducts = inventoryData.length;
      const totalValue = inventoryData.reduce((sum, product) => 
        sum + ((product.quantity || 0) * parseFloat(product.costPrice?.toString() || '0')), 0);
      const lowStockItems = inventoryData.filter(product => 
        (product.quantity || 0) <= (product.lowStockThreshold || 10)).length;

      // Calculate expiring products (within 90 days)
      const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      const expiringProducts = inventoryData.filter(product => 
        product.expiryDate && new Date(product.expiryDate) <= ninetyDaysFromNow
      ).length;

      const stockLevels = inventoryData.slice(0, 20).map(product => ({
        name: product.drugName || product.name?.substring(0, 20) || '',
        current: product.quantity || 0,
        minimum: product.lowStockThreshold || 10,
        value: (product.quantity || 0) * parseFloat(product.costPrice?.toString() || '0'),
        status: product.status || 'active'
      }));

      res.json({
        summary: {
          totalProducts,
          totalValue: Math.round(totalValue),
          lowStockItems,
          categories: categoriesCount,
          expiringProducts
        },
        stockLevels,
        lowStockAlert: inventoryData.filter(p => 
          (p.quantity || 0) <= (p.lowStockThreshold || 10)).slice(0, 10),
        categoryBreakdown: categories.map(cat => ({
          name: cat.name,
          productCount: inventoryData.filter(p => p.categoryId === cat.id).length
        }))
      });
    } catch (error) {
      console.error('Inventory report error:', error);
      res.status(500).json({ error: 'Failed to generate inventory report' });
    }
  });

  // Customer Reports
  app.get("/api/reports/customers", async (req: Request, res: Response) => {
    try {
      // Get customer data with actual sales totals
      const customerData = await db
        .select({
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
          company: customers.company,
          sector: customers.sector,
          createdAt: customers.createdAt,
          totalPurchases: customers.totalPurchases
        })
        .from(customers);

      // Calculate actual customer purchase totals from sales
      const customerSalesTotals = await db
        .select({
          customerId: sales.customerId,
          totalSpent: sql<number>`sum(CAST(${sales.grandTotal} as DECIMAL))`,
          orderCount: sql<number>`count(*)`
        })
        .from(sales)
        .where(sql`${sales.customerId} IS NOT NULL`)
        .groupBy(sales.customerId);

      const totalCustomers = customerData.length;
      const totalRevenue = customerSalesTotals.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0);

      // Merge customer data with sales totals
      const enrichedCustomers = customerData.map(customer => {
        const salesData = customerSalesTotals.find(s => s.customerId === customer.id);
        return {
          ...customer,
          actualSpent: salesData?.totalSpent || 0,
          orderCount: salesData?.orderCount || 0
        };
      });

      const topCustomers = enrichedCustomers
        .sort((a, b) => b.actualSpent - a.actualSpent)
        .slice(0, 10)
        .map(customer => ({
          name: customer.name || 'Unknown Customer',
          purchases: Math.round(customer.actualSpent),
          orderCount: customer.orderCount,
          company: customer.company,
          id: customer.id
        }));

      // Calculate new customers this month
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const newCustomersThisMonth = customerData.filter(c => 
        new Date(c.createdAt) >= oneMonthAgo
      ).length;

      const customerSegments = [
        { 
          segment: 'High Value (>$5k)', 
          count: enrichedCustomers.filter(c => c.actualSpent > 5000).length,
          value: enrichedCustomers.filter(c => c.actualSpent > 5000).reduce((sum, c) => sum + c.actualSpent, 0)
        },
        { 
          segment: 'Medium Value ($1k-$5k)', 
          count: enrichedCustomers.filter(c => c.actualSpent >= 1000 && c.actualSpent <= 5000).length,
          value: enrichedCustomers.filter(c => c.actualSpent >= 1000 && c.actualSpent <= 5000).reduce((sum, c) => sum + c.actualSpent, 0)
        },
        { 
          segment: 'Low Value (<$1k)', 
          count: enrichedCustomers.filter(c => c.actualSpent < 1000).length,
          value: enrichedCustomers.filter(c => c.actualSpent < 1000).reduce((sum, c) => sum + c.actualSpent, 0)
        }
      ];

      res.json({
        summary: {
          totalCustomers,
          totalRevenue: Math.round(totalRevenue),
          averageOrderValue: totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0,
          newCustomersThisMonth
        },
        topCustomers,
        customerSegments,
        recentActivity: enrichedCustomers.slice(0, 20)
      });
    } catch (error) {
      console.error('Customer report error:', error);
      res.status(500).json({ error: 'Failed to generate customer report' });
    }
  });

  // Production Reports
  app.get("/api/reports/production", async (req: Request, res: Response) => {
    try {
      const productionData = await db
        .select({
          id: products.id,
          name: products.name,
          quantity: products.quantity,
          sellingPrice: products.sellingPrice
        })
        .from(products);

      const totalProduction = productionData.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const productionValue = productionData.reduce((sum, item) => 
        sum + ((item.quantity || 0) * parseFloat(item.sellingPrice?.toString() || '0')), 0);

      const dailyProduction = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailyProduction.push({
          date: date.toISOString().split('T')[0],
          produced: Math.floor(Math.random() * 1000) + 500,
          efficiency: Math.floor(Math.random() * 20) + 80
        });
      }

      res.json({
        summary: {
          totalProduction,
          productionValue,
          efficiency: 92.5,
          activeLines: 3
        },
        dailyProduction,
        productionItems: productionData.slice(0, 20)
      });
    } catch (error) {
      console.error('Production report error:', error);
      res.status(500).json({ error: 'Failed to generate production report' });
    }
  });
}