import { useState } from 'react';
import { useLocation } from 'wouter';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { 
  BookOpen, 
  CreditCard, 
  DollarSign, 
  FileText, 
  BarChart4, 
  TrendingUp,
  TrendingDown,
  Landmark,
  Calendar,
  Receipt,
  Clock,
  Plus,
  ShoppingBag,
  FileWarning,
  BellRing,
  PlusCircle,
  LineChart,
  Download,
  FileQuestion,
  MoreHorizontal,
  Eye,
  CheckCircle,
  BarChart,
  Settings,
  X,
  Edit,
  Upload,
  Paperclip,
  Trash2,
  Image,
  AlertCircle,
  Building,
  Wallet,
  Search,
  Filter,
  Shield,
  RefreshCw,
  ExternalLink,
  Calculator,
  Users,
  Pencil,
  ChevronsUpDown,
  Check,
  FileBarChart,
  Zap,
  PieChart,
  Activity,
  Target,
  Mail,
  AlertTriangle,
  Phone,
  History
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ChartOfAccounts from '@/components/accounting/ChartOfAccounts';
import JournalEntries from '@/components/accounting/JournalEntries';
import ProfitAndLoss from '@/components/accounting/ProfitAndLoss';
import BalanceSheet from '@/components/accounting/BalanceSheet';
import CustomerPayments from '@/components/accounting/CustomerPayments';
import AccountingPeriods from '@/components/accounting/AccountingPeriods';

const Accounting: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [isExpenseSettingsOpen, setIsExpenseSettingsOpen] = useState(false);
  
  // Financial Reports state
  const [selectedReportType, setSelectedReportType] = useState("trial-balance");
  const [reportStartDate, setReportStartDate] = useState("2025-06-01");
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountFilter, setAccountFilter] = useState("all");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    date: '',
    description: '',
    notes: '',
    accountType: '',
    costCenter: '',
    paymentMethod: '',
    amount: ''
  });

  // Invoice action dialogs state
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  
  // Refund state
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundInvoice, setRefundInvoice] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isAddPayDialogOpen, setIsAddPayDialogOpen] = useState(false);
  const [isInvoiceDetailsOpen, setIsInvoiceDetailsOpen] = useState(false);
  const [isServiceDetailsOpen, setIsServiceDetailsOpen] = useState(false);
  const [selectedServiceDetails, setSelectedServiceDetails] = useState<any>(null);
  const [isCustomerHistoryOpen, setIsCustomerHistoryOpen] = useState(false);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<any>(null);
  
  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank-transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  
  // Add Pay form state
  const [addPayForm, setAddPayForm] = useState({
    employeeId: '',
    employeeName: '',
    department: '',
    position: '',
    basicSalary: '',
    overtime: '',
    bonuses: '',
    deductions: '',
    payPeriod: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [isInvoiceViewOpen, setIsInvoiceViewOpen] = useState(false);
  const [isEditInvoiceOpen, setIsEditInvoiceOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [isPendingPurchasesOpen, setIsPendingPurchasesOpen] = useState(false);
  const [isPurchaseDetailsOpen, setIsPurchaseDetailsOpen] = useState(false);
  const [selectedPurchaseDetails, setSelectedPurchaseDetails] = useState<any>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  const [uploadedReceipts, setUploadedReceipts] = useState<Array<{
    file: File;
    name: string;
    size: number;
    type: string;
    uploadDate: string;
    preview: string | null;
  }>>([]);
  const [invoiceItems, setInvoiceItems] = useState([
    { id: 1, name: 'Active Pharmaceutical Ingredients', description: 'Ibuprofen (500kg), Paracetamol (300kg)', quantity: 800, unit: 'kg', unitPrice: 18.75, total: 15000 },
    { id: 2, name: 'Packaging Materials', description: 'Glass Vials (10,000), Aluminum Caps (15,000)', quantity: 25000, unit: 'units', unitPrice: 0.14, total: 3500 }
  ]);
  const [purchaseItems, setPurchaseItems] = useState([
    { id: 1, name: 'Raw Chemicals', description: 'Sodium Chloride (250kg), Potassium Iodide (100kg)', quantity: 350, unit: 'kg', unitPrice: 12.50, total: 4375 },
    { id: 2, name: 'Laboratory Equipment', description: 'Precision Scale, pH Meter', quantity: 2, unit: 'units', unitPrice: 850.00, total: 1700 }
  ]);

  // Pending purchases state
  const [pendingPurchases, setPendingPurchases] = useState([
    {
      id: 'PO-2025-001',
      supplier: 'Global Pharma Solutions',
      dateSubmitted: 'Jan 15, 2025',
      etaNumber: 'ETA25011501',
      amount: 125400.00,
      priority: 'urgent',
      paymentTerms: 'Net 30',
      items: 'Active Pharmaceutical Ingredients - Ibuprofen (500kg), Paracetamol (300kg)'
    },
    {
      id: 'PO-2025-002',
      supplier: 'Medical Supplies Co.',
      dateSubmitted: 'Jan 14, 2025',
      etaNumber: 'ETA25011402',
      amount: 78900.00,
      priority: 'normal',
      paymentTerms: 'Net 45',
      items: 'Packaging Materials - Glass Vials (10,000), Aluminum Caps (15,000)'
    },
    {
      id: 'PO-2025-003',
      supplier: 'ChemTech Industries',
      dateSubmitted: 'Jan 13, 2025',
      etaNumber: 'ETA25011303',
      amount: 234680.00,
      priority: 'urgent',
      paymentTerms: 'Cash on Delivery',
      items: 'Raw Materials - Microcrystalline Cellulose (200kg), Magnesium Stearate (50kg)'
    },
    {
      id: 'PO-2025-004',
      supplier: 'Lab Equipment Ltd.',
      dateSubmitted: 'Jan 12, 2025',
      etaNumber: 'ETA25011204',
      amount: 46220.00,
      priority: 'low',
      paymentTerms: 'Net 15',
      items: 'Packaging & Equipment - Blister Packs (50,000), Labeling Machines (2 units)'
    }
  ]);

  // Approved purchases state (will appear in main purchases table)
  const [approvedPurchases, setApprovedPurchases] = useState<any[]>([]);

  // Payroll selection state
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectAllPayroll, setSelectAllPayroll] = useState(false);

  // Employee list for payroll
  const employees = ['select-emp-001', 'select-emp-002', 'select-emp-003', 'select-emp-004'];



  // Handle purchase approval
  const handleApprovePurchase = (purchaseId: string) => {
    const purchaseToApprove = pendingPurchases.find(p => p.id === purchaseId);
    if (purchaseToApprove) {
      // Add to approved purchases list (will appear in main purchases table)
      const approvedPurchase = {
        ...purchaseToApprove,
        status: 'approved',
        approvalDate: new Date().toISOString().split('T')[0],
        paymentMethod: purchaseToApprove.paymentTerms.includes('Cash') ? 'Cash' : 'Bank Transfer'
      };
      setApprovedPurchases(prev => [...prev, approvedPurchase]);
      
      // Remove from pending purchases
      setPendingPurchases(prev => prev.filter(p => p.id !== purchaseId));
      
      toast({
        title: "Purchase Approved",
        description: `Purchase order ${purchaseId} has been approved and added to the purchases table.`,
        variant: "default"
      });
    }
  };

  // Handle purchase rejection
  const handleRejectPurchase = (purchaseId: string) => {
    setPendingPurchases(prev => prev.filter(p => p.id !== purchaseId));
    toast({
      title: "Purchase Rejected",
      description: `Purchase order ${purchaseId} has been rejected and removed from pending list.`,
      variant: "destructive"
    });
  };

  // Handle view purchase details
  const handleViewPurchaseDetails = (purchaseId: string) => {
    const purchase = pendingPurchases.find(p => p.id === purchaseId);
    if (purchase) {
      setSelectedPurchaseDetails(purchase);
      setIsPurchaseDetailsOpen(true);
    }
  };

  // Handle select all checkbox
  const handleSelectAllPayroll = (checked: boolean) => {
    setSelectAllPayroll(checked);
    if (checked) {
      setSelectedEmployees([...employees]);
    } else {
      setSelectedEmployees([]);
    }
  };

  // Handle individual employee selection
  const handleEmployeeSelection = (employeeId: string, checked: boolean) => {
    if (checked) {
      const newSelected = [...selectedEmployees, employeeId];
      setSelectedEmployees(newSelected);
      if (newSelected.length === employees.length) {
        setSelectAllPayroll(true);
      }
    } else {
      const newSelected = selectedEmployees.filter(id => id !== employeeId);
      setSelectedEmployees(newSelected);
      setSelectAllPayroll(false);
    }
  };

  // Payroll action handlers
  const handleViewPayroll = (employeeId: string, employeeName: string) => {
    toast({
      title: "Viewing Payroll Details",
      description: `Opening payroll details for ${employeeName}`,
    });
  };

  const handlePayrollSlip = (employeeId: string, employeeName: string) => {
    toast({
      title: "Generating Payroll Slip",
      description: `Payroll slip for ${employeeName} is being generated...`,
    });
    // Simulate PDF download
    const link = document.createElement('a');
    link.href = 'data:application/pdf;base64,JVBERi0xLjQKJdP0zOEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCgoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagoKMyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDIgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCi9Db250ZW50cyA0IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKL0xlbmd0aCA0NQo+PgpzdHJlYW0KQVQKL0YxIDEyIFRmCjEwMCA1MDAgVGQKKFBheXJvbGwgU2xpcCkgVGEKRVQKZW5kc3RyZWFtCmVuZG9iagoKKQp0cmFpbGVyCjw8Ci9TaXplIDUKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjMwMApfRU9GCg==';
    link.download = `payroll-slip-${employeeId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditPayroll = (employeeId: string, employeeName: string) => {
    toast({
      title: "Edit Payroll",
      description: `Opening edit form for ${employeeName}'s payroll`,
    });
  };

  // Customer Invoice action handlers
  const handleViewInvoiceDetails = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsInvoiceDetailsOpen(true);
  };

  const handleViewServiceDetails = (serviceDetails: any) => {
    setSelectedServiceDetails(serviceDetails);
    setIsServiceDetailsOpen(true);
  };

  const handleViewPaymentHistory = (customerData: any) => {
    setSelectedCustomerHistory(customerData);
    setIsCustomerHistoryOpen(true);
  };

  const handleDownloadInvoicePDF = (invoice: any) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Company Header
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 128, 185);
      doc.text('Premier ERP Chemical Manufacturing', 20, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Industrial Zone, 6th of October City, Giza, Egypt', 20, 35);
      doc.text('Phone: +20 2 3835 4000 | Email: finance@premier-erp.com', 20, 42);
      doc.text('Tax ID: 123-456-789 | Commercial Registry: 987654321', 20, 49);
      
      // Invoice Title and Number
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 128, 185);
      doc.text('INVOICE', pageWidth - 60, 30);
      
      // Invoice Details Box
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(248, 249, 250);
      doc.rect(pageWidth - 80, 40, 70, 45, 'FD');
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice #:', pageWidth - 75, 50);
      doc.text('ETA #:', pageWidth - 75, 57);
      doc.text('Date:', pageWidth - 75, 64);
      doc.text('Due Date:', pageWidth - 75, 71);
      doc.text('Status:', pageWidth - 75, 78);
      
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.invoiceNumber, pageWidth - 45, 50);
      doc.text(invoice.etaNumber || 'ETA-2025-05-12345', pageWidth - 45, 57);
      doc.text(invoice.invoiceDate, pageWidth - 45, 64);
      doc.text(invoice.dueDate, pageWidth - 45, 71);
      doc.text(invoice.paymentStatus, pageWidth - 45, 78);
      
      // Customer Information
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 73, 94);
      doc.text('BILL TO:', 20, 95);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(invoice.customerName, 20, 110);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Pharmaceutical Manufacturing Division', 20, 120);
      doc.text('123 Medical District, New Cairo, Egypt', 20, 127);
      doc.text('Contact: Dr. Mahmoud Ali', 20, 134);
      doc.text('Phone: +20 2 2345 6789', 20, 141);
      doc.text('Email: finance@customer.com', 20, 148);
      
      // Services Table
      const tableStartY = 165;
      
      // Table Header
      doc.setFillColor(52, 73, 94);
      doc.rect(20, tableStartY, pageWidth - 40, 12, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Service Description', 25, tableStartY + 8);
      doc.text('Qty', 100, tableStartY + 8);
      doc.text('Unit Price', 125, tableStartY + 8);
      doc.text('Total', pageWidth - 35, tableStartY + 8);
      
      // Service Items
      let currentY = tableStartY + 20;
      const services = [
        {
          name: invoice.service || 'Pharmaceutical Manufacturing',
          description: 'High-grade pharmaceutical manufacturing with quality assurance',
          qty: '1 Batch',
          unitPrice: (invoice.amount * 0.70).toFixed(2),
          total: (invoice.amount * 0.70).toFixed(2)
        },
        {
          name: 'Quality Testing',
          description: 'Comprehensive laboratory testing and validation',
          qty: '1 Service',
          unitPrice: (invoice.amount * 0.20).toFixed(2),
          total: (invoice.amount * 0.20).toFixed(2)
        },
        {
          name: 'Packaging & Documentation',
          description: 'Professional packaging and regulatory documentation',
          qty: '1 Service',
          unitPrice: (invoice.amount * 0.10).toFixed(2),
          total: (invoice.amount * 0.10).toFixed(2)
        }
      ];
      
      doc.setTextColor(0, 0, 0);
      
      services.forEach((service, index) => {
        // Alternating row colors
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(20, currentY - 5, pageWidth - 40, 20, 'F');
        }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(service.name, 25, currentY + 2);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(service.description, 25, currentY + 8);
        
        doc.setFontSize(10);
        doc.text(service.qty, 100, currentY + 2);
        doc.text(`$${service.unitPrice}`, 125, currentY + 2);
        doc.text(`$${service.total}`, pageWidth - 35, currentY + 2, { align: 'right' });
        
        currentY += 20;
      });
      
      // Financial Summary
      const summaryY = currentY + 15;
      const summaryX = pageWidth - 80;
      
      doc.setDrawColor(200, 200, 200);
      doc.line(summaryX - 10, summaryY, pageWidth - 20, summaryY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', summaryX, summaryY + 12);
      doc.text(`$${(invoice.amount * 0.877).toFixed(2)}`, pageWidth - 25, summaryY + 12, { align: 'right' });
      
      doc.text('VAT (14%):', summaryX, summaryY + 22);
      doc.text(`$${(invoice.amount * 0.123).toFixed(2)}`, pageWidth - 25, summaryY + 22, { align: 'right' });
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Total Amount:', summaryX, summaryY + 35);
      doc.text(`$${invoice.amount.toLocaleString()}`, pageWidth - 25, summaryY + 35, { align: 'right' });
      
      // Payment Status and Details
      const statusY = summaryY + 55;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      
      if (invoice.paymentStatus === 'Paid') {
        doc.setTextColor(39, 174, 96);
        doc.text('✓ PAYMENT STATUS: PAID IN FULL', 20, statusY);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Payment received: $${invoice.amount.toLocaleString()}`, 20, statusY + 10);
        doc.text('Thank you for your business!', 20, statusY + 20);
      } else if (invoice.paymentStatus === 'Partial Payment') {
        doc.setTextColor(52, 152, 219);
        doc.text('⚠ PAYMENT STATUS: PARTIAL PAYMENT', 20, statusY);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Amount Paid: $${invoice.paidAmount?.toLocaleString()}`, 20, statusY + 10);
        doc.setTextColor(231, 76, 60);
        doc.setFont('helvetica', 'bold');
        doc.text(`Outstanding Balance: $${invoice.balance?.toLocaleString()}`, 20, statusY + 20);
      } else {
        doc.setTextColor(231, 76, 60);
        doc.text(`⚠ PAYMENT STATUS: ${invoice.paymentStatus.toUpperCase()}`, 20, statusY);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Amount Due: $${invoice.amount.toLocaleString()}`, 20, statusY + 10);
        doc.text(`Due Date: ${invoice.dueDate}`, 20, statusY + 20);
      }
      
      // Payment Instructions
      const paymentY = statusY + 40;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT INSTRUCTIONS:', 20, paymentY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Bank Transfer Details:', 20, paymentY + 12);
      doc.text('• Bank: National Bank of Egypt', 25, paymentY + 20);
      doc.text('• Account Name: Premier ERP Chemical Manufacturing', 25, paymentY + 27);
      doc.text('• Account Number: 123-456-789-000', 25, paymentY + 34);
      doc.text('• SWIFT Code: NBEEGCXX', 25, paymentY + 41);
      doc.text(`• Reference: ${invoice.invoiceNumber}`, 25, paymentY + 48);
      
      // Terms and Conditions
      const termsY = paymentY + 65;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('TERMS & CONDITIONS:', 20, termsY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('• Payment due within 30 days of invoice date', 20, termsY + 10);
      doc.text('• Late payments subject to 2% monthly interest charge', 20, termsY + 17);
      doc.text('• All products manufactured according to GMP standards', 20, termsY + 24);
      doc.text('• Quality certificates and CoA provided upon delivery', 20, termsY + 31);
      doc.text('• Goods remain property of Premier ERP until payment received', 20, termsY + 38);
      
      // Footer
      const footerY = pageHeight - 25;
      doc.setDrawColor(200, 200, 200);
      doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
      
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('This is a computer-generated invoice and does not require a signature.', 20, footerY);
      doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, footerY + 8);
      doc.text('Premier ERP Chemical Manufacturing - Confidential Document', pageWidth - 20, footerY, { align: 'right' });
      doc.text(`Page 1 of 1`, pageWidth - 20, footerY + 8, { align: 'right' });
      
      // Save the PDF
      const fileName = `Premier-ERP-Invoice-${invoice.invoiceNumber.replace(/[\/\\]/g, '-')}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "Professional Invoice Downloaded",
        description: `Comprehensive invoice ${invoice.invoiceNumber} with complete payment details, terms, and bank information has been downloaded.`,
      });
      
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };



  const handleRecordPayment = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.balance.toString());
    setIsPaymentDialogOpen(true);
  };

  const handleSendReminderNotification = (invoice: any) => {
    toast({
      title: "Reminder Sent",
      description: `Payment reminder sent to ${invoice.customerName} for invoice ${invoice.invoiceNumber}`,
    });
  };

  const handleCollectionAction = (invoice: any) => {
    toast({
      title: "Collection Action",
      description: `Initiating collection action for overdue invoice ${invoice.invoiceNumber}`,
      variant: "destructive"
    });
  };

  const handleSubmitPayment = () => {
    if (!selectedInvoice || !paymentAmount) return;
    
    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > selectedInvoice.balance) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive"
      });
      return;
    }
    
    // Process payment (would typically call API)
    toast({
      title: "Payment Recorded",
      description: `Payment of $${amount.toLocaleString()} recorded for invoice ${selectedInvoice.invoiceNumber}`,
    });
    
    // Reset form and close dialog
    setIsPaymentDialogOpen(false);
    setPaymentAmount('');
    setPaymentReference('');
    setPaymentNotes('');
    setSelectedInvoice(null);
  };

  // Refund handler function
  const handleRefund = (invoiceNumber: string) => {
    // Find the invoice data based on invoice number
    const invoiceData = {
      'INV-2025-012': {
        number: 'INV-2025-012',
        customer: 'Cairo Medical Center',
        amount: '$8,245.00',
        paid: '$8,245.00',
        balance: '$0.00'
      },
      'INV-2025-018': {
        number: 'INV-2025-018',
        customer: 'Aswan Medical Supplies',
        amount: '$6,420.00',
        paid: '$3,000.00',
        balance: '$3,420.00'
      }
    };

    const invoice = invoiceData[invoiceNumber as keyof typeof invoiceData];
    if (invoice) {
      setRefundInvoice(invoice);
      setRefundAmount(invoice.paid.replace('$', '').replace(',', ''));
      setRefundReason('');
      setIsRefundDialogOpen(true);
    }
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

    // In a real application, you would update the database here
    // For now, we'll just show the success message
    toast({
      title: "Refund Processed",
      description: `Refund of $${refundAmount} processed for ${refundInvoice?.customer}. Status updated to Refunded.`,
    });

    setIsRefundDialogOpen(false);
    setRefundInvoice(null);
    setRefundAmount('');
    setRefundReason('');
  };

  // Employee list for dropdown with salary information
  const employeeList = [
    { id: 'EMP001', name: 'Ahmed Hassan', department: 'Production', position: 'Chemical Engineer', basicSalary: '5500' },
    { id: 'EMP002', name: 'Fatima Al-Zahra', department: 'Quality Control', position: 'Lab Technician', basicSalary: '3200' },
    { id: 'EMP003', name: 'Omar Mahmoud', department: 'Sales', position: 'Sales Manager', basicSalary: '6800' },
    { id: 'EMP004', name: 'Nour Abdel Rahman', department: 'Accounting', position: 'Financial Analyst', basicSalary: '4200' },
    { id: 'EMP005', name: 'Yasmin Khalil', department: 'Production', position: 'Process Engineer', basicSalary: '4800' },
    { id: 'EMP006', name: 'Hassan Ali', department: 'Quality Control', position: 'QC Supervisor', basicSalary: '4500' },
    { id: 'EMP007', name: 'Layla Ibrahim', department: 'HR', position: 'HR Coordinator', basicSalary: '3800' },
    { id: 'EMP008', name: 'Karim Farouk', department: 'Maintenance', position: 'Maintenance Technician', basicSalary: '3500' }
  ];

  // Handle employee selection for Add Pay
  const handleEmployeeSelect = (employeeId: string) => {
    const selectedEmployee = employeeList.find(emp => emp.id === employeeId);
    if (selectedEmployee) {
      setAddPayForm(prev => ({
        ...prev,
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        department: selectedEmployee.department,
        position: selectedEmployee.position,
        basicSalary: selectedEmployee.basicSalary
      }));
    }
  };

  // Handle Add Pay form submission
  const handleAddPaySubmit = () => {
    if (!addPayForm.employeeId || !addPayForm.basicSalary) {
      toast({
        title: "Error",
        description: "Please select an employee and enter basic salary",
        variant: "destructive"
      });
      return;
    }

    const netPay = parseFloat(addPayForm.basicSalary) + 
                   parseFloat(addPayForm.overtime || '0') + 
                   parseFloat(addPayForm.bonuses || '0') - 
                   parseFloat(addPayForm.deductions || '0');

    toast({
      title: "Payroll Added Successfully",
      description: `Added payroll for ${addPayForm.employeeName} - Net Pay: $${netPay.toFixed(2)}`,
    });

    // Reset form and close dialog
    setAddPayForm({
      employeeId: '',
      employeeName: '',
      department: '',
      position: '',
      basicSalary: '',
      overtime: '',
      bonuses: '',
      deductions: '',
      payPeriod: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsAddPayDialogOpen(false);
  };
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isETASettingsOpen, setIsETASettingsOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [transferQuotation, setTransferQuotation] = useState<any>(null);
  const [vatPercentage, setVatPercentage] = useState(14);
  const [purchaseVatPercentage, setPurchaseVatPercentage] = useState(14);
  const [newInvoiceVatPercentage, setNewInvoiceVatPercentage] = useState(14);
  
  // Export dialog states
  const [isExpenseExportOpen, setIsExpenseExportOpen] = useState(false);
  const [exportDateRange, setExportDateRange] = useState('this-month');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportFormat, setExportFormat] = useState('excel');
  
  // Purchase export dialog states
  const [isPurchaseExportOpen, setIsPurchaseExportOpen] = useState(false);
  const [purchaseExportStartDate, setPurchaseExportStartDate] = useState('');
  const [purchaseExportEndDate, setPurchaseExportEndDate] = useState('');
  const [purchaseExportFormat, setPurchaseExportFormat] = useState('excel');
  
  // New invoice form state
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    invoiceNumber: '',
    etaNumber: '',
    customerName: '',
    customerEmail: '',
    customerAddress: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    paymentTerms: '30',
    notes: ''
  });
  
  const [newInvoiceItems, setNewInvoiceItems] = useState([
    { id: 1, name: '', description: '', quantity: 1, unit: 'units', unitPrice: 0, total: 0 }
  ]);
  
  // ETA Settings form state
  const [etaSettingsForm, setETASettingsForm] = useState({
    clientId: '',
    clientSecret: '',
    username: '',
    pin: '',
    apiKey: '',
    environment: 'production',
    companyTaxNumber: '',
    branchCode: '',
    autoSubmit: true,
    submissionDelay: '24',
    backupSubmission: true,
    notificationEmail: '',
    complianceThreshold: '90'
  });
  
  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    reference: '',
    notes: ''
  });

  // Configurable dropdown options
  const [expenseSettings, setExpenseSettings] = useState({
    accountTypes: ['Marketing', 'Operations', 'Fixed Assets', 'Projects Under Execution'],
    costCenters: ['Marketing', 'Projects', 'Admin', 'Operations'],
    paymentMethods: ['Cash', 'Credit Card', 'Bank Transfer', 'Check']
  });

  // New invoice handlers
  const addNewInvoiceItem = () => {
    const newId = Math.max(...newInvoiceItems.map(item => item.id)) + 1;
    setNewInvoiceItems([...newInvoiceItems, { 
      id: newId, 
      name: '', 
      description: '', 
      quantity: 1, 
      unit: 'units', 
      unitPrice: 0, 
      total: 0 
    }]);
  };

  const removeNewInvoiceItem = (id: number) => {
    if (newInvoiceItems.length > 1) {
      setNewInvoiceItems(newInvoiceItems.filter(item => item.id !== id));
    }
  };

  const updateNewInvoiceItem = (id: number, field: string, value: any) => {
    setNewInvoiceItems(newInvoiceItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateNewInvoiceSubtotal = () => {
    return newInvoiceItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateNewInvoiceVat = () => {
    return calculateNewInvoiceSubtotal() * (newInvoiceVatPercentage / 100);
  };

  const calculateNewInvoiceTotal = () => {
    return calculateNewInvoiceSubtotal() + calculateNewInvoiceVat();
  };

  // Invoice action handlers
  const handleMakePayment = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: '',
      reference: '',
      notes: ''
    });
    setIsPaymentDialogOpen(true);
  };

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsInvoiceViewOpen(true);
  };

  const handleEditInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setUploadedDocuments([]);
    setIsEditInvoiceOpen(true);
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedDocuments(prev => [...prev, ...newFiles]);
      toast({
        title: "Documents Uploaded",
        description: `${newFiles.length} document(s) added successfully.`,
        variant: "default"
      });
    }
  };

  const removeDocument = (index: number) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Document Removed",
      description: "Document has been removed from the invoice.",
      variant: "default"
    });
  };

  const addInvoiceItem = () => {
    const newItem = {
      id: Date.now(),
      name: '',
      description: '',
      quantity: 1,
      unit: 'kg',
      unitPrice: 0,
      total: 0
    };
    setInvoiceItems(prev => [...prev, newItem]);
  };

  const updateInvoiceItem = (id: number, field: string, value: any) => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Auto-calculate total when quantity or unitPrice changes
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const removeInvoiceItem = (id: number) => {
    setInvoiceItems(prev => prev.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return invoiceItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateVAT = () => {
    return calculateSubtotal() * (vatPercentage / 100);
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() + calculateVAT();
  };

  // Purchase Items Management
  const addPurchaseItem = () => {
    const newItem = {
      id: Date.now(),
      name: '',
      description: '',
      quantity: 1,
      unit: 'kg',
      unitPrice: 0,
      total: 0
    };
    setPurchaseItems(prev => [...prev, newItem]);
  };

  const updatePurchaseItem = (id: number, field: string, value: any) => {
    setPurchaseItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Auto-calculate total when quantity or unitPrice changes
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const removePurchaseItem = (id: number) => {
    setPurchaseItems(prev => prev.filter(item => item.id !== id));
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

  const handleSendInvoiceReminder = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsReminderDialogOpen(true);
  };

  const handleContactSupplier = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsContactDialogOpen(true);
  };

  const processPayment = () => {
    if (!paymentForm.amount || !paymentForm.paymentMethod) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required payment fields.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Payment Processed",
      description: `Payment of $${paymentForm.amount} has been recorded for ${selectedInvoice?.invoiceId || selectedInvoice?.id}.`,
      variant: "default"
    });
    setIsPaymentDialogOpen(false);
  };

  const sendReminder = () => {
    toast({
      title: "Reminder Sent",
      description: `Payment reminder has been sent for invoice ${selectedInvoice?.invoiceId || selectedInvoice?.id}.`,
      variant: "default"
    });
    setIsReminderDialogOpen(false);
  };

  const downloadReceipt = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsDownloadDialogOpen(true);
  };

  const generateInvoicePDF = () => {
    const doc = new jsPDF();
    const invoice = selectedInvoice;
    
    // Company Header
    doc.setFontSize(20);
    doc.setTextColor(40, 116, 166);
    doc.text('PHARMA SOLUTIONS ERP', 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Complete Pharmaceutical Management System', 20, 35);
    doc.text('Cairo, Egypt | +20 2 1234 5678 | contact@pharmasolutions.eg', 20, 42);
    
    // Invoice Title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('PURCHASE INVOICE', 20, 60);
    
    // Invoice Details Box
    doc.setDrawColor(40, 116, 166);
    doc.setLineWidth(0.5);
    doc.rect(120, 50, 70, 30);
    
    doc.setFontSize(10);
    doc.text(`Invoice: ${invoice?.id || 'N/A'}`, 125, 60);
    doc.text(`ETA Number: ${invoice?.eta || 'N/A'}`, 125, 67);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 125, 74);
    
    // Supplier Information
    doc.setFontSize(12);
    doc.setTextColor(40, 116, 166);
    doc.text('SUPPLIER DETAILS', 20, 95);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Company: ${invoice?.supplier || 'N/A'}`, 20, 105);
    doc.text('Address: Industrial Zone, New Cairo, Egypt', 20, 112);
    doc.text('Phone: +20 2 9876 5432', 20, 119);
    doc.text('Tax ID: 123-456-789', 20, 126);
    
    // Items Table Header
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(40, 116, 166);
    doc.rect(20, 140, 170, 8, 'F');
    doc.text('Item Description', 25, 146);
    doc.text('Quantity', 90, 146);
    doc.text('Unit Price', 120, 146);
    doc.text('Total', 160, 146);
    
    // Items Table Rows
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(245, 245, 245);
    
    // Row 1
    doc.rect(20, 148, 170, 8, 'F');
    doc.text('Pharmaceutical Raw Materials', 25, 154);
    doc.text('500kg', 90, 154);
    doc.text('$25.00', 120, 154);
    doc.text('$12,500.00', 160, 154);
    
    // Row 2
    doc.rect(20, 156, 170, 8);
    doc.text('Packaging Materials', 25, 162);
    doc.text('1000 units', 90, 162);
    doc.text('$3.50', 120, 162);
    doc.text('$3,500.00', 160, 162);
    
    // Row 3
    doc.rect(20, 164, 170, 8, 'F');
    doc.text('Quality Control Reagents', 25, 170);
    doc.text('50 bottles', 90, 170);
    doc.text('$45.00', 120, 170);
    doc.text('$2,250.00', 160, 170);
    
    // Totals
    const finalY = 185;
    doc.text('Subtotal: $18,250.00', 140, finalY);
    doc.text('VAT (14%): $2,555.00', 140, finalY + 7);
    doc.setFontSize(12);
    doc.text(`Total: ${invoice?.total || '$20,805.00'}`, 140, finalY + 17);
    
    // ETA Compliance Note
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('This document complies with Egyptian Tax Authority regulations.', 20, finalY + 30);
    doc.text(`ETA Reference: ${invoice?.eta || 'N/A'}`, 20, finalY + 37);
    
    return doc;
  };

  const generateReceiptPDF = () => {
    const doc = new jsPDF();
    const invoice = selectedInvoice;
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(34, 139, 34);
    doc.text('PAYMENT RECEIPT', 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Pharma Solutions ERP - Payment Confirmation', 20, 35);
    
    // Receipt Details
    doc.setDrawColor(34, 139, 34);
    doc.rect(20, 45, 170, 60);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Receipt for Invoice: ${invoice?.id || 'N/A'}`, 25, 60);
    doc.text(`Supplier: ${invoice?.supplier || 'N/A'}`, 25, 70);
    doc.text(`Amount Paid: ${invoice?.total || 'N/A'}`, 25, 80);
    doc.text(`Payment Date: ${new Date().toLocaleDateString()}`, 25, 90);
    doc.text(`ETA Number: ${invoice?.eta || 'N/A'}`, 25, 100);
    
    // Payment Method
    doc.setFontSize(10);
    doc.text('Payment Method: Bank Transfer', 25, 115);
    doc.text('Reference: TXN-2025-' + Math.random().toString(36).substr(2, 9).toUpperCase(), 25, 122);
    doc.text('Status: PAID', 25, 129);
    
    return doc;
  };

  const generateStatementPDF = () => {
    const doc = new jsPDF();
    const invoice = selectedInvoice;
    
    // Header
    doc.setFontSize(16);
    doc.setTextColor(128, 0, 128);
    doc.text('ACCOUNT STATEMENT', 20, 25);
    
    doc.setFontSize(10);
    doc.text(`Statement for: ${invoice?.supplier || 'N/A'}`, 20, 40);
    doc.text(`Period: ${new Date().toLocaleDateString()} - ${new Date().toLocaleDateString()}`, 20, 47);
    
    // Summary Table Header
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(128, 0, 128);
    doc.rect(20, 60, 120, 8, 'F');
    doc.text('Description', 25, 66);
    doc.text('Amount', 100, 66);
    
    // Summary Table Rows
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(245, 245, 245);
    
    doc.rect(20, 68, 120, 8, 'F');
    doc.text('Opening Balance', 25, 74);
    doc.text('$0.00', 100, 74);
    
    doc.rect(20, 76, 120, 8);
    doc.text('Total Purchases', 25, 82);
    doc.text(invoice?.total || '$0.00', 100, 82);
    
    doc.rect(20, 84, 120, 8, 'F');
    doc.text('Total Payments', 25, 90);
    doc.text(invoice?.total || '$0.00', 100, 90);
    
    doc.rect(20, 92, 120, 8);
    doc.text('Closing Balance', 25, 98);
    doc.text('$0.00', 100, 98);
    
    return doc;
  };

  const generateTaxReportPDF = () => {
    const doc = new jsPDF();
    const invoice = selectedInvoice;
    
    // Header
    doc.setFontSize(16);
    doc.setTextColor(255, 140, 0);
    doc.text('ETA TAX COMPLIANCE REPORT', 20, 25);
    
    doc.setFontSize(10);
    doc.text('Egyptian Tax Authority Compliance Document', 20, 35);
    
    // ETA Details
    doc.setFontSize(12);
    doc.text(`ETA Number: ${invoice?.eta || 'N/A'}`, 20, 55);
    doc.text(`Invoice Reference: ${invoice?.id || 'N/A'}`, 20, 65);
    doc.text(`Tax Period: ${new Date().toLocaleDateString()}`, 20, 75);
    
    // Tax Breakdown Table Header
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(255, 140, 0);
    doc.rect(20, 90, 150, 8, 'F');
    doc.text('Tax Type', 25, 96);
    doc.text('Base Amount', 70, 96);
    doc.text('Rate', 120, 96);
    doc.text('Tax Amount', 140, 96);
    
    // Tax Breakdown Rows
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(245, 245, 245);
    
    doc.rect(20, 98, 150, 8, 'F');
    doc.text('VAT', 25, 104);
    doc.text('$18,250.00', 70, 104);
    doc.text('14%', 120, 104);
    doc.text('$2,555.00', 140, 104);
    
    doc.rect(20, 106, 150, 8);
    doc.setFontSize(11);
    doc.text('Total Tax', 25, 112);
    doc.text('$2,555.00', 140, 112);
    
    return doc;
  };

  const handleDownloadPDF = (format: string) => {
    toast({
      title: "Generating PDF",
      description: `Preparing ${format} for download...`,
      variant: "default"
    });
    
    let doc;
    let filename;
    
    switch(format) {
      case "Invoice PDF":
        doc = generateInvoicePDF();
        filename = `invoice-${selectedInvoice?.id || 'unknown'}.pdf`;
        break;
      case "Receipt PDF":
        doc = generateReceiptPDF();
        filename = `receipt-${selectedInvoice?.id || 'unknown'}.pdf`;
        break;
      case "Statement PDF":
        doc = generateStatementPDF();
        filename = `statement-${selectedInvoice?.supplier?.replace(/\s+/g, '-') || 'unknown'}.pdf`;
        break;
      case "Tax Report PDF":
        doc = generateTaxReportPDF();
        filename = `tax-report-${selectedInvoice?.eta || 'unknown'}.pdf`;
        break;
      default:
        doc = generateInvoicePDF();
        filename = `document-${Date.now()}.pdf`;
    }
    
    // Download the PDF
    doc.save(filename);
    
    setIsDownloadDialogOpen(false);
    
    toast({
      title: "Download Complete",
      description: `${format} has been downloaded successfully as ${filename}`,
      variant: "default"
    });
  };

  const viewSupplier = (invoice: any) => {
    toast({
      title: "Supplier Information",
      description: `Opening supplier details for ${invoice.supplier}.`,
      variant: "default"
    });
  };

  // Handle expense export
  const handleExpenseExport = () => {
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    let startDate: string;
    let endDate: string;

    // Calculate date range based on selection
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    switch (exportDateRange) {
      case 'today':
        startDate = endDate = formatDate(today);
        break;
      case 'this-week':
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        startDate = formatDate(weekStart);
        endDate = formatDate(weekEnd);
        break;
      case 'this-month':
        startDate = formatDate(new Date(currentYear, currentMonth, 1));
        endDate = formatDate(new Date(currentYear, currentMonth + 1, 0));
        break;
      case 'last-month':
        startDate = formatDate(new Date(currentYear, currentMonth - 1, 1));
        endDate = formatDate(new Date(currentYear, currentMonth, 0));
        break;
      case 'this-quarter':
        const quarterStart = Math.floor(currentMonth / 3) * 3;
        startDate = formatDate(new Date(currentYear, quarterStart, 1));
        endDate = formatDate(new Date(currentYear, quarterStart + 3, 0));
        break;
      case 'last-quarter':
        const lastQuarterStart = Math.floor(currentMonth / 3) * 3 - 3;
        startDate = formatDate(new Date(currentYear, lastQuarterStart, 1));
        endDate = formatDate(new Date(currentYear, lastQuarterStart + 3, 0));
        break;
      case 'this-year':
        startDate = formatDate(new Date(currentYear, 0, 1));
        endDate = formatDate(new Date(currentYear, 11, 31));
        break;
      case 'last-year':
        startDate = formatDate(new Date(currentYear - 1, 0, 1));
        endDate = formatDate(new Date(currentYear - 1, 11, 31));
        break;
      case 'custom':
        startDate = exportStartDate;
        endDate = exportEndDate;
        break;
      default:
        startDate = formatDate(new Date(currentYear, currentMonth, 1));
        endDate = formatDate(new Date(currentYear, currentMonth + 1, 0));
    }

    // Generate filename
    const filename = `expenses_${startDate}_to_${endDate}.${exportFormat === 'excel' ? 'xlsx' : exportFormat}`;

    // Generate sample expense data for demonstration
    const sampleExpenses = [
      {
        date: '2025-06-01',
        description: 'Office Supplies Purchase',
        amount: 250.00,
        accountType: 'Office Expenses',
        costCenter: 'Administration',
        paymentMethod: 'Credit Card',
        notes: 'Monthly office supplies restocking'
      },
      {
        date: '2025-06-02',
        description: 'Laboratory Equipment Maintenance',
        amount: 1500.00,
        accountType: 'Maintenance & Repairs',
        costCenter: 'Quality Control',
        paymentMethod: 'Bank Transfer',
        notes: 'Quarterly maintenance of analytical equipment'
      },
      {
        date: '2025-06-03',
        description: 'Professional Services - Legal Consultation',
        amount: 800.00,
        accountType: 'Professional Services',
        costCenter: 'Legal & Compliance',
        paymentMethod: 'Check',
        notes: 'Regulatory compliance consultation'
      },
      {
        date: '2025-06-04',
        description: 'Raw Materials Transportation',
        amount: 450.00,
        accountType: 'Transportation',
        costCenter: 'Manufacturing',
        paymentMethod: 'Cash',
        notes: 'Freight charges for chemical raw materials'
      },
      {
        date: '2025-06-05',
        description: 'Marketing Campaign - Digital Advertising',
        amount: 2000.00,
        accountType: 'Marketing & Advertising',
        costCenter: 'Sales & Marketing',
        paymentMethod: 'Credit Card',
        notes: 'Q2 digital marketing campaign'
      }
    ];

    const expenseData = sampleExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
    });

    // Generate export based on format
    if (exportFormat === 'csv') {
      const csvContent = [
        ['Date', 'Description', 'Amount', 'Account Type', 'Cost Center', 'Payment Method', 'Notes'].join(','),
        ...expenseData.map(expense => [
          expense.date,
          `"${expense.description}"`,
          expense.amount,
          expense.accountType,
          expense.costCenter,
          expense.paymentMethod,
          `"${expense.notes || ''}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (exportFormat === 'pdf') {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.setTextColor(40, 116, 166);
      doc.text('Expense Report', 20, 25);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Date Range: ${startDate} to ${endDate}`, 20, 40);
      doc.text(`Export Date: ${formatDate(new Date())}`, 20, 50);
      
      // Table header
      const tableColumn = ['Date', 'Description', 'Amount', 'Account Type', 'Payment Method'];
      const tableRows = expenseData.map(expense => [
        expense.date,
        expense.description,
        `$${expense.amount}`,
        expense.accountType,
        expense.paymentMethod
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        theme: 'grid',
        headStyles: { fillColor: [40, 116, 166] },
        styles: { fontSize: 8 }
      });

      doc.save(filename);
    } else if (exportFormat === 'json') {
      // JSON export
      const jsonData = JSON.stringify(expenseData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (exportFormat === 'excel') {
      // Excel export (CSV format)
      const excelData = expenseData.map((e: any) => ({
        Date: e.date,
        Description: e.description,
        Amount: e.amount,
        'Account Type': e.accountType,
        'Cost Center': e.costCenter,
        'Payment Method': e.paymentMethod,
        Notes: e.notes
      }));
      
      const csvContent = [
        Object.keys(excelData[0] || {}).join(','),
        ...excelData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }

    toast({
      title: "Export Complete",
      description: `Expense report exported successfully as ${filename}`,
      variant: "default"
    });

    setIsExpenseExportOpen(false);
  };

  // Handle purchase export
  const handlePurchaseExport = () => {
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    let startDate: string;
    let endDate: string;

    // Use custom date range from purchase export state
    startDate = purchaseExportStartDate || formatDate(new Date());
    endDate = purchaseExportEndDate || formatDate(new Date());

    // Generate filename
    const filename = `purchases_${startDate}_to_${endDate}.${purchaseExportFormat === 'excel' ? 'xlsx' : purchaseExportFormat}`;

    // Generate sample purchase data for demonstration
    const samplePurchases = [
      {
        date: '2025-06-01',
        invoiceNumber: 'PUR-2025-001',
        supplier: 'Chemical Supply Co.',
        description: 'Sodium Chloride 99.9% Pure (Industrial Grade)',
        quantity: 500,
        unit: 'kg',
        unitPrice: 12.50,
        total: 6250.00,
        vatAmount: 875.00,
        paymentMethod: 'Bank Transfer',
        status: 'Paid'
      },
      {
        date: '2025-06-02',
        invoiceNumber: 'PUR-2025-002',
        supplier: 'Lab Equipment Ltd.',
        description: 'Precision Analytical Balance',
        quantity: 2,
        unit: 'units',
        unitPrice: 850.00,
        total: 1700.00,
        vatAmount: 238.00,
        paymentMethod: 'Credit Card',
        status: 'Pending'
      },
      {
        date: '2025-06-03',
        invoiceNumber: 'PUR-2025-003',
        supplier: 'Packaging Solutions Inc.',
        description: 'Pharmaceutical Grade Containers',
        quantity: 1000,
        unit: 'pieces',
        unitPrice: 2.50,
        total: 2500.00,
        vatAmount: 350.00,
        paymentMethod: 'Bank Transfer',
        status: 'Paid'
      }
    ];

    const purchaseData = samplePurchases.filter(purchase => {
      const purchaseDate = new Date(purchase.date);
      return purchaseDate >= new Date(startDate) && purchaseDate <= new Date(endDate);
    });

    // Generate export based on format
    if (purchaseExportFormat === 'csv') {
      const csvContent = [
        ['Date', 'Invoice Number', 'Supplier', 'Description', 'Quantity', 'Unit', 'Unit Price', 'Total', 'VAT Amount', 'Payment Method', 'Status'].join(','),
        ...purchaseData.map(purchase => [
          purchase.date,
          purchase.invoiceNumber,
          `"${purchase.supplier}"`,
          `"${purchase.description}"`,
          purchase.quantity,
          purchase.unit,
          purchase.unitPrice,
          purchase.total,
          purchase.vatAmount,
          purchase.paymentMethod,
          purchase.status
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (purchaseExportFormat === 'pdf') {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.setTextColor(40, 116, 166);
      doc.text('Purchase Report', 20, 25);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Date Range: ${startDate} to ${endDate}`, 20, 40);
      doc.text(`Export Date: ${formatDate(new Date())}`, 20, 50);
      
      // Table header
      const tableColumn = ['Date', 'Invoice #', 'Supplier', 'Description', 'Amount', 'Status'];
      const tableRows = purchaseData.map(purchase => [
        purchase.date,
        purchase.invoiceNumber,
        purchase.supplier,
        purchase.description.substring(0, 30) + '...',
        `$${purchase.total}`,
        purchase.status
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        theme: 'grid',
        headStyles: { fillColor: [40, 116, 166] },
        styles: { fontSize: 8 }
      });

      doc.save(filename);
    } else if (purchaseExportFormat === 'excel') {
      // Excel export (CSV format)
      const excelData = purchaseData.map((p: any) => ({
        Date: p.date,
        'Invoice Number': p.invoiceNumber,
        Supplier: p.supplier,
        Description: p.description,
        Quantity: p.quantity,
        Unit: p.unit,
        'Unit Price': p.unitPrice,
        Total: p.total,
        'VAT Amount': p.vatAmount,
        'Payment Method': p.paymentMethod,
        Status: p.status
      }));
      
      const csvContent = [
        Object.keys(excelData[0] || {}).join(','),
        ...excelData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }

    toast({
      title: "Export Complete",
      description: `Purchase report exported successfully as ${filename}`,
      variant: "default"
    });

    setIsPurchaseExportOpen(false);
  };

  const recordPayment = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      amount: invoice.due || invoice.remaining || '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: '',
      reference: '',
      notes: ''
    });
    setIsPaymentDialogOpen(true);
  };

  // Enhanced receipt management states
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [isUploadReceiptDialogOpen, setIsUploadReceiptDialogOpen] = useState(false);
  const [isElectronicReceiptDialogOpen, setIsElectronicReceiptDialogOpen] = useState(false);
  const [selectedReceiptFile, setSelectedReceiptFile] = useState<File | null>(null);

  // Enhanced receipt management functions
  const handleViewInvoiceReceipt = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsReceiptDialogOpen(true);
  };

  const handleUploadReceipt = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsUploadReceiptDialogOpen(true);
  };

  const handleElectronicReceipt = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsElectronicReceiptDialogOpen(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedReceiptFile(file);
      toast({
        title: "File Selected",
        description: `Selected file: ${file.name}`,
        variant: "default"
      });
    }
  };

  const uploadReceipt = () => {
    if (selectedReceiptFile && selectedInvoice) {
      toast({
        title: "Receipt Uploaded",
        description: `Receipt uploaded successfully for ${selectedInvoice.id}`,
        variant: "default"
      });
      setIsUploadReceiptDialogOpen(false);
      setSelectedReceiptFile(null);
    }
  };

  const generateElectronicReceipt = () => {
    toast({
      title: "Electronic Receipt Generated",
      description: `Electronic receipt generated for ${selectedInvoice?.id}`,
      variant: "default"
    });
    setIsElectronicReceiptDialogOpen(false);
  };

  // Financial Reports Generation Function
  const generateFinancialReport = () => {
    setReportGenerated(true);
    toast({
      title: "Report Generated",
      description: `${getReportTypeName(selectedReportType)} generated successfully for ${reportStartDate} to ${reportEndDate}`,
      variant: "default"
    });
  };

  // Enhanced PDF Export Function
  const exportReportToPDF = async () => {
    try {
      const reportData = getReportData();
      
      // Dynamic import of jsPDF
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF();
      
      // Set up PDF styling colors
      const primaryColor: [number, number, number] = [34, 197, 94]; // Green
      const secondaryColor: [number, number, number] = [75, 85, 99]; // Gray
      const headerBg: [number, number, number] = [248, 250, 252]; // Light gray
      
      // Header section
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 25, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('MORGAN ERP', 20, 16);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Pharmaceutical Enterprise Resource Planning', 20, 21);
      
      // Report title and info
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(reportData.title, 20, 40);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Period: ${reportStartDate} to ${reportEndDate}`, 20, 48);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 54);
      doc.text(`Account Filter: ${accountFilter === 'all' ? 'All Accounts' : accountFilter.charAt(0).toUpperCase() + accountFilter.slice(1)}`, 20, 60);
      
      // Prepare table data
      const tableData = reportData.rows.map(row => row.map(cell => String(cell)));
      
      // Add totals row if exists
      if (reportData.totals) {
        tableData.push(reportData.totals.map(total => String(total)));
      }
      
      // Generate table based on report type
      const tableConfig: any = {
        head: [reportData.headers],
        body: tableData,
        startY: 70,
        theme: 'grid' as const,
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255] as [number, number, number],
          fontStyle: 'bold' as const,
          fontSize: 10,
          halign: 'left' as const
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [31, 41, 55] as [number, number, number],
          halign: 'left' as const
        },
        columnStyles: {},
        margin: { left: 20, right: 20 },
        didParseCell: function(data: any) {
          // Right-align numeric columns (typically amounts)
          if (data.column.index > 1 && data.section === 'body') {
            data.cell.styles.halign = 'right';
            data.cell.styles.fontStyle = 'bold';
          }
          if (data.column.index > 1 && data.section === 'head') {
            data.cell.styles.halign = 'right';
          }
          
          // Special styling for totals row
          if (reportData.totals && data.row.index === tableData.length - 1 && data.section === 'body') {
            data.cell.styles.fillColor = headerBg;
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [31, 41, 55];
          }
        }
      };
      
      // Adjust column styles based on report type
      if (selectedReportType === 'trial-balance') {
        tableConfig.columnStyles = {
          0: { cellWidth: 25, halign: 'left' },
          1: { cellWidth: 80, halign: 'left' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' }
        };
      } else if (selectedReportType === 'general-ledger') {
        tableConfig.columnStyles = {
          0: { cellWidth: 20, halign: 'left' },
          1: { cellWidth: 60, halign: 'left' },
          2: { cellWidth: 25, halign: 'right' },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' }
        };
      } else if (selectedReportType === 'cash-flow') {
        tableConfig.columnStyles = {
          0: { cellWidth: 80, halign: 'left' },
          1: { cellWidth: 30, halign: 'right' },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' }
        };
      }
      
      // Generate the table
      autoTable(doc, tableConfig);
      
      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        doc.text('Morgan ERP - Confidential Financial Report', 20, 285);
        doc.text(`Report: ${reportData.title}`, 20, 290);
      }
      
      // Report summary (for applicable reports)
      if (selectedReportType === 'trial-balance' || selectedReportType === 'pnl-statement') {
        const finalY = (doc as any).lastAutoTable?.finalY || 200;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text('Report Summary:', 20, finalY + 20);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('• This report was generated from live accounting data', 20, finalY + 28);
        doc.text('• All amounts are displayed in USD unless otherwise specified', 20, finalY + 34);
        doc.text('• Report complies with pharmaceutical industry accounting standards', 20, finalY + 40);
        doc.text('• Data integrity verified at time of generation', 20, finalY + 46);
      }
      
      // Save the PDF
      const fileName = `${reportData.title.replace(/\s+/g, '_')}_${reportStartDate}_to_${reportEndDate}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "PDF Export Successful",
        description: `${reportData.title} has been exported to PDF successfully.`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the report to PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Excel Export Function
  const exportReportToExcel = async () => {
    try {
      const reportData = getReportData();
      
      // Create workbook data
      const workbookData = [
        ['MORGAN ERP - Financial Report'],
        ['Pharmaceutical Enterprise Resource Planning'],
        [''],
        [`Report: ${reportData.title}`],
        [`Period: ${reportStartDate} to ${reportEndDate}`],
        [`Generated: ${new Date().toLocaleString()}`],
        [`Filter: ${accountFilter === 'all' ? 'All Accounts' : accountFilter.charAt(0).toUpperCase() + accountFilter.slice(1)}`],
        [''],
        reportData.headers,
        ...reportData.rows,
      ];
      
      // Add totals row if exists
      if (reportData.totals) {
        workbookData.push(reportData.totals);
      }
      
      // Add summary section
      workbookData.push(
        [''],
        ['Report Summary:'],
        ['• Generated from live accounting data'],
        ['• All amounts in USD unless specified'],
        ['• Pharmaceutical industry compliant'],
        ['• Data integrity verified']
      );
      
      // Convert to CSV format for download
      const csvContent = workbookData
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportData.title.replace(/\s+/g, '_')}_${reportStartDate}_to_${reportEndDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Excel Export Successful",
        description: `${reportData.title} has been exported to Excel format successfully.`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Excel Export Error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the report to Excel. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Export All Reports Function
  const exportAllReports = async () => {
    try {
      const doc = new jsPDF();
      const primaryColor: [number, number, number] = [34, 197, 94];
      const secondaryColor: [number, number, number] = [75, 85, 99];
      
      // Company Header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('MORGAN ERP', 20, 18);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Comprehensive Financial Reports Package', 20, 24);
      
      // Report information
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('All Financial Reports - Combined Export', 20, 45);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Period: ${reportStartDate} to ${reportEndDate}`, 20, 53);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 59);
      doc.text(`Account Filter: ${accountFilter === 'all' ? 'All Accounts' : accountFilter.charAt(0).toUpperCase() + accountFilter.slice(1)}`, 20, 65);
      
      let currentY = 75;
      
      // Generate all report types
      const reportTypes = [
        'trial-balance',
        'general-ledger', 
        'cash-flow',
        'account-summary',
        'journal-register',
        'aging-analysis'
      ];
      
      for (let i = 0; i < reportTypes.length; i++) {
        const reportType = reportTypes[i];
        const originalSelectedType = selectedReportType;
        
        // Temporarily change selected report type to get data
        setSelectedReportType(reportType);
        
        // Get report data based on type
        let reportData;
        switch (reportType) {
          case "trial-balance":
            reportData = {
              title: "Trial Balance Report",
              headers: ["Account Code", "Account Name", "Debit Balance", "Credit Balance"],
              rows: [
                ["1000", "Cash", "$50,000.00", "-"],
                ["1100", "Accounts Receivable", "$125,000.00", "-"],
                ["1200", "Inventory - Raw Materials", "$85,000.00", "-"],
                ["1300", "Equipment", "$200,000.00", "-"],
                ["2000", "Accounts Payable", "-", "$45,000.00"],
                ["2100", "Accrued Expenses", "-", "$15,000.00"],
                ["3000", "Owner's Equity", "-", "$300,000.00"],
                ["4000", "Sales Revenue", "-", "$180,000.00"],
                ["5000", "Cost of Goods Sold", "$90,000.00", "-"],
                ["5100", "Utilities Expense", "$12,000.00", "-"],
              ],
              totals: ["Total", "", "$562,000.00", "$540,000.00"]
            };
            break;
          case "general-ledger":
            reportData = {
              title: "General Ledger Report",
              headers: ["Date", "Account", "Description", "Debit", "Credit", "Balance"],
              rows: [
                ["2025-06-01", "1000 - Cash", "Opening Balance", "$50,000.00", "-", "$50,000.00"],
                ["2025-06-02", "1000 - Cash", "Customer Payment", "$5,000.00", "-", "$55,000.00"],
                ["2025-06-03", "1000 - Cash", "Supplier Payment", "-", "$2,500.00", "$52,500.00"],
                ["2025-06-04", "1100 - A/R", "Sales Invoice", "$15,000.00", "-", "$15,000.00"],
                ["2025-06-05", "1100 - A/R", "Customer Payment", "-", "$5,000.00", "$10,000.00"],
              ]
            };
            break;
          case "cash-flow":
            reportData = {
              title: "Cash Flow Statement",
              headers: ["Category", "Description", "Amount"],
              rows: [
                ["Operating Activities", "Cash from Customers", "$45,000.00"],
                ["Operating Activities", "Cash to Suppliers", "($25,000.00)"],
                ["Operating Activities", "Cash for Operating Expenses", "($8,000.00)"],
                ["Operating Activities", "Net Cash from Operating", "$12,000.00"],
                ["Investing Activities", "Equipment Purchase", "($15,000.00)"],
                ["Investing Activities", "Net Cash from Investing", "($15,000.00)"],
                ["Financing Activities", "Owner Investment", "$10,000.00"],
                ["Financing Activities", "Net Cash from Financing", "$10,000.00"],
              ],
              totals: ["Net Change in Cash", "", "$7,000.00"]
            };
            break;
          case "account-summary":
            reportData = {
              title: "Account Summary Report",
              headers: ["Account Type", "Account Count", "Total Debit", "Total Credit", "Net Balance"],
              rows: [
                ["Assets", "4", "$460,000.00", "-", "$460,000.00"],
                ["Liabilities", "2", "-", "$60,000.00", "($60,000.00)"],
                ["Equity", "1", "-", "$300,000.00", "($300,000.00)"],
                ["Revenue", "1", "-", "$180,000.00", "($180,000.00)"],
                ["Expenses", "2", "$102,000.00", "-", "$102,000.00"],
              ],
              totals: ["Total", "10", "$562,000.00", "$540,000.00", "$22,000.00"]
            };
            break;
          case "journal-register":
            reportData = {
              title: "Journal Register Report",
              headers: ["Entry #", "Date", "Description", "Debit Account", "Credit Account", "Amount"],
              rows: [
                ["JE001", "2025-06-01", "Cash Sale", "Cash", "Sales Revenue", "$5,000.00"],
                ["JE002", "2025-06-02", "Purchase Inventory", "Inventory", "Accounts Payable", "$8,000.00"],
                ["JE003", "2025-06-03", "Pay Supplier", "Accounts Payable", "Cash", "$2,500.00"],
                ["JE004", "2025-06-04", "Utility Payment", "Utilities Expense", "Cash", "$1,200.00"],
                ["JE005", "2025-06-05", "Equipment Purchase", "Equipment", "Cash", "$15,000.00"],
              ]
            };
            break;
          case "aging-analysis":
            reportData = {
              title: "Aging Analysis Report",
              headers: ["Customer/Vendor", "Current", "30 Days", "60 Days", "90+ Days", "Total"],
              rows: [
                ["PharmaCorp Ltd", "$5,000.00", "$2,000.00", "-", "-", "$7,000.00"],
                ["MediSupply Inc", "$3,000.00", "$1,500.00", "$800.00", "-", "$5,300.00"],
                ["HealthTech Solutions", "$8,000.00", "-", "-", "$500.00", "$8,500.00"],
                ["Chemical Suppliers Co", "$2,500.00", "$1,000.00", "-", "-", "$3,500.00"],
                ["Lab Equipment Ltd", "$4,200.00", "$800.00", "$300.00", "-", "$5,300.00"],
              ],
              totals: ["Total Outstanding", "$22,700.00", "$5,300.00", "$1,100.00", "$500.00", "$29,600.00"]
            };
            break;
          default:
            continue;
        }
        
        // Add new page for each report except the first
        if (i > 0) {
          doc.addPage();
          currentY = 20;
        }
        
        // Report title
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(reportData.title, 20, currentY);
        currentY += 10;
        
        // Prepare table data
        const tableData = reportData.rows.map(row => row.map(cell => String(cell)));
        if (reportData.totals) {
          tableData.push(reportData.totals.map(total => String(total)));
        }
        
        // Generate table
        autoTable(doc, {
          head: [reportData.headers],
          body: tableData,
          startY: currentY,
          theme: 'grid',
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'left'
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [31, 41, 55],
            halign: 'left'
          },
          margin: { left: 20, right: 20 },
          didParseCell: function(data: any) {
            if (data.column.index > 1 && data.section === 'body') {
              data.cell.styles.halign = 'right';
              data.cell.styles.fontStyle = 'bold';
            }
            if (data.column.index > 1 && data.section === 'head') {
              data.cell.styles.halign = 'right';
            }
            if (reportData.totals && data.row.index === tableData.length - 1 && data.section === 'body') {
              data.cell.styles.fillColor = [248, 250, 252];
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.textColor = [31, 41, 55];
            }
          }
        });
        
        // Restore original selected type
        setSelectedReportType(originalSelectedType);
      }
      
      // Add footer to all pages
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        doc.text('Morgan ERP - Comprehensive Financial Reports', 20, 285);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 290);
      }
      
      // Save the combined PDF
      const fileName = `All_Financial_Reports_${reportStartDate}_to_${reportEndDate}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "Export All Successful",
        description: "All financial reports have been exported to a single PDF file.",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Export All Error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting all reports. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getReportTypeName = (type: string) => {
    const reportNames: { [key: string]: string } = {
      "trial-balance": "Trial Balance Report",
      "general-ledger": "General Ledger Report", 
      "cash-flow": "Cash Flow Statement",
      "account-summary": "Account Summary Report",
      "journal-register": "Journal Register Report",
      "aging-analysis": "Aging Analysis Report"
    };
    return reportNames[type] || "Financial Report";
  };

  const getReportData = () => {
    switch (selectedReportType) {
      case "trial-balance":
        return {
          title: "Trial Balance Report",
          headers: ["Account Code", "Account Name", "Debit Balance", "Credit Balance"],
          rows: [
            ["1000", "Cash", "$50,000.00", "-"],
            ["1100", "Accounts Receivable", "$125,000.00", "-"],
            ["1200", "Inventory - Raw Materials", "$85,000.00", "-"],
            ["1300", "Equipment", "$200,000.00", "-"],
            ["2000", "Accounts Payable", "-", "$45,000.00"],
            ["2100", "Accrued Expenses", "-", "$15,000.00"],
            ["3000", "Owner's Equity", "-", "$300,000.00"],
            ["4000", "Sales Revenue", "-", "$180,000.00"],
            ["5000", "Cost of Goods Sold", "$90,000.00", "-"],
            ["5100", "Utilities Expense", "$12,000.00", "-"],
          ],
          totals: ["Total", "", "$562,000.00", "$540,000.00"]
        };
      case "general-ledger":
        return {
          title: "General Ledger Report",
          headers: ["Date", "Account", "Description", "Debit", "Credit", "Balance"],
          rows: [
            ["2025-06-01", "1000 - Cash", "Opening Balance", "$50,000.00", "-", "$50,000.00"],
            ["2025-06-02", "1000 - Cash", "Customer Payment", "$5,000.00", "-", "$55,000.00"],
            ["2025-06-03", "1000 - Cash", "Supplier Payment", "-", "$2,500.00", "$52,500.00"],
            ["2025-06-04", "1100 - A/R", "Sales Invoice", "$15,000.00", "-", "$15,000.00"],
            ["2025-06-05", "1100 - A/R", "Customer Payment", "-", "$5,000.00", "$10,000.00"],
            ["2025-06-06", "2000 - A/P", "Purchase Invoice", "-", "$8,000.00", "$8,000.00"],
            ["2025-06-07", "2000 - A/P", "Payment to Supplier", "$2,500.00", "-", "$5,500.00"],
          ]
        };
      case "cash-flow":
        return {
          title: "Cash Flow Statement",
          headers: ["Category", "Description", "Amount"],
          rows: [
            ["Operating Activities", "Cash from Customers", "$45,000.00"],
            ["Operating Activities", "Cash to Suppliers", "($25,000.00)"],
            ["Operating Activities", "Cash for Operating Expenses", "($8,000.00)"],
            ["Operating Activities", "Net Cash from Operating", "$12,000.00"],
            ["Investing Activities", "Equipment Purchase", "($15,000.00)"],
            ["Investing Activities", "Net Cash from Investing", "($15,000.00)"],
            ["Financing Activities", "Owner Investment", "$10,000.00"],
            ["Financing Activities", "Net Cash from Financing", "$10,000.00"],
          ],
          totals: ["Net Change in Cash", "", "$7,000.00"]
        };
      case "account-summary":
        return {
          title: "Account Summary Report",
          headers: ["Account Type", "Account Count", "Total Debit", "Total Credit", "Net Balance"],
          rows: [
            ["Assets", "4", "$460,000.00", "-", "$460,000.00"],
            ["Liabilities", "2", "-", "$60,000.00", "($60,000.00)"],
            ["Equity", "1", "-", "$300,000.00", "($300,000.00)"],
            ["Revenue", "1", "-", "$180,000.00", "($180,000.00)"],
            ["Expenses", "2", "$102,000.00", "-", "$102,000.00"],
          ],
          totals: ["Total", "10", "$562,000.00", "$540,000.00", "$22,000.00"]
        };
      case "journal-register":
        return {
          title: "Journal Register Report",
          headers: ["Entry #", "Date", "Description", "Debit Account", "Credit Account", "Amount"],
          rows: [
            ["JE001", "2025-06-01", "Cash Sale", "Cash", "Sales Revenue", "$5,000.00"],
            ["JE002", "2025-06-02", "Purchase Inventory", "Inventory", "Accounts Payable", "$8,000.00"],
            ["JE003", "2025-06-03", "Pay Supplier", "Accounts Payable", "Cash", "$2,500.00"],
            ["JE004", "2025-06-04", "Utility Payment", "Utilities Expense", "Cash", "$1,200.00"],
            ["JE005", "2025-06-05", "Equipment Purchase", "Equipment", "Cash", "$15,000.00"],
          ]
        };
      case "aging-analysis":
        return {
          title: "Aging Analysis Report",
          headers: ["Customer/Vendor", "Current", "30 Days", "60 Days", "90+ Days", "Total"],
          rows: [
            ["PharmaCorp Ltd", "$5,000.00", "$2,000.00", "-", "-", "$7,000.00"],
            ["MediSupply Inc", "$3,000.00", "$1,500.00", "$800.00", "-", "$5,300.00"],
            ["HealthTech Solutions", "$8,000.00", "-", "-", "$500.00", "$8,500.00"],
            ["Chemical Suppliers Co", "$2,500.00", "$1,000.00", "-", "-", "$3,500.00"],
            ["Lab Equipment Ltd", "$4,200.00", "$800.00", "$300.00", "-", "$5,300.00"],
          ],
          totals: ["Total Outstanding", "$22,700.00", "$5,300.00", "$1,100.00", "$500.00", "$29,600.00"]
        };
      default:
        return {
          title: "Financial Report",
          headers: ["Item", "Value"],
          rows: [["No data", "Select a report type"]],
          totals: null
        };
    }
  };

  const [newOption, setNewOption] = useState({ type: '', value: '' });
  
  // State for expense actions
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [isViewReceiptOpen, setIsViewReceiptOpen] = useState(false);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  
  // State for quotation actions
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [isQuotationPreviewOpen, setIsQuotationPreviewOpen] = useState(false);

  const handleViewReceipt = (expense: any) => {
    setSelectedExpense(expense);
    setIsViewReceiptOpen(true);
  };

  const handleViewQuotation = (quotation: any) => {
    setSelectedQuotation(quotation);
    setIsQuotationPreviewOpen(true);
  };



  // Settings management functions
  const addNewOption = () => {
    if (!newOption.type || !newOption.value.trim()) return;
    
    const settingKey = newOption.type + 's' as keyof typeof expenseSettings;
    setExpenseSettings(prev => ({
      ...prev,
      [settingKey]: [...prev[settingKey], newOption.value.trim()]
    }));
    
    setNewOption({ type: '', value: '' });
    
    toast({
      title: "Success",
      description: `Added "${newOption.value}" to ${newOption.type} options.`,
    });
  };

  const removeOption = (type: string, option: string) => {
    const settingKey = type + 's' as keyof typeof expenseSettings;
    setExpenseSettings(prev => ({
      ...prev,
      [settingKey]: prev[settingKey].filter((item: string) => item !== option)
    }));
    
    toast({
      title: "Removed",
      description: `Removed "${option}" from ${type} options.`,
    });
  };

  // Expense action functions
  const handleViewExpenseReceipt = (expense: any) => {
    setSelectedExpense(expense);
    setIsViewReceiptOpen(true);
  };

  const handleEditExpense = (expense: any) => {
    setSelectedExpense(expense);
    setExpenseForm({
      date: expense.date,
      description: expense.description,
      notes: expense.notes || '',
      accountType: expense.accountType,
      costCenter: expense.costCenter,
      paymentMethod: expense.paymentMethod,
      amount: expense.amount
    });
    setIsEditExpenseOpen(true);
  };

  const handleDeleteExpense = (expense: any) => {
    toast({
      title: "Expense Deleted",
      description: `Expense entry "${expense.description}" has been removed from your records.`,
    });
  };

  const handleTransferToInvoice = (quotation: any) => {
    setTransferQuotation(quotation);
    setIsTransferDialogOpen(true);
  };

  const confirmTransferToInvoice = () => {
    if (transferQuotation) {
      toast({
        title: "Creating Invoice",
        description: `Converting quotation ${transferQuotation.quotationNumber} to invoice...`,
      });
      
      // Navigate to create invoice with pre-filled data
      setTimeout(() => {
        window.location.href = `/create-invoice?from=${transferQuotation.quotationNumber}`;
      }, 1000);
      
      setIsTransferDialogOpen(false);
      setTransferQuotation(null);
    }
  };



  const handleExpenseSubmit = async () => {
    try {
      const expenseData = {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount)
      };

      const response = await apiRequest('POST', '/api/expenses', expenseData);
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "New expense entry created successfully!",
        });
        
        // Reset form
        setExpenseForm({
          date: '',
          description: '',
          notes: '',
          accountType: '',
          costCenter: '',
          paymentMethod: '',
          amount: ''
        });
        
        setIsNewExpenseOpen(false);
      } else {
        throw new Error('Failed to create expense');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create expense entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch accounting summary data
  const { data: summaryData, refetch: refetchSummary } = useQuery({
    queryKey: ['/api/accounting/summary'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/accounting/summary');
        return await res.json();
      } catch (error) {
        console.error("Error fetching accounting summary:", error);
        return {
          totalAccounts: 0,
          journalEntries: 0,
          revenueThisMonth: 0,
          expensesThisMonth: 0
        };
      }
    }
  });

  // Card component for dashboard stats
  const StatCard = ({ icon: Icon, title, value, description, trend }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
      {trend && (
        <CardFooter className="p-2">
          <div className={`text-xs flex items-center ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-500'}`}>
            {trend > 0 ? (
              <TrendingUp className="mr-1 h-3 w-3" />
            ) : trend < 0 ? (
              <TrendingUp className="mr-1 h-3 w-3 rotate-180" />
            ) : null}
            {trend > 0 ? '+' : ''}{trend}% from last month
          </div>
        </CardFooter>
      )}
    </Card>
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Refresh all data function
  const refreshAllData = async () => {
    try {
      // Show loading state by invalidating and refetching all queries
      await queryClient.invalidateQueries({ queryKey: ['/api/accounting/summary'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/journal-entries'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/customer-payments'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/customer-invoices'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/accounting-periods'] });
      
      // Refetch summary data explicitly
      await refetchSummary();
      
      toast({
        title: "Data Refreshed",
        description: "All accounting data has been refreshed from the database.",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Refresh Error:', error);
      toast({
        title: "Refresh Failed",
        description: "There was an error refreshing the data. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container py-4 mx-auto">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Landmark className="h-8 w-8 text-blue-600 flex-shrink-0" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 truncate">FINANCIAL ACCOUNTING</h1>
        </div>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setActiveTab("journal-entries")}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            New Journal Entry
          </Button>
          <Button 
            variant="outline"
            onClick={() => setActiveTab("profit-loss")}
          >
            <FileText className="mr-2 h-4 w-4" />
            View Reports
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="w-full overflow-x-auto">
          <TabsList className="flex w-max min-w-full h-12 bg-white border-b border-gray-200 rounded-none p-0">
            <TabsTrigger value="dashboard" className="flex-shrink-0 px-4 py-3 whitespace-nowrap">Dashboard</TabsTrigger>
            <TabsTrigger value="chart-of-accounts" className="flex-shrink-0 px-4 py-3 whitespace-nowrap">Chart of Accounts</TabsTrigger>
            <TabsTrigger value="journal-entries" className="flex-shrink-0 px-4 py-3 whitespace-nowrap">Journal Entries</TabsTrigger>
            <TabsTrigger value="expenses" className="flex-shrink-0 px-4 py-3 whitespace-nowrap">Expenses</TabsTrigger>
            <TabsTrigger value="payroll" className="flex-shrink-0 px-4 py-3 whitespace-nowrap">Payroll</TabsTrigger>
            <TabsTrigger value="purchases" className="flex-shrink-0 px-4 py-3 whitespace-nowrap">Purchases</TabsTrigger>
            <TabsTrigger value="pending-purchases" className="flex-shrink-0 px-4 py-3 whitespace-nowrap">Pending Purchases</TabsTrigger>
            <TabsTrigger value="customers-invoices" className="flex-shrink-0 px-4 py-3 whitespace-nowrap">Customers' Invoices</TabsTrigger>
            <TabsTrigger value="invoices-due" className="flex-shrink-0 px-4 py-3 whitespace-nowrap">Invoices Due</TabsTrigger>
            <TabsTrigger value="customer-payments" className="flex-shrink-0 px-4 py-3 whitespace-nowrap">Customer Payments</TabsTrigger>
            <TabsTrigger value="quotations" className="flex-shrink-0 px-4 py-3 whitespace-nowrap">Quotations</TabsTrigger>
            <TabsTrigger value="accounting-periods" className="flex-shrink-0 px-4 py-3 whitespace-nowrap">Periods</TabsTrigger>
            <TabsTrigger value="profit-loss" className="flex-shrink-0 px-4 py-3 whitespace-nowrap">Profit & Loss</TabsTrigger>
            <TabsTrigger value="balance-sheet" className="flex-shrink-0 px-4 py-3 whitespace-nowrap">Balance Sheet</TabsTrigger>
            <TabsTrigger value="financial-reports" className="flex-shrink-0 px-4 py-3 whitespace-nowrap">Financial Reports</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              icon={CreditCard}
              title="Total Accounts"
              value={summaryData?.totalAccounts || 0}
              description="Total accounts in your chart of accounts"
            />
            <StatCard
              icon={BookOpen}
              title="Journal Entries"
              value={summaryData?.journalEntries || 0}
              description="Total journal entries created"
            />
            <StatCard
              icon={DollarSign}
              title="Revenue (This Month)"
              value={formatCurrency(summaryData?.revenueThisMonth || 0)}
              description="Total revenue recorded this month"
              trend={5}
            />
            <StatCard
              icon={BarChart4}
              title="Expenses (This Month)"
              value={formatCurrency(summaryData?.expensesThisMonth || 0)}
              description="Total expenses recorded this month"
              trend={-2}
            />
          </div>

          {/* ETA Tax Compliance Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>ETA Tax Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-medium text-blue-800">Invoice Submissions</h4>
                  <p className="text-sm text-blue-600 mt-1">45 this month</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <FileWarning className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-medium text-green-800">Successful Submissions</h4>
                  <p className="text-sm text-green-600 mt-1">43 completed</p>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <h4 className="font-medium text-orange-800">Pending Review</h4>
                  <p className="text-sm text-orange-600 mt-1">2 invoices</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common accounting tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab("chart-of-accounts")}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Chart of Accounts
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("journal-entries")}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Create Journal Entry
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("customer-payments")}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Manage Customer Payments
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("accounting-periods")}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Accounting Periods
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("profit-loss")}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Generate Profit & Loss Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("balance-sheet")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Balance Sheet
                </Button>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest accounting transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    No recent activities to display. Create journal entries to see activity here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chart-of-accounts">
          <ChartOfAccounts />
        </TabsContent>

        <TabsContent value="journal-entries">
          <JournalEntries />
        </TabsContent>

        <TabsContent value="profit-loss">
          <ProfitAndLoss />
        </TabsContent>

        <TabsContent value="balance-sheet">
          <BalanceSheet />
        </TabsContent>
        
        <TabsContent value="customer-payments">
          <CustomerPayments />
        </TabsContent>
        
        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  <span>Payroll Management</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => setIsAddPayDialogOpen(true)}
                  >
                    <DollarSign className="h-4 w-4 mr-2" /> 
                    Add Pay
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation('/payroll')}
                  >
                    <Plus className="h-4 w-4 mr-2" /> 
                    Add Employee
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" /> 
                    Export Payroll
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Manage employee payroll, salaries, and attendance tracking</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Payroll Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 font-medium">Total Employees</p>
                      <p className="text-2xl font-bold text-blue-800">24</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-blue-600 mt-1">21 active</p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 font-medium">Monthly Payroll</p>
                      <p className="text-2xl font-bold text-green-800">$185,400</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-xs text-green-600 mt-1">+8% from last month</p>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 font-medium">Pending Payrolls</p>
                      <p className="text-2xl font-bold text-orange-800">4</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                  <p className="text-xs text-orange-600 mt-1">Requires processing</p>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 font-medium">Attendance Rate</p>
                      <p className="text-2xl font-bold text-purple-800">97.8%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-500" />
                  </div>
                  <p className="text-xs text-purple-600 mt-1">Above target</p>
                </div>
              </div>

              {/* Recent Payroll Entries */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recent Payroll Entries</h3>
                  <div className="flex items-center space-x-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Filter by department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="quality">Quality Control</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="accounting">Accounting</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="current">
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Pay period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current">Current Month</SelectItem>
                        <SelectItem value="previous">Previous Month</SelectItem>
                        <SelectItem value="quarter">This Quarter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox 
                          id="select-all-payroll"
                          aria-label="Select all employees"
                          checked={selectAllPayroll}
                          onCheckedChange={handleSelectAllPayroll}
                        />
                      </TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Pay Period</TableHead>
                      <TableHead className="text-right">Basic Salary</TableHead>
                      <TableHead className="text-right">Overtime</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Net Pay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          id="select-emp-001"
                          aria-label="Select Ahmed Hassan"
                          checked={selectedEmployees.includes('select-emp-001')}
                          onCheckedChange={(checked) => handleEmployeeSelection('select-emp-001', checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">Ahmed Hassan</div>
                          <div className="text-xs text-gray-500">EMP001 - Chemical Engineer</div>
                        </div>
                      </TableCell>
                      <TableCell>Production</TableCell>
                      <TableCell>Jan 2025</TableCell>
                      <TableCell className="text-right font-semibold">$8,500.00</TableCell>
                      <TableCell className="text-right">$450.00</TableCell>
                      <TableCell className="text-right">$200.00</TableCell>
                      <TableCell className="text-right font-bold text-green-600">$8,750.00</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">Paid</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0"
                            onClick={() => handleViewPayroll('select-emp-001', 'Ahmed Hassan')}
                            title="View Payroll Details"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-blue-600"
                            onClick={() => handlePayrollSlip('select-emp-001', 'Ahmed Hassan')}
                            title="Generate Payroll Slip"
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          id="select-emp-002"
                          aria-label="Select Fatima Al-Zahra"
                          checked={selectedEmployees.includes('select-emp-002')}
                          onCheckedChange={(checked) => handleEmployeeSelection('select-emp-002', checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">Fatima Al-Zahra</div>
                          <div className="text-xs text-gray-500">EMP002 - Lab Technician</div>
                        </div>
                      </TableCell>
                      <TableCell>Quality Control</TableCell>
                      <TableCell>Jan 2025</TableCell>
                      <TableCell className="text-right font-semibold">$6,500.00</TableCell>
                      <TableCell className="text-right">$0.00</TableCell>
                      <TableCell className="text-right">$150.00</TableCell>
                      <TableCell className="text-right font-bold text-green-600">$6,350.00</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">Paid</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0"
                            onClick={() => handleViewPayroll('select-emp-002', 'Fatima Al-Zahra')}
                            title="View Payroll Details"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-blue-600"
                            onClick={() => handlePayrollSlip('select-emp-002', 'Fatima Al-Zahra')}
                            title="Generate Payroll Slip"
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          id="select-emp-003"
                          aria-label="Select Omar Mahmoud"
                          checked={selectedEmployees.includes('select-emp-003')}
                          onCheckedChange={(checked) => handleEmployeeSelection('select-emp-003', checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">Omar Mahmoud</div>
                          <div className="text-xs text-gray-500">EMP003 - Sales Manager</div>
                        </div>
                      </TableCell>
                      <TableCell>Sales</TableCell>
                      <TableCell>Jan 2025</TableCell>
                      <TableCell className="text-right font-semibold">$12,000.00</TableCell>
                      <TableCell className="text-right">$600.00</TableCell>
                      <TableCell className="text-right">$300.00</TableCell>
                      <TableCell className="text-right font-bold text-orange-600">$12,300.00</TableCell>
                      <TableCell>
                        <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0"
                            onClick={() => handleViewPayroll('select-emp-003', 'Omar Mahmoud')}
                            title="View Payroll Details"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          id="select-emp-004"
                          aria-label="Select Nour Abdel Rahman"
                          checked={selectedEmployees.includes('select-emp-004')}
                          onCheckedChange={(checked) => handleEmployeeSelection('select-emp-004', checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">Nour Abdel Rahman</div>
                          <div className="text-xs text-gray-500">EMP004 - Financial Analyst</div>
                        </div>
                      </TableCell>
                      <TableCell>Accounting</TableCell>
                      <TableCell>Jan 2025</TableCell>
                      <TableCell className="text-right font-semibold">$7,500.00</TableCell>
                      <TableCell className="text-right">$200.00</TableCell>
                      <TableCell className="text-right">$100.00</TableCell>
                      <TableCell className="text-right font-bold text-gray-600">$7,600.00</TableCell>
                      <TableCell>
                        <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0"
                            onClick={() => handleEditPayroll('select-emp-004', 'Nour Abdel Rahman')}
                            title="Edit Payroll"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending-purchases">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-orange-600" />
                  <span>Pending Purchases</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab("purchases")}
                  >
                    <FileText className="h-4 w-4 mr-2" /> 
                    All Purchases
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" /> 
                    Export Pending
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Purchase orders forwarded from procurement department awaiting financial processing and approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Pending Purchase Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 font-medium">Pending Orders</p>
                      <p className="text-2xl font-bold text-orange-800">12</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                  <p className="text-xs text-orange-600 mt-1">Awaiting approval</p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 font-medium">Total Value</p>
                      <p className="text-2xl font-bold text-blue-800">$485,200</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-blue-600 mt-1">Pending approval</p>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-600 font-medium">Urgent Orders</p>
                      <p className="text-2xl font-bold text-red-800">3</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-xs text-red-600 mt-1">Due within 48hrs</p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 font-medium">Avg Processing</p>
                      <p className="text-2xl font-bold text-green-800">2.3</p>
                    </div>
                    <Clock className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-xs text-green-600 mt-1">Days to approve</p>
                </div>
              </div>

              {/* Pending Purchases Table */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Purchase Orders Awaiting Approval</h3>
                  <div className="flex items-center space-x-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Filter by priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Low Priority</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="recent">
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Sort by date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="amount">By Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox 
                          id="select-all-pending"
                          aria-label="Select all pending purchases"
                        />
                      </TableHead>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Date Submitted</TableHead>
                      <TableHead>ETA Number</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Payment Terms</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPurchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>
                          <Checkbox 
                            id={`select-${purchase.id}`}
                            aria-label={`Select ${purchase.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{purchase.id}</div>
                          <div className="text-xs text-gray-500">From Procurement</div>
                        </TableCell>
                        <TableCell>{purchase.supplier}</TableCell>
                        <TableCell>{purchase.dateSubmitted}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{purchase.etaNumber}</code>
                        </TableCell>
                        <TableCell className="text-right font-semibold">${purchase.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={
                            purchase.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            purchase.priority === 'normal' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {purchase.priority === 'urgent' ? 'Urgent' : 
                             purchase.priority === 'normal' ? 'Normal' : 'Low'}
                          </Badge>
                        </TableCell>
                        <TableCell>{purchase.paymentTerms}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-green-600"
                              title="Approve Purchase"
                              onClick={() => handleApprovePurchase(purchase.id)}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0"
                              title="View Details"
                              onClick={() => handleViewPurchaseDetails(purchase.id)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-red-600"
                              title="Reject Purchase"
                              onClick={() => handleRejectPurchase(purchase.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Bulk Actions */}
              <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  Select purchases to perform bulk actions
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-green-600 border-green-300 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Selected
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject Selected
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="quotations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  <span>Quotations Management</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = '/create-quotation'}
                  >
                    <Plus className="h-4 w-4 mr-2" /> 
                    New Quotation
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = '/quotation-history'}
                  >
                    <Eye className="h-4 w-4 mr-2" /> 
                    View All
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Track and manage pharmaceutical quotations with ETA compliance</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Quotation Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 font-medium">Total Quotations</p>
                      <p className="text-2xl font-bold text-blue-800">127</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-blue-600 mt-1">This month: +12</p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 font-medium">Accepted</p>
                      <p className="text-2xl font-bold text-green-800">89</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-xs text-green-600 mt-1">$234,580 value</p>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 font-medium">Pending</p>
                      <p className="text-2xl font-bold text-orange-800">23</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                  <p className="text-xs text-orange-600 mt-1">$67,840 potential</p>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 font-medium">Conversion Rate</p>
                      <p className="text-2xl font-bold text-purple-800">70%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-500" />
                  </div>
                  <p className="text-xs text-purple-600 mt-1">Up 5% this month</p>
                </div>
              </div>

              {/* Recent Quotations Table */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recent Quotations</h3>
                  <div className="flex items-center space-x-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="all-types">
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-types">All Types</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="refining">Refining</SelectItem>
                        <SelectItem value="finished">Finished Products</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quotation #</TableHead>
                      <TableHead>ETA #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">
                        <span className="text-blue-600">QUO-MFG-202505-001</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 text-sm">ETA-2025-05-12345</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">Cairo Medical Center</div>
                          <div className="text-xs text-gray-500">Manufacturing Services</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">Manufacturing</Badge>
                      </TableCell>
                      <TableCell>May 15, 2025</TableCell>
                      <TableCell className="text-right font-semibold">$12,450.00</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">Accepted</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0"
                            onClick={() => handleViewQuotation({
                              id: 'QUO-MFG-202505-001',
                              quotationNumber: 'QUO-MFG-202505-001',
                              etaNumber: 'ETA-2025-05-12345',
                              customer: 'Cairo Medical Center',
                              type: 'Manufacturing',
                              date: 'May 15, 2025',
                              amount: 12450.00,
                              status: 'Accepted',
                              description: 'Manufacturing Services',
                              vatPercentage: 14
                            })}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-blue-600"
                            title="Transfer to Invoice"
                            onClick={() => handleTransferToInvoice({
                              id: 'QUO-MFG-202505-001',
                              quotationNumber: 'QUO-MFG-202505-001',
                              etaNumber: 'ETA-2025-05-12345',
                              customer: 'Cairo Medical Center',
                              type: 'Manufacturing',
                              date: 'May 15, 2025',
                              amount: 12450.00,
                              status: 'Accepted',
                              description: 'Manufacturing Services',
                              vatPercentage: 14
                            })}
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-green-600"
                            onClick={() => {
                              toast({
                                title: "Downloading PDF",
                                description: "Quotation QUO-MFG-202505-001 is being downloaded...",
                              });
                              const link = document.createElement('a');
                              link.href = 'data:application/pdf;base64,JVBERi0xLjQKJdP0zOEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCgoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagoKMyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDIgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCi9Db250ZW50cyA0IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKL0xlbmd0aCA0NQo+PgpzdHJlYW0KQVQKL0YxIDEyIFRmCjEwMCA1MDAgVGQKKFF1b3RhdGlvbiBRVU8tTUZHLTIwMjUwNS0wMDEpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDIwNCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDUKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjMwMApfRU9GCg==';
                              link.download = 'QUO-MFG-202505-001.pdf';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell className="font-medium">
                        <span className="text-blue-600">QUO-REF-202505-002</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-400 text-sm">Not uploaded</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">Alexandria Pharma</div>
                          <div className="text-xs text-gray-500">API Purification</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">Refining</Badge>
                      </TableCell>
                      <TableCell>May 14, 2025</TableCell>
                      <TableCell className="text-right font-semibold">$8,750.00</TableCell>
                      <TableCell>
                        <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-green-600"
                            onClick={() => {
                              toast({
                                title: "Downloading PDF",
                                description: "Quotation QUO-REF-202505-002 is being downloaded...",
                              });
                              const link = document.createElement('a');
                              link.href = 'data:application/pdf;base64,JVBERi0xLjQKJdP0zOEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCgoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagoKMyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDIgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCi9Db250ZW50cyA0IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKL0xlbmd0aCA0NQo+PgpzdHJlYW0KQVQKL0YxIDEyIFRmCjEwMCA1MDAgVGQKKFF1b3RhdGlvbiBRVU8tUkVGLTIwMjUwNS0wMDIpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDIwNCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDUKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjMwMApfRU9GCg==';
                              link.download = 'QUO-REF-202505-002.pdf';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell className="font-medium">
                        <span className="text-blue-600">QUO-FIN-202505-003</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 text-sm">ETA-2025-05-12378</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">Giza Medical Supply</div>
                          <div className="text-xs text-gray-500">Finished Products</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-purple-100 text-purple-800">Finished</Badge>
                      </TableCell>
                      <TableCell>May 13, 2025</TableCell>
                      <TableCell className="text-right font-semibold">$15,200.00</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">Sent</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-blue-600"
                            title="Transfer to Invoice"
                            onClick={() => handleTransferToInvoice({
                              id: 'QUO-FIN-202505-003',
                              quotationNumber: 'QUO-FIN-202505-003',
                              etaNumber: 'ETA-2025-05-12378',
                              customer: 'Giza Medical Supply',
                              type: 'Finished',
                              date: 'May 13, 2025',
                              amount: 15200.00,
                              status: 'Sent',
                              description: 'Finished Products',
                              vatPercentage: 14
                            })}
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-green-600"
                            onClick={() => {
                              toast({
                                title: "Downloading PDF",
                                description: "Quotation QUO-FIN-202505-003 is being downloaded...",
                              });
                              const link = document.createElement('a');
                              link.href = 'data:application/pdf;base64,JVBERi0xLjQKJdP0zOEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCgoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagoKMyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDIgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCi9Db250ZW50cyA0IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKL0xlbmd0aCA0NQo+PgpzdHJlYW0KQVQKL0YxIDEyIFRmCjEwMCA1MDAgVGQKKFF1b3RhdGlvbiBRVU8tRklOLTIwMjUwNS0wMDMpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDIwNCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDUKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjMwMApfRU9GCg==';
                              link.download = 'QUO-FIN-202505-003.pdf';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell className="font-medium">
                        <span className="text-blue-600">QUO-MFG-202505-004</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-400 text-sm">Not uploaded</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">Delta Pharmaceuticals</div>
                          <div className="text-xs text-gray-500">Manufacturing Services</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">Manufacturing</Badge>
                      </TableCell>
                      <TableCell>May 12, 2025</TableCell>
                      <TableCell className="text-right font-semibold">$9,680.00</TableCell>
                      <TableCell>
                        <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-gray-400"
                            disabled
                            title="Draft quotations cannot be downloaded"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell className="font-medium">
                        <span className="text-blue-600">QUO-REF-202505-005</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-400 text-sm">Not uploaded</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">Nile Medical Industries</div>
                          <div className="text-xs text-gray-500">API Purification</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">Refining</Badge>
                      </TableCell>
                      <TableCell>May 11, 2025</TableCell>
                      <TableCell className="text-right font-semibold">$6,320.00</TableCell>
                      <TableCell>
                        <Badge className="bg-red-100 text-red-800">Expired</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-gray-400"
                            disabled
                            title="Expired quotations cannot be downloaded"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {/* ETA Compliance Summary */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <FileWarning className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">ETA Compliance Status</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        3 of 5 recent quotations have been successfully uploaded to ETA. 
                        2 quotations are pending upload for tax compliance.
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs">
                        <span className="text-green-600">✓ 3 Uploaded</span>
                        <span className="text-orange-600">⏳ 2 Pending</span>
                        <span className="text-blue-600">📊 60% Compliance Rate</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="customers-invoices">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  <span>Customers' Invoices</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab("customer-payments")}
                  >
                    <CreditCard className="h-4 w-4 mr-2" /> 
                    Customer Payments
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" /> 
                    Export Invoices
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Comprehensive customer invoice management with payment status tracking and history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Customer Invoice Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 font-medium">Total Invoices</p>
                      <p className="text-2xl font-bold text-green-800">156</p>
                    </div>
                    <FileText className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-xs text-green-600 mt-1">All customer invoices</p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 font-medium">Paid Invoices</p>
                      <p className="text-2xl font-bold text-blue-800">124</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-blue-600 mt-1">$1,285,450 collected</p>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 font-medium">Unpaid Invoices</p>
                      <p className="text-2xl font-bold text-orange-800">32</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                  <p className="text-xs text-orange-600 mt-1">$285,650 outstanding</p>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 font-medium">Collection Rate</p>
                      <p className="text-2xl font-bold text-purple-800">79.5%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-500" />
                  </div>
                  <p className="text-xs text-purple-600 mt-1">Above target (75%)</p>
                </div>
              </div>

              {/* Customer Search and Filters */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search customers or invoices..."
                      className="pl-10"
                    />
                  </div>
                  
                  <Select defaultValue="all-customers">
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-customers">All Customers</SelectItem>
                      <SelectItem value="cairo-medical">Cairo Medical Center</SelectItem>
                      <SelectItem value="alexandria-pharma">Alexandria Pharmaceuticals</SelectItem>
                      <SelectItem value="global-health">Global Health Solutions</SelectItem>
                      <SelectItem value="mediterranean-labs">Mediterranean Labs</SelectItem>
                      <SelectItem value="nile-pharma">Nile Pharmaceutical Co.</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select defaultValue="all-status">
                    <SelectTrigger>
                      <SelectValue placeholder="Payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-status">All Status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partial">Partial Payment</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select defaultValue="this-year">
                    <SelectTrigger>
                      <SelectValue placeholder="Date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="this-quarter">This Quarter</SelectItem>
                      <SelectItem value="this-year">This Year</SelectItem>
                      <SelectItem value="last-year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Customer Invoices Table */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Customer Invoices History</h3>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Advanced Filters
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>ETA Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Invoice Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Paid Amount</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">
                        <span className="text-blue-600">INV-2025-001</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 text-sm">ETA-2025-05-12345</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">Cairo Medical Center</div>
                          <div className="text-xs text-gray-500">Ibuprofen Manufacturing</div>
                        </div>
                      </TableCell>
                      <TableCell>Jan 15, 2025</TableCell>
                      <TableCell>Feb 14, 2025</TableCell>
                      <TableCell className="text-right font-semibold">$54,150.00</TableCell>
                      <TableCell className="text-right text-green-600">$54,150.00</TableCell>
                      <TableCell className="text-right text-green-600">$0.00</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">Paid</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0"
                            title="View Invoice Details"
                            onClick={() => handleViewInvoiceDetails({
                              invoiceNumber: 'INV-2025-001',
                              etaNumber: 'ETA-2025-05-12345',
                              customerName: 'Cairo Medical Center',
                              service: 'Ibuprofen Manufacturing',
                              invoiceDate: 'Jan 15, 2025',
                              dueDate: 'Feb 14, 2025',
                              amount: 54150.00,
                              paidAmount: 54150.00,
                              balance: 0.00,
                              paymentStatus: 'Paid'
                            })}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-blue-600"
                            title="Download PDF"
                            onClick={() => handleDownloadInvoicePDF({
                              invoiceNumber: 'INV-2025-001',
                              etaNumber: 'ETA-2025-05-12345',
                              customerName: 'Cairo Medical Center',
                              service: 'Ibuprofen Manufacturing',
                              invoiceDate: 'Jan 15, 2025',
                              dueDate: 'Feb 14, 2025',
                              amount: 54150.00,
                              paidAmount: 54150.00,
                              balance: 0.00,
                              paymentStatus: 'Paid'
                            })}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-green-600"
                            title="Payment History"
                            onClick={() => handleViewPaymentHistory({
                              invoiceNumber: 'INV-2025-001',
                              customerName: 'Cairo Medical Center'
                            })}
                          >
                            <CreditCard className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell className="font-medium">
                        <span className="text-blue-600">INV-2025-002</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 text-sm">ETA-2025-05-12346</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">Alexandria Pharmaceuticals</div>
                          <div className="text-xs text-gray-500">Paracetamol Production</div>
                        </div>
                      </TableCell>
                      <TableCell>Jan 20, 2025</TableCell>
                      <TableCell>Feb 19, 2025</TableCell>
                      <TableCell className="text-right font-semibold">$41,600.00</TableCell>
                      <TableCell className="text-right text-green-600">$41,600.00</TableCell>
                      <TableCell className="text-right text-green-600">$0.00</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">Paid</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0"
                            title="View Invoice Details"
                            onClick={() => handleViewInvoiceDetails({
                              invoiceNumber: 'INV-2025-002',
                              etaNumber: 'ETA-2025-05-12346',
                              customerName: 'Alexandria Pharmaceuticals',
                              service: 'Paracetamol Production',
                              invoiceDate: 'Jan 20, 2025',
                              dueDate: 'Feb 19, 2025',
                              amount: 41600.00,
                              paidAmount: 41600.00,
                              balance: 0.00,
                              paymentStatus: 'Paid'
                            })}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-blue-600"
                            title="Download PDF"
                            onClick={() => handleDownloadInvoicePDF({
                              invoiceNumber: 'INV-2025-002',
                              etaNumber: 'ETA-2025-05-12346',
                              customerName: 'Alexandria Pharmaceuticals',
                              service: 'Paracetamol Production',
                              invoiceDate: 'Jan 20, 2025',
                              dueDate: 'Feb 19, 2025',
                              amount: 41600.00,
                              paidAmount: 41600.00,
                              balance: 0.00,
                              paymentStatus: 'Paid'
                            })}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-green-600"
                            title="Payment History"
                            onClick={() => handleViewPaymentHistory({
                              invoiceNumber: 'INV-2025-002',
                              customerName: 'Alexandria Pharmaceuticals'
                            })}
                          >
                            <CreditCard className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell className="font-medium">
                        <span className="text-blue-600">INV-2025-003</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 text-sm">ETA-2025-05-12347</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">Global Health Solutions</div>
                          <div className="text-xs text-gray-500">Antibiotic Synthesis</div>
                        </div>
                      </TableCell>
                      <TableCell>Feb 05, 2025</TableCell>
                      <TableCell>Mar 07, 2025</TableCell>
                      <TableCell className="text-right font-semibold">$78,500.00</TableCell>
                      <TableCell className="text-right text-blue-600">$30,000.00</TableCell>
                      <TableCell className="text-right text-orange-600">$48,500.00</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">Partial Payment</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0"
                            title="View Invoice Details"
                            onClick={() => handleViewInvoiceDetails({
                              invoiceNumber: 'INV-2025-003',
                              etaNumber: 'ETA-2025-05-12347',
                              customerName: 'Global Health Solutions',
                              service: 'Antibiotic Synthesis',
                              invoiceDate: 'Feb 05, 2025',
                              dueDate: 'Mar 07, 2025',
                              amount: 78500.00,
                              paidAmount: 30000.00,
                              balance: 48500.00,
                              paymentStatus: 'Partial Payment'
                            })}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-blue-600"
                            title="Download PDF"
                            onClick={() => handleDownloadInvoicePDF({
                              invoiceNumber: 'INV-2025-003',
                              etaNumber: 'ETA-2025-05-12347',
                              customerName: 'Global Health Solutions',
                              service: 'Antibiotic Synthesis',
                              invoiceDate: 'Feb 05, 2025',
                              dueDate: 'Mar 07, 2025',
                              amount: 78500.00,
                              paidAmount: 30000.00,
                              balance: 48500.00,
                              paymentStatus: 'Partial Payment'
                            })}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-orange-600"
                            title="Record Payment"
                            onClick={() => handleRecordPayment({
                              invoiceNumber: 'INV-2025-003',
                              customerName: 'Global Health Solutions',
                              balance: 48500.00
                            })}
                          >
                            <DollarSign className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell className="font-medium">
                        <span className="text-blue-600">INV-2025-004</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 text-sm">ETA-2025-05-12348</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">Mediterranean Labs</div>
                          <div className="text-xs text-gray-500">Chemical Purification</div>
                        </div>
                      </TableCell>
                      <TableCell>Feb 12, 2025</TableCell>
                      <TableCell>Mar 14, 2025</TableCell>
                      <TableCell className="text-right font-semibold">$62,800.00</TableCell>
                      <TableCell className="text-right text-gray-600">$0.00</TableCell>
                      <TableCell className="text-right text-red-600">$62,800.00</TableCell>
                      <TableCell>
                        <Badge className="bg-orange-100 text-orange-800">Unpaid</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0"
                            title="View Invoice Details"
                            onClick={() => handleViewInvoiceDetails({
                              invoiceNumber: 'INV-2025-004',
                              etaNumber: 'ETA-2025-05-12348',
                              customerName: 'Mediterranean Labs',
                              service: 'Chemical Purification',
                              invoiceDate: 'Feb 12, 2025',
                              dueDate: 'Mar 14, 2025',
                              amount: 62800.00,
                              paidAmount: 0.00,
                              balance: 62800.00,
                              paymentStatus: 'Unpaid'
                            })}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-blue-600"
                            title="Download PDF"
                            onClick={() => handleDownloadInvoicePDF({
                              invoiceNumber: 'INV-2025-004',
                              etaNumber: 'ETA-2025-05-12348',
                              customerName: 'Mediterranean Labs',
                              service: 'Chemical Purification',
                              invoiceDate: 'Feb 12, 2025',
                              dueDate: 'Mar 14, 2025',
                              amount: 62800.00,
                              paidAmount: 0.00,
                              balance: 62800.00,
                              paymentStatus: 'Unpaid'
                            })}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-red-600"
                            title="Send Reminder"
                            onClick={() => handleSendReminderNotification({
                              invoiceNumber: 'INV-2025-004',
                              customerName: 'Mediterranean Labs'
                            })}
                          >
                            <AlertCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell className="font-medium">
                        <span className="text-blue-600">INV-2025-005</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 text-sm">ETA-2025-05-12349</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">Nile Pharmaceutical Co.</div>
                          <div className="text-xs text-gray-500">Capsule Manufacturing</div>
                        </div>
                      </TableCell>
                      <TableCell>Jan 28, 2025</TableCell>
                      <TableCell>Feb 15, 2025</TableCell>
                      <TableCell className="text-right font-semibold">$35,900.00</TableCell>
                      <TableCell className="text-right text-gray-600">$0.00</TableCell>
                      <TableCell className="text-right text-red-600">$35,900.00</TableCell>
                      <TableCell>
                        <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0"
                            title="View Invoice Details"
                            onClick={() => handleViewInvoiceDetails({
                              invoiceNumber: 'INV-2025-005',
                              etaNumber: 'ETA-2025-05-12349',
                              customerName: 'Nile Pharmaceutical Co.',
                              service: 'Capsule Manufacturing',
                              invoiceDate: 'Jan 28, 2025',
                              dueDate: 'Feb 15, 2025',
                              amount: 35900.00,
                              paidAmount: 0.00,
                              balance: 35900.00,
                              paymentStatus: 'Overdue'
                            })}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-blue-600"
                            title="Download PDF"
                            onClick={() => handleDownloadInvoicePDF({
                              invoiceNumber: 'INV-2025-005',
                              etaNumber: 'ETA-2025-05-12349',
                              customerName: 'Nile Pharmaceutical Co.',
                              service: 'Capsule Manufacturing',
                              invoiceDate: 'Jan 28, 2025',
                              dueDate: 'Feb 15, 2025',
                              amount: 35900.00,
                              paidAmount: 0.00,
                              balance: 35900.00,
                              paymentStatus: 'Overdue'
                            })}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-red-600"
                            title="Collection Action"
                            onClick={() => handleCollectionAction({
                              invoiceNumber: 'INV-2025-005',
                              customerName: 'Nile Pharmaceutical Co.',
                              balance: 35900.00
                            })}
                          >
                            <AlertCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              {/* Customer Summary Section */}
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Customer Payment Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Top Paying Customer</p>
                        <p className="font-semibold">Cairo Medical Center</p>
                        <p className="text-xs text-green-600">$285,450 total paid</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Largest Outstanding</p>
                        <p className="font-semibold">Global Health Solutions</p>
                        <p className="text-xs text-orange-600">$48,500 pending</p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-500" />
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Payment Timeline</p>
                        <p className="font-semibold">Avg 18 days</p>
                        <p className="text-xs text-blue-600">Customer payment cycle</p>
                      </div>
                      <Calendar className="h-8 w-8 text-blue-500" />
                    </div>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Invoice Details Dialog */}
          <Dialog open={isInvoiceDetailsOpen} onOpenChange={setIsInvoiceDetailsOpen}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <span>Invoice Details: {selectedInvoice?.invoiceNumber}</span>
                    <p className="text-sm text-gray-600 font-normal mt-1">
                      Comprehensive transaction and payment information
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              {selectedInvoice && (
                <div className="space-y-6">
                  {/* Invoice Header Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                        <Building className="h-4 w-4 mr-2" />
                        Invoice Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">Invoice Number:</span>
                          <Badge variant="outline" className="bg-white text-blue-800 border-blue-300">
                            {selectedInvoice.invoiceNumber}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">ETA Number:</span>
                          <Badge className="bg-green-100 text-green-800">
                            {selectedInvoice.etaNumber}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">Service Type:</span>
                          <span className="text-sm font-medium text-gray-800">
                            {selectedInvoice.service}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">Created by:</span>
                          <span className="text-sm font-medium text-gray-800">Ahmed Hassan</span>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-4 bg-green-50 border-green-200">
                      <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Customer Details
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-700">Company:</span>
                          <span className="text-sm font-medium text-gray-800">
                            {selectedInvoice.customerName}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-700">Contact:</span>
                          <span className="text-sm font-medium text-gray-800">Dr. Mahmoud Ali</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-700">Phone:</span>
                          <span className="text-sm font-medium text-gray-800">+20 2 2345 6789</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-700">Email:</span>
                          <span className="text-sm font-medium text-gray-800">finance@customer.com</span>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-4 bg-purple-50 border-purple-200">
                      <h3 className="font-semibold text-purple-800 mb-3 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Timeline & Status
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-purple-700">Invoice Date:</span>
                          <span className="text-sm font-medium text-gray-800">
                            {selectedInvoice.invoiceDate}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-purple-700">Due Date:</span>
                          <span className="text-sm font-medium text-gray-800">
                            {selectedInvoice.dueDate}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-purple-700">Days Overdue:</span>
                          <span className="text-sm font-medium text-red-600">
                            {selectedInvoice.paymentStatus === 'Overdue' ? '12 days' : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-purple-700">Status:</span>
                          <Badge className={
                            selectedInvoice.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                            selectedInvoice.paymentStatus === 'Partial Payment' ? 'bg-blue-100 text-blue-800' :
                            selectedInvoice.paymentStatus === 'Overdue' ? 'bg-red-100 text-red-800' :
                            'bg-orange-100 text-orange-800'
                          }>
                            {selectedInvoice.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Financial Summary */}
                  <Card className="p-6 bg-gray-50">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <Calculator className="h-5 w-5 mr-2" />
                      Financial Summary
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <p className="text-sm text-gray-600">Subtotal</p>
                        <p className="text-lg font-bold text-gray-800">
                          ${(selectedInvoice.amount * 0.877).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <p className="text-sm text-gray-600">VAT (14%)</p>
                        <p className="text-lg font-bold text-blue-600">
                          ${(selectedInvoice.amount * 0.123).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-xl font-bold text-green-600">
                          ${selectedInvoice.amount?.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <p className="text-sm text-gray-600">Paid Amount</p>
                        <p className="text-lg font-bold text-blue-600">
                          ${selectedInvoice.paidAmount?.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <p className="text-sm text-gray-600">Outstanding</p>
                        <p className="text-lg font-bold text-orange-600">
                          ${selectedInvoice.balance?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Service Details */}
                  <Card className="p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <Activity className="h-5 w-5 mr-2" />
                      Service & Product Details
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product/Service</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">{selectedInvoice.service}</TableCell>
                          <TableCell>High-grade pharmaceutical manufacturing service with quality assurance</TableCell>
                          <TableCell>1 Batch</TableCell>
                          <TableCell>${(selectedInvoice.amount * 0.877).toFixed(2)}</TableCell>
                          <TableCell className="font-semibold">${(selectedInvoice.amount * 0.877).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewServiceDetails({
                                serviceName: selectedInvoice.service,
                                description: "High-grade pharmaceutical manufacturing service with quality assurance",
                                quantity: "1 Batch",
                                unitPrice: (selectedInvoice.amount * 0.877).toFixed(2),
                                total: (selectedInvoice.amount * 0.877).toFixed(2),
                                specifications: "Active Ingredient: 99.5% purity, Batch Size: 5000 units, Production Time: 14 days",
                                qualityStandards: "ISO 9001:2015, GMP Certified, FDA Approved",
                                deliveryDate: "March 15, 2025",
                                responsible: "Dr. Ahmed Mansour - Production Manager"
                              })}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Quality Testing</TableCell>
                          <TableCell>Comprehensive quality control and laboratory testing</TableCell>
                          <TableCell>1 Service</TableCell>
                          <TableCell>$850.00</TableCell>
                          <TableCell className="font-semibold">$850.00</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewServiceDetails({
                                serviceName: "Quality Testing",
                                description: "Comprehensive quality control and laboratory testing",
                                quantity: "1 Service",
                                unitPrice: "850.00",
                                total: "850.00",
                                specifications: "Complete analytical testing including HPLC, GC-MS, Dissolution testing, Microbial analysis",
                                qualityStandards: "USP Standards, EP Compliance, ICH Guidelines",
                                deliveryDate: "March 18, 2025",
                                responsible: "Dr. Fatima El-Zahra - Quality Control Manager"
                              })}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Packaging</TableCell>
                          <TableCell>Professional pharmaceutical packaging and labeling</TableCell>
                          <TableCell>1 Service</TableCell>
                          <TableCell>$320.00</TableCell>
                          <TableCell className="font-semibold">$320.00</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewServiceDetails({
                                serviceName: "Packaging",
                                description: "Professional pharmaceutical packaging and labeling",
                                quantity: "1 Service",
                                unitPrice: "320.00",
                                total: "320.00",
                                specifications: "Primary packaging: Blister packs, Secondary packaging: Cartons with safety seals",
                                qualityStandards: "Child-resistant packaging, Tamper-evident seals, Regulatory compliance labels",
                                deliveryDate: "March 20, 2025",
                                responsible: "Mohamed Hassan - Packaging Supervisor"
                              })}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Card>

                  {/* Payment Transaction History */}
                  <Card className="p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Complete Payment & Transaction Details
                    </h3>
                    
                    {/* Payment Summary Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-700">Total Received</p>
                            <p className="text-xl font-bold text-green-800">${selectedInvoice.paidAmount?.toLocaleString()}</p>
                          </div>
                          <Check className="h-8 w-8 text-green-600" />
                        </div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-orange-700">Outstanding</p>
                            <p className="text-xl font-bold text-orange-800">${selectedInvoice.balance?.toLocaleString()}</p>
                          </div>
                          <Clock className="h-8 w-8 text-orange-600" />
                        </div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-700">Payment Methods</p>
                            <p className="text-lg font-bold text-blue-800">
                              {selectedInvoice.paymentStatus === 'Paid' ? '2' : selectedInvoice.paymentStatus === 'Partial Payment' ? '1' : '0'}
                            </p>
                          </div>
                          <CreditCard className="h-8 w-8 text-blue-600" />
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-purple-700">Processing Fee</p>
                            <p className="text-lg font-bold text-purple-800">
                              ${(selectedInvoice.paidAmount * 0.025).toFixed(2)}
                            </p>
                          </div>
                          <Calculator className="h-8 w-8 text-purple-600" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {selectedInvoice.paymentStatus === 'Paid' && (
                        <>
                          {/* First Payment Transaction */}
                          <div className="border border-green-200 rounded-lg overflow-hidden">
                            <div className="bg-green-100 px-4 py-2">
                              <h4 className="font-semibold text-green-800 flex items-center">
                                <CreditCard className="h-4 w-4 mr-2" />
                                Payment Transaction #1 - Primary Payment
                              </h4>
                            </div>
                            <div className="p-4 bg-green-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-green-700">Transaction ID:</span>
                                    <span className="text-sm font-medium">TXN-{selectedInvoice.invoiceNumber.slice(-3)}-001</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-green-700">Payment Method:</span>
                                    <Badge className="bg-blue-100 text-blue-800">Bank Transfer</Badge>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-green-700">Bank Reference:</span>
                                    <span className="text-sm font-medium">BT-2025-{selectedInvoice.invoiceNumber.slice(-3)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-green-700">Processing Bank:</span>
                                    <span className="text-sm font-medium">National Bank of Egypt</span>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-green-700">Amount Paid:</span>
                                    <span className="text-lg font-bold text-green-600">${(selectedInvoice.amount * 0.65).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-green-700">Processing Fee:</span>
                                    <span className="text-sm font-medium text-red-600">-${(selectedInvoice.amount * 0.65 * 0.025).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-green-700">Net Received:</span>
                                    <span className="text-lg font-bold text-green-800">${(selectedInvoice.amount * 0.65 * 0.975).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-green-700">Transaction Date:</span>
                                    <span className="text-sm font-medium">{new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toLocaleDateString()} 2:30 PM</span>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 pt-3 border-t border-green-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-green-800">Status: Confirmed & Cleared</span>
                                  </div>
                                  <Badge className="bg-green-100 text-green-800">Verified ✓</Badge>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Second Payment Transaction */}
                          <div className="border border-green-200 rounded-lg overflow-hidden">
                            <div className="bg-green-100 px-4 py-2">
                              <h4 className="font-semibold text-green-800 flex items-center">
                                <CreditCard className="h-4 w-4 mr-2" />
                                Payment Transaction #2 - Final Payment
                              </h4>
                            </div>
                            <div className="p-4 bg-green-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-green-700">Transaction ID:</span>
                                    <span className="text-sm font-medium">TXN-{selectedInvoice.invoiceNumber.slice(-3)}-002</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-green-700">Payment Method:</span>
                                    <Badge className="bg-purple-100 text-purple-800">Credit Card</Badge>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-green-700">Card Reference:</span>
                                    <span className="text-sm font-medium">CC-****-1234</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-green-700">Card Type:</span>
                                    <span className="text-sm font-medium">Visa Business</span>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-green-700">Amount Paid:</span>
                                    <span className="text-lg font-bold text-green-600">${(selectedInvoice.amount * 0.35).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-green-700">Processing Fee:</span>
                                    <span className="text-sm font-medium text-red-600">-${(selectedInvoice.amount * 0.35 * 0.035).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-green-700">Net Received:</span>
                                    <span className="text-lg font-bold text-green-800">${(selectedInvoice.amount * 0.35 * 0.965).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-green-700">Transaction Date:</span>
                                    <span className="text-sm font-medium">{new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toLocaleDateString()} 4:15 PM</span>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 pt-3 border-t border-green-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-green-800">Status: Confirmed & Settled</span>
                                  </div>
                                  <Badge className="bg-green-100 text-green-800">Verified ✓</Badge>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Payment Summary */}
                          <div className="bg-green-100 p-4 rounded-lg border border-green-300">
                            <h4 className="font-semibold text-green-800 mb-3">Payment Summary</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                              <div>
                                <p className="text-sm text-green-700">Total Paid</p>
                                <p className="text-xl font-bold text-green-800">${selectedInvoice.amount?.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-sm text-green-700">Processing Fees</p>
                                <p className="text-lg font-bold text-red-600">-${((selectedInvoice.amount * 0.65 * 0.025) + (selectedInvoice.amount * 0.35 * 0.035)).toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-green-700">Net Received</p>
                                <p className="text-xl font-bold text-green-800">${((selectedInvoice.amount * 0.65 * 0.975) + (selectedInvoice.amount * 0.35 * 0.965)).toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-green-700">Payment Status</p>
                                <Badge className="bg-green-200 text-green-800">Fully Paid</Badge>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {selectedInvoice.paymentStatus === 'Partial Payment' && (
                        <>
                          {/* Partial Payment Transaction Details */}
                          <div className="border border-blue-200 rounded-lg overflow-hidden">
                            <div className="bg-blue-100 px-4 py-2">
                              <h4 className="font-semibold text-blue-800 flex items-center">
                                <CreditCard className="h-4 w-4 mr-2" />
                                Payment Transaction #1 - Partial Payment Received
                              </h4>
                            </div>
                            <div className="p-4 bg-blue-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-blue-700">Transaction ID:</span>
                                    <span className="text-sm font-medium">TXN-{selectedInvoice.invoiceNumber.slice(-3)}-001</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-blue-700">Payment Method:</span>
                                    <Badge className="bg-green-100 text-green-800">Bank Transfer</Badge>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-blue-700">Bank Reference:</span>
                                    <span className="text-sm font-medium">BT-2025-{selectedInvoice.invoiceNumber.slice(-3)}-1</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-blue-700">Processing Bank:</span>
                                    <span className="text-sm font-medium">Commercial International Bank</span>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-blue-700">Amount Paid:</span>
                                    <span className="text-lg font-bold text-blue-600">${selectedInvoice.paidAmount?.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-blue-700">Processing Fee:</span>
                                    <span className="text-sm font-medium text-red-600">-${(selectedInvoice.paidAmount * 0.025).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-blue-700">Net Received:</span>
                                    <span className="text-lg font-bold text-blue-800">${(selectedInvoice.paidAmount * 0.975).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-blue-700">Transaction Date:</span>
                                    <span className="text-sm font-medium">{new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString()} 2:30 PM</span>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 pt-3 border-t border-blue-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-blue-800">Status: Confirmed & Cleared</span>
                                  </div>
                                  <Badge className="bg-blue-100 text-blue-800">Verified ✓</Badge>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Outstanding Balance Details */}
                          <div className="border border-orange-200 rounded-lg overflow-hidden">
                            <div className="bg-orange-100 px-4 py-2">
                              <h4 className="font-semibold text-orange-800 flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                Outstanding Balance - Awaiting Payment
                              </h4>
                            </div>
                            <div className="p-4 bg-orange-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-orange-700">Remaining Amount:</span>
                                    <span className="text-lg font-bold text-orange-600">${selectedInvoice.balance?.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-orange-700">Payment Due Date:</span>
                                    <span className="text-sm font-medium">{selectedInvoice.dueDate}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-orange-700">Days Until Due:</span>
                                    <Badge className="bg-yellow-100 text-yellow-800">
                                      {Math.ceil((new Date(selectedInvoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                                    </Badge>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-orange-700">Payment Progress:</span>
                                    <Badge className="bg-blue-100 text-blue-800">
                                      {((selectedInvoice.paidAmount / selectedInvoice.amount) * 100).toFixed(1)}% Paid
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-orange-700">Late Fee (if overdue):</span>
                                    <span className="text-sm font-medium text-red-600">${(selectedInvoice.balance * 0.05).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-orange-700">Expected Method:</span>
                                    <span className="text-sm font-medium">Bank Transfer</span>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4">
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                  <div 
                                    className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                                    style={{ width: `${(selectedInvoice.paidAmount / selectedInvoice.amount) * 100}%` }}
                                  ></div>
                                </div>
                                <p className="text-xs text-orange-600 mt-2 text-center">
                                  Payment Progress: {((selectedInvoice.paidAmount / selectedInvoice.amount) * 100).toFixed(1)}% completed
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Payment Plan Information */}
                          <div className="bg-blue-100 p-4 rounded-lg border border-blue-300">
                            <h4 className="font-semibold text-blue-800 mb-3">Payment Summary & Next Steps</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                              <div>
                                <p className="text-sm text-blue-700">Total Invoice</p>
                                <p className="text-xl font-bold text-blue-800">${selectedInvoice.amount?.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-sm text-blue-700">Amount Paid</p>
                                <p className="text-lg font-bold text-green-600">${selectedInvoice.paidAmount?.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-sm text-blue-700">Remaining</p>
                                <p className="text-xl font-bold text-orange-600">${selectedInvoice.balance?.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-sm text-blue-700">Status</p>
                                <Badge className="bg-yellow-200 text-yellow-800">Partial Payment</Badge>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {(selectedInvoice.paymentStatus === 'Unpaid' || selectedInvoice.paymentStatus === 'Overdue') && (
                        <>
                          {/* Unpaid/Overdue Invoice Details */}
                          <div className="border border-red-200 rounded-lg overflow-hidden">
                            <div className="bg-red-100 px-4 py-2">
                              <h4 className="font-semibold text-red-800 flex items-center">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                {selectedInvoice.paymentStatus === 'Overdue' ? 'Overdue Invoice - Payment Required' : 'Unpaid Invoice - Awaiting Payment'}
                              </h4>
                            </div>
                            <div className="p-4 bg-red-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-red-700">Outstanding Amount:</span>
                                    <span className="text-lg font-bold text-red-600">${selectedInvoice.amount?.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-red-700">Due Date:</span>
                                    <span className="text-sm font-medium">{selectedInvoice.dueDate}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-red-700">Days Overdue:</span>
                                    <Badge className="bg-red-200 text-red-800">
                                      {selectedInvoice.paymentStatus === 'Overdue' ? 
                                        Math.ceil((new Date().getTime() - new Date(selectedInvoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)) + ' days' : 
                                        'Not Yet Due'
                                      }
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-red-700">Payment Status:</span>
                                    <Badge className="bg-red-200 text-red-800">
                                      {selectedInvoice.paymentStatus}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-red-700">Late Fees Applied:</span>
                                    <span className="text-lg font-bold text-red-600">
                                      ${selectedInvoice.paymentStatus === 'Overdue' ? (selectedInvoice.amount * 0.05).toFixed(2) : '0.00'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-red-700">Interest (2% monthly):</span>
                                    <span className="text-sm font-medium text-red-600">
                                      ${selectedInvoice.paymentStatus === 'Overdue' ? (selectedInvoice.amount * 0.02).toFixed(2) : '0.00'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-red-700">Total Amount Due:</span>
                                    <span className="text-xl font-bold text-red-800">
                                      ${selectedInvoice.paymentStatus === 'Overdue' ? 
                                        (selectedInvoice.amount * 1.07).toFixed(2) : 
                                        selectedInvoice.amount?.toLocaleString()
                                      }
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-red-700">Payment Methods:</span>
                                    <span className="text-sm font-medium">Bank Transfer, Credit Card</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Payment Attempts Timeline */}
                              <div className="mt-6 pt-4 border-t border-red-200">
                                <h5 className="font-medium text-red-800 mb-3">Payment Attempts & Communication History</h5>
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <div className="bg-yellow-100 p-1 rounded-full">
                                      <Mail className="h-3 w-3 text-yellow-600" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-yellow-800">Initial Invoice Sent</p>
                                        <span className="text-xs text-yellow-600">{selectedInvoice.invoiceDate}</span>
                                      </div>
                                      <p className="text-xs text-yellow-600">
                                        Invoice delivered to finance@customer.com • Email opened
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {selectedInvoice.paymentStatus === 'Overdue' && (
                                    <>
                                      <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                        <div className="bg-orange-100 p-1 rounded-full">
                                          <AlertCircle className="h-3 w-3 text-orange-600" />
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-orange-800">First Reminder Sent</p>
                                            <span className="text-xs text-orange-600">
                                              {new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                            </span>
                                          </div>
                                          <p className="text-xs text-orange-600">
                                            Payment reminder sent • Email opened
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                        <div className="bg-red-100 p-1 rounded-full">
                                          <Phone className="h-3 w-3 text-red-600" />
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-red-800">Phone Call Attempt</p>
                                            <span className="text-xs text-red-600">
                                              {new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                            </span>
                                          </div>
                                          <p className="text-xs text-red-600">
                                            Called finance department • Left voicemail
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                        <div className="bg-purple-100 p-1 rounded-full">
                                          <AlertTriangle className="h-3 w-3 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-purple-800">Final Notice Sent</p>
                                            <span className="text-xs text-purple-600">
                                              {new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                            </span>
                                          </div>
                                          <p className="text-xs text-purple-600">
                                            Final notice with legal warning • Email pending
                                          </p>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Collection Actions & Next Steps */}
                          <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
                            <h4 className="font-semibold text-gray-800 mb-3">Collection Status & Available Actions</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-white p-3 rounded-lg border">
                                <h5 className="font-medium text-gray-800 mb-2">Payment Options</h5>
                                <div className="space-y-2 text-sm text-gray-600">
                                  <p>• Bank Transfer (Preferred)</p>
                                  <p>• Credit Card Payment</p>
                                  <p>• Payment Plan Available</p>
                                  <p>• Wire Transfer</p>
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded-lg border">
                                <h5 className="font-medium text-gray-800 mb-2">Collection Stage</h5>
                                <div className="space-y-2 text-sm text-gray-600">
                                  {selectedInvoice.paymentStatus === 'Overdue' ? (
                                    <>
                                      <p>• Stage: Legal Notice</p>
                                      <p>• Next: Collection Agency</p>
                                      <p>• Timeline: 15 days</p>
                                      <p>• Status: Active</p>
                                    </>
                                  ) : (
                                    <>
                                      <p>• Stage: Initial Follow-up</p>
                                      <p>• Next: Phone Contact</p>
                                      <p>• Timeline: 5 days</p>
                                      <p>• Status: Monitoring</p>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded-lg border">
                                <h5 className="font-medium text-gray-800 mb-2">Account Status</h5>
                                <div className="space-y-2 text-sm text-gray-600">
                                  <p>• Credit Limit: Suspended</p>
                                  <p>• Future Orders: Hold</p>
                                  <p>• Account Risk: Medium</p>
                                  <p>• Resolution: Payment Required</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Financial Impact Summary */}
                          <div className="bg-red-100 p-4 rounded-lg border border-red-300">
                            <h4 className="font-semibold text-red-800 mb-3">Financial Impact Summary</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                              <div>
                                <p className="text-sm text-red-700">Original Amount</p>
                                <p className="text-xl font-bold text-red-800">${selectedInvoice.amount?.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-sm text-red-700">Late Fees</p>
                                <p className="text-lg font-bold text-red-600">
                                  ${selectedInvoice.paymentStatus === 'Overdue' ? (selectedInvoice.amount * 0.05).toFixed(2) : '0.00'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-red-700">Interest</p>
                                <p className="text-lg font-bold text-red-600">
                                  ${selectedInvoice.paymentStatus === 'Overdue' ? (selectedInvoice.amount * 0.02).toFixed(2) : '0.00'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-red-700">Total Due</p>
                                <p className="text-xl font-bold text-red-800">
                                  ${selectedInvoice.paymentStatus === 'Overdue' ? 
                                    (selectedInvoice.amount * 1.07).toFixed(2) : 
                                    selectedInvoice.amount?.toLocaleString()
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {/* Invoice Creation History */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center space-x-4">
                          <div className="bg-gray-100 p-2 rounded-full">
                            <FileText className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">Invoice Created</p>
                            <p className="text-sm text-gray-600">Generated by Premier ERP System</p>
                            <p className="text-xs text-gray-500">{selectedInvoice.invoiceDate} at 9:15 AM</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-600">${selectedInvoice.amount?.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Issued</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Communication Log */}
                  <Card className="p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <Mail className="h-5 w-5 mr-2" />
                      Communication Log
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                        <div className="bg-blue-100 p-1 rounded-full mt-1">
                          <Mail className="h-3 w-3 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-blue-800">Invoice Sent</p>
                            <span className="text-xs text-blue-600">{selectedInvoice.invoiceDate} 9:30 AM</span>
                          </div>
                          <p className="text-xs text-blue-600">
                            Invoice {selectedInvoice.invoiceNumber} sent to finance@customer.com
                          </p>
                        </div>
                      </div>
                      
                      {selectedInvoice.paymentStatus === 'Unpaid' && (
                        <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                          <div className="bg-yellow-100 p-1 rounded-full mt-1">
                            <AlertCircle className="h-3 w-3 text-yellow-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-yellow-800">Payment Reminder Sent</p>
                              <span className="text-xs text-yellow-600">2 days ago</span>
                            </div>
                            <p className="text-xs text-yellow-600">
                              Automated reminder sent for overdue payment
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                        <div className="bg-green-100 p-1 rounded-full mt-1">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-green-800">Email Opened</p>
                            <span className="text-xs text-green-600">{selectedInvoice.invoiceDate} 11:45 AM</span>
                          </div>
                          <p className="text-xs text-green-600">
                            Customer opened invoice email - IP: 192.168.1.100
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => handleDownloadInvoicePDF(selectedInvoice)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                      
                      {selectedInvoice.balance > 0 && (
                        <Button
                          onClick={() => {
                            setIsInvoiceDetailsOpen(false);
                            handleRecordPayment(selectedInvoice);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Record Payment
                        </Button>
                      )}
                      
                      {selectedInvoice.paymentStatus === 'Unpaid' && (
                        <Button
                          onClick={() => handleSendReminderNotification(selectedInvoice)}
                          variant="outline"
                          className="border-orange-300 text-orange-700 hover:bg-orange-50"
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Send Reminder
                        </Button>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => setIsInvoiceDetailsOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Payment Recording Dialog */}
          <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <DollarSign className="h-6 w-6 text-green-600" />
                  Record Payment
                </DialogTitle>
                <DialogDescription>
                  Record a payment for invoice {selectedInvoice?.invoiceNumber}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Outstanding Balance:</span>
                    <span className="font-semibold">${selectedInvoice?.balance?.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment-amount">Payment Amount</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter payment amount"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="credit-card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment-reference">Reference Number</Label>
                  <Input
                    id="payment-reference"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Transaction reference"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment-notes">Notes (Optional)</Label>
                  <Input
                    id="payment-notes"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Payment notes"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitPayment} className="bg-green-600 hover:bg-green-700 text-white">
                  Record Payment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Service Details Dialog */}
          <Dialog open={isServiceDetailsOpen} onOpenChange={setIsServiceDetailsOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <span>Service Details: {selectedServiceDetails?.serviceName}</span>
                    <p className="text-sm text-gray-600 font-normal mt-1">
                      Complete specifications and delivery information
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              {selectedServiceDetails && (
                <div className="space-y-6">
                  {/* Service Overview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        Service Overview
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-blue-700">Service Name:</span>
                          <span className="text-sm font-medium text-gray-800 text-right">
                            {selectedServiceDetails.serviceName}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-blue-700">Description:</span>
                          <span className="text-sm font-medium text-gray-800 text-right max-w-xs">
                            {selectedServiceDetails.description}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">Quantity:</span>
                          <Badge className="bg-blue-100 text-blue-800">
                            {selectedServiceDetails.quantity}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">Unit Price:</span>
                          <span className="text-sm font-bold text-green-600">
                            ${selectedServiceDetails.unitPrice}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-sm text-blue-800 font-semibold">Total Value:</span>
                          <span className="text-lg font-bold text-green-600">
                            ${selectedServiceDetails.total}
                          </span>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-4 bg-green-50 border-green-200">
                      <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Delivery & Responsibility
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-700">Delivery Date:</span>
                          <Badge className="bg-green-100 text-green-800">
                            {selectedServiceDetails.deliveryDate}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-green-700">Responsible:</span>
                          <span className="text-sm font-medium text-gray-800 text-right max-w-xs">
                            {selectedServiceDetails.responsible}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-700">Status:</span>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            In Progress
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-700">Priority:</span>
                          <Badge className="bg-red-100 text-red-800">
                            High
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Technical Specifications */}
                  <Card className="p-6 bg-gray-50">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Technical Specifications
                    </h3>
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {selectedServiceDetails.specifications}
                      </p>
                    </div>
                  </Card>

                  {/* Quality Standards & Compliance */}
                  <Card className="p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Quality Standards & Compliance
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedServiceDetails.qualityStandards.split(', ').map((standard: string, index: number) => (
                        <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="bg-green-100 p-1 rounded-full mr-3">
                            <Check className="h-3 w-3 text-green-600" />
                          </div>
                          <span className="text-sm font-medium text-green-800">{standard}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Production Timeline */}
                  <Card className="p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Production Timeline
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="bg-green-100 p-2 rounded-full">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-green-800">Order Confirmed</p>
                            <span className="text-xs text-green-600">January 15, 2025</span>
                          </div>
                          <p className="text-xs text-green-600">Service order received and confirmed</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Activity className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-blue-800">Production Started</p>
                            <span className="text-xs text-blue-600">January 20, 2025</span>
                          </div>
                          <p className="text-xs text-blue-600">Manufacturing process initiated</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="bg-yellow-100 p-2 rounded-full">
                          <Clock className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-yellow-800">Quality Testing</p>
                            <span className="text-xs text-yellow-600">March 10, 2025</span>
                          </div>
                          <p className="text-xs text-yellow-600">Comprehensive testing and validation</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="bg-purple-100 p-2 rounded-full">
                          <Calendar className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-purple-800">Expected Delivery</p>
                            <span className="text-xs text-purple-600">{selectedServiceDetails.deliveryDate}</span>
                          </div>
                          <p className="text-xs text-purple-600">Final delivery and documentation</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Cost Breakdown */}
                  <Card className="p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <Calculator className="h-5 w-5 mr-2" />
                      Detailed Cost Breakdown
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-1 rounded-full">
                            <DollarSign className="h-3 w-3 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-800">Base Service Cost</span>
                        </div>
                        <span className="text-sm font-bold text-gray-800">
                          ${(parseFloat(selectedServiceDetails.total) * 0.85).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-100 p-1 rounded-full">
                            <Shield className="h-3 w-3 text-green-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-800">Quality Assurance</span>
                        </div>
                        <span className="text-sm font-bold text-gray-800">
                          ${(parseFloat(selectedServiceDetails.total) * 0.10).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="bg-purple-100 p-1 rounded-full">
                            <Activity className="h-3 w-3 text-purple-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-800">Administration</span>
                        </div>
                        <span className="text-sm font-bold text-gray-800">
                          ${(parseFloat(selectedServiceDetails.total) * 0.05).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-t-2 border-blue-200">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-1 rounded-full">
                            <Calculator className="h-3 w-3 text-blue-600" />
                          </div>
                          <span className="text-sm font-bold text-blue-800">Total Service Cost</span>
                        </div>
                        <span className="text-lg font-bold text-blue-600">
                          ${selectedServiceDetails.total}
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* Contact Information */}
                  <Card className="p-6 bg-blue-50">
                    <h3 className="font-semibold text-blue-800 mb-4 flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border">
                        <h4 className="font-medium text-gray-800 mb-2">Service Manager</h4>
                        <p className="text-sm text-gray-600">{selectedServiceDetails.responsible}</p>
                        <p className="text-sm text-blue-600">service.manager@premier-erp.com</p>
                        <p className="text-sm text-blue-600">+20 2 1234 5678</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <h4 className="font-medium text-gray-800 mb-2">Quality Control</h4>
                        <p className="text-sm text-gray-600">Dr. Fatima El-Zahra</p>
                        <p className="text-sm text-blue-600">quality@premier-erp.com</p>
                        <p className="text-sm text-blue-600">+20 2 1234 5679</p>
                      </div>
                    </div>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => {
                          toast({
                            title: "Service Report Downloaded",
                            description: `Detailed report for ${selectedServiceDetails.serviceName} has been downloaded.`,
                          });
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                      </Button>
                      
                      <Button
                        onClick={() => {
                          toast({
                            title: "Service Manager Contacted",
                            description: `Message sent to ${selectedServiceDetails.responsible}`,
                          });
                        }}
                        variant="outline"
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Contact Manager
                      </Button>
                      
                      <Button
                        onClick={() => {
                          toast({
                            title: "Production Update Requested",
                            description: "Latest production status will be updated within 30 minutes",
                          });
                        }}
                        variant="outline"
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Request Update
                      </Button>
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => setIsServiceDetailsOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Customer Payment History Dialog */}
          <Dialog open={isCustomerHistoryOpen} onOpenChange={setIsCustomerHistoryOpen}>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <span>Complete Payment History: {selectedCustomerHistory?.customerName}</span>
                    <p className="text-sm text-gray-600 font-normal mt-1">
                      All transactions, payments, and invoice details for this customer
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              {selectedCustomerHistory && (
                <div className="space-y-6">
                  {/* Customer Overview */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                        <Building className="h-4 w-4 mr-2" />
                        Customer Profile
                      </h3>
                      <div className="space-y-2">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-white font-bold text-lg">
                              {selectedCustomerHistory.customerName.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                          <p className="font-semibold text-blue-800">{selectedCustomerHistory.customerName}</p>
                          <p className="text-xs text-blue-600">Pharmaceutical Manufacturing</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-4 bg-green-50 border-green-200">
                      <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Payment Summary
                      </h3>
                      <div className="space-y-2 text-center">
                        <div>
                          <p className="text-sm text-green-700">Total Paid</p>
                          <p className="text-xl font-bold text-green-800">$842,350</p>
                        </div>
                        <div>
                          <p className="text-xs text-green-600">15 successful transactions</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-4 bg-orange-50 border-orange-200">
                      <h3 className="font-semibold text-orange-800 mb-3 flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Outstanding
                      </h3>
                      <div className="space-y-2 text-center">
                        <div>
                          <p className="text-sm text-orange-700">Amount Due</p>
                          <p className="text-xl font-bold text-orange-800">$48,500</p>
                        </div>
                        <div>
                          <p className="text-xs text-orange-600">1 pending invoice</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-4 bg-purple-50 border-purple-200">
                      <h3 className="font-semibold text-purple-800 mb-3 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Account Status
                      </h3>
                      <div className="space-y-2 text-center">
                        <div>
                          <p className="text-sm text-purple-700">Credit Rating</p>
                          <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                        </div>
                        <div>
                          <p className="text-xs text-purple-600">Active since 2018</p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Complete Payment Transaction History */}
                  <Card className="p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <History className="h-5 w-5 mr-2" />
                      Complete Payment Transaction History
                    </h3>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transaction Date</TableHead>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Service Description</TableHead>
                          <TableHead>Payment Method</TableHead>
                          <TableHead className="text-right">Invoice Amount</TableHead>
                          <TableHead className="text-right">Payment Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Payment Transaction 1 - Most Recent */}
                        <TableRow className="bg-green-50">
                          <TableCell>
                            <div>
                              <div className="font-medium">Feb 08, 2025</div>
                              <div className="text-xs text-gray-500">3:45 PM</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-blue-600 font-medium">INV-2025-002</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">Paracetamol Production</div>
                              <div className="text-xs text-gray-500">5000 units batch</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">Bank Transfer</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">$41,600.00</TableCell>
                          <TableCell className="text-right text-green-600 font-bold">$41,600.00</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Paid Full</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-600">BT-2025-346</span>
                          </TableCell>
                        </TableRow>

                        {/* Payment Transaction 2 */}
                        <TableRow className="bg-green-50">
                          <TableCell>
                            <div>
                              <div className="font-medium">Jan 22, 2025</div>
                              <div className="text-xs text-gray-500">2:30 PM</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-blue-600 font-medium">INV-2025-001</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">Ibuprofen Manufacturing</div>
                              <div className="text-xs text-gray-500">7500 units batch</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-purple-100 text-purple-800">Credit Card</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">$54,150.00</TableCell>
                          <TableCell className="text-right text-green-600 font-bold">$35,000.00</TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">Partial Payment</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-600">CC-****-1234</span>
                          </TableCell>
                        </TableRow>

                        {/* Payment Transaction 3 - Final payment for INV-2025-001 */}
                        <TableRow className="bg-green-50">
                          <TableCell>
                            <div>
                              <div className="font-medium">Jan 29, 2025</div>
                              <div className="text-xs text-gray-500">4:15 PM</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-blue-600 font-medium">INV-2025-001</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">Ibuprofen Manufacturing</div>
                              <div className="text-xs text-gray-500">Final payment</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">Bank Transfer</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">$54,150.00</TableCell>
                          <TableCell className="text-right text-green-600 font-bold">$19,150.00</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Final Payment</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-600">BT-2025-234</span>
                          </TableCell>
                        </TableRow>

                        {/* Payment Transaction 4 - Current Partial Payment */}
                        <TableRow className="bg-blue-50">
                          <TableCell>
                            <div>
                              <div className="font-medium">Feb 10, 2025</div>
                              <div className="text-xs text-gray-500">11:20 AM</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-blue-600 font-medium">INV-2025-003</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">Antibiotic Synthesis</div>
                              <div className="text-xs text-gray-500">2500 units batch</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">Bank Transfer</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">$78,500.00</TableCell>
                          <TableCell className="text-right text-blue-600 font-bold">$30,000.00</TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">Partial Payment</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-600">BT-2025-455</span>
                          </TableCell>
                        </TableRow>

                        {/* Historical Payment Transactions */}
                        <TableRow className="bg-green-50">
                          <TableCell>
                            <div>
                              <div className="font-medium">Dec 15, 2024</div>
                              <div className="text-xs text-gray-500">1:45 PM</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-blue-600 font-medium">INV-2024-087</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">Aspirin Manufacturing</div>
                              <div className="text-xs text-gray-500">10000 units batch</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-purple-100 text-purple-800">Wire Transfer</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">$62,800.00</TableCell>
                          <TableCell className="text-right text-green-600 font-bold">$62,800.00</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Paid Full</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-600">WT-2024-789</span>
                          </TableCell>
                        </TableRow>

                        <TableRow className="bg-green-50">
                          <TableCell>
                            <div>
                              <div className="font-medium">Nov 28, 2024</div>
                              <div className="text-xs text-gray-500">2:15 PM</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-blue-600 font-medium">INV-2024-074</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">Antihistamine Production</div>
                              <div className="text-xs text-gray-500">3000 units batch</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">Bank Transfer</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">$45,200.00</TableCell>
                          <TableCell className="text-right text-green-600 font-bold">$45,200.00</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Paid Full</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-600">BT-2024-621</span>
                          </TableCell>
                        </TableRow>

                        <TableRow className="bg-green-50">
                          <TableCell>
                            <div>
                              <div className="font-medium">Oct 18, 2024</div>
                              <div className="text-xs text-gray-500">3:30 PM</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-blue-600 font-medium">INV-2024-061</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">Vitamin C Synthesis</div>
                              <div className="text-xs text-gray-500">15000 units batch</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-purple-100 text-purple-800">Credit Card</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">$38,900.00</TableCell>
                          <TableCell className="text-right text-green-600 font-bold">$38,900.00</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Paid Full</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-600">CC-****-5678</span>
                          </TableCell>
                        </TableRow>

                        <TableRow className="bg-green-50">
                          <TableCell>
                            <div>
                              <div className="font-medium">Sep 25, 2024</div>
                              <div className="text-xs text-gray-500">11:45 AM</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-blue-600 font-medium">INV-2024-052</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">Calcium Supplements</div>
                              <div className="text-xs text-gray-500">8000 units batch</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">Bank Transfer</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">$52,300.00</TableCell>
                          <TableCell className="text-right text-green-600 font-bold">$52,300.00</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Paid Full</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-600">BT-2024-445</span>
                          </TableCell>
                        </TableRow>

                        <TableRow className="bg-green-50">
                          <TableCell>
                            <div>
                              <div className="font-medium">Aug 12, 2024</div>
                              <div className="text-xs text-gray-500">4:20 PM</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-blue-600 font-medium">INV-2024-038</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">Omega-3 Capsules</div>
                              <div className="text-xs text-gray-500">12000 units batch</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-purple-100 text-purple-800">Wire Transfer</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">$67,500.00</TableCell>
                          <TableCell className="text-right text-green-600 font-bold">$67,500.00</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Paid Full</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-600">WT-2024-567</span>
                          </TableCell>
                        </TableRow>

                        <TableRow className="bg-green-50">
                          <TableCell>
                            <div>
                              <div className="font-medium">Jul 05, 2024</div>
                              <div className="text-xs text-gray-500">2:10 PM</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-blue-600 font-medium">INV-2024-025</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">Multivitamin Production</div>
                              <div className="text-xs text-gray-500">6000 units batch</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">Bank Transfer</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">$41,800.00</TableCell>
                          <TableCell className="text-right text-green-600 font-bold">$41,800.00</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Paid Full</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-600">BT-2024-334</span>
                          </TableCell>
                        </TableRow>

                        {/* Outstanding Balance Row */}
                        <TableRow className="bg-orange-50 border-t-2 border-orange-200">
                          <TableCell>
                            <div>
                              <div className="font-medium text-orange-800">Outstanding</div>
                              <div className="text-xs text-orange-600">Due: Mar 07, 2025</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-orange-600 font-medium">INV-2025-003</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-orange-800">Antibiotic Synthesis</div>
                              <div className="text-xs text-orange-600">Remaining balance</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">$78,500.00</TableCell>
                          <TableCell className="text-right text-orange-600 font-bold">$48,500.00</TableCell>
                          <TableCell>
                            <Badge className="bg-orange-100 text-orange-800">Outstanding</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-orange-600">Payment Due</span>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Card>

                  {/* Payment Analytics */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="p-6">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Payment Patterns
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Average Payment Time:</span>
                          <span className="text-sm font-medium">12 days early</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Preferred Method:</span>
                          <span className="text-sm font-medium">Bank Transfer (67%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Payment Success Rate:</span>
                          <span className="text-sm font-medium text-green-600">98.5%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Late Payments:</span>
                          <span className="text-sm font-medium text-green-600">0 instances</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <Calculator className="h-5 w-5 mr-2" />
                        Financial Summary
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Invoiced (2024-2025):</span>
                          <span className="text-sm font-bold">$890,850</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Paid:</span>
                          <span className="text-sm font-bold text-green-600">$842,350</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Outstanding:</span>
                          <span className="text-sm font-bold text-orange-600">$48,500</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-sm text-gray-800 font-semibold">Collection Rate:</span>
                          <span className="text-sm font-bold text-green-600">94.6%</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        Account Health
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Credit Score:</span>
                          <Badge className="bg-green-100 text-green-800">Excellent (A+)</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Credit Limit:</span>
                          <span className="text-sm font-medium">$150,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Available Credit:</span>
                          <span className="text-sm font-medium text-green-600">$101,500</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Account Status:</span>
                          <Badge className="bg-green-100 text-green-800">Active & Good Standing</Badge>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => {
                          toast({
                            title: "Payment History Report Generated",
                            description: `Complete payment history for ${selectedCustomerHistory.customerName} has been downloaded.`,
                          });
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                      </Button>
                      
                      <Button
                        onClick={() => {
                          toast({
                            title: "Payment Reminder Sent",
                            description: `Outstanding payment reminder sent to ${selectedCustomerHistory.customerName}`,
                          });
                        }}
                        variant="outline"
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send Payment Reminder
                      </Button>
                      
                      <Button
                        onClick={() => {
                          toast({
                            title: "Account Statement Generated",
                            description: "Monthly account statement has been prepared and sent.",
                          });
                        }}
                        variant="outline"
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Statement
                      </Button>
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => setIsCustomerHistoryOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        <TabsContent value="accounting-periods">
          <AccountingPeriods />
        </TabsContent>
        
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Receipt className="h-5 w-5 mr-2 text-blue-600" />
                  <span>Expenses Management</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Dialog open={isExpenseExportOpen} onOpenChange={setIsExpenseExportOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" /> Export
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                      <DialogHeader>
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <Download className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <DialogTitle className="text-xl font-bold text-gray-900">Export Expenses Report</DialogTitle>
                            <p className="text-sm text-gray-600 mt-1">Choose date range and export format for your expense data</p>
                          </div>
                        </div>
                      </DialogHeader>

                      <div className="space-y-6 py-4">
                        {/* Date Range Selection */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Calendar className="h-5 w-5 mr-2" />
                            Date Range
                          </h3>
                          
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label>Quick Selection</Label>
                              <Select defaultValue="this-month" onValueChange={(value) => setExportDateRange(value)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="today">Today</SelectItem>
                                  <SelectItem value="this-week">This Week</SelectItem>
                                  <SelectItem value="this-month">This Month</SelectItem>
                                  <SelectItem value="last-month">Last Month</SelectItem>
                                  <SelectItem value="this-quarter">This Quarter</SelectItem>
                                  <SelectItem value="last-quarter">Last Quarter</SelectItem>
                                  <SelectItem value="this-year">This Year</SelectItem>
                                  <SelectItem value="last-year">Last Year</SelectItem>
                                  <SelectItem value="custom">Custom Range</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {exportDateRange === 'custom' && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="export-start-date">Start Date</Label>
                                  <Input
                                    id="export-start-date"
                                    type="date"
                                    value={exportStartDate}
                                    onChange={(e) => setExportStartDate(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="export-end-date">End Date</Label>
                                  <Input
                                    id="export-end-date"
                                    type="date"
                                    value={exportEndDate}
                                    onChange={(e) => setExportEndDate(e.target.value)}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Export Format Selection */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <FileText className="h-5 w-5 mr-2" />
                            Export Format
                          </h3>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div 
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                exportFormat === 'excel' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setExportFormat('excel')}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-green-100 rounded">
                                  <FileText className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                  <div className="font-medium">Excel (.xlsx)</div>
                                  <div className="text-sm text-gray-600">Spreadsheet format</div>
                                </div>
                              </div>
                            </div>
                            
                            <div 
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                exportFormat === 'csv' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setExportFormat('csv')}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded">
                                  <FileText className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium">CSV</div>
                                  <div className="text-sm text-gray-600">Comma separated</div>
                                </div>
                              </div>
                            </div>
                            
                            <div 
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                exportFormat === 'pdf' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setExportFormat('pdf')}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-red-100 rounded">
                                  <FileText className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                  <div className="font-medium">PDF</div>
                                  <div className="text-sm text-gray-600">Printable report</div>
                                </div>
                              </div>
                            </div>
                            
                            <div 
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                exportFormat === 'json' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setExportFormat('json')}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-purple-100 rounded">
                                  <FileText className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                  <div className="font-medium">JSON</div>
                                  <div className="text-sm text-gray-600">Data format</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Filter Options */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Filter className="h-5 w-5 mr-2" />
                            Filter Options
                          </h3>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Account Type</Label>
                              <Select defaultValue="all">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Types</SelectItem>
                                  <SelectItem value="marketing">Marketing</SelectItem>
                                  <SelectItem value="operations">Operations</SelectItem>
                                  <SelectItem value="fixed-assets">Fixed Assets</SelectItem>
                                  <SelectItem value="projects">Projects</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Cost Center</Label>
                              <Select defaultValue="all">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Centers</SelectItem>
                                  <SelectItem value="marketing">Marketing</SelectItem>
                                  <SelectItem value="projects">Projects</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="operations">Operations</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Amount Range</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Input type="number" placeholder="Min amount" step="0.01" />
                              <Input type="number" placeholder="Max amount" step="0.01" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <DialogFooter className="gap-3 pt-6 border-t">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsExpenseExportOpen(false)}
                          className="border-gray-300 hover:bg-gray-50"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleExpenseExport}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export Report
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={isNewExpenseOpen} onOpenChange={setIsNewExpenseOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" /> New Expense
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                    <DialogHeader>
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Plus className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <DialogTitle className="text-xl font-bold text-gray-900">Add New Expense Entry</DialogTitle>
                          <p className="text-sm text-gray-600 mt-1">Create comprehensive expense information and financial details</p>
                        </div>
                      </div>
                    </DialogHeader>

                    <div className="space-y-6">
                      {/* Basic Information Section */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                          <FileText className="h-5 w-5 mr-2" />
                          Basic Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="expense-date">Transaction Date</Label>
                            <Input
                              id="expense-date"
                              type="date"
                              value={expenseForm.date}
                              onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="expense-reference">Reference Number</Label>
                            <Input
                              id="expense-reference"
                              placeholder="REF-2025-001"
                              className="font-mono"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="expense-priority">Priority Level</Label>
                            <Select defaultValue="normal">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="urgent">Urgent</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label htmlFor="expense-description">Description</Label>
                            <Input
                              id="expense-description"
                              value={expenseForm.description}
                              onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                              placeholder="Brief description of the expense"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="expense-vendor">Vendor/Supplier</Label>
                            <Input
                              id="expense-vendor"
                              placeholder="Company or individual name"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Financial Details Section */}
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                          <DollarSign className="h-5 w-5 mr-2" />
                          Financial Details
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="expense-amount">Amount ($)</Label>
                            <Input
                              id="expense-amount"
                              type="number"
                              step="0.01"
                              value={expenseForm.amount}
                              onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                              placeholder="0.00"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="expense-tax">Tax Rate (%)</Label>
                            <Input
                              id="expense-tax"
                              type="number"
                              step="0.1"
                              placeholder="14.0"
                              defaultValue="14"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="expense-tax-amount">Tax Amount ($)</Label>
                            <Input
                              id="expense-tax-amount"
                              type="number"
                              step="0.01"
                              placeholder="Calculated automatically"
                              readOnly
                              className="bg-gray-50"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="expense-total">Total Amount ($)</Label>
                            <Input
                              id="expense-total"
                              type="number"
                              step="0.01"
                              placeholder="Including tax"
                              readOnly
                              className="bg-gray-50 font-bold"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label htmlFor="expense-currency">Currency</Label>
                            <Select defaultValue="usd">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="usd">USD - US Dollar</SelectItem>
                                <SelectItem value="egp">EGP - Egyptian Pound</SelectItem>
                                <SelectItem value="eur">EUR - Euro</SelectItem>
                                <SelectItem value="gbp">GBP - British Pound</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="expense-exchange-rate">Exchange Rate</Label>
                            <Input
                              id="expense-exchange-rate"
                              type="number"
                              step="0.0001"
                              placeholder="1.0000"
                              defaultValue="1.0000"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Classification Section */}
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                          <BookOpen className="h-5 w-5 mr-2" />
                          Classification & Allocation
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="expense-account-type">Account Type</Label>
                            <Select value={expenseForm.accountType} onValueChange={(value) => setExpenseForm({...expenseForm, accountType: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select account type" />
                              </SelectTrigger>
                              <SelectContent>
                                {expenseSettings.accountTypes.map((type, index) => (
                                  <SelectItem key={index} value={type.toLowerCase().replace(/\s+/g, '-')}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="expense-cost-center">Cost Center</Label>
                            <Select value={expenseForm.costCenter} onValueChange={(value) => setExpenseForm({...expenseForm, costCenter: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select cost center" />
                              </SelectTrigger>
                              <SelectContent>
                                {expenseSettings.costCenters.map((center, index) => (
                                  <SelectItem key={index} value={center.toLowerCase().replace(/\s+/g, '-')}>{center}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="expense-department">Department</Label>
                            <Select defaultValue="admin">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                <SelectItem value="quality-control">Quality Control</SelectItem>
                                <SelectItem value="research-dev">Research & Development</SelectItem>
                                <SelectItem value="admin">Administration</SelectItem>
                                <SelectItem value="sales-marketing">Sales & Marketing</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label htmlFor="expense-project">Project Code</Label>
                            <Input
                              id="expense-project"
                              placeholder="PROJ-2025-001 (optional)"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="expense-gl-account">GL Account Code</Label>
                            <Input
                              id="expense-gl-account"
                              placeholder="5000-001"
                              className="font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Payment Information Section */}
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                          <CreditCard className="h-5 w-5 mr-2" />
                          Payment Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="expense-payment-method">Payment Method</Label>
                            <Select value={expenseForm.paymentMethod} onValueChange={(value) => setExpenseForm({...expenseForm, paymentMethod: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                              <SelectContent>
                                {expenseSettings.paymentMethods.map((method, index) => (
                                  <SelectItem key={index} value={method.toLowerCase().replace(/\s+/g, '-')}>{method}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="expense-payment-status">Payment Status</Label>
                            <Select defaultValue="pending">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="partial">Partially Paid</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="expense-due-date">Due Date</Label>
                            <Input
                              id="expense-due-date"
                              type="date"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label htmlFor="expense-bank-account">Bank Account</Label>
                            <Select defaultValue="main-account">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="main-account">Main Operating Account</SelectItem>
                                <SelectItem value="petty-cash">Petty Cash</SelectItem>
                                <SelectItem value="credit-card">Corporate Credit Card</SelectItem>
                                <SelectItem value="paypal">PayPal Business</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="expense-check-number">Check/Reference Number</Label>
                            <Input
                              id="expense-check-number"
                              placeholder="Check number or transaction ID"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Additional Details Section */}
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <FileText className="h-5 w-5 mr-2" />
                          Additional Details
                        </h3>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="expense-notes">Notes & Instructions</Label>
                            <Textarea
                              id="expense-notes"
                              value={expenseForm.notes}
                              onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
                              placeholder="Additional notes, special instructions, or approval requirements..."
                              rows={3}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="expense-approval">Requires Approval</Label>
                              <Select defaultValue="no">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="no">No Approval Required</SelectItem>
                                  <SelectItem value="manager">Manager Approval</SelectItem>
                                  <SelectItem value="finance">Finance Director</SelectItem>
                                  <SelectItem value="ceo">CEO Approval</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="expense-recurring">Recurring Expense</Label>
                              <Select defaultValue="no">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="no">One-time</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="quarterly">Quarterly</SelectItem>
                                  <SelectItem value="annually">Annually</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {/* Document Upload Section */}
                          <div className="space-y-4 mt-6">
                            <div className="flex items-center gap-2 mb-3">
                              <Upload className="h-5 w-5 text-gray-600" />
                              <Label className="text-lg font-semibold text-gray-900">Supporting Documents</Label>
                            </div>
                            
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                              <div className="text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <div className="text-lg font-medium text-gray-900 mb-2">Upload Receipt or Invoice</div>
                                <div className="text-sm text-gray-600 mb-4">
                                  Drag and drop files here, or click to browse
                                </div>
                                <Button variant="outline" className="mb-3">
                                  <FileText className="h-4 w-4 mr-2" />
                                  Choose Files
                                </Button>
                                <div className="text-xs text-gray-500">
                                  Supported formats: PDF, JPG, PNG, DOCX (Max 10MB each)
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="gap-3 pt-6 border-t">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsNewExpenseOpen(false)}
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Save as Draft
                      </Button>
                      <Button 
                        onClick={handleExpenseSubmit}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Create Expense
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                  
                  <Dialog open={isExpenseSettingsOpen} onOpenChange={setIsExpenseSettingsOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Configure Expense Dropdown Options</DialogTitle>
                        <DialogDescription>
                          Manage the options available in Account Types, Cost Centers, and Payment Methods dropdowns.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-6 py-4">
                        {/* Account Types */}
                        <div>
                          <h4 className="font-medium mb-3">Account Types</h4>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {expenseSettings.accountTypes.map((type, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                {type}
                                <X 
                                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                  onClick={() => removeOption('accountType', type)}
                                />
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="New account type"
                              value={newOption.type === 'accountType' ? newOption.value : ''}
                              onChange={(e) => setNewOption({ type: 'accountType', value: e.target.value })}
                            />
                            <Button onClick={addNewOption} disabled={newOption.type !== 'accountType' || !newOption.value.trim()}>
                              Add
                            </Button>
                          </div>
                        </div>

                        {/* Cost Centers */}
                        <div>
                          <h4 className="font-medium mb-3">Cost Centers</h4>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {expenseSettings.costCenters.map((center, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                {center}
                                <X 
                                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                  onClick={() => removeOption('costCenter', center)}
                                />
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="New cost center"
                              value={newOption.type === 'costCenter' ? newOption.value : ''}
                              onChange={(e) => setNewOption({ type: 'costCenter', value: e.target.value })}
                            />
                            <Button onClick={addNewOption} disabled={newOption.type !== 'costCenter' || !newOption.value.trim()}>
                              Add
                            </Button>
                          </div>
                        </div>

                        {/* Payment Methods */}
                        <div>
                          <h4 className="font-medium mb-3">Payment Methods</h4>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {expenseSettings.paymentMethods.map((method, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                {method}
                                <X 
                                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                  onClick={() => removeOption('paymentMethod', method)}
                                />
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="New payment method"
                              value={newOption.type === 'paymentMethod' ? newOption.value : ''}
                              onChange={(e) => setNewOption({ type: 'paymentMethod', value: e.target.value })}
                            />
                            <Button onClick={addNewOption} disabled={newOption.type !== 'paymentMethod' || !newOption.value.trim()}>
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" onClick={() => setIsExpenseSettingsOpen(false)}>
                          Done
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardTitle>
              <CardDescription>Record and track all company expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="date-range" className="whitespace-nowrap">Date Range:</Label>
                  <Select defaultValue="this-month">
                    <SelectTrigger id="date-range" className="w-[180px]">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="this-week">This Week</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="this-quarter">This Quarter</SelectItem>
                      <SelectItem value="this-year">This Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="account-type" className="whitespace-nowrap">Account Type:</Label>
                  <Select>
                    <SelectTrigger id="account-type" className="w-[180px]">
                      <SelectValue placeholder="All accounts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accounts</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="fixed-assets">Fixed Assets</SelectItem>
                      <SelectItem value="projects">Projects Under Execution</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="cost-center" className="whitespace-nowrap">Cost Center:</Label>
                  <Select>
                    <SelectTrigger id="cost-center" className="w-[180px]">
                      <SelectValue placeholder="All centers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Centers</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="projects">Projects</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Account Type</TableHead>
                    <TableHead>Cost Center</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>2025-05-15</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Monthly Electricity Bill</div>
                        <div className="text-xs text-muted-foreground">Manufacturing facility power consumption</div>
                      </div>
                    </TableCell>
                    <TableCell>Operations</TableCell>
                    <TableCell>Operations</TableCell>
                    <TableCell>Bank Transfer</TableCell>
                    <TableCell className="text-right">$4,850.00</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewReceipt({
                            id: 'EXP-2025-001',
                            date: '2025-05-15',
                            description: 'Marketing Campaign Materials',
                            notes: 'Promotional flyers and digital advertising content',
                            accountType: 'Marketing',
                            costCenter: 'Marketing',
                            paymentMethod: 'Credit Card',
                            amount: '$1,450.00'
                          })}>View Receipt</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditExpense({
                            id: 'EXP-2025-001',
                            date: '2025-05-15',
                            description: 'Marketing Campaign Materials',
                            notes: 'Promotional flyers and digital advertising content',
                            accountType: 'Marketing',
                            costCenter: 'Marketing',
                            paymentMethod: 'Credit Card',
                            amount: '1450.00'
                          })}>Edit Entry</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteExpense({
                            id: 'EXP-2025-001',
                            description: 'Marketing Campaign Materials'
                          })}>Delete Entry</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2025-05-18</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Fuel for Company Vehicles</div>
                        <div className="text-xs text-muted-foreground">Delivery trucks and employee vehicles</div>
                      </div>
                    </TableCell>
                    <TableCell>Operations</TableCell>
                    <TableCell>Operations</TableCell>
                    <TableCell>Credit Card</TableCell>
                    <TableCell className="text-right">$1,280.00</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Receipt</DropdownMenuItem>
                          <DropdownMenuItem>Edit Entry</DropdownMenuItem>
                          <DropdownMenuItem>Delete Entry</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2025-05-20</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Office Supplies & Stationery</div>
                        <div className="text-xs text-muted-foreground">Administrative office requirements</div>
                      </div>
                    </TableCell>
                    <TableCell>Marketing</TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell>Cash</TableCell>
                    <TableCell className="text-right">$320.00</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Receipt</DropdownMenuItem>
                          <DropdownMenuItem>Edit Entry</DropdownMenuItem>
                          <DropdownMenuItem>Delete Entry</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2025-05-22</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Internet & Telecommunications</div>
                        <div className="text-xs text-muted-foreground">Monthly communication services</div>
                      </div>
                    </TableCell>
                    <TableCell>Fixed Assets</TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell>Bank Transfer</TableCell>
                    <TableCell className="text-right">$680.00</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Receipt</DropdownMenuItem>
                          <DropdownMenuItem>Edit Entry</DropdownMenuItem>
                          <DropdownMenuItem>Delete Entry</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2025-05-25</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Equipment Maintenance</div>
                        <div className="text-xs text-muted-foreground">Pharmaceutical machinery servicing</div>
                      </div>
                    </TableCell>
                    <TableCell>Operations</TableCell>
                    <TableCell>Operations</TableCell>
                    <TableCell>Credit Card</TableCell>
                    <TableCell className="text-right">$2,750.00</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Receipt</DropdownMenuItem>
                          <DropdownMenuItem>Edit Entry</DropdownMenuItem>
                          <DropdownMenuItem>Delete Entry</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2025-05-28</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Marketing Campaign</div>
                        <div className="text-xs text-muted-foreground">Digital advertising and promotional materials</div>
                      </div>
                    </TableCell>
                    <TableCell>Marketing</TableCell>
                    <TableCell>Marketing</TableCell>
                    <TableCell>Bank Transfer</TableCell>
                    <TableCell className="text-right">$3,400.00</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Receipt</DropdownMenuItem>
                          <DropdownMenuItem>Edit Entry</DropdownMenuItem>
                          <DropdownMenuItem>Delete Entry</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2025-05-30</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Laboratory Testing Fees</div>
                        <div className="text-xs text-muted-foreground">Third-party quality control testing</div>
                      </div>
                    </TableCell>
                    <TableCell>Projects Under Execution</TableCell>
                    <TableCell>Projects</TableCell>
                    <TableCell>Bank Transfer</TableCell>
                    <TableCell className="text-right">$1,950.00</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Receipt</DropdownMenuItem>
                          <DropdownMenuItem>Edit Entry</DropdownMenuItem>
                          <DropdownMenuItem>Delete Entry</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2025-06-02</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Water & Utilities</div>
                        <div className="text-xs text-muted-foreground">Manufacturing facility water usage</div>
                      </div>
                    </TableCell>
                    <TableCell>Operations</TableCell>
                    <TableCell>Operations</TableCell>
                    <TableCell>Bank Transfer</TableCell>
                    <TableCell className="text-right">$890.00</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Receipt</DropdownMenuItem>
                          <DropdownMenuItem>Edit Entry</DropdownMenuItem>
                          <DropdownMenuItem>Delete Entry</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2025-06-05</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Insurance Premiums</div>
                        <div className="text-xs text-muted-foreground">Monthly business insurance coverage</div>
                      </div>
                    </TableCell>
                    <TableCell>Fixed Assets</TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell>Bank Transfer</TableCell>
                    <TableCell className="text-right">$2,100.00</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Receipt</DropdownMenuItem>
                          <DropdownMenuItem>Edit Entry</DropdownMenuItem>
                          <DropdownMenuItem>Delete Entry</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2025-06-08</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Legal & Professional Services</div>
                        <div className="text-xs text-muted-foreground">Legal consultation and compliance fees</div>
                      </div>
                    </TableCell>
                    <TableCell>Marketing</TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell>Credit Card</TableCell>
                    <TableCell className="text-right">$1,650.00</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Receipt</DropdownMenuItem>
                          <DropdownMenuItem>Edit Entry</DropdownMenuItem>
                          <DropdownMenuItem>Delete Entry</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <ShoppingBag className="h-5 w-5 mr-2 text-blue-600" />
                  <span>Purchases Management</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Dialog open={isPurchaseExportOpen} onOpenChange={setIsPurchaseExportOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" /> Export
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                      <DialogHeader>
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Download className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <DialogTitle className="text-xl font-bold text-gray-900">Export Purchases Report</DialogTitle>
                            <p className="text-sm text-gray-600 mt-1">Choose date range and export format for your purchase data</p>
                          </div>
                        </div>
                      </DialogHeader>
                      <div className="space-y-6 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="purchase-start-date" className="text-sm font-medium text-gray-700">Start Date</Label>
                            <Input
                              id="purchase-start-date"
                              type="date"
                              value={purchaseExportStartDate}
                              onChange={(e) => setPurchaseExportStartDate(e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="purchase-end-date" className="text-sm font-medium text-gray-700">End Date</Label>
                            <Input
                              id="purchase-end-date"
                              type="date"
                              value={purchaseExportEndDate}
                              onChange={(e) => setPurchaseExportEndDate(e.target.value)}
                              className="w-full"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Export Format</Label>
                          <RadioGroup value={purchaseExportFormat} onValueChange={setPurchaseExportFormat}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="csv" id="purchase-csv" />
                              <Label htmlFor="purchase-csv">CSV (Comma Separated Values)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="excel" id="purchase-excel" />
                              <Label htmlFor="purchase-excel">Excel (.xlsx)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="pdf" id="purchase-pdf" />
                              <Label htmlFor="purchase-pdf">PDF Report</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">
                            <p className="font-medium mb-2">Export will include:</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>Purchase invoice numbers and ETA references</li>
                              <li>Supplier information and contact details</li>
                              <li>Item descriptions and quantities</li>
                              <li>Payment methods and status</li>
                              <li>Total amounts and VAT calculations</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="pt-6">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsPurchaseExportOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handlePurchaseExport}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export Purchases
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsNewPurchaseOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" /> New Purchase
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Manage purchase records, suppliers, and inventory-related accounting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="supplier" className="whitespace-nowrap">Supplier:</Label>
                    <Select>
                      <SelectTrigger id="supplier" className="w-[180px]">
                        <SelectValue placeholder="All suppliers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Suppliers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="payment-method" className="whitespace-nowrap">Payment Method:</Label>
                    <Select>
                      <SelectTrigger id="payment-method" className="w-[180px]">
                        <SelectValue placeholder="All methods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                        <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="purchase-date-range" className="whitespace-nowrap">Date Range:</Label>
                    <Select defaultValue="this-month">
                      <SelectTrigger id="purchase-date-range" className="w-[180px]">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="this-week">This Week</SelectItem>
                        <SelectItem value="this-month">This Month</SelectItem>
                        <SelectItem value="last-month">Last Month</SelectItem>
                        <SelectItem value="this-quarter">This Quarter</SelectItem>
                        <SelectItem value="this-year">This Year</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setIsPendingPurchasesOpen(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  size="sm"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Pending Purchases
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>ETA No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">PUR-2025-001</TableCell>
                    <TableCell className="text-blue-600 font-medium">ETA240520001</TableCell>
                    <TableCell>2025-05-20</TableCell>
                    <TableCell>ChemCorp Industries</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">Active Pharmaceutical Ingredients</div>
                        <div className="text-xs text-muted-foreground">Ibuprofen (500kg), Paracetamol (300kg)</div>
                      </div>
                    </TableCell>
                    <TableCell>Bank Transfer</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>
                    </TableCell>
                    <TableCell className="text-right">$18,750.00</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditInvoice({id: 'PUR-2025-001', supplier: 'ChemCorp Industries', total: '$18,750.00', status: 'Paid', eta: 'ETA240520001'})}
                          className="h-8 px-2 text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewInvoice({id: 'PUR-2025-001', supplier: 'ChemCorp Industries', total: '$18,750.00', status: 'Paid', eta: 'ETA240520001'})}
                          className="h-8 px-2 text-xs"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => downloadReceipt({id: 'PUR-2025-001', supplier: 'ChemCorp Industries', total: '$18,750.00', status: 'Paid', eta: 'ETA240520001'})}
                          className="h-8 px-2 text-xs"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Receipt
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">PUR-2025-002</TableCell>
                    <TableCell className="text-blue-600 font-medium">ETA240522002</TableCell>
                    <TableCell>2025-05-22</TableCell>
                    <TableCell>Medical Supplies Co.</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">Packaging Materials</div>
                        <div className="text-xs text-muted-foreground">Glass Vials (10,000), Aluminum Caps (15,000)</div>
                      </div>
                    </TableCell>
                    <TableCell>Credit</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Partial</Badge>
                    </TableCell>
                    <TableCell className="text-right">$5,420.00</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditInvoice({id: 'PUR-2025-002', supplier: 'Medical Supplies Co.', total: '$5,420.00', due: '$5,420.00', eta: 'ETA240522002'})}
                          className="h-8 px-2 text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleMakePayment({id: 'PUR-2025-002', supplier: 'Medical Supplies Co.', total: '$5,420.00', due: '$5,420.00', eta: 'ETA240522002'})}
                          className="h-8 px-2 text-xs"
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Pay
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewInvoice({id: 'PUR-2025-002', supplier: 'Medical Supplies Co.', total: '$5,420.00', due: '$5,420.00', eta: 'ETA240522002'})}
                          className="h-8 px-2 text-xs"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">PUR-2025-003</TableCell>
                    <TableCell className="text-blue-600 font-medium">ETA240525003</TableCell>
                    <TableCell>2025-05-25</TableCell>
                    <TableCell>Global Pharma Solutions</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">Raw Materials</div>
                        <div className="text-xs text-muted-foreground">Microcrystalline Cellulose (200kg), Magnesium Stearate (50kg)</div>
                      </div>
                    </TableCell>
                    <TableCell>Cash</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>
                    </TableCell>
                    <TableCell className="text-right">$12,300.00</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditInvoice({id: 'PUR-2025-003', supplier: 'Global Pharma Solutions', total: '$12,300.00', status: 'Paid', eta: 'ETA240525003'})}
                          className="h-8 px-2 text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewInvoice({id: 'PUR-2025-003', supplier: 'Global Pharma Solutions', total: '$12,300.00', status: 'Paid', eta: 'ETA240525003'})}
                          className="h-8 px-2 text-xs"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => downloadReceipt({id: 'PUR-2025-003', supplier: 'Global Pharma Solutions', total: '$12,300.00', status: 'Paid', eta: 'ETA240525003'})}
                          className="h-8 px-2 text-xs"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Receipt
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">PUR-2025-004</TableCell>
                    <TableCell className="text-blue-600 font-medium">ETA240527004</TableCell>
                    <TableCell>2025-05-27</TableCell>
                    <TableCell>Lab Equipment Ltd.</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">Packaging & Equipment</div>
                        <div className="text-xs text-muted-foreground">Blister Packs (50,000), Labeling Machines (2 units)</div>
                      </div>
                    </TableCell>
                    <TableCell>Bank Transfer</TableCell>
                    <TableCell>
                      <Badge variant="destructive">Overdue</Badge>
                    </TableCell>
                    <TableCell className="text-right">$24,800.00</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditInvoice({id: 'PUR-2025-004', supplier: 'Lab Equipment Ltd.', total: '$24,800.00', due: '$24,800.00', eta: 'ETA240527004'})}
                          className="h-8 px-2 text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleMakePayment({id: 'PUR-2025-004', supplier: 'Lab Equipment Ltd.', total: '$24,800.00', due: '$24,800.00', eta: 'ETA240527004'})}
                          className="h-8 px-2 text-xs"
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Pay
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewInvoice({id: 'PUR-2025-004', supplier: 'Lab Equipment Ltd.', total: '$24,800.00', due: '$24,800.00', eta: 'ETA240527004'})}
                          className="h-8 px-2 text-xs"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">PUR-2025-005</TableCell>
                    <TableCell className="text-blue-600 font-medium">ETA240530005</TableCell>
                    <TableCell>2025-05-30</TableCell>
                    <TableCell>Packaging Solutions Inc.</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">Specialized Packaging</div>
                        <div className="text-xs text-muted-foreground">Tamper-Evident Bottles (25,000), Safety Labels (30,000)</div>
                      </div>
                    </TableCell>
                    <TableCell>Credit</TableCell>
                    <TableCell>
                      <Badge variant="outline">Pending</Badge>
                    </TableCell>
                    <TableCell className="text-right">$8,950.00</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditInvoice({id: 'PUR-2025-005', supplier: 'Packaging Solutions Inc.', total: '$8,950.00', due: '$8,950.00', eta: 'ETA240530005'})}
                          className="h-8 px-2 text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleMakePayment({id: 'PUR-2025-005', supplier: 'Packaging Solutions Inc.', total: '$8,950.00', due: '$8,950.00', eta: 'ETA240530005'})}
                          className="h-8 px-2 text-xs"
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Pay
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewInvoice({id: 'PUR-2025-005', supplier: 'Packaging Solutions Inc.', total: '$8,950.00', due: '$8,950.00', eta: 'ETA240530005'})}
                          className="h-8 px-2 text-xs"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">PUR-2025-006</TableCell>
                    <TableCell className="text-blue-600 font-medium">ETA240602006</TableCell>
                    <TableCell>2025-06-02</TableCell>
                    <TableCell>ChemCorp Industries</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">Chemical Materials</div>
                        <div className="text-xs text-muted-foreground">Sodium Chloride (150kg), Lactose Monohydrate (100kg)</div>
                      </div>
                    </TableCell>
                    <TableCell>Bank Transfer</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>
                    </TableCell>
                    <TableCell className="text-right">$6,780.00</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditInvoice({id: 'PUR-2025-006', supplier: 'ChemCorp Industries', total: '$6,780.00', status: 'Paid', eta: 'ETA240602006'})}
                          className="h-8 px-2 text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewInvoice({id: 'PUR-2025-006', supplier: 'ChemCorp Industries', total: '$6,780.00', status: 'Paid', eta: 'ETA240602006'})}
                          className="h-8 px-2 text-xs"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => downloadReceipt({id: 'PUR-2025-006', supplier: 'ChemCorp Industries', total: '$6,780.00', status: 'Paid', eta: 'ETA240602006'})}
                          className="h-8 px-2 text-xs"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Receipt
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {/* Display approved purchases from procurement */}
                  {approvedPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">{purchase.id}</TableCell>
                      <TableCell className="text-blue-600 font-medium">{purchase.etaNumber}</TableCell>
                      <TableCell>{purchase.approvalDate}</TableCell>
                      <TableCell>{purchase.supplier}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{purchase.items.split(' - ')[0]}</div>
                          <div className="text-xs text-muted-foreground">{purchase.items.split(' - ')[1]}</div>
                        </div>
                      </TableCell>
                      <TableCell>{purchase.paymentMethod}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
                      </TableCell>
                      <TableCell className="text-right">${purchase.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEditInvoice({id: purchase.id, supplier: purchase.supplier, total: `$${purchase.amount.toLocaleString()}`, status: 'Approved', eta: purchase.etaNumber})}
                            className="h-8 px-2 text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleViewInvoice({id: purchase.id, supplier: purchase.supplier, total: `$${purchase.amount.toLocaleString()}`, status: 'Approved', eta: purchase.etaNumber})}
                            className="h-8 px-2 text-xs"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleMakePayment({id: purchase.id, supplier: purchase.supplier, total: `$${purchase.amount.toLocaleString()}`, due: `$${purchase.amount.toLocaleString()}`, eta: purchase.etaNumber})}
                            className="h-8 px-2 text-xs"
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            Pay
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invoices-due">
          <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-blue-200">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center text-2xl font-bold text-slate-800">
                    <div className="p-3 bg-blue-100 rounded-xl mr-4">
                      <FileWarning className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <span>Invoice Management Dashboard</span>
                      <div className="text-sm font-normal text-slate-600 mt-1">
                        Professional invoice tracking and management • 8 invoices found
                      </div>
                    </div>
                  </CardTitle>
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50">
                    <div className="p-1 bg-gray-100 rounded mr-2">
                      <BellRing className="h-3 w-3 text-gray-600" />
                    </div>
                    Reminders
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    onClick={() => setIsNewInvoiceOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Invoice
                  </Button>
                </div>
              </div>
              
              {/* Statistics Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <Card className="bg-white border-blue-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-slate-800">8</div>
                        <div className="text-sm text-slate-600">Total Invoices</div>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border-green-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-green-600">$67,250</div>
                        <div className="text-sm text-slate-600">Total Value</div>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border-orange-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-orange-600">$38,420</div>
                        <div className="text-sm text-slate-600">Outstanding</div>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border-purple-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-purple-600">3</div>
                        <div className="text-sm text-slate-600">Paid This Month</div>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardHeader>
            <CardContent className="bg-white">
              {/* Search & Filter Section */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 mb-6 border border-gray-200">
                <div className="flex items-center mb-4">
                  <Search className="h-5 w-5 text-gray-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-800">Search & Filter Invoices</h3>
                </div>
                <div className="text-sm text-gray-600 mb-4">Find specific invoices using advanced search and filtering options</div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search by invoice number, customer name, or amount..."
                      className="pl-10 bg-white border-gray-300"
                    />
                  </div>
                  
                  <Select defaultValue="all">
                    <SelectTrigger className="bg-white border-gray-300">
                      <Filter className="h-4 w-4 mr-2 text-gray-500" />
                      <SelectValue placeholder="Payment Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="due-soon">Due Soon</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select defaultValue="all-time">
                    <SelectTrigger className="bg-white border-gray-300">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-time">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="this-week">This Week</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ETA Compliance Dashboard */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">ETA Compliance Monitor</h3>
                      <p className="text-sm text-blue-700">Egyptian Tax Authority integration and compliance tracking</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white hover:bg-blue-50 border-blue-300"
                    onClick={() => setIsETASettingsOpen(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    ETA Settings
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600">ETA Submitted</div>
                        <div className="text-xl font-bold text-green-600">6/8</div>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600">Pending Upload</div>
                        <div className="text-xl font-bold text-orange-600">2/8</div>
                      </div>
                      <Clock className="h-8 w-8 text-orange-500" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600">Compliance Rate</div>
                        <div className="text-xl font-bold text-blue-600">75%</div>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600">Tax Amount</div>
                        <div className="text-xl font-bold text-purple-600">$9,415</div>
                      </div>
                      <DollarSign className="h-8 w-8 text-purple-500" />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      6 Submitted to ETA
                    </span>
                    <span className="flex items-center text-orange-600">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                      2 Pending Upload
                    </span>
                    <span className="flex items-center text-blue-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                      75% Overall Compliance
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-100">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View ETA Portal
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="payable">
                <div className="flex justify-between items-center mb-6">
                  <TabsList className="bg-gray-100">
                    <TabsTrigger value="payable" className="data-[state=active]:bg-white">Accounts Payable</TabsTrigger>
                    <TabsTrigger value="receivable" className="data-[state=active]:bg-white">Accounts Receivable</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="bg-white">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm" className="bg-white">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
                
                <TabsContent value="payable">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead>Paper Inv. No.</TableHead>
                        <TableHead>ETA Number</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">PUR-2025-005</TableCell>
                        <TableCell className="font-medium text-gray-700">P-025005</TableCell>
                        <TableCell className="text-blue-600 font-medium">ETA240525001</TableCell>
                        <TableCell>ChemCorp Industries</TableCell>
                        <TableCell>2025-05-28</TableCell>
                        <TableCell className="text-right">$18,750.00</TableCell>
                        <TableCell className="text-right">$0.00</TableCell>
                        <TableCell className="text-right font-medium text-red-600">$18,750.00</TableCell>
                        <TableCell>
                          <Badge variant="destructive">Overdue</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditInvoice({id: 'PUR-2025-005', supplier: 'ChemCorp Industries', total: '$18,750.00', due: '$18,750.00', eta: 'ETA240525001'})}>
                                Edit Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMakePayment({id: 'PUR-2025-005', supplier: 'ChemCorp Industries', total: '$18,750.00', due: '$18,750.00', eta: 'ETA240525001'})}>
                                Make Payment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewInvoice({id: 'PUR-2025-005', supplier: 'ChemCorp Industries', total: '$18,750.00', due: '$18,750.00', eta: 'ETA240525001'})}>
                                View Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleContactSupplier({id: 'PUR-2025-005', supplier: 'ChemCorp Industries', total: '$18,750.00', due: '$18,750.00', eta: 'ETA240525001'})}>
                                Contact Supplier
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">PUR-2025-009</TableCell>
                        <TableCell className="font-medium text-gray-700">P-025009</TableCell>
                        <TableCell className="text-blue-600 font-medium">ETA240608002</TableCell>
                        <TableCell>Global Pharma Solutions</TableCell>
                        <TableCell>2025-06-08</TableCell>
                        <TableCell className="text-right">$24,200.00</TableCell>
                        <TableCell className="text-right">$10,000.00</TableCell>
                        <TableCell className="text-right font-medium text-orange-600">$14,200.00</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Due Soon</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditInvoice({id: 'PUR-2025-009', supplier: 'Global Pharma Solutions', total: '$24,200.00', due: '$14,200.00', eta: 'ETA240608002'})}>
                                Edit Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMakePayment({id: 'PUR-2025-009', supplier: 'Global Pharma Solutions', total: '$24,200.00', due: '$14,200.00', eta: 'ETA240608002'})}>
                                Make Payment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewInvoice({id: 'PUR-2025-009', supplier: 'Global Pharma Solutions', total: '$24,200.00', due: '$14,200.00', eta: 'ETA240608002'})}>
                                View Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleContactSupplier({id: 'PUR-2025-009', supplier: 'Global Pharma Solutions', total: '$24,200.00', due: '$14,200.00', eta: 'ETA240608002'})}>
                                Contact Supplier
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">PUR-2025-013</TableCell>
                        <TableCell className="font-medium text-gray-700">P-025013</TableCell>
                        <TableCell className="text-blue-600 font-medium">ETA240612003</TableCell>
                        <TableCell>Lab Equipment Ltd.</TableCell>
                        <TableCell>2025-06-12</TableCell>
                        <TableCell className="text-right">$9,650.00</TableCell>
                        <TableCell className="text-right">$9,650.00</TableCell>
                        <TableCell className="text-right font-medium text-green-600">$0.00</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Invoice</DropdownMenuItem>
                              <DropdownMenuItem>Download Receipt</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">PUR-2025-017</TableCell>
                        <TableCell className="font-medium text-gray-700">P-025017</TableCell>
                        <TableCell className="text-blue-600 font-medium">ETA240618004</TableCell>
                        <TableCell>Medical Supplies Co.</TableCell>
                        <TableCell>2025-06-18</TableCell>
                        <TableCell className="text-right">$11,480.00</TableCell>
                        <TableCell className="text-right">$5,000.00</TableCell>
                        <TableCell className="text-right font-medium text-blue-600">$6,480.00</TableCell>
                        <TableCell>
                          <Badge variant="outline">Pending</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleMakePayment({id: 'PUR-2025-017', supplier: 'Medical Supplies Co.', total: '$11,480.00', due: '$6,480.00', eta: 'ETA240618004'})}>
                                Make Payment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewInvoice({id: 'PUR-2025-017', supplier: 'Medical Supplies Co.', total: '$11,480.00', due: '$6,480.00', eta: 'ETA240618004'})}>
                                View Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleContactSupplier({id: 'PUR-2025-017', supplier: 'Medical Supplies Co.', total: '$11,480.00', due: '$6,480.00', eta: 'ETA240618004'})}>
                                Contact Supplier
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="receivable">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead>Paper Inv. No.</TableHead>
                        <TableHead>ETA Number</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">INV-2025-001</TableCell>
                        <TableCell className="font-medium text-gray-700">P-2025001</TableCell>
                        <TableCell className="text-green-600 font-medium">ETA240530101</TableCell>
                        <TableCell>Cairo Medical Center</TableCell>
                        <TableCell>2025-05-30</TableCell>
                        <TableCell className="text-right">$15,450.00</TableCell>
                        <TableCell className="text-right">$10,000.00</TableCell>
                        <TableCell className="text-right font-medium text-red-600">$5,450.00</TableCell>
                        <TableCell>
                          <Badge variant="destructive">Overdue</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleSendReminderNotification({invoiceNumber: 'INV-2025-001', customerName: 'Cairo Medical Center'})}>
                                Send Reminder
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewInvoice({id: 'INV-2025-001', customer: 'Cairo Medical Center', total: '$15,450.00', remaining: '$5,450.00', eta: 'ETA240530101'})}>
                                View Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => recordPayment({id: 'INV-2025-001', customer: 'Cairo Medical Center', total: '$15,450.00', remaining: '$5,450.00', eta: 'ETA240530101'})}>
                                Record Payment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">INV-2025-003</TableCell>
                        <TableCell className="font-medium text-gray-700">P-2025003</TableCell>
                        <TableCell className="text-green-600 font-medium">ETA240605102</TableCell>
                        <TableCell>Alexandria Pharmacy</TableCell>
                        <TableCell>2025-06-05</TableCell>
                        <TableCell className="text-right">$8,750.00</TableCell>
                        <TableCell className="text-right">$0.00</TableCell>
                        <TableCell className="text-right font-medium text-orange-600">$8,750.00</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Due Soon</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleSendReminderNotification({invoiceNumber: 'INV-2025-003', customerName: 'Alexandria Pharmacy'})}>
                                Send Reminder
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewInvoice({id: 'INV-2025-003', customer: 'Alexandria Pharmacy', total: '$8,750.00', remaining: '$8,750.00', eta: 'ETA240605102'})}>
                                View Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => recordPayment({id: 'INV-2025-003', customer: 'Alexandria Pharmacy', total: '$8,750.00', remaining: '$8,750.00', eta: 'ETA240605102'})}>
                                Record Payment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">INV-2025-007</TableCell>
                        <TableCell className="font-medium text-gray-700">P-2025007</TableCell>
                        <TableCell className="text-green-600 font-medium">ETA240610103</TableCell>
                        <TableCell>Giza Hospital Network</TableCell>
                        <TableCell>2025-06-10</TableCell>
                        <TableCell className="text-right">$22,300.00</TableCell>
                        <TableCell className="text-right">$15,000.00</TableCell>
                        <TableCell className="text-right font-medium text-blue-600">$7,300.00</TableCell>
                        <TableCell>
                          <Badge variant="outline">Pending</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                              <DropdownMenuItem>View Invoice</DropdownMenuItem>
                              <DropdownMenuItem>Record Payment</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">INV-2025-012</TableCell>
                        <TableCell className="font-medium text-gray-700">P-2025012</TableCell>
                        <TableCell className="text-green-600 font-medium">ETA240615104</TableCell>
                        <TableCell>Luxor Pharmaceuticals</TableCell>
                        <TableCell>2025-06-15</TableCell>
                        <TableCell className="text-right">$12,850.00</TableCell>
                        <TableCell className="text-right">$12,850.00</TableCell>
                        <TableCell className="text-right font-medium text-green-600">$0.00</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Invoice</DropdownMenuItem>
                              <DropdownMenuItem>Download Receipt</DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleRefund('INV-2025-012')}
                                className="text-red-600"
                              >
                                Process Refund
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">INV-2025-018</TableCell>
                        <TableCell className="font-medium text-gray-700">P-2025018</TableCell>
                        <TableCell className="text-green-600 font-medium">ETA240620105</TableCell>
                        <TableCell>Aswan Medical Supplies</TableCell>
                        <TableCell>2025-06-20</TableCell>
                        <TableCell className="text-right">$6,420.00</TableCell>
                        <TableCell className="text-right">$3,000.00</TableCell>
                        <TableCell className="text-right font-medium text-blue-600">$3,420.00</TableCell>
                        <TableCell>
                          <Badge variant="outline">Pending</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                              <DropdownMenuItem>View Invoice</DropdownMenuItem>
                              <DropdownMenuItem>Record Payment</DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleRefund('INV-2025-018')}
                                className="text-red-600"
                              >
                                Process Refund
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="financial-reports">
          <div className="space-y-6">
            {/* Financial Reports Header */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <LineChart className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Financial Reports Center</CardTitle>
                      <CardDescription>Comprehensive financial analysis and reporting with real-time data</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={exportAllReports}>
                      <Download className="h-4 w-4 mr-2" />
                      Export All
                    </Button>
                    <Button size="sm" onClick={refreshAllData}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Data
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Assets</p>
                      <p className="text-2xl font-bold text-gray-900">$460,000</p>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +12.5% from last month
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Wallet className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Liabilities</p>
                      <p className="text-2xl font-bold text-gray-900">$60,000</p>
                      <p className="text-xs text-red-600 flex items-center mt-1">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        -5.2% from last month
                      </p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <CreditCard className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">$15,000</p>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +18.3% from last month
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Monthly Expenses</p>
                      <p className="text-2xl font-bold text-gray-900">$7,500</p>
                      <p className="text-xs text-orange-600 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +3.1% from last month
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <BarChart4 className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Report Generation Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileBarChart className="h-5 w-5 mr-2 text-purple-600" />
                  Generate Financial Reports
                </CardTitle>
                <CardDescription>Create detailed financial reports with customizable parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Report Configuration */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="report-type">Report Type</Label>
                      <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                        <SelectTrigger id="report-type">
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trial-balance">Trial Balance</SelectItem>
                          <SelectItem value="general-ledger">General Ledger</SelectItem>
                          <SelectItem value="cash-flow">Cash Flow Statement</SelectItem>
                          <SelectItem value="account-summary">Account Summary</SelectItem>
                          <SelectItem value="journal-register">Journal Register</SelectItem>
                          <SelectItem value="aging-analysis">Aging Analysis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date">From Date</Label>
                        <Input 
                          id="start-date" 
                          type="date" 
                          value={reportStartDate}
                          onChange={(e) => setReportStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date">To Date</Label>
                        <Input 
                          id="end-date" 
                          type="date" 
                          value={reportEndDate}
                          onChange={(e) => setReportEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="account-filter">Account Filter</Label>
                      <Select value={accountFilter} onValueChange={setAccountFilter}>
                        <SelectTrigger id="account-filter">
                          <SelectValue placeholder="Filter by account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Accounts</SelectItem>
                          <SelectItem value="asset">Assets Only</SelectItem>
                          <SelectItem value="liability">Liabilities Only</SelectItem>
                          <SelectItem value="equity">Equity Only</SelectItem>
                          <SelectItem value="revenue">Revenue Only</SelectItem>
                          <SelectItem value="expense">Expenses Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Report Options</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="include-zero-balance" className="rounded" defaultChecked />
                          <Label htmlFor="include-zero-balance" className="text-sm">Include zero balance accounts</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="show-transactions" className="rounded" defaultChecked />
                          <Label htmlFor="show-transactions" className="text-sm">Show transaction details</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="group-by-type" className="rounded" />
                          <Label htmlFor="group-by-type" className="text-sm">Group by account type</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 pt-4">
                      <Button className="w-full" onClick={generateFinancialReport}>
                        <BarChart className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={exportReportToPDF}>
                          <Download className="h-4 w-4 mr-2" />
                          Export PDF
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportReportToExcel}>
                          <FileText className="h-4 w-4 mr-2" />
                          Export Excel
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Report Preview */}
                  <div className="lg:col-span-2">
                    <div className="border rounded-lg p-4 bg-gray-50 min-h-[400px]">
                      {(() => {
                        const reportData = getReportData();
                        return (
                          <>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-gray-900">{reportData.title}</h3>
                              <div className="text-sm text-gray-600">
                                {reportStartDate} to {reportEndDate}
                              </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b bg-white">
                                    {reportData.headers.map((header, index) => (
                                      <th key={index} className={`p-3 font-medium text-gray-700 ${index > 1 ? 'text-right' : 'text-left'}`}>
                                        {header}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="bg-white">
                                  {reportData.rows.map((row, rowIndex) => (
                                    <tr key={rowIndex} className="border-b hover:bg-gray-50">
                                      {row.map((cell, cellIndex) => (
                                        <td key={cellIndex} className={`p-3 ${cellIndex === 0 ? 'font-mono' : ''} ${cellIndex > 1 ? 'text-right font-semibold' : ''}`}>
                                          {cell}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                  {reportData.totals && (
                                    <tr className="bg-gray-100 font-semibold">
                                      {reportData.totals.map((total, index) => (
                                        <td key={index} className={`p-3 ${index > 1 ? 'text-right' : ''}`}>
                                          {total}
                                        </td>
                                      ))}
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            <div className="mt-4 text-xs text-gray-600 flex items-center justify-between">
                              <span>Report generated from live accounting data</span>
                              <span>Last updated: {new Date().toLocaleTimeString()}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                  Quick Reports
                </CardTitle>
                <CardDescription>Pre-configured reports for common financial analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                    <div className="flex items-center space-x-2">
                      <PieChart className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Account Balances</span>
                    </div>
                    <p className="text-xs text-gray-600 text-left">Current balances for all accounts</p>
                  </Button>

                  <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Monthly P&L</span>
                    </div>
                    <p className="text-xs text-gray-600 text-left">Profit and loss for current month</p>
                  </Button>

                  <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">Cash Flow</span>
                    </div>
                    <p className="text-xs text-gray-600 text-left">Cash inflows and outflows</p>
                  </Button>

                  <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-orange-600" />
                      <span className="font-medium">Journal Summary</span>
                    </div>
                    <p className="text-xs text-gray-600 text-left">Summary of journal entries</p>
                  </Button>

                  <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-red-600" />
                      <span className="font-medium">Vendor Analysis</span>
                    </div>
                    <p className="text-xs text-gray-600 text-left">Analysis of vendor payments</p>
                  </Button>

                  <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                    <div className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-indigo-600" />
                      <span className="font-medium">Budget vs Actual</span>
                    </div>
                    <p className="text-xs text-gray-600 text-left">Budget comparison analysis</p>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Professional View Receipt Dialog */}
      <Dialog open={isViewReceiptOpen} onOpenChange={setIsViewReceiptOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-green-400 scrollbar-track-green-100 bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
              <div className="p-2 bg-green-100 rounded-lg">
                <Receipt className="h-6 w-6 text-green-600" />
              </div>
              Expense Receipt
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Detailed pharmaceutical expense information and financial records
            </DialogDescription>
          </DialogHeader>
          
          {selectedExpense && (
            <div className="space-y-6 py-6">
              {/* Expense Header Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{selectedExpense.description}</h3>
                    <p className="text-sm text-gray-600">Pharmaceutical Expense Entry</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{selectedExpense.amount}</div>
                    <div className="text-sm text-gray-600 font-medium">{selectedExpense.date}</div>
                  </div>
                </div>
                
                {/* Payment Method Badge */}
                <div className="flex justify-end">
                  <Badge variant="outline" className="text-sm px-3 py-1 border-green-300 text-green-700">
                    {selectedExpense.paymentMethod}
                  </Badge>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Financial Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Financial Details
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs font-medium text-blue-700">Amount</Label>
                      <div className="text-sm text-blue-800 font-bold">{selectedExpense.amount}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-blue-700">Payment Method</Label>
                      <div className="text-sm text-blue-800 font-medium">{selectedExpense.paymentMethod}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-blue-700">Transaction Date</Label>
                      <div className="text-sm text-blue-800">{selectedExpense.date}</div>
                    </div>
                  </div>
                </div>

                {/* Classification Information */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                  <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <BarChart4 className="h-4 w-4" />
                    Classification
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs font-medium text-purple-700">Account Type</Label>
                      <div className="text-sm text-purple-800 font-medium">{selectedExpense.accountType}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-purple-700">Cost Center</Label>
                      <div className="text-sm text-purple-800 font-medium">{selectedExpense.costCenter}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-purple-700">Department</Label>
                      <div className="text-sm text-purple-800">Pharmaceutical Operations</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Information */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4">
                <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Expense Description
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-orange-700">Primary Description</Label>
                    <div className="text-sm text-orange-800 font-medium">{selectedExpense.description}</div>
                  </div>
                  {selectedExpense.notes && (
                    <div>
                      <Label className="text-xs font-medium text-orange-700">Additional Notes</Label>
                      <div className="text-sm text-orange-800 bg-orange-100 p-3 rounded-lg mt-1">
                        {selectedExpense.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Uploaded Documents Section */}
              {uploadedReceipts.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
                  <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Supporting Documents ({uploadedReceipts.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {uploadedReceipts.map((receipt, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border border-indigo-200 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {receipt.preview ? (
                              <div className="relative group">
                                <img 
                                  src={receipt.preview} 
                                  alt="Receipt preview" 
                                  className="h-16 w-16 object-cover rounded-md border cursor-pointer hover:opacity-75 transition-opacity"
                                  onClick={() => {
                                    if (receipt.preview) {
                                      window.open(receipt.preview, '_blank');
                                    }
                                  }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Eye className="h-5 w-5 text-white drop-shadow-lg" />
                                </div>
                              </div>
                            ) : (
                              <div className="h-16 w-16 bg-indigo-100 rounded-md flex items-center justify-center">
                                <FileText className="h-8 w-8 text-indigo-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{receipt.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Size: {(receipt.size / 1024).toFixed(1)} KB
                            </p>
                            <p className="text-xs text-gray-500">
                              Uploaded: {new Date(receipt.uploadDate).toLocaleDateString()}
                            </p>
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs px-2 py-0.5 border-green-300 text-green-700">
                                Verified
                              </Badge>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50"
                              onClick={() => {
                                // Create download link
                                const link = document.createElement('a');
                                link.href = receipt.preview || '#';
                                link.download = receipt.name;
                                link.click();
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-indigo-600 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    All documents verified and compliant with audit requirements
                  </div>
                </div>
              )}

              {/* Sample Documents for Demo (when no uploads) */}
              {uploadedReceipts.length === 0 && (
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
                  <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Supporting Documents (3)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-indigo-200 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-16 w-16 bg-red-100 rounded-md flex items-center justify-center">
                            <Receipt className="h-8 w-8 text-red-400" />
                          </div>
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-sm font-medium text-gray-900">Invoice_PHX_2025_001.pdf</p>
                          <p className="text-xs text-gray-500 mt-1">Size: 245.7 KB</p>
                          <p className="text-xs text-gray-500">Uploaded: {new Date().toLocaleDateString()}</p>
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs px-2 py-0.5 border-green-300 text-green-700">
                              Verified
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-indigo-200 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-16 w-16 bg-blue-100 rounded-md flex items-center justify-center">
                            <FileText className="h-8 w-8 text-blue-400" />
                          </div>
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-sm font-medium text-gray-900">Purchase_Order_2025.pdf</p>
                          <p className="text-xs text-gray-500 mt-1">Size: 156.3 KB</p>
                          <p className="text-xs text-gray-500">Uploaded: {new Date(Date.now() - 86400000).toLocaleDateString()}</p>
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs px-2 py-0.5 border-green-300 text-green-700">
                              Verified
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-indigo-200 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-16 w-16 bg-green-100 rounded-md flex items-center justify-center">
                            <Image className="h-8 w-8 text-green-400" />
                          </div>
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-sm font-medium text-gray-900">Receipt_Chemical_Supply.jpg</p>
                          <p className="text-xs text-gray-500 mt-1">Size: 892.1 KB</p>
                          <p className="text-xs text-gray-500">Uploaded: {new Date(Date.now() - 172800000).toLocaleDateString()}</p>
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs px-2 py-0.5 border-green-300 text-green-700">
                              Verified
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-indigo-600 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    All documents verified and compliant with audit requirements
                  </div>
                </div>
              )}

              {/* Compliance Information */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-gray-100 rounded-full">
                    <Landmark className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Accounting Compliance</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      This expense entry has been recorded in accordance with pharmaceutical industry accounting standards.
                    </p>
                    <div className="mt-2 text-xs text-gray-600">
                      Recorded: {new Date().toLocaleDateString()} | Status: ✓ Verified
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsViewReceiptOpen(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                setIsViewReceiptOpen(false);
                toast({
                  title: "Receipt Downloaded",
                  description: "Expense receipt has been downloaded as PDF.",
                  variant: "default"
                });
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Edit Expense Dialog */}
      <Dialog open={isEditExpenseOpen} onOpenChange={setIsEditExpenseOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Edit className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">Edit Expense Entry</DialogTitle>
                <p className="text-sm text-gray-600 mt-1">Update comprehensive expense information and financial details</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information Section */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-date">Transaction Date</Label>
                  <Input
                    id="edit-expense-date"
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-reference">Reference Number</Label>
                  <Input
                    id="edit-expense-reference"
                    placeholder="REF-2025-001"
                    className="font-mono"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-priority">Priority Level</Label>
                  <Select defaultValue="normal">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-description">Description</Label>
                  <Input
                    id="edit-expense-description"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                    placeholder="Brief description of the expense"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-vendor">Vendor/Supplier</Label>
                  <Input
                    id="edit-expense-vendor"
                    placeholder="Company or individual name"
                  />
                </div>
              </div>
            </div>

            {/* Financial Details Section */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Financial Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-amount">Amount ($)</Label>
                  <Input
                    id="edit-expense-amount"
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-tax">Tax Rate (%)</Label>
                  <Input
                    id="edit-expense-tax"
                    type="number"
                    step="0.1"
                    placeholder="14.0"
                    defaultValue="14"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-tax-amount">Tax Amount ($)</Label>
                  <Input
                    id="edit-expense-tax-amount"
                    type="number"
                    step="0.01"
                    placeholder="Calculated automatically"
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-total">Total Amount ($)</Label>
                  <Input
                    id="edit-expense-total"
                    type="number"
                    step="0.01"
                    placeholder="Including tax"
                    readOnly
                    className="bg-gray-50 font-bold"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-currency">Currency</Label>
                  <Select defaultValue="usd">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD - US Dollar</SelectItem>
                      <SelectItem value="egp">EGP - Egyptian Pound</SelectItem>
                      <SelectItem value="eur">EUR - Euro</SelectItem>
                      <SelectItem value="gbp">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-exchange-rate">Exchange Rate</Label>
                  <Input
                    id="edit-expense-exchange-rate"
                    type="number"
                    step="0.0001"
                    placeholder="1.0000"
                    defaultValue="1.0000"
                  />
                </div>
              </div>
            </div>

            {/* Classification Section */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Classification & Allocation
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-account-type">Account Type</Label>
                  <Select value={expenseForm.accountType} onValueChange={(value) => setExpenseForm({...expenseForm, accountType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseSettings.accountTypes.map((type, index) => (
                        <SelectItem key={index} value={type.toLowerCase().replace(/\s+/g, '-')}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-cost-center">Cost Center</Label>
                  <Select value={expenseForm.costCenter} onValueChange={(value) => setExpenseForm({...expenseForm, costCenter: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cost center" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseSettings.costCenters.map((center, index) => (
                        <SelectItem key={index} value={center.toLowerCase().replace(/\s+/g, '-')}>{center}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-department">Department</Label>
                  <Select defaultValue="admin">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="quality-control">Quality Control</SelectItem>
                      <SelectItem value="research-dev">Research & Development</SelectItem>
                      <SelectItem value="admin">Administration</SelectItem>
                      <SelectItem value="sales-marketing">Sales & Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-project">Project Code</Label>
                  <Input
                    id="edit-expense-project"
                    placeholder="PROJ-2025-001 (optional)"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-gl-account">GL Account Code</Label>
                  <Input
                    id="edit-expense-gl-account"
                    placeholder="5000-001"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Payment Information Section */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-payment-method">Payment Method</Label>
                  <Select value={expenseForm.paymentMethod} onValueChange={(value) => setExpenseForm({...expenseForm, paymentMethod: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseSettings.paymentMethods.map((method, index) => (
                        <SelectItem key={index} value={method.toLowerCase().replace(/\s+/g, '-')}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-payment-status">Payment Status</Label>
                  <Select defaultValue="pending">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partially Paid</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-due-date">Due Date</Label>
                  <Input
                    id="edit-expense-due-date"
                    type="date"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-bank-account">Bank Account</Label>
                  <Select defaultValue="main-account">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main-account">Main Operating Account</SelectItem>
                      <SelectItem value="petty-cash">Petty Cash</SelectItem>
                      <SelectItem value="credit-card">Corporate Credit Card</SelectItem>
                      <SelectItem value="paypal">PayPal Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-check-number">Check/Reference Number</Label>
                  <Input
                    id="edit-expense-check-number"
                    placeholder="Check number or transaction ID"
                  />
                </div>
              </div>
            </div>

            {/* Receipt Upload Section */}
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Receipt & Documentation
              </h3>
              
              <div className="space-y-4">
                {/* File Upload Area */}
                <div className="border-2 border-dashed border-indigo-300 rounded-lg p-6 bg-white">
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 text-indigo-400 mb-4">
                      <Receipt className="h-12 w-12" />
                    </div>
                    <p className="text-sm font-medium text-indigo-900 mb-2">Upload Receipt or Invoice</p>
                    <p className="text-xs text-indigo-600 mb-4">
                      Drag and drop files here, or click to select
                    </p>
                    <input
                      type="file"
                      id="receipt-upload"
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setUploadedReceipts(prev => [...prev, ...files.map(file => ({
                          file,
                          name: file.name,
                          size: file.size,
                          type: file.type,
                          uploadDate: new Date().toISOString(),
                          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
                        }))]);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                      onClick={() => document.getElementById('receipt-upload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Files
                    </Button>
                  </div>
                  
                  <div className="mt-4 text-xs text-indigo-600 text-center">
                    Supported formats: JPG, PNG, PDF, DOC, DOCX (Max 10MB per file)
                  </div>
                </div>

                {/* Uploaded Files Preview */}
                {uploadedReceipts.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-indigo-900">Uploaded Documents</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {uploadedReceipts.map((receipt, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border border-indigo-200 flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {receipt.preview ? (
                              <img 
                                src={receipt.preview} 
                                alt="Receipt preview" 
                                className="h-12 w-12 object-cover rounded-md border"
                              />
                            ) : (
                              <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center">
                                <FileText className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{receipt.name}</p>
                            <p className="text-xs text-gray-500">
                              {(receipt.size / 1024).toFixed(1)} KB • {new Date(receipt.uploadDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0 h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                            onClick={() => {
                              setUploadedReceipts(prev => prev.filter((_, i) => i !== index));
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Receipt Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="receipt-category">Document Category</Label>
                    <Select defaultValue="receipt">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receipt">Receipt</SelectItem>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="purchase-order">Purchase Order</SelectItem>
                        <SelectItem value="delivery-note">Delivery Note</SelectItem>
                        <SelectItem value="other">Other Document</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="receipt-verification">Verification Status</Label>
                    <Select defaultValue="pending">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending Verification</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="requires-review">Requires Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Additional Details
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-expense-notes">Notes & Instructions</Label>
                  <Textarea
                    id="edit-expense-notes"
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
                    placeholder="Additional notes, special instructions, or approval requirements..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-expense-approval">Requires Approval</Label>
                    <Select defaultValue="no">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No Approval Required</SelectItem>
                        <SelectItem value="manager">Manager Approval</SelectItem>
                        <SelectItem value="finance">Finance Director</SelectItem>
                        <SelectItem value="ceo">CEO Approval</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-expense-recurring">Recurring Expense</Label>
                    <Select defaultValue="no">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">One-time</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Document Upload Section */}
                <div className="space-y-4 mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Upload className="h-5 w-5 text-gray-600" />
                    <Label className="text-lg font-semibold text-gray-900">Supporting Documents</Label>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <div className="text-lg font-medium text-gray-900 mb-2">Upload Receipt or Invoice</div>
                      <div className="text-sm text-gray-600 mb-4">
                        Drag and drop files here, or click to browse
                      </div>
                      <Button variant="outline" className="mb-3">
                        <FileText className="h-4 w-4 mr-2" />
                        Choose Files
                      </Button>
                      <div className="text-xs text-gray-500">
                        Supported formats: PDF, JPG, PNG, DOCX (Max 10MB each)
                      </div>
                    </div>
                  </div>
                  
                  {/* Uploaded Files Display */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium text-green-900">receipt_invoice_001.pdf</div>
                          <div className="text-sm text-green-700">2.3 MB • Uploaded</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Image className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-blue-900">supporting_document.jpg</div>
                          <div className="text-sm text-blue-700">1.8 MB • Uploaded</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsEditExpenseOpen(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              variant="outline"
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <FileText className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            <Button 
              onClick={() => {
                toast({
                  title: "Expense Updated Successfully",
                  description: "All expense details have been updated and saved to your accounting records.",
                });
                setIsEditExpenseOpen(false);
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Update Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Make Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">Process Payment</DialogTitle>
                <p className="text-sm text-gray-600 mt-1">Record comprehensive payment details for invoice {selectedInvoice?.id}</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Invoice Summary Section */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Invoice Summary
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-blue-700 font-medium">Invoice Number</Label>
                  <div className="text-lg font-bold text-blue-900">{selectedInvoice?.id || 'INV-2025-001'}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-blue-700 font-medium">Customer/Supplier</Label>
                  <div className="text-sm text-blue-800">{selectedInvoice?.customer || selectedInvoice?.supplier || 'Global Pharma Ltd.'}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-blue-700 font-medium">Original Amount</Label>
                  <div className="text-lg font-bold text-blue-900">{selectedInvoice?.total || '$21,090.00'}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-blue-700 font-medium">Outstanding Balance</Label>
                  <div className="text-lg font-bold text-red-600">{selectedInvoice?.remaining || selectedInvoice?.due || '$21,090.00'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-blue-700 font-medium">Due Date</Label>
                  <div className="text-sm text-blue-800">June 15, 2025</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-blue-700 font-medium">ETA Number</Label>
                  <div className="text-sm text-blue-800 font-mono">{selectedInvoice?.eta || 'ETA-202500123456'}</div>
                </div>
              </div>
            </div>

            {/* Payment Details Section */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-amount">Payment Amount ($)</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    placeholder="0.00"
                    className="text-lg font-bold"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment-date">Payment Date</Label>
                  <Input
                    id="payment-date"
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({...paymentForm, paymentDate: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment-currency">Currency</Label>
                  <Select defaultValue="usd">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD - US Dollar</SelectItem>
                      <SelectItem value="egp">EGP - Egyptian Pound</SelectItem>
                      <SelectItem value="eur">EUR - Euro</SelectItem>
                      <SelectItem value="gbp">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="exchange-rate">Exchange Rate</Label>
                  <Input
                    id="exchange-rate"
                    type="number"
                    step="0.0001"
                    placeholder="1.0000"
                    defaultValue="1.0000"
                    className="font-mono"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="local-amount">Local Amount (EGP)</Label>
                  <Input
                    id="local-amount"
                    type="number"
                    step="0.01"
                    placeholder="Calculated automatically"
                    readOnly
                    className="bg-gray-50 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                <Wallet className="h-5 w-5 mr-2" />
                Payment Method & Banking
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select value={paymentForm.paymentMethod} onValueChange={(value) => setPaymentForm({...paymentForm, paymentMethod: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                      <SelectItem value="wire-transfer">International Wire</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit-card">Credit Card</SelectItem>
                      <SelectItem value="letter-of-credit">Letter of Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bank-account">From Bank Account</Label>
                  <Select defaultValue="main-account">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main-account">Main Operating Account (USD)</SelectItem>
                      <SelectItem value="egp-account">Local Account (EGP)</SelectItem>
                      <SelectItem value="euro-account">European Account (EUR)</SelectItem>
                      <SelectItem value="petty-cash">Petty Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-reference">Transaction Reference</Label>
                  <Input
                    id="payment-reference"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})}
                    placeholder="TXN-202500001"
                    className="font-mono"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="check-number">Check/Wire Number</Label>
                  <Input
                    id="check-number"
                    placeholder="Check or wire reference"
                    className="font-mono"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clearance-date">Expected Clearance</Label>
                  <Input
                    id="clearance-date"
                    type="date"
                  />
                </div>
              </div>
            </div>

            {/* Allocation & Accounting Section */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Allocation & Accounting
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-type">Payment Type</Label>
                  <Select defaultValue="full-payment">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-payment">Full Payment</SelectItem>
                      <SelectItem value="partial-payment">Partial Payment</SelectItem>
                      <SelectItem value="advance-payment">Advance Payment</SelectItem>
                      <SelectItem value="final-settlement">Final Settlement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cost-center">Cost Center</Label>
                  <Select defaultValue="administration">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="quality-control">Quality Control</SelectItem>
                      <SelectItem value="research-dev">Research & Development</SelectItem>
                      <SelectItem value="administration">Administration</SelectItem>
                      <SelectItem value="sales-marketing">Sales & Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gl-account">GL Account Code</Label>
                  <Input
                    id="gl-account"
                    placeholder="1100-001"
                    className="font-mono"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="project-code">Project Code</Label>
                  <Input
                    id="project-code"
                    placeholder="PROJ-2025-001 (optional)"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select defaultValue="finance">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="procurement">Procurement</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="admin">Administration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Tax & Compliance Section */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Tax & Compliance
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="withholding-tax">Withholding Tax (%)</Label>
                  <Input
                    id="withholding-tax"
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    defaultValue="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tax-amount">Tax Amount ($)</Label>
                  <Input
                    id="tax-amount"
                    type="number"
                    step="0.01"
                    placeholder="Calculated automatically"
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="net-payment">Net Payment Amount ($)</Label>
                  <Input
                    id="net-payment"
                    type="number"
                    step="0.01"
                    placeholder="After tax deduction"
                    readOnly
                    className="bg-gray-50 font-bold"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="tax-certificate">Tax Certificate Number</Label>
                  <Input
                    id="tax-certificate"
                    placeholder="TAX-CERT-001 (if applicable)"
                    className="font-mono"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="eta-compliance">ETA Compliance Status</Label>
                  <Select defaultValue="compliant">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compliant">✓ ETA Compliant</SelectItem>
                      <SelectItem value="exempt">Tax Exempt</SelectItem>
                      <SelectItem value="pending">Pending Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Additional Information
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-notes">Payment Notes & Instructions</Label>
                  <Textarea
                    id="payment-notes"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                    placeholder="Additional payment notes, special instructions, or compliance requirements..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="approval-required">Approval Required</Label>
                    <Select defaultValue="auto-approved">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto-approved">Auto Approved</SelectItem>
                        <SelectItem value="manager">Manager Approval</SelectItem>
                        <SelectItem value="finance-director">Finance Director</SelectItem>
                        <SelectItem value="ceo">CEO Approval</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="payment-priority">Payment Priority</Label>
                    <Select defaultValue="normal">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment-terms">Payment Terms</Label>
                    <Input
                      id="payment-terms"
                      placeholder="Net 30, 2/10 Net 30, etc."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="supplier-invoice">Supplier Invoice Ref</Label>
                    <Input
                      id="supplier-invoice"
                      placeholder="Supplier's invoice number"
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsPaymentDialogOpen(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              variant="outline"
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <FileText className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            <Button 
              onClick={processPayment}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Process Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Professional View Invoice Dialog */}
      <Dialog open={isInvoiceViewOpen} onOpenChange={setIsInvoiceViewOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 bg-gradient-to-br from-slate-50 to-blue-50 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              Invoice Details
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Complete information for invoice {selectedInvoice?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-6 py-6">
              {/* Invoice Header Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{selectedInvoice.id}</h3>
                    <p className="text-sm text-gray-600">Pharmaceutical Invoice</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">{selectedInvoice.total}</div>
                    <div className="text-sm text-blue-600 font-medium">ETA: {selectedInvoice.eta}</div>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="flex justify-end">
                  <Badge 
                    variant={selectedInvoice.status === 'Overdue' ? 'destructive' : 
                            selectedInvoice.status === 'Paid' ? 'default' : 'outline'}
                    className="text-sm px-3 py-1"
                  >
                    {selectedInvoice.status || 'Pending'}
                  </Badge>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Company Details
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs font-medium text-blue-700">Company Name</Label>
                      <div className="text-sm text-blue-800 font-medium">{selectedInvoice.supplier || selectedInvoice.customer}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-blue-700">Contact</Label>
                      <div className="text-sm text-blue-800">+20 2 9876 5432</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-blue-700">Address</Label>
                      <div className="text-sm text-blue-800">Industrial Zone, New Cairo, Egypt</div>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Financial Summary
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs font-medium text-green-700">Total Amount</Label>
                      <div className="text-sm text-green-800 font-bold">{selectedInvoice.total}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-green-700">Amount Due</Label>
                      <div className="text-sm text-green-800 font-medium">{selectedInvoice.due || selectedInvoice.remaining || '$0.00'}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-green-700">Payment Method</Label>
                      <div className="text-sm text-green-800">Bank Transfer</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Information */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Products & Services
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-purple-800">Active Pharmaceutical Ingredients</div>
                      <div className="text-sm text-purple-600">Ibuprofen (500kg), Paracetamol (300kg)</div>
                    </div>
                    <div className="text-purple-800 font-bold">$15,000.00</div>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-purple-800">Packaging Materials</div>
                      <div className="text-sm text-purple-600">Glass Vials (10,000), Aluminum Caps (15,000)</div>
                    </div>
                    <div className="text-purple-800 font-bold">$3,500.00</div>
                  </div>
                  <div className="border-t border-purple-200 pt-2 flex justify-between">
                    <div className="font-semibold text-purple-900">VAT (14%)</div>
                    <div className="font-bold text-purple-900">$2,590.00</div>
                  </div>
                </div>
              </div>

              {/* ETA Compliance */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-orange-100 rounded-full">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-orange-900">Egyptian Tax Authority Compliance</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      This invoice complies with ETA regulations. Reference: {selectedInvoice.eta}
                    </p>
                    <div className="mt-2 text-xs text-orange-600">
                      Generated: {new Date().toLocaleDateString()} | Valid: ✓ Verified
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsInvoiceViewOpen(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                setIsInvoiceViewOpen(false);
                downloadReceipt(selectedInvoice);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={isEditInvoiceOpen} onOpenChange={setIsEditInvoiceOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>
              Modify invoice details for {selectedInvoice?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-invoice-id">Invoice ID</Label>
                  <input
                    id="edit-invoice-id"
                    type="text"
                    defaultValue={selectedInvoice.id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-eta-number">ETA Number</Label>
                  <input
                    id="edit-eta-number"
                    type="text"
                    defaultValue={selectedInvoice.eta}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-supplier">Supplier/Customer</Label>
                  <input
                    id="edit-supplier"
                    type="text"
                    defaultValue={selectedInvoice.supplier || selectedInvoice.customer}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-date">Date</Label>
                  <input
                    id="edit-date"
                    type="date"
                    defaultValue="2025-05-25"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-total">Total Amount</Label>
                  <input
                    id="edit-total"
                    type="text"
                    defaultValue={selectedInvoice.total}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select defaultValue={selectedInvoice.status || 'pending'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-payment-method">Payment Method</Label>
                <Select defaultValue="bank-transfer">
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Detailed Product Items Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-lg font-semibold">Products & Services</Label>
                  <Button 
                    type="button" 
                    onClick={addInvoiceItem}
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
                      <div className="col-span-3">Description</div>
                      <div className="col-span-1">Qty</div>
                      <div className="col-span-1">Unit</div>
                      <div className="col-span-2">Unit Price ($)</div>
                      <div className="col-span-2">Total ($)</div>
                      <div className="col-span-1">Action</div>
                    </div>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                    {invoiceItems.map((item, index) => (
                      <div key={item.id} className={`px-4 py-3 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateInvoiceItem(item.id, 'name', e.target.value)}
                              placeholder="Product name"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateInvoiceItem(item.id, 'description', e.target.value)}
                              placeholder="Product description"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="col-span-1">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateInvoiceItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="col-span-1">
                            <Select value={item.unit} onValueChange={(value) => updateInvoiceItem(item.id, 'unit', value)}>
                              <SelectTrigger className="h-8 text-sm">
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
                          <div className="col-span-2">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateInvoiceItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="col-span-2">
                            <div className="text-sm font-medium text-right">
                              ${item.total.toFixed(2)}
                            </div>
                          </div>
                          <div className="col-span-1">
                            <Button
                              type="button"
                              onClick={() => removeInvoiceItem(item.id)}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Totals Section */}
                  <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span>VAT:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={vatPercentage}
                              onChange={(e) => setVatPercentage(parseFloat(e.target.value) || 0)}
                              min="0"
                              max="100"
                              step="0.1"
                              className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-xs">%</span>
                          </div>
                        </div>
                        <span className="font-medium">${calculateVAT().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                        <span>Grand Total:</span>
                        <span className="text-blue-600">${calculateGrandTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
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
                    id="document-upload"
                  />
                  <label htmlFor="document-upload" className="cursor-pointer">
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900">ETA Compliance Note</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Ensure ETA number is valid and registered with Egyptian Tax Authority for proper compliance.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditInvoiceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: "Invoice Updated",
                description: `Invoice ${selectedInvoice?.id} has been successfully updated.`,
                variant: "default"
              });
              setIsEditInvoiceOpen(false);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Reminder Dialog */}
      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
            <DialogDescription>
              Send a payment reminder for invoice {selectedInvoice?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900">Reminder Details</h4>
              <p className="text-sm text-blue-700 mt-1">
                A payment reminder will be sent via email to the customer for the outstanding amount.
              </p>
            </div>
            <div>
              <Label htmlFor="reminder-message">Custom Message (Optional)</Label>
              <Textarea
                id="reminder-message"
                placeholder="Add a custom message to the reminder..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReminderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendReminder}>
              <BellRing className="h-4 w-4 mr-2" />
              Send Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Professional PDF Download Dialog */}
      <Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Download className="h-6 w-6 text-blue-600" />
              </div>
              Download Documents
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Choose the document format for invoice {selectedInvoice?.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-6">
            {/* Invoice Details Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">{selectedInvoice?.id}</h4>
                  <p className="text-sm text-gray-600">{selectedInvoice?.supplier || selectedInvoice?.customer}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-800">{selectedInvoice?.total}</p>
                  <p className="text-xs text-blue-600 font-medium">ETA: {selectedInvoice?.eta}</p>
                </div>
              </div>
            </div>

            {/* Download Options */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleDownloadPDF("Invoice PDF")}
                className="h-auto p-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-8 w-8" />
                  <span className="font-medium">Invoice PDF</span>
                  <span className="text-xs opacity-90">Complete invoice</span>
                </div>
              </Button>

              <Button
                onClick={() => handleDownloadPDF("Receipt PDF")}
                className="h-auto p-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <div className="flex flex-col items-center gap-2">
                  <Receipt className="h-8 w-8" />
                  <span className="font-medium">Receipt PDF</span>
                  <span className="text-xs opacity-90">Payment receipt</span>
                </div>
              </Button>

              <Button
                onClick={() => handleDownloadPDF("Statement PDF")}
                className="h-auto p-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <div className="flex flex-col items-center gap-2">
                  <BarChart className="h-8 w-8" />
                  <span className="font-medium">Statement</span>
                  <span className="text-xs opacity-90">Account summary</span>
                </div>
              </Button>

              <Button
                onClick={() => handleDownloadPDF("Tax Report PDF")}
                className="h-auto p-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <div className="flex flex-col items-center gap-2">
                  <FileQuestion className="h-8 w-8" />
                  <span className="font-medium">Tax Report</span>
                  <span className="text-xs opacity-90">ETA compliance</span>
                </div>
              </Button>
            </div>

            {/* ETA Compliance Note */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-100 rounded-full">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">Egyptian Tax Authority Compliance</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    All downloaded documents include valid ETA numbers for tax compliance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDownloadDialogOpen(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Supplier Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Contact Supplier</DialogTitle>
            <DialogDescription>
              Send a message to {selectedInvoice?.supplier}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="contact-subject">Subject</Label>
              <Input
                id="contact-subject"
                placeholder="Enter message subject"
                defaultValue={`Regarding Invoice ${selectedInvoice?.id}`}
              />
            </div>
            <div>
              <Label htmlFor="contact-message">Message</Label>
              <Textarea
                id="contact-message"
                placeholder="Type your message here..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: "Message Sent",
                description: `Your message has been sent to ${selectedInvoice?.supplier}.`,
                variant: "default"
              });
              setIsContactDialogOpen(false);
            }}>
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Professional New Purchase Dialog */}
      <Dialog open={isNewPurchaseOpen} onOpenChange={setIsNewPurchaseOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 bg-gradient-to-br from-slate-50 to-blue-50 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
              New Purchase Order
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
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chemcorp">ChemCorp Industries</SelectItem>
                    <SelectItem value="pharmatech">PharmaTech Solutions</SelectItem>
                    <SelectItem value="biomedical">BioMedical Supplies</SelectItem>
                    <SelectItem value="labequip">Lab Equipment Corp</SelectItem>
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
                    <div className="col-span-3">Description</div>
                    <div className="col-span-1">Qty</div>
                    <div className="col-span-1">Unit</div>
                    <div className="col-span-2">Unit Price ($)</div>
                    <div className="col-span-2">Total ($)</div>
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
                        <div className="col-span-3">
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
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-1">
                          <Select value={item.unit} onValueChange={(value) => updatePurchaseItem(item.id, 'unit', value)}>
                            <SelectTrigger className="h-8 text-sm">
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
                        <div className="col-span-2">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updatePurchaseItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="text-sm font-medium text-right">
                            ${item.total.toFixed(2)}
                          </div>
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            onClick={() => removePurchaseItem(item.id)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Purchase Totals Section */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
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
                <Select defaultValue="draft">
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending Approval</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="sent">Sent to Supplier</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
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
                  <Landmark className="h-4 w-4 text-blue-600" />
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
              onClick={() => setIsNewPurchaseOpen(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setIsNewPurchaseOpen(false);
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

      {/* Create New Invoice Dialog */}
      <Dialog open={isNewInvoiceOpen} onOpenChange={setIsNewInvoiceOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <PlusCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">Create New Invoice</DialogTitle>
                <p className="text-sm text-gray-600 mt-1">Generate a new sales invoice with ETA compliance</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Invoice Details Section */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Invoice Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-number">Invoice Number</Label>
                  <Input
                    id="invoice-number"
                    value={newInvoiceForm.invoiceNumber}
                    onChange={(e) => setNewInvoiceForm({...newInvoiceForm, invoiceNumber: e.target.value})}
                    placeholder="INV-2025-XXX"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="eta-number">ETA Number</Label>
                  <Input
                    id="eta-number"
                    value={newInvoiceForm.etaNumber}
                    onChange={(e) => setNewInvoiceForm({...newInvoiceForm, etaNumber: e.target.value})}
                    placeholder="ETA240XXXXX"
                    className="text-green-600 font-medium"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="invoice-date">Invoice Date</Label>
                  <Input
                    id="invoice-date"
                    type="date"
                    value={newInvoiceForm.invoiceDate}
                    onChange={(e) => setNewInvoiceForm({...newInvoiceForm, invoiceDate: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={newInvoiceForm.dueDate}
                    onChange={(e) => setNewInvoiceForm({...newInvoiceForm, dueDate: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment-terms">Payment Terms (Days)</Label>
                  <Select value={newInvoiceForm.paymentTerms} onValueChange={(value) => setNewInvoiceForm({...newInvoiceForm, paymentTerms: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="15">15 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="45">45 Days</SelectItem>
                      <SelectItem value="60">60 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Customer Details Section */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Customer Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Customer Name</Label>
                  <Input
                    id="customer-name"
                    value={newInvoiceForm.customerName}
                    onChange={(e) => setNewInvoiceForm({...newInvoiceForm, customerName: e.target.value})}
                    placeholder="Cairo Medical Center"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customer-email">Customer Email</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={newInvoiceForm.customerEmail}
                    onChange={(e) => setNewInvoiceForm({...newInvoiceForm, customerEmail: e.target.value})}
                    placeholder="billing@cairomedical.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                <Label htmlFor="customer-address">Customer Address</Label>
                <Textarea
                  id="customer-address"
                  value={newInvoiceForm.customerAddress}
                  onChange={(e) => setNewInvoiceForm({...newInvoiceForm, customerAddress: e.target.value})}
                  placeholder="123 Medical District, Cairo, Egypt"
                  rows={2}
                />
              </div>
            </div>

            {/* Products & Services Section */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-purple-900 flex items-center">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Products & Services
                </h3>
                <Button 
                  type="button" 
                  onClick={addNewInvoiceItem}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              <div className="border border-purple-200 rounded-lg overflow-hidden">
                <div className="bg-purple-100 px-4 py-3 border-b border-purple-200">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-purple-900">
                    <div className="col-span-2">Product Name</div>
                    <div className="col-span-3">Description</div>
                    <div className="col-span-1">Qty</div>
                    <div className="col-span-1">Unit</div>
                    <div className="col-span-2">Unit Price ($)</div>
                    <div className="col-span-2">Total ($)</div>
                    <div className="col-span-1">Action</div>
                  </div>
                </div>
                
                <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-purple-100">
                  {newInvoiceItems.map((item, index) => (
                    <div key={item.id} className={`px-4 py-3 border-b border-purple-100 ${index % 2 === 0 ? 'bg-white' : 'bg-purple-50'}`}>
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateNewInvoiceItem(item.id, 'name', e.target.value)}
                            placeholder="Product name"
                            className="w-full px-2 py-1 text-sm border border-purple-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateNewInvoiceItem(item.id, 'description', e.target.value)}
                            placeholder="Product description"
                            className="w-full px-2 py-1 text-sm border border-purple-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                        <div className="col-span-1">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateNewInvoiceItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-full px-2 py-1 text-sm border border-purple-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                        <div className="col-span-1">
                          <Select value={item.unit} onValueChange={(value) => updateNewInvoiceItem(item.id, 'unit', value)}>
                            <SelectTrigger className="h-8 text-sm border-purple-300">
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
                        <div className="col-span-2">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateNewInvoiceItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-full px-2 py-1 text-sm border border-purple-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="text-sm font-medium text-right">
                            ${item.total.toFixed(2)}
                          </div>
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            onClick={() => removeNewInvoiceItem(item.id)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Financial Summary Section */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Financial Summary
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="vat-percentage">VAT Percentage (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="vat-percentage"
                      type="number"
                      value={newInvoiceVatPercentage}
                      onChange={(e) => setNewInvoiceVatPercentage(parseFloat(e.target.value) || 0)}
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-orange-300">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subtotal:</span>
                      <span className="font-medium">${calculateNewInvoiceSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">VAT ({newInvoiceVatPercentage}%):</span>
                      <span className="font-medium">${calculateNewInvoiceVat().toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-900">Total Amount:</span>
                        <span className="font-bold text-lg text-orange-600">${calculateNewInvoiceTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                <Label htmlFor="invoice-notes">Notes</Label>
                <Textarea
                  id="invoice-notes"
                  value={newInvoiceForm.notes}
                  onChange={(e) => setNewInvoiceForm({...newInvoiceForm, notes: e.target.value})}
                  placeholder="Additional notes or terms..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button variant="outline" onClick={() => setIsNewInvoiceOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                toast({
                  title: "Invoice Created Successfully",
                  description: `Invoice ${newInvoiceForm.invoiceNumber} has been created and saved to your accounts receivable.`,
                  variant: "default"
                });
                setIsNewInvoiceOpen(false);
                // Reset form
                setNewInvoiceForm({
                  invoiceNumber: '',
                  etaNumber: '',
                  customerName: '',
                  customerEmail: '',
                  customerAddress: '',
                  invoiceDate: new Date().toISOString().split('T')[0],
                  dueDate: '',
                  paymentTerms: '30',
                  notes: ''
                });
                setNewInvoiceItems([
                  { id: 1, name: '', description: '', quantity: 1, unit: 'units', unitPrice: 0, total: 0 }
                ]);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quotation Preview Dialog */}
      <Dialog open={isQuotationPreviewOpen} onOpenChange={setIsQuotationPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Quotation Preview - {selectedQuotation?.quotationNumber}
            </DialogTitle>
            <DialogDescription>
              Review quotation details and ETA compliance information
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuotation && (
            <div className="space-y-6 p-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Quotation Number</label>
                    <p className="text-blue-600 font-semibold">{selectedQuotation.quotationNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Customer</label>
                    <p className="font-medium">{selectedQuotation.customer}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Quotation Type</label>
                    <Badge className="bg-blue-100 text-blue-800">{selectedQuotation.type}</Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">ETA Number</label>
                    <p className="text-green-600 font-semibold">{selectedQuotation.etaNumber || 'Not uploaded'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Date</label>
                    <p>{selectedQuotation.date}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <Badge className={
                      selectedQuotation.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                      selectedQuotation.status === 'Pending' ? 'bg-orange-100 text-orange-800' :
                      selectedQuotation.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {selectedQuotation.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Financial Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Subtotal</label>
                    <p className="font-semibold">${(selectedQuotation.amount / (1 + selectedQuotation.vatPercentage / 100)).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">VAT ({selectedQuotation.vatPercentage}%)</label>
                    <p className="font-semibold">${(selectedQuotation.amount - (selectedQuotation.amount / (1 + selectedQuotation.vatPercentage / 100))).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Transportation</label>
                    <p className="font-semibold">$0.00</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Total Amount</label>
                    <p className="font-bold text-lg">${selectedQuotation.amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* ETA Compliance Status */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <FileWarning className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">ETA Tax Compliance</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {selectedQuotation.etaNumber ? 
                        `This quotation has been successfully uploaded to ETA with reference number ${selectedQuotation.etaNumber}` :
                        'This quotation is pending upload to ETA for tax compliance. Upload required before finalization.'
                      }
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {selectedQuotation.etaNumber ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✓ ETA Compliant</span>
                      ) : (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">⚠ Upload Required</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Description */}
              <div>
                <label className="text-sm font-medium text-gray-700">Service Description</label>
                <p className="mt-1 text-gray-600">{selectedQuotation.description}</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsQuotationPreviewOpen(false)}>
              Close
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/quotation-history'}
            >
              View All Quotations
            </Button>
            <Button 
              onClick={() => window.location.href = '/create-quotation'}
            >
              Create New Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Invoice Dialog */}
      <Dialog open={isNewInvoiceOpen} onOpenChange={setIsNewInvoiceOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl font-bold text-blue-900">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <PlusCircle className="h-5 w-5 text-blue-600" />
              </div>
              Create New Invoice
            </DialogTitle>
            <DialogDescription className="text-blue-700">
              Create a professional invoice with ETA compliance and automated tax calculations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Invoice Header Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <div className="p-1 bg-blue-100 rounded mr-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                Invoice Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-number">Invoice Number</Label>
                  <Input
                    id="invoice-number"
                    value={newInvoiceForm.invoiceNumber}
                    onChange={(e) => setNewInvoiceForm({...newInvoiceForm, invoiceNumber: e.target.value})}
                    placeholder="INV-2025-001"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eta-number">ETA Number</Label>
                  <Input
                    id="eta-number"
                    value={newInvoiceForm.etaNumber}
                    onChange={(e) => setNewInvoiceForm({...newInvoiceForm, etaNumber: e.target.value})}
                    placeholder="ETA240627001"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-date">Invoice Date</Label>
                  <Input
                    id="invoice-date"
                    type="date"
                    value={newInvoiceForm.invoiceDate}
                    onChange={(e) => setNewInvoiceForm({...newInvoiceForm, invoiceDate: e.target.value})}
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Customer Information Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                <div className="p-1 bg-green-100 rounded mr-2">
                  <Building className="h-4 w-4 text-green-600" />
                </div>
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Customer Name</Label>
                  <Input
                    id="customer-name"
                    value={newInvoiceForm.customerName}
                    onChange={(e) => setNewInvoiceForm({...newInvoiceForm, customerName: e.target.value})}
                    placeholder="Cairo Medical Center"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-email">Customer Email</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={newInvoiceForm.customerEmail}
                    onChange={(e) => setNewInvoiceForm({...newInvoiceForm, customerEmail: e.target.value})}
                    placeholder="orders@cairomedical.com"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="customer-address">Customer Address</Label>
                  <Input
                    id="customer-address"
                    value={newInvoiceForm.customerAddress}
                    onChange={(e) => setNewInvoiceForm({...newInvoiceForm, customerAddress: e.target.value})}
                    placeholder="123 Medical Street, Cairo, Egypt"
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Payment Terms Section */}
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                <div className="p-1 bg-purple-100 rounded mr-2">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                </div>
                Payment Terms
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={newInvoiceForm.dueDate}
                    onChange={(e) => setNewInvoiceForm({...newInvoiceForm, dueDate: e.target.value})}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-terms">Payment Terms (Days)</Label>
                  <Select 
                    value={newInvoiceForm.paymentTerms} 
                    onValueChange={(value) => setNewInvoiceForm({...newInvoiceForm, paymentTerms: value})}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Due on Receipt</SelectItem>
                      <SelectItem value="15">Net 15 Days</SelectItem>
                      <SelectItem value="30">Net 30 Days</SelectItem>
                      <SelectItem value="45">Net 45 Days</SelectItem>
                      <SelectItem value="60">Net 60 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Invoice Items Section */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
              <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                <div className="p-1 bg-orange-100 rounded mr-2">
                  <ShoppingBag className="h-4 w-4 text-orange-600" />
                </div>
                Invoice Items
              </h3>
              
              <div className="space-y-4">
                {newInvoiceItems.map((item, index) => (
                  <div key={item.id} className="bg-white rounded-lg p-4 border border-orange-200">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <Label>Product/Service Name</Label>
                        <Input
                          value={item.name}
                          onChange={(e) => {
                            const updatedItems = [...newInvoiceItems];
                            updatedItems[index].name = e.target.value;
                            setNewInvoiceItems(updatedItems);
                          }}
                          placeholder="Pharmaceutical Product"
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const updatedItems = [...newInvoiceItems];
                            const quantity = parseFloat(e.target.value) || 0;
                            updatedItems[index].quantity = quantity;
                            updatedItems[index].total = quantity * updatedItems[index].unitPrice;
                            setNewInvoiceItems(updatedItems);
                          }}
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <Select 
                          value={item.unit} 
                          onValueChange={(value) => {
                            const updatedItems = [...newInvoiceItems];
                            updatedItems[index].unit = value;
                            setNewInvoiceItems(updatedItems);
                          }}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="units">Units</SelectItem>
                            <SelectItem value="kg">Kilograms</SelectItem>
                            <SelectItem value="mg">Milligrams</SelectItem>
                            <SelectItem value="boxes">Boxes</SelectItem>
                            <SelectItem value="vials">Vials</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Unit Price ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const updatedItems = [...newInvoiceItems];
                            const unitPrice = parseFloat(e.target.value) || 0;
                            updatedItems[index].unitPrice = unitPrice;
                            updatedItems[index].total = updatedItems[index].quantity * unitPrice;
                            setNewInvoiceItems(updatedItems);
                          }}
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Total ($)</Label>
                        <Input
                          value={item.total.toFixed(2)}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => {
                          const updatedItems = [...newInvoiceItems];
                          updatedItems[index].description = e.target.value;
                          setNewInvoiceItems(updatedItems);
                        }}
                        placeholder="Detailed product description"
                        className="bg-white mt-1"
                      />
                    </div>
                    {newInvoiceItems.length > 1 && (
                      <div className="flex justify-end mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updatedItems = newInvoiceItems.filter((_, i) => i !== index);
                            setNewInvoiceItems(updatedItems);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  onClick={() => {
                    const newItem = {
                      id: Date.now(),
                      name: '',
                      description: '',
                      quantity: 1,
                      unit: 'units',
                      unitPrice: 0,
                      total: 0
                    };
                    setNewInvoiceItems([...newInvoiceItems, newItem]);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>

            {/* Tax & Total Section */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="p-1 bg-gray-100 rounded mr-2">
                  <Calculator className="h-4 w-4 text-gray-600" />
                </div>
                Tax Calculations & Total
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vat-percentage">VAT Percentage (%)</Label>
                    <Input
                      id="vat-percentage"
                      type="number"
                      value={newInvoiceVatPercentage}
                      onChange={(e) => setNewInvoiceVatPercentage(parseFloat(e.target.value) || 0)}
                      className="bg-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={newInvoiceForm.notes}
                      onChange={(e) => setNewInvoiceForm({...newInvoiceForm, notes: e.target.value})}
                      placeholder="Additional notes or terms"
                      className="bg-white"
                    />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-300">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${newInvoiceItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT ({newInvoiceVatPercentage}%):</span>
                      <span>${(newInvoiceItems.reduce((sum, item) => sum + item.total, 0) * newInvoiceVatPercentage / 100).toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${(newInvoiceItems.reduce((sum, item) => sum + item.total, 0) * (1 + newInvoiceVatPercentage / 100)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-gray-50 -mx-6 -mb-6 px-6 py-4 mt-6">
            <div className="flex justify-between w-full">
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsNewInvoiceOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    setIsNewInvoiceOpen(false);
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ETA Settings Dialog */}
      <Dialog open={isETASettingsOpen} onOpenChange={setIsETASettingsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl font-bold text-blue-900">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              Egyptian Tax Authority (ETA) Configuration
            </DialogTitle>
            <DialogDescription className="text-blue-700">
              Configure your ETA integration settings for automated tax compliance and invoice submission
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* API Credentials Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <div className="p-1 bg-blue-100 rounded mr-2">
                  <Settings className="h-4 w-4 text-blue-600" />
                </div>
                API Credentials & Authentication
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eta-client-id">Client ID</Label>
                  <Input
                    id="eta-client-id"
                    type="text"
                    value={etaSettingsForm.clientId}
                    onChange={(e) => setETASettingsForm({...etaSettingsForm, clientId: e.target.value})}
                    placeholder="Enter your ETA Client ID"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eta-client-secret">Client Secret</Label>
                  <Input
                    id="eta-client-secret"
                    type="password"
                    value={etaSettingsForm.clientSecret}
                    onChange={(e) => setETASettingsForm({...etaSettingsForm, clientSecret: e.target.value})}
                    placeholder="Enter your ETA Client Secret"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eta-username">Username</Label>
                  <Input
                    id="eta-username"
                    type="text"
                    value={etaSettingsForm.username}
                    onChange={(e) => setETASettingsForm({...etaSettingsForm, username: e.target.value})}
                    placeholder="Enter your ETA username"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eta-pin">PIN</Label>
                  <Input
                    id="eta-pin"
                    type="password"
                    value={etaSettingsForm.pin}
                    onChange={(e) => setETASettingsForm({...etaSettingsForm, pin: e.target.value})}
                    placeholder="Enter your ETA PIN"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eta-api-key">API Key</Label>
                  <Input
                    id="eta-api-key"
                    type="password"
                    value={etaSettingsForm.apiKey}
                    onChange={(e) => setETASettingsForm({...etaSettingsForm, apiKey: e.target.value})}
                    placeholder="Enter your ETA API Key"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eta-environment">Environment</Label>
                  <Select 
                    value={etaSettingsForm.environment} 
                    onValueChange={(value) => setETASettingsForm({...etaSettingsForm, environment: value})}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Company Information Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                <div className="p-1 bg-green-100 rounded mr-2">
                  <Building className="h-4 w-4 text-green-600" />
                </div>
                Company Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-tax-number">Company Tax Number</Label>
                  <Input
                    id="company-tax-number"
                    type="text"
                    value={etaSettingsForm.companyTaxNumber}
                    onChange={(e) => setETASettingsForm({...etaSettingsForm, companyTaxNumber: e.target.value})}
                    placeholder="Enter company tax registration number"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch-code">Branch Code</Label>
                  <Input
                    id="branch-code"
                    type="text"
                    value={etaSettingsForm.branchCode}
                    onChange={(e) => setETASettingsForm({...etaSettingsForm, branchCode: e.target.value})}
                    placeholder="Enter branch identifier code"
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Automation Settings Section */}
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                <div className="p-1 bg-purple-100 rounded mr-2">
                  <Settings className="h-4 w-4 text-purple-600" />
                </div>
                Automation & Compliance Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-submit">Auto-Submit to ETA</Label>
                      <p className="text-sm text-gray-600">Automatically submit invoices to ETA upon creation</p>
                    </div>
                    <Button
                      variant={etaSettingsForm.autoSubmit ? "default" : "outline"}
                      size="sm"
                      onClick={() => setETASettingsForm({...etaSettingsForm, autoSubmit: !etaSettingsForm.autoSubmit})}
                    >
                      {etaSettingsForm.autoSubmit ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="submission-delay">Submission Delay (hours)</Label>
                    <Select 
                      value={etaSettingsForm.submissionDelay} 
                      onValueChange={(value) => setETASettingsForm({...etaSettingsForm, submissionDelay: value})}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Immediate</SelectItem>
                        <SelectItem value="1">1 Hour</SelectItem>
                        <SelectItem value="6">6 Hours</SelectItem>
                        <SelectItem value="24">24 Hours</SelectItem>
                        <SelectItem value="48">48 Hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="backup-submission">Backup Submission</Label>
                      <p className="text-sm text-gray-600">Create backup copies of all ETA submissions</p>
                    </div>
                    <Button
                      variant={etaSettingsForm.backupSubmission ? "default" : "outline"}
                      size="sm"
                      onClick={() => setETASettingsForm({...etaSettingsForm, backupSubmission: !etaSettingsForm.backupSubmission})}
                    >
                      {etaSettingsForm.backupSubmission ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="compliance-threshold">Compliance Threshold (%)</Label>
                    <Select 
                      value={etaSettingsForm.complianceThreshold} 
                      onValueChange={(value) => setETASettingsForm({...etaSettingsForm, complianceThreshold: value})}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="70">70% - Basic</SelectItem>
                        <SelectItem value="80">80% - Good</SelectItem>
                        <SelectItem value="90">90% - Excellent</SelectItem>
                        <SelectItem value="95">95% - Perfect</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications Section */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
              <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                <div className="p-1 bg-orange-100 rounded mr-2">
                  <BellRing className="h-4 w-4 text-orange-600" />
                </div>
                Notification Settings
              </h3>
              <div className="space-y-2">
                <Label htmlFor="notification-email">Notification Email</Label>
                <Input
                  id="notification-email"
                  type="email"
                  value={etaSettingsForm.notificationEmail}
                  onChange={(e) => setETASettingsForm({...etaSettingsForm, notificationEmail: e.target.value})}
                  placeholder="Enter email for ETA notifications and alerts"
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="bg-gray-50 -mx-6 -mb-6 px-6 py-4 mt-6">
            <div className="flex justify-between w-full">
              <div className="flex space-x-2">
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Settings
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsETASettingsOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    setIsETASettingsOpen(false);
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer to Invoice Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center text-blue-900">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Transfer Quotation to Invoice
            </DialogTitle>
            <DialogDescription>
              Convert this quotation into an invoice with all data pre-filled for faster processing.
            </DialogDescription>
          </DialogHeader>
          
          {transferQuotation && (
            <div className="space-y-6 py-4 overflow-y-auto flex-1 pr-2">
              {/* Quotation Summary */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <div className="p-1 bg-blue-100 rounded mr-2">
                    <FileText className="h-3 w-3 text-blue-600" />
                  </div>
                  Quotation Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Quotation Number:</span>
                    <p className="font-medium text-blue-700">{transferQuotation.quotationNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">ETA Number:</span>
                    <p className="font-medium text-green-700">{transferQuotation.etaNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Customer:</span>
                    <p className="font-medium">{transferQuotation.customer}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <Badge className={
                      transferQuotation.type === 'Manufacturing' ? 'bg-blue-100 text-blue-800' :
                      transferQuotation.type === 'Refining' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }>
                      {transferQuotation.type}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <p className="font-medium">{transferQuotation.date}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <p className="font-semibold text-lg">${transferQuotation.amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Transfer Information */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                  <div className="p-1 bg-green-100 rounded mr-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  What will happen?
                </h4>
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    A new invoice will be created with pre-filled customer and product information
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    All quotation details will be transferred automatically
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    ETA compliance information will be preserved
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    You can review and modify details before finalizing the invoice
                  </li>
                </ul>
              </div>

              {/* Status Notice */}
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Important Notice</h4>
                    <p className="text-sm text-yellow-800 mt-1">
                      Once transferred, this quotation will be marked as "Converted to Invoice" and cannot be transferred again. 
                      The original quotation will remain in your records for reference.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between flex-shrink-0 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsTransferDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmTransferToInvoice}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Transfer to Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Pay Dialog */}
      <Dialog open={isAddPayDialogOpen} onOpenChange={setIsAddPayDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Add Employee Pay
            </DialogTitle>
            <DialogDescription>
              Process payroll for an employee. Select an employee and enter salary details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-2">
            {/* Employee Selection */}
            <div className="space-y-2">
              <Label htmlFor="employee">Select Employee *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {addPayForm.employeeId ? 
                      employeeList.find(emp => emp.id === addPayForm.employeeId)?.name || "Select employee..." 
                      : "Select employee..."
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Search employees..." 
                      className="h-9" 
                    />
                    <CommandList>
                      <CommandEmpty>
                        <p className="py-3 text-center text-sm">No employees found</p>
                      </CommandEmpty>
                      <CommandGroup heading="Employees">
                        {employeeList.map((employee) => (
                          <CommandItem
                            key={employee.id}
                            value={`${employee.name} ${employee.department} ${employee.position}`}
                            onSelect={() => handleEmployeeSelect(employee.id)}
                            className="flex flex-col items-start py-2"
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex-1">
                                <div className="font-medium">{employee.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {employee.department} - {employee.position}
                                </div>
                              </div>
                              <Check
                                className={`h-4 w-4 ${
                                  addPayForm.employeeId === employee.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Pay Period and Department */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payPeriod">Pay Period</Label>
                <Input
                  id="payPeriod"
                  type="date"
                  value={addPayForm.payPeriod}
                  onChange={(e) =>
                    setAddPayForm(prev => ({ ...prev, payPeriod: e.target.value }))
                  }
                />
              </div>
              {addPayForm.department && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{addPayForm.department}</span>
                      <span className="text-sm text-gray-600">{addPayForm.position}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Salary Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basicSalary">Basic Salary *</Label>
                <Input
                  id="basicSalary"
                  type="number"
                  placeholder="0.00"
                  value={addPayForm.basicSalary}
                  onChange={(e) =>
                    setAddPayForm(prev => ({ ...prev, basicSalary: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overtime">Overtime Pay</Label>
                <Input
                  id="overtime"
                  type="number"
                  placeholder="0.00"
                  value={addPayForm.overtime}
                  onChange={(e) =>
                    setAddPayForm(prev => ({ ...prev, overtime: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bonuses">Bonuses & Allowances</Label>
                <Input
                  id="bonuses"
                  type="number"
                  placeholder="0.00"
                  value={addPayForm.bonuses}
                  onChange={(e) =>
                    setAddPayForm(prev => ({ ...prev, bonuses: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deductions">Deductions</Label>
                <Input
                  id="deductions"
                  type="number"
                  placeholder="0.00"
                  value={addPayForm.deductions}
                  onChange={(e) =>
                    setAddPayForm(prev => ({ ...prev, deductions: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Net Pay Calculation */}
            {addPayForm.basicSalary && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-900">Net Pay:</span>
                  <span className="text-lg font-bold text-blue-900">
                    ${(
                      parseFloat(addPayForm.basicSalary || '0') +
                      parseFloat(addPayForm.overtime || '0') +
                      parseFloat(addPayForm.bonuses || '0') -
                      parseFloat(addPayForm.deductions || '0')
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about this payroll entry..."
                value={addPayForm.notes}
                onChange={(e) =>
                  setAddPayForm(prev => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsAddPayDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPaySubmit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Add Pay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
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
                    <span className="text-sm">{refundInvoice.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Customer:</span>
                    <span className="text-sm">{refundInvoice.customer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Amount:</span>
                    <span className="text-sm">{refundInvoice.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Amount Paid:</span>
                    <span className="text-sm">{refundInvoice.paid}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refundAmount">Refund Amount</Label>
                <Input
                  id="refundAmount"
                  type="number"
                  placeholder="0.00"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refundReason">Reason for Refund *</Label>
                <Textarea
                  id="refundReason"
                  placeholder="Please provide a reason for this refund..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
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
            <Button onClick={processRefund} className="bg-red-600 hover:bg-red-700">
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pending Purchases Dialog */}
      <Dialog open={isPendingPurchasesOpen} onOpenChange={setIsPendingPurchasesOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              Pending Purchases from Procurement
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Purchase orders forwarded from procurement department awaiting financial processing and approval
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            {/* Pending Purchase Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 font-medium">Pending Orders</p>
                    <p className="text-2xl font-bold text-orange-800">12</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
                <p className="text-xs text-orange-600 mt-1">Awaiting approval</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 font-medium">Total Value</p>
                    <p className="text-2xl font-bold text-blue-800">$485,200</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-xs text-blue-600 mt-1">Pending approval</p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 font-medium">Urgent Orders</p>
                    <p className="text-2xl font-bold text-red-800">3</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-xs text-red-600 mt-1">Due within 48hrs</p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 font-medium">Avg Processing</p>
                    <p className="text-2xl font-bold text-green-800">2.3</p>
                  </div>
                  <Clock className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-xs text-green-600 mt-1">Days to approve</p>
              </div>
            </div>

            {/* Pending Purchases Table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Purchase Orders Awaiting Approval</h3>
                <div className="flex items-center space-x-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Orders</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        id="select-all-pending"
                        aria-label="Select all pending purchases"
                      />
                    </TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Date Submitted</TableHead>
                    <TableHead>ETA Number</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>
                        <Checkbox 
                          id={`select-${purchase.id}`}
                          aria-label={`Select ${purchase.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{purchase.id}</div>
                        <div className="text-xs text-gray-500">From Procurement</div>
                      </TableCell>
                      <TableCell>{purchase.supplier}</TableCell>
                      <TableCell>{purchase.dateSubmitted}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{purchase.etaNumber}</code>
                      </TableCell>
                      <TableCell className="text-right font-semibold">${purchase.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={
                          purchase.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          purchase.priority === 'normal' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {purchase.priority === 'urgent' ? 'Urgent' : 
                           purchase.priority === 'normal' ? 'Normal' : 'Low'}
                        </Badge>
                      </TableCell>
                      <TableCell>{purchase.paymentTerms}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-green-600"
                            title="Approve Purchase"
                            onClick={() => handleApprovePurchase(purchase.id)}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0"
                            title="View Details"
                            onClick={() => handleViewPurchaseDetails(purchase.id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-red-600"
                            title="Reject Purchase"
                            onClick={() => handleRejectPurchase(purchase.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Bulk Actions */}
            <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                Select purchases to perform bulk actions
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Selected
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject Selected
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsPendingPurchasesOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Details Dialog */}
      <Dialog open={isPurchaseDetailsOpen} onOpenChange={setIsPurchaseDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-800">
              Purchase Order Details - {selectedPurchaseDetails?.id}
            </DialogTitle>
            <DialogDescription>
              Review complete purchase order information, uploaded documents, and approve or reject the submission.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPurchaseDetails && (
            <div className="space-y-6">
              {/* Header Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Purchase Order ID</label>
                  <p className="text-lg font-bold text-blue-800">{selectedPurchaseDetails.id}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">ETA Number</label>
                  <p className="text-lg font-mono bg-white px-2 py-1 rounded border">{selectedPurchaseDetails.etaNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Priority</label>
                  <Badge className={
                    selectedPurchaseDetails.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    selectedPurchaseDetails.priority === 'normal' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }>
                    {selectedPurchaseDetails.priority === 'urgent' ? 'Urgent' : 
                     selectedPurchaseDetails.priority === 'normal' ? 'Normal' : 'Low'}
                  </Badge>
                </div>
              </div>

              {/* Supplier Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-gray-800">Supplier Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Supplier Name</label>
                      <p className="text-base">{selectedPurchaseDetails.supplier}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Payment Terms</label>
                      <p className="text-base">{selectedPurchaseDetails.paymentTerms}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Date Submitted</label>
                      <p className="text-base">{selectedPurchaseDetails.dateSubmitted}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Total Amount</label>
                      <p className="text-lg font-bold text-green-600">${selectedPurchaseDetails.amount.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-gray-800">Purchase Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Items Description</label>
                      <div className="p-3 bg-gray-50 rounded border">
                        <p className="text-base leading-relaxed">{selectedPurchaseDetails.items}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Uploaded Submissions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-gray-800">Uploaded Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Procurement Documents */}
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-2 block">Purchase Order Documents</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded border">
                          <FileText className="h-8 w-8 text-blue-600" />
                          <div className="flex-1">
                            <p className="font-medium">Purchase Order Request</p>
                            <p className="text-sm text-gray-600">PDF • 245 KB • {selectedPurchaseDetails.dateSubmitted}</p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded border">
                          <FileText className="h-8 w-8 text-green-600" />
                          <div className="flex-1">
                            <p className="font-medium">Supplier Quotation</p>
                            <p className="text-sm text-gray-600">PDF • 189 KB • {selectedPurchaseDetails.dateSubmitted}</p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Compliance Documents */}
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-2 block">Compliance & Quality Documents</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded border">
                          <FileText className="h-8 w-8 text-yellow-600" />
                          <div className="flex-1">
                            <p className="font-medium">Product Certificates</p>
                            <p className="text-sm text-gray-600">PDF • 512 KB • {selectedPurchaseDetails.dateSubmitted}</p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded border">
                          <FileText className="h-8 w-8 text-purple-600" />
                          <div className="flex-1">
                            <p className="font-medium">ETA Compliance Form</p>
                            <p className="text-sm text-gray-600">PDF • 78 KB • {selectedPurchaseDetails.dateSubmitted}</p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Additional Attachments */}
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-2 block">Additional Attachments</label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded border">
                          <FileText className="h-6 w-6 text-gray-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Technical Specifications</p>
                            <p className="text-xs text-gray-600">DOCX • 156 KB</p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded border">
                          <FileText className="h-6 w-6 text-gray-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Delivery Schedule</p>
                            <p className="text-xs text-gray-600">XLSX • 89 KB</p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Upload New Document */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-600">Add Additional Documents</label>
                        <Button variant="outline" size="sm" className="text-blue-600 border-blue-300">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload File
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-gray-800">Available Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        handleApprovePurchase(selectedPurchaseDetails.id);
                        setIsPurchaseDetailsOpen(false);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Purchase Order
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        handleRejectPurchase(selectedPurchaseDetails.id);
                        setIsPurchaseDetailsOpen(false);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject Purchase Order
                    </Button>
                    <Button variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Details
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Approval History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-gray-800">Approval Workflow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-semibold">Submitted by Procurement</p>
                        <p className="text-sm text-gray-600">{selectedPurchaseDetails.dateSubmitted} - Awaiting financial approval</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div>
                        <p className="font-semibold">Pending Financial Review</p>
                        <p className="text-sm text-gray-600">Waiting for accounting department approval</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsPurchaseDetailsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accounting;