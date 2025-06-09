import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  X
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

  // Function to determine expiry status
  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const timeDiff = expiry.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) {
      return { status: 'Expired', color: 'bg-red-500', textColor: 'text-red-700' };
    } else if (daysDiff <= 30) {
      return { status: 'Near Expiry', color: 'bg-orange-500', textColor: 'text-orange-700' };
    } else {
      return { status: 'Good', color: 'bg-green-500', textColor: 'text-green-700' };
    }
  };

  // Function to determine stock status based on quantity
  const getStockStatus = (quantity: number) => {
    const lowStockThreshold = 10; // This could be configurable
    const outOfStockThreshold = 0;

    if (quantity <= outOfStockThreshold) {
      return { status: 'Out of Stock', textColor: 'text-red-700', bgColor: 'bg-red-50' };
    } else if (quantity <= lowStockThreshold) {
      return { status: 'Near Out of Stock', textColor: 'text-orange-700', bgColor: 'bg-orange-50' };
    } else {
      return { status: 'In Stock', textColor: 'text-green-700', bgColor: 'bg-green-50' };
    }
  };
  
  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery<DashboardSummary>({
    queryKey: ['/api/dashboard/summary'],
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
        <p className="text-muted-foreground">Welcome to Morgan ERP - Your business overview</p>
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
              {isLoading ? "..." : dashboardData?.totalCustomers?.toLocaleString() || "1,284"}
            </div>
            <p className="text-xs text-muted-foreground">
              +{dashboardData?.newCustomers || 12} new this month
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
            <CardTitle className="text-sm font-medium">TODAY SALES</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">
              {isLoading ? "..." : `EGP ${dashboardData?.todaySales?.toLocaleString() || "2,500"}`}
            </div>
            <p className="text-xs mt-1">Daily</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#3BCEAC] text-white rounded-md border-none overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjgwIiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')] bg-no-repeat bg-right-top bg-contain opacity-30"></div>
          <CardHeader className="pb-0 relative z-10">
            <CardTitle className="text-sm font-medium">MONTH SALES</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">
              {isLoading ? "..." : `EGP ${dashboardData?.monthSales?.toLocaleString() || "12,500"}`}
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

      {/* Bottom Row - Alerts and Stock Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Expiring Products
            </CardTitle>
            <CardDescription>Products expiring within 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.expiringProducts?.map((product: Product) => {
                const expiryStatus = getExpiryStatus(product.expiryDate);
                const bgColorClass = expiryStatus.status === 'Expired' ? 'bg-red-50' : 'bg-orange-50';
                
                return (
                  <div key={product.id} className={`flex items-center justify-between p-3 ${bgColorClass} rounded-lg`}>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.drugName}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs ${expiryStatus.textColor} font-medium`}>
                        {expiryStatus.status}: {product.expiryDate}
                      </p>
                      <p className="text-xs">Qty: {product.quantity}</p>
                    </div>
                  </div>
                );
              }) || (
                <div className="text-center text-gray-500 py-4">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No products expiring soon</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Low Stock Products
            </CardTitle>
            <CardDescription>Products with low inventory levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.lowStockProducts?.map((product: Product) => {
                const stockStatus = getStockStatus(product.quantity);
                
                return (
                  <div key={product.id} className={`flex items-center justify-between p-3 ${stockStatus.bgColor} rounded-lg`}>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.drugName}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs ${stockStatus.textColor} font-medium`}>
                        {stockStatus.status}: {product.quantity}
                      </p>
                      <p className="text-xs">{product.status}</p>
                    </div>
                  </div>
                );
              }) || (
                <div className="text-center text-gray-500 py-4">
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>All products well stocked</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Modal Dialogs for Expanded Charts */}
      <Dialog open={expandedChart === 'sales-overview'} onOpenChange={() => setExpandedChart(null)}>
        <DialogContent className="max-w-4xl h-[80vh]">
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
        <DialogContent className="max-w-4xl h-[80vh]">
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
        <DialogContent className="max-w-4xl h-[80vh]">
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