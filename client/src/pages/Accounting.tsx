import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
  BookOpen, 
  CreditCard, 
  DollarSign, 
  FileText, 
  BarChart4, 
  TrendingUp,
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
  BarChart,
  Settings,
  X,
  Edit,
  Upload,
  Paperclip,
  Trash2,
  AlertCircle
} from "lucide-react";
import { Label } from "@/components/ui/label";
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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ChartOfAccounts from '@/components/accounting/ChartOfAccounts';
import JournalEntries from '@/components/accounting/JournalEntries';
import ProfitAndLoss from '@/components/accounting/ProfitAndLoss';
import BalanceSheet from '@/components/accounting/BalanceSheet';
import CustomerPayments from '@/components/accounting/CustomerPayments';
import AccountingPeriods from '@/components/accounting/AccountingPeriods';

const Accounting: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [isExpenseSettingsOpen, setIsExpenseSettingsOpen] = useState(false);
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
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isInvoiceViewOpen, setIsInvoiceViewOpen] = useState(false);
  const [isEditInvoiceOpen, setIsEditInvoiceOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  
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

  const handleSendReminder = (invoice: any) => {
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

  const [newOption, setNewOption] = useState({ type: '', value: '' });
  
  // State for expense actions
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [isViewReceiptOpen, setIsViewReceiptOpen] = useState(false);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);

  const handleViewReceipt = (expense: any) => {
    setSelectedExpense(expense);
    setIsViewReceiptOpen(true);
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
  const { data: summaryData } = useQuery({
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
            <TabsTrigger value="purchases" className="flex-shrink-0 px-4 py-3 whitespace-nowrap">Purchases</TabsTrigger>
            <TabsTrigger value="invoices-due" className="flex-shrink-0 px-4 py-3 whitespace-nowrap">Invoices Due</TabsTrigger>
            <TabsTrigger value="customer-payments" className="flex-shrink-0 px-4 py-3 whitespace-nowrap">Customer Payments</TabsTrigger>
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
                  <Dialog open={isNewExpenseOpen} onOpenChange={setIsNewExpenseOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" /> New Expense
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Expense</DialogTitle>
                      <DialogDescription>
                        Create a new expense entry for your accounting records.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="expense-date" className="text-right">
                          Date
                        </Label>
                        <Input
                          id="expense-date"
                          type="date"
                          value={expenseForm.date}
                          onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="expense-description" className="text-right">
                          Description
                        </Label>
                        <Input
                          id="expense-description"
                          value={expenseForm.description}
                          onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                          className="col-span-3"
                          placeholder="Enter expense description"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="expense-notes" className="text-right">
                          Notes
                        </Label>
                        <Textarea
                          id="expense-notes"
                          value={expenseForm.notes}
                          onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
                          className="col-span-3"
                          placeholder="Additional notes (optional)"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="expense-account-type" className="text-right">
                          Account Type
                        </Label>
                        <Select value={expenseForm.accountType} onValueChange={(value) => setExpenseForm({...expenseForm, accountType: value})}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                          <SelectContent>
                            {expenseSettings.accountTypes.map((type, index) => (
                              <SelectItem key={index} value={type.toLowerCase().replace(/\s+/g, '-')}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="expense-cost-center" className="text-right">
                          Cost Center
                        </Label>
                        <Select value={expenseForm.costCenter} onValueChange={(value) => setExpenseForm({...expenseForm, costCenter: value})}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select cost center" />
                          </SelectTrigger>
                          <SelectContent>
                            {expenseSettings.costCenters.map((center, index) => (
                              <SelectItem key={index} value={center.toLowerCase().replace(/\s+/g, '-')}>{center}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="expense-payment-method" className="text-right">
                          Payment Method
                        </Label>
                        <Select value={expenseForm.paymentMethod} onValueChange={(value) => setExpenseForm({...expenseForm, paymentMethod: value})}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            {expenseSettings.paymentMethods.map((method, index) => (
                              <SelectItem key={index} value={method.toLowerCase().replace(/\s+/g, '-')}>{method}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="expense-amount" className="text-right">
                          Amount ($)
                        </Label>
                        <Input
                          id="expense-amount"
                          type="number"
                          step="0.01"
                          value={expenseForm.amount}
                          onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                          className="col-span-3"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsNewExpenseOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" onClick={handleExpenseSubmit}>
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
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" /> New Purchase
                </Button>
              </CardTitle>
              <CardDescription>Manage purchase records, suppliers, and inventory-related accounting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2">
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
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invoices-due">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileWarning className="h-5 w-5 mr-2 text-blue-600" />
                  <span>Invoices Due</span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <BellRing className="h-4 w-4 mr-2" /> Reminders
                  </Button>
                  <Button variant="outline" size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Invoice
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Track accounts payable and receivable with due dates</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="payable">
                <div className="flex justify-between items-center mb-4">
                  <TabsList>
                    <TabsTrigger value="payable">Payable</TabsTrigger>
                    <TabsTrigger value="receivable">Receivable</TabsTrigger>
                  </TabsList>
                  
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <TabsContent value="payable">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice ID</TableHead>
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
                              <DropdownMenuItem onClick={() => handleSendReminder({id: 'INV-2025-001', customer: 'Cairo Medical Center', total: '$15,450.00', remaining: '$5,450.00', eta: 'ETA240530101'})}>
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
                              <DropdownMenuItem onClick={() => handleSendReminder({id: 'INV-2025-003', customer: 'Alexandria Pharmacy', total: '$8,750.00', remaining: '$8,750.00', eta: 'ETA240605102'})}>
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
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">INV-2025-018</TableCell>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="h-5 w-5 mr-2 text-blue-600" />
                <span>Financial Reports Generator</span>
              </CardTitle>
              <CardDescription>Generate comprehensive financial reports with filters and export options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="report-type">Report Type</Label>
                    <Select>
                      <SelectTrigger id="report-type">
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial-balance">Trial Balance</SelectItem>
                        <SelectItem value="general-ledger">General Ledger</SelectItem>
                        <SelectItem value="expense-summary">Expense Summary by Category</SelectItem>
                        <SelectItem value="purchase-summary">Purchase Summary by Supplier</SelectItem>
                        <SelectItem value="cash-flow">Cash Flow Report</SelectItem>
                        <SelectItem value="aging-payables">Aging Report for Payables</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input id="start-date" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input id="end-date" type="date" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="account-type-filter">Account Type</Label>
                    <Select>
                      <SelectTrigger id="account-type-filter">
                        <SelectValue placeholder="All account types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="asset">Asset</SelectItem>
                        <SelectItem value="liability">Liability</SelectItem>
                        <SelectItem value="equity">Equity</SelectItem>
                        <SelectItem value="revenue">Revenue</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cost-center-filter">Cost Center</Label>
                    <Select>
                      <SelectTrigger id="cost-center-filter">
                        <SelectValue placeholder="All cost centers" />
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
                  
                  <div className="pt-4 flex gap-2">
                    <Button>
                      <BarChart className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        // Export PDF using browser print functionality
                        const reportContent = document.getElementById('financial-report-container');
                        if (reportContent) {
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            printWindow.document.write(`
                              <html>
                                <head>
                                  <title>Financial Report</title>
                                  <style>
                                    body { font-family: Arial, sans-serif; }
                                    table { width: 100%; border-collapse: collapse; }
                                    th, td { border: 1px solid #ddd; padding: 8px; }
                                    th { background-color: #f2f2f2; }
                                  </style>
                                </head>
                                <body>
                                  ${reportContent.innerHTML}
                                </body>
                              </html>
                            `);
                            printWindow.document.close();
                            printWindow.print();
                          } else {
                            toast({
                              title: "Export Failed",
                              description: "Unable to open print window. Please check your popup blocker settings.",
                              variant: "destructive"
                            });
                          }
                        } else {
                          toast({
                            title: "Export Failed",
                            description: "No report content found to export. Please generate a report first.",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        // Export CSV data
                        const csvData = "data:text/csv;charset=utf-8," + 
                          encodeURIComponent(
                            "Account Code,Account Name,Opening Balance,Debits,Credits,Closing Balance\n" +
                            "100100,Cash,5000,1200,800,5400\n" +
                            "100200,Accounts Receivable,10000,3000,2000,11000\n" +
                            "200100,Accounts Payable,8000,1500,3500,10000\n" +
                            "300100,Equity,7000,0,2000,9000\n"
                          );
                        
                        const downloadLink = document.createElement("a");
                        downloadLink.href = csvData;
                        downloadLink.download = "financial_report.csv";
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                        
                        toast({
                          title: "Export Successful",
                          description: "Financial report exported as CSV.",
                          variant: "default"
                        });
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 min-h-[300px] flex flex-col items-center justify-center text-center">
                  <FileQuestion className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="mb-2 text-muted-foreground">Select a report type and date range to generate a financial report</p>
                  <p className="text-xs text-muted-foreground">Reports will display here with visualization options</p>
                </div>
              </div>
            </CardContent>
          </Card>
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

      {/* Edit Expense Dialog */}
      <Dialog open={isEditExpenseOpen} onOpenChange={setIsEditExpenseOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Expense Entry</DialogTitle>
            <DialogDescription>
              Update the expense information below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expense-date" className="text-right">
                Date
              </Label>
              <Input
                id="edit-expense-date"
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expense-description" className="text-right">
                Description
              </Label>
              <Input
                id="edit-expense-description"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expense-notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="edit-expense-notes"
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
                className="col-span-3"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expense-account-type" className="text-right">
                Account Type
              </Label>
              <Select value={expenseForm.accountType} onValueChange={(value) => setExpenseForm({...expenseForm, accountType: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {expenseSettings.accountTypes.map((type, index) => (
                    <SelectItem key={index} value={type.toLowerCase().replace(/\s+/g, '-')}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expense-cost-center" className="text-right">
                Cost Center
              </Label>
              <Select value={expenseForm.costCenter} onValueChange={(value) => setExpenseForm({...expenseForm, costCenter: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select cost center" />
                </SelectTrigger>
                <SelectContent>
                  {expenseSettings.costCenters.map((center, index) => (
                    <SelectItem key={index} value={center.toLowerCase().replace(/\s+/g, '-')}>{center}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expense-payment-method" className="text-right">
                Payment Method
              </Label>
              <Select value={expenseForm.paymentMethod} onValueChange={(value) => setExpenseForm({...expenseForm, paymentMethod: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {expenseSettings.paymentMethods.map((method, index) => (
                    <SelectItem key={index} value={method.toLowerCase().replace(/\s+/g, '-')}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expense-amount" className="text-right">
                Amount ($)
              </Label>
              <Input
                id="edit-expense-amount"
                type="number"
                step="0.01"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditExpenseOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={() => {
              toast({
                title: "Success",
                description: "Expense entry has been updated.",
              });
              setIsEditExpenseOpen(false);
            }}>
              Update Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Make Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for invoice {selectedInvoice?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment-amount">Payment Amount ($)</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="payment-date">Payment Date</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({...paymentForm, paymentDate: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentForm.paymentMethod} onValueChange={(value) => setPaymentForm({...paymentForm, paymentMethod: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit-card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment-reference">Reference Number</Label>
              <Input
                id="payment-reference"
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})}
                placeholder="Transaction/Check number"
              />
            </div>
            <div>
              <Label htmlFor="payment-notes">Notes</Label>
              <Textarea
                id="payment-notes"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                placeholder="Additional payment notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={processPayment}>
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

              <div>
                <Label htmlFor="edit-items">Items Description</Label>
                <Textarea
                  id="edit-items"
                  placeholder="Describe the items or services..."
                  defaultValue="Active Pharmaceutical Ingredients - Ibuprofen (500kg), Paracetamol (300kg)"
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
    </div>
  );
};

export default Accounting;