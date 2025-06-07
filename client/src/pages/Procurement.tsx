import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit, MoreHorizontal, Trash2, X, Eye, Calendar, DollarSign, Package, Minus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  taxId: string;
  paymentTerms: string;
  currency: string;
  status: string;
}

interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplier: string;
  supplierId: number;
  orderDate: string;
  expectedDeliveryDate: string;
  status: 'draft' | 'sent' | 'received' | 'cancelled' | 'pending';
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentTerms: string;
  paymentDueDate: string;
  notes: string;
  createdAt: string;
}

export default function Procurement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPurchaseOrderFormOpen, setIsPurchaseOrderFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [detailsOrder, setDetailsOrder] = useState<PurchaseOrder | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    supplierId: "",
    poNumber: "",
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: "",
    subtotal: "0",
    taxRate: "14",
    taxAmount: "0",
    totalAmount: "0",
    paymentMethod: "",
    paymentTerms: "Net 30",
    notes: ""
  });

  // Items state
  const [items, setItems] = useState([
    {
      id: Date.now(),
      productId: "",
      productName: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0
    }
  ]);

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/procurement/suppliers'],
    queryFn: async () => {
      const response = await fetch('/api/procurement/suppliers');
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      return response.json();
    }
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    }
  });

  // Fetch purchase orders
  const { data: purchaseOrders = [], isLoading } = useQuery({
    queryKey: ['/api/procurement/purchase-orders', statusFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/procurement/purchase-orders?${params}`);
      if (!response.ok) throw new Error('Failed to fetch purchase orders');
      return response.json();
    }
  });

  // Create purchase order mutation
  const createPurchaseOrder = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch('/api/procurement/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (!response.ok) throw new Error('Failed to create purchase order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/procurement/purchase-orders'] });
      toast({
        title: "Success",
        description: "Purchase order created successfully"
      });
      setIsPurchaseOrderFormOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create purchase order",
        variant: "destructive"
      });
    }
  });

  // Update purchase order status mutation
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await fetch(`/api/procurement/purchase-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/procurement/purchase-orders'] });
      toast({
        title: "Success",
        description: "Purchase order status updated successfully"
      });
    }
  });

  // Item management functions
  const addItem = () => {
    setItems([...items, {
      id: Date.now(),
      productId: "",
      productName: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0
    }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // If product is selected, update product name
        if (field === 'productId' && value) {
          const product = products.find((p: any) => p.id === parseInt(value));
          if (product) {
            updatedItem.productName = product.name;
            updatedItem.unitPrice = parseFloat(product.sellingPrice) || 0;
          }
        }
        
        // Calculate total
        if (field === 'quantity' || field === 'unitPrice' || field === 'productId') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateItemTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxRate = parseFloat(formData.taxRate) || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    setFormData(prev => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2)
    }));
  };

  const resetForm = () => {
    setFormData({
      supplierId: "",
      poNumber: "",
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: "",
      subtotal: "0",
      taxRate: "14",
      taxAmount: "0",
      totalAmount: "0",
      paymentMethod: "",
      paymentTerms: "Net 30",
      notes: ""
    });
    setItems([{
      id: Date.now(),
      productId: "",
      productName: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0
    }]);
    setEditingOrder(null);
  };

  const handleFormSubmit = () => {
    if (!formData.supplierId || items.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a supplier and add at least one item",
        variant: "destructive"
      });
      return;
    }

    // Validate items
    const invalidItems = items.filter(item => !item.productId || item.quantity <= 0 || item.unitPrice <= 0);
    if (invalidItems.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please ensure all items have a product, quantity, and unit price",
        variant: "destructive"
      });
      return;
    }

    const orderData = {
      ...formData,
      supplierId: parseInt(formData.supplierId),
      subtotal: parseFloat(formData.subtotal),
      taxRate: parseFloat(formData.taxRate),
      taxAmount: parseFloat(formData.taxAmount),
      totalAmount: parseFloat(formData.totalAmount),
      userId: 1, // TODO: Get from auth context
      items: items.map(item => ({
        productId: item.productId ? parseInt(item.productId) : null,
        productName: item.productName,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total
      }))
    };

    createPurchaseOrder.mutate(orderData);
  };

  const calculateTotals = () => {
    const subtotal = parseFloat(formData.subtotal) || 0;
    const taxRate = parseFloat(formData.taxRate) || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    setFormData(prev => ({
      ...prev,
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2)
    }));
  };

  useEffect(() => {
    calculateItemTotals();
  }, [items, formData.taxRate]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: "bg-gray-100 text-gray-800", label: "Draft" },
      sent: { color: "bg-blue-100 text-blue-800", label: "Sent" },
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      received: { color: "bg-green-100 text-green-800", label: "Received" },
      cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const filteredOrders = purchaseOrders.filter((order: PurchaseOrder) => {
    const matchesSearch = !searchTerm || 
      order.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Procurement</h2>
          <p className="text-muted-foreground">
            Manage purchase orders and supplier inventory
          </p>
        </div>
        <Button 
          onClick={() => setIsPurchaseOrderFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Purchase Order
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search purchase orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading purchase orders...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order: PurchaseOrder) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{order.poNumber}</h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Supplier:</strong> {order.supplier}</p>
                      <p><strong>Order Date:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
                      {order.expectedDeliveryDate && (
                        <p><strong>Expected Delivery:</strong> {new Date(order.expectedDeliveryDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        ${order.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total Amount
                      </p>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setDetailsOrder(order);
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingOrder(order);
                            setIsPurchaseOrderFormOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {order.status === 'sent' && (
                          <DropdownMenuItem
                            onClick={() => updateOrderStatus.mutate({
                              orderId: order.id,
                              status: 'received'
                            })}
                          >
                            Mark as Received
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => updateOrderStatus.mutate({
                            orderId: order.id,
                            status: 'cancelled'
                          })}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Cancel Order
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">No purchase orders found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your search or create a new purchase order
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Purchase Order Form Dialog */}
      <Dialog open={isPurchaseOrderFormOpen} onOpenChange={setIsPurchaseOrderFormOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2 text-blue-600" />
              {editingOrder ? `Edit ${editingOrder.poNumber}` : 'New Purchase Order'}
            </DialogTitle>
            <DialogDescription>
              Create a new purchase order with detailed item specifications
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Supplier and Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Order Details</CardTitle>
                <CardDescription>Basic information for this purchase order</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier">Supplier *</Label>
                    <Select 
                      value={formData.supplierId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, supplierId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier: Supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="orderDate">Order Date</Label>
                    <Input 
                      type="date"
                      value={formData.orderDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="expectedDelivery">Expected Delivery</Label>
                    <Input 
                      type="date"
                      value={formData.expectedDeliveryDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Select 
                      value={formData.paymentTerms} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, paymentTerms: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Net 15">Net 15 Days</SelectItem>
                        <SelectItem value="Net 30">Net 30 Days</SelectItem>
                        <SelectItem value="Net 45">Net 45 Days</SelectItem>
                        <SelectItem value="Net 60">Net 60 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Order Items</CardTitle>
                <CardDescription>Add products to this purchase order</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addItem}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>

                {/* Items Table */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Product</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[100px]">Qty</TableHead>
                        <TableHead className="w-[120px]">Unit Price</TableHead>
                        <TableHead className="w-[120px]">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Select
                              value={item.productId}
                              onValueChange={(value) => updateItem(item.id, 'productId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((product: any) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.description}
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                              placeholder="Item description"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              ${item.total.toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {items.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Totals */}
                <div className="mt-6 space-y-4">
                  <div className="flex justify-end">
                    <div className="w-80 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${formData.subtotal}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Tax Rate:</span>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.taxRate}
                            onChange={(e) => setFormData(prev => ({ ...prev, taxRate: e.target.value }))}
                            className="w-20"
                          />
                          <span>%</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax Amount:</span>
                        <span>${formData.taxAmount}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total Amount:</span>
                        <span>${formData.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes, requirements, or special instructions..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleFormSubmit}
                disabled={createPurchaseOrder.isPending}
                className="flex-1"
              >
                {createPurchaseOrder.isPending ? 'Saving...' : 'Save Purchase Order'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsPurchaseOrderFormOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Purchase Order Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailsOrder ? `${detailsOrder.poNumber} - Details` : 'Purchase Order Details'}
            </DialogTitle>
          </DialogHeader>
          {detailsOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Supplier</h4>
                  <p>{detailsOrder.supplier}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Status</h4>
                  {getStatusBadge(detailsOrder.status)}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Order Date</h4>
                  <p>{new Date(detailsOrder.orderDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Expected Delivery</h4>
                  <p>{detailsOrder.expectedDeliveryDate ? new Date(detailsOrder.expectedDeliveryDate).toLocaleDateString() : 'Not specified'}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="font-semibold">Financial Summary</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${detailsOrder.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({detailsOrder.taxRate}%):</span>
                    <span>${detailsOrder.taxAmount.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>${detailsOrder.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {detailsOrder.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                    {detailsOrder.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}