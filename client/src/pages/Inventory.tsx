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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Trash, 
  Trash2,
  Search, 
  Filter, 
  MoreHorizontal, 
  AlertCircle, 
  Calendar,
  Pencil,
  Tag 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductForm from '@/components/inventory/ProductForm';

interface Category {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

interface Product {
  id: number;
  name: string;
  drugName: string;
  categoryId: number;
  category: string;
  sku: string;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  location?: string;
  shelf?: string;
  expiryDate: string;
  status: string;
  createdAt: string;
}

const Inventory: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('inventory');

  // State for product management
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // State for category management
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  // Fetch products and categories
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    refetchOnWindowFocus: false,
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (newCategory: { name: string; description: string }) => {
      return apiRequest('POST', '/api/categories', newCategory);
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

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (category: { id: number; name: string; description: string | null }) => {
      const response = await apiRequest('PATCH', `/api/categories/${category.id}`, {
        name: category.name,
        description: category.description
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Category Updated",
        description: "Category has been updated successfully.",
      });
      setEditDialogOpen(false);
      setCategoryToEdit(null);
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update category.",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/categories/${id}`);
      return response.json();
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
        description: error instanceof Error 
          ? error.message 
          : "Failed to delete category. It may be in use by products.",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
    },
  });

  // Filter products
  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.drugName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || product.categoryId.toString() === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Handle category form submission
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryName.trim() === '') return;

    addCategoryMutation.mutate({
      name: categoryName,
      description: categoryDescription,
    });
  };

  // Category edit handlers
  const openEditDialog = (category: Category) => {
    setCategoryToEdit(category);
    setEditDialogOpen(true);
  };

  const handleUpdateCategory = () => {
    if (categoryToEdit) {
      updateCategoryMutation.mutate(categoryToEdit);
    }
  };

  // Delete category dialog
  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCategory = () => {
    if (categoryToDelete) {
      deleteCategoryMutation.mutate(categoryToDelete.id);
    }
  };

  // Helper functions for product display
  const getStatusBadge = (status: string) => {
    // Return fixed styling for NEAR status
    if (status === 'near' || status === 'near-expiry') {
      return (
        <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-orange-200 text-orange-800">
          NEAR
        </div>
      );
    }
    
    const statusVariants: Record<string, string> = {
      'active': 'success',
      'in-stock': 'success',
      'low-stock': 'warning',
      'out_of_stock': 'danger',
      'expired': 'danger',
    };
    
    const statusDisplay: Record<string, string> = {
      'active': 'In Stock',
      'in-stock': 'In Stock',
      'low-stock': 'Low Stock',
      'out_of_stock': 'Out of Stock',
      'expired': 'Expired',
    };
    
    return (
      <Badge variant={statusVariants[status] as any || 'default'}>
        {statusDisplay[status] || status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </Badge>
    );
  };

  // Calculate if a product is expired or near expiry
  const getExpiryStatus = (expiryDate: string) => {
    if (!expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', days: Math.abs(daysUntilExpiry) };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'near-expiry', days: daysUntilExpiry };
    }
    return null;
  };
  
  // Product action handlers
  const handleCreateLabel = (product: Product) => {
    toast({
      title: "Generate Label",
      description: `Creating label for ${product.name}`,
    });
    // In a real implementation, this would open a label generator dialog or redirect to a label page
  };
  
  const handleEditProduct = (product: Product) => {
    // This would open the edit dialog with the product data
    setIsProductFormOpen(true);
    // In a real implementation, you would set the current product to edit
    toast({
      title: "Edit Product",
      description: `Editing ${product.name}`,
    });
  };
  
  const handleDeleteProduct = (product: Product) => {
    // In a real implementation, this would open a confirmation dialog
    toast({
      title: "Delete Product",
      description: `Are you sure you want to delete ${product.name}?`,
      variant: "destructive",
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button onClick={() => setIsProductFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b mb-4">
          <TabsList className="flex border-0 p-0 h-auto bg-transparent gap-0">
            <TabsTrigger 
              value="inventory" 
              className="flex-1 border-0 rounded-none py-3 px-6 font-normal text-gray-600 data-[state=active]:text-blue-500 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 transition-none"
            >
              Inventory
            </TabsTrigger>
            <TabsTrigger 
              value="categories" 
              className="flex-1 border-0 rounded-none py-3 px-6 font-normal text-gray-600 data-[state=active]:text-blue-500 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 transition-none"
            >
              Categories
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* Inventory Tab */}
        <TabsContent value="inventory">
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search products..."
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
                    <SelectItem value="active">In Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="near">NEAR</SelectItem>
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
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardContent className="p-0">
              {isLoadingProducts ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="text-lg font-medium text-slate-700 mb-1">No products found</h3>
                  <p className="text-slate-500 mb-4">
                    {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Add your first product to get started'}
                  </p>
                  {!(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
                    <Button onClick={() => setIsProductFormOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-3 text-left font-medium text-slate-500">Product</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">Category</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">SKU</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">Quantity</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">Location</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">Shelf</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">Price</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">Expiry Date</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => {
                        const expiryStatus = getExpiryStatus(product.expiryDate);
                        return (
                          <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-slate-500 text-xs">{product.drugName}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {product.category}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs">{product.sku}</td>
                            <td className="px-4 py-3">
                              {product.quantity} {product.unitOfMeasure}
                            </td>
                            <td className="px-4 py-3 text-slate-600 text-xs">
                              {product.location || '-'}
                            </td>
                            <td className="px-4 py-3 text-slate-600 text-xs">
                              {product.shelf || '-'}
                            </td>
                            <td className="px-4 py-3 font-medium">
                              {formatCurrency(product.sellingPrice)}
                            </td>
                            <td className="px-4 py-3">
                              {product.expiryDate ? (
                                <div className="flex items-center">
                                  <span className={expiryStatus?.status === 'expired' ? 'text-red-500' : 
                                                 expiryStatus?.status === 'near-expiry' ? 'text-orange-700' : ''}>
                                    {formatDate(product.expiryDate)}
                                  </span>
                                  {expiryStatus && (
                                    <span className={`ml-2 text-xs ${expiryStatus.status === 'expired' ? 'text-red-500' : 
                                                 expiryStatus.status === 'near-expiry' ? 'text-orange-700' : ''}`}>
                                      {expiryStatus.status === 'expired' ? 
                                        `(Expired ${expiryStatus.days} days ago)` : 
                                        `(Expires in ${expiryStatus.days} days)`}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleCreateLabel(product)}>
                                    <Tag className="h-4 w-4 mr-2" />
                                    Create Label
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => handleDeleteProduct(product)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Manage product categories used in inventory and sales
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
                      {isLoadingCategories ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center">
                            Loading categories...
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
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => openEditDialog(category)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => openDeleteDialog(category)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
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
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {addCategoryMutation.isPending ? 'Adding...' : 'Add Category'}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Category Confirmation Dialog */}
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

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Make changes to the category details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4">
              <div>
                <label htmlFor="edit-category-name" className="text-sm font-medium">
                  Category Name
                </label>
                <Input
                  id="edit-category-name"
                  value={categoryToEdit?.name || ''}
                  onChange={(e) => setCategoryToEdit(prev => 
                    prev ? { ...prev, name: e.target.value } : null
                  )}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="edit-category-description" className="text-sm font-medium">
                  Description (optional)
                </label>
                <Textarea
                  id="edit-category-description"
                  value={categoryToEdit?.description || ''}
                  onChange={(e) => setCategoryToEdit(prev => 
                    prev ? { ...prev, description: e.target.value } : null
                  )}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={updateCategoryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCategory}
              disabled={updateCategoryMutation.isPending || !categoryToEdit?.name}
            >
              {updateCategoryMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Form Dialog */}
      <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <ProductForm onSuccess={() => setIsProductFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;