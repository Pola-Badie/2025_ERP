import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Truck,
  Edit,
  MessageCircle,
  Mail,
  ChevronDown
} from 'lucide-react';
import { PrintableQuotation } from '@/components/PrintableQuotation';
import { apiRequest } from '@/lib/queryClient';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  
  // Terms and conditions state
  const [termsAndConditions, setTermsAndConditions] = useState(`1. Validity: This quotation is valid for 30 days from the date of issue.

2. Payment Terms: 50% advance payment required upon order confirmation. Balance due upon completion/delivery.

3. Quality Assurance: All pharmaceutical services comply with GMP standards and regulatory requirements as per Egyptian Drug Authority guidelines.

4. Delivery: Delivery times are estimates and subject to production schedules, regulatory approvals, and raw material availability.

5. Changes: Any changes to specifications, quantities, or requirements after quotation acceptance may affect pricing and delivery timelines.

6. Liability: Our liability is limited to the value of services provided. We maintain comprehensive insurance coverage for pharmaceutical operations.`);

  // Calculation functions
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const itemTotal = Number(item.total) || 0;
      return sum + itemTotal;
    }, 0);
  };
  
  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const transportFees = Number(transportationFees) || 0;
    const vatRate = Number(vatPercentage) || 0;
    return (subtotal + transportFees) * (vatRate / 100);
  };
  
  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const transportFees = Number(transportationFees) || 0;
    const tax = calculateTax();
    return subtotal + transportFees + tax;
  };

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
    onSuccess: (response, variables) => {
      const action = variables.status;
      toast({
        title: "Success",
        description: `Quotation ${action === 'draft' ? 'saved as draft' : 'sent to customer'} successfully`
      });
      // Invalidate quotations cache
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
      setLocation('/quotation-history');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save quotation. Please try again.",
        variant: "destructive"
      });
    }
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

    // Ensure numerical values are properly converted
    const quantity = Number(newItem.quantity!);
    const unitPrice = Number(newItem.unitPrice!);
    const total = quantity * unitPrice;

    const item: QuotationItem = {
      id: Date.now().toString(),
      type: quotationType,
      productName: newItem.productName!,
      description: newItem.description || '',
      quantity: quantity,
      uom: newItem.uom!,
      unitPrice: unitPrice,
      total: total,
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
    console.log('handleSubmit called with action:', action);
    console.log('selectedCustomer:', selectedCustomer);
    console.log('items:', items);
    
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
      status: action === 'draft' ? 'draft' : 'sent',
      date: new Date().toISOString(),
      termsAndConditions
    };

    console.log('Quotation data to submit:', quotationData);
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

  const generateQuotationPDF = () => {
    if (!selectedCustomer || items.length === 0) {
      toast({
        title: "Error",
        description: "Please select a customer and add items before generating PDF",
        variant: "destructive"
      });
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 15;

    // Header - Company Info
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text('Morgan ERP', 20, yPosition);
    
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99); // gray-600
    doc.text('Enterprise Resource Planning System', 20, yPosition + 8);
    doc.text('123 Business District', 20, yPosition + 16);
    doc.text('Cairo, Egypt 11511', 20, yPosition + 22);
    doc.text('Phone: +20 2 1234 5678', 20, yPosition + 28);
    doc.text('Email: info@morganerp.com', 20, yPosition + 34);

    // Quotation Header (right side)
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('QUOTATION', pageWidth - 20, yPosition, { align: 'right' });
    
    doc.setFontSize(10);
    doc.text(`Quotation #: ${quotationNumber}`, pageWidth - 20, yPosition + 12, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, yPosition + 18, { align: 'right' });
    doc.text(`Valid Until: ${validUntil}`, pageWidth - 20, yPosition + 24, { align: 'right' });
    doc.text(`Service Type: ${getQuotationTypeLabel(quotationType)}`, pageWidth - 20, yPosition + 30, { align: 'right' });

    yPosition += 50;

    // Line separator
    doc.setDrawColor(229, 231, 235);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 15;

    // Customer Information
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Quote For:', 20, yPosition);
    yPosition += 10;

    // Customer details in a box
    doc.setDrawColor(229, 231, 235);
    doc.rect(20, yPosition, pageWidth - 40, 25);
    doc.setFillColor(248, 250, 252);
    doc.rect(20, yPosition, pageWidth - 40, 25, 'F');

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    if (selectedCustomer.company) {
      doc.text(selectedCustomer.company, 25, yPosition + 8);
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text(selectedCustomer.name, 25, yPosition + 15);
    } else {
      doc.text(selectedCustomer.name, 25, yPosition + 8);
    }

    // Customer badges
    if (selectedCustomer.id) {
      doc.setFontSize(8);
      doc.setTextColor(30, 64, 175);
      doc.text(`Code: CUST-${String(selectedCustomer.id).padStart(4, '0')}`, 25, yPosition + 20);
    }
    if (selectedCustomer.phone) {
      doc.setTextColor(22, 101, 52);
      doc.text(`Mobile: ${selectedCustomer.phone}`, 100, yPosition + 20);
    }

    yPosition += 35;

    // Items Table
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Quoted Items & Services', 20, yPosition);
    yPosition += 10;

    const tableData = items.map(item => [
      item.productName,
      item.description,
      item.quantity.toString(),
      item.uom,
      `EGP ${item.unitPrice.toFixed(2)}`,
      `EGP ${item.total.toFixed(2)}`
    ]);

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Item/Service', 'Description', 'Qty', 'UoM', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [0, 0, 0],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [0, 0, 0]
      },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Transportation (if applicable)
    if (transportationFees > 0) {
      doc.setFontSize(11);
      doc.text('Transportation & Delivery', 20, yPosition);
      yPosition += 8;
      
      doc.setFillColor(239, 246, 255);
      doc.rect(20, yPosition, pageWidth - 40, 20, 'F');
      doc.setDrawColor(219, 234, 254);
      doc.rect(20, yPosition, pageWidth - 40, 20);
      
      doc.setFontSize(9);
      doc.setTextColor(30, 58, 138);
      doc.text(getTransportationTypeLabel(transportationType), 25, yPosition + 8);
      doc.text(`EGP ${transportationFees.toFixed(2)}`, pageWidth - 25, yPosition + 8, { align: 'right' });
      
      if (transportationNotes) {
        doc.text(transportationNotes, 25, yPosition + 15);
      }
      
      yPosition += 25;
    }

    // Totals Section
    const totalsX = pageWidth - 80;
    const totalsWidth = 60;
    
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(249, 250, 251);
    
    // Subtotal
    doc.rect(totalsX, yPosition, totalsWidth, 8, 'FD');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('Subtotal:', totalsX + 3, yPosition + 5);
    doc.text(`EGP ${subtotal.toFixed(2)}`, totalsX + totalsWidth - 3, yPosition + 5, { align: 'right' });
    yPosition += 8;

    // Transportation
    if (transportationFees > 0) {
      doc.rect(totalsX, yPosition, totalsWidth, 8, 'FD');
      doc.text('Transportation:', totalsX + 3, yPosition + 5);
      doc.text(`EGP ${transportationFees.toFixed(2)}`, totalsX + totalsWidth - 3, yPosition + 5, { align: 'right' });
      yPosition += 8;
    }

    // VAT
    doc.rect(totalsX, yPosition, totalsWidth, 8, 'FD');
    doc.text(`VAT (${vatPercentage}%):`, totalsX + 3, yPosition + 5);
    doc.text(`EGP ${vatAmount.toFixed(2)}`, totalsX + totalsWidth - 3, yPosition + 5, { align: 'right' });
    yPosition += 8;

    // Total
    doc.setFillColor(37, 99, 235);
    doc.rect(totalsX, yPosition, totalsWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Total Amount:', totalsX + 3, yPosition + 6);
    doc.text(`EGP ${grandTotal.toFixed(2)}`, totalsX + totalsWidth - 3, yPosition + 6, { align: 'right' });
    yPosition += 20;

    // Terms & Conditions
    if (termsAndConditions) {
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text('Terms & Conditions', 20, yPosition);
      yPosition += 8;
      
      doc.setFillColor(248, 250, 252);
      const termsHeight = 40;
      doc.rect(20, yPosition, pageWidth - 40, termsHeight, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.rect(20, yPosition, pageWidth - 40, termsHeight);
      
      doc.setFontSize(8);
      doc.setTextColor(55, 65, 81);
      const splitTerms = doc.splitTextToSize(termsAndConditions, pageWidth - 50);
      doc.text(splitTerms, 25, yPosition + 6);
      yPosition += termsHeight + 10;
    }

    // Footer
    if (yPosition < pageHeight - 30) {
      doc.setDrawColor(229, 231, 235);
      doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
      
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text('Thank you for considering Morgan ERP for your pharmaceutical needs!', pageWidth / 2, pageHeight - 18, { align: 'center' });
      doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
      doc.text('For questions: info@morganerp.com', pageWidth / 2, pageHeight - 6, { align: 'center' });
    }

    return doc;
  };

  const getTransportationTypeLabel = (type?: string) => {
    switch (type) {
      case 'standard': return 'Standard Delivery (3-5 days)';
      case 'express': return 'Express Delivery (1-2 days)';
      case 'cold-chain': return 'Cold Chain Transport (Temperature Controlled)';
      case 'hazmat': return 'Hazardous Materials Transport';
      case 'international': return 'International Shipping';
      case 'pickup': return 'Customer Pickup';
      case 'custom': return 'Custom Transportation';
      default: return 'Standard Delivery';
    }
  };

  const getQuotationTypeLabel = (type: string) => {
    switch (type) {
      case 'manufacturing': return 'Manufacturing Services';
      case 'refining': return 'Refining & Processing';
      case 'finished': return 'Finished Products';
      default: return 'Pharmaceutical Services';
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                    placeholder="Enter quantity"
                    value={newItem.quantity || ''}
                    onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value) || 0})}
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
                    placeholder="0.00"
                    value={newItem.unitPrice || ''}
                    onChange={(e) => setNewItem({...newItem, unitPrice: Number(e.target.value) || 0})}
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
                      placeholder="Enter processing days"
                      value={newItem.processingTime || ''}
                      onChange={(e) => setNewItem({...newItem, processingTime: Number(e.target.value) || 0})}
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
                    value={transportationFees || ''}
                    onChange={(e) => setTransportationFees(Number(e.target.value) || 0)}
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

          {/* Tax Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Tax Configuration
              </CardTitle>
              <CardDescription>
                Configure VAT percentage for this quotation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label>VAT Percentage (%)</Label>
                <Input 
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={vatPercentage || ''}
                  onChange={(e) => setVatPercentage(Number(e.target.value) || 0)}
                  placeholder="14"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Standard Egyptian VAT is 14%. Adjust as needed for specific products or regulations.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Terms & Conditions
              </CardTitle>
              <CardDescription>
                Standard terms and conditions for pharmaceutical quotations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label>Terms & Conditions</Label>
                <Textarea 
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  rows={12}
                  className="mt-1"
                  placeholder="Enter terms and conditions for this quotation..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  These terms will appear on the printed quotation document.
                </p>
              </div>
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
                <span>VAT ({vatPercentage}%):</span>
                <span>${calculateTax().toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${calculateGrandTotal().toFixed(2)}</span>
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
                      <span>VAT ({vatPercentage}%):</span>
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
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setActiveTab('create');
                              toast({
                                title: "Opening Editor",
                                description: "Loading QUOTE-MFG-2025-001 for editing...",
                              });
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setIsPreviewOpen(true);
                              toast({
                                title: "Preview Loading",
                                description: "Preparing quotation preview...",
                              });
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm">
                                <Send className="h-3 w-3 mr-1" />
                                Send
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => {
                                  toast({
                                    title: "Sending via WhatsApp",
                                    description: "Opening WhatsApp with quotation QUOTE-MFG-2025-001...",
                                  });
                                  window.open('https://wa.me/?text=Hello! Please find our quotation QUOTE-MFG-2025-001 for Manufacturing services. Total amount: $12,450.00', '_blank');
                                }}
                              >
                                <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                                Send via WhatsApp
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  toast({
                                    title: "Opening Email Client",
                                    description: "Preparing email with quotation QUOTE-MFG-2025-001...",
                                  });
                                  window.location.href = 'mailto:?subject=Quotation QUOTE-MFG-2025-001 - Manufacturing Services&body=Dear Client,%0A%0APlease find attached our quotation for Manufacturing services.%0A%0AQuotation Number: QUOTE-MFG-2025-001%0ATotal Amount: $12,450.00%0A%0ABest regards,%0AYour Pharmaceutical Team';
                                }}
                              >
                                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                                Send via Email
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete QUOTE-MFG-2025-001? This action cannot be undone.')) {
                                toast({
                                  title: "Draft Deleted",
                                  description: "QUOTE-MFG-2025-001 has been permanently deleted.",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
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
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setActiveTab('create');
                              toast({
                                title: "Opening Editor",
                                description: "Loading QUOTE-REF-2025-002 for editing...",
                              });
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setIsPreviewOpen(true);
                              toast({
                                title: "Preview Loading",
                                description: "Preparing quotation preview...",
                              });
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm">
                                <Send className="h-3 w-3 mr-1" />
                                Send
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => {
                                  toast({
                                    title: "Sending via WhatsApp",
                                    description: "Opening WhatsApp with quotation QUOTE-REF-2025-002...",
                                  });
                                  window.open('https://wa.me/?text=Hello! Please find our quotation QUOTE-REF-2025-002 for Refining services. Total amount: $8,750.00', '_blank');
                                }}
                              >
                                <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                                Send via WhatsApp
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  toast({
                                    title: "Opening Email Client",
                                    description: "Preparing email with quotation QUOTE-REF-2025-002...",
                                  });
                                  window.location.href = 'mailto:?subject=Quotation QUOTE-REF-2025-002 - Refining Services&body=Dear Client,%0A%0APlease find attached our quotation for Refining services.%0A%0AQuotation Number: QUOTE-REF-2025-002%0ATotal Amount: $8,750.00%0A%0ABest regards,%0AYour Pharmaceutical Team';
                                }}
                              >
                                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                                Send via Email
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete QUOTE-REF-2025-002? This action cannot be undone.')) {
                                toast({
                                  title: "Draft Deleted",
                                  description: "QUOTE-REF-2025-002 has been permanently deleted.",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
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
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setActiveTab('create');
                              toast({
                                title: "Opening Editor",
                                description: "Loading QUOTE-FIN-2025-003 for editing...",
                              });
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setIsPreviewOpen(true);
                              toast({
                                title: "Preview Loading",
                                description: "Preparing quotation preview...",
                              });
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm">
                                <Send className="h-3 w-3 mr-1" />
                                Send
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => {
                                  toast({
                                    title: "Sending via WhatsApp",
                                    description: "Opening WhatsApp with quotation QUOTE-FIN-2025-003...",
                                  });
                                  window.open('https://wa.me/?text=Hello! Please find our quotation QUOTE-FIN-2025-003 for Finished Products. Total amount: $15,200.00', '_blank');
                                }}
                              >
                                <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                                Send via WhatsApp
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  toast({
                                    title: "Opening Email Client",
                                    description: "Preparing email with quotation QUOTE-FIN-2025-003...",
                                  });
                                  window.location.href = 'mailto:?subject=Quotation QUOTE-FIN-2025-003 - Finished Products&body=Dear Client,%0A%0APlease find attached our quotation for Finished Products.%0A%0AQuotation Number: QUOTE-FIN-2025-003%0ATotal Amount: $15,200.00%0A%0ABest regards,%0AYour Pharmaceutical Team';
                                }}
                              >
                                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                                Send via Email
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete QUOTE-FIN-2025-003? This action cannot be undone.')) {
                                toast({
                                  title: "Draft Deleted",
                                  description: "QUOTE-FIN-2025-003 has been permanently deleted.",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
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
                termsAndConditions={termsAndConditions}
              />
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Please select a customer to preview the quotation</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close Preview
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                const printContent = document.querySelector('.printable-quotation');
                if (printContent) {
                  const originalDisplay = document.body.style.display;
                  const originalContents = document.body.innerHTML;
                  
                  document.body.innerHTML = printContent.outerHTML;
                  document.body.style.display = 'block';
                  
                  window.print();
                  
                  document.body.innerHTML = originalContents;
                  document.body.style.display = originalDisplay;
                }
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  const printContent = document.querySelector('.printable-quotation');
                  if (!printContent) {
                    toast({
                      title: "Error",
                      description: "Unable to find quotation content to download",
                      variant: "destructive"
                    });
                    return;
                  }

                  // Create a new window with the quotation content
                  const printWindow = window.open('', '_blank', 'width=800,height=600');
                  if (!printWindow) {
                    toast({
                      title: "Error", 
                      description: "Pop-up blocked. Please allow pop-ups and try again.",
                      variant: "destructive"
                    });
                    return;
                  }

                  // Write the HTML content to the new window
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>Quotation-${quotationNumber}</title>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                          @page {
                            size: A4;
                            margin: 0.75in 0.5in;
                          }
                          
                          * {
                            box-sizing: border-box;
                          }
                          
                          body { 
                            margin: 0; 
                            padding: 0;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                            font-size: 11px;
                            line-height: 1.3;
                            color: #000;
                            background: white;
                          }
                          
                          .printable-quotation { 
                            box-shadow: none !important; 
                            margin: 0 !important; 
                            padding: 0 !important; 
                            max-width: none !important; 
                            width: 100% !important; 
                            background: white !important;
                          }
                          
                          /* Header styling */
                          .company-info {
                            display: flex !important;
                            align-items: flex-start !important;
                            gap: 12px !important;
                          }
                          
                          .company-info img {
                            width: 48px !important;
                            height: 48px !important;
                            object-fit: contain !important;
                          }
                          
                          .company-info h1 {
                            font-size: 22px !important;
                            font-weight: bold !important;
                            color: #2563eb !important;
                            margin: 0 0 4px 0 !important;
                          }
                          
                          .quotation-header h2 {
                            font-size: 18px !important;
                            font-weight: bold !important;
                            margin: 0 0 8px 0 !important;
                          }
                          
                          /* Customer info styling */
                          .customer-info .bg-gray-50 { 
                            background-color: #f8f9fa !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            padding: 12px !important;
                            border: 1px solid #e5e7eb !important;
                            border-radius: 4px !important;
                          }
                          
                          .customer-info h3 {
                            font-size: 14px !important;
                            font-weight: 600 !important;
                            margin: 0 0 6px 0 !important;
                          }
                          
                          /* Badge styling */
                          .inline-flex {
                            display: inline-flex !important;
                            align-items: center !important;
                            padding: 2px 6px !important;
                            border-radius: 3px !important;
                            font-size: 9px !important;
                            font-weight: 500 !important;
                            margin: 2px 4px 2px 0 !important;
                          }
                          
                          .bg-blue-100 { 
                            background-color: #dbeafe !important;
                            color: #1e40af !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                          }
                          
                          .bg-green-100 { 
                            background-color: #dcfce7 !important;
                            color: #166534 !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                          }
                          
                          /* Table styling */
                          table { 
                            page-break-inside: avoid; 
                            border-collapse: collapse !important;
                            width: 100% !important;
                            margin: 8px 0 !important;
                            font-size: 10px !important;
                          }
                          
                          th, td {
                            border: 1px solid #374151 !important;
                            padding: 6px 8px !important;
                            text-align: left !important;
                            vertical-align: top !important;
                          }
                          
                          th {
                            background-color: #f3f4f6 !important;
                            font-weight: 600 !important;
                            font-size: 10px !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                          }
                          
                          .text-center { text-align: center !important; }
                          .text-right { text-align: right !important; }
                          .font-semibold { font-weight: 600 !important; }
                          .font-medium { font-weight: 500 !important; }
                          
                          /* Transportation section */
                          .bg-blue-50 { 
                            background-color: #eff6ff !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            padding: 12px !important;
                            border: 1px solid #dbeafe !important;
                            border-radius: 4px !important;
                            margin: 8px 0 !important;
                          }
                          
                          /* Totals section */
                          .w-80 {
                            width: 300px !important;
                            margin-left: auto !important;
                          }
                          
                          .bg-blue-600 { 
                            background-color: #2563eb !important; 
                            color: white !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            padding: 8px 12px !important;
                            font-weight: bold !important;
                          }
                          
                          /* Terms section */
                          .terms .bg-gray-50 {
                            background-color: #f8f9fa !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            padding: 12px !important;
                            border: 1px solid #e5e7eb !important;
                            border-radius: 4px !important;
                          }
                          
                          .terms pre {
                            white-space: pre-wrap !important;
                            font-family: inherit !important;
                            font-size: 10px !important;
                            line-height: 1.4 !important;
                            margin: 0 !important;
                          }
                          
                          /* Footer styling */
                          .footer { 
                            page-break-inside: avoid; 
                            border-top: 1px solid #e5e7eb !important;
                            padding-top: 12px !important;
                            margin-top: 16px !important;
                            text-align: center !important;
                            font-size: 10px !important;
                          }
                          
                          /* Spacing */
                          .mb-8 { margin-bottom: 16px !important; }
                          .mb-6 { margin-bottom: 12px !important; }
                          .mb-4 { margin-bottom: 8px !important; }
                          .mb-3 { margin-bottom: 6px !important; }
                          .mb-2 { margin-bottom: 4px !important; }
                          .mt-4 { margin-top: 8px !important; }
                          .mt-2 { margin-top: 4px !important; }
                          .mt-1 { margin-top: 2px !important; }
                          .pb-6 { padding-bottom: 12px !important; }
                          .pt-2 { padding-top: 4px !important; }
                          
                          /* Border utilities */
                          .border-b { border-bottom: 1px solid #e5e7eb !important; }
                          .border-t { border-top: 1px solid #e5e7eb !important; }
                          
                          /* Text utilities */
                          .text-sm { font-size: 10px !important; }
                          .text-xs { font-size: 9px !important; }
                          .text-lg { font-size: 13px !important; }
                          .text-2xl { font-size: 18px !important; }
                          .text-3xl { font-size: 22px !important; }
                          .text-gray-600 { color: #4b5563 !important; }
                          .text-gray-700 { color: #374151 !important; }
                          .text-gray-800 { color: #1f2937 !important; }
                          .text-blue-600 { color: #2563eb !important; }
                          .text-blue-700 { color: #1d4ed8 !important; }
                          .text-blue-900 { color: #1e3a8a !important; }
                          
                          /* Flex utilities */
                          .flex { display: flex !important; }
                          .justify-between { justify-content: space-between !important; }
                          .justify-end { justify-content: flex-end !important; }
                          .items-start { align-items: flex-start !important; }
                          .items-center { align-items: center !important; }
                          .gap-4 { gap: 8px !important; }
                          .gap-2 { gap: 4px !important; }
                          
                          /* Prevent page breaks */
                          .terms, .footer, .transportation-info {
                            page-break-inside: avoid !important;
                          }
                          
                          h1, h2, h3 {
                            page-break-after: avoid !important;
                          }
                        </style>
                      </head>
                      <body>
                        ${printContent.outerHTML}
                        <script>
                          window.onload = function() {
                            setTimeout(function() {
                              window.print();
                            }, 1500);
                          };
                          
                          window.onafterprint = function() {
                            setTimeout(function() {
                              window.close();
                            }, 500);
                          };
                        </script>
                      </body>
                    </html>
                  `);
                  
                  printWindow.document.close();
                  
                  toast({
                    title: "PDF Download",
                    description: "Print dialog opened. Choose 'Save as PDF' as destination."
                  });
                  
                } catch (error) {
                  console.error('Download error:', error);
                  toast({
                    title: "Download Error",
                    description: "Failed to generate PDF. Please try again.",
                    variant: "destructive"
                  });
                }
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Download PDF
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