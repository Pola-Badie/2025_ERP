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
