import React, { useState } from 'react';
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
import { FileText, Download, Eye, Search, Calendar, Filter, FilePlus, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface Quotation {
  id: number;
  quotationNumber: string;
  customerName: string;
  date: string;
  validUntil: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    uom: string;
    total: number;
  }[];
}

const QuotationHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch quotations
  const { data: quotations = [], isLoading } = useQuery<Quotation[]>({
    queryKey: ['/api/quotations', searchTerm, statusFilter, dateFilter],
    queryFn: async () => {
      const res = await apiRequest(
        'GET', 
        `/api/quotations?query=${encodeURIComponent(searchTerm)}&status=${statusFilter}&date=${dateFilter}`
      );
      return await res.json();
    },
  });

  // Filter quotations based on search term and filters
  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = searchTerm === '' || 
      quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
    
    // Simple date filtering (in a real app, would use proper date comparison)
    const matchesDate = dateFilter === 'all' || true;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Handle quotation preview
  const handlePreview = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setShowPreview(true);
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Quotation History</h1>
            <p className="text-muted-foreground">View and manage all your quotations</p>
          </div>
        </div>
        <Button onClick={() => window.location.href = '/create-quotation'}>
          <FilePlus className="mr-2 h-4 w-4" />
          Create New Quotation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Find Quotations</CardTitle>
          <CardDescription>Search and filter through your quotation history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by quotation number or customer..."
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
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
          <CardTitle>Quotation List</CardTitle>
          <CardDescription>
            Showing {filteredQuotations.length} quotations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredQuotations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No quotations found</p>
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' ? (
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters</p>
              ) : (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.href = '/create-quotation'}
                >
                  <FilePlus className="mr-2 h-4 w-4" />
                  Create Your First Quotation
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quotation #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Created On</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell className="font-medium">{quotation.quotationNumber}</TableCell>
                      <TableCell>{quotation.customerName}</TableCell>
                      <TableCell>{format(new Date(quotation.date), 'PP')}</TableCell>
                      <TableCell>{format(new Date(quotation.validUntil), 'PP')}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(quotation.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handlePreview(quotation)}
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
          )}
        </CardContent>
      </Card>

      {/* Quotation Preview Dialog */}
      {selectedQuotation && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Quotation #{selectedQuotation.quotationNumber}</DialogTitle>
              <DialogDescription>
                Created: {format(new Date(selectedQuotation.date), 'PPP')}
                <br />
                Valid Until: {format(new Date(selectedQuotation.validUntil), 'PPP')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="border rounded-lg p-6">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-blue-600">QUOTATION</h2>
                  <p className="text-muted-foreground">PharmaOverseas Ltd.</p>
                  <p className="text-muted-foreground">123 Pharma Street, Lagos</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">Quotation #: {selectedQuotation.quotationNumber}</p>
                  <p>Date: {format(new Date(selectedQuotation.date), 'PP')}</p>
                  <p>Valid Until: {format(new Date(selectedQuotation.validUntil), 'PP')}</p>
                  <p className="mt-2">
                    {getStatusBadge(selectedQuotation.status)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="font-semibold mb-2">Customer:</h3>
                  <p className="font-medium">{selectedQuotation.customerName}</p>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">UoM</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedQuotation.items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="text-center">{item.uom}</TableCell>
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
              
              <div className="mt-8 flex justify-end">
                <div className="w-72">
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(selectedQuotation.amount)}
                    </span>
                  </div>
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

export default QuotationHistory;