import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
  Maximize2
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

const Dashboard = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery<DashboardSummary>({
    queryKey: ['/api/dashboard/summary'],
  });

  return (
    <div className="space-y-6 p-6">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Sales Overview Chart */}
        <Card className="bg-white border rounded-md shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <CardTitle className="text-sm font-medium text-gray-700">SALES OVERVIEW</CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={salesData}
                margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#1D3E78" 
                  strokeWidth={2}
                  dot={{ fill: '#1D3E78', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, fill: '#1D3E78' }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales Distribution Chart */}
        <Card className="bg-white border rounded-md shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <CardTitle className="text-sm font-medium text-gray-700">SALES DISTRIBUTION</CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={[
                    { name: 'Antibiotics', value: 23.5, color: '#1D3E78' },
                    { name: 'Pain Relief', value: 23.5, color: '#3BCEAC' },
                    { name: 'Vitamins', value: 36.3, color: '#0077B6' },
                    { name: 'Supplements', value: 16.7, color: '#48CAE4' },
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={10}
                >
                  {[
                    { name: 'Antibiotics', value: 23.5, color: '#1D3E78' },
                    { name: 'Pain Relief', value: 23.5, color: '#3BCEAC' },
                    { name: 'Vitamins', value: 36.3, color: '#0077B6' },
                    { name: 'Supplements', value: 16.7, color: '#48CAE4' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Performance Chart */}
        <Card className="bg-white border rounded-md shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <CardTitle className="text-sm font-medium text-gray-700">CATEGORY PERFORMANCE</CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={[
                    { name: 'Pain Relief', value: 23.5, color: '#3BCEAC' },
                    { name: 'Antibiotics', value: 23.5, color: '#0077B6' },
                    { name: 'Vitamins', value: 23.5, color: '#48CAE4' },
                    { name: 'Heart Medicine', value: 23.5, color: '#90E0EF' },
                    { name: 'Other', value: 6.0, color: '#CAF0F8' },
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={10}
                >
                  {[
                    { name: 'Pain Relief', value: 23.5, color: '#3BCEAC' },
                    { name: 'Antibiotics', value: 23.5, color: '#0077B6' },
                    { name: 'Vitamins', value: 23.5, color: '#48CAE4' },
                    { name: 'Heart Medicine', value: 23.5, color: '#90E0EF' },
                    { name: 'Other', value: 6.0, color: '#CAF0F8' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
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
              {dashboardData?.expiringProducts?.map((product: Product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.drugName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-orange-600">Expires: {product.expiryDate}</p>
                    <p className="text-xs">Qty: {product.quantity}</p>
                  </div>
                </div>
              )) || (
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
              {dashboardData?.lowStockProducts?.map((product: Product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.drugName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-red-600">Stock: {product.quantity}</p>
                    <p className="text-xs">{product.status}</p>
                  </div>
                </div>
              )) || (
                <div className="text-center text-gray-500 py-4">
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>All products well stocked</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;