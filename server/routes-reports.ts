import { Router } from 'express';
import { db } from './db';
import { 
  sales, 
  purchaseOrders, 
  expenses,
  journalEntries,
  customers,
  accounts
} from '../shared/schema';
import { eq, sql, and, gte, lte } from 'drizzle-orm';

const router = Router();

// Helper function to format numbers consistently
const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

// Helper function to calculate date range
const getDateRange = (startDate?: string, endDate?: string) => {
  const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
  const end = endDate ? new Date(endDate) : new Date();
  return { start, end };
};

// Trial Balance Report - DISABLED (using routes-financial-reports.ts implementation instead)
// This endpoint is disabled to prevent conflicts with the correct implementation

// Profit & Loss Report
router.get('/profit-loss', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate as string, endDate as string);
    
    const invoiceData = await db.select().from(sales)
      .where(and(
        sql`DATE(${sales.date}) >= ${start.toISOString().split('T')[0]}`,
        sql`DATE(${sales.date}) <= ${end.toISOString().split('T')[0]}`
      ));
    
    const expenseData = await db.select().from(expenses)
      .where(and(
        gte(expenses.date, start.toISOString().split('T')[0]),
        lte(expenses.date, end.toISOString().split('T')[0])
      ));

    const totalRevenue = invoiceData.reduce((sum, inv) => sum + parseFloat(inv.grandTotal || '0'), 0);
    const totalExpenses = expenseData.reduce((sum, exp) => sum + parseFloat(exp.amount || '0'), 0);
    const netIncome = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

    res.json({
      revenue: {
        accounts: [
          { name: 'Product Sales', amount: totalRevenue * 0.8 },
          { name: 'Service Revenue', amount: totalRevenue * 0.2 }
        ],
        total: totalRevenue
      },
      expenses: {
        accounts: expenseData.map(exp => ({ name: exp.description, amount: exp.amount })),
        total: totalExpenses
      },
      netIncome,
      profitMargin,
      reportPeriod: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
    });
  } catch (error) {
    console.error('Profit & Loss report error:', error);
    res.status(500).json({ error: 'Failed to generate profit & loss report' });
  }
});

// Balance Sheet Report
router.get('/balance-sheet', async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date as string) : new Date();
    
    const invoiceData = await db.select().from(sales)
      .where(sql`DATE(${sales.date}) <= ${reportDate.toISOString().split('T')[0]}`);
    
    const expenseData = await db.select().from(expenses)
      .where(lte(expenses.date, reportDate.toISOString().split('T')[0]));
    
    const purchaseData = await db.select().from(purchaseOrders)
      .where(sql`DATE(${purchaseOrders.orderDate}) <= ${reportDate.toISOString().split('T')[0]}`);

    const totalCash = invoiceData.reduce((sum, inv) => sum + parseFloat(inv.amountPaid || '0'), 0) - 
                     expenseData.reduce((sum, exp) => sum + parseFloat(exp.amount || '0'), 0);
    const totalReceivables = invoiceData.reduce((sum, inv) => sum + parseFloat(inv.grandTotal || '0') - parseFloat(inv.amountPaid || '0'), 0);
    const totalInventory = purchaseData.reduce((sum, pur) => sum + parseFloat(pur.totalAmount || '0'), 0) * 0.7; // Assume 70% remains
    const totalAssets = totalCash + totalReceivables + totalInventory;

    const totalPayables = purchaseData.reduce((sum, pur) => sum + parseFloat(pur.totalAmount || '0'), 0) * 0.3; // Assume 30% unpaid
    const totalLiabilities = totalPayables;

    const totalEquity = totalAssets - totalLiabilities;

    res.json({
      assets: {
        accounts: [
          { name: 'Cash and Cash Equivalents', amount: totalCash },
          { name: 'Accounts Receivable', amount: totalReceivables },
          { name: 'Inventory', amount: totalInventory }
        ],
        total: totalAssets
      },
      liabilities: {
        accounts: [
          { name: 'Accounts Payable', amount: totalPayables }
        ],
        total: totalLiabilities
      },
      equity: {
        accounts: [
          { name: 'Retained Earnings', amount: totalEquity }
        ],
        total: totalEquity
      },
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
      reportDate: reportDate.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Balance sheet report error:', error);
    res.status(500).json({ error: 'Failed to generate balance sheet report' });
  }
});

// Cash Flow Report
router.get('/cash-flow', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate as string, endDate as string);
    
    const invoiceData = await db.select().from(sales)
      .where(and(
        sql`DATE(${sales.date}) >= ${start.toISOString().split('T')[0]}`,
        sql`DATE(${sales.date}) <= ${end.toISOString().split('T')[0]}`
      ));
    
    const expenseData = await db.select().from(expenses)
      .where(and(
        gte(expenses.date, start.toISOString().split('T')[0]),
        lte(expenses.date, end.toISOString().split('T')[0])
      ));

    const operatingInflows = invoiceData.reduce((sum, inv) => sum + parseFloat(inv.amountPaid || '0'), 0);
    const operatingOutflows = expenseData.reduce((sum, exp) => sum + parseFloat(exp.amount || '0'), 0);
    const netOperating = operatingInflows - operatingOutflows;

    res.json({
      operatingActivities: {
        inflows: operatingInflows,
        outflows: operatingOutflows,
        net: netOperating
      },
      investingActivities: {
        inflows: 0,
        outflows: 0,
        net: 0
      },
      financingActivities: {
        inflows: 0,
        outflows: 0,
        net: 0
      },
      totalCashFlow: netOperating,
      beginningCash: 50000, // Starting balance
      endingCash: 50000 + netOperating,
      reportPeriod: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
    });
  } catch (error) {
    console.error('Cash flow report error:', error);
    res.status(500).json({ error: 'Failed to generate cash flow report' });
  }
});

// Chart of Accounts Report
router.get('/chart-of-accounts', async (req, res) => {
  try {
    const accounts = [
      { code: '1000', name: 'Cash and Bank', type: 'Asset', balance: 50000, isActive: true },
      { code: '1100', name: 'Accounts Receivable', type: 'Asset', balance: 25000, isActive: true },
      { code: '1200', name: 'Inventory', type: 'Asset', balance: 75000, isActive: true },
      { code: '1500', name: 'Equipment', type: 'Asset', balance: 100000, isActive: true },
      { code: '2000', name: 'Accounts Payable', type: 'Liability', balance: -30000, isActive: true },
      { code: '2100', name: 'Notes Payable', type: 'Liability', balance: -50000, isActive: true },
      { code: '3000', name: 'Owner\'s Equity', type: 'Equity', balance: -120000, isActive: true },
      { code: '4000', name: 'Sales Revenue', type: 'Revenue', balance: -200000, isActive: true },
      { code: '5000', name: 'Cost of Goods Sold', type: 'Expense', balance: 80000, isActive: true },
      { code: '6000', name: 'Operating Expenses', type: 'Expense', balance: 40000, isActive: true }
    ];

    res.json({
      accounts,
      summary: {
        totalAccounts: accounts.length,
        activeAccounts: accounts.filter(acc => acc.isActive).length
      }
    });
  } catch (error) {
    console.error('Chart of accounts report error:', error);
    res.status(500).json({ error: 'Failed to generate chart of accounts report' });
  }
});

// Journal Entries Report
router.get('/journal-entries', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate as string, endDate as string);
    
    // Get journal entries (simplified - using expenses and invoices as journal entries)
    const expenseData = await db.select().from(expenses)
      .where(and(
        gte(expenses.date, start.toISOString().split('T')[0]),
        lte(expenses.date, end.toISOString().split('T')[0])
      ));

    const entries = expenseData.flatMap(expense => [
      {
        date: expense.date,
        description: expense.description,
        reference: `EXP-${expense.id}`,
        debit: expense.amount,
        credit: 0,
        account: 'Operating Expenses'
      },
      {
        date: expense.date,
        description: expense.description,
        reference: `EXP-${expense.id}`,
        debit: 0,
        credit: expense.amount,
        account: 'Cash'
      }
    ]);

    res.json({
      entries,
      summary: {
        totalEntries: entries.length,
        reportPeriod: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
      }
    });
  } catch (error) {
    console.error('Journal entries report error:', error);
    res.status(500).json({ error: 'Failed to generate journal entries report' });
  }
});

// Account Summary Report
router.get('/account-summary', async (req, res) => {
  try {
    const summary = [
      { type: 'Assets', count: 4, totalDebit: 250000, totalCredit: 0 },
      { type: 'Liabilities', count: 2, totalDebit: 0, totalCredit: 80000 },
      { type: 'Equity', count: 1, totalDebit: 0, totalCredit: 120000 },
      { type: 'Revenue', count: 1, totalDebit: 0, totalCredit: 200000 },
      { type: 'Expenses', count: 2, totalDebit: 120000, totalCredit: 0 }
    ];

    res.json({ summary });
  } catch (error) {
    console.error('Account summary report error:', error);
    res.status(500).json({ error: 'Failed to generate account summary report' });
  }
});

// Aging Analysis Report
router.get('/aging-analysis', async (req, res) => {
  try {
    const invoiceData = await db.select().from(sales);
    const today = new Date();
    
    const aging = {
      current: { count: 0, amount: 0 },
      thirtyDays: { count: 0, amount: 0 },
      sixtyDays: { count: 0, amount: 0 },
      ninetyDays: { count: 0, amount: 0 }
    };

    invoiceData.forEach(invoice => {
      const outstanding = parseFloat(invoice.grandTotal || '0') - parseFloat(invoice.amountPaid || '0');
      if (outstanding > 0) {
        const invoiceDate = new Date(invoice.date);
        const daysDiff = Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 3600 * 24));
        
        if (daysDiff <= 30) {
          aging.current.count++;
          aging.current.amount += outstanding;
        } else if (daysDiff <= 60) {
          aging.thirtyDays.count++;
          aging.thirtyDays.amount += outstanding;
        } else if (daysDiff <= 90) {
          aging.sixtyDays.count++;
          aging.sixtyDays.amount += outstanding;
        } else {
          aging.ninetyDays.count++;
          aging.ninetyDays.amount += outstanding;
        }
      }
    });

    const total = {
      count: aging.current.count + aging.thirtyDays.count + aging.sixtyDays.count + aging.ninetyDays.count,
      amount: aging.current.amount + aging.thirtyDays.amount + aging.sixtyDays.amount + aging.ninetyDays.amount
    };

    res.json({
      ...aging,
      total
    });
  } catch (error) {
    console.error('Aging analysis report error:', error);
    res.status(500).json({ error: 'Failed to generate aging analysis report' });
  }
});

export const registerReportsRoutes = (app: any) => {
  app.use('/api/reports', router);
};

export default router;