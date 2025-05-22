import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit, MoreHorizontal, Trash2, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

interface PurchaseOrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplier: string;
  supplierId: number;
  date: string;
  status: 'draft' | 'sent' | 'received' | 'cancelled' | 'pending';
  totalAmount: number;
  items: PurchaseOrderItem[];
}

export default function Procurement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPurchaseOrderFormOpen, setIsPurchaseOrderFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");

  // Sample purchase orders data
  const samplePurchaseOrders: PurchaseOrder[] = [
    {
      id: 1,
      poNumber: "PO-2024-001",
      supplier: "MedChem Supplies Ltd",
      supplierId: 1,
      date: "2024-05-20",
      status: 'pending',
      totalAmount: 25420.00,
      items: []
    },
    {
      id: 2,
      poNumber: "PO-2024-002", 
      supplier: "PharmaCorp International",
      supplierId: 2,
      date: "2024-05-18",
      status: 'received',
      totalAmount: 18950.00,
      items: []
    },
    {
      id: 3,
      poNumber: "PO-2024-003",
      supplier: "Global Chemical Solutions",
      supplierId: 3,
      date: "2024-05-15",
      status: 'draft',
      totalAmount: 31200.00,
      items: []
    },
    {
      id: 4,
      poNumber: "PO-2024-004",
      supplier: "BioActive Materials Inc",
      supplierId: 4,
      date: "2024-05-12",
      status: 'cancelled',
      totalAmount: 8950.00,
      items: []
    },
    {
      id: 5,
      poNumber: "PO-2024-005",
      supplier: "Precision Pharmaceuticals",
      supplierId: 5,
      date: "2024-05-10",
      status: 'pending',
      totalAmount: 22300.00,
      items: []
    },
    {
      id: 6,
      poNumber: "PO-2024-006",
      supplier: "ChemSource Distribution",
      supplierId: 6,
      date: "2024-05-08",
      status: 'sent',
      totalAmount: 14750.00,
      items: []
    }
  ];

  // Use sample data instead of API for now
  const [purchaseOrders, setPurchaseOrders] = useState(samplePurchaseOrders);
  const isLoading = false;

  // Fetch suppliers from API
  useEffect(() => {
    fetch('/api/suppliers')
      .then(res => res.json())
      .then(data => setSuppliers(data))
      .catch(err => console.error('Error fetching suppliers:', err));
  }, []);

  // Handler functions for purchase order actions
  const handleEditPurchaseOrder = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setIsPurchaseOrderFormOpen(true);
    toast({
      title: "Edit Purchase Order",
      description: `Opening ${order.poNumber} for editing`,
    });
  };

  const handleChangePurchaseOrderStatus = (order: PurchaseOrder, newStatus: string) => {
    setPurchaseOrders(prev => 
      prev.map(po => 
        po.id === order.id 
          ? { ...po, status: newStatus as PurchaseOrder['status'] }
          : po
      )
    );
    toast({
      title: "Status Updated", 
      description: `${order.poNumber} marked as ${newStatus}`,
    });
  };

  const handleDeletePurchaseOrder = (order: PurchaseOrder) => {
    setPurchaseOrders(prev => prev.filter(po => po.id !== order.id));
    toast({
      title: "Purchase Order Deleted",
      description: `${order.poNumber} has been deleted`,
      variant: "destructive",
    });
  };

  const handleCreatePurchaseOrder = () => {
    setEditingOrder(null);
    setIsPurchaseOrderFormOpen(true);
  };

  // Filter purchase orders based on search term and status
  const filteredPurchaseOrders = purchaseOrders?.filter(po => {
    const matchesSearch = 
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Function to get status badge styling
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'draft':
        return <Badge variant="outline" className="bg-slate-100 text-slate-700">Draft</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-blue-100 text-blue-700">Sent</Badge>;
      case 'received':
        return <Badge variant="outline" className="bg-green-100 text-green-700">Received</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-700">Cancelled</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Procurement</h2>
          <p className="text-muted-foreground">
            Manage purchase orders and supplier inventory
          </p>
        </div>
        <Button onClick={handleCreatePurchaseOrder} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Purchase Order
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by PO number or supplier..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
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
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8">Loading purchase orders...</div>
        ) : filteredPurchaseOrders && filteredPurchaseOrders.length > 0 ? (
          filteredPurchaseOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{order.poNumber}</h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-muted-foreground mb-1">
                      <strong>Supplier:</strong> {order.supplier}
                    </p>
                    <p className="text-muted-foreground mb-1">
                      <strong>Date:</strong> {new Date(order.date).toLocaleDateString()}
                    </p>
                    <p className="text-lg font-semibold text-green-600">
                      ${order.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPurchaseOrder(order)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleChangePurchaseOrderStatus(order, 'sent')}>
                          Mark as Sent
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangePurchaseOrderStatus(order, 'received')}>
                          Mark as Received
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangePurchaseOrderStatus(order, 'cancelled')}>
                          Mark as Cancelled
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeletePurchaseOrder(order)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
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

      {/* Edit Purchase Order Dialog */}
      <Dialog open={isPurchaseOrderFormOpen} onOpenChange={setIsPurchaseOrderFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingOrder ? `Edit ${editingOrder.poNumber}` : 'New Purchase Order'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input 
                id="supplier" 
                defaultValue={editingOrder?.supplier || ''} 
                placeholder="Enter supplier name"
              />
            </div>
            <div>
              <Label htmlFor="materials">Materials</Label>
              <Input 
                id="materials" 
                placeholder="Enter materials needed"
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input 
                id="amount" 
                defaultValue={editingOrder?.totalAmount || ''} 
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select defaultValue={editingOrder?.status || 'draft'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  toast({
                    title: "Purchase Order Saved",
                    description: `${editingOrder?.poNumber || 'New order'} has been saved successfully`,
                  });
                  setIsPurchaseOrderFormOpen(false);
                }}
                className="flex-1"
              >
                Save Changes
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsPurchaseOrderFormOpen(false)}
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