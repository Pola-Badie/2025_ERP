import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, 
  FileText, 
  Book, 
  BarChart4, 
  CreditCard, 
  DollarSign, 
  Building2,
  Clock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Placeholder components for accounting tabs
const ChartOfAccounts = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-medium">Chart of Accounts</h3>
      <Button size="sm">
        <PlusCircle className="h-4 w-4 mr-2" />
        Add Account
      </Button>
    </div>
    <div className="bg-muted/30 p-8 rounded-lg border border-dashed flex flex-col items-center justify-center text-center">
      <FileText className="h-10 w-10 text-muted-foreground mb-2" />
      <h3 className="text-lg font-medium">No accounts created yet</h3>
      <p className="text-muted-foreground">Create accounts to organize your financial transactions</p>
    </div>
  </div>
);

const JournalEntries = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-medium">Journal Entries</h3>
      <Button size="sm">
        <PlusCircle className="h-4 w-4 mr-2" />
        New Entry
      </Button>
    </div>
    <div className="bg-muted/30 p-8 rounded-lg border border-dashed flex flex-col items-center justify-center text-center">
      <Book className="h-10 w-10 text-muted-foreground mb-2" />
      <h3 className="text-lg font-medium">No journal entries found</h3>
      <p className="text-muted-foreground">Record financial transactions as journal entries</p>
    </div>
  </div>
);

const GeneralLedger = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-medium">General Ledger</h3>
      <Button variant="outline" size="sm">
        <Clock className="h-4 w-4 mr-2" />
        Select Date Range
      </Button>
    </div>
    <div className="bg-muted/30 p-8 rounded-lg border border-dashed flex flex-col items-center justify-center text-center">
      <Book className="h-10 w-10 text-muted-foreground mb-2" />
      <h3 className="text-lg font-medium">Ledger is empty</h3>
      <p className="text-muted-foreground">Journal entries will appear in the general ledger</p>
    </div>
  </div>
);

const FinancialReports = () => {
  const [reportType, setReportType] = useState('pnl');
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Financial Reports</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Clock className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline" size="sm">
            Export
          </Button>
        </div>
      </div>
      
      <div className="flex space-x-4 mb-4">
        <Button 
          variant={reportType === 'pnl' ? 'default' : 'outline'} 
          onClick={() => setReportType('pnl')}
          size="sm"
        >
          P&L Statement
        </Button>
        <Button 
          variant={reportType === 'balance' ? 'default' : 'outline'} 
          onClick={() => setReportType('balance')}
          size="sm"
        >
          Balance Sheet
        </Button>
        <Button 
          variant={reportType === 'cash' ? 'default' : 'outline'} 
          onClick={() => setReportType('cash')}
          size="sm"
        >
          Cash Flow
        </Button>
      </div>
      
      <div className="bg-muted/30 p-8 rounded-lg border border-dashed flex flex-col items-center justify-center text-center">
        <BarChart4 className="h-10 w-10 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">No data available</h3>
        <p className="text-muted-foreground">Add journal entries to generate financial reports</p>
      </div>
    </div>
  );
};

const Preferences = () => {
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['/api/accounting/summary'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/accounting/summary');
        return await res.json();
      } catch (error) {
        // Return placeholder data if endpoint doesn't exist yet
        return {
          totalAccounts: 0,
          journalEntries: 0,
          revenueThisMonth: 0,
          expensesThisMonth: 0
        };
      }
    }
  });

  return (
    <div className="container px-4 md:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Accounting</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-6 w-24 bg-muted/60 rounded animate-pulse"></div>
              ) : (
                <span className="text-green-600">
                  ${(summaryData?.revenueThisMonth || 0).toLocaleString()}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-6 w-24 bg-muted/60 rounded animate-pulse"></div>
              ) : (
                <span className="text-rose-600">
                  ${(summaryData?.expensesThisMonth || 0).toLocaleString()}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-6 w-24 bg-muted/60 rounded animate-pulse"></div>
              ) : (
                <span className={((summaryData?.revenueThisMonth || 0) - (summaryData?.expensesThisMonth || 0)) >= 0 ? 'text-green-600' : 'text-rose-600'}>
                  ${((summaryData?.revenueThisMonth || 0) - (summaryData?.expensesThisMonth || 0)).toLocaleString()}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="journal" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <TabsTrigger value="chart">
            <FileText className="h-4 w-4 mr-2" />
            Chart of Accounts
          </TabsTrigger>
          <TabsTrigger value="journal">
            <Book className="h-4 w-4 mr-2" />
            Journal Entries
          </TabsTrigger>
          <TabsTrigger value="ledger">
            <Building2 className="h-4 w-4 mr-2" />
            General Ledger
          </TabsTrigger>
          <TabsTrigger value="reports">
            <BarChart4 className="h-4 w-4 mr-2" />
            Financial Reports
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="chart" className="p-4 border rounded-lg">
          <ChartOfAccounts />
        </TabsContent>
        
        <TabsContent value="journal" className="p-4 border rounded-lg">
          <JournalEntries />
        </TabsContent>
        
        <TabsContent value="ledger" className="p-4 border rounded-lg">
          <GeneralLedger />
        </TabsContent>
        
        <TabsContent value="reports" className="p-4 border rounded-lg">
          <FinancialReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Preferences;