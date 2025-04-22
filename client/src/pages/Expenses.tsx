import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useExpenses } from '@/hooks/use-expenses';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import { Expense, Category } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { Plus, Download, Filter, Search, MoreHorizontal, AlertCircle } from 'lucide-react';

const Expenses: React.FC = () => {
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Get expenses and categories
  const { getAllExpenses } = useExpenses();
  const { data: expenses, isLoading: isLoadingExpenses } = getAllExpenses();
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Filter expenses
  const filteredExpenses = expenses?.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Sort expenses by date (descending)
  const sortedExpenses = filteredExpenses
    ? [...filteredExpenses].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    : [];

  // Helper functions
  const getCategoryBadge = (category: string) => {
    const categoryColors: Record<string, string> = {
      'Marketing': 'purple',
      'Travel': 'orange',
      'Office Supplies': 'info',
      'Client Entertainment': 'info',
      'Software': 'teal',
      'Administrative': 'gray',
    };
    
    return (
      <Badge variant={categoryColors[category] as any || 'default'}>
        {category}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusVariants: Record<string, string> = {
      'approved': 'success',
      'pending': 'warning',
      'rejected': 'danger',
    };
    
    return (
      <Badge variant={statusVariants[status] as any}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Export expenses to CSV
  const exportToCsv = () => {
    if (!expenses?.length) return;
    
    const headers = [
      'Date',
      'Description',
      'Category',
      'Amount',
      'Status',
      'Notes',
    ];
    
    const csvData = expenses.map(expense => [
      new Date(expense.date).toLocaleDateString(),
      expense.description,
      expense.category,
      expense.amount.toString(),
      expense.status,
      expense.notes || '',
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="outline" onClick={exportToCsv} disabled={!expenses?.length}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setIsExpenseFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Expense
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search expenses..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardContent className="p-0">
          {isLoadingExpenses ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : sortedExpenses.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-lg font-medium text-slate-700 mb-1">No expenses found</h3>
              <p className="text-slate-500 mb-4">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first expense to get started'}
              </p>
              {!(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
                <Button onClick={() => setIsExpenseFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedExpenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">{formatDate(expense.date)}</td>
                      <td className="px-4 py-3 max-w-xs truncate">{expense.description}</td>
                      <td className="px-4 py-3">
                        {getCategoryBadge(expense.category)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(expense.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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

export default Expenses;
