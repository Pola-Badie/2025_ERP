import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  CreditCard, 
  DollarSign, 
  FileText, 
  BarChart4, 
  TrendingUp,
  Landmark,
  Calendar,
  Receipt,
  Clock,
  Plus,
  ShoppingBag,
  FileWarning,
  BellRing,
  PlusCircle,
  LineChart,
  Download,
  FileQuestion,
  BarChart
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ChartOfAccounts from '@/components/accounting/ChartOfAccounts';
import JournalEntries from '@/components/accounting/JournalEntries';
import ProfitAndLoss from '@/components/accounting/ProfitAndLoss';
import BalanceSheet from '@/components/accounting/BalanceSheet';
import CustomerPayments from '@/components/accounting/CustomerPayments';
import AccountingPeriods from '@/components/accounting/AccountingPeriods';

const Accounting: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Fetch accounting summary data
  const { data: summaryData } = useQuery({
    queryKey: ['/api/accounting/summary'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/accounting/summary');
        return await res.json();
      } catch (error) {
        console.error("Error fetching accounting summary:", error);
        return {
          totalAccounts: 0,
          journalEntries: 0,
          revenueThisMonth: 0,
          expensesThisMonth: 0
        };
      }
    }
  });

  // Card component for dashboard stats
  const StatCard = ({ icon: Icon, title, value, description, trend }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
      {trend && (
        <CardFooter className="p-2">
          <div className={`text-xs flex items-center ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-500'}`}>
            {trend > 0 ? (
              <TrendingUp className="mr-1 h-3 w-3" />
            ) : trend < 0 ? (
              <TrendingUp className="mr-1 h-3 w-3 rotate-180" />
            ) : null}
            {trend > 0 ? '+' : ''}{trend}% from last month
          </div>
        </CardFooter>
      )}
    </Card>
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="container py-4 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Landmark className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold tracking-tight">FINANCIAL ACCOUNTING</h1>
        </div>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setActiveTab("journal-entries")}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            New Journal Entry
          </Button>
          <Button 
            variant="outline"
            onClick={() => setActiveTab("profit-loss")}
          >
            <FileText className="mr-2 h-4 w-4" />
            View Reports
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="overflow-x-auto flex w-full pb-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="chart-of-accounts">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="journal-entries">Journal Entries</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="invoices-due">Invoices Due</TabsTrigger>
          <TabsTrigger value="customer-payments">Customer Payments</TabsTrigger>
          <TabsTrigger value="accounting-periods">Periods</TabsTrigger>
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="financial-reports">Financial Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              icon={CreditCard}
              title="Total Accounts"
              value={summaryData?.totalAccounts || 0}
              description="Total accounts in your chart of accounts"
            />
            <StatCard
              icon={BookOpen}
              title="Journal Entries"
              value={summaryData?.journalEntries || 0}
              description="Total journal entries created"
            />
            <StatCard
              icon={DollarSign}
              title="Revenue (This Month)"
              value={formatCurrency(summaryData?.revenueThisMonth || 0)}
              description="Total revenue recorded this month"
              trend={5}
            />
            <StatCard
              icon={BarChart4}
              title="Expenses (This Month)"
              value={formatCurrency(summaryData?.expensesThisMonth || 0)}
              description="Total expenses recorded this month"
              trend={-2}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common accounting tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab("chart-of-accounts")}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Chart of Accounts
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("journal-entries")}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Create Journal Entry
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("customer-payments")}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Manage Customer Payments
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("accounting-periods")}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Accounting Periods
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("profit-loss")}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Generate Profit & Loss Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("balance-sheet")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Balance Sheet
                </Button>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest accounting transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    No recent activities to display. Create journal entries to see activity here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chart-of-accounts">
          <ChartOfAccounts />
        </TabsContent>

        <TabsContent value="journal-entries">
          <JournalEntries />
        </TabsContent>

        <TabsContent value="profit-loss">
          <ProfitAndLoss />
        </TabsContent>

        <TabsContent value="balance-sheet">
          <BalanceSheet />
        </TabsContent>
        
        <TabsContent value="customer-payments">
          <CustomerPayments />
        </TabsContent>
        
        <TabsContent value="accounting-periods">
          <AccountingPeriods />
        </TabsContent>
        
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Receipt className="h-5 w-5 mr-2 text-blue-600" />
                  <span>Expenses Management</span>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" /> New Expense
                </Button>
              </CardTitle>
              <CardDescription>Record and track all company expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="date-range" className="whitespace-nowrap">Date Range:</Label>
                  <Select defaultValue="this-month">
                    <SelectTrigger id="date-range" className="w-[180px]">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="this-week">This Week</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="this-quarter">This Quarter</SelectItem>
                      <SelectItem value="this-year">This Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="account-type" className="whitespace-nowrap">Account Type:</Label>
                  <Select>
                    <SelectTrigger id="account-type" className="w-[180px]">
                      <SelectValue placeholder="All accounts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accounts</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="fixed-assets">Fixed Assets</SelectItem>
                      <SelectItem value="projects">Projects Under Execution</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="cost-center" className="whitespace-nowrap">Cost Center:</Label>
                  <Select>
                    <SelectTrigger id="cost-center" className="w-[180px]">
                      <SelectValue placeholder="All centers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Centers</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="projects">Projects</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Account Type</TableHead>
                    <TableHead>Cost Center</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={7}>
                      No expense records found. Add a new expense to get started.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <ShoppingBag className="h-5 w-5 mr-2 text-blue-600" />
                  <span>Purchases Management</span>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" /> New Purchase
                </Button>
              </CardTitle>
              <CardDescription>Manage purchase records, suppliers, and inventory-related accounting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="supplier" className="whitespace-nowrap">Supplier:</Label>
                  <Select>
                    <SelectTrigger id="supplier" className="w-[180px]">
                      <SelectValue placeholder="All suppliers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Suppliers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="payment-method" className="whitespace-nowrap">Payment Method:</Label>
                  <Select>
                    <SelectTrigger id="payment-method" className="w-[180px]">
                      <SelectValue placeholder="All methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="purchase-date-range" className="whitespace-nowrap">Date Range:</Label>
                  <Select defaultValue="this-month">
                    <SelectTrigger id="purchase-date-range" className="w-[180px]">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="this-week">This Week</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="this-quarter">This Quarter</SelectItem>
                      <SelectItem value="this-year">This Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={8}>
                      No purchase records found. Add a new purchase to get started.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invoices-due">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileWarning className="h-5 w-5 mr-2 text-blue-600" />
                  <span>Invoices Due</span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <BellRing className="h-4 w-4 mr-2" /> Reminders
                  </Button>
                  <Button variant="outline" size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Invoice
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Track accounts payable and receivable with due dates</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="payable">
                <div className="flex justify-between items-center mb-4">
                  <TabsList>
                    <TabsTrigger value="payable">Payable</TabsTrigger>
                    <TabsTrigger value="receivable">Receivable</TabsTrigger>
                  </TabsList>
                  
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <TabsContent value="payable">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-muted-foreground" colSpan={8}>
                          No payable invoices found.
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="receivable">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-muted-foreground" colSpan={8}>
                          No receivable invoices found.
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="financial-reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="h-5 w-5 mr-2 text-blue-600" />
                <span>Financial Reports Generator</span>
              </CardTitle>
              <CardDescription>Generate comprehensive financial reports with filters and export options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="report-type">Report Type</Label>
                    <Select>
                      <SelectTrigger id="report-type">
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial-balance">Trial Balance</SelectItem>
                        <SelectItem value="general-ledger">General Ledger</SelectItem>
                        <SelectItem value="expense-summary">Expense Summary by Category</SelectItem>
                        <SelectItem value="purchase-summary">Purchase Summary by Supplier</SelectItem>
                        <SelectItem value="cash-flow">Cash Flow Report</SelectItem>
                        <SelectItem value="aging-payables">Aging Report for Payables</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input id="start-date" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input id="end-date" type="date" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="account-type-filter">Account Type</Label>
                    <Select>
                      <SelectTrigger id="account-type-filter">
                        <SelectValue placeholder="All account types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="asset">Asset</SelectItem>
                        <SelectItem value="liability">Liability</SelectItem>
                        <SelectItem value="equity">Equity</SelectItem>
                        <SelectItem value="revenue">Revenue</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cost-center-filter">Cost Center</Label>
                    <Select>
                      <SelectTrigger id="cost-center-filter">
                        <SelectValue placeholder="All cost centers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Centers</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="projects">Projects</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="pt-4 flex gap-2">
                    <Button>
                      <BarChart className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                    <Button variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 min-h-[300px] flex flex-col items-center justify-center text-center">
                  <FileQuestion className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="mb-2 text-muted-foreground">Select a report type and date range to generate a financial report</p>
                  <p className="text-xs text-muted-foreground">Reports will display here with visualization options</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Accounting;