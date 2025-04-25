import { Express, Request, Response } from "express";
import { db } from "./db";
import {
  accounts,
  journalEntries,
  journalLines,
  financialReports,
  insertAccountSchema,
  insertJournalEntrySchema,
  insertJournalLineSchema,
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

      // Since we're just starting with the accounting module, return placeholder data
      // This will be updated as users add accounts and journal entries

      res.json({
        startDate: start,
        endDate: end,
        revenue: {
          total: 0,
          byAccount: [],
        },
        expenses: {
          total: 0,
          byAccount: [],
        },
        netProfit: 0,
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

      // Since we're just starting with the accounting module, return placeholder data
      // This will be updated as users add accounts and journal entries

      res.json({
        date: reportDate,
        assets: {
          total: 0,
          byAccount: [],
        },
        liabilities: {
          total: 0,
          byAccount: [],
        },
        equity: {
          total: 0,
          byAccount: [],
        },
        isBalanced: true,
      });
    } catch (error) {
      console.error("Error generating balance sheet:", error);
      res.status(500).json({ error: "Failed to generate balance sheet" });
    }
  });
}
