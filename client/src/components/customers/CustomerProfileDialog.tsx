import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { CustomerData } from './CustomerCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CalendarIcon, Mail, MapPin, Phone, Building, FileText, Download, ChevronDown, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface CustomerProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerData | null;
}

// Sample invoice data for the demo
interface InvoiceData {
  id: number;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  items: number;
}

const mockInvoices: InvoiceData[] = [
  { id: 1001, date: '2025-03-15', amount: 2500, status: 'paid', items: 3 },
  { id: 1002, date: '2025-04-01', amount: 1200, status: 'paid', items: 2 },
  { id: 1003, date: '2025-04-20', amount: 3800, status: 'pending', items: 5 },
  { id: 1004, date: '2025-04-28', amount: 950, status: 'pending', items: 1 },
];

const CustomerProfileDialog: React.FC<CustomerProfileDialogProps> = ({
  open,
  onOpenChange,
  customer
}) => {
  const [isExporting, setIsExporting] = useState(false);

  if (!customer) return null;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  // Export to PDF
  const exportToPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(29, 62, 120); // Blue color
      doc.text('Customer Profile Report', 20, 20);
      
      // Customer basic info
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Customer Information', 20, 40);
      
      doc.setFontSize(12);
      const customerInfo = [
        ['Name:', customer.name],
        ['Company:', customer.company || 'N/A'],
        ['Email:', customer.email],
        ['Phone:', customer.phone || 'N/A'],
        ['Address:', customer.address || 'N/A'],
        ['Sector:', customer.sector || 'N/A'],
        ['Position:', customer.position || 'N/A'],
        ['Tax Number:', customer.taxNumber || 'N/A']
      ];
      
      let yPos = 50;
      customerInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(String(label), 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(String(value || 'N/A'), 80, yPos);
        yPos += 8;
      });
      
      // Invoice history table
      if (mockInvoices.length > 0) {
        yPos += 10;
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Invoice History', 20, yPos);
        
        const tableData = mockInvoices.map(invoice => [
          `INV-${invoice.id}`,
          formatDate(invoice.date),
          `EGP ${invoice.amount.toLocaleString()}`,
          invoice.status.toUpperCase(),
          invoice.items.toString()
        ]);
        
        (doc as any).autoTable({
          startY: yPos + 10,
          head: [['Invoice #', 'Date', 'Amount', 'Status', 'Items']],
          body: tableData,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [29, 62, 120] }
        });
      }
      
      // Save the PDF
      doc.save(`customer-profile-${customer.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    setIsExporting(true);
    try {
      const workbook = XLSX.utils.book_new();
      
      // Customer info sheet
      const customerData = [
        ['Field', 'Value'],
        ['Name', customer.name],
        ['Company', customer.company || 'N/A'],
        ['Email', customer.email],
        ['Phone', customer.phone || 'N/A'],
        ['Address', customer.address || 'N/A'],
        ['Sector', customer.sector || 'N/A'],
        ['Position', customer.position || 'N/A'],
        ['Tax Number', customer.taxNumber || 'N/A']
      ];
      
      const customerSheet = XLSX.utils.aoa_to_sheet(customerData);
      XLSX.utils.book_append_sheet(workbook, customerSheet, 'Customer Info');
      
      // Invoice history sheet
      if (mockInvoices.length > 0) {
        const invoiceData = [
          ['Invoice #', 'Date', 'Amount (EGP)', 'Status', 'Items Count'],
          ...mockInvoices.map(invoice => [
            `INV-${invoice.id}`,
            formatDate(invoice.date),
            invoice.amount,
            invoice.status.toUpperCase(),
            invoice.items
          ])
        ];
        
        const invoiceSheet = XLSX.utils.aoa_to_sheet(invoiceData);
        XLSX.utils.book_append_sheet(workbook, invoiceSheet, 'Invoice History');
      }
      
      // Save the Excel file
      XLSX.writeFile(workbook, `customer-profile-${customer.name.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
    } catch (error) {
      console.error('Excel export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">Customer Profile</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">Comprehensive customer information and business relationship details for {customer.name}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information Section */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Customer Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-700">Customer Name</label>
                <div className="text-lg font-bold text-blue-900 bg-white p-3 rounded border border-blue-200">
                  {customer.name}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-700">Position/Title</label>
                <div className="text-sm text-blue-800 bg-white p-3 rounded border border-blue-200">
                  {customer.position || 'Director'}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-700">Customer Status</label>
                <div className="bg-white p-3 rounded border border-blue-200">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Active Customer
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-700">Customer ID</label>
                <div className="text-sm text-blue-800 bg-white p-3 rounded border border-blue-200 font-mono">
                  CUST-{customer.id.toString().padStart(6, '0')}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-700">Customer Since</label>
                <div className="text-sm text-blue-800 bg-white p-3 rounded border border-blue-200">
                  January 15, 2024
                </div>
              </div>
            </div>
          </div>

          {/* Company Information Section */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Company Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-700">Company Name</label>
                <div className="text-sm text-green-800 bg-white p-3 rounded border border-green-200">
                  {customer.company}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-700">Industry Sector</label>
                <div className="bg-white p-3 rounded border border-green-200">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {customer.sector}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-700">Business Type</label>
                <div className="text-sm text-green-800 bg-white p-3 rounded border border-green-200">
                  Pharmaceutical Manufacturer
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-700">Company Size</label>
                <div className="text-sm text-green-800 bg-white p-3 rounded border border-green-200">
                  Large Enterprise (500+ employees)
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-700">Registration Number</label>
                <div className="text-sm text-green-800 bg-white p-3 rounded border border-green-200 font-mono">
                  REG-{customer.id}2024
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-700">Primary Email</label>
                <div className="text-sm text-purple-800 bg-white p-3 rounded border border-purple-200">
                  <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                    {customer.email}
                  </a>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-700">Phone Number</label>
                <div className="text-sm text-purple-800 bg-white p-3 rounded border border-purple-200">
                  <a href={`tel:${customer.phone}`} className="hover:underline">
                    {customer.phone}
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-700">Alternative Contact</label>
                <div className="text-sm text-purple-800 bg-white p-3 rounded border border-purple-200">
                  +20 2 1234 5678 (Emergency)
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-700">Preferred Contact Method</label>
                <div className="text-sm text-purple-800 bg-white p-3 rounded border border-purple-200">
                  Email (Business Hours)
                </div>
              </div>
            </div>
          </div>

          {/* Address Information Section */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Address & Location
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-orange-700">Business Address</label>
                <div className="text-sm text-orange-800 bg-white p-3 rounded border border-orange-200 min-h-[80px]">
                  {customer.address}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-orange-700">Billing Address</label>
                <div className="text-sm text-orange-800 bg-white p-3 rounded border border-orange-200 min-h-[80px]">
                  Same as business address
                  <br />
                  <span className="text-xs text-orange-600">Finance Department, 3rd Floor</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-orange-700">Country</label>
                <div className="text-sm text-orange-800 bg-white p-3 rounded border border-orange-200">
                  Egypt
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-orange-700">Time Zone</label>
                <div className="text-sm text-orange-800 bg-white p-3 rounded border border-orange-200">
                  EET (UTC+2)
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-orange-700">Service Region</label>
                <div className="text-sm text-orange-800 bg-white p-3 rounded border border-orange-200">
                  Middle East & North Africa
                </div>
              </div>
            </div>
          </div>

          {/* Tax & Compliance Section */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Tax & Compliance
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-yellow-700">ETA Tax Number</label>
                <div className="bg-white p-3 rounded border border-yellow-200">
                  {customer.taxNumber ? (
                    <span className="text-blue-600 font-medium font-mono">{customer.taxNumber}</span>
                  ) : (
                    <span className="text-gray-500">Not registered with ETA</span>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-yellow-700">VAT Status</label>
                <div className="text-sm text-yellow-800 bg-white p-3 rounded border border-yellow-200">
                  VAT Registered - 14%
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-yellow-700">Tax Classification</label>
                <div className="bg-white p-3 rounded border border-yellow-200">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Compliant
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-yellow-700">Commercial Registration</label>
                <div className="text-sm text-yellow-800 bg-white p-3 rounded border border-yellow-200 font-mono">
                  CR-{customer.id}2024-EGY
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-yellow-700">License Expiry</label>
                <div className="text-sm text-yellow-800 bg-white p-3 rounded border border-yellow-200">
                  December 31, 2025
                </div>
              </div>
            </div>
          </div>

          {/* Account Summary Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Account Summary & Performance
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded border border-gray-200">
                <div className="text-sm font-medium text-gray-700">Total Purchases</div>
                <div className="text-2xl font-bold text-green-600">8,450 EGP</div>
                <div className="text-xs text-gray-500">Lifetime value</div>
              </div>
              
              <div className="bg-white p-4 rounded border border-gray-200">
                <div className="text-sm font-medium text-gray-700">Open Invoices</div>
                <div className="text-2xl font-bold text-orange-600">2</div>
                <div className="text-xs text-gray-500">Pending payment</div>
              </div>
              
              <div className="bg-white p-4 rounded border border-gray-200">
                <div className="text-sm font-medium text-gray-700">Total Orders</div>
                <div className="text-2xl font-bold text-blue-600">47</div>
                <div className="text-xs text-gray-500">Since registration</div>
              </div>
              
              <div className="bg-white p-4 rounded border border-gray-200">
                <div className="text-sm font-medium text-gray-700">Payment Score</div>
                <div className="text-2xl font-bold text-green-600">96.5%</div>
                <div className="text-xs text-gray-500">On-time payments</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Last Order Date</label>
                <div className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-200">
                  April 28, 2025
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Average Order Value</label>
                <div className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-200">
                  1,875 EGP
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Customer Tier</label>
                <div className="bg-white p-3 rounded border border-gray-200">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold-100 text-gold-800">
                    Gold Customer
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice History Section */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Recent Invoice History
            </h3>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>ETA Number</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">#{invoice.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                          {formatDate(invoice.date)}
                        </div>
                      </TableCell>
                      <TableCell>{invoice.items}</TableCell>
                      <TableCell className="text-right font-medium">{invoice.amount.toLocaleString()} EGP</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            invoice.status === 'paid'
                              ? 'bg-green-500'
                              : invoice.status === 'pending'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-blue-600 font-mono text-xs">
                          ETA-{invoice.id}2025
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-500">Total Invoices: 4 | Average Payment Time: 18 days</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total Amount</div>
                    <div className="text-xl font-bold text-green-600">8,450 EGP</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-gray-300 hover:bg-gray-50"
          >
            Close
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export Profile'}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Mail className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerProfileDialog;