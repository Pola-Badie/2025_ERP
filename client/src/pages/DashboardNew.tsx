import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LowStockCard from '@/components/dashboard/LowStockCard';
import ExpiringProductsCard from '@/components/dashboard/ExpiringProductsCard';
import { 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Receipt,
  AlertTriangle,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  Maximize2,
  Expand,
  X,
  Calendar
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie
} from 'recharts';

interface DashboardSummary {
  totalCustomers: number;
  newCustomers: number;
  todaySales: number;
  monthSales: number;
  lowStockProducts: Product[];
  expiringProducts: Product[];
}

interface InventorySummary {
  totalProducts: number;
  lowStockCount: string | number;
  outOfStockCount: string | number;
  expiringCount: string | number;
  expiredCount: string | number;
  totalInventoryValue: string | number;
  totalSellingValue: string | number;
  totalQuantity: number;
  activeProducts: string | number;
  warehouseCount: string | number;
}

interface Product {
  id: number;
  name: string;
  drugName: string;
  quantity: number;
  expiryDate: string;
  status: string;
}

// Sample data for the sales overview chart
const salesData = [
  { name: 'Jan', sales: 65 },
  { name: 'Feb', sales: 59 },
  { name: 'Mar', sales: 80 },
  { name: 'Apr', sales: 81 },
  { name: 'May', sales: 56 },
  { name: 'Jun', sales: 55 },
  { name: 'Jul', sales: 40 },
  { name: 'Aug', sales: 50 },
  { name: 'Sep', sales: 65 },
  { name: 'Oct', sales: 75 },
  { name: 'Nov', sales: 96 },
  { name: 'Dec', sales: 110 },
];

const DashboardNew = () => {
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [showInventoryBreakdown, setShowInventoryBreakdown] = useState(false);
  
  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery<DashboardSummary>({
    queryKey: ['/api/dashboard/summary'],
  });

  // Fetch accounting summary
  const { data: accountingSummary, isLoading: isAccountingLoading } = useQuery<any>({
    queryKey: ['/api/accounting/summary'],
  });

  // Fetch comprehensive accounting overview for enhanced dashboard metrics
  const { data: accountingOverview, isLoading: isOverviewLoading } = useQuery<any>({
    queryKey: ['/api/accounting/overview'],
  });

  // Fetch inventory summary for real inventory value
  const { data: inventorySummary, isLoading: isInventoryLoading } = useQuery<InventorySummary>({
    queryKey: ['/api/inventory/summary'],
  });

  // Fetch warehouse breakdown data
  const { data: warehouseBreakdown, isLoading: isWarehouseLoading } = useQuery<any[]>({
    queryKey: ['/api/inventory/warehouse-breakdown'],
    enabled: showInventoryBreakdown,
  });

  // Fetch detailed product information when a product is selected
  const { data: productDetails, isLoading: isLoadingDetails } = useQuery<any>({
    queryKey: ['/api/products', selectedProductId, 'details'],
    enabled: !!selectedProductId,
  });

  const salesDistributionData = [
    { name: 'Antibiotics', value: 23.5, color: '#1D3E78' },
    { name: 'Pain Relief', value: 23.5, color: '#3BCEAC' },
    { name: 'Vitamins', value: 36.3, color: '#0077B6' },
    { name: 'Supplements', value: 16.7, color: '#48CAE4' },
  ];

  const categoryPerformanceData = [
    { name: 'Pain Relief', value: 23.5, color: '#3BCEAC' },
    { name: 'Antibiotics', value: 23.5, color: '#0077B6' },
    { name: 'Vitamins', value: 23.5, color: '#48CAE4' },
    { name: 'Heart Medicine', value: 23.5, color: '#90E0EF' },
    { name: 'Other', value: 6.0, color: '#CAF0F8' },
  ];

  return (
    <div className="space-y-6 px-6 pt-2 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Premier ERP - Your business overview</p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/accounting'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">MONTHLY REVENUE</CardTitle>
            <DollarSign className="h-4 w-4 text-white opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isOverviewLoading ? "..." : `EGP ${accountingOverview?.monthlyPayments?.toLocaleString() || "0"}`}
            </div>
            <p className="text-xs text-white opacity-80">Current month revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/accounting'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">NET PROFIT</CardTitle>
            <TrendingUp className="h-4 w-4 text-white opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isOverviewLoading ? "..." : `EGP ${accountingOverview?.netProfit?.toLocaleString() || "0"}`}
            </div>
            <p className="text-xs text-white opacity-80">Revenue minus expenses</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/invoices'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">OUTSTANDING A/R</CardTitle>
            <Receipt className="h-4 w-4 text-white opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isOverviewLoading ? "..." : `EGP ${accountingOverview?.outstandingInvoices?.toLocaleString() || "0"}`}
            </div>
            <p className="text-xs text-white opacity-80">{accountingOverview?.pendingInvoiceCount || 0} pending invoices</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/orders'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">PENDING ORDERS</CardTitle>
            <Package className="h-4 w-4 text-white opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isOverviewLoading ? "..." : `EGP ${accountingOverview?.pendingOrders?.toLocaleString() || "0"}`}
            </div>
            <p className="text-xs text-white opacity-80">{accountingOverview?.orderCount || 0} orders pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Integration Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/expenses'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MONTHLY EXPENSES</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {isOverviewLoading ? "..." : `EGP ${accountingOverview?.monthlyExpenses?.toLocaleString() || "0"}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {accountingOverview?.expenseCount || 0} expense entries
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/accounting'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CASH BALANCE</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isOverviewLoading ? "..." : `EGP ${accountingOverview?.cashBalance?.toLocaleString() || "0"}`}
            </div>
            <p className="text-xs text-muted-foreground">
              Available cash flow
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/accounting'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PAYMENTS RECEIVED</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isOverviewLoading ? "..." : accountingOverview?.paymentCount?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              This month payments
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowInventoryBreakdown(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">INVENTORY VALUE</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isInventoryLoading ? "..." : `EGP ${Math.round(Number(inventorySummary?.totalInventoryValue) || 0)?.toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">
              Cost value • Selling: EGP {Math.round(Number(inventorySummary?.totalSellingValue) || 0)?.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {inventorySummary?.totalProducts || 0} products • {inventorySummary?.warehouseCount || 0} warehouses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TOTAL CUSTOMERS</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : dashboardData?.totalCustomers?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              +{dashboardData?.newCustomers || 0} new this month
            </p>
          </CardContent>
          <CardFooter className="p-2">
            <div className="text-xs flex items-center text-green-500">
              <TrendingUp className="mr-1 h-3 w-3" />
              +15% from last month
            </div>
          </CardFooter>
        </Card>

        <Card className="bg-[#1D3E78] text-white rounded-md border-none overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjgwIiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')] bg-no-repeat bg-right-top bg-contain opacity-30"></div>
          <CardHeader className="pb-0 relative z-10">
            <CardTitle className="text-sm font-medium text-white">TODAY SALES</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">
              {isLoading ? "..." : `EGP ${dashboardData?.todaySales?.toLocaleString() || "0"}`}
            </div>
            <p className="text-xs mt-1">Daily</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#3BCEAC] text-white rounded-md border-none overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjgwIiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')] bg-no-repeat bg-right-top bg-contain opacity-30"></div>
          <CardHeader className="pb-0 relative z-10">
            <CardTitle className="text-sm font-medium text-white">MONTH SALES</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">
              {isLoading ? "..." : `EGP ${dashboardData?.monthSales?.toLocaleString() || "0"}`}
            </div>
            <p className="text-xs mt-1">Monthly</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Collected Tax (This Month)
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : `EGP ${((dashboardData?.monthSales || 0) * 0.14).toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">14% VAT collected from sales</p>
          </CardContent>
          <CardFooter className="p-2">
            <div className="text-xs flex items-center text-green-500">
              <TrendingUp className="mr-1 h-3 w-3" />
              +8% from last month
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Sales Overview Chart */}
        <Card className="bg-white border rounded-lg shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
            <CardTitle className="text-sm font-medium text-gray-700">SALES OVERVIEW</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedChart('sales-overview')}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <Expand className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart
                  data={salesData}
                  margin={{ top: 15, right: 25, left: 15, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1D3E78" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#1D3E78" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    fontSize={11}
                    tick={{ fill: '#6b7280', fontWeight: 500 }}
                    height={35}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    tick={{ fill: '#9ca3af' }}
                    width={45}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '13px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                    labelStyle={{ color: '#374151', fontWeight: 600 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#1D3E78" 
                    strokeWidth={3}
                    dot={{ fill: '#ffffff', stroke: '#1D3E78', strokeWidth: 3, r: 4 }}
                    activeDot={{ r: 6, fill: '#1D3E78', stroke: '#ffffff', strokeWidth: 2 }}
                    fill="url(#salesGradient)"
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sales Distribution Chart */}
        <Card className="bg-white border rounded-lg shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
            <CardTitle className="text-sm font-medium text-gray-700">SALES DISTRIBUTION</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedChart('sales-distribution')}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <Expand className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[280px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <defs>
                    {salesDistributionData.map((entry, index) => (
                      <filter key={`shadow-${index}`} id={`shadow-${index}`}>
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
                      </filter>
                    ))}
                  </defs>
                  <Pie
                    data={salesDistributionData}
                    cx="50%"
                    cy="45%"
                    innerRadius={40}
                    outerRadius={85}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {salesDistributionData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        filter={`url(#shadow-${index})`}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      padding: '10px'
                    }}
                    formatter={(value: any) => [`${value}%`, '']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={50}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', fontWeight: 500, paddingTop: '10px' }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Performance Chart */}
        <Card className="bg-white border rounded-lg shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
            <CardTitle className="text-sm font-medium text-gray-700">CATEGORY PERFORMANCE</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedChart('category-performance')}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <Expand className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[280px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <defs>
                    {categoryPerformanceData.map((entry, index) => (
                      <filter key={`perf-shadow-${index}`} id={`perf-shadow-${index}`}>
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
                      </filter>
                    ))}
                  </defs>
                  <Pie
                    data={categoryPerformanceData}
                    cx="50%"
                    cy="45%"
                    innerRadius={35}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {categoryPerformanceData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        filter={`url(#perf-shadow-${index})`}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      padding: '10px'
                    }}
                    formatter={(value: any) => [`${value}%`, '']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={50}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', fontWeight: 500, paddingTop: '10px' }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Functional Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpiringProductsCard />
        <LowStockCard />
      </div>

      {/* Inventory Breakdown Dialog */}
      <Dialog open={showInventoryBreakdown} onOpenChange={setShowInventoryBreakdown}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <div className="bg-gradient-to-r from-green-600 to-blue-700 text-white p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold">Inventory Value Breakdown</span>
                    <p className="text-blue-100 text-sm font-normal">Real-time warehouse inventory analysis</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInventoryBreakdown(false)}
                  className="h-10 w-10 p-0 text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
            {isWarehouseLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <span className="text-lg text-gray-600">Loading warehouse breakdown...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Total Summary Card */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Cost Value</p>
                      <p className="text-2xl font-bold text-blue-900">EGP {Math.round(Number(inventorySummary?.totalInventoryValue) || 0)?.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Selling Value</p>
                      <p className="text-2xl font-bold text-green-900">EGP {Math.round(Number(inventorySummary?.totalSellingValue) || 0)?.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Products</p>
                      <p className="text-2xl font-bold text-purple-900">{inventorySummary?.totalProducts || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Quantity</p>
                      <p className="text-2xl font-bold text-orange-900">{inventorySummary?.totalQuantity || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Warehouse Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {warehouseBreakdown?.map((warehouse, index) => (
                    <div key={warehouse.location || index} className="bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{warehouse.location || 'Unknown Location'}</h3>
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {warehouse.total_quantity || 0} units
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Cost Value:</span>
                          <span className="font-semibold text-blue-600">EGP {Math.round(Number(warehouse.total_cost_value) || 0)?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Selling Value:</span>
                          <span className="font-semibold text-green-600">EGP {Math.round(Number(warehouse.total_selling_value) || 0)?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Quantity:</span>
                          <span className="font-semibold text-gray-900">{warehouse.total_quantity || 0} units</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Avg Unit Cost:</span>
                          <span className="font-medium text-gray-700">EGP {warehouse.avg_unit_cost || '0'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Product Details Dialog */}
      <Dialog open={!!selectedProductId} onOpenChange={() => setSelectedProductId(null)}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold">Product Overview</span>
                    <p className="text-blue-100 text-sm font-normal">Comprehensive pharmaceutical analysis</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProductId(null)}
                  className="h-10 w-10 p-0 text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </DialogTitle>
              <DialogDescription className="text-blue-100 mt-2">
                Detailed product information, sales analytics, and customer insights for informed decision making
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="overflow-y-auto max-h-[calc(95vh-140px)] p-6">
            {isLoadingDetails ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <span className="text-lg text-gray-600">Loading product details...</span>
                <p className="text-sm text-gray-500 mt-2">Analyzing pharmaceutical data</p>
              </div>
            ) : productDetails ? (
              <div className="space-y-8">
                {/* Product Header Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <div className="flex items-start space-x-4">
                        <div className="bg-blue-600 p-3 rounded-lg">
                          <Package className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">{productDetails.name}</h3>
                          <p className="text-lg text-blue-700 font-medium mb-2">{productDetails.drugName}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="bg-white px-3 py-1 rounded-full">SKU: {productDetails.sku}</span>
                            <span className="bg-white px-3 py-1 rounded-full">Type: {productDetails.productType || 'Finished Product'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="lg:text-right">
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-600">Current Stock</p>
                          <p className="text-3xl font-bold text-blue-900">{productDetails.quantity} {productDetails.unit}</p>
                        </div>
                        <span className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full ${
                          productDetails.status === 'active' ? 'bg-green-100 text-green-800 border border-green-200' :
                          productDetails.status === 'low_stock' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                          productDetails.status === 'near' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                          'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {productDetails.status === 'near' ? 'Near Expiry' : 
                           productDetails.status === 'low_stock' ? 'Low Stock' :
                           productDetails.status === 'out_of_stock' ? 'Out of Stock' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="h-8 w-8 text-emerald-600" />
                      <span className="text-emerald-600 text-sm font-medium">Cost</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">EGP {productDetails.costPrice}</p>
                    <p className="text-sm text-emerald-700">Purchase Price</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                      <span className="text-blue-600 text-sm font-medium">Selling</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">EGP {productDetails.sellingPrice}</p>
                    <p className="text-sm text-blue-700">Retail Price</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <BarChart3 className="h-8 w-8 text-purple-600" />
                      <span className="text-purple-600 text-sm font-medium">Profit</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">
                      EGP {(parseFloat(productDetails.sellingPrice) - parseFloat(productDetails.costPrice)).toFixed(2)}
                    </p>
                    <p className="text-sm text-purple-700">Per Unit</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between mb-2">
                      <Calendar className="h-8 w-8 text-amber-600" />
                      <span className="text-amber-600 text-sm font-medium">Expiry</span>
                    </div>
                    {productDetails.expiryInfo ? (
                      <>
                        <p className={`text-2xl font-bold ${
                          productDetails.expiryInfo.daysUntilExpiry < 30 ? 'text-red-900' :
                          productDetails.expiryInfo.daysUntilExpiry < 90 ? 'text-amber-900' :
                          'text-green-900'
                        }`}>
                          {productDetails.expiryInfo.daysUntilExpiry > 0 
                            ? `${productDetails.expiryInfo.daysUntilExpiry}d`
                            : 'Expired'
                          }
                        </p>
                        <p className="text-sm text-amber-700">
                          {productDetails.expiryInfo.daysUntilExpiry > 0 ? 'Until Expiry' : 'Past Due'}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-gray-600">N/A</p>
                        <p className="text-sm text-gray-500">No Date Set</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Product Information Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                      Expiry Information
                    </h4>
                    {productDetails.expiryInfo ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Expiry Date:</span>
                          <span className="font-medium">{productDetails.expiryDate}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Status:</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            productDetails.expiryInfo.daysUntilExpiry < 30 ? 'bg-red-100 text-red-800' :
                            productDetails.expiryInfo.daysUntilExpiry < 90 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {productDetails.expiryInfo.daysUntilExpiry > 0 
                              ? `${productDetails.expiryInfo.daysUntilExpiry} days remaining`
                              : `Expired ${Math.abs(productDetails.expiryInfo.daysUntilExpiry)} days ago`
                            }
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No expiry date configured</p>
                    )}
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Package className="h-5 w-5 text-blue-600 mr-2" />
                      Product Details
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Type:</span>
                        <span className="font-medium">{productDetails.productType || 'Finished Product'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Manufacturer:</span>
                        <span className="font-medium">{productDetails.manufacturer || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Barcode:</span>
                        <span className="font-medium font-mono text-sm">{productDetails.barcode || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              
              {/* Sales Statistics */}
              {productDetails.salesStats && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Sales Performance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-600">Total Quantity Sold</p>
                      <p className="text-2xl font-bold text-blue-900">{productDetails.salesStats.totalQuantitySold || 0}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-green-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-900">EGP {productDetails.salesStats.totalRevenue || 0}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-purple-600">Number of Sales</p>
                      <p className="text-2xl font-bold text-purple-900">{productDetails.salesStats.salesCount || 0}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Top Buyers */}
              {productDetails.topBuyers && productDetails.topBuyers.length > 0 && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Buyers</h4>
                  <div className="space-y-3">
                    {productDetails.topBuyers.map((buyer, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{buyer.customerName}</p>
                          {buyer.customerCompany && (
                            <p className="text-xs text-gray-500">{buyer.customerCompany}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">EGP {buyer.totalSpent}</p>
                          <p className="text-xs text-gray-500">{buyer.totalQuantity} units</p>
                          <p className="text-xs text-gray-500">Last: {buyer.lastPurchase}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Sales History */}
              {productDetails.salesHistory && productDetails.salesHistory.length > 0 && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales History</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {productDetails.salesHistory.slice(0, 5).map((sale, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm">{sale.invoiceNumber}</td>
                            <td className="px-4 py-2 text-sm">{sale.date}</td>
                            <td className="px-4 py-2 text-sm">
                              <div>
                                <p>{sale.customerName}</p>
                                {sale.customerCompany && (
                                  <p className="text-xs text-gray-500">{sale.customerCompany}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm">{sale.quantity}</td>
                            <td className="px-4 py-2 text-sm">EGP {sale.unitPrice}</td>
                            <td className="px-4 py-2 text-sm font-medium">EGP {sale.totalAmount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Product details not available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Modal Dialogs for Expanded Charts */}
      <Dialog open={expandedChart === 'sales-overview'} onOpenChange={() => setExpandedChart(null)}>
        <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="text-xl font-semibold">Sales Overview - Enhanced View</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedChart(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-2 h-full">
              <ResponsiveContainer width="100%" height="90%">
                <RechartsLineChart
                  data={salesData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={true}
                    tickLine={true}
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    axisLine={true}
                    tickLine={true}
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#1D3E78" 
                    strokeWidth={3}
                    dot={{ fill: '#1D3E78', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: '#1D3E78' }}
                    name="Sales (EGP)"
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Sales Analytics</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Peak Month</p>
                      <p className="text-xl font-bold text-blue-700">December</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Sales</p>
                      <p className="text-lg font-semibold">EGP 110K</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Growth Rate</p>
                      <p className="text-xl font-bold text-green-700">+18.5%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">YoY</p>
                      <p className="text-lg font-semibold">Trending Up</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Average</p>
                      <p className="text-xl font-bold text-orange-700">EGP 85K</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Monthly</p>
                      <p className="text-lg font-semibold">Target Met</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-xl font-bold text-purple-700">EGP 1.02M</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">This Year</p>
                      <p className="text-lg font-semibold">120% Target</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={expandedChart === 'sales-distribution'} onOpenChange={() => setExpandedChart(null)}>
        <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="text-xl font-semibold">Sales Distribution - Enhanced View</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedChart(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            <div className="h-full">
              <ResponsiveContainer width="100%" height="90%">
                <RechartsPieChart>
                  <Pie
                    data={salesDistributionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    labelLine={true}
                    fontSize={12}
                  >
                    {salesDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Distribution Details</h3>
              <div className="space-y-3">
                {salesDistributionData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-semibold">{item.value}%</span>
                      <p className="text-sm text-gray-500">
                        EGP {((dashboardData?.monthSales || 12500) * item.value / 100).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={expandedChart === 'category-performance'} onOpenChange={() => setExpandedChart(null)}>
        <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="text-xl font-semibold">Category Performance - Enhanced View</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedChart(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            <div className="h-full">
              <ResponsiveContainer width="100%" height="90%">
                <RechartsPieChart>
                  <Pie
                    data={categoryPerformanceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    labelLine={true}
                    fontSize={12}
                  >
                    {categoryPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Performance Metrics</h3>
              <div className="space-y-3">
                {categoryPerformanceData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <div>
                        <span className="font-medium text-gray-800">{item.name}</span>
                        <p className="text-xs text-gray-500">Category</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-gray-800">{item.value}%</span>
                      <p className="text-sm font-medium text-green-600">
                        +{(Math.random() * 10 + 5).toFixed(1)}% vs last month
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardNew;