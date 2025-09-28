import { db } from './db';
import { accounts, journalEntries, journalEntryLines, sales, expenses } from '@shared/schema';
import { eq, sql, and, gte, lte, desc } from 'drizzle-orm';
export function registerFinancialReportsRoutes(app) {
    // Trial Balance Report
    app.get('/api/reports/trial-balance', async (req, res) => {
        try {
            const { startDate, endDate, accountFilter } = req.query;
            // Build the base query with proper date filtering
            let query = db
                .select({
                id: accounts.id,
                code: accounts.code,
                name: accounts.name,
                type: accounts.type,
                debitTotal: sql `COALESCE(SUM(${journalEntryLines.debit}), 0)`,
                creditTotal: sql `COALESCE(SUM(${journalEntryLines.credit}), 0)`
            })
                .from(accounts)
                .leftJoin(journalEntryLines, eq(accounts.id, journalEntryLines.accountId))
                .leftJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id));
            // Apply date filtering if provided
            if (startDate && endDate) {
                query = query.where(and(gte(journalEntries.date, startDate), lte(journalEntries.date, endDate)));
            }
            const accountsData = await query.groupBy(accounts.id, accounts.code, accounts.name, accounts.type);
            // Filter by account type if specified
            let filteredAccounts = accountsData;
            if (accountFilter && accountFilter !== 'all') {
                filteredAccounts = accountsData.filter(acc => acc.type.toLowerCase() === accountFilter.toLowerCase());
            }
            // Calculate totals with proper null handling
            const totalDebits = filteredAccounts.reduce((sum, acc) => {
                const debit = Number(acc.debitTotal) || 0;
                return sum + debit;
            }, 0);
            const totalCredits = filteredAccounts.reduce((sum, acc) => {
                const credit = Number(acc.creditTotal) || 0;
                return sum + credit;
            }, 0);
            res.json({
                accounts: filteredAccounts.map(acc => ({
                    code: acc.code,
                    name: acc.name,
                    type: acc.type,
                    debit: Number(acc.debitTotal) || 0,
                    credit: Number(acc.creditTotal) || 0
                })),
                totalDebits,
                totalCredits,
                isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
            });
        }
        catch (error) {
            console.error('Error generating trial balance:', error);
            res.status(500).json({ message: 'Failed to generate trial balance' });
        }
    });
    // Profit & Loss Statement
    app.get('/api/reports/profit-loss', async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            // Get REAL revenue data from sales table
            const salesData = await db.select().from(sales)
                .where(startDate && endDate ? and(gte(sales.date, new Date(startDate)), lte(sales.date, new Date(endDate))) : undefined);
            const totalRevenue = salesData.reduce((sum, sale) => {
                const amount = parseFloat(sale.grandTotal || '0');
                return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
            // Get REAL expense data from expenses table  
            const expensesData = await db.select().from(expenses)
                .where(startDate && endDate ? and(gte(expenses.date, startDate), lte(expenses.date, endDate)) : undefined);
            const totalExpenses = expensesData.reduce((sum, expense) => {
                const amount = parseFloat(expense.amount || '0');
                return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
            // Group expenses by category
            const expensesByCategory = {};
            for (const expense of expensesData) {
                const category = expense.description || 'Other';
                const amount = parseFloat(expense.amount?.toString() || '0');
                if (!isNaN(amount)) {
                    if (!expensesByCategory[category]) {
                        expensesByCategory[category] = 0;
                    }
                    expensesByCategory[category] += amount;
                }
            }
            const netIncome = totalRevenue - totalExpenses;
            res.json({
                revenue: {
                    accounts: [
                        {
                            code: '4000',
                            name: 'Sales Revenue',
                            amount: totalRevenue
                        }
                    ],
                    total: totalRevenue
                },
                expenses: {
                    accounts: Object.entries(expensesByCategory).map(([category, amount], index) => ({
                        code: `5${String(index + 1).padStart(3, '0')}`,
                        name: category,
                        amount: amount
                    })),
                    total: totalExpenses
                },
                netIncome,
                profitMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0,
                period: {
                    startDate: startDate || 'All time',
                    endDate: endDate || 'All time'
                },
                summary: {
                    totalRevenue,
                    totalExpenses,
                    netIncome,
                    profitMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0
                }
            });
        }
        catch (error) {
            console.error('Error generating P&L statement:', error);
            res.status(500).json({ message: 'Failed to generate P&L statement' });
        }
    });
    // Balance Sheet
    app.get('/api/reports/balance-sheet', async (req, res) => {
        try {
            const { date } = req.query;
            // Get asset accounts (1000-1999)
            const assetAccounts = await db
                .select({
                id: accounts.id,
                code: accounts.code,
                name: accounts.name,
                balance: sql `COALESCE(SUM(${journalEntryLines.debit} - ${journalEntryLines.credit}), 0)`
            })
                .from(accounts)
                .leftJoin(journalEntryLines, eq(accounts.id, journalEntryLines.accountId))
                .where(and(gte(accounts.code, '1000'), lte(accounts.code, '1999')))
                .groupBy(accounts.id, accounts.code, accounts.name);
            // Get liability accounts (2000-2999)
            const liabilityAccounts = await db
                .select({
                id: accounts.id,
                code: accounts.code,
                name: accounts.name,
                balance: sql `COALESCE(SUM(${journalEntryLines.credit} - ${journalEntryLines.debit}), 0)`
            })
                .from(accounts)
                .leftJoin(journalEntryLines, eq(accounts.id, journalEntryLines.accountId))
                .where(and(gte(accounts.code, '2000'), lte(accounts.code, '2999')))
                .groupBy(accounts.id, accounts.code, accounts.name);
            // Get equity accounts (3000-3999)
            const equityAccounts = await db
                .select({
                id: accounts.id,
                code: accounts.code,
                name: accounts.name,
                balance: sql `COALESCE(SUM(${journalEntryLines.credit} - ${journalEntryLines.debit}), 0)`
            })
                .from(accounts)
                .leftJoin(journalEntryLines, eq(accounts.id, journalEntryLines.accountId))
                .where(and(gte(accounts.code, '3000'), lte(accounts.code, '3999')))
                .groupBy(accounts.id, accounts.code, accounts.name);
            const totalAssets = assetAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
            const totalLiabilities = liabilityAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
            const totalEquity = equityAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
            res.json({
                assets: {
                    accounts: assetAccounts.map(acc => ({
                        code: acc.code,
                        name: acc.name,
                        amount: Number(acc.balance)
                    })),
                    total: totalAssets
                },
                liabilities: {
                    accounts: liabilityAccounts.map(acc => ({
                        code: acc.code,
                        name: acc.name,
                        amount: Number(acc.balance)
                    })),
                    total: totalLiabilities
                },
                equity: {
                    accounts: equityAccounts.map(acc => ({
                        code: acc.code,
                        name: acc.name,
                        amount: Number(acc.balance)
                    })),
                    total: totalEquity
                },
                isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
            });
        }
        catch (error) {
            console.error('Error generating balance sheet:', error);
            res.status(500).json({ message: 'Failed to generate balance sheet' });
        }
    });
    // Cash Flow Statement - REMOVED (using routes-reports.ts implementation instead)
    // The duplicate cash flow handler was causing Drizzle ORM errors due to old schema references
    // Only /api/reports/cash-flow from routes-reports.ts should be active
    // Chart of Accounts
    app.get('/api/reports/chart-of-accounts', async (req, res) => {
        try {
            const allAccounts = await db
                .select({
                id: accounts.id,
                code: accounts.code,
                name: accounts.name,
                type: accounts.type,
                description: accounts.description,
                isActive: accounts.isActive,
                balance: sql `COALESCE(SUM(${journalEntryLines.debit} - ${journalEntryLines.credit}), 0)`
            })
                .from(accounts)
                .leftJoin(journalEntryLines, eq(accounts.id, journalEntryLines.accountId))
                .groupBy(accounts.id, accounts.code, accounts.name, accounts.type, accounts.description, accounts.isActive)
                .orderBy(accounts.code);
            res.json({
                accounts: allAccounts.map(acc => ({
                    code: acc.code,
                    name: acc.name,
                    type: acc.type,
                    description: acc.description || '',
                    isActive: acc.isActive,
                    balance: Number(acc.balance)
                }))
            });
        }
        catch (error) {
            console.error('Error fetching chart of accounts:', error);
            res.status(500).json({ message: 'Failed to fetch chart of accounts' });
        }
    });
    // Journal Entries Report
    app.get('/api/reports/journal-entries', async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            let query = db
                .select({
                id: journalEntries.id,
                date: journalEntries.date,
                description: journalEntries.description,
                reference: journalEntries.reference,
                totalDebit: sql `COALESCE(SUM(${journalEntryLines.debit}), 0)`,
                totalCredit: sql `COALESCE(SUM(${journalEntryLines.credit}), 0)`
            })
                .from(journalEntries)
                .leftJoin(journalEntryLines, eq(journalEntries.id, journalEntryLines.journalEntryId))
                .groupBy(journalEntries.id, journalEntries.date, journalEntries.description, journalEntries.reference)
                .orderBy(desc(journalEntries.date));
            const entries = await query;
            res.json({
                entries: entries.map(entry => ({
                    id: entry.id,
                    date: entry.date,
                    description: entry.description || '',
                    reference: entry.reference || '',
                    debit: Number(entry.totalDebit),
                    credit: Number(entry.totalCredit)
                }))
            });
        }
        catch (error) {
            console.error('Error fetching journal entries:', error);
            res.status(500).json({ message: 'Failed to fetch journal entries' });
        }
    });
    // General Ledger Report
    app.get('/api/reports/general-ledger', async (req, res) => {
        try {
            const { accountId, startDate, endDate } = req.query;
            // Get account details
            const accountDetails = await db
                .select()
                .from(accounts)
                .where(accountId ? eq(accounts.id, Number(accountId)) : sql `1=1`)
                .limit(1);
            if (accountDetails.length === 0) {
                return res.status(404).json({ message: 'Account not found' });
            }
            // Get all transactions for the account
            const transactions = await db
                .select({
                date: journalEntries.date,
                description: sql `COALESCE(${journalEntries.description}, ${journalEntryLines.description}, '')`,
                reference: journalEntries.reference,
                debit: sql `${journalEntryLines.debit}`,
                credit: sql `${journalEntryLines.credit}`,
                balance: sql `0` // Would need running balance calculation
            })
                .from(journalEntryLines)
                .innerJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
                .where(accountId ? eq(journalEntryLines.accountId, Number(accountId)) : sql `1=1`)
                .orderBy(journalEntries.date);
            res.json({
                account: accountDetails[0],
                transactions: transactions.map(tx => ({
                    date: tx.date,
                    description: tx.description,
                    reference: tx.reference || '',
                    debit: Number(tx.debit),
                    credit: Number(tx.credit),
                    balance: Number(tx.balance)
                }))
            });
        }
        catch (error) {
            console.error('Error generating general ledger:', error);
            res.status(500).json({ message: 'Failed to generate general ledger' });
        }
    });
    // Account Summary Report
    app.get('/api/reports/account-summary', async (req, res) => {
        try {
            const summary = await db
                .select({
                type: accounts.type,
                count: sql `COUNT(*)`,
                totalDebit: sql `COALESCE(SUM(${journalEntryLines.debit}), 0)`,
                totalCredit: sql `COALESCE(SUM(${journalEntryLines.credit}), 0)`
            })
                .from(accounts)
                .leftJoin(journalEntryLines, eq(accounts.id, journalEntryLines.accountId))
                .groupBy(accounts.type);
            res.json({
                summary: summary.map(s => ({
                    type: s.type,
                    count: Number(s.count),
                    totalDebit: Number(s.totalDebit),
                    totalCredit: Number(s.totalCredit)
                }))
            });
        }
        catch (error) {
            console.error('Error generating account summary:', error);
            res.status(500).json({ message: 'Failed to generate account summary' });
        }
    });
    // Aging Analysis Report
    app.get('/api/reports/aging-analysis', async (req, res) => {
        try {
            // Get unpaid invoices with age buckets
            const unpaidInvoices = await db
                .select({
                id: sales.id,
                invoiceNumber: sales.invoiceNumber,
                customerName: sql `'Customer'`, // Would need customer join
                invoiceDate: sales.date,
                amount: sales.grandTotal,
                age: sql `EXTRACT(DAY FROM NOW() - ${sales.date})`
            })
                .from(sales)
                .where(eq(sales.paymentStatus, 'unpaid'));
            // Categorize by age
            const aging = {
                current: unpaidInvoices.filter(inv => Number(inv.age) <= 30),
                thirtyDays: unpaidInvoices.filter(inv => Number(inv.age) > 30 && Number(inv.age) <= 60),
                sixtyDays: unpaidInvoices.filter(inv => Number(inv.age) > 60 && Number(inv.age) <= 90),
                ninetyDays: unpaidInvoices.filter(inv => Number(inv.age) > 90)
            };
            res.json({
                current: {
                    count: aging.current.length,
                    amount: aging.current.reduce((sum, inv) => sum + Number(inv.amount || 0), 0)
                },
                thirtyDays: {
                    count: aging.thirtyDays.length,
                    amount: aging.thirtyDays.reduce((sum, inv) => sum + Number(inv.amount || 0), 0)
                },
                sixtyDays: {
                    count: aging.sixtyDays.length,
                    amount: aging.sixtyDays.reduce((sum, inv) => sum + Number(inv.amount || 0), 0)
                },
                ninetyDays: {
                    count: aging.ninetyDays.length,
                    amount: aging.ninetyDays.reduce((sum, inv) => sum + Number(inv.amount || 0), 0)
                },
                total: {
                    count: unpaidInvoices.length,
                    amount: unpaidInvoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0)
                }
            });
        }
        catch (error) {
            console.error('Error generating aging analysis:', error);
            res.status(500).json({ message: 'Failed to generate aging analysis' });
        }
    });
}
