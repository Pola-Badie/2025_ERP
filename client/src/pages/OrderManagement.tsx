import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Loader2, 
  Save, 
  Eye, 
  FileText, 
  Edit,
  Trash2,
  Plus,
  PlusCircle,
  X,
  Search,
  Download,
  FileDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { queryClient } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

const OrderManagement = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'create' | 'refining'>('create');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [batchNumber, setBatchNumber] = useState('');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);
  
  // Production order states
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [materialToAdd, setMaterialToAdd] = useState<any>(null);
  const [materialQuantity, setMaterialQuantity] = useState<number>(0);
  const [materialUnitPrice, setMaterialUnitPrice] = useState<string>('0.00');
  const [finalProductDescription, setFinalProductDescription] = useState('');
  
  // Packaging states
  const [packagingItems, setPackagingItems] = useState<any[]>([]);
  const [packagingToAdd, setPackagingToAdd] = useState<any>(null);
  const [packagingQuantity, setPackagingQuantity] = useState<number>(0);
  const [packagingUnitPrice, setPackagingUnitPrice] = useState<string>('0.00');
  const [taxPercentage, setTaxPercentage] = useState<number>(14);
  const [subtotalPrice, setSubtotalPrice] = useState('0.00');
  const [totalPrice, setTotalPrice] = useState('0.00');
  
  // Refining order states
  const [refiningBatchNumber, setRefiningBatchNumber] = useState('');
  const [sourceType, setSourceType] = useState('production');
  const [sourceProductionOrder, setSourceProductionOrder] = useState<string>('');
  const [sourceStockItem, setSourceStockItem] = useState<string>('');
  const [refiningSteps, setRefiningSteps] = useState<string[]>([]);
  const [newRefiningStep, setNewRefiningStep] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [refiningTaxPercentage, setRefiningTaxPercentage] = useState<number>(14);
  const [refiningSubtotal, setRefiningSubtotal] = useState('0.00');
  const [refiningCost, setRefiningCost] = useState('0.00');
  
  // Calculate subtotal and total price (with tax) when raw materials, packaging items, or tax percentage change
  useEffect(() => {
    // Calculate materials cost
    const materialsCost = rawMaterials.reduce((sum, material) => {
      return sum + (material.quantity * parseFloat(material.unitPrice));
    }, 0);
    
    // Calculate packaging cost
    const packagingCost = packagingItems.reduce((sum, item) => {
      return sum + (item.quantity * parseFloat(item.unitPrice));
    }, 0);
    
    // Calculate the total subtotal
    const subtotal = materialsCost + packagingCost;
    setSubtotalPrice(subtotal.toFixed(2));
    
    // Calculate total with tax
    const taxAmount = subtotal * (taxPercentage / 100);
    const total = subtotal + taxAmount;
    setTotalPrice(total.toFixed(2));
  }, [rawMaterials, packagingItems, taxPercentage]);
  
  // Calculate refining cost with tax
  useEffect(() => {
    const subtotal = parseFloat(refiningSubtotal);
    const taxAmount = subtotal * (refiningTaxPercentage / 100);
    const total = subtotal + taxAmount;
    setRefiningCost(total.toFixed(2));
  }, [refiningSubtotal, refiningTaxPercentage]);
  
  // Fetch customers
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      return response.json();
    }
  });
  
  // Fetch raw materials
  const { data: materials, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['/api/products/raw-materials'],
    queryFn: async () => {
      const response = await fetch('/api/products/raw-materials');
      if (!response.ok) {
        throw new Error('Failed to fetch raw materials');
      }
      return response.json();
    }
  });
  
  // Fetch all orders
  const { data: allOrders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      return response.json();
    }
  });
  
  // Separate production and refining orders
  const productionOrders = React.useMemo(() => {
    return allOrders?.filter((order: any) => order.orderType === 'production') || [];
  }, [allOrders]);
  
  const refiningOrders = React.useMemo(() => {
    return allOrders?.filter((order: any) => order.orderType === 'refining') || [];
  }, [allOrders]);
  
  // Fetch semi-finished products
  const { data: semiFinishedProducts, isLoading: isLoadingSemiFinished } = useQuery({
    queryKey: ['/api/products/semi-finished'],
    queryFn: async () => {
      const response = await fetch('/api/products/semi-finished');
      if (!response.ok) {
        throw new Error('Failed to fetch semi-finished products');
      }
      return response.json();
    }
  });
  
  // Fetch packaging materials
  const { data: packagingMaterials, isLoading: isLoadingPackaging } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      // Fetch products and filter for packaging items on the client-side
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const products = await response.json();
      // Filter for packaging items or return all products if no specific filter available
      return products.filter((p: any) => 
        p.name?.toLowerCase().includes('package') || 
        p.name?.toLowerCase().includes('box') || 
        p.name?.toLowerCase().includes('container') ||
        p.name?.toLowerCase().includes('bottle') ||
        p.name?.toLowerCase().includes('bag') ||
        p.productType === 'packaging'
      ) || products.slice(0, 10);
    }
  });
  
  // Generate batch number on component mount
  useEffect(() => {
    generateBatchNumber('production');
  }, []);
  
  // Filter customers based on search term
  const filteredCustomers = customers ? customers.filter((customer: any) => {
    const term = customerSearchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(term) ||
      customer.company?.toLowerCase().includes(term) ||
      customer.sector?.toLowerCase().includes(term)
    );
  }) : [];
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'create' | 'refining');
    
    // Generate appropriate batch number when switching tabs
    if (value === 'create' && !batchNumber) {
      generateBatchNumber('production');
    } else if (value === 'refining' && !refiningBatchNumber) {
      generateBatchNumber('refining');
    }
  };
  
  const generateBatchNumber = async (type: 'production' | 'refining') => {
    try {
      const response = await fetch('/api/orders/latest-batch');
      const data = await response.json();
      
      // Find the latest batch number of the given type
      const latestBatch = data.latestBatch || '';
      const prefix = type === 'production' ? 'BATCH' : 'REF';
      
      // Extract the number part and increment
      let number = 1;
      if (latestBatch && latestBatch.startsWith(prefix)) {
        const parts = latestBatch.split('-');
        if (parts.length === 2) {
          const lastNum = parseInt(parts[1], 10);
          if (!isNaN(lastNum)) {
            number = lastNum + 1;
          }
        }
      }
      
      // Format the new batch number
      const newBatchNumber = `${prefix}-${number.toString().padStart(4, '0')}`;
      
      if (type === 'production') {
        setBatchNumber(newBatchNumber);
      } else {
        setRefiningBatchNumber(newBatchNumber);
      }
    } catch (error) {
      console.error('Error generating batch number:', error);
      // Default batch numbers if API fails
      if (type === 'production') {
        setBatchNumber('BATCH-0001');
      } else {
        setRefiningBatchNumber('REF-0001');
      }
    }
  };
  
  const handleAddMaterial = () => {
    if (!materialToAdd) {
      toast({
        title: "Missing Material",
        description: "Please select a material to add",
        variant: "destructive",
      });
      return;
    }
    
    if (materialQuantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      });
      return;
    }
    
    if (parseFloat(materialUnitPrice) <= 0) {
      toast({
        title: "Invalid Price",
        description: "Unit price must be greater than 0",
        variant: "destructive",
      });
      return;
    }
    
    // Find material details from the materials list
    const selectedMaterial = materials?.find((m: any) => m.id === parseInt(materialToAdd));
    if (!selectedMaterial) return;
    
    // Check if material already exists
    const existingIndex = rawMaterials.findIndex(m => m.id === selectedMaterial.id);
    
    if (existingIndex >= 0) {
      // Update existing material
      const updatedMaterials = [...rawMaterials];
      updatedMaterials[existingIndex].quantity += materialQuantity;
      setRawMaterials(updatedMaterials);
    } else {
      // Add new material
      setRawMaterials([...rawMaterials, {
        id: selectedMaterial.id,
        name: selectedMaterial.name,
        quantity: materialQuantity,
        unitPrice: materialUnitPrice,
        unitOfMeasure: selectedMaterial.unitOfMeasure || 'g'
      }]);
    }
    
    // Reset form
    setMaterialToAdd(null);
    setMaterialQuantity(0);
    setMaterialUnitPrice('0.00');
  };
  
  const handleRemoveMaterial = (index: number) => {
    const updatedMaterials = [...rawMaterials];
    updatedMaterials.splice(index, 1);
    setRawMaterials(updatedMaterials);
  };
  
  const handleAddPackaging = () => {
    if (!packagingToAdd) {
      toast({
        title: "Select packaging",
        description: "Please select a packaging item",
        variant: "destructive"
      });
      return;
    }
    
    if (!packagingQuantity || packagingQuantity <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid quantity",
        variant: "destructive"
      });
      return;
    }
    
    const packagingItem = packagingMaterials?.find((p: any) => p.id.toString() === packagingToAdd);
    if (!packagingItem) {
      toast({
        title: "Packaging not found",
        description: "The selected packaging was not found",
        variant: "destructive"
      });
      return;
    }
    
    // Add the packaging item to the list
    const newPackagingItem = {
      id: packagingItem.id,
      name: packagingItem.name,
      quantity: packagingQuantity,
      unitPrice: packagingUnitPrice || packagingItem.costPrice || '0.00',
      unitOfMeasure: packagingItem.unitOfMeasure || 'pcs'
    };
    
    setPackagingItems([...packagingItems, newPackagingItem]);
    
    // Reset the form
    setPackagingToAdd(null);
    setPackagingQuantity(0);
    setPackagingUnitPrice('0.00');
  };
  
  const handleRemovePackaging = (index: number) => {
    const updatedPackaging = [...packagingItems];
    updatedPackaging.splice(index, 1);
    setPackagingItems(updatedPackaging);
  };
  
  const handleAddRefiningStep = () => {
    if (!newRefiningStep.trim()) return;
    setRefiningSteps([...refiningSteps, newRefiningStep.trim()]);
    setNewRefiningStep('');
  };
  
  const handleRemoveRefiningStep = (index: number) => {
    const updatedSteps = [...refiningSteps];
    updatedSteps.splice(index, 1);
    setRefiningSteps(updatedSteps);
  };
  
  const handleCreateProductionOrder = async () => {
    if (!validateProductionOrder()) return;
    
    try {
      const orderData = {
        orderType: 'production',
        batchNumber,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        materials: rawMaterials,
        packaging: packagingItems,
        finalProduct: finalProductDescription,
        subtotal: subtotalPrice,
        taxPercentage: taxPercentage,
        taxAmount: (parseFloat(subtotalPrice) * (taxPercentage / 100)).toFixed(2),
        totalMaterialCost: subtotalPrice,
        totalAdditionalFees: (parseFloat(subtotalPrice) * (taxPercentage / 100)).toFixed(2),
        totalCost: totalPrice,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create order: ${response.statusText}`);
      }
      
      toast({
        title: "Success",
        description: "Production order created successfully",
      });
      
      // Reset form and refresh data
      resetProductionForm();
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create order",
        variant: "destructive",
      });
    }
  };
  
  const handleCreateRefiningOrder = async () => {
    if (!validateRefiningOrder()) return;
    
    try {
      const orderData = {
        orderType: 'refining',
        batchNumber: refiningBatchNumber,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        sourceType,
        sourceId: sourceType === 'production' ? sourceProductionOrder : sourceStockItem,
        sourceMaterial: sourceType === 'production' 
          ? productionOrders?.find((o: any) => o.id.toString() === sourceProductionOrder)?.finalProduct
          : semiFinishedProducts?.find((p: any) => p.id.toString() === sourceStockItem)?.name,
        materials: rawMaterials,
        refiningSteps: refiningSteps.join('||'),
        expectedOutput,
        subtotal: refiningSubtotal,
        taxPercentage: refiningTaxPercentage,
        taxAmount: (parseFloat(refiningSubtotal) * (refiningTaxPercentage / 100)).toFixed(2),
        totalMaterialCost: refiningSubtotal,
        totalAdditionalFees: (parseFloat(refiningSubtotal) * (refiningTaxPercentage / 100)).toFixed(2),
        totalCost: refiningCost,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create refining order: ${response.statusText}`);
      }
      
      toast({
        title: "Success",
        description: "Refining order created successfully",
      });
      
      // Reset form and refresh data
      resetRefiningForm();
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create refining order",
        variant: "destructive",
      });
    }
  };
  
  const validateProductionOrder = () => {
    if (!selectedCustomer) {
      toast({
        title: "Missing Customer",
        description: "Please select a customer",
        variant: "destructive",
      });
      return false;
    }
    
    if (!batchNumber) {
      toast({
        title: "Missing Batch Number",
        description: "Please provide a batch number",
        variant: "destructive",
      });
      return false;
    }
    
    if (rawMaterials.length === 0) {
      toast({
        title: "No Materials",
        description: "Please add at least one raw material",
        variant: "destructive",
      });
      return false;
    }
    
    // Packaging is optional, so we don't validate for its presence
    // But we could add specific validations for packaging items if needed
    
    if (!finalProductDescription) {
      toast({
        title: "Missing Description",
        description: "Please provide a description for the final product",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const validateRefiningOrder = () => {
    if (!selectedCustomer) {
      toast({
        title: "Missing Customer",
        description: "Please select a customer",
        variant: "destructive",
      });
      return false;
    }
    
    if (!refiningBatchNumber) {
      toast({
        title: "Missing Batch Number",
        description: "Please provide a batch number",
        variant: "destructive",
      });
      return false;
    }
    
    if (sourceType === 'production' && !sourceProductionOrder) {
      toast({
        title: "Missing Source",
        description: "Please select a production order as source",
        variant: "destructive",
      });
      return false;
    }
    
    if (sourceType === 'stock' && !sourceStockItem) {
      toast({
        title: "Missing Source",
        description: "Please select a stock item as source",
        variant: "destructive",
      });
      return false;
    }
    
    // Raw materials are optional, but we could add validation if needed
    // For example, we could ensure that if materials are present, they have proper quantities:
    /*
    if (rawMaterials.length > 0) {
      const invalidMaterial = rawMaterials.find(m => m.quantity <= 0 || parseFloat(m.unitPrice) <= 0);
      if (invalidMaterial) {
        toast({
          title: "Invalid Material",
          description: "Please ensure all materials have valid quantities and prices",
          variant: "destructive",
        });
        return false;
      }
    }
    */
    
    if (refiningSteps.length === 0) {
      toast({
        title: "No Refining Steps",
        description: "Please add at least one refining step",
        variant: "destructive",
      });
      return false;
    }
    
    if (!expectedOutput) {
      toast({
        title: "Missing Output",
        description: "Please provide an expected output description",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const resetProductionForm = () => {
    setSelectedCustomer(null);
    setBatchNumber('');
    generateBatchNumber('production');
    setRawMaterials([]);
    setPackagingItems([]);
    setFinalProductDescription('');
    setSubtotalPrice('0.00');
    setTotalPrice('0.00');
    setMaterialToAdd(null);
    setMaterialQuantity(0);
    setMaterialUnitPrice('0.00');
    setPackagingToAdd(null);
    setPackagingQuantity(0);
    setPackagingUnitPrice('0.00');
  };
  
  const resetRefiningForm = () => {
    setSelectedCustomer(null);
    setRefiningBatchNumber('');
    generateBatchNumber('refining');
    setSourceType('production');
    setSourceProductionOrder('');
    setSourceStockItem('');
    setRawMaterials([]);
    setMaterialToAdd(null);
    setMaterialQuantity(0);
    setMaterialUnitPrice('0.00');
    setRefiningSteps([]);
    setExpectedOutput('');
    setRefiningSubtotal('0.00');
    setRefiningCost('0.00');
  };
  
  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };
  
  const handleEditOrder = (order: any) => {
    toast({
      title: "Info",
      description: "Edit functionality will be implemented in a future update.",
    });
  };
  
  const handleDeleteConfirm = (orderId: number) => {
    setOrderToDelete(orderId);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    
    try {
      const response = await fetch(`/api/orders/${orderToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete order');
      }
      
      toast({
        title: "Success",
        description: "Order deleted successfully",
      });
      
      // Refresh orders
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete order",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };
  
  const handleCreateInvoice = (orderId: number) => {
    toast({
      title: "Info",
      description: "Invoice creation will be implemented in a future update.",
    });
  };
  
  // Export production orders to CSV
  const handleExportProductionOrders = () => {
    if (!productionOrders || productionOrders.length === 0) {
      toast({
        title: "Export Failed",
        description: "No production orders available to export",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare CSV headers
    const headers = [
      "Batch Number", 
      "Customer", 
      "Final Product", 
      "Total Cost", 
      "Date Created"
    ];
    
    // Prepare row data
    const rows = productionOrders.map((order: any) => [
      order.batchNumber || order.orderNumber,
      order.customerName || order.customer?.name || "Unknown",
      order.finalProduct || "N/A",
      parseFloat(order.totalCost || 0).toFixed(2),
      formatDate(order.createdAt)
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `production-orders-${format(new Date(), 'dd-MM-yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: "Production orders exported to CSV",
    });
  };
  
  // Export refining orders to CSV
  const handleExportRefiningOrders = () => {
    if (!refiningOrders || refiningOrders.length === 0) {
      toast({
        title: "Export Failed",
        description: "No refining orders available to export",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare CSV headers
    const headers = [
      "Batch Number", 
      "Customer", 
      "Source Material", 
      "Expected Output", 
      "Total Cost", 
      "Date Created"
    ];
    
    // Prepare row data
    const rows = refiningOrders.map((order: any) => [
      order.batchNumber || order.orderNumber,
      order.customerName || order.customer?.name || "Unknown",
      order.sourceMaterial || "N/A",
      order.expectedOutput || "N/A",
      parseFloat(order.totalCost || 0).toFixed(2),
      formatDate(order.createdAt)
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `refining-orders-${format(new Date(), 'dd-MM-yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: "Refining orders exported to CSV",
    });
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (e) {
      return 'N/A';
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t('orderManagement')}</h1>
      
      <Tabs defaultValue="create" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full mb-6">
          <TabsTrigger value="create" className="flex-1">Create Order</TabsTrigger>
          <TabsTrigger value="refining" className="flex-1">Refining Process</TabsTrigger>
        </TabsList>
        
        {/* New Product Order Tab */}
        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label>Batch Number</Label>
              <Input 
                value={batchNumber} 
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="BATCH-0001"
              />
            </div>
            
            <div className="space-y-4">
              <Label>Choose Customer</Label>
              <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    role="combobox" 
                    aria-expanded={customerPopoverOpen}
                    className="w-full justify-between"
                  >
                    {selectedCustomer ? selectedCustomer.name : "Search customers..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search customers..." 
                      value={customerSearchTerm}
                      onValueChange={setCustomerSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {isLoadingCustomers ? "Loading..." : "No customers found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredCustomers.map((customer: any) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.id.toString()}
                            onSelect={() => {
                              setSelectedCustomer(customer);
                              setCustomerPopoverOpen(false);
                            }}
                          >
                            {customer.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
              {/* Display customer details when selected */}
              {selectedCustomer && (
                <div className="mt-2 p-3 border rounded-md">
                  <p className="font-medium">{selectedCustomer.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.company}</p>
                  {selectedCustomer.sector && (
                    <Badge className="mt-1 bg-blue-100 text-blue-800 hover:bg-blue-200">
                      {selectedCustomer.sector}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-medium">Raw Materials</Label>
              <div className="flex gap-2">
                <Select value={materialToAdd} onValueChange={setMaterialToAdd}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingMaterials ? (
                      <SelectItem value="loading" disabled>Loading materials...</SelectItem>
                    ) : (
                      materials?.map((material: any) => (
                        <SelectItem key={material.id} value={material.id.toString()}>
                          {material.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                <Input
                  type="number"
                  placeholder="Qty"
                  className="w-24"
                  value={materialQuantity || ''}
                  onChange={(e) => setMaterialQuantity(parseInt(e.target.value) || 0)}
                />
                
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input
                    type="text"
                    placeholder="0.00"
                    className="pl-7 w-24"
                    value={materialUnitPrice}
                    onChange={(e) => setMaterialUnitPrice(e.target.value)}
                  />
                </div>
                
                <Button variant="secondary" onClick={handleAddMaterial}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
            
            {/* Materials Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Raw Material</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rawMaterials.length > 0 ? (
                    rawMaterials.map((material, index) => (
                      <TableRow key={`${material.id}-${index}`}>
                        <TableCell className="font-medium">
                          {material.name}
                        </TableCell>
                        <TableCell>
                          {material.quantity} {material.unitOfMeasure}
                        </TableCell>
                        <TableCell>${parseFloat(material.unitPrice).toFixed(2)}</TableCell>
                        <TableCell>
                          ${(material.quantity * parseFloat(material.unitPrice)).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMaterial(index)}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-20 text-center">
                        No materials added. Select materials from the dropdown above.
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {rawMaterials.length > 0 && (
                    <>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">
                          Subtotal:
                        </TableCell>
                        <TableCell className="font-medium">
                          ${subtotalPrice}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">
                          Tax ({taxPercentage}%):
                        </TableCell>
                        <TableCell className="font-medium">
                          ${(parseFloat(subtotalPrice) * (taxPercentage / 100)).toFixed(2)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">
                          Total:
                        </TableCell>
                        <TableCell className="font-bold">
                          ${totalPrice}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Packaging Section */}
          <div className="space-y-4 border border-gray-200 rounded-md p-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Packaging Materials</h3>
              {packagingItems.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {packagingItems.length} item{packagingItems.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-4">
                <Select 
                  value={packagingToAdd || ''} 
                  onValueChange={(value) => setPackagingToAdd(value)}
                >
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select packaging material" />
                  </SelectTrigger>
                  <SelectContent>
                    {packagingMaterials?.map((item: any) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name} ({item.unitOfMeasure})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  placeholder="Qty"
                  className="w-24"
                  value={packagingQuantity || ''}
                  onChange={(e) => setPackagingQuantity(parseInt(e.target.value) || 0)}
                />
                
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input
                    type="text"
                    placeholder="0.00"
                    className="pl-7 w-24"
                    value={packagingUnitPrice}
                    onChange={(e) => setPackagingUnitPrice(e.target.value)}
                  />
                </div>
                
                <Button variant="secondary" onClick={handleAddPackaging}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
            
            {/* Packaging Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Packaging Material</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packagingItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No packaging items added
                      </TableCell>
                    </TableRow>
                  ) : (
                    packagingItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                          {item.quantity} {item.unitOfMeasure}
                        </TableCell>
                        <TableCell>${parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemovePackaging(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Final Product Description</Label>
            <Textarea
              placeholder="Enter a description of the final product..."
              value={finalProductDescription}
              onChange={(e) => setFinalProductDescription(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tax Percentage (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Tax percentage"
                  value={taxPercentage}
                  onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground mt-1">Standard rate: 14%</p>
              </div>
              <div>
                <Label>Final Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input
                    type="text"
                    placeholder="Total price"
                    className="pl-7"
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Subtotal: ${subtotalPrice} + Tax: ${(parseFloat(subtotalPrice) * (taxPercentage / 100)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          <Button className="w-full" onClick={handleCreateProductionOrder}>
            <Save className="h-4 w-4 mr-2" />
            Save Order
          </Button>
          
          {/* Production Orders History */}
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-bold">Production Orders History</h2>
            
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch No.</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Final Product</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingOrders ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    productionOrders && productionOrders.length > 0 ? (
                      productionOrders.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.batchNumber || order.orderNumber}
                          </TableCell>
                          <TableCell>
                            {order.customerName || order.customer?.name || "Unknown"}
                          </TableCell>
                          <TableCell>{order.finalProduct || "N/A"}</TableCell>
                          <TableCell>${parseFloat(order.totalCost || 0).toFixed(2)}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditOrder(order)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleCreateInvoice(order.id)}>
                              <FileText className="h-4 w-4 mr-1" />
                              Invoice
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No production orders found
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
        
        {/* Refining Process Tab */}
        <TabsContent value="refining" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label>Batch Number</Label>
              <Input 
                value={refiningBatchNumber} 
                onChange={(e) => setRefiningBatchNumber(e.target.value)}
                placeholder="REF-0001"
              />
            </div>
            
            <div className="space-y-4">
              <Label>Choose Customer</Label>
              <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    role="combobox" 
                    aria-expanded={customerPopoverOpen}
                    className="w-full justify-between"
                  >
                    {selectedCustomer ? selectedCustomer.name : "Search customers..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search customers..." 
                      value={customerSearchTerm}
                      onValueChange={setCustomerSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {isLoadingCustomers ? "Loading..." : "No customers found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredCustomers.map((customer: any) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.id.toString()}
                            onSelect={() => {
                              setSelectedCustomer(customer);
                              setCustomerPopoverOpen(false);
                            }}
                          >
                            {customer.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
              {/* Display customer details when selected */}
              {selectedCustomer && (
                <div className="mt-2 p-3 border rounded-md">
                  <p className="font-medium">{selectedCustomer.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.company}</p>
                  {selectedCustomer.sector && (
                    <Badge className="mt-1 bg-blue-100 text-blue-800 hover:bg-blue-200">
                      {selectedCustomer.sector}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <Label>Source Material</Label>
            <RadioGroup value={sourceType} onValueChange={setSourceType} className="flex flex-col space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="production" id="production" />
                <Label htmlFor="production">From Production Order</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="stock" id="stock" />
                <Label htmlFor="stock">From Stock Item</Label>
              </div>
            </RadioGroup>
            
            {sourceType === 'production' ? (
              <div className="pt-2">
                <Select value={sourceProductionOrder} onValueChange={setSourceProductionOrder}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select production order" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingOrders ? (
                      <SelectItem value="loading" disabled>Loading orders...</SelectItem>
                    ) : (
                      productionOrders?.map((order: any) => (
                        <SelectItem key={order.id} value={order.id.toString()}>
                          {order.batchNumber || order.orderNumber} - {order.finalProduct || "Unknown product"}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="pt-2">
                <Select value={sourceStockItem} onValueChange={setSourceStockItem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stock item" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingSemiFinished ? (
                      <SelectItem value="loading" disabled>Loading stock items...</SelectItem>
                    ) : (
                      semiFinishedProducts?.map((product: any) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} - {product.batchNumber || "No batch"}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Raw Materials Section for Refining */}
          <div className="space-y-4 border border-gray-200 rounded-md p-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Additional Raw Materials</h3>
              {rawMaterials.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {rawMaterials.length} item{rawMaterials.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-4">
                <Select value={materialToAdd} onValueChange={setMaterialToAdd}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingMaterials ? (
                      <SelectItem value="loading" disabled>Loading materials...</SelectItem>
                    ) : (
                      materials?.map((material: any) => (
                        <SelectItem key={material.id} value={material.id.toString()}>
                          {material.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                <Input
                  type="number"
                  placeholder="Qty"
                  className="w-24"
                  value={materialQuantity || ''}
                  onChange={(e) => setMaterialQuantity(parseInt(e.target.value) || 0)}
                />
                
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input
                    type="text"
                    placeholder="0.00"
                    className="pl-7 w-24"
                    value={materialUnitPrice}
                    onChange={(e) => setMaterialUnitPrice(e.target.value)}
                  />
                </div>
                
                <Button variant="secondary" onClick={handleAddMaterial}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
            
            {/* Materials Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Raw Material</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rawMaterials.length > 0 ? (
                    rawMaterials.map((material, index) => (
                      <TableRow key={`${material.id}-${index}`}>
                        <TableCell className="font-medium">
                          {material.name}
                        </TableCell>
                        <TableCell>
                          {material.quantity} {material.unitOfMeasure}
                        </TableCell>
                        <TableCell>${parseFloat(material.unitPrice).toFixed(2)}</TableCell>
                        <TableCell>
                          ${(material.quantity * parseFloat(material.unitPrice)).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMaterial(index)}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-20 text-center">
                        No additional materials added.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Refining Steps</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a refining step..."
                  value={newRefiningStep}
                  onChange={(e) => setNewRefiningStep(e.target.value)}
                  className="w-[300px]"
                />
                <Button variant="secondary" onClick={handleAddRefiningStep}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>
            </div>
            
            <div className="border rounded-md">
              {refiningSteps.length > 0 ? (
                <ul className="divide-y">
                  {refiningSteps.map((step, index) => (
                    <li key={index} className="flex items-center justify-between p-3">
                      <div className="flex items-center">
                        <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-sm mr-3">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRefiningStep(index)}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No refining steps added yet. Add steps using the form above.
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Expected Output</Label>
            <Textarea
              placeholder="Describe the expected output of the refining process..."
              value={expectedOutput}
              onChange={(e) => setExpectedOutput(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Base Cost</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input
                    type="text"
                    placeholder="0.00"
                    className="pl-7"
                    value={refiningSubtotal}
                    onChange={(e) => setRefiningSubtotal(e.target.value)}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Base cost for the refining process
                </p>
              </div>
              <div>
                <Label>Tax Percentage (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Tax percentage"
                  value={refiningTaxPercentage}
                  onChange={(e) => setRefiningTaxPercentage(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground mt-1">Standard rate: 14%</p>
              </div>
            </div>
            
            <div>
              <Label>Total Cost (with Tax)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                <Input
                  type="text"
                  placeholder="0.00"
                  className="pl-7"
                  value={refiningCost}
                  readOnly
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Subtotal: ${refiningSubtotal} + Tax: ${(parseFloat(refiningSubtotal) * (refiningTaxPercentage / 100)).toFixed(2)}
              </p>
            </div>
          </div>
          
          <Button className="w-full" onClick={handleCreateRefiningOrder}>
            <Save className="h-4 w-4 mr-2" />
            Save Refining Order
          </Button>
          
          {/* Refining Orders History */}
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-bold">Refining Orders History</h2>
            
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch No.</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Source Material</TableHead>
                    <TableHead>Expected Output</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingOrders ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    refiningOrders.length > 0 ? (
                      refiningOrders.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.batchNumber || order.orderNumber}
                          </TableCell>
                          <TableCell>
                            {order.customerName || order.customer?.name || "Unknown"}
                          </TableCell>
                          <TableCell>{order.sourceMaterial || "N/A"}</TableCell>
                          <TableCell>{order.expectedOutput || "N/A"}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditOrder(order)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleCreateInvoice(order.id)}>
                              <FileText className="h-4 w-4 mr-1" />
                              Invoice
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No refining orders found
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* View Order Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder?.batchNumber || selectedOrder?.orderNumber || 'Order Details'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Batch Number</h3>
                  <p>{selectedOrder.batchNumber || selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Order Type</h3>
                  <p className="capitalize">{selectedOrder.orderType}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Customer</h3>
                  <p>{selectedOrder.customerName || selectedOrder.customer?.name || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Date</h3>
                  <p>{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Status</h3>
                  <Badge>{selectedOrder.status || 'pending'}</Badge>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Subtotal</h3>
                  <p>${parseFloat(selectedOrder.subtotal || selectedOrder.totalMaterialCost || 0).toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Tax {selectedOrder.taxPercentage ? `(${selectedOrder.taxPercentage}%)` : ''}</h3>
                  <p>${parseFloat(selectedOrder.taxAmount || selectedOrder.totalAdditionalFees || 0).toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Total Cost</h3>
                  <p>${parseFloat(selectedOrder.totalCost || 0).toFixed(2)}</p>
                </div>
              </div>
              
              {selectedOrder.orderType === 'production' ? (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Final Product</h3>
                    <p>{selectedOrder.finalProduct || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Materials</h3>
                    {selectedOrder.materials ? (
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Material</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Unit Price</TableHead>
                              <TableHead>Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(typeof selectedOrder.materials === 'string' 
                              ? JSON.parse(selectedOrder.materials) 
                              : selectedOrder.materials
                            ).map((material: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{material.name}</TableCell>
                                <TableCell>{material.quantity} {material.unitOfMeasure || ''}</TableCell>
                                <TableCell>${parseFloat(material.unitPrice).toFixed(2)}</TableCell>
                                <TableCell>
                                  ${(material.quantity * parseFloat(material.unitPrice)).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p>No materials listed</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Source Material</h3>
                    <p>{selectedOrder.sourceMaterial || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Refining Steps</h3>
                    {selectedOrder.refiningSteps ? (
                      <div className="border rounded-md p-4">
                        <ol className="list-decimal list-inside space-y-2">
                          {selectedOrder.refiningSteps.split('||').map((step: string, index: number) => (
                            <li key={index}>{step.trim()}</li>
                          ))}
                        </ol>
                      </div>
                    ) : (
                      <p>No refining steps listed</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Expected Output</h3>
                    <p>{selectedOrder.expectedOutput || 'N/A'}</p>
                  </div>
                </>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            <Button onClick={() => handleCreateInvoice(selectedOrder?.id)}>
              <FileText className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteOrder}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManagement;