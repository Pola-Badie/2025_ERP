import { Router, Request, Response } from 'express';
import { db } from './db';
import { sql, and, gte, lte } from 'drizzle-orm';

// If you actually use these table objects with Drizzle's query builder, import them.
// For places where we need raw SQL aggregation, we use db.execute(sql`...`).
// Remove or add to match your schema.
import {
  sales,
  expenses,
  purchaseOrders,
} from '../shared/schema';

const router = Router();

// ---------- helpers ----------
const isoDate = (d: Date | string) => {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toISOString().split('T')[0];
};

const getDateRange = (startDate?: string, endDate?: string) => {
  const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
  const end = endDate ? new Date(endDate) : new Date();
  return { start, end };
};

const gradeName = (g: string | null) => {
  if (!g) return 'Other';
  switch (g) {
    case 'P': return 'Pharmaceutical';
    case 'F': return 'Food Grade';
    case 'T': return 'Technical';
    case 'P,F': return 'Pharmaceutical & Food';
    case 'P,T': return 'Pharmaceutical & Technical';
    case 'F,T': return 'Food & Technical';
    case 'P,F,T': return 'Multi-Grade (P,F,T)';
    default: return 'Other';
  }
};

// ---------- Profit & Loss ----------
router.get('/profit-loss', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const { start, end } = getDateRange(startDate, endDate);

    const invs = await db.select().from(sales).where(and(
      sql`DATE(${sales.date}) >= ${isoDate(start)}`,
      sql`DATE(${sales.date}) <= ${isoDate(end)}`
    ));

    const exps = await db.select().from(expenses).where(and(
      gte(expenses.date, isoDate(start)),
      lte(expenses.date, isoDate(end))
    ));

    const toNum = (v: any) => (v == null ? 0 : typeof v === 'number' ? v : parseFloat(String(v)) || 0);

    const totalRevenue = invs.reduce((s, r: any) => s + toNum(r.grandTotal), 0);
    const totalExpenses = exps.reduce((s, r: any) => s + toNum(r.amount), 0);
    const netIncome = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

    res.json({
      revenue: {
        accounts: [
          { name: 'Product Sales', amount: totalRevenue * 0.8 },
          { name: 'Service Revenue', amount: totalRevenue * 0.2 },
        ],
        total: totalRevenue,
      },
      expenses: {
        accounts: exps.map((e: any) => ({ name: e.description ?? 'Expense', amount: toNum(e.amount) })),
        total: totalExpenses,
      },
      netIncome,
      profitMargin,
      reportPeriod: { start: isoDate(start), end: isoDate(end) },
    });
  } catch (err) {
    console.error('Profit & Loss report error:', err);
    res.status(500).json({ error: 'Failed to generate profit & loss report' });
  }
});

// ---------- Balance Sheet ----------
router.get('/balance-sheet', async (req: Request, res: Response) => {
  try {
    const reportDate = (req.query.date as string) ? new Date(String(req.query.date)) : new Date();

    const invs = await db.select().from(sales)
      .where(sql`DATE(${sales.date}) <= ${isoDate(reportDate)}`);

    const exps = await db.select().from(expenses)
      .where(lte(expenses.date, isoDate(reportDate)));

    const pos = await db.select().from(purchaseOrders)
      .where(sql`DATE(${purchaseOrders.orderDate}) <= ${isoDate(reportDate)}`);

    const toNum = (v: any) => (v == null ? 0 : typeof v === 'number' ? v : parseFloat(String(v)) || 0);

    const totalCash = invs.reduce((s, r: any) => s + toNum(r.amountPaid), 0) - exps.reduce((s, r: any) => s + toNum(r.amount), 0);
    const totalReceivables = invs.reduce((s, r: any) => s + (toNum(r.grandTotal) - toNum(r.amountPaid)), 0);
    const purchasesTotal = pos.reduce((s, r: any) => s + toNum(r.totalAmount), 0);
    const totalInventory = purchasesTotal * 0.7; // heuristic
    const totalAssets = totalCash + totalReceivables + totalInventory;

    const totalPayables = purchasesTotal * 0.3; // heuristic
    const totalLiabilities = totalPayables;
    const totalEquity = totalAssets - totalLiabilities;

    res.json({
      assets: {
        accounts: [
          { name: 'Cash and Cash Equivalents', amount: totalCash },
          { name: 'Accounts Receivable', amount: totalReceivables },
          { name: 'Inventory', amount: totalInventory },
        ],
        total: totalAssets,
      },
      liabilities: { accounts: [{ name: 'Accounts Payable', amount: totalPayables }], total: totalLiabilities },
      equity: { accounts: [{ name: 'Retained Earnings', amount: totalEquity }], total: totalEquity },
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
      reportDate: isoDate(reportDate),
    });
  } catch (err) {
    console.error('Balance sheet report error:', err);
    res.status(500).json({ error: 'Failed to generate balance sheet report' });
  }
});

// ---------- Cash Flow ----------
router.get('/cash-flow', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const { start, end } = getDateRange(startDate, endDate);

    const invs = await db.select().from(sales).where(and(
      sql`DATE(${sales.date}) >= ${isoDate(start)}`,
      sql`DATE(${sales.date}) <= ${isoDate(end)}`
    ));

    const exps = await db.select().from(expenses).where(and(
      gte(expenses.date, isoDate(start)),
      lte(expenses.date, isoDate(end))
    ));

    const toNum = (v: any) => (v == null ? 0 : typeof v === 'number' ? v : parseFloat(String(v)) || 0);

    const operatingInflows = invs.reduce((s, r: any) => s + toNum(r.amountPaid), 0);
    const operatingOutflows = exps.reduce((s, r: any) => s + toNum(r.amount), 0);
    const netOperating = operatingInflows - operatingOutflows;

    res.json({
      operatingActivities: { inflows: operatingInflows, outflows: operatingOutflows, net: netOperating },
      investingActivities: { inflows: 0, outflows: 0, net: 0 },
      financingActivities: { inflows: 0, outflows: 0, net: 0 },
      totalCashFlow: netOperating,
      beginningCash: 50000,
      endingCash: 50000 + netOperating,
      reportPeriod: { start: isoDate(start), end: isoDate(end) },
    });
  } catch (err) {
    console.error('Cash flow report error:', err);
    res.status(500).json({ error: 'Failed to generate cash flow report' });
  }
});

// ---------- Chart of Accounts (static demo) ----------
router.get('/chart-of-accounts', async (_req: Request, res: Response) => {
  try {
    const accounts = [
      { code: '1000', name: 'Cash and Bank', type: 'Asset', balance: 50000, isActive: true },
      { code: '1100', name: 'Accounts Receivable', type: 'Asset', balance: 25000, isActive: true },
      { code: '1200', name: 'Inventory', type: 'Asset', balance: 75000, isActive: true },
      { code: '1500', name: 'Equipment', type: 'Asset', balance: 100000, isActive: true },
      { code: '2000', name: 'Accounts Payable', type: 'Liability', balance: -30000, isActive: true },
      { code: '2100', name: 'Notes Payable', type: 'Liability', balance: -50000, isActive: true },
      { code: '3000', name: "Owner's Equity", type: 'Equity', balance: -120000, isActive: true },
      { code: '4000', name: 'Sales Revenue', type: 'Revenue', balance: -200000, isActive: true },
      { code: '5000', name: 'Cost of Goods Sold', type: 'Expense', balance: 80000, isActive: true },
      { code: '6000', name: 'Operating Expenses', type: 'Expense', balance: 40000, isActive: true },
    ];

    res.json({
      accounts,
      summary: { totalAccounts: accounts.length, activeAccounts: accounts.filter(a => a.isActive).length },
    });
  } catch (err) {
    console.error('Chart of accounts report error:', err);
    res.status(500).json({ error: 'Failed to generate chart of accounts report' });
  }
});

// ---------- Journal Entries (derived from expenses) ----------
router.get('/journal-entries', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const { start, end } = getDateRange(startDate, endDate);

    const exps = await db.select().from(expenses).where(and(
      gte(expenses.date, isoDate(start)),
      lte(expenses.date, isoDate(end))
    ));

    const toNum = (v: any) => (v == null ? 0 : typeof v === 'number' ? v : parseFloat(String(v)) || 0);

    const entries = exps.flatMap((e: any) => ([
      { date: e.date, description: e.description, reference: `EXP-${e.id}`, debit: toNum(e.amount), credit: 0, account: 'Operating Expenses' },
      { date: e.date, description: e.description, reference: `EXP-${e.id}`, debit: 0, credit: toNum(e.amount), account: 'Cash' },
    ]));

    res.json({ entries, summary: { totalEntries: entries.length, reportPeriod: { start: isoDate(start), end: isoDate(end) } } });
  } catch (err) {
    console.error('Journal entries report error:', err);
    res.status(500).json({ error: 'Failed to generate journal entries report' });
  }
});

// ---------- Aging Analysis (AR) ----------
router.get('/aging-analysis', async (_req: Request, res: Response) => {
  try {
    const invs = await db.select().from(sales);
    const today = new Date();
    const toNum = (v: any) => (v == null ? 0 : typeof v === 'number' ? v : parseFloat(String(v)) || 0);

    const aging = {
      current: { count: 0, amount: 0 },
      thirtyDays: { count: 0, amount: 0 },
      sixtyDays: { count: 0, amount: 0 },
      ninetyDays: { count: 0, amount: 0 },
    } as const;

    const buckets = JSON.parse(JSON.stringify(aging)) as Record<string, { count: number; amount: number }>; // simple clone

    (invs as any[]).forEach((inv) => {
      const outstanding = toNum(inv.grandTotal) - toNum(inv.amountPaid);
      if (outstanding > 0) {
        const days = Math.floor((today.getTime() - new Date(inv.date).getTime()) / 86400000);
        if (days <= 30) { buckets.current.count++; buckets.current.amount += outstanding; }
        else if (days <= 60) { buckets.thirtyDays.count++; buckets.thirtyDays.amount += outstanding; }
        else if (days <= 90) { buckets.sixtyDays.count++; buckets.sixtyDays.amount += outstanding; }
        else { buckets.ninetyDays.count++; buckets.ninetyDays.amount += outstanding; }
      }
    });

    const total = {
      count: buckets.current.count + buckets.thirtyDays.count + buckets.sixtyDays.count + buckets.ninetyDays.count,
      amount: buckets.current.amount + buckets.thirtyDays.amount + buckets.sixtyDays.amount + buckets.ninetyDays.amount,
    };

    res.json({ ...buckets, total });
  } catch (err) {
    console.error('Aging analysis report error:', err);
    res.status(500).json({ error: 'Failed to generate aging analysis report' });
  }
});

// ---------- Sales Analysis ----------
router.get('/sales-analysis', async (req: Request, res: Response) => {
  try {
    const { month } = req.query as { month?: string };
    let startDateStr: string; let endDateStr: string;
    if (month) {
      const [y, m] = month.split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      startDateStr = isoDate(start); endDateStr = isoDate(end);
    } else {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth() - 5, 1);
      startDateStr = isoDate(start); endDateStr = isoDate(end);
    }

    const salesData = await db.execute(sql`
      SELECT 
        DATE_TRUNC('month', si.invoice_date) as month,
        SUM(si.total_amount)::numeric as revenue,
        COUNT(DISTINCT si.id) as transactions,
        COUNT(DISTINCT si.customer_id) as unique_customers,
        AVG(si.total_amount)::numeric as avg_order_value
      FROM sales_invoices si
      WHERE si.invoice_date BETWEEN ${startDateStr} AND ${endDateStr}
      GROUP BY DATE_TRUNC('month', si.invoice_date)
      ORDER BY month DESC
      LIMIT 6
    `);

    const categoryData = await db.execute(sql`
      SELECT 
        sil.grade,
        COUNT(*) as count,
        SUM(sil.line_total)::numeric as total
      FROM sales_invoice_lines sil
      JOIN sales_invoices si ON sil.invoice_id = si.id
      WHERE si.invoice_date BETWEEN ${startDateStr} AND ${endDateStr}
      GROUP BY sil.grade
    `);

    const topProducts = await db.execute(sql`
      SELECT 
        sil.product_name,
        sil.grade,
        SUM(sil.quantity) as total_quantity,
        SUM(sil.line_total)::numeric as total_revenue
      FROM sales_invoice_lines sil
      JOIN sales_invoices si ON sil.invoice_id = si.id
      WHERE si.invoice_date BETWEEN ${startDateStr} AND ${endDateStr}
      GROUP BY sil.product_name, sil.grade
      ORDER BY total_revenue DESC
      LIMIT 10
    `);

    const toFloat = (v: any) => (v == null ? 0 : parseFloat(String(v)) || 0);

    res.json({
      summary: {
        totalSales: salesData.rows.reduce((a: number, r: any) => a + toFloat(r.revenue), 0),
        totalTransactions: salesData.rows.reduce((a: number, r: any) => a + parseInt(String(r.transactions || 0)), 0),
        avgOrderValue: salesData.rows.length
          ? salesData.rows.reduce((a: number, r: any) => a + toFloat(r.avg_order_value), 0) / salesData.rows.length
          : 0,
        topCategory: categoryData.rows.length
          ? (categoryData.rows.reduce((p: any, c: any) => (toFloat(p.total) > toFloat(c.total) ? p : c)).grade ?? 'N/A')
          : 'N/A',
      },
      monthlyData: salesData.rows.map((r: any) => ({
        month: new Date(r.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: toFloat(r.revenue),
        transactions: parseInt(String(r.transactions || 0)),
        avgOrderValue: toFloat(r.avg_order_value),
      })),
      categoryBreakdown: categoryData.rows.map((r: any) => ({
        grade: gradeName(r.grade),
        count: parseInt(String(r.count || 0)),
        revenue: toFloat(r.total),
      })),
      topProducts: topProducts.rows.map((r: any) => ({
        name: r.product_name,
        grade: r.grade,
        quantity: parseInt(String(r.total_quantity || 0)),
        revenue: toFloat(r.total_revenue),
      })),
    });
  } catch (err) {
    console.error('Sales analysis report error:', err);
    res.status(500).json({ error: 'Failed to generate sales analysis report' });
  }
});

// ---------- Inventory Analysis ----------
router.get('/inventory-analysis', async (_req: Request, res: Response) => {
  try {
    const inventoryLevels = await db.execute(sql`
      SELECT 
        p.id, p.name, p.drug_name, p.sku, p.quantity, p.cost_price, p.selling_price,
        (p.quantity * p.cost_price)::numeric as total_value,
        CASE 
          WHEN p.quantity = 0 THEN 'Out of Stock'
          WHEN p.quantity <= COALESCE(p.low_stock_threshold, 10) THEN 'Low Stock'
          ELSE 'In Stock'
        END as status
      FROM products p
      ORDER BY (p.quantity * p.cost_price) DESC
    `);

    const turnoverData = await db.execute(sql`
      SELECT 
        sil.product_id, p.name,
        SUM(sil.quantity) as units_sold,
        p.quantity as current_stock,
        CASE WHEN p.quantity > 0 THEN (SUM(sil.quantity)::float / p.quantity) ELSE 0 END as turnover_ratio
      FROM sales_invoice_lines sil
      JOIN products p ON sil.product_id = p.id
      JOIN sales_invoices si ON sil.invoice_id = si.id
      WHERE si.invoice_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY sil.product_id, p.name, p.quantity
      ORDER BY turnover_ratio DESC
    `);

    const stockMovement = await db.execute(sql`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(CASE WHEN type = 'in' THEN 1 END) as inbound,
        COUNT(CASE WHEN type = 'out' THEN 1 END) as outbound,
        SUM(CASE WHEN type = 'in' THEN quantity ELSE 0 END) as inbound_qty,
        SUM(CASE WHEN type = 'out' THEN quantity ELSE 0 END) as outbound_qty
      FROM inventory_transactions
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `);

    const toFloat = (v: any) => (v == null ? 0 : parseFloat(String(v)) || 0);

    const totalValue = inventoryLevels.rows.reduce((a: number, r: any) => a + toFloat(r.total_value), 0);
    const lowStock = inventoryLevels.rows.filter((r: any) => r.status === 'Low Stock').length;
    const oos = inventoryLevels.rows.filter((r: any) => r.status === 'Out of Stock').length;

    res.json({
      summary: {
        totalProducts: inventoryLevels.rows.length,
        totalValue,
        lowStockItems: lowStock,
        outOfStockItems: oos,
        avgTurnoverRatio: turnoverData.rows.length
          ? turnoverData.rows.reduce((a: number, r: any) => a + toFloat(r.turnover_ratio), 0) / turnoverData.rows.length
          : 0,
      },
      stockLevels: inventoryLevels.rows.slice(0, 20).map((r: any) => ({
        id: r.id, name: r.name, sku: r.sku, quantity: r.quantity, value: toFloat(r.total_value), status: r.status,
      })),
      topMovers: turnoverData.rows.slice(0, 10).map((r: any) => ({
        productId: r.product_id, name: r.name, unitsSold: parseInt(String(r.units_sold || 0)), currentStock: r.current_stock,
        turnoverRatio: toFloat(r.turnover_ratio),
      })),
      stockTrends: stockMovement.rows.map((r: any) => ({
        month: new Date(r.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        inbound: parseInt(String(r.inbound || 0)),
        outbound: parseInt(String(r.outbound || 0)),
        inboundQty: parseInt(String(r.inbound_qty || 0)),
        outboundQty: parseInt(String(r.outbound_qty || 0)),
      })),
    });
  } catch (err) {
    console.error('Inventory analysis report error:', err);
    res.status(500).json({ error: 'Failed to generate inventory analysis report' });
  }
});

// ---------- Production Analysis ----------
router.get('/production-analysis', async (req: Request, res: Response) => {
  try {
    const { month } = req.query as { month?: string };
    let startDateStr: string; let endDateStr: string;
    if (month) {
      const [y, m] = month.split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      startDateStr = isoDate(start); endDateStr = isoDate(end);
    } else {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth() - 5, 1);
      startDateStr = isoDate(start); endDateStr = isoDate(end);
    }

    const productionMetrics = await db.execute(sql`
      SELECT 
        COUNT(*) as total_orders,
        SUM(quantity_ordered) as total_ordered,
        SUM(quantity_produced) as total_produced,
        AVG(efficiency_percentage)::numeric as avg_efficiency,
        AVG(quality_score)::numeric as avg_quality,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_orders
      FROM production_orders
      WHERE start_date BETWEEN ${startDateStr} AND ${endDateStr}
    `);

    const gradeBreakdown = await db.execute(sql`
      SELECT 
        grade,
        COUNT(*) as order_count,
        SUM(quantity_produced) as total_produced,
        AVG(efficiency_percentage)::numeric as avg_efficiency,
        AVG(quality_score)::numeric as avg_quality
      FROM production_orders
      WHERE start_date BETWEEN ${startDateStr} AND ${endDateStr} AND status = 'completed'
      GROUP BY grade
    `);

    const costAnalysis = await db.execute(sql`
      SELECT 
        pc.cost_type,
        COUNT(*) as count,
        SUM(pc.amount)::numeric as total_amount,
        AVG(pc.amount)::numeric as avg_amount
      FROM production_costs pc
      JOIN production_orders po ON pc.production_order_id = po.id
      WHERE po.start_date BETWEEN ${startDateStr} AND ${endDateStr}
      GROUP BY pc.cost_type
    `);

    const monthlyTrends = await db.execute(sql`
      SELECT 
        DATE_TRUNC('month', start_date) as month,
        COUNT(*) as orders,
        SUM(quantity_produced) as produced,
        AVG(efficiency_percentage)::numeric as efficiency,
        AVG(quality_score)::numeric as quality
      FROM production_orders
      WHERE start_date BETWEEN ${startDateStr} AND ${endDateStr} AND status = 'completed'
      GROUP BY DATE_TRUNC('month', start_date)
      ORDER BY month DESC
      LIMIT 6
    `);

    const m = productionMetrics.rows[0] || {};
    const toFloat = (v: any) => (v == null ? 0 : parseFloat(String(v)) || 0);
    const totalCosts = costAnalysis.rows.reduce((a: number, r: any) => a + toFloat(r.total_amount), 0);

    res.json({
      summary: {
        totalOrders: parseInt(String(m.total_orders || 0)),
        totalProduced: parseInt(String(m.total_produced || 0)),
        avgEfficiency: toFloat(m.avg_efficiency),
        avgQuality: toFloat(m.avg_quality),
        completionRate: parseInt(String(m.total_orders || 0)) > 0
          ? (parseInt(String(m.completed_orders || 0)) / parseInt(String(m.total_orders || 1))) * 100
          : 0,
        totalCosts,
      },
      gradeBreakdown: gradeBreakdown.rows.map((r: any) => ({
        grade: gradeName(r.grade),
        orderCount: parseInt(String(r.order_count || 0)),
        totalProduced: parseInt(String(r.total_produced || 0)),
        avgEfficiency: toFloat(r.avg_efficiency),
        avgQuality: toFloat(r.avg_quality),
      })),
      costBreakdown: costAnalysis.rows.map((r: any) => ({
        type: r.cost_type,
        count: parseInt(String(r.count || 0)),
        totalAmount: toFloat(r.total_amount),
        avgAmount: toFloat(r.avg_amount),
      })),
      monthlyTrends: monthlyTrends.rows.map((r: any) => ({
        month: new Date(r.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        orders: parseInt(String(r.orders || 0)),
        produced: parseInt(String(r.produced || 0)),
        efficiency: toFloat(r.efficiency),
        quality: toFloat(r.quality),
      })),
    });
  } catch (err) {
    console.error('Production analysis report error:', err);
    res.status(500).json({ error: 'Failed to generate production analysis report' });
  }
});

// ---------- Top Customers ----------
router.get('/top-customers', async (req: Request, res: Response) => {
  try {
    const { month } = req.query as { month?: string };
    let startDateStr: string; let endDateStr: string;
    if (month) {
      const [y, m] = month.split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      startDateStr = isoDate(start); endDateStr = isoDate(end);
    } else {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth() - 5, 1);
      startDateStr = isoDate(start); endDateStr = isoDate(end);
    }

    const topCustomers = await db.execute(sql`
      SELECT 
        c.id, c.name, c.company, c.email,
        COUNT(DISTINCT si.id) as order_count,
        SUM(si.total_amount)::numeric as total_revenue,
        AVG(si.total_amount)::numeric as avg_order_value,
        MAX(si.invoice_date) as last_order_date
      FROM sales_invoices si
      JOIN customers c ON si.customer_id = c.id
      WHERE si.invoice_date BETWEEN ${startDateStr} AND ${endDateStr}
      GROUP BY c.id, c.name, c.company, c.email
      ORDER BY total_revenue DESC
      LIMIT 20
    `);

    const segmentation = await db.execute(sql`
      WITH customer_totals AS (
        SELECT customer_id, SUM(total_amount)::numeric as total_spent
        FROM sales_invoices
        WHERE invoice_date BETWEEN ${startDateStr} AND ${endDateStr}
        GROUP BY customer_id
      )
      SELECT 
        CASE 
          WHEN total_spent >= 10000 THEN 'Premium'
          WHEN total_spent >= 5000 THEN 'Gold'
          WHEN total_spent >= 1000 THEN 'Silver'
          ELSE 'Bronze'
        END as segment,
        COUNT(*) as customer_count,
        SUM(total_spent)::numeric as segment_revenue
      FROM customer_totals
      GROUP BY segment
    `);

    const customerGrowth = await db.execute(sql`
      SELECT 
        DATE_TRUNC('month', si.invoice_date) as month,
        COUNT(DISTINCT si.customer_id) as active_customers,
        SUM(si.total_amount)::numeric as monthly_revenue
      FROM sales_invoices si
      WHERE si.invoice_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', si.invoice_date)
      ORDER BY month DESC
    `);

    const toFloat = (v: any) => (v == null ? 0 : parseFloat(String(v)) || 0);
    const totalRevenue = topCustomers.rows.reduce((a: number, r: any) => a + toFloat(r.total_revenue), 0);

    res.json({
      summary: {
        totalCustomers: topCustomers.rows.length,
        totalRevenue,
        avgCustomerValue: topCustomers.rows.length ? totalRevenue / topCustomers.rows.length : 0,
        topSegment: segmentation.rows.length
          ? (segmentation.rows.reduce((p: any, c: any) => (toFloat(p.segment_revenue) > toFloat(c.segment_revenue) ? p : c)).segment)
          : 'N/A',
      },
      topCustomers: topCustomers.rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        company: r.company || '',
        email: r.email,
        orderCount: parseInt(String(r.order_count || 0)),
        totalRevenue: toFloat(r.total_revenue),
        avgOrderValue: toFloat(r.avg_order_value),
        lastOrderDate: r.last_order_date,
      })),
      segmentation: segmentation.rows.map((r: any) => ({
        segment: r.segment,
        customerCount: parseInt(String(r.customer_count || 0)),
        revenue: toFloat(r.segment_revenue),
      })),
      customerGrowth: customerGrowth.rows.map((r: any) => ({
        month: new Date(r.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        activeCustomers: parseInt(String(r.active_customers || 0)),
        monthlyRevenue: toFloat(r.monthly_revenue),
      })),
    });
  } catch (err) {
    console.error('Top customers report error:', err);
    res.status(500).json({ error: 'Failed to generate top customers report' });
  }
});

// ---------- Finance Breakdown ----------
router.get('/finance-breakdown', async (req: Request, res: Response) => {
  try {
    const { month } = req.query as { month?: string };
    let startDateStr: string; let endDateStr: string;
    if (month) {
      const [y, m] = month.split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      startDateStr = isoDate(start); endDateStr = isoDate(end);
    } else {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth() - 5, 1);
      startDateStr = isoDate(start); endDateStr = isoDate(end);
    }

    const revenueBreakdown = await db.execute(sql`
      SELECT 
        sil.grade,
        COUNT(DISTINCT si.id) as invoice_count,
        SUM(sil.line_total)::numeric as total_revenue
      FROM sales_invoice_lines sil
      JOIN sales_invoices si ON sil.invoice_id = si.id
      WHERE si.invoice_date BETWEEN ${startDateStr} AND ${endDateStr}
      GROUP BY sil.grade
    `);

    const expenseBreakdown = await db.execute(sql`
      SELECT category, COUNT(*) as expense_count, SUM(amount)::numeric as total_amount
      FROM expenses
      WHERE date BETWEEN ${startDateStr} AND ${endDateStr}
      GROUP BY category
    `);

    const cashFlow = await db.execute(sql`
      WITH monthly_data AS (
        SELECT DATE_TRUNC('month', invoice_date) as month, SUM(total_amount)::numeric as revenue, 0::numeric as expenses
        FROM sales_invoices
        WHERE invoice_date BETWEEN ${startDateStr} AND ${endDateStr}
        GROUP BY DATE_TRUNC('month', invoice_date)
        UNION ALL
        SELECT DATE_TRUNC('month', date) as month, 0::numeric as revenue, SUM(amount)::numeric as expenses
        FROM expenses
        WHERE date BETWEEN ${startDateStr} AND ${endDateStr}
        GROUP BY DATE_TRUNC('month', date)
      )
      SELECT month, SUM(revenue) as total_revenue, SUM(expenses) as total_expenses, SUM(revenue) - SUM(expenses) as net_cash_flow
      FROM monthly_data
      GROUP BY month
      ORDER BY month DESC
    `);

    const toFloat = (v: any) => (v == null ? 0 : parseFloat(String(v)) || 0);
    const totalRevenue = revenueBreakdown.rows.reduce((a: number, r: any) => a + toFloat(r.total_revenue), 0);
    const totalExpenses = expenseBreakdown.rows.reduce((a: number, r: any) => a + toFloat(r.total_amount), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    res.json({
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        cashPosition: netProfit, // simplified
      },
      revenueBreakdown: revenueBreakdown.rows.map((r: any) => ({
        category: gradeName(r.grade),
        invoiceCount: parseInt(String(r.invoice_count || 0)),
        revenue: toFloat(r.total_revenue),
      })),
      expenseBreakdown: expenseBreakdown.rows.map((r: any) => ({
        category: r.category || 'Uncategorized',
        count: parseInt(String(r.expense_count || 0)),
        amount: toFloat(r.total_amount),
      })),
      cashFlow: cashFlow.rows.map((r: any) => ({
        month: new Date(r.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: toFloat(r.total_revenue),
        expenses: toFloat(r.total_expenses),
        netCashFlow: toFloat(r.net_cash_flow),
      })),
    });
  } catch (err) {
    console.error('Finance breakdown report error:', err);
    res.status(500).json({ error: 'Failed to generate finance breakdown report' });
  }
});

// ---------- Dashboard Analytics (comprehensive) ----------
router.get('/dashboard-analytics', async (_req: Request, res: Response) => {
  try {
    // Sales analytics (last 12 months)
    const salesData = await db.execute(sql`
      SELECT 
        TO_CHAR(s.date, 'YYYY-MM') as month,
        COUNT(s.id) as total_sales,
        SUM(CAST(s.grand_total AS NUMERIC)) as total_revenue,
        AVG(CAST(s.grand_total AS NUMERIC)) as avg_order_value,
        COUNT(DISTINCT s.customer_id) as unique_customers
      FROM sales s
      WHERE s.date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(s.date, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `);

    // Customer performance by grade
    const customerGrades = await db.execute(sql`
      SELECT 
        p.grade,
        COUNT(DISTINCT s.customer_id) as customer_count,
        COUNT(s.id) as total_orders,
        SUM(CAST(s.grand_total AS NUMERIC)) as total_revenue,
        AVG(CAST(s.grand_total AS NUMERIC)) as avg_order_value,
        CASE 
          WHEN p.grade = 'P' THEN 'Pharmaceutical'
          WHEN p.grade = 'F' THEN 'Food Grade'
          WHEN p.grade = 'T' THEN 'Technical'
          WHEN p.grade = 'P,F' THEN 'Pharmaceutical & Food'
          WHEN p.grade = 'P,T' THEN 'Pharmaceutical & Technical'
          WHEN p.grade = 'F,T' THEN 'Food & Technical'
          WHEN p.grade = 'P,F,T' THEN 'Multi-Grade (P,F,T)'
          ELSE 'Other Grade'
        END as grade_name
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      WHERE s.date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY p.grade
      ORDER BY total_revenue DESC
    `);

    // Most sold items (only products with actual sales)
    const productionData = await db.execute(sql`
      SELECT 
        p.id, p.name, p.drug_name, p.grade,
        SUM(si.quantity) as total_sold,
        COUNT(DISTINCT s.id) as order_frequency,
        SUM(CAST(si.total AS NUMERIC)) as total_revenue,
        COALESCE(pc.name, 'Uncategorized') as category_name
      FROM products p
      JOIN sale_items si ON p.id = si.product_id
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE s.date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY p.id, p.name, p.drug_name, p.grade, pc.name
      HAVING SUM(si.quantity) > 0
      ORDER BY total_sold DESC
      LIMIT 10
    `);

    // Quotation conversions
    const quotationConversions = await db.execute(sql`
      WITH quotation_stats AS (
        SELECT 
          COUNT(*) as total_quotations,
          COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_quotations,
          SUM(CAST(grand_total AS NUMERIC)) as total_quotation_value,
          SUM(CASE WHEN status = 'converted' THEN CAST(grand_total AS NUMERIC) ELSE 0 END) as converted_value
        FROM quotations
        WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      ),
      monthly_conversions AS (
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          COUNT(*) as quotes_created,
          COUNT(CASE WHEN status = 'converted' THEN 1 END) as quotes_converted,
          ROUND((COUNT(CASE WHEN status = 'converted' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2) as conversion_rate
        FROM quotations
        WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month DESC
      )
      SELECT 
        qs.*, ROUND((qs.converted_quotations::NUMERIC / NULLIF(qs.total_quotations, 0) * 100), 2) as overall_conversion_rate,
        json_agg(mc.*) as monthly_data
      FROM quotation_stats qs, monthly_conversions mc
      GROUP BY qs.total_quotations, qs.converted_quotations, qs.total_quotation_value, qs.converted_value
    `);

    // Inventory analytics (real-time)
    const inventoryAnalytics = await db.execute(sql`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN quantity <= COALESCE(low_stock_threshold, 10) AND quantity > 0 THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock_count,
        COUNT(CASE WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND expiry_date > CURRENT_DATE THEN 1 END) as expiring_soon_count,
        COUNT(CASE WHEN expiry_date <= CURRENT_DATE THEN 1 END) as expired_count,
        COALESCE(SUM(CAST(cost_price AS NUMERIC) * quantity), 0) as total_inventory_cost,
        COALESCE(SUM(CAST(selling_price AS NUMERIC) * quantity), 0) as total_inventory_value,
        COALESCE(SUM(quantity), 0) as total_stock_units,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
        COUNT(DISTINCT COALESCE(location, 'Unknown Location')) as warehouse_locations
      FROM products
    `);

    // Top customers by revenue
    const topCustomers = await db.execute(sql`
      SELECT 
        c.id, c.name, c.company,
        COUNT(s.id) as total_orders,
        SUM(CAST(s.grand_total AS NUMERIC)) as total_revenue,
        AVG(CAST(s.grand_total AS NUMERIC)) as avg_order_value,
        MAX(s.date) as last_order_date
      FROM customers c
      JOIN sales s ON c.id = s.customer_id
      WHERE s.date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY c.id, c.name, c.company
      ORDER BY total_revenue DESC
      LIMIT 10
    `);

    // Financial summary
    const financialSummary = await db.execute(sql`
      SELECT 
        SUM(CAST(grand_total AS NUMERIC)) as total_revenue,
        COUNT(*) as total_sales,
        AVG(CAST(grand_total AS NUMERIC)) as avg_sale_value,
        SUM(CAST(amount_paid AS NUMERIC)) as total_paid,
        SUM(CAST(grand_total AS NUMERIC) - CAST(amount_paid AS NUMERIC)) as outstanding_ar
      FROM sales
      WHERE date >= CURRENT_DATE - INTERVAL '12 months'
    `);

    res.json({
      salesAnalytics: {
        monthlySales: salesData.rows.map((r: any) => ({
          month: r.month,
          totalSales: parseInt(String(r.total_sales || 0)),
          totalRevenue: parseFloat(String(r.total_revenue || 0)),
          avgOrderValue: parseFloat(String(r.avg_order_value || 0)),
          uniqueCustomers: parseInt(String(r.unique_customers || 0)),
        })),
        summary: {
          totalRevenue: parseFloat(String(financialSummary.rows[0]?.total_revenue || '0')),
          totalSales: parseInt(String(financialSummary.rows[0]?.total_sales || '0')),
          avgSaleValue: parseFloat(String(financialSummary.rows[0]?.avg_sale_value || '0')),
          outstandingAR: parseFloat(String(financialSummary.rows[0]?.outstanding_ar || '0')),
        },
      },
      customerGrades: customerGrades.rows.map((r: any) => ({
        grade: r.grade,
        gradeName: r.grade_name,
        customerCount: parseInt(String(r.customer_count || 0)),
        totalOrders: parseInt(String(r.total_orders || 0)),
        totalRevenue: parseFloat(String(r.total_revenue || 0)),
        avgOrderValue: parseFloat(String(r.avg_order_value || 0)),
      })),
      productionData: productionData.rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        drugName: r.drug_name,
        grade: r.grade,
        categoryName: r.category_name,
        totalSold: parseInt(String(r.total_sold || 0)),
        orderFrequency: parseInt(String(r.order_frequency || 0)),
        totalRevenue: parseFloat(String(r.total_revenue || 0)),
      })),
      quotationConversions: {
        totalQuotations: parseInt(String(quotationConversions.rows[0]?.total_quotations || '0')),
        convertedQuotations: parseInt(String(quotationConversions.rows[0]?.converted_quotations || '0')),
        overallConversionRate: parseFloat(String(quotationConversions.rows[0]?.overall_conversion_rate || '0')),
        totalQuotationValue: parseFloat(String(quotationConversions.rows[0]?.total_quotation_value || '0')),
        convertedValue: parseFloat(String(quotationConversions.rows[0]?.converted_value || '0')),
        monthlyData: quotationConversions.rows[0]?.monthly_data || [],
      },
      inventoryAnalytics: {
        totalProducts: parseInt(String(inventoryAnalytics.rows[0]?.total_products || '0')),
        lowStockCount: parseInt(String(inventoryAnalytics.rows[0]?.low_stock_count || '0')),
        outOfStockCount: parseInt(String(inventoryAnalytics.rows[0]?.out_of_stock_count || '0')),
        expiringSoonCount: parseInt(String(inventoryAnalytics.rows[0]?.expiring_soon_count || '0')),
        expiredCount: parseInt(String(inventoryAnalytics.rows[0]?.expired_count || '0')),
        totalInventoryCost: parseFloat(String(inventoryAnalytics.rows[0]?.total_inventory_cost || '0')),
        totalInventoryValue: parseFloat(String(inventoryAnalytics.rows[0]?.total_inventory_value || '0')),
        totalStockUnits: parseInt(String(inventoryAnalytics.rows[0]?.total_stock_units || '0')),
        activeProducts: parseInt(String(inventoryAnalytics.rows[0]?.active_products || '0')),
        warehouseLocations: parseInt(String(inventoryAnalytics.rows[0]?.warehouse_locations || '0')),
      },
      topCustomers: topCustomers.rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        company: r.company || '',
        totalOrders: parseInt(String(r.total_orders || 0)),
        totalRevenue: parseFloat(String(r.total_revenue || 0)),
        avgOrderValue: parseFloat(String(r.avg_order_value || 0)),
        lastOrderDate: r.last_order_date,
      })),
    });
  } catch (err) {
    console.error('Comprehensive reports dashboard error:', err);
    res.status(500).json({ error: 'Failed to generate comprehensive reports dashboard', details: err instanceof Error ? err.message : 'Unknown error' });
  }
});

export const registerReportsRoutes = (app: any) => {
  app.use('/api/reports', router);
};

export default router;
