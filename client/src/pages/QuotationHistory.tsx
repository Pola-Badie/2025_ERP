import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Search, 
  Filter, 
  Calendar, 
  Eye, 
  Download, 
  FilePlus, 
  ClipboardList,
  Package,
  Factory,
  TestTube,
  FileText,
  Truck
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';

// Enhanced Quotation interface matching the creation system
interface Quotation {
  id: number;
  quotationNumber: string;
  type: 'manufacturing' | 'refining' | 'finished';
  customerName: string;
  customerId: number;
  date: string;
  validUntil: string;
  notes?: string;
  subtotal: number;
  transportationFees: number;
  transportationType?: string;
  transportationNotes?: string;
  tax: number;
  total: number;
  amount: number; // For backward compatibility
  status: 'draft' | 'sent' | 'pending' | 'accepted' | 'rejected' | 'expired';
  items: {
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
  }[];
}

// Helper functions for quotation types and status
const getQuotationTypeIcon = (type: string) => {
  switch (type) {
    case 'manufacturing': return <Factory className="h-4 w-4" />;
    case 'refining': return <TestTube className="h-4 w-4" />;
    case 'finished': return <Package className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
};

const getQuotationTypeBadge = (type: string) => {
  switch (type) {
    case 'manufacturing':
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
          <Factory className="mr-1 h-3 w-3" />
          Manufacturing
        </Badge>
      );
    case 'refining':
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
          <TestTube className="mr-1 h-3 w-3" />
          Refining
        </Badge>
      );
    case 'finished':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <Package className="mr-1 h-3 w-3" />
          Finished
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200">
          <FileText className="mr-1 h-3 w-3" />
          Product
        </Badge>
      );
  }
};

const QuotationHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch quotations with all filters
  const { data: quotations = [], isLoading } = useQuery<Quotation[]>({
    queryKey: ['/api/quotations', searchTerm, statusFilter, typeFilter, dateFilter],
    queryFn: async () => {
      const res = await apiRequest(
        'GET', 
        `/api/quotations?query=${encodeURIComponent(searchTerm)}&status=${statusFilter}&type=${typeFilter}&date=${dateFilter}`
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
    const matchesType = typeFilter === 'all' || quotation.type === typeFilter;
    
    // Simple date filtering (in a real app, would use proper date comparison)
    const matchesDate = dateFilter === 'all' || true;
    
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  // Handle quotation preview
  const handlePreview = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setShowPreview(true);
  };

  // Get status badge with enhanced colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-800">Sent</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
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
            <p className="text-muted-foreground">View and manage all your pharmaceutical quotations</p>
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
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[180px]">
                <Select 
                  value={typeFilter} 
                  onValueChange={setTypeFilter}
                >
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Package className="mr-2 h-4 w-4" />
                      <span>Type</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="refining">Refining</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
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
                    <TableHead>Type</TableHead>
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
                      <TableCell>{getQuotationTypeBadge(quotation.type || 'manufacturing')}</TableCell>
                      <TableCell>{quotation.customerName}</TableCell>
                      <TableCell>{format(new Date(quotation.date), 'PP')}</TableCell>
                      <TableCell>{format(new Date(quotation.validUntil), 'PP')}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(quotation.total || quotation.amount)}
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

      {/* Enhanced Quotation Preview Dialog */}
      {selectedQuotation && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl">
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
                  <h2 className="text-2xl font-bold text-blue-600">PHARMACEUTICAL QUOTATION</h2>
                  <p className="text-muted-foreground">PharmaOverseas Ltd.</p>
                  <p className="text-muted-foreground">123 Pharma Street, Lagos</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">Quotation #: {selectedQuotation.quotationNumber}</p>
                  <p>Date: {format(new Date(selectedQuotation.date), 'PP')}</p>
                  <p>Valid Until: {format(new Date(selectedQuotation.validUntil), 'PP')}</p>
                  <div className="mt-2 flex items-center gap-2 justify-end">
                    {getQuotationTypeIcon(selectedQuotation.type || 'manufacturing')}
                    <span className="text-sm font-medium capitalize">{selectedQuotation.type || 'manufacturing'}</span>
                  </div>
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
                <div>
                  <h3 className="font-semibold mb-2">Quotation Type:</h3>
                  <div className="flex items-center gap-2">
                    {getQuotationTypeBadge(selectedQuotation.type || 'manufacturing')}
                  </div>
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
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}
                          {item.specifications && (
                            <p className="text-xs text-muted-foreground mt-1">Specs: {item.specifications}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{item.uom}</TableCell>
                      <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
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
                <div className="w-80">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(selectedQuotation.subtotal || selectedQuotation.amount)}
                    </span>
                  </div>
                  {selectedQuotation.transportationFees > 0 && (
                    <div className="flex justify-between">
                      <span>Transportation:</span>
                      <span>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(selectedQuotation.transportationFees)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>VAT (14%):</span>
                    <span>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(selectedQuotation.tax || selectedQuotation.amount * 0.14)}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(selectedQuotation.total || selectedQuotation.amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transportation Details */}
              {selectedQuotation.transportationType && selectedQuotation.transportationType !== 'pickup' && (
                <div className="mt-8">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Transportation & Delivery:
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><span className="font-medium">Method:</span> {selectedQuotation.transportationType?.charAt(0).toUpperCase()}{selectedQuotation.transportationType?.slice(1).replace('-', ' ')}</p>
                    <p><span className="font-medium">Fee:</span> {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(selectedQuotation.transportationFees || 0)}</p>
                    {selectedQuotation.transportationNotes && (
                      <p><span className="font-medium">Notes:</span> {selectedQuotation.transportationNotes}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedQuotation.notes && (
                <div className="mt-8">
                  <h3 className="font-semibold mb-2">Notes & Special Instructions:</h3>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">{selectedQuotation.notes}</p>
                </div>
              )}
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