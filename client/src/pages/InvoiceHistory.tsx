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
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, Download, Eye, Search, Calendar, Filter, Upload, Image as ImageIcon, MessageCircle, Mail, MoreHorizontal, CreditCard, Trash2, Check, ChevronDown, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
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

const InvoiceHistory = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [invoiceToUpdate, setInvoiceToUpdate] = useState<Invoice | null>(null);
  
  // Refund state
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundInvoice, setRefundInvoice] = useState<Invoice | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  
  // Multi-select state
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Recycle bin state
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [deletedInvoices, setDeletedInvoices] = useState<(Invoice & { deletedAt: string })[]>([
    {
      id: 9001,
      invoiceNumber: 'INV-2024-9001',
      customerName: 'GlobalHealth Solutions',
      date: '2024-01-15',
      dueDate: '2024-02-15',
      amount: 4500.00,
      amountPaid: 0,
      paymentMethod: 'bank_transfer',
      status: 'unpaid' as const,
      etaUploaded: false,
      deletedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      items: [
        { productName: 'Paracetamol 500mg', quantity: 100, unitPrice: 25.00, total: 2500.00 },
        { productName: 'Ibuprofen 400mg', quantity: 80, unitPrice: 25.00, total: 2000.00 }
      ]
    },
    {
      id: 9002,
      invoiceNumber: 'INV-2024-9002',
      customerName: 'MediCare Pharmacy',
      date: '2024-01-10',
      dueDate: '2024-02-10',
      amount: 2800.75,
      amountPaid: 1000.00,
      paymentMethod: 'visa',
      status: 'partial' as const,
      etaUploaded: true,
      etaReference: 'ETA-9002-2024',
      deletedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago (5 days remaining)
      items: [
        { productName: 'Amoxicillin 250mg', quantity: 50, unitPrice: 30.00, total: 1500.00 },
        { productName: 'Azithromycin 500mg', quantity: 25, unitPrice: 52.03, total: 1300.75 }
      ]
    },
    {
      id: 9003,
      invoiceNumber: 'INV-2024-9003',
      customerName: 'City General Hospital',
      date: '2024-01-08',
      dueDate: '2024-02-08',
      amount: 15750.00,
      amountPaid: 15750.00,
      paymentMethod: 'cheque',
      status: 'paid' as const,
      etaUploaded: true,
      etaReference: 'ETA-9003-2024',
      deletedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago (28 days remaining)
      items: [
        { productName: 'Insulin Glargine 100 IU/ml', quantity: 30, unitPrice: 125.00, total: 3750.00 },
        { productName: 'Metformin 850mg', quantity: 200, unitPrice: 15.00, total: 3000.00 },
        { productName: 'Lisinopril 10mg', quantity: 150, unitPrice: 60.00, total: 9000.00 }
      ]
    }
  ]);

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

  const downloadInvoicePDF = () => {
    if (!selectedInvoice) return;
    
    // Create a temporary link to download the invoice as PDF
    const invoiceContent = `
INVOICE - ${selectedInvoice.invoiceNumber}
PharmaOverseas Ltd.
123 Pharma Street, Lagos

Bill To: ${selectedInvoice.customerName}
Date: ${format(new Date(selectedInvoice.date), 'PP')}
Due Date: ${selectedInvoice.dueDate ? format(new Date(selectedInvoice.dueDate), 'PP') : 'N/A'}
Status: ${selectedInvoice.status}

ITEMS:
${selectedInvoice.items.map(item => 
  `${item.productName} - Qty: ${item.quantity} - Price: $${item.unitPrice} - Total: $${item.total}`
).join('\n')}

FINANCIAL SUMMARY:
Subtotal: $${selectedInvoice.items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
Discount (5%): -$${(selectedInvoice.items.reduce((sum, item) => sum + item.total, 0) * 0.05).toFixed(2)}
Tax (14%): $${(selectedInvoice.items.reduce((sum, item) => sum + item.total, 0) * 0.95 * 0.14).toFixed(2)}
Shipping: $25.00
GRAND TOTAL: $${selectedInvoice.amount.toFixed(2)}

Payment Method: ${selectedInvoice.paymentMethod?.replace('_', ' ') || 'Not specified'}
Amount Paid: $${(selectedInvoice.amountPaid || 0).toFixed(2)}
Outstanding: $${((selectedInvoice.amount || 0) - (selectedInvoice.amountPaid || 0)).toFixed(2)}
`;

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${selectedInvoice.invoiceNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadDocument = (fileName: string, fileType: string = 'pdf') => {
    // Create a sample document content for download
    const content = `
DOCUMENT: ${fileName}
Generated by PharmaOverseas ERP System
Date: ${new Date().toLocaleDateString()}

This is a sample document from the pharmaceutical ERP system.
In a real implementation, this would download the actual file from the server.

Document Type: ${fileType.toUpperCase()}
Invoice Reference: ${selectedInvoice?.invoiceNumber || 'N/A'}
Customer: ${selectedInvoice?.customerName || 'N/A'}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const uploadToETA = async (invoiceId: number) => {
    try {
      // Simulate ETA upload process
      console.log(`Uploading invoice ${invoiceId} to Egyptian Tax Authority...`);
      
      // In real implementation, you would call the ETA API here
      // const response = await apiRequest('POST', '/api/eta/upload', { invoiceId });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate realistic ETA reference number (format: ETA-YYYYMMDD-XXXXX)
      const date = new Date();
      const dateStr = date.getFullYear().toString() + 
                     (date.getMonth() + 1).toString().padStart(2, '0') + 
                     date.getDate().toString().padStart(2, '0');
      const randomSuffix = Math.random().toString(36).substr(2, 5).toUpperCase();
      const etaReference = `ETA-${dateStr}-${randomSuffix}`;
      
      // Update invoice status locally (in real app, this would be done on the server)
      setInvoices(prev => prev.map(invoice => 
        invoice.id === invoiceId 
          ? { ...invoice, etaUploaded: true, etaReference: etaReference }
          : invoice
      ));
      
      toast({
        title: "ETA Upload Successful",
        description: `Invoice uploaded to Egyptian Tax Authority. Reference: ${etaReference}`,
      });
    } catch (error) {
      console.error('ETA upload failed:', error);
      toast({
        title: "ETA Upload Failed",
        description: "Failed to upload invoice to ETA. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getETAStatus = (invoice: Invoice) => {
    if (invoice.etaUploaded) {
      return <Badge className="bg-green-100 text-green-800">YES</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">NO</Badge>;
    }
  };

  // Refund handler function
  const handleRefund = (invoice: Invoice) => {
    setRefundInvoice(invoice);
    setRefundAmount((invoice.amountPaid || 0).toString());
    setRefundReason('');
    setIsRefundDialogOpen(true);
  };

  // Process refund
  const processRefund = () => {
    if (!refundAmount || !refundReason) {
      toast({
        title: "Error",
        description: "Please enter refund amount and reason",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Refund Processed",
      description: `Refund of $${refundAmount} processed for ${refundInvoice?.customerName}`,
    });

    setIsRefundDialogOpen(false);
    setRefundInvoice(null);
    setRefundAmount('');
    setRefundReason('');
  };

  // Function to handle payment fulfillment
  const handlePaymentFulfillment = (invoice: Invoice) => {
    const outstandingBalance = invoice.amount - (invoice.amountPaid || 0);
    setInvoiceToUpdate(invoice);
    setPaymentAmount(outstandingBalance.toFixed(2));
    setShowPaymentDialog(true);
  };

  // Function to process payment and update invoice status
  const processPayment = () => {
    if (!invoiceToUpdate || !paymentAmount) return;

    const paymentAmountNum = parseFloat(paymentAmount);
    const currentAmountPaid = invoiceToUpdate.amountPaid || 0;
    const newAmountPaid = currentAmountPaid + paymentAmountNum;
    const outstandingBalance = invoiceToUpdate.amount - newAmountPaid;

    // Update invoice with new payment
    setInvoices(prev => prev.map(invoice => 
      invoice.id === invoiceToUpdate.id 
        ? { 
            ...invoice, 
            amountPaid: newAmountPaid,
            status: outstandingBalance <= 0.01 ? 'paid' : 'partial'
          }
        : invoice
    ));

    // Close dialog and reset state
    setShowPaymentDialog(false);
    setPaymentAmount('');
    setInvoiceToUpdate(null);

    // Show success message
    alert(`Payment of $${paymentAmountNum.toFixed(2)} processed successfully! ${outstandingBalance <= 0.01 ? 'Invoice is now fully paid.' : `Remaining balance: $${outstandingBalance.toFixed(2)}`}`);
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter]);

  // Checkbox selection handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedInvoices(filteredInvoices.map(invoice => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId: number, checked: boolean) => {
    if (checked) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
      setSelectAll(false);
    }
  };

  // Bulk actions
  const handleBulkDelete = () => {
    if (selectedInvoices.length === 0) return;
    
    // Show confirmation dialog
    if (window.confirm(`Are you sure you want to delete ${selectedInvoices.length} invoice(s)? This action cannot be undone.`)) {
      // Remove selected invoices from the list
      setInvoices(prev => prev.filter(invoice => !selectedInvoices.includes(invoice.id)));
      setSelectedInvoices([]);
      setSelectAll(false);
      
      // Show success message
      alert(`Successfully deleted ${selectedInvoices.length} invoice(s).`);
    }
  };

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

  // Export all invoices to CSV
  const exportInvoicesToCSV = (invoicesToExport: Invoice[]) => {
    const headers = [
      'Invoice Number',
      'Customer Name', 
      'Date',
      'Due Date',
      'Amount',
      'Amount Paid',
      'Outstanding Balance',
      'Payment Method',
      'Status',
      'ETA Uploaded',
      'ETA Reference'
    ];

    const csvData = invoicesToExport.map(invoice => [
      invoice.invoiceNumber,
      invoice.customerName,
      format(new Date(invoice.date), 'PP'),
      invoice.dueDate ? format(new Date(invoice.dueDate), 'PP') : '',
      invoice.amount.toFixed(2),
      (invoice.amountPaid || 0).toFixed(2),
      (invoice.amount - (invoice.amountPaid || 0)).toFixed(2),
      invoice.paymentMethod?.replace('_', ' ') || '',
      invoice.status,
      invoice.etaUploaded ? 'Yes' : 'No',
      invoice.etaReference || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `invoices_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export individual invoice to PDF
  const exportInvoiceToPDF = (invoice: Invoice) => {
    // Create a printable version for PDF export
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${invoice.invoiceNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
              .invoice-details { margin: 20px 0; }
              .items { margin-top: 30px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>INVOICE</h1>
              <h2>PharmaOverseas Ltd.</h2>
            </div>
            <div class="invoice-details">
              <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Customer:</strong> ${invoice.customerName}</p>
              <p><strong>Date:</strong> ${format(new Date(invoice.date), 'PP')}</p>
              <p><strong>Amount:</strong> $${invoice.amount.toFixed(2)}</p>
              <p><strong>Outstanding:</strong> $${(invoice.amount - (invoice.amountPaid || 0)).toFixed(2)}</p>
              <p><strong>Status:</strong> ${invoice.status}</p>
            </div>
            ${invoice.items && invoice.items.length > 0 ? `
              <div class="items">
                <h3>Items</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${invoice.items.map(item => `
                      <tr>
                        <td>${item.productName}</td>
                        <td>${item.quantity}</td>
                        <td>$${item.unitPrice.toFixed(2)}</td>
                        <td>$${item.total.toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Export selected invoices as individual PDFs
  const exportSelectedAsPDF = () => {
    if (selectedInvoices.length === 0) {
      alert('Please select invoices to export');
      return;
    }

    const selectedInvoiceData = invoices.filter(invoice => selectedInvoices.includes(invoice.id));
    
    // Export each selected invoice as a separate PDF
    selectedInvoiceData.forEach((invoice, index) => {
      setTimeout(() => {
        exportInvoiceToPDF(invoice);
      }, index * 500); // Delay between each PDF to avoid browser issues
    });

    alert(`Exporting ${selectedInvoices.length} invoice(s) as PDFs...`);
  };

  // Delete selected invoices (move to recycle bin)
  const deleteSelectedInvoices = () => {
    if (selectedInvoices.length === 0) {
      alert('Please select invoices to delete');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedInvoices.length} selected invoice(s)? They will be moved to the recycle bin for 30 days.`
    );

    if (confirmDelete) {
      // Move selected invoices to recycle bin with deletion timestamp
      const invoicesToDelete = invoices.filter(invoice => selectedInvoices.includes(invoice.id));
      const deletedWithTimestamp = invoicesToDelete.map(invoice => ({
        ...invoice,
        deletedAt: new Date().toISOString()
      }));
      
      setDeletedInvoices(prev => [...prev, ...deletedWithTimestamp]);
      
      // Update the invoices state (this would normally involve an API call)
      alert(`Successfully moved ${selectedInvoices.length} invoice(s) to recycle bin`);
      
      // Clear selected invoices
      setSelectedInvoices([]);
      setSelectAll(false);
    }
  };

  // Recycle bin functions
  const restoreInvoice = (invoiceId: number) => {
    const invoiceToRestore = deletedInvoices.find(inv => inv.id === invoiceId);
    if (invoiceToRestore) {
      setDeletedInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      alert('Invoice restored successfully');
    }
  };

  const permanentlyDeleteInvoice = (invoiceId: number) => {
    if (confirm('Are you sure you want to permanently delete this invoice? This action cannot be undone.')) {
      setDeletedInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      alert('Invoice permanently deleted');
    }
  };

  const clearExpiredInvoices = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const expiredCount = deletedInvoices.filter(inv => 
      new Date(inv.deletedAt) < thirtyDaysAgo
    ).length;
    
    if (expiredCount > 0) {
      setDeletedInvoices(prev => prev.filter(inv => 
        new Date(inv.deletedAt) >= thirtyDaysAgo
      ));
      alert(`${expiredCount} expired invoice(s) permanently removed`);
    } else {
      alert('No expired invoices to remove');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Invoice History</h1>
          <p className="text-muted-foreground">View and manage all your invoices</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowRecycleBin(true)}
            className="bg-gray-50 text-gray-700 hover:bg-gray-100"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Recycle Bin 
            {deletedInvoices.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {deletedInvoices.length}
              </span>
            )}
          </Button>
          <Button onClick={() => window.location.href = '/create-invoice'}>
            <FileText className="mr-2 h-4 w-4" />
            Create New Invoice
          </Button>
        </div>
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoice List</CardTitle>
              <CardDescription>
                Showing {filteredInvoices.length} invoices
                {selectedInvoices.length > 0 && (
                  <span className="ml-2 text-blue-600 font-medium">
                    ({selectedInvoices.length} selected)
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedInvoices.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteSelectedInvoices()}
                  className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedInvoices.length})
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-green-50 text-green-700 hover:bg-green-100"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportSelectedAsPDF()}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Selected as PDFs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportInvoicesToCSV(filteredInvoices)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export All as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
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
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all invoices"
                        />
                      </TableHead>
                      <TableHead className="min-w-[120px]">Invoice #</TableHead>
                      <TableHead className="min-w-[120px]">Paper Inv. No.</TableHead>
                      <TableHead className="min-w-[120px]">ETA #</TableHead>
                      <TableHead className="min-w-[180px]">Customer</TableHead>
                      <TableHead className="min-w-[120px]">Date</TableHead>
                      <TableHead className="min-w-[120px]">Amount</TableHead>
                      <TableHead className="min-w-[120px]">Outstanding</TableHead>
                      <TableHead className="min-w-[150px]">Payment Method</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[100px]">ETA Upload</TableHead>
                      <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="hover:bg-gray-50">
                        <TableCell>
                          <Checkbox
                            checked={selectedInvoices.includes(invoice.id)}
                            onCheckedChange={(checked) => handleSelectInvoice(invoice.id, checked as boolean)}
                            aria-label={`Select invoice ${invoice.invoiceNumber}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell className="font-medium text-gray-700">
                          {`P-${invoice.invoiceNumber?.slice(-6) || '000001'}`}
                        </TableCell>
                        <TableCell className="font-medium text-blue-600">
                          {invoice.etaReference || (
                            <span className="text-gray-400 font-normal">Not uploaded</span>
                          )}
                        </TableCell>
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
                        <TableCell>{getETAStatus(invoice)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!invoice.etaUploaded && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => uploadToETA(invoice.id)}
                                className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                              >
                                Upload to ETA
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handlePreview(invoice)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Invoice
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportInvoiceToPDF(invoice)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download PDF
                                </DropdownMenuItem>
                                {(invoice.status === 'unpaid' || invoice.status === 'partial' || invoice.status === 'overdue') && (
                                  <DropdownMenuItem onClick={() => handlePaymentFulfillment(invoice)}>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Pay Balance
                                  </DropdownMenuItem>
                                )}
                                {(invoice.status === 'paid' || invoice.status === 'partial') && (
                                  <DropdownMenuItem 
                                    onClick={() => handleRefund(invoice)}
                                    className="text-red-600"
                                  >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Process Refund
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={`min-w-[40px] ${
                  currentPage === page 
                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                    : "hover:bg-gray-100"
                }`}
              >
                {page}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Pagination Info */}
      {filteredInvoices.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(endIndex, filteredInvoices.length)} of {filteredInvoices.length} invoices
        </div>
      )}

      {/* Invoice Preview Dialog */}
      {selectedInvoice && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice #{selectedInvoice.invoiceNumber}</DialogTitle>
              <DialogDescription>
                <div className="flex items-center justify-between">
                  <span>{format(new Date(selectedInvoice.date), 'PPP')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">ETA Status:</span>
                    {getETAStatus(selectedInvoice)}
                    {selectedInvoice.etaReference && (
                      <span className="text-xs text-muted-foreground">
                        Ref: {selectedInvoice.etaReference}
                      </span>
                    )}
                  </div>
                </div>
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
                  <div className="space-y-1">
                    <p className="font-medium">{selectedInvoice.customerName}</p>
                    <p className="text-sm text-slate-600">Mobile: +1 (555) 123-4567</p>
                    <p className="text-sm text-slate-600">Email: {selectedInvoice.customerName.toLowerCase().replace(/\s+/g, '.')}@pharmacare.com</p>
                    <p className="text-sm text-blue-600 font-medium">Tax Number: ETA-{Math.floor(Math.random() * 100000000)}</p>
                    <p className="text-xs text-slate-500">Egyptian Tax Authority Registration</p>
                  </div>
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
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => downloadDocument(`Invoice_Receipt_${selectedInvoice.invoiceNumber}.pdf`, 'pdf')}
                        >
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
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => downloadDocument(`Product_Certificate_${selectedInvoice.customerName.replace(/\s+/g, '_')}.jpg`, 'jpg')}
                        >
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
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => downloadDocument(`Shipping_Label_${selectedInvoice.invoiceNumber}.pdf`, 'pdf')}
                        >
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
              <Button variant="outline" onClick={downloadInvoicePDF}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  const customerEmail = selectedInvoice.customerName.toLowerCase().replace(/\s+/g, '.') + '@pharmacare.com';
                  const subject = `Invoice ${selectedInvoice.invoiceNumber} - PharmaOverseas`;
                  const body = `Dear ${selectedInvoice.customerName},

Please find attached your invoice ${selectedInvoice.invoiceNumber} for $${selectedInvoice.amount.toFixed(2)}.

Invoice Details:
- Invoice Number: ${selectedInvoice.invoiceNumber}
- Date: ${format(new Date(selectedInvoice.date), 'PP')}
- Amount: $${selectedInvoice.amount.toFixed(2)}
- Status: ${selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}

If you have any questions, please don't hesitate to contact us.

Best regards,
PharmaOverseas Team`;
                  
                  const mailtoUrl = `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  window.location.href = mailtoUrl;
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </Button>
              <Button 
                variant="default" 
                onClick={() => {
                  const phoneNumber = "+15551234567"; // Customer's phone from invoice
                  const message = `Hello ${selectedInvoice.customerName}! Your invoice ${selectedInvoice.invoiceNumber} for $${selectedInvoice.amount.toFixed(2)} is ready. Please find the details attached. Thank you for your business!`;
                  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Send to WhatsApp
              </Button>

            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              {invoiceToUpdate && (
                <div className="space-y-2 mt-2">
                  <p>Invoice: <span className="font-medium">{invoiceToUpdate.invoiceNumber}</span></p>
                  <p>Customer: <span className="font-medium">{invoiceToUpdate.customerName}</span></p>
                  <p>Total Amount: <span className="font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(invoiceToUpdate.amount)}
                  </span></p>
                  <p>Amount Paid: <span className="font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(invoiceToUpdate.amountPaid || 0)}
                  </span></p>
                  <p>Outstanding Balance: <span className="font-medium text-red-600">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(invoiceToUpdate.amount - (invoiceToUpdate.amountPaid || 0))}
                  </span></p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Payment Amount</label>
              <Input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter payment amount"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the amount being paid towards this invoice
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={processPayment}
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              Process Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recycle Bin Dialog */}
      <Dialog open={showRecycleBin} onOpenChange={setShowRecycleBin}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Recycle Bin
            </DialogTitle>
            <DialogDescription>
              Deleted invoices are kept here for 30 days. You can restore them or permanently delete them.
              {deletedInvoices.length > 0 && (
                <span className="block text-sm text-blue-600 mt-1">
                  {deletedInvoices.length} invoice(s) in recycle bin
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {deletedInvoices.length === 0 ? (
              <div className="text-center py-8">
                <Trash2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">Recycle bin is empty</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Deleted invoices will appear here for 30 days
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Items are permanently deleted after 30 days
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearExpiredInvoices}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Expired
                  </Button>
                </div>
                
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Deleted</TableHead>
                        <TableHead>Days Remaining</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deletedInvoices.map((invoice) => {
                        const deletedDate = new Date(invoice.deletedAt);
                        const daysSinceDeleted = Math.floor((new Date().getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
                        const daysRemaining = Math.max(0, 30 - daysSinceDeleted);
                        
                        return (
                          <TableRow key={invoice.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                            <TableCell>{invoice.customerName}</TableCell>
                            <TableCell>
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD'
                              }).format(invoice.amount)}
                            </TableCell>
                            <TableCell>{format(deletedDate, 'PP')}</TableCell>
                            <TableCell>
                              <span className={`text-sm ${daysRemaining <= 7 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                {daysRemaining} days
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => restoreInvoice(invoice.id)}
                                  className="bg-green-50 text-green-700 hover:bg-green-100"
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Restore
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => permanentlyDeleteInvoice(invoice.id)}
                                  className="bg-red-50 text-red-600 hover:bg-red-100"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Forever
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecycleBin(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-red-600" />
              Process Refund
            </DialogTitle>
            <DialogDescription>
              Process a refund for the selected invoice. This action will create a refund entry in the accounting system.
            </DialogDescription>
          </DialogHeader>
          
          {refundInvoice && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Invoice:</span>
                    <span className="text-sm">{refundInvoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Customer:</span>
                    <span className="text-sm">{refundInvoice.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Amount:</span>
                    <span className="text-sm">${refundInvoice.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Amount Paid:</span>
                    <span className="text-sm">${(refundInvoice.amountPaid || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="refundAmount" className="text-sm font-medium">Refund Amount</label>
                <input
                  id="refundAmount"
                  type="number"
                  placeholder="0.00"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="refundReason" className="text-sm font-medium">Reason for Refund *</label>
                <textarea
                  id="refundReason"
                  placeholder="Please provide a reason for this refund..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRefundDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={processRefund} className="bg-red-600 hover:bg-red-700 text-white">
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceHistory;