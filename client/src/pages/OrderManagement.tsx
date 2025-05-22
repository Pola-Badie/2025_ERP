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
  const [activeTab, setActiveTab] = useState('create');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [batchNumber, setBatchNumber] = useState('');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  
  // Production order states
  const [rawMaterials, setRawMaterials] = useState([]);
  const [materialToAdd, setMaterialToAdd] = useState(null);
  const [materialQuantity, setMaterialQuantity] = useState(0);
  const [materialUnitPrice, setMaterialUnitPrice] = useState('0.00');
  const [finalProductDescription, setFinalProductDescription] = useState('');
  
  // Packaging states
  const [packagingItems, setPackagingItems] = useState([]);
  const [packagingToAdd, setPackagingToAdd] = useState(null);
  const [packagingQuantity, setPackagingQuantity] = useState(0);
  const [packagingUnitPrice, setPackagingUnitPrice] = useState('0.00');
  const [taxPercentage, setTaxPercentage] = useState(14);
  const [subtotalPrice, setSubtotalPrice] = useState('0.00');
  const [totalPrice, setTotalPrice] = useState('0.00');
  const [transportationCost, setTransportationCost] = useState('0.00');
  const [transportationNotes, setTransportationNotes] = useState('');
  
  // Refining order states
  const [refiningBatchNumber, setRefiningBatchNumber] = useState('');
  const [sourceType, setSourceType] = useState('production');
  const [sourceProductionOrder, setSourceProductionOrder] = useState('');
  const [sourceStockItem, setSourceStockItem] = useState('');
  const [refiningSteps, setRefiningSteps] = useState([]);
  const [newRefiningStep, setNewRefiningStep] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [refiningTaxPercentage, setRefiningTaxPercentage] = useState(14);
  const [refiningSubtotal, setRefiningSubtotal] = useState('0.00');
  const [refiningCost, setRefiningCost] = useState('0.00');
  const [refiningTransportationCost, setRefiningTransportationCost] = useState('0.00');
  const [refiningTransportationNotes, setRefiningTransportationNotes] = useState('');
  
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
    return allOrders?.filter((order) => order.orderType === 'production') || [];
  }, [allOrders]);
  
  const refiningOrders = React.useMemo(() => {
    return allOrders?.filter((order) => order.orderType === 'refining') || [];
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
      return products.filter((p) => 
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
  const filteredCustomers = customers ? customers.filter((customer) => {
    const term = customerSearchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(term) ||
      customer.company?.toLowerCase().includes(term) ||
      customer.sector?.toLowerCase().includes(term)
    );
  }) : [];
  
  const handleTabChange = (value) => {
    setActiveTab(value);
    
    // Generate appropriate batch number when switching tabs
    if (value === 'create' && !batchNumber) {
      generateBatchNumber('production');
    } else if (value === 'refining' && !refiningBatchNumber) {
      generateBatchNumber('refining');
    }
  };
  
  const generateBatchNumber = async (type) => {
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
    
    if (!materialQuantity || materialQuantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }
    
    const material = materials.find((m) => m.id.toString() === materialToAdd.toString());
    if (!material) {
      toast({
        title: "Material Not Found",
        description: "The selected material could not be found",
        variant: "destructive",
      });
      return;
    }
    
    const newMaterial = {
      id: material.id,
      name: material.name,
      quantity: materialQuantity,
      unitPrice: materialUnitPrice || "0.00",
      unitOfMeasure: material.unitOfMeasure || 'g',
      total: (materialQuantity * parseFloat(materialUnitPrice || 0)).toFixed(2)
    };
    
    setRawMaterials([...rawMaterials, newMaterial]);
    setMaterialToAdd(null);
    setMaterialQuantity(0);
    setMaterialUnitPrice("0.00");
  };
  
  const handleRemoveMaterial = (index) => {
    const newMaterials = [...rawMaterials];
    newMaterials.splice(index, 1);
    setRawMaterials(newMaterials);
  };
  
  const handleAddPackaging = () => {
    if (!packagingToAdd) {
      toast({
        title: "Missing Packaging",
        description: "Please select a packaging item to add",
        variant: "destructive",
      });
      return;
    }
    
    if (!packagingQuantity || packagingQuantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }
    
    const packaging = packagingMaterials.find((p) => p.id.toString() === packagingToAdd.toString());
    if (!packaging) {
      toast({
        title: "Packaging Not Found",
        description: "The selected packaging could not be found",
        variant: "destructive",
      });
      return;
    }
    
    const newPackaging = {
      id: packaging.id,
      name: packaging.name,
      quantity: packagingQuantity,
      unitPrice: packagingUnitPrice || "0.00",
      unitOfMeasure: packaging.unitOfMeasure || 'pcs',
      total: (packagingQuantity * parseFloat(packagingUnitPrice || 0)).toFixed(2)
    };
    
    setPackagingItems([...packagingItems, newPackaging]);
    setPackagingToAdd(null);
    setPackagingQuantity(0);
    setPackagingUnitPrice("0.00");
  };
  
  const handleRemovePackaging = (index) => {
    const newItems = [...packagingItems];
    newItems.splice(index, 1);
    setPackagingItems(newItems);
  };
  
  const handleAddRefiningStep = () => {
    if (!newRefiningStep.trim()) {
      toast({
        title: "Empty Step",
        description: "Please enter a refining step",
        variant: "destructive",
      });
      return;
    }
    
    setRefiningSteps([...refiningSteps, newRefiningStep.trim()]);
    setNewRefiningStep('');
  };
  
  const handleRemoveRefiningStep = (index) => {
    const newSteps = [...refiningSteps];
    newSteps.splice(index, 1);
    setRefiningSteps(newSteps);
  };
  
  const handleCreateProductionOrder = async () => {
    if (!selectedCustomer) {
      toast({
        title: "Missing Customer",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }
    
    if (!batchNumber) {
      toast({
        title: "Missing Batch Number",
        description: "Please generate a batch number",
        variant: "destructive",
      });
      return;
    }
    
    if (rawMaterials.length === 0) {
      toast({
        title: "No Materials",
        description: "Please add at least one raw material",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const orderData = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        batchNumber,
        finalProduct: finalProductDescription,
        materials: JSON.stringify(rawMaterials),
        packaging: JSON.stringify(packagingItems),
        transportationCost,
        transportationNotes,
        subtotal: subtotalPrice,
        taxPercentage,
        totalCost: totalPrice,
        orderType: 'production',
        status: 'pending'
      };
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create production order');
      }
      
      // Reset form fields
      setBatchNumber('');
      setRawMaterials([]);
      setPackagingItems([]);
      setFinalProductDescription('');
      setTransportationCost('0.00');
      setTransportationNotes('');
      
      // Generate new batch number
      generateBatchNumber('production');
      
      // Refetch orders
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      toast({
        title: "Order Created",
        description: "Production order created successfully",
      });
    } catch (error) {
      console.error('Error creating production order:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create production order",
        variant: "destructive",
      });
    }
  };
  
  const handleCreateRefiningOrder = async () => {
    if (!selectedCustomer) {
      toast({
        title: "Missing Customer",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }
    
    if (!refiningBatchNumber) {
      toast({
        title: "Missing Batch Number",
        description: "Please generate a batch number",
        variant: "destructive",
      });
      return;
    }
    
    if (refiningSteps.length === 0) {
      toast({
        title: "No Refining Steps",
        description: "Please add at least one refining step",
        variant: "destructive",
      });
      return;
    }
    
    try {
      let sourceData = {};
      if (sourceType === 'production') {
        if (!sourceProductionOrder) {
          toast({
            title: "Missing Source Order",
            description: "Please select a source production order",
            variant: "destructive",
          });
          return;
        }
        sourceData = {
          sourceType: 'production',
          sourceId: sourceProductionOrder
        };
      } else {
        if (!sourceStockItem) {
          toast({
            title: "Missing Source Item",
            description: "Please select a source stock item",
            variant: "destructive",
          });
          return;
        }
        sourceData = {
          sourceType: 'stock',
          sourceId: sourceStockItem
        };
      }
      
      const orderData = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        batchNumber: refiningBatchNumber,
        ...sourceData,
        refiningSteps: JSON.stringify(refiningSteps),
        expectedOutput,
        transportationCost: refiningTransportationCost,
        transportationNotes: refiningTransportationNotes,
        subtotal: refiningSubtotal,
        taxPercentage: refiningTaxPercentage,
        totalCost: refiningCost,
        orderType: 'refining',
        status: 'pending'
      };
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create refining order');
      }
      
      // Reset form fields
      setRefiningBatchNumber('');
      setSourceProductionOrder('');
      setSourceStockItem('');
      setRefiningSteps([]);
      setExpectedOutput('');
      setRefiningTransportationCost('0.00');
      setRefiningTransportationNotes('');
      setRefiningSubtotal('0.00');
      
      // Generate new batch number
      generateBatchNumber('refining');
      
      // Refetch orders
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      toast({
        title: "Order Created",
        description: "Refining order created successfully",
      });
    } catch (error) {
      console.error('Error creating refining order:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create refining order",
        variant: "destructive",
      });
    }
  };
  
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };
  
  const confirmDeleteOrder = (orderId) => {
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
      
      // Refetch orders
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
      
      toast({
        title: "Order Deleted",
        description: "Order deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete order",
        variant: "destructive",
      });
    }
  };
  
  const handleCreateInvoice = (orderId) => {
    // Navigate to create invoice page with order ID
    window.location.href = `/create-invoice?orderId=${orderId}`;
  };
  
  // Export production orders to CSV
  const handleExportProductionOrders = () => {
    if (productionOrders.length === 0) {
      toast({
        title: "No Orders",
        description: "There are no production orders to export",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const headers = [
        'Batch Number',
        'Customer',
        'Final Product',
        'Materials',
        'Packaging',
        'Transportation Cost',
        'Subtotal',
        'Tax %',
        'Total Cost',
        'Status',
        'Created At'
      ];
      
      const rows = productionOrders.map(order => [
        order.batchNumber,
        order.customerName,
        order.finalProduct || 'N/A',
        JSON.stringify(typeof order.materials === 'string' ? JSON.parse(order.materials) : order.materials || []),
        JSON.stringify(typeof order.packaging === 'string' ? JSON.parse(order.packaging) : order.packaging || []),
        order.transportationCost || '0.00',
        order.subtotal || '0.00',
        order.taxPercentage || '0',
        order.totalCost || '0.00',
        order.status || 'pending',
        order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'N/A'
      ]);
      
      // Create CSV content
      let csvContent = headers.join(',') + '\n';
      rows.forEach(row => {
        csvContent += row.map(cell => {
          // Handle cells with commas by wrapping in quotes
          return typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell;
        }).join(',') + '\n';
      });
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `production-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting production orders:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export production orders",
        variant: "destructive",
      });
    }
  };
  
  // Export production orders by warehouse
  const handleExportProductionOrdersByWarehouse = (warehouse) => {
    if (productionOrders.length === 0) {
      toast({
        title: "No Orders",
        description: "There are no production orders to export",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const filteredOrders = productionOrders.filter(order => 
        order.warehouse === warehouse ||
        // If no warehouse field, include in main floor export
        (!order.warehouse && warehouse === 'Central Storage')
      );
      
      if (filteredOrders.length === 0) {
        toast({
          title: "No Orders",
          description: `There are no production orders for ${warehouse}`,
          variant: "destructive",
        });
        return;
      }
      
      const headers = [
        'Batch Number',
        'Customer',
        'Final Product',
        'Materials',
        'Packaging',
        'Transportation Cost',
        'Subtotal',
        'Tax %',
        'Total Cost',
        'Status',
        'Created At',
        'Warehouse'
      ];
      
      const rows = filteredOrders.map(order => [
        order.batchNumber,
        order.customerName,
        order.finalProduct || 'N/A',
        JSON.stringify(typeof order.materials === 'string' ? JSON.parse(order.materials) : order.materials || []),
        JSON.stringify(typeof order.packaging === 'string' ? JSON.parse(order.packaging) : order.packaging || []),
        order.transportationCost || '0.00',
        order.subtotal || '0.00',
        order.taxPercentage || '0',
        order.totalCost || '0.00',
        order.status || 'pending',
        order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'N/A',
        warehouse
      ]);
      
      // Create CSV content
      let csvContent = headers.join(',') + '\n';
      rows.forEach(row => {
        csvContent += row.map(cell => {
          // Handle cells with commas by wrapping in quotes
          return typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell;
        }).join(',') + '\n';
      });
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `production-orders-${warehouse.toLowerCase().replace(/ /g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting production orders:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export production orders",
        variant: "destructive",
      });
    }
  };
  
  // Export refining orders to CSV
  const handleExportRefiningOrders = () => {
    if (refiningOrders.length === 0) {
      toast({
        title: "No Orders",
        description: "There are no refining orders to export",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const headers = [
        'Batch Number',
        'Customer',
        'Source Type',
        'Source ID',
        'Refining Steps',
        'Expected Output',
        'Transportation Cost',
        'Subtotal',
        'Tax %',
        'Total Cost',
        'Status',
        'Created At'
      ];
      
      const rows = refiningOrders.map(order => [
        order.batchNumber,
        order.customerName,
        order.sourceType || 'N/A',
        order.sourceId || 'N/A',
        JSON.stringify(typeof order.refiningSteps === 'string' ? JSON.parse(order.refiningSteps) : order.refiningSteps || []),
        order.expectedOutput || 'N/A',
        order.transportationCost || '0.00',
        order.subtotal || '0.00',
        order.taxPercentage || '0',
        order.totalCost || '0.00',
        order.status || 'pending',
        order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'N/A'
      ]);
      
      // Create CSV content
      let csvContent = headers.join(',') + '\n';
      rows.forEach(row => {
        csvContent += row.map(cell => {
          // Handle cells with commas by wrapping in quotes
          return typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell;
        }).join(',') + '\n';
      });
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `refining-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting refining orders:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export refining orders",
        variant: "destructive",
      });
    }
  };
  
  // Export refining orders by warehouse
  const handleExportRefiningOrdersByWarehouse = (warehouse) => {
    if (refiningOrders.length === 0) {
      toast({
        title: "No Orders",
        description: "There are no refining orders to export",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const filteredOrders = refiningOrders.filter(order => 
        order.warehouse === warehouse ||
        // If no warehouse field, include in main floor export
        (!order.warehouse && warehouse === 'Central Storage')
      );
      
      if (filteredOrders.length === 0) {
        toast({
          title: "No Orders",
          description: `There are no refining orders for ${warehouse}`,
          variant: "destructive",
        });
        return;
      }
      
      const headers = [
        'Batch Number',
        'Customer',
        'Source Type',
        'Source ID',
        'Refining Steps',
        'Expected Output',
        'Transportation Cost',
        'Subtotal',
        'Tax %',
        'Total Cost',
        'Status',
        'Created At',
        'Warehouse'
      ];
      
      const rows = filteredOrders.map(order => [
        order.batchNumber,
        order.customerName,
        order.sourceType || 'N/A',
        order.sourceId || 'N/A',
        JSON.stringify(typeof order.refiningSteps === 'string' ? JSON.parse(order.refiningSteps) : order.refiningSteps || []),
        order.expectedOutput || 'N/A',
        order.transportationCost || '0.00',
        order.subtotal || '0.00',
        order.taxPercentage || '0',
        order.totalCost || '0.00',
        order.status || 'pending',
        order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'N/A',
        warehouse
      ]);
      
      // Create CSV content
      let csvContent = headers.join(',') + '\n';
      rows.forEach(row => {
        csvContent += row.map(cell => {
          // Handle cells with commas by wrapping in quotes
          return typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell;
        }).join(',') + '\n';
      });
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `refining-orders-${warehouse.toLowerCase().replace(/ /g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting refining orders:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export refining orders",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Order Management</h1>
      </div>
      
      <Tabs defaultValue="create" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="create">Production Orders</TabsTrigger>
          <TabsTrigger value="refining">Refining Orders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
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
                            {filteredCustomers.map((customer) => (
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
                        {materials?.map((material) => (
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
                        {packagingMaterials?.map((item) => (
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
                      productionOrders.map((order) => (
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
                            {filteredCustomers.map((customer) => (
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
                    <div className="grid gap-4">
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
                            {productionOrders?.map((order) => (
                              <SelectItem key={order.id} value={order.id.toString()}>
                                {order.batchNumber} - {order.finalProduct || 'Production Order'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Select Raw Material</Label>
                        <Select
                          value={sourceStockItem}
                          onValueChange={setSourceStockItem}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select raw material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials?.map((material) => (
                              <SelectItem key={material.id} value={material.id.toString()}>
                                {material.name} ({material.unitOfMeasure})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      <div>
                        <Label>Select Stock Item</Label>
                        <Select
                          value={sourceStockItem}
                          onValueChange={setSourceStockItem}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select stock item" />
                          </SelectTrigger>
                          <SelectContent>
                            {semiFinishedProducts?.map((item) => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Select Raw Material</Label>
                        <Select
                          value={materialToAdd?.toString() || ""}
                          onValueChange={(value) => setMaterialToAdd(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select raw material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials?.map((material) => (
                              <SelectItem key={material.id} value={material.id.toString()}>
                                {material.name} ({material.unitOfMeasure || 'g'})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
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
                        {materials?.map((material) => (
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
                    <Label>Output Description</Label>
                    <Textarea
                      placeholder="Describe the expected output from refining..."
                      value={expectedOutput}
                      onChange={(e) => setExpectedOutput(e.target.value)}
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
              
              {/* Order Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                
                <div className="grid gap-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Subtotal Cost ($)</Label>
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
                      <TableHead>Source Type</TableHead>
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
                      refiningOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.batchNumber}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell>{order.sourceType || 'N/A'}</TableCell>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder?.orderType === 'production' ? 'Production Order' : 'Refining Order'} - 
              {selectedOrder?.batchNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Customer</h3>
                  <p>{selectedOrder.customerName}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Batch Number</h3>
                  <p>{selectedOrder.batchNumber}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Status</h3>
                  <Badge variant={
                    selectedOrder.status === 'completed' ? 'success' :
                    selectedOrder.status === 'pending' ? 'default' :
                    selectedOrder.status === 'cancelled' ? 'destructive' : 'secondary'
                  }>
                    {selectedOrder.status || 'Pending'}
                  </Badge>
                </div>
              </div>
              
              {selectedOrder.orderType === 'production' ? (
                // Production Order Details
                <div className="space-y-4">
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
                              : selectedOrder.materials || []
                            ).map((material, index) => (
                              <TableRow key={index}>
                                <TableCell>{material.name}</TableCell>
                                <TableCell>{material.quantity} {material.unitOfMeasure}</TableCell>
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
                      <p>No materials</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Packaging</h3>
                    {selectedOrder.packaging && (
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Unit Price</TableHead>
                              <TableHead>Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(typeof selectedOrder.packaging === 'string' 
                              ? JSON.parse(selectedOrder.packaging) 
                              : selectedOrder.packaging || []
                            ).map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{item.quantity} {item.unitOfMeasure}</TableCell>
                                <TableCell>${parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                                <TableCell>
                                  ${(item.quantity * parseFloat(item.unitPrice)).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Refining Order Details
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-1">Source Type</h3>
                      <p>{selectedOrder.sourceType || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-1">Source ID</h3>
                      <p>{selectedOrder.sourceId || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Refining Steps</h3>
                    {selectedOrder.refiningSteps ? (
                      <div className="bg-muted p-4 rounded-md">
                        <ol className="list-decimal pl-5 space-y-2">
                          {(typeof selectedOrder.refiningSteps === 'string' 
                            ? JSON.parse(selectedOrder.refiningSteps) 
                            : selectedOrder.refiningSteps || []
                          ).map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    ) : (
                      <p>No refining steps</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Expected Output</h3>
                    <p>{selectedOrder.expectedOutput || 'N/A'}</p>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Transportation</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cost:</p>
                    <p>${parseFloat(selectedOrder.transportationCost || 0).toFixed(2)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Notes:</p>
                    <p>{selectedOrder.transportationNotes || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Order Summary</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Subtotal:</p>
                    <p>${parseFloat(selectedOrder.subtotal || 0).toFixed(2)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Tax (%):</p>
                    <p>{selectedOrder.taxPercentage || 0}%</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost:</p>
                    <p className="font-bold">${parseFloat(selectedOrder.totalCost || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
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
