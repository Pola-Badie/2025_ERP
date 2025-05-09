import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  PlusCircle, 
  Filter, 
  Loader2, 
  ArrowLeft, 
  ChevronsUpDown, 
  Eye,
  FileText,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { queryClient } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import OrderForm from '@/components/orders/OrderForm';

const OrderManagement = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [orderType, setOrderType] = useState<'production' | 'refining'>('production');
  const [activeView, setActiveView] = useState<'list' | 'create'>('create');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const handleTabChange = (value: string) => {
    setOrderType(value as 'production' | 'refining');
  };

  // Fetch orders
  const { data: orders, isLoading: isLoadingOrders, refetch } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      return response.json();
    }
  });

  const filteredOrders = orders ? orders.filter((order: any) => {
    // Filter by order type
    const typeMatch = order.orderType === orderType;
    
    // Filter by search query
    const searchLower = searchQuery.toLowerCase();
    const orderNumberMatch = order.orderNumber?.toLowerCase().includes(searchLower);
    const customerNameMatch = order.customerName?.toLowerCase().includes(searchLower) || 
                             order.customer?.name?.toLowerCase().includes(searchLower);
    const productMatch = order.finalProduct?.toLowerCase().includes(searchLower) || 
                         order.expectedOutput?.toLowerCase().includes(searchLower);
    
    return typeMatch && (searchQuery === '' || orderNumberMatch || customerNameMatch || productMatch);
  }) : [];

  const handleCreateOrder = () => {
    setActiveView('create');
  };

  const handleBackToList = () => {
    setActiveView('list');
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleEditOrder = (orderId: number) => {
    // Navigation to edit page would go here
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
      
      // Refetch orders
      refetch();
      
      toast({
        title: "Success",
        description: "Order deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting order:', error);
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
      description: "Invoice creation from orders will be implemented in a future update.",
    });
    // This would navigate to create invoice page with order data pre-filled
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (e) {
      return dateString || 'N/A';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  if (activeView === 'create') {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={handleBackToList} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
          <h1 className="text-2xl font-bold">Create Order</h1>
        </div>
        
        <OrderForm 
          onCancel={handleBackToList} 
          onSuccess={() => {
            setActiveView('list');
            queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('orderManagement')}</h1>
        <div className="flex gap-2">
          <Button onClick={handleCreateOrder} size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Order
          </Button>
        </div>
      </div>

      <Tabs defaultValue="production" onValueChange={handleTabChange}>
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="production">Production Orders</TabsTrigger>
            <TabsTrigger value="refining">Refining Orders</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[250px]"
            />
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
        
        <TabsContent value="production" className="mt-4">
          {isLoadingOrders ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Materials</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber || order.batchNumber}</TableCell>
                        <TableCell>{order.customerName || order.customer?.name || "Unknown customer"}</TableCell>
                        <TableCell>{order.finalProduct || "N/A"}</TableCell>
                        <TableCell>
                          {order.materials ? 
                            (typeof order.materials === 'string' ? 
                              JSON.parse(order.materials).length : 
                              order.materials.length) : 0} items
                        </TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(order.status || 'pending')}>
                            {order.status || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>${parseFloat(order.totalCost || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <span className="sr-only">Open menu</span>
                                <ChevronsUpDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditOrder(order.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCreateInvoice(order.id)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Create Invoice
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteConfirm(order.id)}
                                className="text-red-600 hover:text-red-800 focus:text-red-800"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
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
          {isLoadingOrders ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Source Material</TableHead>
                    <TableHead>Expected Output</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber || order.batchNumber}</TableCell>
                        <TableCell>{order.customerName || order.customer?.name || "Unknown customer"}</TableCell>
                        <TableCell>{order.sourceMaterial || "N/A"}</TableCell>
                        <TableCell>{order.expectedOutput || "N/A"}</TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(order.status || 'pending')}>
                            {order.status || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>${parseFloat(order.totalCost || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <span className="sr-only">Open menu</span>
                                <ChevronsUpDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditOrder(order.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCreateInvoice(order.id)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Create Invoice
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteConfirm(order.id)}
                                className="text-red-600 hover:text-red-800 focus:text-red-800"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
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

      {/* View Order Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder?.orderNumber || selectedOrder?.batchNumber || 'Order Details'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Batch Number</h3>
                  <p>{selectedOrder.orderNumber || selectedOrder.batchNumber}</p>
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
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Status</h3>
                  <Badge className={getStatusBadgeColor(selectedOrder.status || 'pending')}>
                    {selectedOrder.status || 'pending'}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Created</h3>
                  <p>{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Total Cost</h3>
                  <p>${parseFloat(selectedOrder.totalCost || 0).toFixed(2)}</p>
                </div>
              </div>
              
              {selectedOrder.orderType === 'production' ? (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Target Product</h3>
                    <p>{selectedOrder.finalProduct || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Materials</h3>
                    {selectedOrder.materials ? (
                      <div className="border rounded-md p-2">
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
                                <TableCell>{material.quantity}</TableCell>
                                <TableCell>${parseFloat(material.unitPrice).toFixed(2)}</TableCell>
                                <TableCell>
                                  ${(parseFloat(material.unitPrice) * material.quantity).toFixed(2)}
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