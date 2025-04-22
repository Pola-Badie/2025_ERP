import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ExpenseReport from '@/components/reports/ExpenseReport';
import { CalendarIcon, ArrowDownIcon, BarChart3 } from 'lucide-react';

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState('expense');
  const [period, setPeriod] = useState('month');

  // Helper function to get current period label
  const getCurrentPeriodLabel = () => {
    const now = new Date();
    switch (period) {
      case 'month':
        return now.toLocaleDateString('default', { month: 'long', year: 'numeric' });
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        return `Q${quarter} ${now.getFullYear()}`;
      case 'year':
        return now.getFullYear().toString();
      default:
        return 'All Time';
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Reports</h1>
          <p className="text-sm text-slate-500">Analyze your real estate expense data</p>
        </div>
        <div className="flex items-center mt-4 sm:mt-0">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select period" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-5 w-5 mr-2 text-primary" />
            <h2 className="text-lg font-semibold text-slate-900">
              Report for {getCurrentPeriodLabel()}
            </h2>
          </div>
          
          <Tabs defaultValue="expense" onValueChange={setReportType}>
            <TabsList className="mb-6">
              <TabsTrigger value="expense">Expense Breakdown</TabsTrigger>
              <TabsTrigger value="category">Category Analysis</TabsTrigger>
              <TabsTrigger value="trend">Expense Trends</TabsTrigger>
            </TabsList>
            
            <TabsContent value="expense">
              <ExpenseReport period={period} />
            </TabsContent>
            
            <TabsContent value="category">
              <div className="text-center py-12">
                <div className="bg-slate-100 inline-flex items-center justify-center rounded-full p-3 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                    <path d="M10.2 11.3C9.5 10.8 8.4 10.8 7.7 11.3L3.5 14.3C2.8 14.8 2.8 15.8 3.5 16.3L7.7 19.3C8.4 19.8 9.5 19.8 10.2 19.3L14.4 16.3C15.1 15.8 15.1 14.8 14.4 14.3L10.2 11.3Z"></path>
                    <path d="M13.8 8.7C13.1 8.2 12 8.2 11.3 8.7L7.1 11.7C6.4 12.2 6.4 13.2 7.1 13.7L11.3 16.7C12 17.2 13.1 17.2 13.8 16.7L18 13.7C18.7 13.2 18.7 12.2 18 11.7L13.8 8.7Z"></path>
                    <path d="M17.4 6.1C16.7 5.6 15.6 5.6 14.9 6.1L10.7 9.1C10 9.6 10 10.6 10.7 11.1L14.9 14.1C15.6 14.6 16.7 14.6 17.4 14.1L21.6 11.1C22.3 10.6 22.3 9.6 21.6 9.1L17.4 6.1Z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">Category Analysis</h3>
                <p className="text-slate-500 max-w-lg mx-auto">
                  This report is currently being developed. Check back soon for detailed category insights.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="trend">
              <div className="text-center py-12">
                <div className="bg-slate-100 inline-flex items-center justify-center rounded-full p-3 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                    <path d="M3 3v18h18"></path>
                    <path d="m19 9-5 5-4-4-3 3"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">Expense Trends</h3>
                <p className="text-slate-500 max-w-lg mx-auto">
                  This report is currently being developed. Check back soon for detailed trend analysis.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Saved Reports</h3>
          
          <div className="text-center py-6">
            <div className="bg-slate-100 inline-flex items-center justify-center rounded-full p-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <path d="M8 13h8"></path>
                <path d="M8 17h8"></path>
                <path d="M8 9h1"></path>
              </svg>
            </div>
            <h3 className="text-md font-medium text-slate-800 mb-2">No saved reports yet</h3>
            <p className="text-slate-500">
              Generate and save reports to access them quickly in the future.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
