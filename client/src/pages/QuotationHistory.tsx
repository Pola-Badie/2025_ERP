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
  Truck,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { apiRequest } from '@/lib/queryClient';

// Enhanced Quotation interface
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
  amount: number;
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

// Helper functions
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
        <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
          <Factory className="mr-1 h-3 w-3" />
          Manufacturing
        </Badge>
      );
    case 'refining':
      return (
        <Badge className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100">
          <TestTube className="mr-1 h-3 w-3" />
          Refining
        </Badge>
      );
    case 'finished':
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
          <Package className="mr-1 h-3 w-3" />
          Finished
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-50 text-gray-700 border-gray-200">
          <FileText className="mr-1 h-3 w-3" />
          Standard
        </Badge>
      );
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'draft':
      return <Badge variant="outline" className="text-gray-600 border-gray-300">Draft</Badge>;
    case 'sent':
      return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">Sent</Badge>;
    case 'pending':
      return <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">Pending</Badge>;
    case 'accepted':
      return <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">Accepted</Badge>;
    case 'rejected':
      return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">Rejected</Badge>;
    case 'expired':
      return <Badge variant="outline" className="text-gray-600 border-gray-300 bg-gray-50">Expired</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const QuotationHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch quotations
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

  // Filter quotations
  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = searchTerm === '' || 
      quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
    const matchesType = typeFilter === 'all' || quotation.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Handle quotation preview
  const handlePreview = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setShowPreview(true);
  };

  // Get summary statistics
  const totalQuotations = filteredQuotations.length;
  const pendingQuotations = filteredQuotations.filter(q => q.status === 'pending').length;
  const acceptedQuotations = filteredQuotations.filter(q => q.status === 'accepted').length;
  const totalValue = filteredQuotations.reduce((sum, q) => sum + (q.total || q.amount), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardList className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quotation History</h1>
              <p className="text-gray-600">Manage and track all pharmaceutical quotations</p>
            </div>
          </div>
          <Button 
            onClick={() => window.location.href = '/create-quotation'}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Quotation
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Quotations</p>
                  <p className="text-2xl font-bold text-gray-900">{totalQuotations}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingQuotations}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Accepted</p>
                  <p className="text-2xl font-bold text-green-600">{acceptedQuotations}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${totalValue.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search quotations by number, customer, or product..."
                    className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] border-gray-200">
                    <Filter className="mr-2 h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="Status" />
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

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px] border-gray-200">
                    <Package className="mr-2 h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="refining">Refining</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[160px] border-gray-200">
                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="Date" />
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

        {/* Quotations Table */}
        <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Quotations ({filteredQuotations.length})
            </CardTitle>
            <CardDescription>
              Comprehensive list of all pharmaceutical quotations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Schedule List Header */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {filteredQuotations.length} quotation{filteredQuotations.length !== 1 ? 's' : ''}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>

                {/* Professional Schedule Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 border-b border-gray-200">
                        <TableHead className="w-12 px-4">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 px-4">Quotation #</TableHead>
                        <TableHead className="font-semibold text-gray-700 px-4">ETA #</TableHead>
                        <TableHead className="font-semibold text-gray-700 px-4">Customer</TableHead>
                        <TableHead className="font-semibold text-gray-700 px-4">Date</TableHead>
                        <TableHead className="font-semibold text-gray-700 px-4 text-right">Amount</TableHead>
                        <TableHead className="font-semibold text-gray-700 px-4 text-right">Outstanding</TableHead>
                        <TableHead className="font-semibold text-gray-700 px-4">Payment Method</TableHead>
                        <TableHead className="font-semibold text-gray-700 px-4">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700 px-4 text-center">ETA Upload</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuotations.map((quotation, index) => (
                        <TableRow 
                          key={quotation.id} 
                          className="hover:bg-gray-50/70 border-b border-gray-100 transition-colors"
                        >
                          <TableCell className="px-4">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </TableCell>
                          <TableCell className="font-medium text-blue-600 px-4">
                            {quotation.quotationNumber}
                          </TableCell>
                          <TableCell className="text-gray-500 px-4">
                            Not uploaded
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 px-4">
                            <div>
                              <div>{quotation.customerName}</div>
                              {quotation.type === 'manufacturing' && (
                                <div className="text-xs text-gray-500">Manufacturing Services</div>
                              )}
                              {quotation.type === 'refining' && (
                                <div className="text-xs text-gray-500">API Purification</div>
                              )}
                              {quotation.type === 'finished' && (
                                <div className="text-xs text-gray-500">Finished Products</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600 px-4">
                            {format(new Date(quotation.date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right font-semibold px-4 text-gray-900">
                            ${(quotation.total || quotation.amount).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right px-4">
                            {quotation.status === 'accepted' ? (
                              <span className="text-gray-900 font-medium">$0.00</span>
                            ) : quotation.status === 'pending' ? (
                              <span className="text-orange-600 font-medium">
                                ${(quotation.total || quotation.amount).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="px-4">
                            {quotation.transportationType === 'air-freight' && 'Air freight'}
                            {quotation.transportationType === 'sea-freight' && 'Sea freight'}
                            {quotation.transportationType === 'ground-express' && 'Ground express'}
                            {quotation.transportationType === 'ground-standard' && 'Ground standard'}
                            {!quotation.transportationType && 'Credit card'}
                          </TableCell>
                          <TableCell className="px-4">
                            {quotation.status === 'accepted' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Paid
                              </span>
                            )}
                            {quotation.status === 'pending' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                Partial
                              </span>
                            )}
                            {quotation.status === 'rejected' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Unpaid
                              </span>
                            )}
                            {quotation.status === 'expired' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Overdue
                              </span>
                            )}
                            {quotation.status === 'draft' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Draft
                              </span>
                            )}
                            {quotation.status === 'sent' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Sent
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            >
                              N
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Footer */}
                <div className="flex items-center justify-center text-sm text-gray-600 pt-4">
                  Showing 1 to {filteredQuotations.length} of {filteredQuotations.length} quotations
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        {selectedQuotation && (
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  Quotation #{selectedQuotation.quotationNumber}
                </DialogTitle>
                <DialogDescription>
                  Created: {format(new Date(selectedQuotation.date), 'PPPP')} • 
                  Valid Until: {format(new Date(selectedQuotation.validUntil), 'PPPP')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="border rounded-lg p-6 bg-white">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-blue-600">PHARMACEUTICAL QUOTATION</h2>
                    <p className="text-gray-600 mt-1">PharmaOverseas Ltd.</p>
                    <p className="text-gray-600">123 Pharma Street, Lagos, Nigeria</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">#{selectedQuotation.quotationNumber}</p>
                    <p className="text-gray-600">Date: {format(new Date(selectedQuotation.date), 'PP')}</p>
                    <p className="text-gray-600">Valid Until: {format(new Date(selectedQuotation.validUntil), 'PP')}</p>
                    <div className="mt-3 flex items-center gap-2 justify-end">
                      {getQuotationTypeBadge(selectedQuotation.type)}
                      {getStatusBadge(selectedQuotation.status)}
                    </div>
                  </div>
                </div>
                
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Customer:</h3>
                    <p className="font-medium text-gray-800">{selectedQuotation.customerName}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Quotation Type:</h3>
                    {getQuotationTypeBadge(selectedQuotation.type)}
                  </div>
                </div>
                
                {/* Items Table */}
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Products & Services</h3>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Description</TableHead>
                        <TableHead className="text-center font-semibold">UoM</TableHead>
                        <TableHead className="text-right font-semibold">Qty</TableHead>
                        <TableHead className="text-right font-semibold">Unit Price</TableHead>
                        <TableHead className="text-right font-semibold">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedQuotation.items.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{item.productName}</p>
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              )}
                              {item.specifications && (
                                <p className="text-xs text-gray-500 mt-1">
                                  <span className="font-medium">Specs:</span> {item.specifications}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{item.uom}</TableCell>
                          <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            ${item.unitPrice.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${item.total.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Totals */}
                <div className="flex justify-end mb-8">
                  <div className="w-80">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">
                          ${(selectedQuotation.subtotal || selectedQuotation.amount).toLocaleString()}
                        </span>
                      </div>
                      {selectedQuotation.transportationFees > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Transportation:</span>
                          <span className="font-medium">
                            ${selectedQuotation.transportationFees.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">VAT (14%):</span>
                        <span className="font-medium">
                          ${(selectedQuotation.tax || selectedQuotation.amount * 0.14).toLocaleString()}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-blue-600">
                          ${(selectedQuotation.total || selectedQuotation.amount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transportation Details */}
                {selectedQuotation.transportationType && selectedQuotation.transportationType !== 'pickup' && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Transportation & Delivery
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm">
                      <p><span className="font-medium">Method:</span> {selectedQuotation.transportationType?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                      <p><span className="font-medium">Fee:</span> ${selectedQuotation.transportationFees?.toLocaleString()}</p>
                      {selectedQuotation.transportationNotes && (
                        <p><span className="font-medium">Notes:</span> {selectedQuotation.transportationNotes}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedQuotation.notes && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Notes & Instructions</h3>
                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-gray-700">
                      {selectedQuotation.notes}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default QuotationHistory;