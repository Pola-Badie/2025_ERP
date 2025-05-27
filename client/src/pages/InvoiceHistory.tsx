import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Search, 
  Filter,
  MoreHorizontal,
  Edit,
  Eye,
  Download,
  Mail,
  MessageCircle,
  Trash2,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: number;
  invoiceNumber: string;
  customerName: string;
  date: string;
  dueDate?: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'partial' | 'overdue';
  etaUploaded?: boolean;
  etaReference?: string;
}

const InvoiceHistory = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const sampleInvoices: Invoice[] = [
      {
        id: 1001,
        invoiceNumber: "INV-002501",
        customerName: "Ahmed Hassan",
        date: "2025-05-01T10:30:00Z",
        dueDate: "2025-05-16T10:30:00Z",
        amount: 1250.75,
        status: "paid",
        etaUploaded: true,
        etaReference: "ETA-20250501-XY123"
      },
      {
        id: 1002,
        invoiceNumber: "INV-002502",
        customerName: "Cairo Medical Supplies Ltd.",
        date: "2025-05-05T14:20:00Z",
        dueDate: "2025-05-20T14:20:00Z",
        amount: 3245.00,
        status: "partial",
        etaUploaded: false
      },
      {
        id: 1003,
        invoiceNumber: "INV-002503",
        customerName: "Alexandria Pharma Co.",
        date: "2025-05-08T09:15:00Z",
        dueDate: "2025-05-23T09:15:00Z",
        amount: 875.50,
        status: "unpaid",
        etaUploaded: false
      },
      {
        id: 1004,
        invoiceNumber: "INV-002504",
        customerName: "Modern Laboratories Inc.",
        date: "2025-04-20T16:45:00Z",
        dueDate: "2025-05-05T16:45:00Z",
        amount: 4520.75,
        status: "overdue",
        etaUploaded: true,
        etaReference: "ETA-20250420-AB789"
      }
    ];
    
    setInvoices(sampleInvoices);
  }, []);

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
      <Badge className={`${config.bg} ${config.text}`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Invoice History
          </h1>
          <p className="text-gray-600 mt-1">
            View and manage all your invoices
          </p>
        </div>
        <Button onClick={() => window.location.href = '/create-invoice'}>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search invoices..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
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
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>{invoice.customerName}</TableCell>
                      <TableCell>
                        {format(new Date(invoice.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        ${invoice.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status)}
                      </TableCell>
                      <TableCell>
                        {invoice.etaUploaded ? (
                          <Badge className="bg-green-100 text-green-800">
                            {invoice.etaReference}
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">
                            Not Uploaded
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Email
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageCircle className="h-4 w-4 mr-2" />
                              WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceHistory;