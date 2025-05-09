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
        // Filter raw materials - using 'raw' as the value for product type
        const rawMats = data.filter((p: any) => p.productType === 'raw');
        console.log('Raw materials found:', rawMats.length);
        setRawMaterials(rawMats);
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
                    <td className="px-4 py-2">${parseFloat(material.costPrice || 0).toFixed(2)}</td>
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
                              unitPrice: material.costPrice || 0
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

  if (activeView === 'create') {
    return (
      <div className="p-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={handleBackToList} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
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
  }

  return (
    <div className="p-6 space-y-6">
      {/* Raw Materials Dialog */}
      <RawMaterialsDialog />
      
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Target Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders && orders
                    .filter((order: any) => order.orderType === 'production')
                    .map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber || order.batchNumber}</TableCell>
                        <TableCell>{order.customer?.name || order.customerName || "Unknown customer"}</TableCell>
                        <TableCell>{order.targetProduct?.name || order.finalProduct || "N/A"}</TableCell>
                        <TableCell>
                          <Badge className={cn(getStatusBadgeColor(order.status))}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>${parseFloat(order.totalCost || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  {(!orders || orders.filter((order: any) => order.orderType === 'production').length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No production orders found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Refining Steps</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders && orders
                    .filter((order: any) => order.orderType === 'refining')
                    .map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber || order.batchNumber}</TableCell>
                        <TableCell>{order.customer?.name || order.customerName || "Unknown customer"}</TableCell>
                        <TableCell>{order.refiningSteps || "Not specified"}</TableCell>
                        <TableCell>
                          <Badge className={cn(getStatusBadgeColor(order.status))}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>${parseFloat(order.totalCost || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  {(!orders || orders.filter((order: any) => order.orderType === 'refining').length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No refining orders found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderManagement;