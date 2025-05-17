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
      const allAccounts = await db
        .select()
        .from(accounts)
        .orderBy(accounts.code);
      res.json(allAccounts);
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

      // For simplicity for now, we'll return all journal entries
      // In a production environment, we would add date filtering
      const entries = await db.select().from(journalEntries);

      res.json(entries);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ error: "Failed to fetch journal entries" });
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
      
      // Generate P&L data from mock data
      const salesData = financialData.dueInvoices.filter(invoice => 
        new Date(invoice.invoiceDate) >= start && new Date(invoice.invoiceDate) <= end
      );
      
      const cogsData = financialData.purchases.filter(purchase => 
        new Date(purchase.date) >= start && new Date(purchase.date) <= end
      );
      
      const expensesData = financialData.expenses.filter(expense => 
        new Date(expense.date) >= start && new Date(expense.date) <= end
      );
      
      // Calculate totals
      const currentRevenueTotal = salesData.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
      const currentCogsTotal = cogsData.reduce((sum, purchase) => sum + purchase.total, 0);
      const currentExpensesTotal = expensesData.reduce((sum, expense) => sum + expense.amount, 0);
      
      // Group expenses by cost center for breakdown
      const expensesByCategory = {};
      expensesData.forEach(expense => {
        if (!expensesByCategory[expense.costCenter]) {
          expensesByCategory[expense.costCenter] = [];
        }
        expensesByCategory[expense.costCenter].push(expense);
      });
      
      // Calculate previous period (YTD) by taking a larger date range
      const yearStart = new Date(start.getFullYear(), 0, 1); // Jan 1 of current year
      
      const ytdSalesTotal = financialData.dueInvoices
        .filter(invoice => new Date(invoice.invoiceDate) >= yearStart && new Date(invoice.invoiceDate) <= end)
        .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
      
      const ytdCogsTotal = financialData.purchases
        .filter(purchase => new Date(purchase.date) >= yearStart && new Date(purchase.date) <= end)
        .reduce((sum, purchase) => sum + purchase.total, 0);
      
      const ytdExpensesTotal = financialData.expenses
        .filter(expense => new Date(expense.date) >= yearStart && new Date(expense.date) <= end)
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      // Calculate variance (as percentage change, or 0 if previous period is 0)
      const calculateVariance = (current, previous) => {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
      };
      
      // Calculate gross profit
      const currentGrossProfit = currentRevenueTotal - currentCogsTotal;
      const ytdGrossProfit = ytdSalesTotal - ytdCogsTotal;
      
      // Calculate net profit
      const currentNetProfit = currentGrossProfit - currentExpensesTotal;
      const ytdNetProfit = ytdGrossProfit - ytdExpensesTotal;
      
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
          ytd: ytdCogsTotal,
          variance: calculateVariance(currentCogsTotal, ytdCogsTotal),
          items: cogsData.map((purchase, idx) => ({
            id: idx + 1,
            code: "500100",
            name: `Purchase of ${purchase.item}`,
            current: purchase.total,
            ytd: purchase.total * 1.05, // Simulate YTD with slight increase
            variance: 5 // Simulated variance
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
          ytd: ytdExpensesTotal,
          variance: calculateVariance(currentExpensesTotal, ytdExpensesTotal),
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
      
      // Filter data for assets (Cash from expenses and purchases payments, Accounts Receivable from due invoices)
      const cashAccountData = [
        ...financialData.expenses.filter(expense => 
          new Date(expense.date) <= reportDate && 
          (expense.paymentMethod === 'Cash' || expense.paymentMethod === 'Bank Transfer')
        ),
        ...financialData.purchases.filter(purchase => 
          new Date(purchase.date) <= reportDate && 
          purchase.paidStatus === 'Paid' && 
          (purchase.paymentMethod === 'Cash' || purchase.paymentMethod === 'Bank Transfer')
        )
      ];
      
      const accountsReceivableData = financialData.dueInvoices.filter(invoice => 
        new Date(invoice.invoiceDate) <= reportDate && 
        invoice.status !== 'Paid'
      );
      
      // Calculate current balances
      const cashBalance = -1 * cashAccountData.reduce((sum, item) => {
        if ('amount' in item) {
          return sum + (item as any).amount;
        } else {
          return sum + (item as any).total;
        }
      }, 0);
      
      const accountsReceivableBalance = accountsReceivableData.reduce((sum, invoice) => 
        sum + invoice.balance, 0
      );
      
      // Calculate liabilities from unpaid purchases
      const accountsPayableData = financialData.purchases.filter(purchase => 
        new Date(purchase.date) <= reportDate && 
        purchase.paidStatus !== 'Paid'
      );
      
      const accountsPayableBalance = accountsPayableData.reduce((sum, purchase) => 
        sum + purchase.total, 0
      );
      
      // Calculate equity (simplified as Assets - Liabilities)
      const totalAssets = cashBalance + accountsReceivableBalance;
      const totalLiabilities = accountsPayableBalance;
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
                  name: "Cash",
                  openingBalance: cashBalance * 0.8, // Simulated opening balance
                  debits: Math.abs(cashBalance * 0.4), // Simulated debits
                  credits: Math.abs(cashBalance * 0.2), // Simulated credits
                  closingBalance: cashBalance
                },
                {
                  id: 2,
                  code: "100200",
                  name: "Accounts Receivable",
                  openingBalance: accountsReceivableBalance * 0.7, // Simulated opening balance
                  debits: accountsReceivableBalance * 0.5, // Simulated debits
                  credits: accountsReceivableBalance * 0.2, // Simulated credits
                  closingBalance: accountsReceivableBalance
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
                  id: 3,
                  code: "200100",
                  name: "Accounts Payable",
                  openingBalance: accountsPayableBalance * 0.6, // Simulated opening balance
                  debits: accountsPayableBalance * 0.2, // Simulated debits 
                  credits: accountsPayableBalance * 0.6, // Simulated credits
                  closingBalance: accountsPayableBalance
                }
              ]
            }
          ]
        },
        equity: {
          total: equityBalance,
          byCategory: [
            {
              name: "Equity",
              total: equityBalance,
              accounts: [
                {
                  id: 4,
                  code: "300100",
                  name: "Equity",
                  openingBalance: equityBalance * 0.8, // Simulated opening balance
                  debits: Math.max(0, equityBalance * -0.1), // Simulated debits (if negative)
                  credits: Math.max(0, equityBalance * 0.3), // Simulated credits (if positive)
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
      const periods = await db
        .select()
        .from(accountingPeriods)
        .orderBy(desc(accountingPeriods.startDate));
      
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
