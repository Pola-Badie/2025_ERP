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
  const [subtotalPrice, setSubtotalPrice] = useState('0.00');
  const [totalPrice, setTotalPrice] = useState('0.00');
  const [transportationCost, setTransportationCost] = useState<string>('0.00');
  const [transportationNotes, setTransportationNotes] = useState<string>('');
  
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
  const [refiningTransportationCost, setRefiningTransportationCost] = useState<string>('0.00');
  const [refiningTransportationNotes, setRefiningTransportationNotes] = useState<string>('');
  
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
    const subtotal = parseFloat(refiningSubtotal);
    const transportCost = parseFloat(refiningTransportationCost) || 0;
    const baseSubtotal = subtotal + transportCost;
    const taxAmount = baseSubtotal * (refiningTaxPercentage / 100);
    const total = baseSubtotal + taxAmount;
    setRefiningCost(total.toFixed(2));
  }, [refiningSubtotal, refiningTransportationCost, refiningTaxPercentage]);
  
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
      // Default batch numbers if something fails
      const now = new Date();
      const dateCode = format(now, 'yyMMdd');
      
      if (type === 'production') {
        setBatchNumber(`BATCH-100-${dateCode}`);
      } else {
        setRefiningBatchNumber(`REF-100-${dateCode}`);
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
      // Create a chemical order with improved data structure
      const orderData = {
        orderType: 'production',
        batchNumber,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        company: selectedCustomer.company || '',
        location: "Warehouse 1", // Default warehouse location
        orderCategory: 'chemical',
        chemicalType: 'pharmaceutical',
        materials: rawMaterials,
        packaging: packagingItems,
        finalProduct: finalProductDescription,
        transportationCost: parseFloat(transportationCost) || 0,
        transportationNotes: transportationNotes,
        subtotal: subtotalPrice,
        taxPercentage: taxPercentage,
        taxAmount: (parseFloat(subtotalPrice) * (taxPercentage / 100)).toFixed(2),
        totalMaterialCost: subtotalPrice,
        totalAdditionalFees: (parseFloat(subtotalPrice) * (taxPercentage / 100)).toFixed(2),
        totalCost: totalPrice,
        status: 'pending',
        priorityLevel: 'normal',
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
      
      // Reset the form
      setSelectedCustomer(null);
      setRawMaterials([]);
      setPackagingItems([]);
      setFinalProductDescription('');
      setTransportationCost('0.00');
      setTransportationNotes('');
      
      // Generate a new batch number
      generateBatchNumber('production');
      
      // Refresh the orders data
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create production order",
        variant: "destructive",
      });
    }
  };
  
  const handleCreateRefiningOrder = async () => {
    if (!validateRefiningOrder()) return;
    
    try {
      // Create the refining order data
      const refiningOrderData = {
        orderType: 'refining',
        batchNumber: refiningBatchNumber,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        company: selectedCustomer.company || '',
        location: "Warehouse 1", // Default warehouse location
        orderCategory: 'chemical',
        chemicalType: 'pharmaceutical',
        sourceType,
        sourceMaterial: sourceType === 'production' 
          ? sourceProductionOrder 
          : sourceStockItem,
        refiningSteps: refiningSteps.join('||'), // Join steps with separator for storage
        expectedOutput,
        transportationCost: parseFloat(refiningTransportationCost) || 0,
        transportationNotes: refiningTransportationNotes,
        subtotal: refiningSubtotal,
        taxPercentage: refiningTaxPercentage,
        taxAmount: (parseFloat(refiningSubtotal) * (refiningTaxPercentage / 100)).toFixed(2),
        totalCost: refiningCost,
        status: 'pending',
        priorityLevel: 'normal',
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
        throw new Error(`Failed to create refining order: ${response.statusText}`);
      }
      
      toast({
        title: "Success",
        description: "Refining order created successfully",
      });
      
      // Reset the form
      setSelectedCustomer(null);
      setSourceType('production');
      setSourceProductionOrder('');
      setSourceStockItem('');
      setRefiningSteps([]);
      setExpectedOutput('');
      setRefiningSubtotal('0.00');
      setRefiningTransportationCost('0.00');
      setRefiningTransportationNotes('');
      
      // Generate a new batch number
      generateBatchNumber('refining');
      
      // Refresh the orders data
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
    } catch (error) {
      console.error('Error creating refining order:', error);
      toast({
        title: "Error",
        description: "Failed to create refining order",
        variant: "destructive",
      });
    }
  };
  
  const validateProductionOrder = () => {
    if (!selectedCustomer) {
      toast({
        title: "Missing Customer",
        description: "Please select a customer for this order",
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
    
    if (!finalProductDescription.trim()) {
      toast({
        title: "Missing Product Description",
        description: "Please enter a description for the final product",
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
        description: "Please select a customer for this refining order",
        variant: "destructive",
      });
      return false;
    }
    
    if (sourceType === 'production' && !sourceProductionOrder) {
      toast({
        title: "Missing Source",
        description: "Please select a source production order",
        variant: "destructive",
      });
      return false;
    }
    
    if (sourceType === 'stock' && !sourceStockItem) {
      toast({
        title: "Missing Source",
        description: "Please select a source stock item",
        variant: "destructive",
      });
      return false;
    }
    
    if (refiningSteps.length === 0) {
      toast({
        title: "No Refining Steps",
        description: "Please add at least one refining step",
        variant: "destructive",
      });
      return false;
    }
    
    if (!expectedOutput.trim()) {
      toast({
        title: "Missing Expected Output",
        description: "Please enter the expected output of the refining process",
        variant: "destructive",
      });
      return false;
    }
    
    if (parseFloat(refiningSubtotal) <= 0) {
      toast({
        title: "Invalid Cost",
        description: "Please enter a valid cost for the refining process",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };
  
  const handleDeleteOrder = async () => {
    if (orderToDelete === null) return;
    
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
      
      // Close the dialog
      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
      
      // Refresh the orders data
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    }
  };
  
  const confirmDeleteOrder = (orderId: number) => {
    setOrderToDelete(orderId);
    setIsDeleteDialogOpen(true);
  };
  
  const handleCreateInvoice = async (orderId: number) => {
    try {
      // This could send a request to create an invoice based on the order
      toast({
        title: "Creating Invoice",
        description: "Redirecting to create invoice page...",
      });
      
      // Navigate to the create invoice page or open a modal
      // This is a placeholder for navigation
      
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
    }
  };
  
  // Function to handle exporting production orders to CSV
  const handleExportProductionOrders = () => {
    try {
      // Define CSV headers 
      const headers = [
        'Batch Number',
        'Customer',
        'Final Product',
        'Materials',
        'Packaging',
        'Total Cost',
        'Tax Amount',
        'Date Created',
        'Location',
        'Status'
      ];
      
      // Format the data for CSV
      const rows = productionOrders.map((order: any) => [
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
      link.setAttribute('download', `production-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: `Successfully exported ${productionOrders.length} production orders`
      });
    } catch (error) {
      console.error('Error exporting production orders:', error);
      toast({
        title: "Export Failed",
        description: "Error exporting production orders",
        variant: "destructive"
      });
    }
  };
  
  // Function to handle warehouse-specific exports for production orders
  const handleExportProductionOrdersByWarehouse = (warehouseType: string) => {
    try {
      const filteredOrders = productionOrders.filter((order: any) => 
        order.location === warehouseType || 
        order.warehouseLocation === warehouseType
      );
      
      if (filteredOrders.length === 0) {
        toast({
          title: "Export Failed",
          description: `No orders found in ${warehouseType}`,
          variant: "destructive"
        });
        return;
      }
      
      // Define CSV headers 
      const headers = [
        'Batch Number',
        'Customer',
        'Final Product',
        'Materials',
        'Packaging',
        'Total Cost',
        'Tax Amount',
        'Date Created',
        'Location',
        'Status'
      ];
      
      // Format the data for CSV
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
  
  // Function to handle exporting refining orders to CSV
  const handleExportRefiningOrders = () => {
    try {
      // Define CSV headers 
      const headers = [
        'Batch Number',
        'Customer',
        'Expected Output',
        'Source Type',
        'Source Material',
        'Total Cost',
        'Tax Amount',
        'Date Created',
        'Location',
        'Status'
      ];
      
      // Format the data for CSV
      const rows = refiningOrders.map((order: any) => [
        order.batchNumber || 'Unknown',
        order.customerName || 'Unknown',
        order.expectedOutput || 'N/A',
        order.sourceType || 'Unknown',
        order.sourceMaterial || 'N/A',
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
      link.setAttribute('download', `refining-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: `Successfully exported ${refiningOrders.length} refining orders`
      });
    } catch (error) {
      console.error('Error exporting refining orders:', error);
      toast({
        title: "Export Failed",
        description: "Error exporting refining orders",
        variant: "destructive"
      });
    }
  };
  
  // Function to handle warehouse-specific exports for refining orders
  const handleExportRefiningOrdersByWarehouse = (warehouseType: string) => {
    try {
      const filteredOrders = refiningOrders.filter((order: any) => 
        order.location === warehouseType || 
        order.warehouseLocation === warehouseType
      );
      
      if (filteredOrders.length === 0) {
        toast({
          title: "Export Failed",
          description: `No orders found in ${warehouseType}`,
          variant: "destructive"
        });
        return;
      }
      
      // Define CSV headers 
      const headers = [
        'Batch Number',
        'Customer',
        'Expected Output',
        'Source Type',
        'Source Material',
        'Total Cost',
        'Tax Amount',
        'Date Created',
        'Location',
        'Status'
      ];
      
      // Format the data for CSV
      const rows = filteredOrders.map((order: any) => [
        order.batchNumber || 'Unknown',
        order.customerName || 'Unknown',
        order.expectedOutput || 'N/A',
        order.sourceType || 'Unknown',
        order.sourceMaterial || 'N/A',
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
        
        <TabsContent value="create">
          {/* Production Orders tab content */}
          <div className="space-y-6">
            <div className="bg-white rounded-md shadow-sm p-6 border">
              <h2 className="text-xl font-bold mb-4">Create Production Order</h2>
              
              {/* Customer Selection */}
              <div className="grid gap-4 mb-6">
                <div className="grid gap-2">
                  <Label>Customer</Label>
                  <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={customerPopoverOpen}
                        className="justify-between"
                      >
                        {selectedCustomer
                          ? `${selectedCustomer.name} - ${selectedCustomer.company || 'No Company'}`
                          : "Select customer..."}
                        <svg className="h-4 w-4 shrink-0 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" />
                        </svg>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[300px]">
                      <Command>
                        <CommandInput
                          placeholder="Search customer..."
                          className="h-9"
                          value={customerSearchTerm}
                          onValueChange={setCustomerSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>No customers found.</CommandEmpty>
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
                                <div className="flex flex-col">
                                  <span>{customer.name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {customer.company || 'No Company'} - {customer.sector || 'No Sector'}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {selectedCustomer && (
                  <div className="bg-muted p-3 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{selectedCustomer.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedCustomer.company}</p>
                        <div className="mt-1">
                          <Badge variant="secondary">{selectedCustomer.sector}</Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCustomer(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Batch Number */}
                <div className="grid gap-2">
                  <Label>Batch Number</Label>
                  <div className="flex gap-2">
                    <Input
                      className="flex-1"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      readOnly
                    />
                    <Button
                      variant="outline"
                      onClick={() => generateBatchNumber('production')}
                      title="Generate new batch number"
                    >
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-.75-.75H11.77a.75.75 0 000 1.5h2.434l-.31.31a7 7 0 00-11.712 3.138.75.75 0 001.449.39 5.5 5.5 0 019.201-2.466l.312.311H7.39a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Raw Materials */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Raw Materials</h3>
                
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <Label>Material</Label>
                    <Select
                      value={materialToAdd?.toString() || ""}
                      onValueChange={(value) => setMaterialToAdd(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials?.map((material: any) => (
                          <SelectItem key={material.id} value={material.id.toString()}>
                            {material.name} ({material.unitOfMeasure || 'g'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="0"
                      value={materialQuantity || ""}
                      onChange={(e) => setMaterialQuantity(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div>
                    <Label>Unit Price ($)</Label>
                    <Input
                      type="text"
                      value={materialUnitPrice}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        setMaterialUnitPrice(value);
                      }}
                    />
                  </div>
                </div>
                
                <Button 
                  variant="outline"
                  onClick={handleAddMaterial}
                  className="mb-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
                
                {/* Materials List */}
                {rawMaterials.length > 0 && (
                  <div className="rounded-md border overflow-hidden mb-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rawMaterials.map((material, index) => (
                          <TableRow key={index}>
                            <TableCell>{material.name}</TableCell>
                            <TableCell>{material.quantity} {material.unitOfMeasure}</TableCell>
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
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
              
              {/* Packaging */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Packaging</h3>
                
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <Label>Packaging Item</Label>
                    <Select
                      value={packagingToAdd?.toString() || ""}
                      onValueChange={(value) => setPackagingToAdd(value)}
                    >
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
                  </div>
                  
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="0"
                      value={packagingQuantity || ""}
                      onChange={(e) => setPackagingQuantity(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div>
                    <Label>Unit Price ($)</Label>
                    <Input
                      type="text"
                      value={packagingUnitPrice}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        setPackagingUnitPrice(value);
                      }}
                    />
                  </div>
                </div>
                
                <Button 
                  variant="outline"
                  onClick={handleAddPackaging}
                  className="mb-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Packaging
                </Button>
                
                {/* Packaging List */}
                {packagingItems.length > 0 && (
                  <div className="rounded-md border overflow-hidden mb-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Packaging Item</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {packagingItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.quantity} {item.unitOfMeasure}</TableCell>
                            <TableCell>${parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                            <TableCell>
                              ${(item.quantity * parseFloat(item.unitPrice)).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemovePackaging(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
              
              {/* Final Product */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Final Product</h3>
                
                <div className="grid gap-4">
                  <div>
                    <Label>Product Description</Label>
                    <Textarea
                      placeholder="Describe the final product..."
                      value={finalProductDescription}
                      onChange={(e) => setFinalProductDescription(e.target.value)}
                      className="resize-none"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
              
              {/* Transportation */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Transportation</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Transportation Cost ($)</Label>
                    <Input
                      type="text"
                      value={transportationCost}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        setTransportationCost(value);
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label>Transportation Notes</Label>
                    <Textarea
                      placeholder="Add notes about transportation..."
                      value={transportationNotes}
                      onChange={(e) => setTransportationNotes(e.target.value)}
                      className="resize-none"
                      rows={1}
                    />
                  </div>
                </div>
              </div>
              
              {/* Order Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                
                <div className="grid gap-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Tax Percentage (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={taxPercentage || ""}
                        onChange={(e) => setTaxPercentage(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div>
                      <Label>Subtotal ($)</Label>
                      <Input
                        value={subtotalPrice}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    
                    <div>
                      <Label>Total with Tax ($)</Label>
                      <Input
                        value={totalPrice}
                        readOnly
                        className="bg-muted font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <Button className="w-full" onClick={handleCreateProductionOrder}>
                <Save className="h-4 w-4 mr-2" />
                Save Production Order
              </Button>
            </div>
            
            {/* Production Orders History */}
            <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Production Orders History</h2>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <FileDown className="h-4 w-4" />
                        Export to CSV
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleExportProductionOrders()}>
                        All Warehouses
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportProductionOrdersByWarehouse("Warehouse 1")}>
                        Warehouse 1
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportProductionOrdersByWarehouse("Warehouse 2")}>
                        Warehouse 2
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportProductionOrdersByWarehouse("Central Storage")}>
                        Central Storage
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch No.</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Final Product</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Date Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingOrders ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : productionOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No production orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      productionOrders.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.batchNumber}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell>{order.finalProduct || 'N/A'}</TableCell>
                          <TableCell>${parseFloat(order.totalCost || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            {order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              order.status === 'completed' ? 'success' :
                              order.status === 'pending' ? 'default' :
                              order.status === 'cancelled' ? 'destructive' : 'secondary'
                            }>
                              {order.status || 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
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
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="refining">
          {/* Refining Orders tab content */}
          <div className="space-y-6">
            <div className="bg-white rounded-md shadow-sm p-6 border">
              <h2 className="text-xl font-bold mb-4">Create Refining Order</h2>
              
              {/* Customer Selection (same as in Production Orders) */}
              <div className="grid gap-4 mb-6">
                <div className="grid gap-2">
                  <Label>Customer</Label>
                  <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={customerPopoverOpen}
                        className="justify-between"
                      >
                        {selectedCustomer
                          ? `${selectedCustomer.name} - ${selectedCustomer.company || 'No Company'}`
                          : "Select customer..."}
                        <svg className="h-4 w-4 shrink-0 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" />
                        </svg>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[300px]">
                      <Command>
                        <CommandInput
                          placeholder="Search customer..."
                          className="h-9"
                          value={customerSearchTerm}
                          onValueChange={setCustomerSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>No customers found.</CommandEmpty>
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
                                <div className="flex flex-col">
                                  <span>{customer.name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {customer.company || 'No Company'} - {customer.sector || 'No Sector'}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {selectedCustomer && (
                  <div className="bg-muted p-3 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{selectedCustomer.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedCustomer.company}</p>
                        <div className="mt-1">
                          <Badge variant="secondary">{selectedCustomer.sector}</Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCustomer(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Batch Number */}
                <div className="grid gap-2">
                  <Label>Batch Number</Label>
                  <div className="flex gap-2">
                    <Input
                      className="flex-1"
                      value={refiningBatchNumber}
                      onChange={(e) => setRefiningBatchNumber(e.target.value)}
                      readOnly
                    />
                    <Button
                      variant="outline"
                      onClick={() => generateBatchNumber('refining')}
                      title="Generate new batch number"
                    >
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-.75-.75H11.77a.75.75 0 000 1.5h2.434l-.31.31a7 7 0 00-11.712 3.138.75.75 0 001.449.39 5.5 5.5 0 019.201-2.466l.312.311H7.39a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Source Material */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Source Material</h3>
                
                <div className="grid gap-4">
                  <RadioGroup
                    value={sourceType}
                    onValueChange={(value) => setSourceType(value)}
                    className="grid grid-cols-2 gap-4 mb-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="production" id="production" />
                      <Label htmlFor="production">Production Order</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="stock" id="stock" />
                      <Label htmlFor="stock">Stock Item</Label>
                    </div>
                  </RadioGroup>
                  
                  {sourceType === 'production' ? (
                    <div>
                      <Label>Select Production Order</Label>
                      <Select
                        value={sourceProductionOrder}
                        onValueChange={(value) => setSourceProductionOrder(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select production order" />
                        </SelectTrigger>
                        <SelectContent>
                          {productionOrders?.map((order: any) => (
                            <SelectItem key={order.id} value={order.id.toString()}>
                              {order.batchNumber} - {order.finalProduct || 'Production Order'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div>
                      <Label>Select Stock Item</Label>
                      <Select
                        value={sourceStockItem}
                        onValueChange={(value) => setSourceStockItem(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select stock item" />
                        </SelectTrigger>
                        <SelectContent>
                          {semiFinishedProducts?.map((item: any) => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Refining Steps */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Refining Steps</h3>
                
                <div className="grid gap-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add refining step..."
                      value={newRefiningStep}
                      onChange={(e) => setNewRefiningStep(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      variant="outline"
                      onClick={handleAddRefiningStep}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Step
                    </Button>
                  </div>
                  
                  {refiningSteps.length > 0 && (
                    <div className="bg-muted p-4 rounded-md">
                      <h4 className="font-medium mb-2">Process Steps:</h4>
                      <ol className="list-decimal pl-5 space-y-2">
                        {refiningSteps.map((step, index) => (
                          <li key={index} className="flex justify-between items-center">
                            <span>{step}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveRefiningStep(index)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Expected Output */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Expected Output</h3>
                
                <div className="grid gap-4">
                  <div>
                    <Label>Expected Output Description</Label>
                    <Textarea
                      placeholder="Describe the expected output..."
                      value={expectedOutput}
                      onChange={(e) => setExpectedOutput(e.target.value)}
                      className="resize-none"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
              
              {/* Transportation for Refining */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Transportation</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Transportation Cost ($)</Label>
                    <Input
                      type="text"
                      value={refiningTransportationCost}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        setRefiningTransportationCost(value);
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label>Transportation Notes</Label>
                    <Textarea
                      placeholder="Add notes about transportation..."
                      value={refiningTransportationNotes}
                      onChange={(e) => setRefiningTransportationNotes(e.target.value)}
                      className="resize-none"
                      rows={1}
                    />
                  </div>
                </div>
              </div>
              
              {/* Cost and Transportation */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Cost and Pricing</h3>
                
                <div className="grid gap-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Refining Cost ($)</Label>
                      <Input
                        type="text"
                        value={refiningSubtotal}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          setRefiningSubtotal(value);
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label>Tax Percentage (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={refiningTaxPercentage || ""}
                        onChange={(e) => setRefiningTaxPercentage(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div>
                      <Label>Total with Tax ($)</Label>
                      <Input
                        value={refiningCost}
                        readOnly
                        className="bg-muted font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <Button className="w-full" onClick={handleCreateRefiningOrder}>
                <Save className="h-4 w-4 mr-2" />
                Save Refining Order
              </Button>
            </div>
            
            {/* Refining Orders History */}
            <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Refining Orders History</h2>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <FileDown className="h-4 w-4" />
                        Export to CSV
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleExportRefiningOrders()}>
                        All Warehouses
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportRefiningOrdersByWarehouse("Warehouse 1")}>
                        Warehouse 1
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportRefiningOrdersByWarehouse("Warehouse 2")}>
                        Warehouse 2
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportRefiningOrdersByWarehouse("Central Storage")}>
                        Central Storage
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch No.</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Expected Output</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Date Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingOrders ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : refiningOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No refining orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      refiningOrders.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.batchNumber}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell>{order.expectedOutput || 'N/A'}</TableCell>
                          <TableCell>${parseFloat(order.totalCost || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            {order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              order.status === 'completed' ? 'success' :
                              order.status === 'pending' ? 'default' :
                              order.status === 'cancelled' ? 'destructive' : 'secondary'
                            }>
                              {order.status || 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
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
            </div>
          </div>
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
                  selectedOrder?.status === 'completed' ? 'success' :
                  selectedOrder?.status === 'pending' ? 'default' :
                  selectedOrder?.status === 'cancelled' ? 'destructive' : 'secondary'
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
                    <p>No materials specified</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Source Material</h3>
                  <p>{selectedOrder?.sourceMaterial || 'N/A'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Refining Steps</h3>
                  {selectedOrder?.refiningSteps ? (
                    <ol className="list-decimal pl-5 space-y-1">
                      {selectedOrder.refiningSteps.split('||').map((step: string, index: number) => (
                        <li key={index}>{step.trim()}</li>
                      ))}
                    </ol>
                  ) : (
                    <p>No refining steps specified</p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Expected Output</h3>
                  <p>{selectedOrder?.expectedOutput || 'N/A'}</p>
                </div>
              </>
            )}
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Subtotal</h3>
                <p>${parseFloat(selectedOrder?.subtotal || 0).toFixed(2)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Tax Amount</h3>
                <p>${parseFloat(selectedOrder?.taxAmount || 0).toFixed(2)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Cost</h3>
                <p className="font-bold">${parseFloat(selectedOrder?.totalCost || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
          
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
            <DialogTitle>Confirm Deletion</DialogTitle>
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