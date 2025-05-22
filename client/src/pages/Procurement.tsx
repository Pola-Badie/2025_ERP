import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Filter, FileDown, MoreVertical, Trash2, Edit, AlertCircle, FileCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import PurchaseOrderForm from '@/components/procurement/PurchaseOrderForm';

// Define types for Purchase Order and Supplier
interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplier: string;
  supplierId: number;
  date: string;
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  totalAmount: number;
  items: PurchaseOrderItem[];
}

interface PurchaseOrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const Procurement: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('purchase-orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isPurchaseOrderFormOpen, setIsPurchaseOrderFormOpen] = useState(false);

  // Sample purchase orders data
  const samplePurchaseOrders: PurchaseOrder[] = [
    {
      id: 1,
      poNumber: 'PO-2025-001',
      supplier: 'PharmaSupply Ltd',
      supplierId: 1,
      date: '2025-01-15',
      status: 'pending',
      totalAmount: 15750.00,
      items: []
    },
    {
      id: 2,
      poNumber: 'PO-2025-002',
      supplier: 'MedChem Corp',
      supplierId: 1,
      date: '2025-01-18',
      status: 'sent',
      totalAmount: 22400.00,
      items: []
    },
    {
      id: 3,
      poNumber: 'PO-2025-003',
      supplier: 'ChemicalWorks Inc',
      supplierId: 1,
      date: '2025-01-20',
      status: 'received',
      totalAmount: 8950.00,
      items: []
    },
    {
      id: 4,
      poNumber: 'PO-2025-004',
      supplier: 'BioMaterials Co',
      supplierId: 1,
      date: '2025-01-22',
      status: 'pending',
      totalAmount: 18600.00,
      items: []
    },
    {
      id: 5,
      poNumber: 'PO-2025-005',
      supplier: 'GlobalPharma Supply',
      supplierId: 1,
      date: '2025-01-22',
      status: 'draft',
      totalAmount: 31200.00,
      items: []
    },
    {
      id: 6,
      poNumber: 'PO-2025-006',
      supplier: 'SpecialChem Ltd',
      supplierId: 1,
      date: '2025-01-23',
      status: 'sent',
      totalAmount: 14750.00,
      items: []
    }
  ];

  // Use sample data instead of API for now
  const purchaseOrders = samplePurchaseOrders;
  const isLoading = false;

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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCreatePurchaseOrder = () => {
    setIsPurchaseOrderFormOpen(true);
  };

  const handleEditPurchaseOrder = (po: PurchaseOrder) => {
    // Implementation will be added in future updates
    toast({
      title: "Edit Purchase Order",
      description: `Editing PO #${po.poNumber}`,
    });
  };

  const handleDeletePurchaseOrder = (po: PurchaseOrder) => {
    // Implementation will be added in future updates
    toast({
      title: "Delete Purchase Order",
      description: `Are you sure you want to delete PO #${po.poNumber}?`,
      variant: "destructive",
    });
  };

  const handleChangePurchaseOrderStatus = (po: PurchaseOrder, newStatus: string) => {
    // Implementation will be added in future updates
    toast({
      title: "Status Changed",
      description: `PO #${po.poNumber} status changed to ${newStatus}`,
    });
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
      </div>

      <Tabs defaultValue="purchase-orders" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="received-items">Received Items</TabsTrigger>
          <TabsTrigger value="inventory-requests">Inventory Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="purchase-orders" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <CardTitle>Purchase Orders</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search purchase orders..."
                      className="pl-8 w-full md:w-[250px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-full sm:w-[130px]">
                      <div className="flex items-center">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Status" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="w-full sm:w-auto" onClick={handleCreatePurchaseOrder}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Order
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredPurchaseOrders && filteredPurchaseOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO Number</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPurchaseOrders.map((po) => (
                        <TableRow key={po.id}>
                          <TableCell className="font-medium">{po.poNumber}</TableCell>
                          <TableCell>{po.supplier}</TableCell>
                          <TableCell>{format(new Date(po.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{getStatusBadge(po.status)}</TableCell>
                          <TableCell className="text-right">${po.totalAmount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditPurchaseOrder(po)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                {po.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => handleChangePurchaseOrderStatus(po, 'sent')}>
                                    <FileCheck className="mr-2 h-4 w-4" />
                                    Mark as Sent
                                  </DropdownMenuItem>
                                )}
                                {po.status === 'sent' && (
                                  <DropdownMenuItem onClick={() => handleChangePurchaseOrderStatus(po, 'received')}>
                                    <FileCheck className="mr-2 h-4 w-4" />
                                    Mark as Received
                                  </DropdownMenuItem>
                                )}
                                {(po.status === 'draft' || po.status === 'sent') && (
                                  <DropdownMenuItem onClick={() => handleChangePurchaseOrderStatus(po, 'cancelled')}>
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    Cancel
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleDeletePurchaseOrder(po)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                    <FileDown className="h-10 w-10 text-slate-500" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">No purchase orders found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Get started by creating a new purchase order.
                  </p>
                  <Button className="mt-4" onClick={handleCreatePurchaseOrder}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Order
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="received-items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Received Items</CardTitle>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <h3 className="text-lg font-semibold">Received Items Module</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This feature will allow tracking and processing received inventory items.
                  </p>
                </div>
              </CardContent>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="inventory-requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Requests</CardTitle>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <h3 className="text-lg font-semibold">Inventory Requests Module</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This feature will allow departments to request inventory items.
                  </p>
                </div>
              </CardContent>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for creating a new purchase order */}
      <Dialog open={isPurchaseOrderFormOpen} onOpenChange={setIsPurchaseOrderFormOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Create a new purchase order to send to a supplier
            </DialogDescription>
          </DialogHeader>
          <PurchaseOrderForm 
            onSuccess={() => setIsPurchaseOrderFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Procurement;