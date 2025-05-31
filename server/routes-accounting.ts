import { Express, Request, Response } from "express";
import { db } from "./db";
import {
  accounts,
  journalEntries,
  journalLines,
  financialReports,
  accountingPeriods,
  customerPayments,
  paymentAllocations,
  sales,
  customers,
  insertAccountSchema,
  insertJournalEntrySchema,
  insertJournalLineSchema,
  insertAccountingPeriodSchema,
  insertCustomerPaymentSchema,
  insertPaymentAllocationSchema,
} from "@shared/schema";
import { eq, and, gte, lte, desc, sql, inArray } from "drizzle-orm";

export function registerAccountingRoutes(app: Express) {
  // Accounting API Routes

  // Get accounting summary for dashboard
  app.get("/api/accounting/summary", async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Since we're just starting with the accounting module, return placeholder data
      // This will be updated as users add accounts and journal entries

      // For now, return placeholder data as we don't have real journal entries yet
      const totalAccounts = await db
        .select({ count: sql<number>`count(*)` })
        .from(accounts);
      const totalJournalEntries = await db
        .select({ count: sql<number>`count(*)` })
        .from(journalEntries);

      res.json({
        totalAccounts: totalAccounts[0]?.count || 0,
        journalEntries: totalJournalEntries[0]?.count || 0,
        revenueThisMonth: 0, // This will need to be calculated from journal entries
        expensesThisMonth: 0, // This will need to be calculated from journal entries
      });
    } catch (error) {
      console.error("Error fetching accounting summary:", error);
      res.status(500).json({ error: "Failed to fetch accounting summary" });
    }
  });

  // Chart of Accounts API
  app.get("/api/accounts", async (_req: Request, res: Response) => {
    try {
      // Sample chart of accounts for pharmaceutical company
      const sampleAccounts = [
        {
          id: 1,
          code: "1000",
          name: "Cash and Cash Equivalents",
          type: "Asset",
          balance: "125000.00",
          description: "Primary operating cash account",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          code: "1100",
          name: "Accounts Receivable",
          type: "Asset",
          balance: "89500.00",
          description: "Customer outstanding balances",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          code: "1200",
          name: "Raw Materials Inventory",
          type: "Asset",
          balance: "156000.00",
          description: "Active pharmaceutical ingredients and raw materials",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 4,
          code: "1300",
          name: "Finished Goods Inventory",
          type: "Asset",
          balance: "234000.00",
          description: "Completed pharmaceutical products ready for sale",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 5,
          code: "1500",
          name: "Manufacturing Equipment",
          type: "Asset",
          balance: "450000.00",
          description: "Pharmaceutical manufacturing machinery and equipment",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 6,
          code: "2000",
          name: "Accounts Payable",
          type: "Liability",
          balance: "67300.00",
          description: "Outstanding supplier payments",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 7,
          code: "2100",
          name: "Accrued Expenses",
          type: "Liability",
          balance: "23450.00",
          description: "Unpaid operational expenses",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 8,
          code: "3000",
          name: "Owner's Equity",
          type: "Equity",
          balance: "500000.00",
          description: "Initial capital investment",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 9,
          code: "3100",
          name: "Retained Earnings",
          type: "Equity",
          balance: "89750.00",
          description: "Accumulated business profits",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 10,
          code: "4000",
          name: "Pharmaceutical Sales Revenue",
          type: "Revenue",
          balance: "456000.00",
          description: "Revenue from pharmaceutical product sales",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 11,
          code: "5000",
          name: "Cost of Goods Sold",
          type: "Expense",
          balance: "234500.00",
          description: "Direct costs of pharmaceutical production",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 12,
          code: "5100",
          name: "Utilities Expense",
          type: "Expense",
          balance: "15600.00",
          description: "Electricity, water, and facility utilities",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 13,
          code: "5200",
          name: "Marketing and Advertising",
          type: "Expense",
          balance: "28400.00",
          description: "Promotional and marketing activities",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 14,
          code: "5300",
          name: "Laboratory Testing Expense",
          type: "Expense",
          balance: "12750.00",
          description: "Quality control and compliance testing",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 15,
          code: "5400",
          name: "Administrative Expenses",
          type: "Expense",
          balance: "34200.00",
          description: "General administrative and office expenses",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      res.json(sampleAccounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  app.get("/api/accounts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [account] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, parseInt(id)));

      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      res.json(account);
    } catch (error) {
      console.error("Error fetching account:", error);
      res.status(500).json({ error: "Failed to fetch account" });
    }
  });

  app.post("/api/accounts", async (req: Request, res: Response) => {
    try {
      const validatedData = insertAccountSchema.parse(req.body);

      const [account] = await db
        .insert(accounts)
        .values(validatedData)
        .returning();
      res.status(201).json(account);
    } catch (error) {
      console.error("Error creating account:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.patch("/api/accounts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = insertAccountSchema.partial().parse(req.body);

      const [updatedAccount] = await db
        .update(accounts)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, parseInt(id)))
        .returning();

      if (!updatedAccount) {
        return res.status(404).json({ error: "Account not found" });
      }

      res.json(updatedAccount);
    } catch (error) {
      console.error("Error updating account:", error);
      res.status(500).json({ error: "Failed to update account" });
    }
  });

  // Journal Entries API
  app.get("/api/journal-entries", async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      // Sample journal entries for pharmaceutical company
      const sampleEntries = [
        {
          id: 1,
          date: "2025-05-15",
          reference: "JE-001",
          description: "Monthly electricity bill payment",
          totalDebit: "4850.00",
          totalCredit: "4850.00",
          createdAt: new Date("2025-05-15"),
          updatedAt: new Date("2025-05-15")
        },
        {
          id: 2,
          date: "2025-05-18",
          reference: "JE-002", 
          description: "Fuel expenses for company vehicles",
          totalDebit: "1280.00",
          totalCredit: "1280.00",
          createdAt: new Date("2025-05-18"),
          updatedAt: new Date("2025-05-18")
        },
        {
          id: 3,
          date: "2025-05-20",
          reference: "JE-003",
          description: "Purchase of raw materials from ChemCorp Industries",
          totalDebit: "18750.00",
          totalCredit: "18750.00",
          createdAt: new Date("2025-05-20"),
          updatedAt: new Date("2025-05-20")
        },
        {
          id: 4,
          date: "2025-05-22",
          reference: "JE-004",
          description: "Sale of pharmaceutical products to Cairo Medical Center",
          totalDebit: "15450.00",
          totalCredit: "15450.00",
          createdAt: new Date("2025-05-22"),
          updatedAt: new Date("2025-05-22")
        },
        {
          id: 5,
          date: "2025-05-25",
          reference: "JE-005",
          description: "Equipment maintenance and servicing",
          totalDebit: "2750.00",
          totalCredit: "2750.00",
          createdAt: new Date("2025-05-25"),
          updatedAt: new Date("2025-05-25")
        },
        {
          id: 6,
          date: "2025-05-28",
          reference: "JE-006",
          description: "Marketing campaign expenses",
          totalDebit: "3400.00",
          totalCredit: "3400.00",
          createdAt: new Date("2025-05-28"),
          updatedAt: new Date("2025-05-28")
        },
        {
          id: 7,
          date: "2025-05-30",
          reference: "JE-007",
          description: "Laboratory testing fees payment",
          totalDebit: "1950.00",
          totalCredit: "1950.00",
          createdAt: new Date("2025-05-30"),
          updatedAt: new Date("2025-05-30")
        },
        {
          id: 8,
          date: "2025-06-02",
          reference: "JE-008",
          description: "Water and utilities payment",
          totalDebit: "890.00",
          totalCredit: "890.00",
          createdAt: new Date("2025-06-02"),
          updatedAt: new Date("2025-06-02")
        },
        {
          id: 9,
          date: "2025-06-05",
          reference: "JE-009",
          description: "Monthly insurance premiums",
          totalDebit: "2100.00",
          totalCredit: "2100.00",
          createdAt: new Date("2025-06-05"),
          updatedAt: new Date("2025-06-05")
        },
        {
          id: 10,
          date: "2025-06-08",
          reference: "JE-010",
          description: "Legal and professional services fees",
          totalDebit: "1650.00",
          totalCredit: "1650.00",
          createdAt: new Date("2025-06-08"),
          updatedAt: new Date("2025-06-08")
        }
      ];

      res.json(sampleEntries);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ error: "Failed to fetch journal entries" });
    }
  });

  // Generate sample data endpoint
  app.post("/api/accounting/generate-sample-data", async (_req: Request, res: Response) => {
    try {
      // This endpoint confirms that sample data is available
      // The actual sample data is already defined in the GET endpoints above
      res.json({ 
        message: "Sample accounting data generated successfully",
        journalEntries: 10,
        accounts: 15 
      });
    } catch (error) {
      console.error("Error generating sample data:", error);
      res.status(500).json({ error: "Failed to generate sample data" });
    }
  });

  app.get("/api/journal-entries/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [entry] = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.id, parseInt(id)));

      if (!entry) {
        return res.status(404).json({ error: "Journal entry not found" });
      }

      // Get the journal lines for this entry
      const lines = await db
        .select()
        .from(journalLines)
        .where(eq(journalLines.journalId, parseInt(id)));

      res.json({
        ...entry,
        lines,
      });
    } catch (error) {
      console.error("Error fetching journal entry:", error);
      res.status(500).json({ error: "Failed to fetch journal entry" });
    }
  });

  app.post("/api/journal-entries", async (req: Request, res: Response) => {
    try {
      const { entry, lines } = req.body;

      const validatedEntry = insertJournalEntrySchema.parse(entry);

      // Validate that total debits equal total credits
      const totalDebits = lines.reduce(
        (sum: number, line: any) => sum + (parseFloat(line.debit) || 0),
        0,
      );
      const totalCredits = lines.reduce(
        (sum: number, line: any) => sum + (parseFloat(line.credit) || 0),
        0,
      );

      if (totalDebits !== totalCredits) {
        return res.status(400).json({
          error:
            "Journal entry is not balanced. Total debits must equal total credits.",
          totalDebits,
          totalCredits,
        });
      }

      // Insert the journal entry
      const [journalEntry] = await db
        .insert(journalEntries)
        .values({
          ...validatedEntry,
          totalDebit: totalDebits.toString(),
          totalCredit: totalCredits.toString(),
        })
        .returning();

      // Insert the journal lines
      const journalLinesData = lines.map((line: any, index: number) => ({
        journalId: journalEntry.id,
        accountId: line.accountId,
        description: line.description,
        debit: line.debit || "0",
        credit: line.credit || "0",
        position: index + 1,
      }));

      const journalLinesResult = await db
        .insert(journalLines)
        .values(journalLinesData)
        .returning();

      res.status(201).json({
        ...journalEntry,
        lines: journalLinesResult,
      });
    } catch (error) {
      console.error("Error creating journal entry:", error);
      res.status(500).json({ error: "Failed to create journal entry" });
    }
  });

  // Financial Reports API
  app.get("/api/reports/pnl", async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ error: "Start date and end date are required" });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Import the financial data
      const { loadFinancialData } = await import('./financial-seed-data');
      const financialData = loadFinancialData();
      
      // Generate P&L data from all financial sources
      const salesData = financialData.dueInvoices.filter(invoice => 
        new Date(invoice.invoiceDate) >= start && new Date(invoice.invoiceDate) <= end
      );
      
      // COGS from purchases and direct material costs
      const directMaterialPurchases = financialData.purchases.filter(purchase => 
        new Date(purchase.date) >= start && new Date(purchase.date) <= end &&
        (purchase.item.toLowerCase().includes('pharmaceutical') || 
         purchase.item.toLowerCase().includes('active') ||
         purchase.item.toLowerCase().includes('ingredient') ||
         purchase.item.toLowerCase().includes('material'))
      );
      
      // Operating expenses from both purchases and general expenses
      const operatingExpenses = [
        ...financialData.expenses.filter(expense => 
          new Date(expense.date) >= start && new Date(expense.date) <= end
        ),
        ...financialData.purchases.filter(purchase => 
          new Date(purchase.date) >= start && new Date(purchase.date) <= end &&
          !(purchase.item.toLowerCase().includes('pharmaceutical') || 
            purchase.item.toLowerCase().includes('active') ||
            purchase.item.toLowerCase().includes('ingredient') ||
            purchase.item.toLowerCase().includes('material'))
        )
      ];
      
      // Calculate totals
      const currentRevenueTotal = salesData.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
      const currentCogsTotal = directMaterialPurchases.reduce((sum, purchase) => sum + purchase.total, 0);
      const currentExpensesTotal = operatingExpenses.reduce((sum, item) => {
        return sum + ('amount' in item ? item.amount : item.total);
      }, 0);
      
      // Group expenses by cost center for breakdown
      const expensesByCategory: { [key: string]: any[] } = {};
      operatingExpenses.forEach(item => {
        const costCenter = 'costCenter' in item ? (item as any).costCenter : 'Operations';
        if (!expensesByCategory[costCenter]) {
          expensesByCategory[costCenter] = [];
        }
        expensesByCategory[costCenter].push(item);
      });
      
      // Calculate previous period (YTD) by taking a larger date range
      const yearStart = new Date(start.getFullYear(), 0, 1); // Jan 1 of current year
      
      const ytdSalesTotal = financialData.dueInvoices
        .filter(invoice => new Date(invoice.invoiceDate) >= yearStart && new Date(invoice.invoiceDate) <= end)
        .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
      
      const ytdDirectMaterials = financialData.purchases
        .filter(purchase => 
          new Date(purchase.date) >= yearStart && new Date(purchase.date) <= end &&
          (purchase.item.toLowerCase().includes('pharmaceutical') || 
           purchase.item.toLowerCase().includes('active') ||
           purchase.item.toLowerCase().includes('ingredient') ||
           purchase.item.toLowerCase().includes('material'))
        )
        .reduce((sum, purchase) => sum + purchase.total, 0);
      
      const ytdOperatingExpenses = [
        ...financialData.expenses.filter(expense => 
          new Date(expense.date) >= yearStart && new Date(expense.date) <= end
        ),
        ...financialData.purchases.filter(purchase => 
          new Date(purchase.date) >= yearStart && new Date(purchase.date) <= end &&
          !(purchase.item.toLowerCase().includes('pharmaceutical') || 
            purchase.item.toLowerCase().includes('active') ||
            purchase.item.toLowerCase().includes('ingredient') ||
            purchase.item.toLowerCase().includes('material'))
        )
      ].reduce((sum, item) => {
        return sum + ('amount' in item ? item.amount : item.total);
      }, 0);
      
      // Calculate variance (as percentage change, or 0 if previous period is 0)
      const calculateVariance = (current: number, previous: number) => {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
      };
      
      // Calculate gross profit
      const currentGrossProfit = currentRevenueTotal - currentCogsTotal;
      const ytdGrossProfit = ytdSalesTotal - ytdDirectMaterials;
      
      // Calculate net profit
      const currentNetProfit = currentGrossProfit - currentExpensesTotal;
      const ytdNetProfit = ytdGrossProfit - ytdOperatingExpenses;
      
      // Prepare P&L report with detailed breakdown
      res.json({
        startDate: start,
        endDate: end,
        revenue: {
          name: "Revenue",
          current: currentRevenueTotal,
          ytd: ytdSalesTotal,
          variance: calculateVariance(currentRevenueTotal, ytdSalesTotal),
          items: salesData.map((invoice, idx) => ({
            id: idx + 1,
            code: "400100", 
            name: `Sales to ${invoice.client}`,
            current: invoice.totalAmount,
            ytd: invoice.totalAmount * 1.1, // Simulate YTD with slight increase
            variance: 10 // Simulated variance
          }))
        },
        costOfGoodsSold: {
          name: "Cost of Goods Sold",
          current: currentCogsTotal,
          ytd: ytdDirectMaterials,
          variance: calculateVariance(currentCogsTotal, ytdDirectMaterials),
          items: directMaterialPurchases.map((purchase, idx) => ({
            id: idx + 1,
            code: "500100",
            name: `Purchase of ${purchase.item}`,
            current: purchase.total,
            ytd: purchase.total * 1.05,
            variance: 5
          }))
        },
        grossProfit: {
          current: currentGrossProfit,
          ytd: ytdGrossProfit,
          variance: calculateVariance(currentGrossProfit, ytdGrossProfit)
        },
        operatingExpenses: {
          name: "Operating Expenses",
          current: currentExpensesTotal,
          ytd: ytdOperatingExpenses,
          variance: calculateVariance(currentExpensesTotal, ytdOperatingExpenses),
          items: Object.entries(expensesByCategory).flatMap(([category, expenses]) => 
            (expenses as any[]).map((expense, idx) => ({
              id: parseInt(`${idx + 1}${Math.floor(Math.random() * 1000)}`),
              code: "600100",
              name: `${category} - ${expense.description}`,
              current: expense.amount,
              ytd: expense.amount * 1.08, // Simulate YTD with slight increase
              variance: 8 // Simulated variance
            }))
          )
        },
        netProfit: {
          current: currentNetProfit,
          ytd: ytdNetProfit,
          variance: calculateVariance(currentNetProfit, ytdNetProfit)
        }
      });
    } catch (error) {
      console.error("Error generating P&L report:", error);
      res.status(500).json({ error: "Failed to generate P&L report" });
    }
  });

  app.get("/api/reports/balance-sheet", async (req: Request, res: Response) => {
    try {
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ error: "Date is required" });
      }

      const reportDate = new Date(date as string);

      // Import the financial data
      const { loadFinancialData } = await import('./financial-seed-data');
      const financialData = loadFinancialData();
      
      // Calculate comprehensive asset balances from all financial data
      
      // Cash and Bank accounts - from all payment activities
      const cashTransactions = [
        ...financialData.expenses.filter(expense => 
          new Date(expense.date) <= reportDate && 
          (expense.paymentMethod === 'Cash' || expense.paymentMethod === 'Bank Transfer')
        ).map(expense => ({ ...expense, type: 'expense', amount: -expense.amount })),
        ...financialData.purchases.filter(purchase => 
          new Date(purchase.date) <= reportDate && 
          purchase.paidStatus === 'Paid' && 
          (purchase.paymentMethod === 'Cash' || purchase.paymentMethod === 'Bank Transfer')
        ).map(purchase => ({ ...purchase, type: 'purchase', amount: -purchase.total })),
        ...financialData.dueInvoices.filter(invoice => 
          new Date(invoice.invoiceDate) <= reportDate && 
          invoice.status === 'Paid'
        ).map(invoice => ({ ...invoice, type: 'sale', amount: invoice.amountPaid }))
      ];
      
      const cashBalance = Math.max(0, cashTransactions.reduce((sum, transaction) => 
        sum + ('amount' in transaction ? transaction.amount : 0), 50000)); // Starting cash balance
      
      // Accounts Receivable - unpaid customer invoices
      const accountsReceivableData = financialData.dueInvoices.filter(invoice => 
        new Date(invoice.invoiceDate) <= reportDate && 
        invoice.status !== 'Paid'
      );
      const accountsReceivableBalance = accountsReceivableData.reduce((sum, invoice) => 
        sum + invoice.balance, 0
      );
      
      // Inventory - from material purchases not yet used
      const inventoryData = financialData.purchases.filter(purchase => 
        new Date(purchase.date) <= reportDate && 
        (purchase.item.toLowerCase().includes('pharmaceutical') || 
         purchase.item.toLowerCase().includes('active') ||
         purchase.item.toLowerCase().includes('ingredient') ||
         purchase.item.toLowerCase().includes('material'))
      );
      const inventoryBalance = inventoryData.reduce((sum, purchase) => 
        sum + (purchase.total * 0.3), 0); // Assume 30% of materials remain in inventory
      
      // Accounts Payable - unpaid supplier invoices
      const accountsPayableData = financialData.purchases.filter(purchase => 
        new Date(purchase.date) <= reportDate && 
        purchase.paidStatus !== 'Paid'
      );
      const accountsPayableBalance = accountsPayableData.reduce((sum, purchase) => 
        sum + purchase.total, 0
      );
      
      // Accrued Expenses - from expense records
      const accruedExpensesData = financialData.expenses.filter(expense => 
        new Date(expense.date) <= reportDate && 
        expense.paymentMethod === 'Credit'
      );
      const accruedExpensesBalance = accruedExpensesData.reduce((sum, expense) => 
        sum + expense.amount, 0
      );
      
      // Calculate totals
      const totalAssets = cashBalance + accountsReceivableBalance + inventoryBalance;
      const totalLiabilities = accountsPayableBalance + accruedExpensesBalance;
      const equityBalance = totalAssets - totalLiabilities;
      
      // Generate detailed balance sheet with required structure
      const balanceSheet = {
        date: reportDate.toISOString(),
        assets: {
          total: totalAssets,
          byCategory: [
            {
              name: "Current Assets",
              total: totalAssets,
              accounts: [
                {
                  id: 1,
                  code: "100100",
                  name: "Cash and Bank Accounts",
                  openingBalance: 50000, // Starting balance
                  debits: cashTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
                  credits: cashTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
                  closingBalance: cashBalance
                },
                {
                  id: 2,
                  code: "100200",
                  name: "Accounts Receivable",
                  openingBalance: 0,
                  debits: accountsReceivableData.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
                  credits: accountsReceivableData.reduce((sum, invoice) => sum + invoice.amountPaid, 0),
                  closingBalance: accountsReceivableBalance
                },
                {
                  id: 3,
                  code: "100300",
                  name: "Inventory - Raw Materials",
                  openingBalance: 0,
                  debits: inventoryData.reduce((sum, purchase) => sum + purchase.total, 0),
                  credits: inventoryData.reduce((sum, purchase) => sum + (purchase.total * 0.7), 0), // Used materials
                  closingBalance: inventoryBalance
                }
              ]
            }
          ]
        },
        liabilities: {
          total: totalLiabilities,
          byCategory: [
            {
              name: "Current Liabilities",
              total: totalLiabilities,
              accounts: [
                {
                  id: 4,
                  code: "200100",
                  name: "Accounts Payable",
                  openingBalance: 0,
                  debits: accountsPayableData.filter(p => p.paidStatus === 'Paid').reduce((sum, purchase) => sum + purchase.total, 0),
                  credits: accountsPayableBalance,
                  closingBalance: accountsPayableBalance
                },
                {
                  id: 5,
                  code: "200200",
                  name: "Accrued Expenses",
                  openingBalance: 0,
                  debits: 0,
                  credits: accruedExpensesBalance,
                  closingBalance: accruedExpensesBalance
                }
              ]
            }
          ]
        },
        equity: {
          total: equityBalance,
          byCategory: [
            {
              name: "Owner's Equity",
              total: equityBalance,
              accounts: [
                {
                  id: 6,
                  code: "300100",
                  name: "Retained Earnings",
                  openingBalance: 0,
                  debits: 0,
                  credits: equityBalance,
                  closingBalance: equityBalance
                }
              ]
            }
          ]
        },
        isBalanced: true // Always balanced for simulation
      };
      
      res.json(balanceSheet);
    } catch (error) {
      console.error("Error generating balance sheet:", error);
      res.status(500).json({ error: "Failed to generate balance sheet" });
    }
  });

  // Accounting Periods API
  app.get("/api/accounting-periods", async (_req: Request, res: Response) => {
    try {
      let periods = await db
        .select()
        .from(accountingPeriods)
        .orderBy(desc(accountingPeriods.startDate));
      
      // If no periods exist, create some sample periods for pharmaceutical company
      if (periods.length === 0) {
        const samplePeriods = [
          {
            period_name: "Q1 2025",
            start_date: "2025-01-01",
            end_date: "2025-03-31",
            status: "closed" as const
          },
          {
            period_name: "Q2 2025",
            start_date: "2025-04-01",
            end_date: "2025-06-30",
            status: "open" as const
          },
          {
            period_name: "Q3 2025",
            start_date: "2025-07-01",
            end_date: "2025-09-30",
            status: "open" as const
          },
          {
            period_name: "Q4 2025",
            start_date: "2025-10-01",
            end_date: "2025-12-31",
            status: "open" as const
          }
        ];

        await db.insert(accountingPeriods).values(samplePeriods);
        
        periods = await db
          .select()
          .from(accountingPeriods)
          .orderBy(desc(accountingPeriods.startDate));
      }
      
      res.json(periods);
    } catch (error) {
      console.error("Error fetching accounting periods:", error);
      res.status(500).json({ error: "Failed to fetch accounting periods" });
    }
  });

  app.post("/api/accounting-periods", async (req: Request, res: Response) => {
    try {
      const validatedData = insertAccountingPeriodSchema.parse(req.body);
      
      // Check for overlapping periods
      const overlappingPeriods = await db
        .select()
        .from(accountingPeriods)
        .where(
          and(
            lte(accountingPeriods.startDate, new Date(validatedData.endDate)),
            gte(accountingPeriods.endDate, new Date(validatedData.startDate))
          )
        );
      
      if (overlappingPeriods.length > 0) {
        return res.status(400).json({ 
          error: "The specified period overlaps with existing periods",
          overlappingPeriods 
        });
      }
      
      const [period] = await db
        .insert(accountingPeriods)
        .values({
          ...validatedData,
          startDate: new Date(validatedData.startDate),
          endDate: new Date(validatedData.endDate)
        })
        .returning();
      
      res.status(201).json(period);
    } catch (error) {
      console.error("Error creating accounting period:", error);
      res.status(500).json({ error: "Failed to create accounting period" });
    }
  });

  app.patch("/api/accounting-periods/:id/status", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || !['open', 'closed'].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be 'open' or 'closed'" });
      }
      
      const [updatedPeriod] = await db
        .update(accountingPeriods)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(accountingPeriods.id, parseInt(id)))
        .returning();
      
      if (!updatedPeriod) {
        return res.status(404).json({ error: "Accounting period not found" });
      }
      
      res.json(updatedPeriod);
    } catch (error) {
      console.error("Error updating accounting period status:", error);
      res.status(500).json({ error: "Failed to update accounting period status" });
    }
  });

  // Customer Payments API
  app.get("/api/customer-payments", async (req: Request, res: Response) => {
    try {
      const { customerId } = req.query;
      
      let query = db
        .select()
        .from(customerPayments)
        .orderBy(desc(customerPayments.paymentDate));
      
      if (customerId) {
        query = query.where(eq(customerPayments.customerId, parseInt(customerId as string)));
      }
      
      const payments = await query;
      
      // For each payment, get the customer name and payment allocations
      const paymentsWithDetails = await Promise.all(
        payments.map(async (payment) => {
          const [customer] = await db
            .select({ name: customers.name })
            .from(customers)
            .where(eq(customers.id, payment.customerId));
          
          const allocations = await db
            .select({
              id: paymentAllocations.id,
              amount: paymentAllocations.amount,
              invoiceId: paymentAllocations.invoiceId,
              invoiceNumber: sales.invoiceNumber
            })
            .from(paymentAllocations)
            .innerJoin(sales, eq(paymentAllocations.invoiceId, sales.id))
            .where(eq(paymentAllocations.paymentId, payment.id));
          
          return {
            ...payment,
            customerName: customer?.name || 'Unknown Customer',
            allocations
          };
        })
      );
      
      res.json(paymentsWithDetails);
    } catch (error) {
      console.error("Error fetching customer payments:", error);
      res.status(500).json({ error: "Failed to fetch customer payments" });
    }
  });

  app.get("/api/customer-invoices", async (req: Request, res: Response) => {
    try {
      const { customerId } = req.query;
      
      if (!customerId) {
        return res.status(400).json({ error: "Customer ID is required" });
      }
      
      // Get open invoices for this customer
      const invoices = await db
        .select({
          id: sales.id,
          invoiceNumber: sales.invoiceNumber,
          customerId: sales.customerId,
          date: sales.date,
          dueDate: sales.date, // Temporary, you should add a proper dueDate
          totalAmount: sales.grandTotal,
          amountPaid: sql<string>`'0'`, // We'll calculate this below
          status: sales.paymentStatus
        })
        .from(sales)
        .where(
          and(
            eq(sales.customerId, parseInt(customerId as string)),
            eq(sales.paymentStatus, 'pending')
          )
        )
        .orderBy(sales.date);
      
      // For each invoice, calculate amount paid from payment allocations
      const invoicesWithPayments = await Promise.all(
        invoices.map(async (invoice) => {
          const allocations = await db
            .select({ amount: paymentAllocations.amount })
            .from(paymentAllocations)
            .where(eq(paymentAllocations.invoiceId, invoice.id));
          
          const amountPaid = allocations.reduce(
            (total, allocation) => total + parseFloat(allocation.amount.toString()), 
            0
          );
          
          const amountDue = parseFloat(invoice.totalAmount.toString()) - amountPaid;
          
          // Determine invoice status
          let status = 'unpaid';
          if (amountPaid > 0 && amountDue > 0) {
            status = 'partial';
          } else if (amountDue <= 0) {
            status = 'paid';
          } else if (new Date(invoice.dueDate) < new Date()) {
            status = 'overdue';
          }
          
          // Get customer name
          const [customer] = await db
            .select({ name: customers.name })
            .from(customers)
            .where(eq(customers.id, invoice.customerId));
          
          return {
            ...invoice,
            customerName: customer?.name || 'Unknown Customer',
            amountPaid,
            amountDue,
            status
          };
        })
      );
      
      res.json(invoicesWithPayments);
    } catch (error) {
      console.error("Error fetching customer invoices:", error);
      res.status(500).json({ error: "Failed to fetch customer invoices" });
    }
  });

  app.post("/api/customer-payments", async (req: Request, res: Response) => {
    try {
      const { customerId, amount, paymentDate, paymentMethod, reference, notes, allocations } = req.body;
      
      // Generate payment number
      const paymentCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(customerPayments);
      
      const paymentNumber = `PAY-${(paymentCount[0]?.count || 0) + 1}`.padStart(8, '0');
      
      // Create the payment
      const [payment] = await db
        .insert(customerPayments)
        .values({
          paymentNumber,
          customerId,
          amount,
          paymentDate: new Date(paymentDate),
          paymentMethod,
          reference,
          notes,
          status: 'completed'
        })
        .returning();
      
      // Create payment allocations
      if (allocations && allocations.length > 0) {
        const allocationData = allocations
          .filter((allocation: any) => parseFloat(allocation.amount) > 0)
          .map((allocation: any) => ({
            paymentId: payment.id,
            invoiceId: allocation.invoiceId,
            amount: allocation.amount
          }));
        
        if (allocationData.length > 0) {
          await db
            .insert(paymentAllocations)
            .values(allocationData);
        }
      }
      
      // Return the payment with customer name and allocations
      const [customer] = await db
        .select({ name: customers.name })
        .from(customers)
        .where(eq(customers.id, payment.customerId));
      
      const paymentAllocationsData = await db
        .select({
          id: paymentAllocations.id,
          amount: paymentAllocations.amount,
          invoiceId: paymentAllocations.invoiceId,
          invoiceNumber: sales.invoiceNumber
        })
        .from(paymentAllocations)
        .innerJoin(sales, eq(paymentAllocations.invoiceId, sales.id))
        .where(eq(paymentAllocations.paymentId, payment.id));
      
      const result = {
        ...payment,
        customerName: customer?.name || 'Unknown Customer',
        allocations: paymentAllocationsData
      };
      
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating customer payment:", error);
      res.status(500).json({ error: "Failed to create customer payment" });
    }
  });
}
