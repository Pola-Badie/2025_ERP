import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Thermometer, AlertCircle, Maximize2, BarChart, Minimize2 } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Define types for dashboard data
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

// Sample data for the sales overview chart (monthly data)
const salesData = [
  { name: 'Jan', sales: 65 },
  { name: 'Feb', sales: 59 },
  { name: 'March', sales: 80 },
  { name: 'Apr', sales: 81 },
  { name: 'May', sales: 56 },
  { name: 'June', sales: 55 },
  { name: 'July', sales: 40 },
  { name: 'August', sales: 50 },
  { name: 'Sept', sales: 65 },
  { name: 'Oct', sales: 75 },
  { name: 'Nov', sales: 96 },
  { name: 'Dec', sales: 110 },
];

// Sample data for pie charts
const salesDistributionData = [
  { name: 'Antibiotics', value: 23.5, color: '#1D3E78' },
  { name: 'Pain Relief', value: 23.5, color: '#3BCEAC' },
  { name: 'Vitamins', value: 36.3, color: '#0077B6' },
  { name: 'Supplements', value: 16.7, color: '#48CAE4' },
];

const productPerformanceData = [
  { name: 'Pain Relief', value: 23.5, color: '#3BCEAC' },
  { name: 'Antibiotics', value: 23.5, color: '#0077B6' },
  { name: 'Vitamins', value: 23.5, color: '#48CAE4' },
  { name: 'Heart Medicine', value: 23.5, color: '#90E0EF' },
  { name: 'Other', value: 6.0, color: '#CAF0F8' },
];

const Dashboard: React.FC = () => {
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  
  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard/summary'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/dashboard/summary');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        return data as DashboardSummary;
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Return default data structure with zeros
        return {
          totalCustomers: 0,
          newCustomers: 0,
          todaySales: 0,
          monthSales: 0,
          lowStockProducts: [],
          expiringProducts: []
        } as DashboardSummary;
      }
    }
  });

  // Custom tooltip for the line chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded">
          <p className="text-xs">{`${payload[0].name} : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pb-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">DASHBOARD</h1>
          <p className="text-sm text-slate-500">Pharmacy Management Overview</p>
        </div>
        <div className="flex mt-4 md:mt-0 space-x-3">
          <Button onClick={() => setIsProductFormOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-[#F16F6F] text-white rounded-md border-none overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjgwIiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')] bg-no-repeat bg-right-top bg-contain opacity-30"></div>
          <CardHeader className="pb-0 relative z-10">
            <CardTitle className="text-sm font-medium">TOTAL CUSTOMERS</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">{isLoading ? "..." : dashboardData?.totalCustomers || 250}</div>
            <p className="text-xs mt-1">Total Customers Served</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#57CBEB] text-white rounded-md border-none overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjgwIiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')] bg-no-repeat bg-right-top bg-contain opacity-30"></div>
          <CardHeader className="pb-0 relative z-10">
            <CardTitle className="text-sm font-medium">NEW CUSTOMERS</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">{isLoading ? "..." : dashboardData?.newCustomers || 32}</div>
            <p className="text-xs mt-1">Customers Added</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#7E75C0] text-white rounded-md border-none overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjgwIiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')] bg-no-repeat bg-right-top bg-contain opacity-30"></div>
          <CardHeader className="pb-0 relative z-10">
            <CardTitle className="text-sm font-medium">TODAY'S SALES</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">
              {isLoading ? "..." : `EGP ${dashboardData?.todaySales.toLocaleString() || "1750"}`}
            </div>
            <p className="text-xs mt-1">Today</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#3BCEAC] text-white rounded-md border-none overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjgwIiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')] bg-no-repeat bg-right-top bg-contain opacity-30"></div>
          <CardHeader className="pb-0 relative z-10">
            <CardTitle className="text-sm font-medium">MONTH SALES</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">
              {isLoading ? "..." : `EGP ${dashboardData?.monthSales.toLocaleString() || "12,500"}`}
            </div>
            <p className="text-xs mt-1">Monthly</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Sales Overview Chart */}
        <Card className="bg-white border rounded-md shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <CardTitle className="text-sm font-medium text-gray-700">SALES OVERVIEW</CardTitle>
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <BarChart className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <Minimize2 className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={salesData}
                margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3BCEAC" 
                  strokeWidth={3}
                  dot={{ r: 4, stroke: '#3BCEAC', fill: 'white', strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: '#3BCEAC', fill: '#3BCEAC' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales Distribution Chart */}
        <Card className="bg-white border rounded-md shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <CardTitle className="text-sm font-medium text-gray-700">SALES DISTRIBUTION</CardTitle>
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <BarChart className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <Minimize2 className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2 h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={70}
                  fill="#8884d8"
                  paddingAngle={0}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  labelLine={false}
                >
                  {salesDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Product Performance Chart */}
        <Card className="bg-white border rounded-md shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <CardTitle className="text-sm font-medium text-gray-700">PRODUCT PERFORMANCE</CardTitle>
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <BarChart className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <Minimize2 className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2 h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productPerformanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={70}
                  fill="#8884d8"
                  paddingAngle={0}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  labelLine={false}
                >
                  {productPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Product Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expiring Products */}
        <Card className="bg-white border rounded-md shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <CardTitle className="text-sm font-medium text-gray-700">EXPIRING PRODUCTS</CardTitle>
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <Thermometer className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <Minimize2 className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Drug Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-center text-sm text-gray-500">Loading...</td>
                    </tr>
                  ) : dashboardData?.expiringProducts?.length === 0 ? (
                    <>
                      <tr>
                        <td className="px-4 py-2 text-sm">Panadol Advance</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-[#F16F6F] text-white">
                            EXPIRED
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">20 May 2024</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm">Diclofenac 500mg</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-[#F16F6F] text-white">
                            EXPIRED
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">19 June 2024</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm">Diosmin/Hesperidin</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-[#FFB454] text-white">
                            NEAR
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">15 Dec 2024</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm">Metformin 850mg</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-[#F16F6F] text-white">
                            EXPIRED
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">20 Sep, 2025</td>
                      </tr>
                    </>
                  ) : (
                    dashboardData?.expiringProducts?.map((product: Product) => (
                      <tr key={product.id} className="border-b border-gray-100">
                        <td className="px-4 py-2 text-sm">{product.drugName}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold 
                            ${product.status === 'expired'
                              ? 'bg-[#F16F6F] text-white' 
                              : product.status === 'near'
                                ? 'bg-[#FFB454] text-white'
                                : 'bg-gray-100'
                            }`}>
                            EXPIRED
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">{new Date(product.expiryDate).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card className="bg-white border rounded-md shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <CardTitle className="text-sm font-medium text-gray-700">PRODUCTS WITH LOW STOCK</CardTitle>
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <AlertCircle className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <Minimize2 className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Drug Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Stock Date</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-center text-sm text-gray-500">Loading...</td>
                    </tr>
                  ) : dashboardData?.lowStockProducts?.length === 0 ? (
                    <>
                      <tr>
                        <td className="px-4 py-2 text-sm">Asprine</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-[#F16F6F] text-white">
                            Out of Stock
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">19 June 2024</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm">Gulvas Met 850/1000</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-[#F16F6F] text-white">
                            Out of Stock
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">19 June 2024</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm">Zyrtic</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-[#F16F6F] text-white">
                            Out of Stock
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">19 June 2024</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm">Daflon 500</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-[#FFB454] text-white">
                            10
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">19 June 2023</td>
                      </tr>
                    </>
                  ) : (
                    dashboardData?.lowStockProducts?.map((product: Product) => (
                      <tr key={product.id} className="border-b border-gray-100">
                        <td className="px-4 py-2 text-sm">{product.drugName}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold 
                            ${product.quantity === 0 || product.status === 'out_of_stock'
                              ? 'bg-red-500 text-white' 
                              : product.quantity < 5 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-orange-500 text-white'
                            }`}>
                            {product.quantity === 0 || product.status === 'out_of_stock' ? 'Out of Stock' : product.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">19 June 2024</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">Product form will be implemented here.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
