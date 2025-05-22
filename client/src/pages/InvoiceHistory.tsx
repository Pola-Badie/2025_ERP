import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Eye, Search, Calendar, Filter, Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface Invoice {
  id: number;
  invoiceNumber: string;
  customerName: string;
  date: string;
  dueDate?: string;
  amount: number;
  amountPaid?: number;
  paymentMethod?: string;
  status: 'paid' | 'unpaid' | 'partial' | 'overdue';
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    unitOfMeasure?: string;
  }[];
}

const InvoiceHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use hardcoded sample data for demonstration
  const [isLoading, setIsLoading] = useState(true);
  
  // Sample invoices with payment method and outstanding balance
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  React.useEffect(() => {
    // Simulate loading
    setIsLoading(true);
    
    // Create sample data
    const sampleInvoices: Invoice[] = [
      {
        id: 1001,
        invoiceNumber: "INV-002501",
        customerName: "Ahmed Hassan",
        date: "2025-05-01T10:30:00Z",
        dueDate: "2025-05-16T10:30:00Z",
        amount: 1250.75,
        amountPaid: 1250.75,
        paymentMethod: "credit_card",
        status: "paid",
        items: [
          {
            productName: "Pharmaceutical Grade Acetone",
            quantity: 25,
            unitPrice: 42.50,
            total: 1062.50,
            unitOfMeasure: "L"
          },
          {
            productName: "Laboratory Glassware Set",
            quantity: 2,
            unitPrice: 94.12,
            total: 188.24,
            unitOfMeasure: "set"
          }
        ]
      },
      {
        id: 1002,
        invoiceNumber: "INV-002502",
        customerName: "Cairo Medical Supplies Ltd.",
        date: "2025-05-05T14:20:00Z",
        dueDate: "2025-05-20T14:20:00Z",
        amount: 3245.00,
        amountPaid: 2000.00,
        paymentMethod: "bank_transfer",
        status: "partial",
        items: [
          {
            productName: "Sodium Hydroxide (Technical Grade)",
            quantity: 100,
            unitPrice: 18.45,
            total: 1845.00,
            unitOfMeasure: "kg"
          },
          {
            productName: "Hydrochloric Acid Solution",
            quantity: 50,
            unitPrice: 28.00,
            total: 1400.00,
            unitOfMeasure: "L"
          }
        ]
      },
      {
        id: 1003,
        invoiceNumber: "INV-002503",
        customerName: "Alexandria Pharma Co.",
        date: "2025-05-08T09:15:00Z",
        dueDate: "2025-05-23T09:15:00Z",
        amount: 875.50,
        amountPaid: 0,
        paymentMethod: "cheque",
        status: "unpaid",
        items: [
          {
            productName: "Industrial Ethanol",
            quantity: 35,
            unitPrice: 25.00,
            total: 875.50,
            unitOfMeasure: "L"
          }
        ]
      },
      {
        id: 1004,
        invoiceNumber: "INV-002504",
        customerName: "Modern Laboratories Inc.",
        date: "2025-04-20T16:45:00Z",
        dueDate: "2025-05-05T16:45:00Z",
        amount: 4520.75,
        amountPaid: 0,
        paymentMethod: "",
        status: "overdue",
        items: [
          {
            productName: "Pharmaceutical Grade Glycerin",
            quantity: 75,
            unitPrice: 32.25,
            total: 2418.75,
            unitOfMeasure: "L"
          },
          {
            productName: "Purified Water USP",
            quantity: 200,
            unitPrice: 8.76,
            total: 1752.00,
            unitOfMeasure: "L"
          },
          {
            productName: "Citric Acid Anhydrous",
            quantity: 50,
            unitPrice: 7.00,
            total: 350.00,
            unitOfMeasure: "kg"
          }
        ]
      },
      {
        id: 1005,
        invoiceNumber: "INV-002505",
        customerName: "Giza Chemical Solutions",
        date: "2025-05-12T11:10:00Z",
        dueDate: "2025-05-27T11:10:00Z",
        amount: 1865.25,
        amountPaid: 1865.25,
        paymentMethod: "cash",
        status: "paid",
        items: [
          {
            productName: "Magnesium Sulfate",
            quantity: 125,
            unitPrice: 6.50,
            total: 812.50,
            unitOfMeasure: "kg"
          },
          {
            productName: "Sodium Bicarbonate",
            quantity: 150,
            unitPrice: 7.02,
            total: 1052.75,
            unitOfMeasure: "kg"
          }
        ]
      }
    ];
    
    setInvoices(sampleInvoices);
    setIsLoading(false);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).filter(file => {
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        return validTypes.includes(file.type) && file.size <= maxSize;
      });
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter invoices based on search term and filters
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    // Simple date filtering (in a real app, would use proper date comparison)
    const matchesDate = dateFilter === 'all' || true;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Handle invoice preview
  const handlePreview = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPreview(true);
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'unpaid':
        return <Badge className="bg-orange-100 text-orange-800">Unpaid</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Invoice History</h1>
          <p className="text-muted-foreground">View and manage all your invoices</p>
        </div>
        <Button onClick={() => window.location.href = '/create-invoice'}>
          <FileText className="mr-2 h-4 w-4" />
          Create New Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Find Invoices</CardTitle>
          <CardDescription>Search and filter through your invoice history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number or customer..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <div className="w-[180px]">
                <Select 
                  value={statusFilter} 
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4" />
                      <span>Status</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[180px]">
                <Select 
                  value={dateFilter} 
                  onValueChange={setDateFilter}
                >
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Date</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
          <CardDescription>
            Showing {filteredInvoices.length} invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No invoices found</p>
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' ? (
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters</p>
              ) : (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.href = '/create-invoice'}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Create Your First Invoice
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="min-w-[120px]">Invoice #</TableHead>
                      <TableHead className="min-w-[180px]">Customer</TableHead>
                      <TableHead className="min-w-[120px]">Date</TableHead>
                      <TableHead className="min-w-[120px]">Amount</TableHead>
                      <TableHead className="min-w-[120px]">Outstanding</TableHead>
                      <TableHead className="min-w-[150px]">Payment Method</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell>{format(new Date(invoice.date), 'PP')}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(invoice.amount)}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(invoice.status === 'paid' ? 0 : 
                                    invoice.status === 'partial' ? invoice.amount - (invoice.amountPaid || 0) : 
                                    invoice.amount)}
                        </TableCell>
                        <TableCell>
                          {invoice.paymentMethod ? 
                            invoice.paymentMethod.charAt(0).toUpperCase() + 
                            invoice.paymentMethod.slice(1).replace('_', ' ') : 
                            '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handlePreview(invoice)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Preview Dialog */}
      {selectedInvoice && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice #{selectedInvoice.invoiceNumber}</DialogTitle>
              <DialogDescription>
                {format(new Date(selectedInvoice.date), 'PPP')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="border rounded-lg p-6">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-blue-600">INVOICE</h2>
                  <p className="text-muted-foreground">PharmaOverseas Ltd.</p>
                  <p className="text-muted-foreground">123 Pharma Street, Lagos</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">Invoice #: {selectedInvoice.invoiceNumber}</p>
                  <p>Issue Date: {format(new Date(selectedInvoice.date), 'PP')}</p>
                  {selectedInvoice.dueDate && (
                    <p>Due Date: {format(new Date(selectedInvoice.dueDate), 'PP')}</p>
                  )}
                  <p className="mt-2">
                    {getStatusBadge(selectedInvoice.status)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="font-semibold mb-2">Bill To:</h3>
                  <p className="font-medium">{selectedInvoice.customerName}</p>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInvoice.items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Uploaded Documents Section */}
              <div className="mt-8 mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Uploaded Documents
                </h3>
                
                <div className="border rounded-lg p-4 bg-slate-50">
                  <div className="grid gap-3 max-h-80 overflow-y-auto pr-2">
                    {/* Sample documents - in real implementation, this would come from the invoice data */}
                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-blue-600 mr-3" />
                        <div>
                          <p className="font-medium text-sm">Invoice_Receipt_{selectedInvoice.invoiceNumber}.pdf</p>
                          <p className="text-xs text-slate-500">245 KB • Uploaded 2 days ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div className="flex items-center">
                        <ImageIcon className="h-5 w-5 text-green-600 mr-3" />
                        <div>
                          <p className="font-medium text-sm">Product_Certificate_{selectedInvoice.customerName.replace(/\s+/g, '_')}.jpg</p>
                          <p className="text-xs text-slate-500">1.2 MB • Uploaded 5 days ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-purple-600 mr-3" />
                        <div>
                          <p className="font-medium text-sm">Shipping_Label_{selectedInvoice.invoiceNumber}.pdf</p>
                          <p className="text-xs text-slate-500">156 KB • Uploaded 1 week ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Show uploaded files */}
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded border border-green-200 bg-green-50">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-green-600 mr-3" />
                          <div>
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-slate-500">{formatFileSize(file.size)} • Just uploaded</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeUploadedFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Upload new document option */}
                    <div 
                      className="flex items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-slate-400 transition-colors cursor-pointer"
                      onClick={triggerFileUpload}
                    >
                      <div className="text-center">
                        <Upload className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600">Upload additional documents</p>
                        <p className="text-xs text-slate-400">PDF, JPG, PNG up to 10MB</p>
                      </div>
                    </div>
                    
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
              
              {/* Financial Summary Section */}
              <div className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Payment Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-3">Payment Information</h3>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Payment Method:</span>
                        <span className="font-medium capitalize">
                          {selectedInvoice.paymentMethod?.replace('_', ' ') || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Payment Status:</span>
                        <span className="font-medium">
                          {getStatusBadge(selectedInvoice.status)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Amount Paid:</span>
                        <span className="font-medium text-green-600">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(selectedInvoice.amountPaid || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Outstanding Balance:</span>
                        <span className="font-medium text-red-600">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format((selectedInvoice.amount || 0) - (selectedInvoice.amountPaid || 0))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-3">Financial Summary</h3>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                      {/* Calculate subtotal from items */}
                      <div className="flex justify-between">
                        <span className="text-slate-600">Subtotal:</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(selectedInvoice.items.reduce((sum, item) => sum + item.total, 0))}
                        </span>
                      </div>
                      
                      {/* Discount (if any) */}
                      <div className="flex justify-between">
                        <span className="text-slate-600">Discount (5%):</span>
                        <span className="font-medium text-green-600">
                          -{new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(selectedInvoice.items.reduce((sum, item) => sum + item.total, 0) * 0.05)}
                        </span>
                      </div>
                      
                      {/* Calculate after discount */}
                      <div className="flex justify-between">
                        <span className="text-slate-600">After Discount:</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(selectedInvoice.items.reduce((sum, item) => sum + item.total, 0) * 0.95)}
                        </span>
                      </div>
                      
                      {/* Tax */}
                      <div className="flex justify-between">
                        <span className="text-slate-600">Tax (14%):</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(selectedInvoice.items.reduce((sum, item) => sum + item.total, 0) * 0.95 * 0.14)}
                        </span>
                      </div>
                      
                      {/* Shipping (if applicable) */}
                      <div className="flex justify-between">
                        <span className="text-slate-600">Shipping & Handling:</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(25.00)}
                        </span>
                      </div>
                      
                      <Separator className="my-2" />
                      
                      {/* Final Total */}
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Grand Total:</span>
                        <span className="text-blue-600">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(selectedInvoice.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invoice Notes Section */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Invoice Notes</h4>
                  <div className="text-sm text-blue-700 space-y-2">
                    <p>• Special handling required for temperature-sensitive pharmaceutical products</p>
                    <p>• Customer requested expedited shipping for urgent medical supplies</p>
                    <p>• Quality certificate provided for all pharmaceutical grade chemicals</p>
                    <p>• Delivery scheduled for {format(new Date(selectedInvoice.dueDate || selectedInvoice.date), 'PP')} at customer facility</p>
                    <p>• Contact Dr. {selectedInvoice.customerName.split(' ')[0]} for any product-related inquiries</p>
                  </div>
                </div>

                {/* Terms & Conditions Section */}
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">Terms & Conditions</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Payment is due within 30 days of invoice date</li>
                    <li>• Late payments may incur additional charges</li>
                    <li>• All pharmaceutical products are subject to quality assurance</li>
                    <li>• Returns accepted within 14 days with original packaging</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default InvoiceHistory;