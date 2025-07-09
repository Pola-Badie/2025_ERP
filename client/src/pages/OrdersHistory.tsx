import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
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
  ChevronRight,
  FileSpreadsheet,
  Printer
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
  const { t, isRTL, language } = useLanguage();
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

  // Debug logging
  console.log('orderHistory data:', orderHistory);
  console.log('orderHistory length:', orderHistory.length);

  // Export functions for individual orders
  const handleExportPDF = (order: OrderHistoryItem) => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(24);
      doc.setTextColor(41, 128, 185);
      doc.text('Premier ERP System', 20, 30);
      
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text('Order Production Report', 20, 45);
      
      // Order details
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 30);
      
      let yPos = 65;
      
      // Order Information
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Order Information', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      const orderDetails = [
        ['Order Number:', order.orderNumber],
        ['Batch Number:', order.batchNumber],
        ['Type:', order.type.charAt(0).toUpperCase() + order.type.slice(1)],
        ['Customer:', order.customerName],
        ['Company:', order.customerCompany],
        ['Product:', order.targetProduct],
        ['Order Date:', new Date(order.orderDate).toLocaleDateString()],
        ['Completion Date:', new Date(order.completionDate).toLocaleDateString()],
        ['Status:', order.status.toUpperCase()]
      ];
      
      orderDetails.forEach(([label, value]) => {
        doc.setTextColor(80, 80, 80);
        doc.text(String(label), 20, yPos);
        doc.setTextColor(0, 0, 0);
        doc.text(String(value), 80, yPos);
        yPos += 7;
      });
      
      yPos += 10;
      
      // Financial Summary
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Financial Summary', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      const financialData = [
        ['Total Cost:', `$${order.totalCost.toLocaleString()}`],
        ['Revenue:', `$${order.revenue.toLocaleString()}`],
        ['Profit:', `$${order.profit.toLocaleString()}`],
        ['Profit Margin:', `${((order.profit / order.revenue) * 100).toFixed(1)}%`]
      ];
      
      financialData.forEach(([label, value]) => {
        doc.setTextColor(80, 80, 80);
        doc.text(String(label), 20, yPos);
        doc.setTextColor(0, 0, 0);
        doc.text(String(value), 80, yPos);
        yPos += 7;
      });
      
      yPos += 10;
      
      // Additional Costs
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Additional Costs Breakdown', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      const additionalCosts = [
        ['Transportation:', `$${order.additionalCosts.transportation.toLocaleString()}`],
        ['Labor:', `$${order.additionalCosts.labor.toLocaleString()}`],
        ['Equipment:', `$${order.additionalCosts.equipment.toLocaleString()}`],
        ['Quality Control:', `$${order.additionalCosts.qualityControl.toLocaleString()}`],
        ['Storage:', `$${order.additionalCosts.storage.toLocaleString()}`]
      ];
      
      additionalCosts.forEach(([label, value]) => {
        doc.setTextColor(80, 80, 80);
        doc.text(String(label), 20, yPos);
        doc.setTextColor(0, 0, 0);
        doc.text(String(value), 80, yPos);
        yPos += 7;
      });
      
      yPos += 10;
      
      // Raw Materials
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Raw Materials Used', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      order.rawMaterials.forEach((material, index) => {
        doc.setTextColor(0, 0, 0);
        doc.text(`${index + 1}. ${material}`, 25, yPos);
        yPos += 6;
      });
      
      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('Generated by Premier ERP System', 20, pageHeight - 15);
      doc.text('Page 1 of 1', 170, pageHeight - 10);
      
      const fileName = `order-report-${order.orderNumber.replace(/[\/\\]/g, '-')}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleExportExcel = (order: OrderHistoryItem) => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Order Details Sheet
      const orderData = [
        ['Order Information', ''],
        ['Order Number', order.orderNumber],
        ['Batch Number', order.batchNumber],
        ['Type', order.type],
        ['Customer', order.customerName],
        ['Company', order.customerCompany],
        ['Product', order.targetProduct],
        ['Order Date', order.orderDate],
        ['Completion Date', order.completionDate],
        ['Status', order.status],
        ['', ''],
        ['Financial Summary', ''],
        ['Total Cost', order.totalCost],
        ['Revenue', order.revenue],
        ['Profit', order.profit],
        ['Profit Margin (%)', ((order.profit / order.revenue) * 100).toFixed(1)],
        ['', ''],
        ['Additional Costs', ''],
        ['Transportation', order.additionalCosts.transportation],
        ['Labor', order.additionalCosts.labor],
        ['Equipment', order.additionalCosts.equipment],
        ['Quality Control', order.additionalCosts.qualityControl],
        ['Storage', order.additionalCosts.storage],
        ['', ''],
        ['Raw Materials', ''],
        ...order.rawMaterials.map((material, index) => [`${index + 1}`, material])
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(orderData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Order Report');
      
      const fileName = `order-report-${order.orderNumber.replace(/[\/\\]/g, '-')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
    } catch (error) {
      console.error('Excel export error:', error);
      alert('Failed to export Excel file. Please try again.');
    }
  };

  const handlePrintReport = (order: OrderHistoryItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the report.');
      return;
    }
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order Report - ${order.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { color: #2980b9; font-size: 24px; font-weight: bold; }
            .report-title { font-size: 18px; margin-top: 10px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .detail-row { display: flex; margin-bottom: 5px; }
            .detail-label { font-weight: bold; width: 150px; }
            .detail-value { flex: 1; }
            .materials-list { margin-left: 20px; }
            .materials-item { margin-bottom: 3px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Premier ERP System</div>
            <div class="report-title">Order Production Report</div>
            <div style="font-size: 12px; color: #666; margin-top: 10px;">Generated: ${new Date().toLocaleDateString()}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Order Information</div>
            <div class="detail-row"><span class="detail-label">Order Number:</span><span class="detail-value">${order.orderNumber}</span></div>
            <div class="detail-row"><span class="detail-label">Batch Number:</span><span class="detail-value">${order.batchNumber}</span></div>
            <div class="detail-row"><span class="detail-label">Type:</span><span class="detail-value">${order.type.charAt(0).toUpperCase() + order.type.slice(1)}</span></div>
            <div class="detail-row"><span class="detail-label">Customer:</span><span class="detail-value">${order.customerName}</span></div>
            <div class="detail-row"><span class="detail-label">Company:</span><span class="detail-value">${order.customerCompany}</span></div>
            <div class="detail-row"><span class="detail-label">Product:</span><span class="detail-value">${order.targetProduct}</span></div>
            <div class="detail-row"><span class="detail-label">Order Date:</span><span class="detail-value">${new Date(order.orderDate).toLocaleDateString()}</span></div>
            <div class="detail-row"><span class="detail-label">Completion Date:</span><span class="detail-value">${new Date(order.completionDate).toLocaleDateString()}</span></div>
            <div class="detail-row"><span class="detail-label">Status:</span><span class="detail-value">${order.status.toUpperCase()}</span></div>
          </div>
          
          <div class="section">
            <div class="section-title">Financial Summary</div>
            <div class="detail-row"><span class="detail-label">Total Cost:</span><span class="detail-value">$${order.totalCost.toLocaleString()}</span></div>
            <div class="detail-row"><span class="detail-label">Revenue:</span><span class="detail-value">$${order.revenue.toLocaleString()}</span></div>
            <div class="detail-row"><span class="detail-label">Profit:</span><span class="detail-value">$${order.profit.toLocaleString()}</span></div>
            <div class="detail-row"><span class="detail-label">Profit Margin:</span><span class="detail-value">${((order.profit / order.revenue) * 100).toFixed(1)}%</span></div>
          </div>
          
          <div class="section">
            <div class="section-title">Additional Costs Breakdown</div>
            <div class="detail-row"><span class="detail-label">Transportation:</span><span class="detail-value">$${order.additionalCosts.transportation.toLocaleString()}</span></div>
            <div class="detail-row"><span class="detail-label">Labor:</span><span class="detail-value">$${order.additionalCosts.labor.toLocaleString()}</span></div>
            <div class="detail-row"><span class="detail-label">Equipment:</span><span class="detail-value">$${order.additionalCosts.equipment.toLocaleString()}</span></div>
            <div class="detail-row"><span class="detail-label">Quality Control:</span><span class="detail-value">$${order.additionalCosts.qualityControl.toLocaleString()}</span></div>
            <div class="detail-row"><span class="detail-label">Storage:</span><span class="detail-value">$${order.additionalCosts.storage.toLocaleString()}</span></div>
          </div>
          
          <div class="section">
            <div class="section-title">Raw Materials Used</div>
            <div class="materials-list">
              ${order.rawMaterials.map((material, index) => `<div class="materials-item">${index + 1}. ${material}</div>`).join('')}
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 40px; font-size: 10px; color: #666;">
            Generated by Premier ERP System
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Filter orders based on search and filters
  const filteredOrders = orderHistory.filter((order: OrderHistoryItem) => {
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
      ...filteredOrders.map((order: OrderHistoryItem) => [
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
        profitMargin: ((order.profit / order.revenue) * 100).toFixed(1)
      },
      additionalCosts: order.additionalCosts,
      rawMaterials: order.rawMaterials
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `order-report-${order.orderNumber}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleGenerateInvoice = (order: OrderHistoryItem) => {
    console.log('Generating invoice for order:', order);
    // Here you would typically navigate to invoice generation or call an API
    alert(`Invoice generation for order ${order.orderNumber} will be implemented soon.`);
  };

  // Calculate summary statistics
  const totalRevenue = filteredOrders.reduce((sum: number, order: OrderHistoryItem) => sum + order.revenue, 0);
  const totalCosts = filteredOrders.reduce((sum: number, order: OrderHistoryItem) => sum + order.totalCost, 0);
  const totalProfit = totalRevenue - totalCosts;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3BCEAC] mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#3BCEAC] rounded-lg">
              <HistoryIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Orders History</h1>
              <p className="text-gray-600">Production and refining order tracking</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Factory className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredOrders.length}</div>
                <p className="text-xs text-muted-foreground">Active production orders</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">From completed orders</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalCosts.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Production expenses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${totalProfit.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}% margin` : 'No data'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders..."
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
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="refining">Refining</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={exportToCSV} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
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
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Order #</th>
                    <th className="text-left p-4 font-medium">Batch #</th>
                    <th className="text-left p-4 font-medium">Type</th>
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Product</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Revenue</th>
                    <th className="text-left p-4 font-medium">Profit</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order: OrderHistoryItem) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium text-blue-600">{order.orderNumber}</td>
                      <td className="p-4 text-gray-600">{order.batchNumber}</td>
                      <td className="p-4">{getTypeBadge(order.type)}</td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-sm text-gray-500">{order.customerCompany}</div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{order.targetProduct}</td>
                      <td className="p-4">{getStatusBadge(order.status)}</td>
                      <td className="p-4 font-medium text-green-600">${order.revenue.toLocaleString()}</td>
                      <td className="p-4 font-medium text-blue-600">${order.profit.toLocaleString()}</td>
                      <td className="p-4">
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Factory className="h-6 w-6 text-[#3BCEAC]" />
                  Order Details: {selectedOrder.orderNumber}
                </DialogTitle>
                <DialogDescription>
                  Complete information for batch {selectedOrder.batchNumber}
                </DialogDescription>
              </DialogHeader>

              {/* Order Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Order Information</h3>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Number:</span>
                        <span className="font-medium">{selectedOrder.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Batch Number:</span>
                        <span className="font-medium">{selectedOrder.batchNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        {getTypeBadge(selectedOrder.type)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        {getStatusBadge(selectedOrder.status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target Product:</span>
                        <span className="font-medium">{selectedOrder.targetProduct}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Customer Information</h3>
                    <div className="space-y-2 bg-blue-50 p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Customer Name:</span>
                        <span className="font-medium text-blue-900">{selectedOrder.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Company:</span>
                        <span className="font-medium text-blue-900">{selectedOrder.customerCompany}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Timeline</h3>
                    <div className="space-y-2 bg-green-50 p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-green-700">Order Date:</span>
                        <span className="font-medium text-green-900">{new Date(selectedOrder.orderDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Completion Date:</span>
                        <span className="font-medium text-green-900">{new Date(selectedOrder.completionDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Financial Summary</h3>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Cost:</span>
                        <span className="font-medium text-red-600">${selectedOrder.totalCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenue:</span>
                        <span className="font-medium text-green-600">${selectedOrder.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-800 font-semibold">Net Profit:</span>
                        <span className="font-bold text-blue-600">${selectedOrder.profit.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Profit Margin:</span>
                        <span className="font-medium text-blue-600">
                          {((selectedOrder.profit / selectedOrder.revenue) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Additional Costs</h3>
                    <div className="space-y-2 bg-red-50 p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-red-700">Transportation:</span>
                        <span className="font-medium text-red-900">${selectedOrder.additionalCosts.transportation.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">Labor:</span>
                        <span className="font-medium text-red-900">${selectedOrder.additionalCosts.labor.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">Equipment:</span>
                        <span className="font-medium text-red-900">${selectedOrder.additionalCosts.equipment.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">Quality Control:</span>
                        <span className="font-medium text-red-900">${selectedOrder.additionalCosts.qualityControl.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">Storage:</span>
                        <span className="font-medium text-red-900">${selectedOrder.additionalCosts.storage.toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-semibold">
                          <span className="text-red-800">Total Additional:</span>
                          <span className="text-red-900">
                            ${Object.values(selectedOrder.additionalCosts).reduce((sum, cost) => sum + cost, 0).toLocaleString()}
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center space-x-2 hover:bg-gray-50 border-gray-300"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export Report</span>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => handleExportPDF(selectedOrder)}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <FileText className="h-4 w-4 text-red-600" />
                      <span>Export as PDF</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleExportExcel(selectedOrder)}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      <span>Export as Excel</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handlePrintReport(selectedOrder)}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Printer className="h-4 w-4 text-gray-600" />
                      <span>Print Report</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={() => handleGenerateInvoice(selectedOrder)}
                  className="flex items-center space-x-2 bg-[#3BCEAC] hover:bg-[#2A9A7A] text-white"
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