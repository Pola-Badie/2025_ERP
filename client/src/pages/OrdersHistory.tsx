import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  MoreHorizontal, 
  Calendar,
  Factory,
  Settings,
  History as HistoryIcon,
  FileText,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface OrderHistoryItem {
  id: string;
  orderNumber: string;
  batchNumber: string;
  type: 'production' | 'refining';
  customerName: string;
  customerCompany: string;
  targetProduct: string;
  orderDate: string;
  completionDate: string;
  status: 'completed' | 'in-progress' | 'cancelled';
  totalCost: number;
  revenue: number;
  profit: number;
  rawMaterials: string[];
  additionalCosts: {
    transportation: number;
    labor: number;
    equipment: number;
    qualityControl: number;
    storage: number;
  };
}

const OrdersHistory: React.FC = () => {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderHistoryItem | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const itemsPerPage = 10;

  // Fetch production order history from database
  const { data: orderHistory = [], isLoading } = useQuery({
    queryKey: ['/api/orders/production-history'],
    queryFn: async () => {
      const response = await fetch('/api/orders/production-history');
      if (!response.ok) {
        throw new Error('Failed to fetch production order history');
      }
      const data = await response.json();
      console.log('API response data:', data);
      return data;
    }
  });

  // Keep the sample data as fallback only for demonstration
  const sampleOrderHistory: OrderHistoryItem[] = [
    {
      id: 'ORD-001',
      orderNumber: 'PROD-2024-001',
      batchNumber: 'BATCH-001-240524',
      type: 'production',
      customerName: 'Ahmed Hassan',
      customerCompany: 'Cairo Medical Center',
      targetProduct: 'Paracetamol 500mg',
      orderDate: '2024-05-20',
      completionDate: '2024-05-23',
      status: 'completed',
      totalCost: 15420,
      revenue: 22800,
      profit: 7380,
      rawMaterials: ['Para-aminophenol', 'Acetic Anhydride', 'Sodium Acetate'],
      additionalCosts: {
        transportation: 850,
        labor: 2100,
        equipment: 1200,
        qualityControl: 750,
        storage: 520
      }
    },
    {
      id: 'ORD-002',
      orderNumber: 'REF-2024-001',
      batchNumber: 'REF-002-240522',
      type: 'refining',
      customerName: 'Fatima Al-Zahra',
      customerCompany: 'Alexandria Pharmaceuticals',
      targetProduct: 'Amoxicillin 250mg',
      orderDate: '2024-05-18',
      completionDate: '2024-05-22',
      status: 'completed',
      totalCost: 18750,
      revenue: 28900,
      profit: 10150,
      rawMaterials: ['Amoxicillin Trihydrate', 'Microcrystalline Cellulose'],
      additionalCosts: {
        transportation: 950,
        labor: 2800,
        equipment: 1500,
        qualityControl: 900,
        storage: 600
      }
    },
    {
      id: 'ORD-003',
      orderNumber: 'PROD-2024-002',
      batchNumber: 'BATCH-003-240521',
      type: 'production',
      customerName: 'Mohamed Ibrahim',
      customerCompany: 'Giza Health Systems',
      targetProduct: 'Ibuprofen 400mg',
      orderDate: '2024-05-19',
      completionDate: '2024-05-24',
      status: 'in-progress',
      totalCost: 13200,
      revenue: 19500,
      profit: 6300,
      rawMaterials: ['Isobutylbenzene', 'Propanoic Acid', 'Magnesium Stearate'],
      additionalCosts: {
        transportation: 720,
        labor: 1800,
        equipment: 1100,
        qualityControl: 680,
        storage: 480
      }
    },
    {
      id: 'ORD-004',
      orderNumber: 'REF-2024-002',
      batchNumber: 'REF-004-240523',
      type: 'refining',
      customerName: 'Layla Mahmoud',
      customerCompany: 'Delta Medical Supply',
      targetProduct: 'Aspirin 325mg',
      orderDate: '2024-05-21',
      completionDate: '2024-05-25',
      status: 'completed',
      totalCost: 11500,
      revenue: 17200,
      profit: 5700,
      rawMaterials: ['Salicylic Acid', 'Acetic Anhydride'],
      additionalCosts: {
        transportation: 650,
        labor: 1600,
        equipment: 950,
        qualityControl: 580,
        storage: 420
      }
    },
    {
      id: 'ORD-005',
      orderNumber: 'PROD-2024-003',
      batchNumber: 'BATCH-005-240524',
      type: 'production',
      customerName: 'Omar Khalil',
      customerCompany: 'Suez Pharmaceutical Co.',
      targetProduct: 'Metformin 500mg',
      orderDate: '2024-05-22',
      completionDate: '2024-05-26',
      status: 'in-progress',
      totalCost: 16800,
      revenue: 24600,
      profit: 7800,
      rawMaterials: ['Dimethylamine Hydrochloride', 'Cyanoguanidine'],
      additionalCosts: {
        transportation: 890,
        labor: 2200,
        equipment: 1350,
        qualityControl: 820,
        storage: 580
      }
    }
  ];

  // Filter orders based on search and filters
  const filteredOrders = orderHistory.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.targetProduct.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesType = typeFilter === 'all' || order.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'production':
      case 'manufacturing':
        return <Badge className="bg-purple-100 text-purple-800"><Factory className="w-3 h-3 mr-1" />Manufacturing</Badge>;
      case 'refining':
        return <Badge className="bg-orange-100 text-orange-800"><Settings className="w-3 h-3 mr-1" />Refining</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const exportToCSV = () => {
    const headers = ['Order Number', 'Batch Number', 'Type', 'Customer', 'Company', 'Product', 'Order Date', 'Completion Date', 'Status', 'Total Cost', 'Revenue', 'Profit'];
    const csvData = [
      headers,
      ...filteredOrders.map(order => [
        order.orderNumber,
        order.batchNumber,
        order.type,
        order.customerName,
        order.customerCompany,
        order.targetProduct,
        order.orderDate,
        order.completionDate,
        order.status,
        order.totalCost,
        order.revenue,
        order.profit
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders-history.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleViewDetails = (order: OrderHistoryItem) => {
    setSelectedOrder(order);
    setIsDetailsDialogOpen(true);
  };

  const handleDownloadReport = (order: OrderHistoryItem) => {
    const reportData = {
      orderNumber: order.orderNumber,
      batchNumber: order.batchNumber,
      type: order.type,
      customer: {
        name: order.customerName,
        company: order.customerCompany
      },
      product: order.targetProduct,
      dates: {
        orderDate: order.orderDate,
        completionDate: order.completionDate
      },
      status: order.status,
      financial: {
        totalCost: order.totalCost,
        revenue: order.revenue,
        profit: order.profit,
        profitMargin: ((order.profit / order.revenue) * 100).toFixed(2)
      },
      additionalCosts: order.additionalCosts,
      rawMaterials: order.rawMaterials
    };

    const reportContent = `ORDER REPORT\n============\n\nOrder Number: ${reportData.orderNumber}\nBatch Number: ${reportData.batchNumber}\nOrder Type: ${reportData.type.toUpperCase()}\n\nCUSTOMER INFORMATION\n==================\nName: ${reportData.customer.name}\nCompany: ${reportData.customer.company}\n\nPRODUCT INFORMATION\n==================\nTarget Product: ${reportData.product}\n\nTIMELINE\n========\nOrder Date: ${reportData.dates.orderDate}\nCompletion Date: ${reportData.dates.completionDate}\nStatus: ${reportData.status.toUpperCase()}\n\nFINANCIAL SUMMARY\n================\nTotal Cost: $${reportData.financial.totalCost.toLocaleString()}\nRevenue: $${reportData.financial.revenue.toLocaleString()}\nNet Profit: $${reportData.financial.profit.toLocaleString()}\nProfit Margin: ${reportData.financial.profitMargin}%\n\nADDITIONAL COSTS BREAKDOWN\n=========================\nTransportation: $${reportData.additionalCosts.transportation}\nLabor: $${reportData.additionalCosts.labor}\nEquipment: $${reportData.additionalCosts.equipment}\nQuality Control: $${reportData.additionalCosts.qualityControl}\nStorage: $${reportData.additionalCosts.storage}\nTotal Additional: $${Object.values(reportData.additionalCosts).reduce((sum, cost) => sum + cost, 0)}\n\nRAW MATERIALS\n=============\n${reportData.rawMaterials.map((material, index) => `${index + 1}. ${material}`).join('\n')}\n\nReport generated on: ${new Date().toLocaleString()}`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${order.orderNumber}_report.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleGenerateInvoice = (order: OrderHistoryItem) => {
    // Navigate to create invoice page with pre-filled data from the order
    const invoiceData = {
      customer: order.customerName,
      company: order.customerCompany,
      items: [
        {
          product: order.targetProduct,
          quantity: 1,
          unitPrice: order.revenue,
          total: order.revenue
        }
      ],
      orderReference: order.orderNumber,
      batchNumber: order.batchNumber
    };
    
    // Store the invoice data in localStorage for the invoice page to use
    localStorage.setItem('invoiceFromOrder', JSON.stringify(invoiceData));
    
    // Navigate to create invoice page
    window.location.href = '/create-invoice';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <HistoryIcon className="h-8 w-8 text-[#3BCEAC]" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders History</h1>
            <p className="text-gray-500">Track and review all executed production and refining orders</p>
          </div>
        </div>
        <Button onClick={exportToCSV} className="bg-[#3BCEAC] hover:bg-[#2A9A7A]">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderHistory.length}</div>
            <p className="text-xs text-muted-foreground">All time orders</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orderHistory.filter(o => o.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${orderHistory.reduce((sum, order) => sum + order.revenue, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">From all orders</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.round(orderHistory.reduce((sum, order) => sum + order.profit, 0) / orderHistory.length).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Per order</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders, customers, products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="refining">Refining</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order History ({filteredOrders.length} orders)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timeline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Financial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          Batch: {order.batchNumber}
                        </div>
                        <div className="mt-1">
                          {getTypeBadge(order.type)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.customerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customerCompany}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.targetProduct}
                      </div>
                      <div className="text-sm text-gray-500">
                        Materials: {order.rawMaterials.length} items
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          Started: {new Date(order.orderDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Completed: {new Date(order.completionDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          Revenue: ${order.revenue.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Cost: ${order.totalCost.toLocaleString()}
                        </div>
                        <div className="text-sm font-medium text-green-600">
                          Profit: ${order.profit.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadReport(order)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Report
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGenerateInvoice(order)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Generate Invoice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center space-x-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? "bg-[#3BCEAC] hover:bg-[#2A9A7A]" : ""}
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
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-2xl font-bold">
                      Order #{selectedOrder.orderNumber}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 mt-1">
                      {selectedOrder.orderDate} • Status: {getStatusBadge(selectedOrder.status)}
                    </DialogDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Batch Number</div>
                    <div className="font-semibold text-lg">{selectedOrder.batchNumber}</div>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-6">
                {/* Left Column - Order Information */}
                <div className="space-y-6">
                  {/* Customer Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Customer Information</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-600">Customer:</span>
                        <div className="font-medium">{selectedOrder.customerName}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Company:</span>
                        <div className="font-medium">{selectedOrder.customerCompany}</div>
                      </div>
                    </div>
                  </div>

                  {/* Product Information */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-blue-800">Product Information</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-blue-600">Target Product:</span>
                        <div className="font-medium text-blue-900">{selectedOrder.targetProduct}</div>
                      </div>
                      <div>
                        <span className="text-sm text-blue-600">Order Type:</span>
                        <div className="font-medium text-blue-900 capitalize">{selectedOrder.type}</div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-green-800">Timeline</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-green-600">Order Date:</span>
                        <div className="font-medium text-green-900">{selectedOrder.orderDate}</div>
                      </div>
                      <div>
                        <span className="text-sm text-green-600">Completion Date:</span>
                        <div className="font-medium text-green-900">{selectedOrder.completionDate}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Financial Summary */}
                <div className="space-y-6">
                  {/* Financial Summary */}
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-amber-800">Financial Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-amber-700">Total Cost:</span>
                        <span className="font-bold text-amber-900">${selectedOrder.totalCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-amber-700">Revenue:</span>
                        <span className="font-bold text-amber-900">${selectedOrder.revenue.toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-amber-800">Net Profit:</span>
                          <span className="text-xl font-bold text-green-600">${selectedOrder.profit.toLocaleString()}</span>
                        </div>
                        <div className="text-sm text-amber-600 text-right">
                          Margin: {((selectedOrder.profit / selectedOrder.revenue) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Costs Breakdown */}
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-red-800">Additional Costs Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-red-700">Transportation:</span>
                        <span className="font-medium text-red-900">${selectedOrder.additionalCosts.transportation}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">Labor:</span>
                        <span className="font-medium text-red-900">${selectedOrder.additionalCosts.labor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">Equipment:</span>
                        <span className="font-medium text-red-900">${selectedOrder.additionalCosts.equipment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">Quality Control:</span>
                        <span className="font-medium text-red-900">${selectedOrder.additionalCosts.qualityControl}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">Storage:</span>
                        <span className="font-medium text-red-900">${selectedOrder.additionalCosts.storage}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-semibold">
                          <span className="text-red-800">Total Additional:</span>
                          <span className="text-red-900">
                            ${Object.values(selectedOrder.additionalCosts).reduce((sum, cost) => sum + cost, 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Raw Materials Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Raw Materials Used</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {selectedOrder.rawMaterials.map((material, index) => (
                      <div key={index} className="bg-white p-2 rounded border">
                        <span className="text-sm font-medium text-gray-700">{index + 1}. {material}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadReport(selectedOrder)}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Report</span>
                </Button>
                <Button
                  onClick={() => handleGenerateInvoice(selectedOrder)}
                  className="flex items-center space-x-2 bg-[#3BCEAC] hover:bg-[#2A9A7A]"
                >
                  <FileText className="h-4 w-4" />
                  <span>Generate Invoice</span>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersHistory;