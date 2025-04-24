import { Express, Request, Response } from "express";
import { db } from "./db";
import { 
  accounts, 
  journalEntries, 
  journalLines, 
  financialReports, 
  insertAccountSchema,
  insertJournalEntrySchema,
  insertJournalLineSchema
} from "@shared/schema";
import { eq, and, gte, lte, desc, sql, inArray } from "drizzle-orm";

export function registerAccountingRoutes(app: Express) {
  // Accounting API Routes

  // Get accounting summary for dashboard
  app.get("/api/accounting/summary", async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Get total revenue this month from journal entries
      const revenueAccounts = await db.select().from(accounts).where(eq(accounts.type, "Income"));
      const revenueAccountIds = revenueAccounts.map(account => account.id);
      
      // Get total expenses this month from journal entries
      const expenseAccounts = await db.select().from(accounts).where(eq(accounts.type, "Expense"));
      const expenseAccountIds = expenseAccounts.map(account => account.id);

      // Get journal entry totals for this month
      const journalEntriesTotals = await db.select().from(journalEntries)
        .where(gte(journalEntries.date, firstDayOfMonth));

      // For now, return placeholder data as we don't have real journal entries yet
      const totalAccounts = await db.select({ count: sql<number>`count(*)` }).from(accounts);
      const totalJournalEntries = await db.select({ count: sql<number>`count(*)` }).from(journalEntries);
      
      res.json({
        totalAccounts: totalAccounts[0]?.count || 0, 
        journalEntries: totalJournalEntries[0]?.count || 0,
        revenueThisMonth: 0, // This will need to be calculated from journal entries
        expensesThisMonth: 0  // This will need to be calculated from journal entries
      });
    } catch (error) {
      console.error("Error fetching accounting summary:", error);
      res.status(500).json({ error: "Failed to fetch accounting summary" });
    }
  });

  // Chart of Accounts API
  app.get("/api/accounts", async (_req: Request, res: Response) => {
    try {
      const allAccounts = await db.select().from(accounts).orderBy(accounts.code);
      res.json(allAccounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  app.get("/api/accounts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [account] = await db.select().from(accounts).where(eq(accounts.id, parseInt(id)));
      
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
      
      const [account] = await db.insert(accounts).values(validatedData).returning();
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
      
      let query = db.select().from(journalEntries).orderBy(desc(journalEntries.date));
      
      if (startDate && endDate) {
        query = query.where(
          and(
            gte(journalEntries.date, new Date(startDate as string)),
            lte(journalEntries.date, new Date(endDate as string))
          )
        );
      }
      
      const entries = await query;
      res.json(entries);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ error: "Failed to fetch journal entries" });
    }
  });

  app.get("/api/journal-entries/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, parseInt(id)));
      
      if (!entry) {
        return res.status(404).json({ error: "Journal entry not found" });
      }
      
      // Get the journal lines for this entry
      const lines = await db.select().from(journalLines).where(eq(journalLines.journalId, parseInt(id)));
      
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
      const totalDebits = lines.reduce((sum: number, line: any) => sum + (parseFloat(line.debit) || 0), 0);
      const totalCredits = lines.reduce((sum: number, line: any) => sum + (parseFloat(line.credit) || 0), 0);
      
      if (totalDebits !== totalCredits) {
        return res.status(400).json({ 
          error: "Journal entry is not balanced. Total debits must equal total credits.",
          totalDebits,
          totalCredits
        });
      }
      
      // Insert the journal entry
      const [journalEntry] = await db.insert(journalEntries).values({
        ...validatedEntry,
        totalDebit: totalDebits.toString(),
        totalCredit: totalCredits.toString(),
      }).returning();
      
      // Insert the journal lines
      const journalLinesData = lines.map((line: any, index: number) => ({
        journalId: journalEntry.id,
        accountId: line.accountId,
        description: line.description,
        debit: line.debit || "0",
        credit: line.credit || "0",
        position: index + 1,
      }));
      
      const journalLinesResult = await db.insert(journalLines).values(journalLinesData).returning();
      
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
        return res.status(400).json({ error: "Start date and end date are required" });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      // Get all income and expense accounts
      const incomeAccounts = await db.select().from(accounts).where(eq(accounts.type, "Income"));
      const expenseAccounts = await db.select().from(accounts).where(eq(accounts.type, "Expense"));
      
      const incomeAccountIds = incomeAccounts.map(account => account.id);
      const expenseAccountIds = expenseAccounts.map(account => account.id);
      
      // Get journal entries within the date range
      const journalEntriesInRange = await db.select().from(journalEntries)
        .where(
          and(
            gte(journalEntries.date, start),
            lte(journalEntries.date, end)
          )
        );
      
      const journalEntryIds = journalEntriesInRange.map(entry => entry.id);
      
      // Get journal lines for income and expense accounts
      const incomeLines = await db.select().from(journalLines)
        .where(
          and(
            inArray(journalLines.journalId, journalEntryIds),
            inArray(journalLines.accountId, incomeAccountIds)
          )
        );
      
      const expenseLines = await db.select().from(journalLines)
        .where(
          and(
            inArray(journalLines.journalId, journalEntryIds),
            inArray(journalLines.accountId, expenseAccountIds)
          )
        );
      
      // Calculate total revenue and expenses
      const totalRevenue = incomeLines.reduce((sum, line) => sum + parseFloat(line.credit.toString()) - parseFloat(line.debit.toString()), 0);
      const totalExpenses = expenseLines.reduce((sum, line) => sum + parseFloat(line.debit.toString()) - parseFloat(line.credit.toString()), 0);
      const netProfit = totalRevenue - totalExpenses;
      
      // Group revenue and expenses by account
      const revenueByAccount = incomeAccounts.map(account => {
        const accountLines = incomeLines.filter(line => line.accountId === account.id);
        const amount = accountLines.reduce((sum, line) => sum + parseFloat(line.credit.toString()) - parseFloat(line.debit.toString()), 0);
        return {
          id: account.id,
          code: account.code,
          name: account.name,
          amount,
        };
      }).filter(item => item.amount !== 0);
      
      const expensesByAccount = expenseAccounts.map(account => {
        const accountLines = expenseLines.filter(line => line.accountId === account.id);
        const amount = accountLines.reduce((sum, line) => sum + parseFloat(line.debit.toString()) - parseFloat(line.credit.toString()), 0);
        return {
          id: account.id,
          code: account.code,
          name: account.name,
          amount,
        };
      }).filter(item => item.amount !== 0);
      
      res.json({
        startDate: start,
        endDate: end,
        revenue: {
          total: totalRevenue,
          byAccount: revenueByAccount,
        },
        expenses: {
          total: totalExpenses,
          byAccount: expensesByAccount,
        },
        netProfit,
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
      
      // Get all asset, liability, and equity accounts
      const assetAccounts = await db.select().from(accounts).where(eq(accounts.type, "Asset"));
      const liabilityAccounts = await db.select().from(accounts).where(eq(accounts.type, "Liability"));
      const equityAccounts = await db.select().from(accounts).where(eq(accounts.type, "Equity"));
      
      const assetAccountIds = assetAccounts.map(account => account.id);
      const liabilityAccountIds = liabilityAccounts.map(account => account.id);
      const equityAccountIds = equityAccounts.map(account => account.id);
      
      // Get journal entries up to the specified date
      const journalEntriesUpToDate = await db.select().from(journalEntries)
        .where(lte(journalEntries.date, reportDate));
      
      const journalEntryIds = journalEntriesUpToDate.map(entry => entry.id);
      
      // Get journal lines for assets, liabilities, and equity accounts
      const assetLines = await db.select().from(journalLines)
        .where(
          and(
            inArray(journalLines.journalId, journalEntryIds),
            inArray(journalLines.accountId, assetAccountIds)
          )
        );
      
      const liabilityLines = await db.select().from(journalLines)
        .where(
          and(
            inArray(journalLines.journalId, journalEntryIds),
            inArray(journalLines.accountId, liabilityAccountIds)
          )
        );
      
      const equityLines = await db.select().from(journalLines)
        .where(
          and(
            inArray(journalLines.journalId, journalEntryIds),
            inArray(journalLines.accountId, equityAccountIds)
          )
        );
      
      // Calculate total assets, liabilities, and equity
      const totalAssets = assetLines.reduce((sum, line) => sum + parseFloat(line.debit.toString()) - parseFloat(line.credit.toString()), 0);
      const totalLiabilities = liabilityLines.reduce((sum, line) => sum + parseFloat(line.credit.toString()) - parseFloat(line.debit.toString()), 0);
      const totalEquity = equityLines.reduce((sum, line) => sum + parseFloat(line.credit.toString()) - parseFloat(line.debit.toString()), 0);
      
      // Group assets, liabilities, and equity by account
      const assetsByAccount = assetAccounts.map(account => {
        const accountLines = assetLines.filter(line => line.accountId === account.id);
        const amount = accountLines.reduce((sum, line) => sum + parseFloat(line.debit.toString()) - parseFloat(line.credit.toString()), 0);
        return {
          id: account.id,
          code: account.code,
          name: account.name,
          amount,
        };
      }).filter(item => item.amount !== 0);
      
      const liabilitiesByAccount = liabilityAccounts.map(account => {
        const accountLines = liabilityLines.filter(line => line.accountId === account.id);
        const amount = accountLines.reduce((sum, line) => sum + parseFloat(line.credit.toString()) - parseFloat(line.debit.toString()), 0);
        return {
          id: account.id,
          code: account.code,
          name: account.name,
          amount,
        };
      }).filter(item => item.amount !== 0);
      
      const equityByAccount = equityAccounts.map(account => {
        const accountLines = equityLines.filter(line => line.accountId === account.id);
        const amount = accountLines.reduce((sum, line) => sum + parseFloat(line.credit.toString()) - parseFloat(line.debit.toString()), 0);
        return {
          id: account.id,
          code: account.code,
          name: account.name,
          amount,
        };
      }).filter(item => item.amount !== 0);
      
      res.json({
        date: reportDate,
        assets: {
          total: totalAssets,
          byAccount: assetsByAccount,
        },
        liabilities: {
          total: totalLiabilities,
          byAccount: liabilitiesByAccount,
        },
        equity: {
          total: totalEquity,
          byAccount: equityByAccount,
        },
        isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
      });
    } catch (error) {
      console.error("Error generating balance sheet:", error);
      res.status(500).json({ error: "Failed to generate balance sheet" });
    }
  });
}