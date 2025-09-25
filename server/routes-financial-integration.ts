import { Express, Request, Response } from "express";
import { db } from "./db";
import { 
  sales, 
  expenses, 
  customers,
  expenseCategories,
  insertSaleSchema,
  insertExpenseSchema,
  expenses as expensesTable
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { 
  createInvoiceJournalEntry, 
  createExpenseJournalEntry,
  updateAccountBalances 
} from "./accounting-integration";

export function registerFinancialIntegrationRoutes(app: Express) {
  
  // Enhanced Sales/Invoice Creation with Automatic Journal Entry
  app.post("/api/sales", async (req: Request, res: Response) => {
    try {
      const validatedData = insertSaleSchema.parse(req.body);
      
      // Create the sale/invoice record
      const [sale] = await db
        .insert(sales)
        .values(validatedData)
        .returning();
      
      // Get customer information for journal entry
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, sale.customerId))
        .limit(1);
      
      // Automatically create journal entry for the invoice
      if (customer) {
        try {
          const invoiceData = {
            ...sale,
            customerName: customer.name,
            invoiceNumber: sale.invoiceNumber || `INV-${sale.id}`,
            totalAmount: parseFloat(sale.subtotal || '0'),
            tax: parseFloat(sale.tax || '0'),
            grandTotal: parseFloat(sale.total || '0')
          };
          
          // Get user ID from request or session, default to 1 if not available
          const userId = req.user?.id || req.body.userId || 1;
          const journalEntry = await createInvoiceJournalEntry(invoiceData, userId);
          await updateAccountBalances(journalEntry.id);
          
          console.log(`Journal entry created for invoice ${sale.invoiceNumber}: ${journalEntry.entryNumber}`);
        } catch (journalError) {
          console.error("Error creating journal entry for invoice:", journalError);
          // Continue even if journal entry fails - the sale is still created
        }
      }
      
      res.status(201).json(sale);
    } catch (error) {
      console.error("Error creating sale:", error);
      res.status(500).json({ error: "Failed to create sale" });
    }
  });

  // Enhanced Expense Creation (Temporarily Disabled Accounting Integration)
  app.post("/api/expenses", async (req: Request, res: Response) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      
      // Create the expense record
      const [expense] = await db
        .insert(expensesTable)
        .values(validatedData)
        .returning();
      
      // Create corresponding journal entry for accounting integration
      try {
        const userId = req.user?.id || req.body.userId || 1;
        const expenseData = {
          id: expense.id,
          amount: parseFloat(expense.amount),
          category: expense.category,
          description: expense.description,
          vendor: expense.vendor,
          date: expense.date
        };
        
        const journalEntry = await createExpenseJournalEntry(expenseData, userId);
        await updateAccountBalances(journalEntry.id);
        
        console.log(`✅ Expense journal entry created: ${journalEntry.entryNumber} for expense ${expense.id}`);
      } catch (journalError) {
        console.error("Error creating journal entry for expense:", journalError);
        // Continue even if journal entry fails - the expense is still created
      }
      
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ error: "Failed to create expense" });
    }
  });

  // Update existing sale with journal entry
  app.patch("/api/sales/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Update the sale
      const [updatedSale] = await db
        .update(sales)
        .set(updates)
        .where(eq(sales.id, parseInt(id)))
        .returning();
      
      if (!updatedSale) {
        return res.status(404).json({ error: "Sale not found" });
      }
      
      // If the sale status changed to 'paid', we might want to create additional journal entries
      if (updates.status === 'paid' && updatedSale.status !== 'paid') {
        // This could trigger a payment journal entry
        console.log(`Sale ${id} marked as paid - consider creating payment journal entry`);
      }
      
      res.json(updatedSale);
    } catch (error) {
      console.error("Error updating sale:", error);
      res.status(500).json({ error: "Failed to update sale" });
    }
  });

  // Update existing expense with journal entry
  app.patch("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Update the expense
      const [updatedExpense] = await db
        .update(expensesTable)
        .set(updates)
        .where(eq(expensesTable.id, parseInt(id)))
        .returning();
      
      if (!updatedExpense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      
      res.json(updatedExpense);
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(500).json({ error: "Failed to update expense" });
    }
  });

  // Get financial transaction history (for accounting integration dashboard)
  app.get("/api/financial-transactions", async (req: Request, res: Response) => {
    try {
      const { type, startDate, endDate } = req.query;
      
      // Get recent sales
      let salesQuery = db
        .select({
          id: sales.id,
          type: sales.type,
          amount: sales.total,
          date: sales.date,
          reference: sales.invoiceNumber,
          description: sales.customerName,
          category: sales.type
        })
        .from(sales);
      
      // Get recent expenses
      let expensesQuery = db
        .select({
          id: expensesTable.id,
          type: expensesTable.category,
          amount: expensesTable.amount,
          date: expensesTable.date,
          reference: expensesTable.description,
          description: expensesTable.description,
          category: expensesTable.category
        })
        .from(expensesTable);
      
      // Apply date filters if provided
      if (startDate) {
        salesQuery = salesQuery.where(eq(sales.date, startDate as string));
        expensesQuery = expensesQuery.where(eq(expensesTable.date, startDate as string));
      }
      
      const salesResults = await salesQuery;
      const expensesResults = await expensesQuery;
      
      // Combine and format results
      const transactions = [
        ...salesResults.map(sale => ({
          ...sale,
          transactionType: 'sale',
          impact: 'positive'
        })),
        ...expensesResults.map(expense => ({
          ...expense,
          transactionType: 'expense',
          impact: 'negative'
        }))
      ];
      
      // Sort by date, most recent first
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching financial transactions:", error);
      res.status(500).json({ error: "Failed to fetch financial transactions" });
    }
  });

  // Financial integration health check
  app.get("/api/financial-integration/status", async (req: Request, res: Response) => {
    try {
      // Check if accounting integration is working
      const { generateFinancialSummary } = await import('./accounting-integration');
      const summary = await generateFinancialSummary();
      
      res.json({
        status: 'active',
        accountingIntegration: 'connected',
        lastSync: new Date().toISOString(),
        summary: {
          totalRevenue: summary.totalRevenue,
          totalExpenses: summary.totalExpenses,
          netProfit: summary.netProfit
        }
      });
    } catch (error) {
      console.error("Financial integration status check failed:", error);
      res.status(500).json({
        status: 'error',
        accountingIntegration: 'disconnected',
        error: 'Integration check failed'
      });
    }
  });
}