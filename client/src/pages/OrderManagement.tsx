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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [subtotalPrice, setSubtotalPrice] = useState<string>('0.00');
  const [totalPrice, setTotalPrice] = useState<string>('0.00');
  const [transportationCost, setTransportationCost] = useState<string>('0.00');
  const [transportationNotes, setTransportationNotes] = useState<string>('');
  
  // Refining order states
  const [refiningBatchNumber, setRefiningBatchNumber] = useState('');
  const [sourceType, setSourceType] = useState<string>('production');
  const [sourceProductionOrder, setSourceProductionOrder] = useState<string>('');
  const [sourceStockItem, setSourceStockItem] = useState<string>('');
  const [refiningSteps, setRefiningSteps] = useState<string[]>([]);
  const [newRefiningStep, setNewRefiningStep] = useState<string>('');
  const [expectedOutput, setExpectedOutput] = useState<string>('');
  const [refiningTaxPercentage, setRefiningTaxPercentage] = useState<number>(14);
  const [refiningSubtotal, setRefiningSubtotal] = useState<string>('0.00');
  const [refiningCost, setRefiningCost] = useState<string>('0.00');
  const [refiningTransportationCost, setRefiningTransportationCost] = useState<string>('0.00');
  const [refiningTransportationNotes, setRefiningTransportationNotes] = useState<string>('');
  
  // Refining raw materials states
  const [refiningRawMaterials, setRefiningRawMaterials] = useState<any[]>([]);
  const [refiningMaterialToAdd, setRefiningMaterialToAdd] = useState<any>(null);
  const [refiningMaterialQuantity, setRefiningMaterialQuantity] = useState<number>(0);
  const [refiningMaterialUnitPrice, setRefiningMaterialUnitPrice] = useState<string>('0.00');
  
  // Calculate subtotal and total price (with tax) when raw materials, packaging items, tax percentage, or transportation cost change
  useEffect(() => {
    // Calculate materials cost
    const materialsCost = rawMaterials.reduce((sum, material) => {
      return sum + (material.quantity * parseFloat(material.unitPrice));
    }, 0);
    
    // Calculate packaging cost
    const packagingCost = packagingItems.reduce((sum, item) => {
      return sum + (item.quantity * parseFloat(item.unitPrice));
    }, 0);
    
    // Add transportation cost
    const transportCost = parseFloat(transportationCost) || 0;
    
    // Calculate the total subtotal
    const subtotal = materialsCost + packagingCost + transportCost;
    setSubtotalPrice(subtotal.toFixed(2));
    
    // Calculate total with tax
    const taxAmount = subtotal * (taxPercentage / 100);
    const total = subtotal + taxAmount;
    setTotalPrice(total.toFixed(2));
  }, [rawMaterials, packagingItems, transportationCost, taxPercentage]);
  
  // Calculate refining cost with tax and transportation
  useEffect(() => {
    // Calculate refining materials cost
    const materialsCost = refiningRawMaterials.reduce((sum, material) => {
      return sum + (material.quantity * parseFloat(material.unitPrice));
    }, 0);
    
    const baseSubtotal = parseFloat(refiningSubtotal) || 0;
    const transportCost = parseFloat(refiningTransportationCost) || 0;
    
    // Calculate the total subtotal including materials
    const totalSubtotal = baseSubtotal + materialsCost + transportCost;
    
    const taxAmount = totalSubtotal * (refiningTaxPercentage / 100);
    const total = totalSubtotal + taxAmount;
    setRefiningCost(total.toFixed(2));
  }, [refiningSubtotal, refiningTransportationCost, refiningTaxPercentage, refiningRawMaterials]);

  // Fetch all orders
  const { data: allOrders, isLoading: isLoadingOrders, refetch: refetchOrders } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      return response.json();
    }
  });

  // Filter orders based on active tab
  const productionOrders = React.useMemo(() => {
    return allOrders?.filter((order: any) => order.orderType === 'production') || [];
  }, [allOrders]);

  const refiningOrders = React.useMemo(() => {
    return allOrders?.filter((order: any) => order.orderType === 'refining') || [];
  }, [allOrders]);

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
  const { data: rawMaterialsData, isLoading: isLoadingRawMaterials } = useQuery({
    queryKey: ['/api/products/raw-materials'],
    queryFn: async () => {
      const response = await fetch('/api/products/raw-materials');
      if (!response.ok) {
        throw new Error('Failed to fetch raw materials');
      }
      return response.json();
    }
  });

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

  const generateBatchNumber = async (type: string) => {
    try {
      // Get the current date in YYMMDD format
      const today = new Date();
      const dateStr = format(today, 'yyMMdd');
      
      // Get random numbers to create a unique batch number (3 digits)
      const randomNum = Math.floor(100 + Math.random() * 900);
      
      // Generate batch numbers with new format
      if (type === 'production') {
        // Format: BATCH-100-YYMMDD
        const batchNumber = `BATCH-${randomNum}-${dateStr}`;
        setBatchNumber(batchNumber);
      } else {
        // Format: REF-100-YYMMDD
        const refBatchNumber = `REF-${randomNum}-${dateStr}`;
        setRefiningBatchNumber(refBatchNumber);
      }
    } catch (error) {
      console.error('Error generating batch number:', error);
      
      // Fallback to simple format
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      if (type === 'production') {
        setBatchNumber(`BATCH-${randomNum}`);
      } else {
        setRefiningBatchNumber(`REF-${randomNum}`);
      }
    }
  };

  const handleAddMaterial = () => {
    if (materialToAdd && materialQuantity > 0) {
      const newMaterial = {
        id: materialToAdd.id,
        name: materialToAdd.name,
        quantity: materialQuantity,
        unitOfMeasure: materialToAdd.unitOfMeasure || 'kg',
        unitPrice: materialUnitPrice
      };
      
      setRawMaterials([...rawMaterials, newMaterial]);
      setMaterialToAdd(null);
      setMaterialQuantity(0);
      setMaterialUnitPrice('0.00');
    }
  };

  const handleRemoveMaterial = (index: number) => {
    const updatedMaterials = rawMaterials.filter((_, i) => i !== index);
    setRawMaterials(updatedMaterials);
  };

  const handleAddPackaging = () => {
    if (packagingToAdd && packagingQuantity > 0) {
      const newPackagingItem = {
        id: packagingToAdd.id,
        name: packagingToAdd.name,
        quantity: packagingQuantity,
        unitOfMeasure: packagingToAdd.unitOfMeasure || 'units',
        unitPrice: packagingUnitPrice
      };
      
      setPackagingItems([...packagingItems, newPackagingItem]);
      setPackagingToAdd(null);
      setPackagingQuantity(0);
      setPackagingUnitPrice('0.00');
    }
  };

  const handleRemovePackaging = (index: number) => {
    const updatedPackaging = packagingItems.filter((_, i) => i !== index);
    setPackagingItems(updatedPackaging);
  };

  const handleAddRefiningStep = () => {
    if (newRefiningStep.trim()) {
      setRefiningSteps([...refiningSteps, newRefiningStep.trim()]);
      setNewRefiningStep('');
    }
  };

  const handleRemoveRefiningStep = (index: number) => {
    const updatedSteps = refiningSteps.filter((_, i) => i !== index);
    setRefiningSteps(updatedSteps);
  };

  const handleAddRefiningMaterial = () => {
    if (refiningMaterialToAdd && refiningMaterialQuantity > 0) {
      const newMaterial = {
        id: refiningMaterialToAdd.id,
        name: refiningMaterialToAdd.name,
        quantity: refiningMaterialQuantity,
        unitOfMeasure: refiningMaterialToAdd.unitOfMeasure || 'kg',
        unitPrice: refiningMaterialUnitPrice
      };
      
      setRefiningRawMaterials([...refiningRawMaterials, newMaterial]);
      setRefiningMaterialToAdd(null);
      setRefiningMaterialQuantity(0);
      setRefiningMaterialUnitPrice('0.00');
    }
  };

  const handleRemoveRefiningMaterial = (index: number) => {
    const updatedMaterials = refiningRawMaterials.filter((_, i) => i !== index);
    setRefiningRawMaterials(updatedMaterials);
  };

  const handleCreateOrder = async () => {
    try {
      if (!selectedCustomer) {
        toast({
          title: "Error",
          description: "Please select a customer",
          variant: "destructive",
        });
        return;
      }

      const orderData = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        batchNumber: batchNumber,
        orderType: 'production',
        finalProduct: finalProductDescription,
        materials: JSON.stringify(rawMaterials),
        packaging: JSON.stringify(packagingItems),
        subtotal: subtotalPrice,
        taxPercentage: taxPercentage,
        taxAmount: (parseFloat(subtotalPrice) * (taxPercentage / 100)).toFixed(2),
        totalCost: totalPrice,
        transportationCost: transportationCost,
        transportationNotes: transportationNotes,
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
        throw new Error('Failed to create order');
      }

      toast({
        title: "Success",
        description: "Production order created successfully",
      });

      // Reset form
      setSelectedCustomer(null);
      setRawMaterials([]);
      setPackagingItems([]);
      setFinalProductDescription('');
      setTransportationCost('0.00');
      setTransportationNotes('');
      generateBatchNumber('production');
      
      // Refetch orders
      refetchOrders();

    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      });
    }
  };

  const handleCreateRefiningOrder = async () => {
    try {
      if (!selectedCustomer) {
        toast({
          title: "Error",
          description: "Please select a customer",
          variant: "destructive",
        });
        return;
      }

      const refiningOrderData = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        batchNumber: refiningBatchNumber,
        orderType: 'refining',
        sourceType: sourceType,
        sourceId: sourceType === 'production' ? sourceProductionOrder : sourceStockItem,
        refiningSteps: JSON.stringify(refiningSteps),
        expectedOutput: expectedOutput,
        materials: JSON.stringify(refiningRawMaterials),
        subtotal: refiningSubtotal,
        taxPercentage: refiningTaxPercentage,
        taxAmount: (parseFloat(refiningSubtotal) * (refiningTaxPercentage / 100)).toFixed(2),
        totalCost: refiningCost,
        transportationCost: refiningTransportationCost,
        transportationNotes: refiningTransportationNotes,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refiningOrderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create refining order');
      }

      toast({
        title: "Success",
        description: "Refining order created successfully",
      });

      // Reset form
      setSelectedCustomer(null);
      setRefiningSteps([]);
      setRefiningRawMaterials([]);
      setExpectedOutput('');
      setRefiningSubtotal('0.00');
      setRefiningTransportationCost('0.00');
      setRefiningTransportationNotes('');
      generateBatchNumber('refining');
      
      // Refetch orders
      refetchOrders();

    } catch (error) {
      console.error('Error creating refining order:', error);
      toast({
        title: "Error",
        description: "Failed to create refining order",
        variant: "destructive",
      });
    }
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const confirmDeleteOrder = (orderId: number) => {
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

      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
      refetchOrders();

    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    }
  };

  const handleCreateInvoice = (orderId: number) => {
    // Navigate to invoice creation with order data
    toast({
      title: "Info",
      description: "Invoice creation functionality will be implemented",
    });
  };

  const exportProductionOrdersByWarehouse = async (warehouseType: string) => {
    try {
      // Filter orders based on warehouse type
      const filteredOrders = productionOrders;
      
      if (filteredOrders.length === 0) {
        toast({
          title: "No Data",
          description: `No production orders found`,
          variant: "destructive"
        });
        return;
      }
      
      // Define CSV headers
      const headers = [
        'Batch Number', 'Customer', 'Final Product', 'Raw Materials', 
        'Packaging', 'Subtotal ($)', 'Tax Amount ($)', 'Date Created', 
        'Location', 'Status'
      ];
      
      // Map orders to CSV rows
      const rows = filteredOrders.map((order: any) => [
        order.batchNumber || 'Unknown',
        order.customerName || 'Unknown',
        order.finalProduct || 'N/A',
        formatMaterialsForCSV(order.materials),
        formatMaterialsForCSV(order.packaging),
        parseFloat(order.totalCost || 0).toFixed(2),
        parseFloat(order.taxAmount || 0).toFixed(2),
        order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'Unknown',
        order.location || 'Not specified',
        order.status || 'Pending'
      ]);
      
      // Generate CSV content with proper escaping for quoted values
      const csvContent = [
        headers.join(","),
        ...rows.map(row => 
          row.map(cell => 
            `"${String(cell).replace(/"/g, '""')}"`
          ).join(",")
        )
      ].join("\n");
      
      // Create a download link and trigger the download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `production-orders-${warehouseType.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: `Exported ${filteredOrders.length} orders from ${warehouseType}`
      });
    } catch (error) {
      console.error('Error exporting production orders by warehouse:', error);
      toast({
        title: "Export Failed",
        description: `Error exporting orders from ${warehouseType}`,
        variant: "destructive"
      });
    }
  };

  const exportRefiningOrdersByWarehouse = async (warehouseType: string) => {
    try {
      // Filter orders based on warehouse type
      const filteredOrders = refiningOrders;
      
      if (filteredOrders.length === 0) {
        toast({
          title: "No Data",
          description: `No refining orders found`,
          variant: "destructive"
        });
        return;
      }
      
      // Define CSV headers
      const headers = [
        'Batch Number', 'Customer', 'Source Type', 'Refining Steps', 
        'Expected Output', 'Subtotal ($)', 'Tax Amount ($)', 'Date Created', 
        'Location', 'Status'
      ];
      
      // Map orders to CSV rows
      const rows = filteredOrders.map((order: any) => [
        order.batchNumber || 'Unknown',
        order.customerName || 'Unknown',
        order.sourceType || 'N/A',
        formatMaterialsForCSV(order.refiningSteps),
        order.expectedOutput || 'N/A',
        parseFloat(order.totalCost || 0).toFixed(2),
        parseFloat(order.taxAmount || 0).toFixed(2),
        order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'Unknown',
        order.location || 'Not specified',
        order.status || 'Pending'
      ]);
      
      // Generate CSV content with proper escaping for quoted values
      const csvContent = [
        headers.join(","),
        ...rows.map(row => 
          row.map(cell => 
            `"${String(cell).replace(/"/g, '""')}"`
          ).join(",")
        )
      ].join("\n");
      
      // Create a download link and trigger the download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `refining-orders-${warehouseType.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: `Exported ${filteredOrders.length} orders from ${warehouseType}`
      });
    } catch (error) {
      console.error('Error exporting refining orders by warehouse:', error);
      toast({
        title: "Export Failed",
        description: `Error exporting orders from ${warehouseType}`,
        variant: "destructive"
      });
    }
  };
  
  // Helper function to format materials array for CSV
  const formatMaterialsForCSV = (materials: any) => {
    if (!materials) return 'None';
    
    try {
      // If materials is a string, parse it as JSON
      const materialsList = typeof materials === 'string' 
        ? JSON.parse(materials) 
        : materials;
      
      if (!Array.isArray(materialsList)) return 'None';
      
      return materialsList.map(m => 
        `${m.name || 'Unknown'} (${m.quantity || 0} ${m.unitOfMeasure || ''})`
      ).join('; ');
    } catch (error) {
      console.error('Error formatting materials for CSV:', error);
      return 'Error parsing materials';
    }
  };
  
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Order Management</h1>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Production Orders</TabsTrigger>
          <TabsTrigger value="refining">Refining Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Creation Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Create Production Order</h2>
                  
                  {/* Customer Selection */}
                  <div className="space-y-4">
                    <div>
                      <Label>Customer</Label>
                      <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={customerPopoverOpen}
                            className="w-full justify-between"
                          >
                            {selectedCustomer ? selectedCustomer.name : "Select customer..."}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Search customers..." 
                              value={customerSearchTerm}
                              onValueChange={setCustomerSearchTerm}
                            />
                            <CommandList>
                              <CommandEmpty>No customer found.</CommandEmpty>
                              <CommandGroup>
                                {filteredCustomers.map((customer: any) => (
                                  <CommandItem
                                    key={customer.id}
                                    value={customer.name}
                                    onSelect={() => {
                                      setSelectedCustomer(customer);
                                      setCustomerPopoverOpen(false);
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{customer.name}</span>
                                      <span className="text-sm text-muted-foreground">
                                        {customer.company} • {customer.sector}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      
                      {selectedCustomer && (
                        <div className="mt-2 p-3 bg-muted rounded-md">
                          <p className="font-medium">{selectedCustomer.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedCustomer.company}</p>
                          <p className="text-sm text-muted-foreground">{selectedCustomer.sector}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Batch Number</Label>
                        <Input 
                          value={batchNumber} 
                          onChange={(e) => setBatchNumber(e.target.value)}
                          placeholder="Auto-generated"
                        />
                      </div>
                      <div>
                        <Label>Final Product</Label>
                        <Input 
                          value={finalProductDescription}
                          onChange={(e) => setFinalProductDescription(e.target.value)}
                          placeholder="Describe the final product"
                        />
                      </div>
                    </div>

                    {/* Raw Materials Section */}
                    <div>
                      <Label className="text-base font-semibold">Raw Materials</Label>
                      
                      {/* Add Material Form */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <Select value={materialToAdd?.id?.toString()} onValueChange={(value) => {
                          const material = rawMaterialsData?.find((m: any) => m.id.toString() === value);
                          setMaterialToAdd(material);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {rawMaterialsData?.map((material: any) => (
                              <SelectItem key={material.id} value={material.id.toString()}>
                                {material.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Input 
                          type="number" 
                          placeholder="Qty"
                          value={materialQuantity}
                          onChange={(e) => setMaterialQuantity(parseInt(e.target.value) || 0)}
                        />
                        
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="Unit Price"
                          value={materialUnitPrice}
                          onChange={(e) => setMaterialUnitPrice(e.target.value)}
                        />
                        
                        <Button onClick={handleAddMaterial} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Materials List */}
                      {rawMaterials.length > 0 && (
                        <div className="space-y-2">
                          {rawMaterials.map((material, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="font-medium">{material.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {material.quantity} {material.unitOfMeasure} × ${material.unitPrice}
                              </span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveMaterial(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Packaging Section */}
                    <div>
                      <Label className="text-base font-semibold">Packaging</Label>
                      
                      {/* Add Packaging Form */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <Select value={packagingToAdd?.id?.toString()} onValueChange={(value) => {
                          const item = packagingMaterials?.find((p: any) => p.id.toString() === value);
                          setPackagingToAdd(item);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select packaging" />
                          </SelectTrigger>
                          <SelectContent>
                            {packagingMaterials?.map((item: any) => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Input 
                          type="number" 
                          placeholder="Qty"
                          value={packagingQuantity}
                          onChange={(e) => setPackagingQuantity(parseInt(e.target.value) || 0)}
                        />
                        
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="Unit Price"
                          value={packagingUnitPrice}
                          onChange={(e) => setPackagingUnitPrice(e.target.value)}
                        />
                        
                        <Button onClick={handleAddPackaging} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Packaging List */}
                      {packagingItems.length > 0 && (
                        <div className="space-y-2">
                          {packagingItems.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {item.quantity} {item.unitOfMeasure} × ${item.unitPrice}
                              </span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemovePackaging(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Transportation */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Transportation Cost</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          value={transportationCost}
                          onChange={(e) => setTransportationCost(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Tax Percentage</Label>
                        <Input 
                          type="number" 
                          value={taxPercentage}
                          onChange={(e) => setTaxPercentage(parseInt(e.target.value) || 14)}
                          placeholder="14"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Transportation Notes</Label>
                      <Textarea 
                        value={transportationNotes}
                        onChange={(e) => setTransportationNotes(e.target.value)}
                        placeholder="Any special transportation requirements..."
                      />
                    </div>

                    <Button onClick={handleCreateOrder} className="w-full">
                      <Save className="mr-2 h-4 w-4" />
                      Create Production Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${subtotalPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({taxPercentage}%):</span>
                      <span>${(parseFloat(subtotalPrice) * (taxPercentage / 100)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${totalPrice}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Production Orders History */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Production Orders History</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileDown className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Export by Warehouse</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => exportProductionOrdersByWarehouse('Warehouse 1')}>
                      Warehouse 1
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportProductionOrdersByWarehouse('Warehouse 2')}>
                      Warehouse 2
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportProductionOrdersByWarehouse('Central Storage')}>
                      Central Storage
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Final Product</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingOrders ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : productionOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                          No production orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      productionOrders.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.batchNumber}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell>{order.finalProduct || 'N/A'}</TableCell>
                          <TableCell>${order.totalCost}</TableCell>
                          <TableCell>
                            <Badge variant={
                              order.status === 'completed' ? 'default' :
                              order.status === 'pending' ? 'secondary' :
                              order.status === 'cancelled' ? 'destructive' : 'outline'
                            }>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewOrder(order)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleCreateInvoice(order.id)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => confirmDeleteOrder(order.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refining" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Refining Order Creation Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Create Refining Order</h2>
                  
                  <div className="space-y-4">
                    {/* Customer Selection */}
                    <div>
                      <Label>Customer</Label>
                      <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={customerPopoverOpen}
                            className="w-full justify-between"
                          >
                            {selectedCustomer ? selectedCustomer.name : "Select customer..."}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Search customers..." 
                              value={customerSearchTerm}
                              onValueChange={setCustomerSearchTerm}
                            />
                            <CommandList>
                              <CommandEmpty>No customer found.</CommandEmpty>
                              <CommandGroup>
                                {filteredCustomers.map((customer: any) => (
                                  <CommandItem
                                    key={customer.id}
                                    value={customer.name}
                                    onSelect={() => {
                                      setSelectedCustomer(customer);
                                      setCustomerPopoverOpen(false);
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{customer.name}</span>
                                      <span className="text-sm text-muted-foreground">
                                        {customer.company} • {customer.sector}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      
                      {selectedCustomer && (
                        <div className="mt-2 p-3 bg-muted rounded-md">
                          <p className="font-medium">{selectedCustomer.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedCustomer.company}</p>
                          <p className="text-sm text-muted-foreground">{selectedCustomer.sector}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Batch Number</Label>
                      <Input 
                        value={refiningBatchNumber} 
                        onChange={(e) => setRefiningBatchNumber(e.target.value)}
                        placeholder="Auto-generated"
                      />
                    </div>

                    {/* Source Selection */}
                    <div>
                      <Label>Source Material</Label>
                      <RadioGroup value={sourceType} onValueChange={setSourceType}>
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="production" id="production" />
                            <Label htmlFor="production">From Production Order</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="stock" id="stock" />
                            <Label htmlFor="stock">From Stock Item</Label>
                          </div>
                        </div>
                      </RadioGroup>
                      
                      <div className="mt-3">
                      {sourceType === 'production' ? (
                        <Select value={sourceProductionOrder} onValueChange={setSourceProductionOrder}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select production order" />
                          </SelectTrigger>
                          <SelectContent>
                            {productionOrders.map((order: any) => (
                              <SelectItem key={order.id} value={order.id.toString()}>
                                {order.batchNumber} - {order.finalProduct}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select value={sourceStockItem} onValueChange={setSourceStockItem}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stock item" />
                          </SelectTrigger>
                          <SelectContent>
                            {semiFinishedProducts?.map((product: any) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      </div>
                    </div>

                    {/* Raw Materials Section */}
                    <div>
                      <Label className="text-base font-semibold">Raw Materials</Label>
                      
                      {/* Add Material Form */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <Select value={refiningMaterialToAdd?.id?.toString()} onValueChange={(value) => {
                          const material = rawMaterialsData?.find((m: any) => m.id.toString() === value);
                          setRefiningMaterialToAdd(material);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {rawMaterialsData?.map((material: any) => (
                              <SelectItem key={material.id} value={material.id.toString()}>
                                {material.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Input 
                          type="number" 
                          placeholder="Qty"
                          value={refiningMaterialQuantity}
                          onChange={(e) => setRefiningMaterialQuantity(parseInt(e.target.value) || 0)}
                        />
                        
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="Unit Price"
                          value={refiningMaterialUnitPrice}
                          onChange={(e) => setRefiningMaterialUnitPrice(e.target.value)}
                        />
                        
                        <Button onClick={handleAddRefiningMaterial} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Materials List */}
                      {refiningRawMaterials.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {refiningRawMaterials.map((material, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div className="flex-1">
                                <span className="font-medium text-sm">{material.name}</span>
                                <div className="text-xs text-muted-foreground">
                                  {material.quantity} {material.unitOfMeasure} × ${material.unitPrice}
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveRefiningMaterial(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Refining Steps */}
                    <div>
                      <Label className="text-base font-semibold">Refining Steps</Label>
                      
                      <div className="flex gap-2 mb-3">
                        <Input 
                          value={newRefiningStep}
                          onChange={(e) => setNewRefiningStep(e.target.value)}
                          placeholder="Add refining step..."
                          onKeyPress={(e) => e.key === 'Enter' && handleAddRefiningStep()}
                        />
                        <Button onClick={handleAddRefiningStep} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {refiningSteps.length > 0 && (
                        <div className="space-y-2">
                          {refiningSteps.map((step, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="font-medium">{step}</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveRefiningStep(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Expected Output</Label>
                      <Textarea 
                        value={expectedOutput}
                        onChange={(e) => setExpectedOutput(e.target.value)}
                        placeholder="Describe the expected output..."
                      />
                    </div>

                    {/* Transportation */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Subtotal Cost</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          value={refiningSubtotal}
                          onChange={(e) => setRefiningSubtotal(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Transportation Cost</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          value={refiningTransportationCost}
                          onChange={(e) => setRefiningTransportationCost(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Tax Percentage</Label>
                        <Input 
                          type="number" 
                          value={refiningTaxPercentage}
                          onChange={(e) => setRefiningTaxPercentage(parseInt(e.target.value) || 14)}
                          placeholder="14"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Transportation Notes</Label>
                      <Textarea 
                        value={refiningTransportationNotes}
                        onChange={(e) => setRefiningTransportationNotes(e.target.value)}
                        placeholder="Any special transportation requirements..."
                      />
                    </div>

                    <Button onClick={handleCreateRefiningOrder} className="w-full">
                      <Save className="mr-2 h-4 w-4" />
                      Create Refining Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Refining Order Summary */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Refining Order Summary</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${refiningSubtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transportation:</span>
                      <span>${refiningTransportationCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({refiningTaxPercentage}%):</span>
                      <span>${(parseFloat(refiningSubtotal) * (refiningTaxPercentage / 100)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${refiningCost}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Refining Orders History */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Refining Orders History</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileDown className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Export by Warehouse</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => exportRefiningOrdersByWarehouse('Warehouse 1')}>
                      Warehouse 1
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportRefiningOrdersByWarehouse('Warehouse 2')}>
                      Warehouse 2
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportRefiningOrdersByWarehouse('Central Storage')}>
                      Central Storage
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Source Type</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingOrders ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : refiningOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                          No refining orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      refiningOrders.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.batchNumber}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell className="capitalize">{order.sourceType || 'N/A'}</TableCell>
                          <TableCell>${order.totalCost}</TableCell>
                          <TableCell>
                            <Badge variant={
                              order.status === 'completed' ? 'default' :
                              order.status === 'pending' ? 'secondary' :
                              order.status === 'cancelled' ? 'destructive' : 'outline'
                            }>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewOrder(order)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleCreateInvoice(order.id)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => confirmDeleteOrder(order.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Order View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder?.batchNumber} - {selectedOrder?.orderType === 'production' ? 'Production Order' : 'Refining Order'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Customer</h3>
                <p className="font-medium">{selectedOrder?.customerName || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder?.company || 'N/A'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                <Badge variant={
                  selectedOrder?.status === 'completed' ? 'default' :
                  selectedOrder?.status === 'pending' ? 'secondary' :
                  selectedOrder?.status === 'cancelled' ? 'destructive' : 'outline'
                }>
                  {selectedOrder?.status || 'Pending'}
                </Badge>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Created At</h3>
                <p>{selectedOrder?.createdAt ? format(new Date(selectedOrder.createdAt), 'dd/MM/yyyy') : 'N/A'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Location</h3>
                <p>{selectedOrder?.location || 'Not specified'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Priority Level</h3>
                <p className="capitalize">{selectedOrder?.priorityLevel || 'Normal'}</p>
              </div>
            </div>
            
            {selectedOrder?.orderType === 'production' ? (
              <>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Final Product</h3>
                  <p>{selectedOrder?.finalProduct || 'N/A'}</p>
                </div>
               
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Raw Materials</h3>
                  {selectedOrder?.materials ? (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Material</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(typeof selectedOrder.materials === 'string' 
                            ? JSON.parse(selectedOrder.materials)
                            : selectedOrder.materials
                          ).map((material: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{material.name}</TableCell>
                              <TableCell>{material.quantity} {material.unitOfMeasure}</TableCell>
                              <TableCell>${material.unitPrice}</TableCell>
                              <TableCell>${(material.quantity * parseFloat(material.unitPrice)).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No materials specified</p>
                  )}
                </div>

                {selectedOrder?.packaging && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Packaging</h3>
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(typeof selectedOrder.packaging === 'string' 
                            ? JSON.parse(selectedOrder.packaging)
                            : selectedOrder.packaging
                          ).map((item: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{item.quantity} {item.unitOfMeasure}</TableCell>
                              <TableCell>${item.unitPrice}</TableCell>
                              <TableCell>${(item.quantity * parseFloat(item.unitPrice)).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Source Type</h3>
                  <p className="capitalize">{selectedOrder?.sourceType || 'N/A'}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Source ID</h3>
                  <p>{selectedOrder?.sourceId || 'N/A'}</p>
                </div>

                {selectedOrder?.refiningSteps && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Refining Steps</h3>
                    <div className="space-y-1">
                      {(typeof selectedOrder.refiningSteps === 'string' 
                        ? JSON.parse(selectedOrder.refiningSteps)
                        : selectedOrder.refiningSteps
                      ).map((step: any, index: number) => (
                        <div key={index} className="p-2 bg-muted rounded text-sm">
                          {index + 1}. {step}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Expected Output</h3>
                  <p>{selectedOrder?.expectedOutput || 'N/A'}</p>
                </div>
              </>
            )}

            {selectedOrder?.transportationCost && parseFloat(selectedOrder.transportationCost) > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Transportation</h3>
                <p>Cost: ${selectedOrder.transportationCost}</p>
                {selectedOrder.transportationNotes && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedOrder.transportationNotes}</p>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Subtotal</h3>
                <p className="font-semibold">${selectedOrder?.subtotal || '0.00'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Tax ({selectedOrder?.taxPercentage || 14}%)</h3>
                <p className="font-semibold">${selectedOrder?.taxAmount || '0.00'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Cost</h3>
                <p className="text-lg font-bold text-primary">${selectedOrder?.totalCost || '0.00'}</p>
              </div>
            </div>
          </div>
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
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManagement;