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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Product } from '@shared/schema';
import { formatCurrency, formatDate } from '@/lib/utils';
import ProductForm from '@/components/inventory/ProductForm';
import { Filter, MoreHorizontal, Pencil, Plus, Tag, Trash, Trash2 } from 'lucide-react';

// Define Category type
type Category = {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
};

const NewInventory = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Fetch products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });
  
  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  // Category mutations
  const addCategoryMutation = useMutation({
    mutationFn: async (newCategory: { name: string; description?: string }) => {
      const response = await apiRequest('POST', '/api/categories', newCategory);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setCategoryName('');
      setCategoryDescription('');
      toast({
        title: "Category added",
        description: "The category has been successfully added."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add category: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      await apiRequest('DELETE', `/api/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      toast({
        title: "Category deleted",
        description: "The category has been successfully deleted."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete category: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Product mutations
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest('DELETE', `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Handler functions
  const handleAddCategory = (event: React.FormEvent) => {
    event.preventDefault();
    if (categoryName.trim() === '') return;
    
    addCategoryMutation.mutate({ 
      name: categoryName, 
      description: categoryDescription || undefined 
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

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setIsProductFormOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      deleteProductMutation.mutate(product.id);
    }
  };

  const handleCreateLabel = (product: Product) => {
    // To be implemented
    toast({
      title: "Create Label",
      description: `Creating label for ${product.name}`
    });
  };

  // Helper function for expiry date status
  const calculateExpiryStatus = (expiryDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiryDay = new Date(expiryDate);
    expiryDay.setHours(0, 0, 0, 0);
    
    const diffTime = expiryDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: 'expired', days: Math.abs(diffDays) };
    } else if (diffDays <= 30) {
      return { status: 'near-expiry', days: diffDays };
    } else {
      return { status: 'valid', days: diffDays };
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    // Filter by search query
    const matchesSearch = 
      searchQuery === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.drugName && product.drugName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by status
    const lowStockThreshold = product.lowStockThreshold || 10; // Default to 10 if not specified
    
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "expired" && product.expiryDate && new Date(product.expiryDate) < new Date()) ||
      (selectedStatus === "near" && product.quantity <= lowStockThreshold) ||
      (selectedStatus === "out_of_stock" && product.quantity <= 0) ||
      (selectedStatus === "active" && 
        product.quantity > 0 && 
        product.quantity > lowStockThreshold && 
        (!product.expiryDate || new Date(product.expiryDate) > new Date()));
    
    // Filter by category
    const matchesCategory =
      selectedCategory === "all" ||
      (product.categoryId !== null && product.categoryId.toString() === selectedCategory);
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Find category name by id
  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return "-";
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "-";
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <Button onClick={() => {
          setProductToEdit(null);
          setIsProductFormOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>
      
      <Tabs defaultValue="inventory">
        <TabsList className="w-full bg-white border-b">
          <TabsTrigger value="inventory" className="flex-1">Inventory</TabsTrigger>
          <TabsTrigger value="categories" className="flex-1">Categories</TabsTrigger>
        </TabsList>
        
        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>
                Manage your inventory products, track stock levels and expiry dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="w-full md:w-64">
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <div className="flex items-center">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="All Statuses" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      <SelectItem value="near">Low Stock</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-64">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <div className="flex items-center">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="All Categories" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Products Table */}
              {isLoadingProducts ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">Loading products...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">No products found. Add your first product using the button above.</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-50">
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Product</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Category</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">SKU</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Quantity</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Location</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Shelf</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Price</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Expiry Date</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => {
                        const expiryStatus = product.expiryDate 
                          ? calculateExpiryStatus(new Date(product.expiryDate))
                          : null;
                          
                        return (
                          <tr key={product.id} className="border-b">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-gray-500">{product.drugName}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {getCategoryName(product.categoryId)}
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
                              {formatCurrency(parseFloat(product.sellingPrice))}
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
                      ) : categories.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-gray-500">
                            No categories found. Add your first category below.
                          </td>
                        </tr>
                      ) : (
                        categories.map((category) => (
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

      {/* Product Form Dialog */}
      <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{productToEdit ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <ProductForm 
            productId={productToEdit?.id} 
            onSuccess={() => setIsProductFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewInventory;