import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Factory, 
  TestTube, 
  Package,
  Calendar,
  User,
  DollarSign,
  Eye,
  Save,
  Send,
  ArrowLeft,
  Calculator,
  Info,
  Truck
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface QuotationItem {
  id: string;
  type: 'manufacturing' | 'refining' | 'finished';
  productName: string;
  description: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  total: number;
  specifications?: string;
  rawMaterials?: string[];
  processingTime?: number;
  qualityGrade?: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

const CreateQuotation: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Form state
  const [quotationType, setQuotationType] = useState<'manufacturing' | 'refining' | 'finished'>('manufacturing');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [quotationNumber, setQuotationNumber] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Transportation fees state
  const [transportationFees, setTransportationFees] = useState(0);
  const [transportationType, setTransportationType] = useState('standard');
  const [transportationNotes, setTransportationNotes] = useState('');

  // Item form for adding new items
  const [newItem, setNewItem] = useState<Partial<QuotationItem>>({
    type: quotationType,
    productName: '',
    description: '',
    quantity: 1,
    uom: 'kg',
    unitPrice: 0,
    specifications: '',
    rawMaterials: [],
    processingTime: 0,
    qualityGrade: 'pharmaceutical'
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
  });

  // Generate quotation number on component mount
  useEffect(() => {
    const generateQuotationNumber = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const typePrefix = quotationType === 'manufacturing' ? 'MFG' : 
                        quotationType === 'refining' ? 'REF' : 'FPD';
      return `QUO-${typePrefix}-${year}${month}-${random}`;
    };
    
    setQuotationNumber(generateQuotationNumber());
  }, [quotationType]);

  // Set default valid until date (30 days from now)
  useEffect(() => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    setValidUntil(thirtyDaysFromNow.toISOString().split('T')[0]);
  }, []);

  // Manufacturing products
  const manufacturingProducts = [
    { name: 'Paracetamol Tablets 500mg', uom: 'Tablets', basePrice: 0.05 },
    { name: 'Ibuprofen Capsules 200mg', uom: 'Capsules', basePrice: 0.08 },
    { name: 'Amoxicillin Syrup 250mg/5ml', uom: 'Bottles', basePrice: 3.50 },
    { name: 'Vitamin C Tablets 1000mg', uom: 'Tablets', basePrice: 0.12 },
    { name: 'Antacid Suspension 200ml', uom: 'Bottles', basePrice: 2.75 }
  ];

  // Refining services
  const refiningServices = [
    { name: 'API Purification Service', uom: 'kg', basePrice: 85.00 },
    { name: 'Solvent Recovery Process', uom: 'Liters', basePrice: 12.50 },
    { name: 'Crystallization Service', uom: 'kg', basePrice: 65.00 },
    { name: 'Filtration & Drying', uom: 'kg', basePrice: 45.00 },
    { name: 'Quality Enhancement Process', uom: 'kg', basePrice: 95.00 }
  ];

  // Finished products
  const finishedProducts = [
    { name: 'Cough Syrup 100ml', uom: 'Bottles', basePrice: 4.25 },
    { name: 'Pain Relief Gel 50g', uom: 'Tubes', basePrice: 3.80 },
    { name: 'Multivitamin Tablets', uom: 'Bottles (30 tabs)', basePrice: 8.50 },
    { name: 'Antiseptic Solution 500ml', uom: 'Bottles', basePrice: 6.20 },
    { name: 'Wound Dressing Kit', uom: 'Kits', basePrice: 12.00 }
  ];

  const getProductList = () => {
    switch (quotationType) {
      case 'manufacturing': return manufacturingProducts;
      case 'refining': return refiningServices;
      case 'finished': return finishedProducts;
      default: return [];
    }
  };

  const addItem = () => {
    if (!newItem.productName || !newItem.quantity || !newItem.unitPrice) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const item: QuotationItem = {
      id: Date.now().toString(),
      type: quotationType,
      productName: newItem.productName!,
      description: newItem.description || '',
      quantity: newItem.quantity!,
      uom: newItem.uom!,
      unitPrice: newItem.unitPrice!,
      total: newItem.quantity! * newItem.unitPrice!,
      specifications: newItem.specifications,
      rawMaterials: newItem.rawMaterials,
      processingTime: newItem.processingTime,
      qualityGrade: newItem.qualityGrade
    };

    setItems([...items, item]);
    setNewItem({
      type: quotationType,
      productName: '',
      description: '',
      quantity: 1,
      uom: 'kg',
      unitPrice: 0,
      specifications: '',
      rawMaterials: [],
      processingTime: 0,
      qualityGrade: 'pharmaceutical'
    });

    toast({
      title: "Success",
      description: "Item added to quotation"
    });
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    toast({
      title: "Success",
      description: "Item removed from quotation"
    });
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + transportationFees;
  };

  const calculateTax = () => {
    return calculateTotal() * 0.14; // 14% VAT
  };

  const calculateGrandTotal = () => {
    return calculateTotal() + calculateTax();
  };

  const handleSubmit = async (action: 'draft' | 'send') => {
    if (!selectedCustomer) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item",
        variant: "destructive"
      });
      return;
    }

    try {
      const quotationData = {
        quotationNumber,
        type: quotationType,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        validUntil,
        notes,
        items,
        subtotal: calculateSubtotal(),
        transportationFees,
        transportationType,
        transportationNotes,
        tax: calculateTax(),
        total: calculateGrandTotal(),
        status: action === 'draft' ? 'draft' : 'sent',
        date: new Date().toISOString()
      };

      const response = await apiRequest('POST', '/api/quotations', quotationData);
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `Quotation ${action === 'draft' ? 'saved as draft' : 'sent to customer'} successfully`
        });
        setLocation('/quotation-history');
      } else {
        throw new Error('Failed to save quotation');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save quotation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getQuotationTypeIcon = (type: string) => {
    switch (type) {
      case 'manufacturing': return <Factory className="h-5 w-5" />;
      case 'refining': return <TestTube className="h-5 w-5" />;
      case 'finished': return <Package className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getQuotationTypeDescription = (type: string) => {
    switch (type) {
      case 'manufacturing': return 'Custom manufacturing of pharmaceutical products from raw materials';
      case 'refining': return 'API purification, solvent recovery, and quality enhancement services';
      case 'finished': return 'Ready-to-market pharmaceutical products and medical supplies';
      default: return '';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/quotation-history')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Quotation</h1>
            <p className="text-muted-foreground">Generate professional quotations for your pharmaceutical services</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" onClick={() => handleSubmit('draft')}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button onClick={() => handleSubmit('send')}>
            <Send className="mr-2 h-4 w-4" />
            Send Quotation
          </Button>
        </div>
      </div>

      {/* Tabs for Draft Management */}
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create New</TabsTrigger>
          <TabsTrigger value="drafts">Draft Quotations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quotation Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Quotation Type</CardTitle>
              <CardDescription>Select the type of service you're quoting for</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['manufacturing', 'refining', 'finished'].map((type) => (
                  <Card 
                    key={type}
                    className={`cursor-pointer transition-all ${
                      quotationType === type ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setQuotationType(type as any);
                      setItems([]); // Clear items when changing type
                      setNewItem({
                        ...newItem,
                        type: type as any,
                        productName: '',
                        unitPrice: 0
                      });
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="flex justify-center mb-2">
                        {getQuotationTypeIcon(type)}
                      </div>
                      <h3 className="font-semibold capitalize">{type}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getQuotationTypeDescription(type)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer & Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer & Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Customer</Label>
                  <Select 
                    onValueChange={(value) => {
                      const customer = customers.find((c: Customer) => c.id.toString() === value);
                      setSelectedCustomer(customer || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer: Customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quotation Number</Label>
                  <Input value={quotationNumber} readOnly />
                </div>
                <div>
                  <Label>Valid Until</Label>
                  <Input 
                    type="date" 
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <div className="flex items-center gap-2 pt-2">
                    {getQuotationTypeIcon(quotationType)}
                    <Badge variant="secondary" className="capitalize">
                      {quotationType}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <Label>Notes & Special Instructions</Label>
                <Textarea 
                  placeholder="Add any special notes or instructions for this quotation..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Add Items */}
          <Card>
            <CardHeader>
              <CardTitle>Add Items</CardTitle>
              <CardDescription>
                Add {quotationType} items to your quotation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Product/Service</Label>
                  <Select 
                    value={newItem.productName}
                    onValueChange={(value) => {
                      const product = getProductList().find(p => p.name === value);
                      setNewItem({
                        ...newItem,
                        productName: value,
                        unitPrice: product?.basePrice || 0,
                        uom: product?.uom || 'kg'
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${quotationType} item`} />
                    </SelectTrigger>
                    <SelectContent>
                      {getProductList().map((product) => (
                        <SelectItem key={product.name} value={product.name}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input 
                    placeholder="Additional description..."
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input 
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Unit of Measure</Label>
                  <Select 
                    value={newItem.uom}
                    onValueChange={(value) => setNewItem({...newItem, uom: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="liters">Liters (L)</SelectItem>
                      <SelectItem value="tablets">Tablets</SelectItem>
                      <SelectItem value="capsules">Capsules</SelectItem>
                      <SelectItem value="bottles">Bottles</SelectItem>
                      <SelectItem value="tubes">Tubes</SelectItem>
                      <SelectItem value="kits">Kits</SelectItem>
                      <SelectItem value="units">Units</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unit Price ($)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({...newItem, unitPrice: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Total</Label>
                  <Input 
                    value={`$${((newItem.quantity || 0) * (newItem.unitPrice || 0)).toFixed(2)}`}
                    readOnly
                  />
                </div>
              </div>

              {/* Additional fields based on quotation type */}
              {quotationType === 'manufacturing' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Processing Time (days)</Label>
                    <Input 
                      type="number"
                      min="1"
                      value={newItem.processingTime}
                      onChange={(e) => setNewItem({...newItem, processingTime: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Quality Grade</Label>
                    <Select 
                      value={newItem.qualityGrade}
                      onValueChange={(value) => setNewItem({...newItem, qualityGrade: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pharmaceutical">Pharmaceutical Grade</SelectItem>
                        <SelectItem value="food">Food Grade</SelectItem>
                        <SelectItem value="industrial">Industrial Grade</SelectItem>
                        <SelectItem value="research">Research Grade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {quotationType === 'refining' && (
                <div>
                  <Label>Specifications & Requirements</Label>
                  <Textarea 
                    placeholder="Specify purity requirements, processing conditions, quality standards..."
                    value={newItem.specifications}
                    onChange={(e) => setNewItem({...newItem, specifications: e.target.value})}
                    rows={2}
                  />
                </div>
              )}

              <Button onClick={addItem} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Item to Quotation
              </Button>
            </CardContent>
          </Card>

          {/* Items List */}
          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Quotation Items</CardTitle>
                <CardDescription>{items.length} items added</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-center">UoM</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.description}
                            {item.type === 'manufacturing' && item.processingTime && (
                              <div className="text-xs mt-1">
                                Processing: {item.processingTime} days | Grade: {item.qualityGrade}
                              </div>
                            )}
                            {item.type === 'refining' && item.specifications && (
                              <div className="text-xs mt-1">
                                Specs: {item.specifications}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-center">{item.uom}</TableCell>
                          <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transportation Fees */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Transportation & Delivery
              </CardTitle>
              <CardDescription>
                Add shipping and handling costs for pharmaceutical transport
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Transportation Type</Label>
                  <Select 
                    value={transportationType}
                    onValueChange={(value) => {
                      setTransportationType(value);
                      // Auto-set fees based on transportation type
                      switch (value) {
                        case 'standard':
                          setTransportationFees(50);
                          break;
                        case 'express':
                          setTransportationFees(125);
                          break;
                        case 'cold-chain':
                          setTransportationFees(200);
                          break;
                        case 'hazmat':
                          setTransportationFees(300);
                          break;
                        case 'international':
                          setTransportationFees(450);
                          break;
                        default:
                          setTransportationFees(0);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transportation method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Delivery (3-5 days)</SelectItem>
                      <SelectItem value="express">Express Delivery (1-2 days)</SelectItem>
                      <SelectItem value="cold-chain">Cold Chain Transport (Temperature Controlled)</SelectItem>
                      <SelectItem value="hazmat">Hazardous Materials Transport</SelectItem>
                      <SelectItem value="international">International Shipping</SelectItem>
                      <SelectItem value="pickup">Customer Pickup (No charge)</SelectItem>
                      <SelectItem value="custom">Custom Transportation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Transportation Fees ($)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={transportationFees}
                    onChange={(e) => setTransportationFees(Number(e.target.value))}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <Label>Transportation Notes</Label>
                <Textarea 
                  placeholder="Special handling requirements, delivery instructions, insurance needs..."
                  value={transportationNotes}
                  onChange={(e) => setTransportationNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {transportationType && transportationType !== 'pickup' && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Transportation Details:</p>
                      <p className="text-blue-700 mt-1">
                        {transportationType === 'standard' && 'Standard delivery with basic packaging and regular transport'}
                        {transportationType === 'express' && 'Priority delivery with expedited processing and shipping'}
                        {transportationType === 'cold-chain' && 'Temperature-controlled transport (2-8°C) with monitoring'}
                        {transportationType === 'hazmat' && 'Specialized transport for hazardous pharmaceutical materials'}
                        {transportationType === 'international' && 'International shipping with customs clearance and documentation'}
                        {transportationType === 'custom' && 'Custom transportation arrangement as per specific requirements'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          {selectedCustomer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="font-medium">{selectedCustomer.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Address:</p>
                  <p className="text-sm">{selectedCustomer.address}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quotation Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Quotation Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Items:</span>
                <span>{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Transportation:</span>
                <span>${transportationFees.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (14%):</span>
                <span>${calculateTax().toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${calculateGrandTotal().toFixed(2)}</span>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Quotation Type: {quotationType}</p>
                    <p className="text-blue-700 mt-1">
                      {getQuotationTypeDescription(quotationType)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" onClick={() => setIsPreviewOpen(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview Quotation
              </Button>
              <Button variant="outline" className="w-full" onClick={() => handleSubmit('draft')}>
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              <Button className="w-full" onClick={() => handleSubmit('send')}>
                <Send className="mr-2 h-4 w-4" />
                Send to Customer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Quotation Preview</DialogTitle>
            <DialogDescription>
              Review your quotation before sending
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-lg p-6 bg-white">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold text-blue-600">QUOTATION</h2>
                <p className="text-muted-foreground">PharmaOverseas Ltd.</p>
                <p className="text-muted-foreground">123 Pharma Street, Lagos</p>
              </div>
              <div className="text-right">
                <p className="font-bold">Quotation #: {quotationNumber}</p>
                <p>Date: {new Date().toLocaleDateString()}</p>
                <p>Valid Until: {new Date(validUntil).toLocaleDateString()}</p>
                <div className="mt-2 flex items-center gap-2 justify-end">
                  {getQuotationTypeIcon(quotationType)}
                  <Badge variant="secondary" className="capitalize">
                    {quotationType}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-semibold mb-2">Customer:</h3>
                {selectedCustomer ? (
                  <div>
                    <p className="font-medium">{selectedCustomer.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No customer selected</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Service Type:</h3>
                <p className="text-sm">{getQuotationTypeDescription(quotationType)}</p>
              </div>
            </div>
            
            {items.length > 0 && (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-center">UoM</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                            {item.type === 'manufacturing' && item.processingTime && (
                              <p className="text-xs text-muted-foreground">
                                Processing: {item.processingTime} days | Grade: {item.qualityGrade}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-center">{item.uom}</TableCell>
                        <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="mt-8 flex justify-end">
                  <div className="w-72">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transportation:</span>
                      <span>${transportationFees.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT (14%):</span>
                      <span>${calculateTax().toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${calculateGrandTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {transportationType && transportationType !== 'pickup' && (
              <div className="mt-8">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Transportation & Delivery:
                </h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><span className="font-medium">Method:</span> {transportationType.charAt(0).toUpperCase() + transportationType.slice(1).replace('-', ' ')}</p>
                  <p><span className="font-medium">Fee:</span> ${transportationFees.toFixed(2)}</p>
                  {transportationNotes && (
                    <p><span className="font-medium">Notes:</span> {transportationNotes}</p>
                  )}
                </div>
              </div>
            )}

            {notes && (
              <div className="mt-8">
                <h3 className="font-semibold mb-2">Notes & Special Instructions:</h3>
                <p className="text-sm text-muted-foreground">{notes}</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close Preview
            </Button>
            <Button onClick={() => {
              setIsPreviewOpen(false);
              handleSubmit('send');
            }}>
              <Send className="mr-2 h-4 w-4" />
              Send Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>

        {/* Draft Quotations Tab */}
        <TabsContent value="drafts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Draft Quotations
              </CardTitle>
              <CardDescription>
                Manage and continue working on your saved draft quotations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Sample Draft Quotations */}
                <div className="grid gap-4">
                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">QUOTE-MFG-2025-001</h4>
                            <p className="text-sm text-muted-foreground">Manufacturing - Cairo Medical Center</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Last modified: 2 hours ago • 3 items • $12,450.00
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm">
                            <Send className="h-3 w-3 mr-1" />
                            Send
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <FileText className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">QUOTE-REF-2025-002</h4>
                            <p className="text-sm text-muted-foreground">Refining - Alexandria Pharma</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Last modified: 1 day ago • 2 items • $8,750.00
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm">
                            <Send className="h-3 w-3 mr-1" />
                            Send
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <FileText className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">QUOTE-FIN-2025-003</h4>
                            <p className="text-sm text-muted-foreground">Finished Products - Giza Medical Supply</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Last modified: 3 days ago • 5 items • $15,200.00
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm">
                            <Send className="h-3 w-3 mr-1" />
                            Send
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* No drafts state */}
                {/* Uncomment this when there are no drafts */}
                {/*
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Draft Quotations</h3>
                  <p className="text-muted-foreground mb-4">
                    Start creating quotations and save them as drafts to see them here.
                  </p>
                  <Button onClick={() => setActiveTab('create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Quotation
                  </Button>
                </div>
                */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Quotation Preview</DialogTitle>
            <DialogDescription>
              Review your quotation before sending
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Quotation content would go here */}
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Quotation preview content will be displayed here</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close Preview
            </Button>
            <Button onClick={() => {
              setIsPreviewOpen(false);
              handleSubmit('send');
            }}>
              <Send className="mr-2 h-4 w-4" />
              Send Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateQuotation;