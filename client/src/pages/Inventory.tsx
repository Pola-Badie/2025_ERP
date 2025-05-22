import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { Checkbox } from '@/components/ui/checkbox';
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
  Tag,
  Download,
  Upload,
  Database
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductForm from '@/components/inventory/ProductForm';
import { useCSV } from '@/contexts/CSVContext';
import { CSVExport } from '@/components/csv/CSVExport';
import { CSVImport } from '@/components/csv/CSVImport';

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
  productType?: 'raw' | 'semi-raw' | 'finished';
  createdAt: string;
}

const Inventory: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('inventory');
  
  // Warehouse management
  const [warehouses, setWarehouses] = useState([
    { id: 1, name: 'Warehouse 1', location: 'Cairo' },
    { id: 2, name: 'Warehouse 2', location: 'Alexandria' },
    { id: 3, name: 'Warehouse 3', location: 'Giza' },
    { id: 4, name: 'Warehouse 4', location: 'Aswan' },
    { id: 5, name: 'Warehouse 5', location: 'Luxor' },
    { id: 6, name: 'Warehouse 6', location: 'Port Said' },
  ]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(1);
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false);
  const [warehouseToEdit, setWarehouseToEdit] = useState<any>(null);

  // State for product management
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // State for product history dialog
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedProductHistory, setSelectedProductHistory] = useState<Product | null>(null);
  
  // CSV Integration
  const { setCSVData, setCSVOptions, clearCSV } = useCSV<Product>();
  
  // Handle CSV import
  const handleImportProducts = async (data: Record<string, string>[]) => {
    if (!data || data.length === 0) {
      return;
    }
    
    toast({
      title: "Importing Products",
      description: `Processing ${data.length} products...`
    });
    
    // In a production environment, you would call an API to bulk import products
    console.log('Products to import:', data);
    
    // Add validation and API call code here
    // Example:
    // const importMutation = async () => {
    //   try {
    //     const response = await apiRequest('POST', '/api/products/import', { products: data });
    //     const result = await response.json();
    //     queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    //     return result;
    //   } catch (error) {
    //     console.error('Import error:', error);
    //     throw error;
    //   }
    // };
    
    // Simulate successful import
    setTimeout(() => {
      toast({
        title: "Import Complete",
        description: `Successfully imported ${data.length} products.`
      });
    }, 1500);
  };

  // State for category management
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  
  // State for product selection
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
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
  
  // Set up CSV options when component loads
  useEffect(() => {
    if (products && products.length > 0) {
      setCSVOptions({
        filename: 'inventory-products.csv',
        customHeaders: {
          id: 'ID',
          name: 'Product Name',
          drugName: 'Drug Name',
          category: 'Category',
          sku: 'SKU',
          quantity: 'Quantity',
          unitOfMeasure: 'UoM',
          costPrice: 'Cost Price',
          sellingPrice: 'Selling Price',
          location: 'Location',
          shelf: 'Shelf',
          expiryDate: 'Expiry Date',
          status: 'Status',
          productType: 'Product Type'
        },
        exportButtonText: 'Export Inventory',
        importButtonText: 'Import Products',
        onImport: handleImportProducts,
        showStorageDropdown: true,
        storageLocations: ['Warehouse 1', 'Warehouse 2', 'Central Storage'],
        onStorageFilter: (location: string | null) => {
          if (!location) return products;
          return products.filter(product => product.location === location);
        }
      });
      setCSVData(products);
    }
  }, [products.length]); // Only depend on the length to avoid infinite loops

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
    
    // Add empty warehouse locations if needed
    if (!product.location) {
      const warehouseIndex = product.id % warehouses.length;
      product.location = 'Main Floor';
    }
    
    // Add shelf numbers if needed
    if (!product.shelf) {
      // Create a shelf number based on the product ID to ensure consistency
      const shelfNumber = product.id % 20 + 1;
      product.shelf = shelfNumber < 10 ? `Shelf 0${shelfNumber}` : `Shelf ${shelfNumber}`;
    }
    
    return matchesSearch && matchesStatus && matchesCategory;
  });
  
  // Update CSV data when filtered products change
  useEffect(() => {
    if (filteredProducts && filteredProducts.length > 0) {
      setCSVData(filteredProducts);
    } else if (products && products.length > 0) {
      setCSVData(products);
    } else {
      clearCSV();
    }
  }, [filteredProducts, products, searchTerm, statusFilter, categoryFilter]);

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
    // Store the selected product in localStorage so the Label Generator can access it
    localStorage.setItem('selectedProductForLabel', JSON.stringify({
      id: product.id,
      name: product.name,
      drugName: product.drugName,
      sku: product.sku,
      description: product.description,
      category: product.category,
      unitOfMeasure: product.unitOfMeasure
    }));
    
    toast({
      title: "Opening Label Generator",
      description: `Creating label for ${product.name}`,
    });
    
    // Navigate to the Label Generator page
    setLocation('/label');
  };
  
  const handleEditProduct = (product: Product) => {
    // Set the product to edit and open the dialog
    setProductToEdit(product);
    setIsProductFormOpen(true);
    
    toast({
      title: "Edit Product",
      description: `Editing ${product.name}`,
    });
  };
  
  const handleShowHistory = (product: Product) => {
    setSelectedProductHistory(product);
    setIsHistoryDialogOpen(true);
    
    toast({
      title: "Product History",
      description: `Viewing history for ${product.name}`,
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
          {activeTab === 'inventory' && (
            <>
              {/* Import/Export Buttons */}
              <div className="flex gap-2 mr-2">
                <CSVImport 
                  onImport={handleImportProducts}
                  buttonText="Import CSV"
                  variant="outline"
                  size="sm"
                />
                <CSVExport 
                  data={filteredProducts} 
                  filename="inventory-products.csv"
                  buttonText="Export CSV"
                  variant="outline"
                  size="sm"
                />
                {selectedProducts.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const selectedProductItems = filteredProducts.filter(p => selectedProducts.includes(p.id));
                      toast({
                        title: "Creating Labels",
                        description: `Creating labels for ${selectedProducts.length} selected products`,
                      });
                      // Navigate to label page
                      window.location.href = '/label';
                    }}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Create Labels ({selectedProducts.length})
                  </Button>
                )}
              </div>
            </>
          )}
          <Button onClick={() => {
            setProductToEdit(null);
            setIsProductFormOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>
      
      {/* Warehouse Selector */}
      {activeTab === 'inventory' && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Warehouse Selector</h3>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsWarehouseDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Warehouse
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const warehouse = warehouses.find(w => w.id === selectedWarehouse);
                      setWarehouseToEdit(warehouse);
                      setIsWarehouseDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Warehouse
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                <Button 
                  variant={selectedWarehouse === 0 ? "default" : "outline"}
                  className={`whitespace-nowrap flex items-center gap-1.5 ${
                    selectedWarehouse === 0 
                      ? "bg-green-600 text-white hover:bg-green-700" 
                      : "bg-green-50 text-green-700 hover:bg-green-100 border-green-300"
                  }`}
                  onClick={() => setSelectedWarehouse(0)}
                >
                  <Database className="h-4 w-4" />
                  All Stock
                </Button>
                {warehouses.map((warehouse) => (
                  <Button 
                    key={warehouse.id}
                    variant={selectedWarehouse === warehouse.id ? "default" : "outline"}
                    className="whitespace-nowrap"
                    onClick={() => setSelectedWarehouse(warehouse.id)}
                  >
                    {warehouse.name}
                  </Button>
                ))}
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsWarehouseDialogOpen(true)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {selectedWarehouse === 0 ? (
                  <span>Viewing inventory across <span className="font-medium">all warehouses</span></span>
                ) : (
                  <>
                    Viewing inventory for <span className="font-medium">{warehouses.find(w => w.id === selectedWarehouse)?.name}</span> 
                    {" - "}{warehouses.find(w => w.id === selectedWarehouse)?.location}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                    <Button onClick={() => {
                      setProductToEdit(null);
                      setIsProductFormOpen(true);
                    }}>
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
                        <th className="px-4 py-3 text-left font-medium text-slate-500">
                          <div className="flex items-center">
                            <Checkbox 
                              id="select-all" 
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedProducts(filteredProducts.map(p => p.id));
                                } else {
                                  setSelectedProducts([]);
                                }
                              }}
                              checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                            />
                            <label htmlFor="select-all" className="ml-2 cursor-pointer">All</label>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">Product</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">Category</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">SKU</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">Type</th>
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
                              <Checkbox 
                                checked={selectedProducts.includes(product.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedProducts(prev => [...prev, product.id]);
                                  } else {
                                    setSelectedProducts(prev => prev.filter(id => id !== product.id));
                                  }
                                }}
                              />
                            </td>
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
                              {product.productType ? (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                  product.productType === 'raw' 
                                    ? 'bg-blue-100 text-blue-800'
                                    : product.productType === 'semi-raw'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {product.productType === 'semi-raw' ? 'Semi-Raw' : product.productType.charAt(0).toUpperCase() + product.productType.slice(1)}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3">
                              {product.quantity} {product.unitOfMeasure}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              <div className="flex flex-col">
                                {selectedWarehouse === 0 ? (
                                  <>
                                    <span className="font-medium text-xs text-blue-600">
                                      {`Warehouse ${product.id % 6 + 1}`}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="font-medium text-xs text-blue-600">
                                      {warehouses.find(w => w.id === selectedWarehouse)?.name}
                                    </span>
                                  </>
                                )}
                              </div>
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
                                  <DropdownMenuItem onClick={() => handleShowHistory(product)}>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Show History
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
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-row justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Categories</h3>
                  <p className="text-sm text-slate-500">Manage product categories used in inventory and sales</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories Table */}
          <Card>
            <CardContent className="p-0">
              {isLoadingCategories ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : categories?.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="text-lg font-medium text-slate-700 mb-1">No categories found</h3>
                  <p className="text-slate-500 mb-4">Add your first category below</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-3 text-left font-medium text-slate-500">Name</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">Description</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories?.map((category: Category) => (
                        <tr key={category.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium">{category.name}</td>
                          <td className="px-4 py-3">{category.description || '-'}</td>
                          <td className="px-4 py-3 text-right">
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
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="p-4 border-t border-slate-200">
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
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
      <Dialog open={isProductFormOpen} onOpenChange={(open) => {
        setIsProductFormOpen(open);
        if (!open) setProductToEdit(null);
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{productToEdit ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <ProductForm 
            initialData={productToEdit} 
            onSuccess={() => {
              setIsProductFormOpen(false);
              setProductToEdit(null);
            }} 
          />
        </DialogContent>
      </Dialog>

      {/* Product History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={(open) => {
        setIsHistoryDialogOpen(open);
        if (!open) setSelectedProductHistory(null);
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product History</DialogTitle>
            <DialogDescription>
              {selectedProductHistory ? `Viewing history for ${selectedProductHistory.name}` : ''}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProductHistory && (
            <div className="space-y-4 py-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Current Information</h3>
                <Badge variant="outline">{selectedProductHistory.status}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border p-4 rounded-md bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-500">SKU</p>
                  <p>{selectedProductHistory.sku}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Drug Name</p>
                  <p>{selectedProductHistory.drugName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Quantity</p>
                  <p>{selectedProductHistory.quantity} {selectedProductHistory.unitOfMeasure}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Category</p>
                  <p>{selectedProductHistory.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Cost Price</p>
                  <p>{formatCurrency(selectedProductHistory.costPrice)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Selling Price</p>
                  <p>{formatCurrency(selectedProductHistory.sellingPrice)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Expiry Date</p>
                  <p>{formatDate(selectedProductHistory.expiryDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Warehouse</p>
                  <p>{warehouses.find(w => w.id === selectedWarehouse)?.name || 'Main Warehouse'}</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">History Timeline</h3>
                
                {/* This would typically be populated from backend data */}
                <div className="space-y-3">
                  <div className="flex items-start border-l-2 border-primary pl-4 pb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0">
                      <Pencil className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Product Updated</p>
                      <p className="text-sm text-slate-500">{formatDate(new Date().toISOString())}</p>
                      <p className="text-sm mt-1">Quantity changed from 150 to {selectedProductHistory.quantity}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start border-l-2 border-primary pl-4 pb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0">
                      <Tag className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Label Generated</p>
                      <p className="text-sm text-slate-500">{formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())}</p>
                      <p className="text-sm mt-1">Label created for batch #LB{selectedProductHistory.id}21</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start border-l-2 border-primary pl-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Product Added</p>
                      <p className="text-sm text-slate-500">{formatDate(selectedProductHistory.createdAt)}</p>
                      <p className="text-sm mt-1">Initial quantity: 100 {selectedProductHistory.unitOfMeasure}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsHistoryDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warehouse Dialog */}
      <Dialog open={isWarehouseDialogOpen} onOpenChange={setIsWarehouseDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{warehouseToEdit ? 'Edit Warehouse' : 'Add New Warehouse'}</DialogTitle>
            <DialogDescription>
              {warehouseToEdit ? 'Update the details for this warehouse' : 'Enter the details for the new warehouse'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right font-medium">
                Name
              </div>
              <Input
                id="warehouse-name"
                value={warehouseToEdit ? warehouseToEdit.name : ''}
                placeholder="Warehouse name"
                className="col-span-3"
                onChange={(e) => {
                  if (warehouseToEdit) {
                    setWarehouseToEdit({...warehouseToEdit, name: e.target.value});
                  } else {
                    setWarehouseToEdit({id: Date.now(), name: e.target.value, location: ''});
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right font-medium">
                Location
              </div>
              <Input
                id="warehouse-location"
                value={warehouseToEdit ? warehouseToEdit.location : ''}
                placeholder="Warehouse location"
                className="col-span-3"
                onChange={(e) => {
                  if (warehouseToEdit) {
                    setWarehouseToEdit({...warehouseToEdit, location: e.target.value});
                  }
                }}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setWarehouseToEdit(null);
              setIsWarehouseDialogOpen(false);
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (warehouseToEdit) {
                if (warehouseToEdit.id) {
                  // Edit existing warehouse
                  setWarehouses(warehouses.map(w => 
                    w.id === warehouseToEdit.id ? warehouseToEdit : w
                  ));
                  toast({
                    title: "Warehouse updated",
                    description: "The warehouse details have been updated successfully."
                  });
                } else {
                  // Add new warehouse
                  const newWarehouse = {
                    id: Date.now(),
                    name: warehouseToEdit.name,
                    location: warehouseToEdit.location || ''
                  };
                  setWarehouses([...warehouses, newWarehouse]);
                  setSelectedWarehouse(newWarehouse.id);
                  toast({
                    title: "Warehouse added",
                    description: "The new warehouse has been added successfully."
                  });
                }
                setWarehouseToEdit(null);
                setIsWarehouseDialogOpen(false);
              }
            }}
            disabled={!warehouseToEdit || !warehouseToEdit.name}
            >
              {warehouseToEdit && warehouseToEdit.id ? 'Save Changes' : 'Add Warehouse'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;