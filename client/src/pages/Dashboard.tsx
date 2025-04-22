import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import MetricsCards from '@/components/dashboard/MetricsCards';
import ExpenseTrends from '@/components/dashboard/ExpenseTrends';
import RecentExpenses from '@/components/dashboard/RecentExpenses';
import BackupRecovery from '@/components/dashboard/BackupRecovery';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import { Home, CalendarDays, Plus } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  
  // Date range for the dashboard
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const dateRange = `${format(firstDay, 'MMM d')} - ${format(lastDay, 'MMM d, yyyy')}`;

  return (
    <div>
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Dashboard</h1>
          <p className="text-sm text-slate-500">Manage your real estate expense activities</p>
        </div>
        <div className="flex mt-4 md:mt-0 space-x-3">
          <Button variant="outline">
            <CalendarDays className="h-4 w-4 mr-2" />
            <span>{dateRange}</span>
          </Button>
          <Button onClick={() => setIsExpenseFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            <span>New Expense</span>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <MetricsCards />

      {/* Expense Trends */}
      <ExpenseTrends />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Expenses Table */}
        <div className="lg:col-span-2">
          <RecentExpenses />
        </div>

        {/* Backup & Recovery Section */}
        <div>
          <BackupRecovery />
        </div>
      </div>

      {/* New Expense Dialog */}
      <Dialog open={isExpenseFormOpen} onOpenChange={setIsExpenseFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>New Expense Entry</DialogTitle>
          </DialogHeader>
          <ExpenseForm onSuccess={() => setIsExpenseFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
