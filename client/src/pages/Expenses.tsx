import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useExpenses } from '@/hooks/use-expenses';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Download, Filter, Search, MoreHorizontal, 
  AlertCircle, Trash, Calendar, Settings
} from 'lucide-react';

// Define types for Expense and Category if they're not in schema.ts
interface Expense {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  status: string;
  notes?: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

const Expenses: React.FC = () => {
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isCategorySettingsOpen, setIsCategorySettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ id: number, name: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest('POST', '/api/categories', { name });
      return await response.json();
    },
    onSuccess: () => {
      setNewCategoryName('');
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: 'Category created',
        description: 'The category has been created successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive',
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number, name: string }) => {
      const response = await apiRequest('PATCH', `/api/categories/${id}`, { name });
      return await response.json();
    },
    onSuccess: () => {
      setEditingCategory(null);
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: 'Category updated',
        description: 'The category has been updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive',
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/categories/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: 'Category deleted',
        description: 'The category has been deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
    },
  });

  // Handler functions for category operations
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'Error',
        description: 'Category name cannot be empty',
        variant: 'destructive',
      });
      return;
    }
    createCategoryMutation.mutate(newCategoryName);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast({
        title: 'Error',
        description: 'Category name cannot be empty',
        variant: 'destructive',
      });
      return;
    }
    updateCategoryMutation.mutate({
      id: editingCategory.id,
      name: editingCategory.name
    });
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(id);
    }
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
            
            <div className="flex space-x-2">
              <div className="flex-1">
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
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 shrink-0" 
                onClick={() => setIsCategorySettingsOpen(true)}
                title="Category Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
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

      {/* Category Settings Dialog */}
      <Dialog open={isCategorySettingsOpen} onOpenChange={setIsCategorySettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Category Settings</DialogTitle>
            <DialogDescription>Manage expense categories for better organization</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Add new category */}
            <div className="flex items-center space-x-2">
              <Input 
                placeholder="New category name" 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <Button 
                size="sm" 
                onClick={handleAddCategory} 
                disabled={createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-1" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Add
              </Button>
            </div>
            
            {/* Category list */}
            <div className="border rounded-md divide-y">
              {categories?.map((category) => (
                <div key={category.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    {editingCategory?.id === category.id ? (
                      <Input 
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ 
                          id: editingCategory.id, 
                          name: e.target.value 
                        })}
                        className="w-full"
                        autoFocus
                        onKeyPress={(e) => e.key === 'Enter' && handleUpdateCategory()}
                      />
                    ) : (
                      <span>{category.name}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingCategory?.id === category.id ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleUpdateCategory}
                          disabled={updateCategoryMutation.isPending}
                        >
                          {updateCategoryMutation.isPending ? (
                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-1" />
                          ) : (
                            'Save'
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingCategory(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingCategory({ id: category.id, name: category.name })}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={deleteCategoryMutation.isPending}
                        >
                          {deleteCategoryMutation.isPending && deleteCategoryMutation.variables === category.id ? (
                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                          ) : (
                            <Trash className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {categories?.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No categories found. Add a new category to get started.
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategorySettingsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expenses;
