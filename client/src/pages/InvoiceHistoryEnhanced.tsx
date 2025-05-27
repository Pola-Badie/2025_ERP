import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  Eye, 
  Search, 
  Calendar, 
  Filter, 
  CreditCard, 
  Check, 
  Trash2,
  Edit,
  Send,
  ChevronDown,
  MessageCircle,
  Mail,
  DollarSign,
  User,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
  etaUploaded?: boolean;
  etaReference?: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    unitOfMeasure?: string;
  }[];
}

const InvoiceHistoryEnhanced = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Sample invoices data
  React.useEffect(() => {
    setIsLoading(true);
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
        etaUploaded: true,
        etaReference: "ETA-20250501-XY123",
        items: [
          {
            productName: "Pharmaceutical Grade Acetone",
            quantity: 25,
            unitPrice: 42.50,
            total: 1062.50,
            unitOfMeasure: "L"
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
        etaUploaded: false,
        items: [
          {
            productName: "Sodium Hydroxide (Technical Grade)",
            quantity: 100,
            unitPrice: 18.45,
            total: 1845.00,
            unitOfMeasure: "kg"
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
        etaUploaded: false,
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
        etaUploaded: true,
        etaReference: "ETA-20250420-AB789",
        items: [
          {
            productName: "Pharmaceutical Grade Glycerin",
            quantity: 75,
            unitPrice: 32.25,
            total: 2418.75,
            unitOfMeasure: "L"
          }
        ]
      }
    ];
    
    setInvoices(sampleInvoices);
    setIsLoading(false);
  }, []);

  // Filter invoices based on search term and filters
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
      unpaid: { bg: 'bg-red-100', text: 'text-red-800', label: 'Unpaid' },
      partial: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Partial' },
      overdue: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Overdue' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge className={`${config.bg} ${config.text} font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const getETABadge = (invoice: Invoice) => {
    if (invoice.etaUploaded) {
      return <Badge className="bg-green-100 text-green-800">ETA: {invoice.etaReference}</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Not Uploaded</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none"></div>
      
      <div className="relative max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        {/* Header Section */}
        <Card className="bg-gradient-to-br from-slate-50 to-blue-50/50 border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="h-7 w-7 text-blue-600" />
                  Invoice Management Dashboard
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  Professional invoice tracking and management • {filteredInvoices.length} invoices found
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  className="hover:bg-gray-50 hover:border-gray-200"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Recycle Bin
                </Button>
                <Button onClick={() => window.location.href = '/create-invoice'} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  New Invoice
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {/* Statistics Cards */}
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Invoices</p>
                    <p className="text-2xl font-bold text-slate-800">{invoices.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Value</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${invoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Outstanding</p>
                    <p className="text-2xl font-bold text-orange-600">
                      ${invoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + (inv.amount - (inv.amountPaid || 0)), 0).toLocaleString()}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Paid This Month</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {invoices.filter(inv => inv.status === 'paid').length}
                    </p>
                  </div>
                  <Check className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-800">Search & Filter Invoices</CardTitle>
            <CardDescription className="text-slate-600">
              Find specific invoices using advanced search and filtering options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by invoice number, customer name, or amount..."
                  className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] h-11 border-slate-200">
                    <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4 text-slate-500" />
                      <span>Payment Status</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partial">Partial Payment</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[180px] h-11 border-slate-200">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-slate-500" />
                      <span>Date Range</span>
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
          </CardContent>
        </Card>

        {/* Invoice List */}
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-800">Invoice List</CardTitle>
            <CardDescription className="text-slate-600">
              Manage and track all your pharmaceutical invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <Card key={invoice.id} className="border-dashed hover:shadow-md transition-all duration-200 bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-800">{invoice.invoiceNumber}</h4>
                          <p className="text-sm text-slate-500">
                            {invoice.customerName} • 
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD'
                            }).format(invoice.amount)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {getStatusBadge(invoice.status)}
                            {getETABadge(invoice)}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            Created {format(new Date(invoice.date), 'MMM dd, yyyy')}
                            {invoice.dueDate && ` • Due ${format(new Date(invoice.dueDate), 'MMM dd, yyyy')}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowPreview(true);
                            toast({
                              title: "Loading Invoice",
                              description: `Opening ${invoice.invoiceNumber} for editing...`,
                            });
                          }}
                          className="hover:bg-blue-50 hover:border-blue-200"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowPreview(true);
                            toast({
                              title: "Preview Loading",
                              description: "Preparing invoice preview...",
                            });
                          }}
                          className="hover:bg-green-50 hover:border-green-200"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
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
                                  description: `Opening WhatsApp for ${invoice.customerName}...`,
                                });
                                const message = `Hello! Please find your invoice ${invoice.invoiceNumber}. Total amount: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.amount)}`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                              }}
                            >
                              <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                              Send via WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                toast({
                                  title: "Opening Email Client",
                                  description: `Preparing email for ${invoice.customerName}...`,
                                });
                                const subject = `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`;
                                const body = `Dear ${invoice.customerName},%0A%0APlease find attached your invoice.%0A%0AInvoice Number: ${invoice.invoiceNumber}%0ATotal Amount: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.amount)}%0A%0ABest regards,%0AYour Pharmaceutical Team`;
                                window.location.href = `mailto:?subject=${subject}&body=${body}`;
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
                            if (confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`)) {
                              toast({
                                title: "Invoice Deleted",
                                description: `${invoice.invoiceNumber} has been permanently deleted.`,
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
              ))}
            </div>

            {filteredInvoices.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-slate-800">No Invoices Found</h3>
                <p className="text-slate-600 mb-6">
                  No invoices match your current search criteria. Try adjusting your filters.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Invoice Preview</DialogTitle>
              <DialogDescription>
                {selectedInvoice && `Preview for ${selectedInvoice.invoiceNumber}`}
              </DialogDescription>
            </DialogHeader>
            
            {selectedInvoice && (
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Invoice Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Invoice Number:</strong> {selectedInvoice.invoiceNumber}</p>
                      <p><strong>Customer:</strong> {selectedInvoice.customerName}</p>
                      <p><strong>Date:</strong> {format(new Date(selectedInvoice.date), 'PPP')}</p>
                    </div>
                    <div>
                      <p><strong>Amount:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(selectedInvoice.amount)}</p>
                      <p><strong>Status:</strong> {selectedInvoice.status}</p>
                      <p><strong>ETA Status:</strong> {selectedInvoice.etaUploaded ? 'Uploaded' : 'Not Uploaded'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close Preview
              </Button>
              <Button onClick={() => toast({ title: "Download Started", description: "Invoice PDF is being generated..." })}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InvoiceHistoryEnhanced;