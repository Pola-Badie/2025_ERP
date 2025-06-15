import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit, MoreHorizontal, Trash2, X, Eye, Upload, FileText, Download, ShoppingBag, Paperclip, Landmark, DollarSign } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
  materials?: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  paymentMethod?: string;
  paymentTerms?: string;
  paymentDueDate?: string;
  documents?: Array<{
    id: number;
    name: string;
    type: string;
    uploadDate: string;
    size: string;
  }>;
}

export default function Procurement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPurchaseOrderFormOpen, setIsPurchaseOrderFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [detailsOrder, setDetailsOrder] = useState<PurchaseOrder | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Sample purchase orders data with materials
  const samplePurchaseOrders: PurchaseOrder[] = [
    {
      id: 1,
      poNumber: "PO-2024-001",
      supplier: "MedChem Supplies Ltd",
      supplierId: 1,
      date: "2024-05-20",
      status: 'pending',
      totalAmount: 25420.00,
      items: [
        { id: 1, productId: 1, productName: "Acetaminophen API", quantity: 500, unitPrice: 42.50, total: 21250.00 },
        { id: 2, productId: 2, productName: "Microcrystalline Cellulose", quantity: 200, unitPrice: 18.50, total: 3700.00 },
        { id: 3, productId: 3, productName: "Magnesium Stearate", quantity: 25, unitPrice: 18.80, total: 470.00 }
      ],
      materials: [
        { name: "Acetaminophen API", quantity: 500, unit: "kg" },
        { name: "Microcrystalline Cellulose", quantity: 200, unit: "kg" },
        { name: "Magnesium Stearate", quantity: 25, unit: "kg" }
      ],
      paymentMethod: "Bank Transfer",
      paymentTerms: "Net 30 Days",
      paymentDueDate: "2024-06-20",
      documents: [
        { id: 1, name: "Receipt_PO-2024-001.pdf", type: "Receipt", uploadDate: "2024-05-21", size: "2.4 MB" },
        { id: 2, name: "Delivery_Note_001.pdf", type: "Delivery Note", uploadDate: "2024-05-21", size: "1.2 MB" }
      ]
    },
    {
      id: 2,
      poNumber: "PO-2024-002", 
      supplier: "PharmaCorp International",
      supplierId: 2,
      date: "2024-05-18",
      status: 'received',
      totalAmount: 18950.00,
      items: [
        { id: 4, productId: 4, productName: "Ibuprofen API", quantity: 300, unitPrice: 55.00, total: 16500.00 },
        { id: 5, productId: 5, productName: "Lactose Monohydrate", quantity: 150, unitPrice: 12.50, total: 1875.00 },
        { id: 6, productId: 6, productName: "Croscarmellose Sodium", quantity: 10, unitPrice: 57.50, total: 575.00 }
      ],
      materials: [
        { name: "Ibuprofen API", quantity: 300, unit: "kg" },
        { name: "Lactose Monohydrate", quantity: 150, unit: "kg" },
        { name: "Croscarmellose Sodium", quantity: 10, unit: "kg" }
      ],
      paymentMethod: "Letter of Credit",
      paymentTerms: "Net 45 Days",
      paymentDueDate: "2024-07-05"
    },
    {
      id: 3,
      poNumber: "PO-2024-003",
      supplier: "Global Chemical Solutions",
      supplierId: 3,
      date: "2024-05-15",
      status: 'draft',
      totalAmount: 31200.00,
      items: [],
      materials: [
        { name: "Amoxicillin Trihydrate", quantity: 250, unit: "kg" },
        { name: "Clavulanic Acid", quantity: 50, unit: "kg" },
        { name: "Sodium Starch Glycolate", quantity: 15, unit: "kg" },
        { name: "Colloidal Silicon Dioxide", quantity: 5, unit: "kg" }
      ],
      paymentMethod: "Cash on Delivery",
      paymentTerms: "Immediate Payment"
    },
    {
      id: 4,
      poNumber: "PO-2024-004",
      supplier: "BioActive Materials Inc",
      supplierId: 4,
      date: "2024-05-12",
      status: 'cancelled',
      totalAmount: 8950.00,
      items: [],
      materials: [
        { name: "Aspirin API", quantity: 100, unit: "kg" },
        { name: "Corn Starch", quantity: 75, unit: "kg" }
      ]
    },
    {
      id: 5,
      poNumber: "PO-2024-005",
      supplier: "Precision Pharmaceuticals",
      supplierId: 5,
      date: "2024-05-10",
      status: 'pending',
      totalAmount: 22300.00,
      items: [],
      materials: [
        { name: "Metformin HCl", quantity: 400, unit: "kg" },
        { name: "Hydroxypropyl Methylcellulose", quantity: 50, unit: "kg" },
        { name: "Polyethylene Glycol", quantity: 20, unit: "kg" }
      ]
    },
    {
      id: 6,
      poNumber: "PO-2024-006",
      supplier: "ChemSource Distribution",
      supplierId: 6,
      date: "2024-05-08",
      status: 'sent',
      totalAmount: 14750.00,
      items: [],
      materials: [
        { name: "Calcium Carbonate", quantity: 300, unit: "kg" },
        { name: "Vitamin D3", quantity: 5, unit: "kg" },
        { name: "Talc", quantity: 25, unit: "kg" }
      ]
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

  // Purchase Items State
  const [purchaseItems, setPurchaseItems] = useState([
    {
      id: 1,
      name: "Ibuprofen 500mg",
      description: "Active Pharmaceutical Ingredient",
      quantity: 500,
      unit: "kg",
      unitPrice: 25.50,
      expiryDate: "2026-12-31",
      discountType: "percentage", // "percentage" or "amount"
      discountValue: 5.0,
      discountAmount: 637.50,
      subtotal: 12750.00,
      total: 12112.50
    }
  ]);
  const [purchaseVatPercentage, setPurchaseVatPercentage] = useState(14);
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);

  // Purchase Item Functions
  const addPurchaseItem = () => {
    const newItem = {
      id: Date.now(),
      name: "",
      description: "",
      quantity: 0,
      unit: "kg",
      unitPrice: 0,
      expiryDate: "",
      discountType: "percentage",
      discountValue: 0,
      discountAmount: 0,
      subtotal: 0,
      total: 0
    };
    setPurchaseItems([...purchaseItems, newItem]);
  };

  const updatePurchaseItem = (id: number, field: string, value: any) => {
    setPurchaseItems(items => items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Calculate subtotal (quantity * unitPrice)
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.subtotal = updatedItem.quantity * updatedItem.unitPrice;
        }
        
        // Calculate discount amount based on type
        if (field === 'discountType' || field === 'discountValue' || field === 'quantity' || field === 'unitPrice') {
          if (updatedItem.discountType === 'percentage') {
            updatedItem.discountAmount = updatedItem.subtotal * (updatedItem.discountValue / 100);
          } else if (updatedItem.discountType === 'amount') {
            updatedItem.discountAmount = updatedItem.discountValue;
          }
        }
        
        // Calculate final total (subtotal - discount)
        updatedItem.total = updatedItem.subtotal - updatedItem.discountAmount;
        
        return updatedItem;
      }
      return item;
    }));
  };

  const removePurchaseItem = (id: number) => {
    setPurchaseItems(items => items.filter(item => item.id !== id));
  };

  const calculatePurchaseSubtotal = () => {
    return purchaseItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculatePurchaseVAT = () => {
    return calculatePurchaseSubtotal() * (purchaseVatPercentage / 100);
  };

  const calculatePurchaseGrandTotal = () => {
    return calculatePurchaseSubtotal() + calculatePurchaseVAT();
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedDocuments(prev => [...prev, ...files]);
  };

  const removeDocument = (index: number) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchases Management</h1>
          <p className="text-slate-600 mt-1">
            Manage purchase records, suppliers, and inventory-related accounting
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button 
            onClick={() => {
              setEditingOrder(null);
              setSelectedSupplier('');
              setIsPurchaseOrderFormOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Purchase
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by PO number or supplier..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="status-filter" className="whitespace-nowrap text-sm font-medium">Status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="w-[160px]">
                  <SelectValue placeholder="All statuses" />
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
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredPurchaseOrders && filteredPurchaseOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ETA No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPurchaseOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.poNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        ETA{order.id.toString().padStart(8, '0')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(order.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.supplier}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs">
                          {(order as any).materials && (order as any).materials.length > 0 ? (
                            <div className="space-y-1">
                              {(order as any).materials.slice(0, 2).map((material: any, index: number) => (
                                <div key={index} className="text-xs">
                                  {material.name} ({material.quantity} {material.unit})
                                </div>
                              ))}
                              {(order as any).materials.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{(order as any).materials.length - 2} more items
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 italic">No items specified</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(order as any).paymentMethod || 'Bank Transfer'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        ${order.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingOrder(order);
                              setSelectedSupplier(order.supplier);
                              setIsPurchaseOrderFormOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDetailsOrder(order);
                              setIsDetailsDialogOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Sent to Financial Accounting",
                                description: `Purchase order ${order.poNumber} has been forwarded to the financial accounting department for processing and payment authorization.`,
                                variant: "default"
                              });
                            }}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Send to Financial Accounting"
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-slate-500 mb-4">No purchase orders found</p>
              <p className="text-sm text-slate-400 mb-4">
                Try adjusting your search or create a new purchase order
              </p>
              <Button 
                onClick={() => {
                  setEditingOrder(null);
                  setSelectedSupplier('');
                  setIsPurchaseOrderFormOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Purchase Order
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Professional New Purchase Dialog */}
      <Dialog open={isPurchaseOrderFormOpen} onOpenChange={setIsPurchaseOrderFormOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 bg-gradient-to-br from-slate-50 to-blue-50 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
              {editingOrder ? `Edit ${editingOrder.poNumber}` : 'New Purchase Order'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Create a detailed pharmaceutical purchase order with itemized products and pricing
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            {/* Purchase Header Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchase-supplier">Supplier</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.name}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="purchase-date">Purchase Date</Label>
                <Input
                  id="purchase-date"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchase-eta">ETA Number</Label>
                <Input
                  id="purchase-eta"
                  placeholder="Auto-generated ETA number"
                  defaultValue={`ETA${new Date().toISOString().slice(2,10).replace(/-/g, '')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`}
                />
              </div>
              <div>
                <Label htmlFor="payment-terms">Payment Terms</Label>
                <Select defaultValue="net30">
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="net15">Net 15 days</SelectItem>
                    <SelectItem value="net30">Net 30 days</SelectItem>
                    <SelectItem value="net45">Net 45 days</SelectItem>
                    <SelectItem value="cod">Cash on Delivery</SelectItem>
                    <SelectItem value="advance">Advance Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Detailed Product Items Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-lg font-semibold">Purchase Items</Label>
                <Button 
                  type="button" 
                  onClick={addPurchaseItem}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700">
                    <div className="col-span-2">Product Name</div>
                    <div className="col-span-2">Description</div>
                    <div className="col-span-1">Qty</div>
                    <div className="col-span-1">Unit</div>
                    <div className="col-span-1">Unit Price ($)</div>
                    <div className="col-span-1">Expiry Date</div>
                    <div className="col-span-1">Discount</div>
                    <div className="col-span-1">Subtotal ($)</div>
                    <div className="col-span-1">Total ($)</div>
                    <div className="col-span-1">Action</div>
                  </div>
                </div>
                
                <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                  {purchaseItems.map((item, index) => (
                    <div key={item.id} className={`px-4 py-3 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updatePurchaseItem(item.id, 'name', e.target.value)}
                            placeholder="Product name"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updatePurchaseItem(item.id, 'description', e.target.value)}
                            placeholder="Product description"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-1">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updatePurchaseItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-full px-1 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-1">
                          <Select value={item.unit} onValueChange={(value) => updatePurchaseItem(item.id, 'unit', value)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="g">g</SelectItem>
                              <SelectItem value="mg">mg</SelectItem>
                              <SelectItem value="L">L</SelectItem>
                              <SelectItem value="mL">mL</SelectItem>
                              <SelectItem value="units">units</SelectItem>
                              <SelectItem value="boxes">boxes</SelectItem>
                              <SelectItem value="bottles">bottles</SelectItem>
                              <SelectItem value="vials">vials</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updatePurchaseItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            placeholder="Price"
                            className="w-full px-1 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-1">
                          <input
                            type="date"
                            value={item.expiryDate}
                            onChange={(e) => updatePurchaseItem(item.id, 'expiryDate', e.target.value)}
                            className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-1">
                          <div className="space-y-1">
                            <div className="flex flex-col gap-1">
                              <Select 
                                value={item.discountType} 
                                onValueChange={(value) => updatePurchaseItem(item.id, 'discountType', value)}
                              >
                                <SelectTrigger className="h-6 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">%</SelectItem>
                                  <SelectItem value="amount">$</SelectItem>
                                </SelectContent>
                              </Select>
                              <input
                                type="number"
                                value={item.discountValue}
                                onChange={(e) => updatePurchaseItem(item.id, 'discountValue', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                placeholder="0"
                                className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-span-1">
                          <div className="text-xs font-medium text-right text-gray-600">
                            ${(item.subtotal || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="col-span-1">
                          <div className="text-xs font-medium text-right text-green-600">
                            ${(item.total || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="col-span-1">
                          <div className="flex flex-col items-center gap-1">
                            <Button
                              type="button"
                              onClick={() => removePurchaseItem(item.id)}
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            {item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                              <div className="text-xs text-orange-500" title="Expires within 30 days">
                                ⚠️
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Purchase Totals Section */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal (before discounts):</span>
                      <span className="font-medium">${purchaseItems.reduce((sum, item) => sum + (item.subtotal || 0), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Total Discounts:</span>
                      <span className="font-medium">-${purchaseItems.reduce((sum, item) => sum + (item.discountAmount || 0), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Subtotal (after discounts):</span>
                      <span className="font-medium">${calculatePurchaseSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span>VAT:</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={purchaseVatPercentage}
                            onChange={(e) => setPurchaseVatPercentage(parseFloat(e.target.value) || 0)}
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-xs">%</span>
                        </div>
                      </div>
                      <span className="font-medium">${calculatePurchaseVAT().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                      <span>Grand Total:</span>
                      <span className="text-blue-600">${calculatePurchaseGrandTotal().toFixed(2)}</span>
                    </div>
                    
                    {/* Expiry Date Summary */}
                    {purchaseItems.some(item => item.expiryDate) && (
                      <div className="border-t border-gray-300 pt-2 mt-3">
                        <div className="text-xs text-gray-600 mb-1">Expiry Summary:</div>
                        {purchaseItems.filter(item => item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length > 0 && (
                          <div className="text-xs text-orange-600 flex items-center gap-1">
                            ⚠️ {purchaseItems.filter(item => item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length} item(s) expire within 30 days
                          </div>
                        )}
                        {purchaseItems.filter(item => item.expiryDate && new Date(item.expiryDate) < new Date()).length > 0 && (
                          <div className="text-xs text-red-600 flex items-center gap-1">
                            🚨 {purchaseItems.filter(item => item.expiryDate && new Date(item.expiryDate) < new Date()).length} item(s) already expired
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Purchase Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delivery-date">Expected Delivery Date</Label>
                <Input
                  id="delivery-date"
                  type="date"
                />
              </div>
              <div>
                <Label htmlFor="purchase-status">Purchase Status</Label>
                <Select defaultValue={editingOrder?.status || 'draft'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <Label htmlFor="purchase-notes">Purchase Notes</Label>
              <Textarea
                id="purchase-notes"
                placeholder="Special instructions, delivery requirements, quality specifications..."
                rows={3}
              />
            </div>

            {/* Document Upload Section */}
            <div>
              <Label>Supporting Documents</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xls,.xlsx"
                  onChange={handleDocumentUpload}
                  className="hidden"
                  id="purchase-document-upload"
                />
                <label htmlFor="purchase-document-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, JPG, PNG, TXT, XLS (max 10MB each)
                  </p>
                </label>
              </div>
              
              {/* Uploaded Documents List */}
              {uploadedDocuments.length > 0 && (
                <div className="mt-3 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Uploaded Documents:</h4>
                  <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                    {uploadedDocuments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                        <div className="flex items-center space-x-2">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeDocument(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ETA Compliance Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-100 rounded-full">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">ETA Compliance Information</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    This purchase order includes a valid ETA number for Egyptian Tax Authority compliance. All pharmaceutical purchases must be properly documented.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsPurchaseOrderFormOpen(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setIsPurchaseOrderFormOpen(false);
                toast({
                  title: "Purchase Order Created",
                  description: `New purchase order with ${purchaseItems.length} items has been created successfully.`,
                  variant: "default"
                });
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Purchase Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Order Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailsOrder ? `${detailsOrder.poNumber} - Detailed Breakdown` : 'Purchase Order Details'}
            </DialogTitle>
          </DialogHeader>
          {detailsOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Supplier</p>
                  <p className="font-semibold">{detailsOrder.supplier}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="font-semibold">{new Date(detailsOrder.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  {getStatusBadge(detailsOrder.status)}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-green-600">${detailsOrder.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                  <p className="font-semibold">{(detailsOrder as any).paymentMethod || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Terms</p>
                  <p className="font-semibold">{(detailsOrder as any).paymentTerms || 'Not specified'}</p>
                </div>
                {(detailsOrder as any).paymentDueDate && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Payment Due Date</p>
                    <p className="font-semibold text-red-600 text-lg">
                      {new Date((detailsOrder as any).paymentDueDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-3">Items Breakdown</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left text-sm font-medium">Product</th>
                        <th className="p-3 text-right text-sm font-medium">Quantity</th>
                        <th className="p-3 text-right text-sm font-medium">Unit Price</th>
                        <th className="p-3 text-right text-sm font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(detailsOrder as any).items?.map((item: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="p-3">
                            <div className="font-medium">{item.productName}</div>
                          </td>
                          <td className="p-3 text-right">{item.quantity}</td>
                          <td className="p-3 text-right">${item.unitPrice.toFixed(2)}</td>
                          <td className="p-3 text-right font-semibold">${item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td className="p-3 font-semibold" colSpan={3}>Total Amount</td>
                        <td className="p-3 text-right font-bold text-green-600">${detailsOrder.totalAmount.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Document Upload Section */}
              <div>
                <Label>Supporting Documents</Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xls,.xlsx"
                    onChange={handleDocumentUpload}
                    className="hidden"
                    id="details-document-upload"
                  />
                  <label htmlFor="details-document-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, JPG, PNG, TXT, XLS (max 10MB each)
                    </p>
                  </label>
                </div>
                
                {/* Uploaded Documents List */}
                {(uploadedDocuments.length > 0 || ((detailsOrder as any).documents && (detailsOrder as any).documents.length > 0)) && (
                  <div className="mt-3 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Uploaded Documents:</h4>
                    <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                      {/* Show existing documents from order */}
                      {(detailsOrder as any).documents && (detailsOrder as any).documents.map((doc: any, index: number) => (
                        <div key={`existing-${index}`} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                            <span className="text-xs text-gray-500">({doc.size})</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              toast({
                                title: "Download Started",
                                description: `Downloading ${doc.name}`,
                              });
                            }}
                            className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {/* Show newly uploaded documents */}
                      {uploadedDocuments.map((file, index) => (
                        <div key={`new-${index}`} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-700 truncate">{file.name}</span>
                            <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeDocument(index)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Show message when no documents */}
                {uploadedDocuments.length === 0 && !((detailsOrder as any).documents && (detailsOrder as any).documents.length > 0) && (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No documents uploaded yet</p>
                    <p className="text-sm">Upload receipts, delivery notes, or invoices</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}