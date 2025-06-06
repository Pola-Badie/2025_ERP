import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Eye,
  Save,
  Send,
  Calculator,
  Info,
  TestTube,
  Package,
  Truck,
  Factory,
  Edit,
  MessageCircle,
  Mail,
  ChevronDown
} from 'lucide-react';
import { PrintableQuotation } from '@/components/PrintableQuotation';
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
  company?: string;
  position?: string;
  email: string;
  phone: string;
  address: string;
  sector?: string;
  taxNumber?: string;
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
  const [activeTab, setActiveTab] = useState('create');
  
  // Transportation fees state
  const [transportationFees, setTransportationFees] = useState(0);
  const [transportationType, setTransportationType] = useState('standard');
  const [transportationNotes, setTransportationNotes] = useState('');
  
  // VAT percentage state
  const [vatPercentage, setVatPercentage] = useState(14);

  // Calculation functions
  const calculateSubtotal = () => items.reduce((sum, item) => sum + item.total, 0);
  const calculateTax = () => (calculateSubtotal() + transportationFees) * (vatPercentage / 100);
  const calculateGrandTotal = () => calculateSubtotal() + transportationFees + calculateTax();

  // Calculate totals for component use
  const subtotal = calculateSubtotal();
  const vatAmount = calculateTax();
  const grandTotal = calculateGrandTotal();

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
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  // Create quotation mutation
  const createQuotationMutation = useMutation({
    mutationFn: async (quotationData: any) => {
      return apiRequest('POST', '/api/quotations', quotationData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quotation created successfully"
      });
      setLocation('/quotation-history');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create quotation",
        variant: "destructive"
      });
    }
  });

  // Generate quotation number on component mount
  useEffect(() => {
    const generateQuotationNumber = () => {
      const prefix = quotationType === 'manufacturing' ? 'MFG' : 
                   quotationType === 'refining' ? 'REF' : 'FIN';
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `${prefix}-${year}-${random}`;
    };

    if (!quotationNumber) {
      setQuotationNumber(generateQuotationNumber());
    }

    // Set default valid until date (30 days from now)
    if (!validUntil) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      setValidUntil(futureDate.toISOString().split('T')[0]);
    }
  }, [quotationType, quotationNumber, validUntil]);

  // Update new item type when quotation type changes
  useEffect(() => {
    setNewItem(prev => ({ ...prev, type: quotationType }));
  }, [quotationType]);

  // Product lists for different quotation types
  const manufacturingProducts = [
    { name: 'Paracetamol 500mg Tablets', uom: 'Tablets', basePrice: 0.05 },
    { name: 'Amoxicillin 250mg Capsules', uom: 'Capsules', basePrice: 0.12 },
    { name: 'Ibuprofen 400mg Tablets', uom: 'Tablets', basePrice: 0.08 },
    { name: 'Aspirin 100mg Tablets', uom: 'Tablets', basePrice: 0.03 },
    { name: 'Metformin 850mg Tablets', uom: 'Tablets', basePrice: 0.15 }
  ];

  const refiningServices = [
    { name: 'API Purification Process', uom: 'kg', basePrice: 85.00 },
    { name: 'Solvent Recovery Process', uom: 'Liters', basePrice: 12.50 },
    { name: 'Crystallization Service', uom: 'kg', basePrice: 65.00 },
    { name: 'Filtration & Drying', uom: 'kg', basePrice: 45.00 },
    { name: 'Quality Enhancement Process', uom: 'kg', basePrice: 95.00 }
  ];

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

  const handleSubmit = (action: 'draft' | 'send') => {
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
      status: action === 'draft' ? 'draft' : 'sent'
    };

    createQuotationMutation.mutate(quotationData);
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
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Quotation</TabsTrigger>
          <TabsTrigger value="drafts">Draft Quotations</TabsTrigger>
        </TabsList>

        {/* Create Quotation Tab */}
        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quotation Type Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Quotation Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { type: 'manufacturing', icon: Factory, label: 'Manufacturing', desc: 'Custom pharmaceutical manufacturing' },
                      { type: 'refining', icon: TestTube, label: 'Refining', desc: 'API purification & processing' },
                      { type: 'finished', icon: Package, label: 'Finished Products', desc: 'Ready-to-market products' }
                    ].map(({ type, icon: Icon, label, desc }) => (
                      <Button
                        key={type}
                        variant={quotationType === type ? "default" : "outline"}
                        className="h-auto p-4 flex flex-col gap-2"
                        onClick={() => setQuotationType(type as any)}
                      >
                        <Icon className="h-6 w-6" />
                        <div className="text-center">
                          <div className="font-medium">{label}</div>
                          <div className="text-xs text-muted-foreground">{desc}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Customer & Quotation Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer & Quotation Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Customer</Label>
                      <Select
                        value={selectedCustomer?.id.toString() || ''}
                        onValueChange={(value) => {
                          const customer = customers.find(c => c.id.toString() === value);
                          setSelectedCustomer(customer || null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer: Customer) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              <div className="flex flex-col">
                                <span className="font-medium">{customer.company || customer.name}</span>
                                {customer.company && customer.name && (
                                  <span className="text-xs text-muted-foreground">• {customer.name}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Quotation Number</Label>
                      <Input
                        value={quotationNumber}
                        onChange={(e) => setQuotationNumber(e.target.value)}
                        placeholder="Auto-generated"
                      />
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
                      <Label>VAT Percentage</Label>
                      <Input
                        type="number"
                        value={vatPercentage}
                        onChange={(e) => setVatPercentage(Number(e.target.value))}
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Add Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Product/Service Name</Label>
                      <Select
                        value={newItem.productName}
                        onValueChange={(value) => {
                          const product = getProductList().find(p => p.name === value);
                          setNewItem(prev => ({
                            ...prev,
                            productName: value,
                            unitPrice: product?.basePrice || prev.unitPrice || 0,
                            uom: product?.uom || prev.uom || 'kg'
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select or type product name" />
                        </SelectTrigger>
                        <SelectContent>
                          {getProductList().map((product) => (
                            <SelectItem key={product.name} value={product.name}>
                              {product.name} - ${product.basePrice} per {product.uom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={newItem.description || ''}
                        onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description"
                      />
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label>Unit of Measure</Label>
                      <Select
                        value={newItem.uom}
                        onValueChange={(value) => setNewItem(prev => ({ ...prev, uom: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">Kilograms (kg)</SelectItem>
                          <SelectItem value="g">Grams (g)</SelectItem>
                          <SelectItem value="mg">Milligrams (mg)</SelectItem>
                          <SelectItem value="l">Liters (L)</SelectItem>
                          <SelectItem value="ml">Milliliters (mL)</SelectItem>
                          <SelectItem value="tablets">Tablets</SelectItem>
                          <SelectItem value="capsules">Capsules</SelectItem>
                          <SelectItem value="bottles">Bottles</SelectItem>
                          <SelectItem value="boxes">Boxes</SelectItem>
                          <SelectItem value="units">Units</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Unit Price ($)</Label>
                      <Input
                        type="number"
                        value={newItem.unitPrice}
                        onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={addItem} className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items List */}
              {items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Quotation Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-center">UoM</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead></TableHead>
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
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-center">{item.uom}</TableCell>
                            <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                            <TableCell>
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
                  </CardContent>
                </Card>
              )}

              {/* Transportation & Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Transportation & Additional Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Transportation Type</Label>
                      <Select value={transportationType} onValueChange={setTransportationType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pickup">Customer Pickup</SelectItem>
                          <SelectItem value="standard">Standard Delivery</SelectItem>
                          <SelectItem value="express">Express Delivery</SelectItem>
                          <SelectItem value="refrigerated">Refrigerated Transport</SelectItem>
                          <SelectItem value="hazmat">Hazmat Transport</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Transportation Fees ($)</Label>
                      <Input
                        type="number"
                        value={transportationFees}
                        onChange={(e) => setTransportationFees(Number(e.target.value))}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Transportation Notes</Label>
                    <Textarea
                      value={transportationNotes}
                      onChange={(e) => setTransportationNotes(e.target.value)}
                      placeholder="Special delivery instructions..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Additional Notes</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Terms, conditions, and special requirements..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Summary */}
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
                    <span>VAT ({vatPercentage}%):</span>
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
                  <Button className="w-full" onClick={() => handleSubmit('send')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Create Quotation
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setIsPreviewOpen(true)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Quotation
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => handleSubmit('draft')}>
                    <Save className="mr-2 h-4 w-4" />
                    Save as Draft
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
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
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No draft quotations found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Draft quotations will appear here when you save them
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quotation Preview</DialogTitle>
            <DialogDescription>
              Review your quotation before sending
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {selectedCustomer ? (
              <PrintableQuotation
                quotationNumber={quotationNumber}
                date={new Date()}
                validUntil={validUntil}
                customer={{
                  id: selectedCustomer.id,
                  name: selectedCustomer.name,
                  company: selectedCustomer.company || '',
                  position: selectedCustomer.position || '',
                  email: selectedCustomer.email || '',
                  phone: selectedCustomer.phone || '',
                  address: selectedCustomer.address || '',
                  sector: selectedCustomer.sector || '',
                  taxNumber: selectedCustomer.taxNumber || '',
                }}
                items={items}
                subtotal={subtotal}
                transportationFees={transportationFees}
                vatPercentage={vatPercentage}
                vatAmount={vatAmount}
                grandTotal={grandTotal}
                notes={notes}
                transportationType={transportationType}
                transportationNotes={transportationNotes}
                quotationType={quotationType}
              />
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Please select a customer to preview the quotation</p>
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
    </div>
  );
};

export default CreateQuotation;