import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, getTimeSince } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Backup, Expense } from '@shared/schema';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  iconBgClass: string;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtext, icon, iconBgClass, loading }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            {loading ? (
              <div className="h-8 w-24 bg-slate-200 animate-pulse rounded mt-1"></div>
            ) : (
              <h3 className="text-2xl font-bold mt-1">{value}</h3>
            )}
            {loading ? (
              <div className="h-5 w-36 bg-slate-200 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-sm text-green-500 mt-1 flex items-center">
                {subtext}
              </p>
            )}
          </div>
          <div className={`p-2 rounded-md ${iconBgClass}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MetricsCards: React.FC = () => {
  // Fetch data for the metrics
  const { data: expenses, isLoading: isLoadingExpenses } = useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
  });

  const { data: pendingExpenses, isLoading: isLoadingPending } = useQuery<Expense[]>({
    queryKey: ['/api/expenses', { status: 'pending' }],
    queryFn: async () => {
      const res = await fetch('/api/expenses?status=pending');
      if (!res.ok) throw new Error('Failed to fetch pending expenses');
      return res.json();
    },
  });

  const { data: latestBackup, isLoading: isLoadingBackup } = useQuery<Backup>({
    queryKey: ['/api/backups/latest'],
    queryFn: async () => {
      const res = await fetch('/api/backups/latest');
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch latest backup');
      }
      return res.json();
    },
  });

  // Calculate total expenses
  const totalExpenses = expenses?.reduce((sum: number, expense: any) => sum + (parseFloat(expense.amount) || 0), 0) || 0;

  // Calculate categories count
  const uniqueCategories = new Set(expenses?.map(expense => expense.category));
  const categoriesCount = uniqueCategories.size;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard
        title="Total Expenses"
        value={`$${totalExpenses.toLocaleString()}`}
        subtext="📈 Based on all expenses"
        icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><line x1="12" y1="2" x2="12" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>}
        iconBgClass="bg-primary-50"
        loading={isLoadingExpenses}
      />

      <MetricCard
        title="Pending Approval"
        value={pendingExpenses?.length || 0}
        subtext="⚠️ Require action"
        icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>}
        iconBgClass="bg-amber-50"
        loading={isLoadingPending}
      />

      <MetricCard
        title="Last Backup"
        value={latestBackup ? getTimeSince(latestBackup.timestamp) : 'Never'}
        subtext="✅ Automated"
        icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>}
        iconBgClass="bg-teal-50"
        loading={isLoadingBackup}
      />

      <MetricCard
        title="Expenses by Category"
        value={categoriesCount || 0}
        subtext="📊 View breakdown"
        icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>}
        iconBgClass="bg-slate-100"
        loading={isLoadingExpenses}
      />
    </div>
  );
};

export default MetricsCards;
