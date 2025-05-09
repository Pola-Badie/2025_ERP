import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, 
  Filter, 
  Loader2, 
  ArrowLeft, 
  ChevronsUpDown, 
  Check, 
  Plus, 
  Trash, 
  Edit, 
  Eye 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import OrderForm from '@/components/orders/OrderForm';

const OrderManagement = () => {
  const { toast } = useToast();
  const [orderType, setOrderType] = useState<'production' | 'refining'>('production');
  const [activeView, setActiveView] = useState<'list' | 'create'>('list');
  const { t } = useLanguage();
  
  // New state for tab-based interface
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [batchNumber, setBatchNumber] = useState('BATCH-0001');
  const [selectedMaterials, setSelectedMaterials] = useState<any[]>([]);
  const [productDescription, setProductDescription] = useState('');
  const [totalPrice, setTotalPrice] = useState('0.00');
  const [productionOrders, setProductionOrders] = useState<any[]>([]);
  
  // Refining Order state
  const [selectedRefiningCustomer, setSelectedRefiningCustomer] = useState<any>(null);
  const [refiningBatchNumber, setRefiningBatchNumber] = useState('BATCH-0001');
  const [sourceType, setSourceType] = useState<string>('production');
  const [selectedProductionOrder, setSelectedProductionOrder] = useState<string>('');
  const [selectedStockItem, setSelectedStockItem] = useState<string>('');
  const [refiningSteps, setRefiningSteps] = useState<string[]>([]);
  const [expectedOutput, setExpectedOutput] = useState('');
  const [costAdjustments, setCostAdjustments] = useState('0.00');
  const [refiningOrders, setRefiningOrders] = useState<any[]>([]);
  
  // Additional data
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [isRawMaterialsDialogOpen, setIsRawMaterialsDialogOpen] = useState(false);
  
  // Helper functions
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (e) {
      return dateString;
    }
  };
  
  const calculateSubtotal = (material: any) => {
    const quantity = parseFloat(material.quantity) || 0;
    const unitPrice = parseFloat(material.unitPrice) || 0;
    return (quantity * unitPrice).toFixed(2);
  };
  
  const updateMaterialQuantity = (index: number, quantity: number) => {
    const newMaterials = [...selectedMaterials];
    newMaterials[index] = { ...newMaterials[index], quantity };
    setSelectedMaterials(newMaterials);
    
    // Update total price
    updateTotalPrice(newMaterials);
  };
  
  const updateMaterialPrice = (index: number, price: string) => {
    const newMaterials = [...selectedMaterials];
    newMaterials[index] = { ...newMaterials[index], unitPrice: price };
    setSelectedMaterials(newMaterials);
    
    // Update total price
    updateTotalPrice(newMaterials);
  };
  
  const updateTotalPrice = (materials: any[]) => {
    const total = materials.reduce((sum, material) => {
      return sum + (parseFloat(calculateSubtotal(material)) || 0);
    }, 0);
    setTotalPrice(total.toFixed(2));
  };
  
  const removeMaterial = (index: number) => {
    const newMaterials = selectedMaterials.filter((_, i) => i !== index);
    setSelectedMaterials(newMaterials);
    updateTotalPrice(newMaterials);
  };
  
  const openRawMaterialsDialog = () => {
    setIsRawMaterialsDialogOpen(true);
  };
  
  const saveNewProductOrder = () => {
    if (!selectedCustomer) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedMaterials.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one raw material",
        variant: "destructive",
      });
      return;
    }
    
    const newOrder = {
      orderType: 'production',
      batchNumber,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      materials: selectedMaterials,
      finalProduct: productDescription,
      totalCost: totalPrice,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    // For demonstration, we're just adding to local state
    // In a real application, you would make an API call
    setProductionOrders([...productionOrders, { ...newOrder, id: Date.now() }]);
    
    // Reset form
    setBatchNumber(`BATCH-${(parseInt(batchNumber.split('-')[1] || '0') + 1).toString().padStart(4, '0')}`);
    setSelectedMaterials([]);
    setProductDescription('');
    setTotalPrice('0.00');
    
    toast({
      title: "Success",
      description: "Production order created successfully",
    });
  };
  
  const addProcessStep = () => {
    setRefiningSteps([...refiningSteps, '']);
  };
  
  const updateRefiningStep = (index: number, value: string) => {
    const newSteps = [...refiningSteps];
    newSteps[index] = value;
    setRefiningSteps(newSteps);
  };
  
  const removeRefiningStep = (index: number) => {
    setRefiningSteps(refiningSteps.filter((_, i) => i !== index));
  };
  
  const saveRefiningOrder = () => {
    if (!selectedRefiningCustomer) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }
    
    if (!sourceType) {
      toast({
        title: "Error",
        description: "Please select a source type",
        variant: "destructive",
      });
      return;
    }
    
    const sourceMaterial = sourceType === 'production' 
      ? productionOrders.find(o => o.id.toString() === selectedProductionOrder)?.finalProduct
      : products.find(p => p.id.toString() === selectedStockItem)?.name;
    
    if (!sourceMaterial) {
      toast({
        title: "Error",
        description: "Please select a source material",
        variant: "destructive",
      });
      return;
    }
    
    const newOrder = {
      orderType: 'refining',
      batchNumber: refiningBatchNumber,
      customerId: selectedRefiningCustomer.id,
      customerName: selectedRefiningCustomer.name,
      sourceMaterial,
      refiningSteps: refiningSteps.join(', '),
      expectedOutput,
      totalCost: costAdjustments,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    // For demonstration, we're just adding to local state
    setRefiningOrders([...refiningOrders, { ...newOrder, id: Date.now() }]);
    
    // Reset form
    setRefiningBatchNumber(`BATCH-${(parseInt(refiningBatchNumber.split('-')[1] || '0') + 1).toString().padStart(4, '0')}`);
    setSourceType('production');
    setSelectedProductionOrder('');
    setSelectedStockItem('');
    setRefiningSteps([]);
    setExpectedOutput('');
    setCostAdjustments('0.00');
    
    toast({
      title: "Success",
      description: "Refining order created successfully",
    });
  };
  
  // Fetch data
  useEffect(() => {
    // Fetch customers
    fetch('/api/customers')
      .then(response => response.json())
      .then(data => setCustomers(data))
      .catch(error => console.error('Error fetching customers:', error));
    
    // Fetch products
    fetch('/api/products')
      .then(response => response.json())
      .then(data => {
        setProducts(data);
        // Filter raw materials
        setRawMaterials(data.filter((p: any) => p.productType === 'raw'));
      })
      .catch(error => console.error('Error fetching products:', error));
      
    // Generate batch numbers
    setBatchNumber(`BATCH-${Math.floor(1000 + Math.random() * 9000)}`);
    setRefiningBatchNumber(`BATCH-${Math.floor(1000 + Math.random() * 9000)}`);
  }, []);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      return response.json();
    }
  });

  const handleCreateOrder = () => {
    setActiveView('create');
  };

  const handleBackToList = () => {
    setActiveView('list');
  };

  const handleTabChange = (value: string) => {
    setOrderType(value as 'production' | 'refining');
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-200 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-200 text-blue-800';
      case 'completed':
        return 'bg-green-200 text-green-800';
      case 'cancelled':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const ListingView = () => (
    <>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('orders')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button onClick={handleCreateOrder} size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Order
          </Button>
        </div>
      </div>

      <Tabs defaultValue="production" onValueChange={handleTabChange}>
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="production">Production Orders</TabsTrigger>
          <TabsTrigger value="refining">Refining Orders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="production" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders && orders
                    .filter(order => order.orderType === 'production')
                    .map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.customer?.name || "Unknown customer"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.targetProduct?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={cn(getStatusBadgeColor(order.status))}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${parseFloat(order.totalCost).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                            View
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  {(!orders || orders.filter(order => order.orderType === 'production').length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                        No production orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="refining" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Refining Steps
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders && orders
                    .filter(order => order.orderType === 'refining')
                    .map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.customer?.name || "Unknown customer"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.refiningSteps || "Not specified"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={cn(getStatusBadgeColor(order.status))}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${parseFloat(order.totalCost).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                            View
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  {(!orders || orders.filter(order => order.orderType === 'refining').length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                        No refining orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );

  const CreateView = () => (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" onClick={handleBackToList} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
        <h1 className="text-2xl font-bold">Create {orderType === 'production' ? 'Production' : 'Refining'} Order</h1>
      </div>
      
      <OrderForm 
        onCancel={handleBackToList} 
        onSuccess={() => {
          setActiveView('list');
          // Invalidate and refetch the orders
          queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        }}
      />
    </div>
  );

  // Dialog for selecting raw materials
  const RawMaterialsDialog = () => (
    <Dialog open={isRawMaterialsDialogOpen} onOpenChange={setIsRawMaterialsDialogOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Raw Materials</DialogTitle>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left">Material</th>
                <th className="px-4 py-2 text-left">Stock</th>
                <th className="px-4 py-2 text-left">Price</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {rawMaterials.length > 0 ? (
                rawMaterials.map((material) => (
                  <tr key={material.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{material.name}</td>
                    <td className="px-4 py-2">{material.quantity || 0}</td>
                    <td className="px-4 py-2">${parseFloat(material.costPrice).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          // Check if already selected
                          const exists = selectedMaterials.some(m => m.id === material.id);
                          if (!exists) {
                            const newMaterial = {
                              id: material.id,
                              name: material.name,
                              quantity: 1,
                              unitPrice: material.costPrice
                            };
                            setSelectedMaterials([...selectedMaterials, newMaterial]);
                            updateTotalPrice([...selectedMaterials, newMaterial]);
                          }
                          setIsRawMaterialsDialogOpen(false);
                        }}
                      >
                        Add
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                    No raw materials found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsRawMaterialsDialogOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Raw Materials Dialog */}
      <RawMaterialsDialog />
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
        <div className="flex space-x-2">
          <Tabs defaultValue="newProduct" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="newProduct">New Product Order</TabsTrigger>
              <TabsTrigger value="refining">Refining Order</TabsTrigger>
            </TabsList>
            <TabsContent value="newProduct" className="mt-4">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">New Product Order</h2>
                
                <div className="space-y-6">
                  {/* Customer Selection */}
                  <div className="space-y-4">
                    <Label htmlFor="customer">Choose Customer</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between font-normal"
                        >
                          {selectedCustomer ? selectedCustomer.name : "Select customer..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Search customer..." />
                          <CommandEmpty>No customer found.</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-[200px]">
                              {customers.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={customer.name}
                                  onSelect={() => {
                                    setSelectedCustomer(customer);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedCustomer?.id === customer.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {customer.name}
                                </CommandItem>
                              ))}
                            </ScrollArea>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    
                    {/* Customer Details */}
                    {selectedCustomer && (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p className="font-medium">{selectedCustomer.name}</p>
                        <p className="text-gray-600">{selectedCustomer.company}</p>
                        <div className="mt-1">
                          <Badge variant="secondary">{selectedCustomer.sector}</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Batch Number */}
                  <div className="space-y-2">
                    <Label htmlFor="batchNumber">Batch Number</Label>
                    <Input 
                      id="batchNumber" 
                      value={batchNumber} 
                      onChange={(e) => setBatchNumber(e.target.value)} 
                      placeholder="BATCH-0001" 
                    />
                    <p className="text-sm text-gray-500">Auto-generated, but can be edited</p>
                  </div>
                  
                  {/* Raw Materials Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Raw Materials</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={openRawMaterialsDialog}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Material
                      </Button>
                    </div>
                    
                    {/* Selected Materials List */}
                    {selectedMaterials.length > 0 ? (
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Material</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Unit Price</TableHead>
                              <TableHead>Subtotal</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedMaterials.map((material, index) => (
                              <TableRow key={index}>
                                <TableCell>{material.name}</TableCell>
                                <TableCell>
                                  <Input 
                                    type="number" 
                                    value={material.quantity} 
                                    onChange={(e) => updateMaterialQuantity(index, Number(e.target.value))} 
                                    className="w-20" 
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input 
                                    type="text" 
                                    value={material.unitPrice} 
                                    onChange={(e) => updateMaterialPrice(index, e.target.value)} 
                                    className="w-24" 
                                  />
                                </TableCell>
                                <TableCell>{calculateSubtotal(material)}</TableCell>
                                <TableCell>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => removeMaterial(index)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="border rounded-md p-8 text-center text-gray-500">
                        No raw materials selected
                      </div>
                    )}
                  </div>
                  
                  {/* Final Product Description */}
                  <div className="space-y-2">
                    <Label htmlFor="productDescription">Final Product Description</Label>
                    <Textarea 
                      id="productDescription" 
                      value={productDescription} 
                      onChange={(e) => setProductDescription(e.target.value)} 
                      rows={4}
                    />
                  </div>
                  
                  {/* Total */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="totalPrice">Total Price</Label>
                      <div className="text-sm text-gray-500">Auto-calculated from materials</div>
                    </div>
                    <Input 
                      id="totalPrice" 
                      value={totalPrice} 
                      onChange={(e) => setTotalPrice(e.target.value)} 
                    />
                  </div>
                  
                  {/* Submit Button */}
                  <Button 
                    type="button" 
                    className="w-full"
                    onClick={saveNewProductOrder}
                  >
                    Save Order
                  </Button>
                </div>
              </div>
              
              {/* Production Orders History */}
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Production Orders History</h3>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch No.</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Final Product</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productionOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.batchNumber}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell>{order.finalProduct}</TableCell>
                          <TableCell>{order.totalCost}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                Create Invoice
                              </Button>
                              <Button variant="outline" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {productionOrders.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            No production orders found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="refining" className="mt-4">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Refining Order</h2>
                
                <div className="space-y-6">
                  {/* Customer Selection (Same as New Product) */}
                  <div className="space-y-4">
                    <Label htmlFor="refiningCustomer">Choose Customer</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between font-normal"
                        >
                          {selectedRefiningCustomer ? selectedRefiningCustomer.name : "Select customer..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Search customer..." />
                          <CommandEmpty>No customer found.</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-[200px]">
                              {customers.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={customer.name}
                                  onSelect={() => {
                                    setSelectedRefiningCustomer(customer);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedRefiningCustomer?.id === customer.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {customer.name}
                                </CommandItem>
                              ))}
                            </ScrollArea>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    
                    {/* Customer Details */}
                    {selectedRefiningCustomer && (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p className="font-medium">{selectedRefiningCustomer.name}</p>
                        <p className="text-gray-600">{selectedRefiningCustomer.company}</p>
                        <div className="mt-1">
                          <Badge variant="secondary">{selectedRefiningCustomer.sector}</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Batch Number */}
                  <div className="space-y-2">
                    <Label htmlFor="refiningBatchNumber">Batch Number</Label>
                    <Input 
                      id="refiningBatchNumber" 
                      value={refiningBatchNumber} 
                      onChange={(e) => setRefiningBatchNumber(e.target.value)} 
                      placeholder="BATCH-0001" 
                    />
                    <p className="text-sm text-gray-500">Auto-generated, but can be edited</p>
                  </div>
                  
                  {/* Source Selection */}
                  <div className="space-y-4">
                    <Label htmlFor="sourceType">Source Selection</Label>
                    <RadioGroup 
                      value={sourceType} 
                      onValueChange={(value) => setSourceType(value)}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="production" id="production" />
                        <Label htmlFor="production">From existing Production Orders History</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="stock" id="stock" />
                        <Label htmlFor="stock">From Products/Stock Tab</Label>
                      </div>
                    </RadioGroup>
                    
                    {/* Source Material Selection based on source type */}
                    <div className="mt-4">
                      <Label htmlFor="sourceMaterial">Choose Source Material</Label>
                      {sourceType === 'production' ? (
                        <Select 
                          value={selectedProductionOrder} 
                          onValueChange={setSelectedProductionOrder}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select from production orders..." />
                          </SelectTrigger>
                          <SelectContent>
                            {productionOrders.map((order) => (
                              <SelectItem key={order.id} value={order.id.toString()}>
                                {order.batchNumber} - {order.finalProduct}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select 
                          value={selectedStockItem} 
                          onValueChange={setSelectedStockItem}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select from stock..." />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  
                  {/* Refining Process Steps */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Refining Process Steps</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={addProcessStep}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Step
                      </Button>
                    </div>
                    
                    {refiningSteps.length > 0 ? (
                      <div className="space-y-2">
                        {refiningSteps.map((step, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input 
                              value={step} 
                              onChange={(e) => updateRefiningStep(index, e.target.value)} 
                              placeholder={`Step ${index + 1}`}
                              className="flex-1"
                            />
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeRefiningStep(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border rounded-md p-4 text-center text-gray-500">
                        No refining steps added
                      </div>
                    )}
                  </div>
                  
                  {/* Expected Output Description */}
                  <div className="space-y-2">
                    <Label htmlFor="expectedOutput">Expected Output Description</Label>
                    <Textarea 
                      id="expectedOutput" 
                      value={expectedOutput} 
                      onChange={(e) => setExpectedOutput(e.target.value)} 
                      rows={4}
                    />
                  </div>
                  
                  {/* Cost Adjustments */}
                  <div className="space-y-2">
                    <Label htmlFor="costAdjustments">Cost Adjustments (Optional)</Label>
                    <Input 
                      id="costAdjustments" 
                      value={costAdjustments} 
                      onChange={(e) => setCostAdjustments(e.target.value)} 
                      placeholder="0.00" 
                    />
                  </div>
                  
                  {/* Submit Button */}
                  <Button 
                    type="button" 
                    className="w-full"
                    onClick={saveRefiningOrder}
                  >
                    Save Refining Order
                  </Button>
                </div>
              </div>
              
              {/* Refining Orders History */}
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Refining Orders History</h3>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch No.</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Source Material</TableHead>
                        <TableHead>Expected Output</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {refiningOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.batchNumber}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell>{order.sourceMaterial}</TableCell>
                          <TableCell>{order.expectedOutput}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                Create Invoice
                              </Button>
                              <Button variant="outline" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {refiningOrders.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            No refining orders found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;