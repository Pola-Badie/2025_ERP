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
  Search
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
  const [totalPrice, setTotalPrice] = useState('0.00');
  
  // Refining order states
  const [refiningBatchNumber, setRefiningBatchNumber] = useState('');
  const [sourceType, setSourceType] = useState('production');
  const [sourceProductionOrder, setSourceProductionOrder] = useState<string>('');
  const [sourceStockItem, setSourceStockItem] = useState<string>('');
  const [refiningSteps, setRefiningSteps] = useState<string[]>([]);
  const [newRefiningStep, setNewRefiningStep] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [refiningCost, setRefiningCost] = useState('0.00');
  
  // Calculate total price when raw materials change
  useEffect(() => {
    const total = rawMaterials.reduce((sum, material) => {
      return sum + (material.quantity * parseFloat(material.unitPrice));
    }, 0);
    setTotalPrice(total.toFixed(2));
  }, [rawMaterials]);
  
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
        finalProduct: finalProductDescription,
        totalMaterialCost: totalPrice,
        totalAdditionalFees: '0.00',
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
        refiningSteps: refiningSteps.join('||'),
        expectedOutput,
        totalMaterialCost: '0.00',
        totalAdditionalFees: refiningCost,
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
    setFinalProductDescription('');
    setTotalPrice('0.00');
  };
  
  const resetRefiningForm = () => {
    setSelectedCustomer(null);
    setRefiningBatchNumber('');
    generateBatchNumber('refining');
    setSourceType('production');
    setSourceProductionOrder('');
    setSourceStockItem('');
    setRefiningSteps([]);
    setExpectedOutput('');
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
                          {material.quantity} {material.unitOfMeasure} {material.name}
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
                      <TableCell colSpan={4} className="h-20 text-center">
                        No materials added. Select materials from the dropdown above.
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {rawMaterials.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-right font-medium">
                        Total:
                      </TableCell>
                      <TableCell className="font-bold">
                        ${totalPrice}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
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
          
          <div className="space-y-2">
            <Label>Pricing</Label>
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
          
          <div className="space-y-2">
            <Label>Cost Adjustments</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
              <Input
                type="text"
                placeholder="0.00"
                className="pl-7"
                value={refiningCost}
                onChange={(e) => setRefiningCost(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Enter any additional costs associated with the refining process
            </p>
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