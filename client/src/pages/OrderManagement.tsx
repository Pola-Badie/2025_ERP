import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrdersList } from '@/components/orders/OrdersList';
import { OrderForm } from '@/components/orders/OrderForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function OrderManagement() {
  const [activeTab, setActiveTab] = useState('production-history');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const { toast } = useToast();

  // Fetch orders
  const { data: allOrders, isLoading: isLoadingOrders, refetch } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    }
  });

  // Filter orders by type
  const productionOrders = useMemo(() => {
    return allOrders?.filter(order => order.orderType === 'production') || [];
  }, [allOrders]);

  const refiningOrders = useMemo(() => {
    return allOrders?.filter(order => order.orderType === 'refining') || [];
  }, [allOrders]);

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleCreateInvoice = (order: any) => {
    setSelectedOrder(order);
    setShowCreateInvoice(true);
  };

  const handleDeleteOrder = async (orderId: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete order');
      
      toast({
        title: "Success",
        description: "Order deleted successfully",
      });
      
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    }
  };

  const handleExportOrders = (orderType: string) => {
    const orders = orderType === 'production' ? productionOrders : refiningOrders;
    
    // Create CSV content
    const headers = ['Batch Number', 'Customer', 'Final Product', 'Total Cost', 'Status', 'Date'];
    const csvContent = [
      headers.join(','),
      ...orders.map(order => [
        order.batchNumber,
        order.customerName,
        order.finalProduct,
        order.totalCost,
        order.status,
        new Date(order.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${orderType}-orders.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: `${orderType} orders exported successfully`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Order Management</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="production-history">Production Orders</TabsTrigger>
          <TabsTrigger value="refining-history">Refining Orders</TabsTrigger>
          <TabsTrigger value="create">Create Production</TabsTrigger>
          <TabsTrigger value="refining">Create Refining</TabsTrigger>
        </TabsList>

        <TabsContent value="production-history">
          <OrdersList
            orders={productionOrders}
            isLoading={isLoadingOrders}
            title="Production Orders History"
            onViewDetails={handleViewDetails}
            onCreateInvoice={handleCreateInvoice}
            onDelete={handleDeleteOrder}
            onExport={() => handleExportOrders('production')}
          />
        </TabsContent>

        <TabsContent value="refining-history">
          <OrdersList
            orders={refiningOrders}
            isLoading={isLoadingOrders}
            title="Refining Orders History"
            onViewDetails={handleViewDetails}
            onCreateInvoice={handleCreateInvoice}
            onDelete={handleDeleteOrder}
            onExport={() => handleExportOrders('refining')}
          />
        </TabsContent>

        <TabsContent value="create">
          <OrderForm orderType="production" onOrderCreated={refetch} />
        </TabsContent>

        <TabsContent value="refining">
          <OrderForm orderType="refining" onOrderCreated={refetch} />
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.batchNumber}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Customer Information</h3>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Final Product</h3>
                  <p className="text-sm text-muted-foreground">{selectedOrder.finalProduct}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Total Cost</h3>
                  <p className="text-lg font-bold text-primary">${selectedOrder.totalCost}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Status</h3>
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    selectedOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                    selectedOrder.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedOrder.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Materials Used</h3>
                <div className="space-y-2">
                  {JSON.parse(selectedOrder.materials || '[]').map((material: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="font-medium">{material.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {material.quantity} {material.unitOfMeasure} × ${material.unitPrice}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateInvoice} onOpenChange={setShowCreateInvoice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p>Create an invoice for order: {selectedOrder?.batchNumber}</p>
            <p>Customer: {selectedOrder?.customerName}</p>
            <p>Total Amount: ${selectedOrder?.totalCost}</p>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  toast({
                    title: "Success",
                    description: "Invoice created successfully",
                  });
                  setShowCreateInvoice(false);
                }}
                className="flex-1"
              >
                Create Invoice
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateInvoice(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}