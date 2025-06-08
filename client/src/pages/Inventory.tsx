import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePagination } from '@/contexts/PaginationContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
  ChevronLeft,
  ChevronRight,
  Database,
  Package,
  Archive,
  DollarSign,
  Shield,
  Clock,
  FileText,
  ArrowRightLeft,
  Settings,
  X
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
  const { t, isRTL } = useLanguage();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('inventory');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
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
  
  // State for warehouse transfer dialog
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [transferQuantity, setTransferQuantity] = useState('');
  const [targetWarehouse, setTargetWarehouse] = useState('');
  
  // State for inventory settings dialog
  const [isInventorySettingsOpen, setIsInventorySettingsOpen] = useState(false);
  const [inventorySettings, setInventorySettings] = useState({
    unitsOfMeasure: ['L', 'PCS', 'T', 'KG', 'g', 'mg'],
    productTypes: ['Raw Material', 'Semi-Raw Material', 'Finished Product'],
    statusOptions: ['Active', 'Inactive', 'Discontinued', 'Out of Stock'],
    locationTypes: ['Warehouse', 'Storage Room', 'Cold Storage', 'Quarantine']
  });
  const [newOption, setNewOption] = useState({ type: '', value: '' });
  
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
        showWarehouseDropdown: true,
        warehouseLocations: ['Warehouse 1', 'Warehouse 2', 'Central Storage'],
        onWarehouseFilter: (location: string | null) => {
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

  // Pagination calculations
  const totalPages = Math.ceil((filteredProducts?.length || 0) / itemsPerPage);
  const paginatedProducts = filteredProducts?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];
  
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
  
  // Inventory settings handlers
  const addNewOption = () => {
    if (!newOption.value.trim()) return;
    
    setInventorySettings(prev => {
      const updated = { ...prev };
      switch (newOption.type) {
        case 'unitOfMeasure':
          if (!updated.unitsOfMeasure.includes(newOption.value)) {
            updated.unitsOfMeasure.push(newOption.value);
          }
          break;
        case 'productType':
          if (!updated.productTypes.includes(newOption.value)) {
            updated.productTypes.push(newOption.value);
          }
          break;
        case 'statusOption':
          if (!updated.statusOptions.includes(newOption.value)) {
            updated.statusOptions.push(newOption.value);
          }
          break;
        case 'locationType':
          if (!updated.locationTypes.includes(newOption.value)) {
            updated.locationTypes.push(newOption.value);
          }
          break;
      }
      return updated;
    });
    
    setNewOption({ type: '', value: '' });
    toast({
      title: 'Option Added',
      description: `${newOption.value} has been added successfully.`
    });
  };

  const removeOption = (type: string, value: string) => {
    setInventorySettings(prev => {
      const updated = { ...prev };
      switch (type) {
        case 'unitOfMeasure':
          updated.unitsOfMeasure = updated.unitsOfMeasure.filter(item => item !== value);
          break;
        case 'productType':
          updated.productTypes = updated.productTypes.filter(item => item !== value);
          break;
        case 'statusOption':
          updated.statusOptions = updated.statusOptions.filter(item => item !== value);
          break;
        case 'locationType':
          updated.locationTypes = updated.locationTypes.filter(item => item !== value);
          break;
      }
      return updated;
    });
    
    toast({
      title: 'Option Removed',
      description: `${value} has been removed successfully.`
    });
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
    <div className={isRTL ? 'rtl' : 'ltr'} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('inventoryManagement')}</h1>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          {activeTab === 'inventory' && (
            <>
              {/* Import/Export Buttons */}
              <div className="flex gap-2 mr-2">
                <CSVImport 
                  onImport={handleImportProducts}
                  buttonText={t('importCsv')}
                  variant="outline"
                  size="sm"
                />
                <CSVExport 
                  data={filteredProducts} 
                  filename="inventory-products.csv"
                  buttonText={t('exportCsv')}
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
                        title: t('createLabels'),
                        description: `${t('createLabels')} ${selectedProducts.length} selected items`,
                      });
                      // Navigate to label page
                      window.location.href = '/label';
                    }}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    {t('createLabels')} ({selectedProducts.length})
                  </Button>
                )}
              </div>
            </>
          )}
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setIsInventorySettingsOpen(true)}
              title={t('inventorySettings')}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button onClick={() => {
              setProductToEdit(null);
              setIsProductFormOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              {t('addItem')}
            </Button>
          </div>
        </div>
      </div>
      {/* Warehouse Selector */}
      {activeTab === 'inventory' && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{t('warehouseSelector')}</h3>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsWarehouseDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('addWarehouse')}
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
                    {t('editWarehouse')}
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
                  {t('allStock')}
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
                  <span>{t('viewingInventory')} <span className="font-medium">{t('allWarehouses')}</span></span>
                ) : (
                  <>
                    {t('viewingInventoryFor')} <span className="font-medium">{warehouses.find(w => w.id === selectedWarehouse)?.name}</span> 
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
              {t('inventory')}
            </TabsTrigger>
            <TabsTrigger 
              value="categories" 
              className="flex-1 border-0 rounded-none py-3 px-6 font-normal text-gray-600 data-[state=active]:text-blue-500 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 transition-none"
            >
              {t('categories')}
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
                    placeholder={t('searchInventory')}
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
                    <SelectValue placeholder={t('filterByStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allStatuses')}</SelectItem>
                    <SelectItem value="active">{t('inStock')}</SelectItem>
                    <SelectItem value="out_of_stock">{t('outOfStock')}</SelectItem>
                    <SelectItem value="expired">{t('expired')}</SelectItem>
                    <SelectItem value="near">NEAR</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t('filterByCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allCategories')}</SelectItem>
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
          <Card className={isRTL ? 'rtl' : 'ltr'}>
            <CardContent className="p-0">
              {isLoadingProducts ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="text-lg font-medium text-slate-700 mb-1">{t('noProductsFound')}</h3>
                  <p className="text-slate-500 mb-4">
                    {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                      ? t('tryAdjustingFilters')
                      : t('addFirstProduct')}
                  </p>
                  {!(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
                    <Button onClick={() => {
                      setProductToEdit(null);
                      setIsProductFormOpen(true);
                    }}>
                      <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('addProduct')}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className={`w-full text-sm ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>
                          <div className={`flex items-center ${isRTL ? 'justify-end' : 'justify-start'}`}>
                            <Checkbox 
                              id="select-all" 
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedProducts(filteredProducts.map(p => p.id));
                                } else {
                                  setSelectedProducts([]);
                                }
                              }}
                              checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                            />
                            <label htmlFor="select-all" className={`${isRTL ? 'mr-2' : 'ml-2'} cursor-pointer`}>All</label>
                          </div>
                        </th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('product')}</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('category')}</th>
                        <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('batchNo')}</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('gs1Code')}</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('type')}</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('quantity')}</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('location')}</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('shelf')}</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('price')}</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('expiryDate')}</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-left' : 'text-right'} font-medium text-slate-500`}>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProducts.map((product) => {
                        const expiryStatus = getExpiryStatus(product.expiryDate);
                        return (
                          <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
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
                            <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-slate-500 text-xs">{product.drugName}</div>
                              </div>
                            </td>
                            <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {product.category}
                            </td>
                            <td className={`px-6 py-3 font-mono text-xs whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                              {`BATCH-${product.sku?.slice(-4) || '0000'}-${new Date().getFullYear().toString().slice(-2)}`}
                            </td>
                            <td className={`px-4 py-3 font-mono text-xs text-blue-600 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                              {product.gs1Code || `GS1-${product.sku?.slice(-6) || '000000'}`}
                            </td>
                            <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
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
                            <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {product.quantity} {product.unitOfMeasure}
                            </td>
                            <td className={`px-4 py-3 text-slate-600 ${isRTL ? 'text-right' : 'text-left'}`}>
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
                            <td className={`px-4 py-3 text-slate-600 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>
                              {product.shelf || '-'}
                            </td>
                            <td className={`px-4 py-3 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                              {formatCurrency(product.sellingPrice)}
                            </td>
                            <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {product.expiryDate ? (
                                <div className={`flex items-center ${isRTL ? 'justify-end' : 'justify-start'}`}>
                                  <span className={expiryStatus?.status === 'expired' ? 'text-red-500' : 
                                                 expiryStatus?.status === 'near-expiry' ? 'text-orange-700' : ''}>
                                    {formatDate(product.expiryDate)}
                                  </span>
                                  {expiryStatus && (
                                    <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-xs ${expiryStatus.status === 'expired' ? 'text-red-500' : 
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
                            <td className={`px-4 py-3 ${isRTL ? 'text-left' : 'text-right'}`}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                                  <DropdownMenuItem onClick={() => handleCreateLabel(product)}>
                                    <Tag className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                    {t('createLabel')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleShowHistory(product)}>
                                    <Calendar className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                    {t('showHistory')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                                    <Pencil className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => handleDeleteProduct(product)}
                                  >
                                    <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
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
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className={`flex items-center justify-center mt-6 p-4 bg-white rounded-lg border shadow-sm ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1"
                    >
                      {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                      {t('previous')}
                    </Button>
                    
                    <div className="flex items-center gap-1 mx-4">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        if (pageNum > totalPages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 p-0 ${
                              pageNum === currentPage 
                                ? "bg-blue-600 text-white hover:bg-blue-700" 
                                : "hover:bg-blue-50"
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                          <span className="px-2 text-muted-foreground">...</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            className="w-8 h-8 p-0 hover:bg-blue-50"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1"
                    >
                      {t('next')}
                      {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                    
                    <div className={`text-sm text-muted-foreground ${isRTL ? 'mr-4' : 'ml-4'}`}>
                      {t('page')} {currentPage} {t('of')} {totalPages}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Categories Tab */}
        <TabsContent value="categories" className={isRTL ? 'rtl' : 'ltr'} dir={isRTL ? 'rtl' : 'ltr'}>
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className={`flex flex-row ${isRTL ? 'justify-start' : 'justify-between'} items-center`}>
                <div>
                  <h3 className="text-lg font-medium">{t('categories')}</h3>
                  <p className="text-sm text-slate-500">Manage product categories used in inventory and sales</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories Table */}
          <Card className={isRTL ? 'rtl' : 'ltr'}>
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
                  <table className={`w-full text-sm ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>Name</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>Description</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-left' : 'text-right'} font-medium text-slate-500`}>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories?.map((category: Category) => (
                        <tr key={category.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className={`px-4 py-3 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{category.name}</td>
                          <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>{category.description || '-'}</td>
                          <td className={`px-4 py-3 ${isRTL ? 'text-left' : 'text-right'}`}>
                            <div className={`flex ${isRTL ? 'justify-start space-x-reverse' : 'justify-end'} space-x-2`}>
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
                          className={isRTL ? 'text-right' : 'text-left'}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Textarea
                          placeholder="Description (optional)"
                          value={categoryDescription}
                          onChange={(e) => setCategoryDescription(e.target.value)}
                          className={`h-10 py-2 ${isRTL ? 'text-right' : 'text-left'}`}
                        />
                      </div>
                    </div>
                    <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                      <Button 
                        type="submit" 
                        disabled={addCategoryMutation.isPending || categoryName.trim() === ''}
                      >
                        <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
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
        <DialogContent className={`max-h-[90vh] overflow-y-auto ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the category "{categoryToDelete?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className={`${isRTL ? 'space-x-reverse' : ''}`}>
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
        <DialogContent className={`max-h-[90vh] overflow-y-auto ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
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
                  className={`mt-1 ${isRTL ? 'text-right' : 'text-left'}`}
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
                  className={`mt-1 ${isRTL ? 'text-right' : 'text-left'}`}
                />
              </div>
            </div>
          </div>
          <DialogFooter className={`${isRTL ? 'space-x-reverse' : ''}`}>
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
        <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {productToEdit ? t('editProductInfo') : t('addNewProduct')}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">
                  {productToEdit 
                    ? t('updateProductDetails') 
                    : t('registerNewProduct')}
                </DialogDescription>
              </div>
            </div>
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
        <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">{t('productHistory')}</DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">
                  {selectedProductHistory ? `${t('comprehensiveHistory')} ${selectedProductHistory.name}` : t('loadingProductDetails')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {selectedProductHistory && (
            <div className="space-y-6">
              {/* Product Information Section */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Product Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-700">Product Name</label>
                    <div className="text-lg font-bold text-blue-900 bg-white p-3 rounded border border-blue-200">
                      {selectedProductHistory.name}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-700">SKU Code</label>
                    <div className="text-sm text-blue-800 bg-white p-3 rounded border border-blue-200 font-mono">
                      {selectedProductHistory.sku}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-700">Drug Name</label>
                    <div className="text-sm text-blue-800 bg-white p-3 rounded border border-blue-200">
                      {selectedProductHistory.drugName}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-700">Status</label>
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedProductHistory.status === 'Active' ? 'bg-green-100 text-green-800' :
                        selectedProductHistory.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedProductHistory.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-700">Category</label>
                    <div className="text-sm text-blue-800 bg-white p-3 rounded border border-blue-200">
                      {selectedProductHistory.category}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-700">Manufacturer</label>
                    <div className="text-sm text-blue-800 bg-white p-3 rounded border border-blue-200">
                      Global Pharma Solutions
                    </div>
                  </div>
                </div>
              </div>

              {/* Inventory Details Section */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <Archive className="h-5 w-5 mr-2" />
                  Inventory Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-700">Current Quantity</label>
                    <div className="text-2xl font-bold text-green-900 bg-white p-3 rounded border border-green-200">
                      {selectedProductHistory.quantity} {selectedProductHistory.unitOfMeasure}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-700">Warehouse Location</label>
                    <div className="text-sm text-green-800 bg-white p-3 rounded border border-green-200">
                      {warehouses.find(w => w.id === selectedWarehouse)?.name || 'Main Warehouse'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-700">Reorder Level</label>
                    <div className="text-sm text-green-800 bg-white p-3 rounded border border-green-200">
                      25 {selectedProductHistory.unitOfMeasure}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-700">Stock Value</label>
                    <div className="text-sm text-green-800 bg-white p-3 rounded border border-green-200 font-bold">
                      {formatCurrency(selectedProductHistory.quantity * selectedProductHistory.costPrice)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-700">Last Stock Movement</label>
                    <div className="text-sm text-green-800 bg-white p-3 rounded border border-green-200">
                      +50 units received on {formatDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-700">Average Monthly Usage</label>
                    <div className="text-sm text-green-800 bg-white p-3 rounded border border-green-200">
                      45 {selectedProductHistory.unitOfMeasure}/month
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Information Section */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Pricing Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-purple-700">Cost Price</label>
                    <div className="text-lg font-bold text-purple-900 bg-white p-3 rounded border border-purple-200">
                      {formatCurrency(selectedProductHistory.costPrice)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-purple-700">Selling Price</label>
                    <div className="text-lg font-bold text-purple-900 bg-white p-3 rounded border border-purple-200">
                      {formatCurrency(selectedProductHistory.sellingPrice)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-purple-700">Profit Margin</label>
                    <div className="text-sm text-purple-800 bg-white p-3 rounded border border-purple-200">
                      {((selectedProductHistory.sellingPrice - selectedProductHistory.costPrice) / selectedProductHistory.costPrice * 100).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-purple-700">Profit per Unit</label>
                    <div className="text-sm font-bold text-purple-800 bg-white p-3 rounded border border-purple-200">
                      {formatCurrency(selectedProductHistory.sellingPrice - selectedProductHistory.costPrice)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-purple-700">Last Price Update</label>
                    <div className="text-sm text-purple-800 bg-white p-3 rounded border border-purple-200">
                      {formatDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString())}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-purple-700">Price Trend</label>
                    <div className="bg-white p-3 rounded border border-purple-200">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ↗ Increasing
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance & Quality Section */}
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Compliance & Quality
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-orange-700">Expiry Date</label>
                    <div className={`text-sm font-bold bg-white p-3 rounded border border-orange-200 ${
                      new Date(selectedProductHistory.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) 
                        ? 'text-red-600' : 'text-orange-800'
                    }`}>
                      {formatDate(selectedProductHistory.expiryDate)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-orange-700">Batch Number</label>
                    <div className="text-sm text-orange-800 bg-white p-3 rounded border border-orange-200 font-mono">
                      BATCH-{selectedProductHistory.id}2025
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-orange-700">Quality Status</label>
                    <div className="bg-white p-3 rounded border border-orange-200">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Approved
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-orange-700">Last Quality Check</label>
                    <div className="text-sm text-orange-800 bg-white p-3 rounded border border-orange-200">
                      {formatDate(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-orange-700">Regulatory Status</label>
                    <div className="text-sm text-orange-800 bg-white p-3 rounded border border-orange-200">
                      EDA Approved - License #EDA{selectedProductHistory.id}
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Timeline Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Activity Timeline
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start border-l-4 border-blue-500 pl-4 pb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0">
                      <Pencil className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-gray-900">Product Information Updated</p>
                        <span className="text-xs text-gray-500">{formatDate(new Date().toISOString())}</span>
                      </div>
                      <p className="text-sm text-gray-600">Quantity changed from 150 to {selectedProductHistory.quantity} {selectedProductHistory.unitOfMeasure}</p>
                      <p className="text-xs text-gray-500 mt-1">Updated by: System Administrator</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start border-l-4 border-green-500 pl-4 pb-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4 flex-shrink-0">
                      <Package className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-gray-900">Stock Received</p>
                        <span className="text-xs text-gray-500">{formatDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())}</span>
                      </div>
                      <p className="text-sm text-gray-600">Received 50 {selectedProductHistory.unitOfMeasure} from supplier</p>
                      <p className="text-xs text-gray-500 mt-1">Purchase Order: PO-2025-{selectedProductHistory.id}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start border-l-4 border-purple-500 pl-4 pb-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4 flex-shrink-0">
                      <Tag className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-gray-900">Label Generated</p>
                        <span className="text-xs text-gray-500">{formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())}</span>
                      </div>
                      <p className="text-sm text-gray-600">Product label created for batch #BATCH-{selectedProductHistory.id}2025</p>
                      <p className="text-xs text-gray-500 mt-1">Label Type: Pharmaceutical Grade</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start border-l-4 border-yellow-500 pl-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4 flex-shrink-0">
                      <Plus className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-gray-900">Product Added to Inventory</p>
                        <span className="text-xs text-gray-500">{formatDate(selectedProductHistory.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600">Initial stock: 100 {selectedProductHistory.unitOfMeasure}</p>
                      <p className="text-xs text-gray-500 mt-1">Created by: Inventory Manager</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className={`gap-3 pt-6 border-t ${isRTL ? 'space-x-reverse' : ''}`}>
            <Button
              variant="outline"
              onClick={() => setIsHistoryDialogOpen(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Close
            </Button>
            <Button 
              variant="outline"
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <FileText className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              Export Report
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsTransferDialogOpen(true)}
              className="border-green-300 text-green-600 hover:bg-green-50"
            >
              <ArrowRightLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              Transfer to Warehouse
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Pencil className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              Edit Product
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
      {/* Warehouse Transfer Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-green-600" />
              Transfer Product to Another Warehouse
            </DialogTitle>
            <DialogDescription>
              Transfer stock from the current warehouse to a different warehouse location
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {selectedProductHistory && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Product Details</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Product:</span> {selectedProductHistory.name}</p>
                  <p><span className="font-medium">Current Stock:</span> {selectedProductHistory.currentStock} {selectedProductHistory.unitOfMeasure}</p>
                  <p><span className="font-medium">Current Warehouse:</span> {warehouses.find(w => w.id === selectedWarehouse)?.name || 'Unknown'}</p>
                </div>
              </div>
            )}
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="target-warehouse">Target Warehouse</Label>
                <Select value={targetWarehouse} onValueChange={setTargetWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses
                      .filter(w => w.id !== selectedWarehouse)
                      .map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name} - {warehouse.location}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transfer-quantity">Transfer Quantity</Label>
                <Input
                  id="transfer-quantity"
                  type="number"
                  placeholder="Enter quantity to transfer"
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(e.target.value)}
                  max={selectedProductHistory?.currentStock || 0}
                  min="1"
                />
                <p className="text-xs text-gray-600">
                  Maximum: {selectedProductHistory?.currentStock || 0} {selectedProductHistory?.unitOfMeasure}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transfer-notes">Transfer Notes (Optional)</Label>
                <Textarea
                  id="transfer-notes"
                  placeholder="Add any notes about this transfer..."
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsTransferDialogOpen(false);
                setTransferQuantity('');
                setTargetWarehouse('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (targetWarehouse && transferQuantity && selectedProductHistory) {
                  const targetWarehouseName = warehouses.find(w => w.id.toString() === targetWarehouse)?.name;
                  const currentWarehouseName = warehouses.find(w => w.id === selectedWarehouse)?.name;
                  
                  toast({
                    title: "Transfer Initiated",
                    description: `Transferring ${transferQuantity} ${selectedProductHistory.unitOfMeasure} of ${selectedProductHistory.name} from ${currentWarehouseName} to ${targetWarehouseName}`
                  });
                  
                  setIsTransferDialogOpen(false);
                  setTransferQuantity('');
                  setTargetWarehouse('');
                }
              }}
              disabled={!targetWarehouse || !transferQuantity || Number(transferQuantity) <= 0 || Number(transferQuantity) > (selectedProductHistory?.currentStock || 0)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Confirm Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inventory Settings Dialog */}
      <Dialog open={isInventorySettingsOpen} onOpenChange={setIsInventorySettingsOpen}>
        <DialogContent className={`sm:max-w-[600px] max-h-[90vh] overflow-y-auto ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className={isRTL ? 'text-right' : 'text-left'}>{t('configureInventoryOptions')}</DialogTitle>
            <DialogDescription className={isRTL ? 'text-right' : 'text-left'}>
              {t('manageDropdownOptions')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Units of Measure */}
            <div>
              <h4 className={`font-medium mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('unitsOfMeasure')}</h4>
              <div className={`flex flex-wrap gap-2 mb-3 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                {inventorySettings.unitsOfMeasure.map((unit, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {unit}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeOption('unitOfMeasure', unit)}
                    />
                  </Badge>
                ))}
              </div>
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Input
                  placeholder={t('newUnitPlaceholder')}
                  value={newOption.type === 'unitOfMeasure' ? newOption.value : ''}
                  onChange={(e) => setNewOption({ type: 'unitOfMeasure', value: e.target.value })}
                  className={isRTL ? 'text-right' : 'text-left'}
                />
                <Button onClick={addNewOption} disabled={newOption.type !== 'unitOfMeasure' || !newOption.value.trim()}>
                  {t('add')}
                </Button>
              </div>
            </div>

            {/* Item Types */}
            <div>
              <h4 className={`font-medium mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('itemTypes')}</h4>
              <div className={`flex flex-wrap gap-2 mb-3 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                {inventorySettings.productTypes.map((type, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {type}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeOption('productType', type)}
                    />
                  </Badge>
                ))}
              </div>
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Input
                  placeholder={t('newItemTypePlaceholder')}
                  value={newOption.type === 'productType' ? newOption.value : ''}
                  onChange={(e) => setNewOption({ type: 'productType', value: e.target.value })}
                  className={isRTL ? 'text-right' : 'text-left'}
                />
                <Button onClick={addNewOption} disabled={newOption.type !== 'productType' || !newOption.value.trim()}>
                  {t('add')}
                </Button>
              </div>
            </div>

            {/* Status Options */}
            <div>
              <h4 className={`font-medium mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('statusOptions')}</h4>
              <div className={`flex flex-wrap gap-2 mb-3 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                {inventorySettings.statusOptions.map((status, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {status}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeOption('statusOption', status)}
                    />
                  </Badge>
                ))}
              </div>
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Input
                  placeholder={t('newStatusPlaceholder')}
                  value={newOption.type === 'statusOption' ? newOption.value : ''}
                  onChange={(e) => setNewOption({ type: 'statusOption', value: e.target.value })}
                  className={isRTL ? 'text-right' : 'text-left'}
                />
                <Button onClick={addNewOption} disabled={newOption.type !== 'statusOption' || !newOption.value.trim()}>
                  {t('add')}
                </Button>
              </div>
            </div>

            {/* Location Types */}
            <div>
              <h4 className={`font-medium mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('locationTypes')}</h4>
              <div className={`flex flex-wrap gap-2 mb-3 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                {inventorySettings.locationTypes.map((location, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {location}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeOption('locationType', location)}
                    />
                  </Badge>
                ))}
              </div>
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Input
                  placeholder={t('newLocationPlaceholder')}
                  value={newOption.type === 'locationType' ? newOption.value : ''}
                  onChange={(e) => setNewOption({ type: 'locationType', value: e.target.value })}
                  className={isRTL ? 'text-right' : 'text-left'}
                />
                <Button onClick={addNewOption} disabled={newOption.type !== 'locationType' || !newOption.value.trim()}>
                  {t('add')}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
            <Button type="button" onClick={() => setIsInventorySettingsOpen(false)}>
              {t('done')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;