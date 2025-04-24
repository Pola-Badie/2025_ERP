import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Category {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

const Preferences = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Fetch categories
  const { data: categories, isLoading, isError } = useQuery({
    queryKey: ['/api/categories'],
    refetchOnWindowFocus: false,
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (newCategory: { name: string; description: string }) => {
      return apiRequest('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCategory),
      });
    },
    onSuccess: () => {
      toast({
        title: "Category Added",
        description: "Category has been added successfully.",
      });
      setCategoryName('');
      setCategoryDescription('');
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add category.",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/categories/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Category Deleted",
        description: "Category has been deleted successfully.",
      });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete category. It may be in use by products.",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
    },
  });

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryName.trim() === '') return;

    addCategoryMutation.mutate({
      name: categoryName,
      description: categoryDescription,
    });
  };

  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCategory = () => {
    if (categoryToDelete) {
      deleteCategoryMutation.mutate(categoryToDelete.id);
    }
  };

  return (
    <div className="container px-4 md:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Preferences</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Categories Section */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              Manage categories used in inventory and sales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Name</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Description</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={3} className="py-4 text-center">
                          Loading categories...
                        </td>
                      </tr>
                    ) : isError ? (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-red-500">
                          <div className="flex items-center justify-center">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Error loading categories
                          </div>
                        </td>
                      </tr>
                    ) : categories?.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-gray-500">
                          No categories found. Add your first category below.
                        </td>
                      </tr>
                    ) : (
                      categories?.map((category: Category) => (
                        <tr key={category.id} className="border-b">
                          <td className="py-3 px-2">{category.name}</td>
                          <td className="py-3 px-2">{category.description || '-'}</td>
                          <td className="py-3 px-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => openDeleteDialog(category)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <form onSubmit={handleAddCategory}>
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <Input
                        placeholder="Category Name"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Textarea
                        placeholder="Description (optional)"
                        value={categoryDescription}
                        onChange={(e) => setCategoryDescription(e.target.value)}
                        className="h-10 py-2"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={addCategoryMutation.isPending || categoryName.trim() === ''}
                    >
                      {addCategoryMutation.isPending ? 'Adding...' : 'Add Category'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the category "{categoryToDelete?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteCategoryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Preferences;