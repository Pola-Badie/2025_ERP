import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Package, Thermometer, AlertCircle, LayoutDashboard, BarChart } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency } from '@/lib/utils';

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

const Dashboard: React.FC = () => {
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  
  // Date range for the dashboard
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const dateRange = `${format(firstDay, 'MMM d')} - ${format(lastDay, 'MMM d, yyyy')}`;

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard/summary'],
    queryFn: async () => {
      try {
        const data = await apiRequest<DashboardSummary>('/api/dashboard/summary');
        return data;
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

  return (
    <div>
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Dashboard</h1>
          <p className="text-sm text-slate-500">Pharmacy Management Overview</p>
        </div>
        <div className="flex mt-4 md:mt-0 space-x-3">
          <Button onClick={() => setIsProductFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-red-400 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">TOTAL CUSTOMERS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{isLoading ? "..." : dashboardData?.totalCustomers || 0}</div>
            <p className="text-xs mt-1">Total Customers Served</p>
          </CardContent>
        </Card>
        
        <Card className="bg-cyan-400 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">NEW CUSTOMERS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{isLoading ? "..." : dashboardData?.newCustomers || 0}</div>
            <p className="text-xs mt-1">Customers Added</p>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-500 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">TODAY'S SALES</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? "..." : formatCurrency(dashboardData?.todaySales || 0)}
            </div>
            <p className="text-xs mt-1">Today</p>
          </CardContent>
        </Card>
        
        <Card className="bg-emerald-400 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">MONTH SALES</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? "..." : formatCurrency(dashboardData?.monthSales || 0)}
            </div>
            <p className="text-xs mt-1">Monthly</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Overview Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="col-span-1 md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SALES OVERVIEW</CardTitle>
            <div className="flex space-x-2 text-xs">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <LayoutDashboard className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <BarChart className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-sm text-slate-500">Sales chart will be displayed here</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SALES DISTRIBUTION</CardTitle>
            <div className="flex space-x-2 text-xs">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <LayoutDashboard className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-sm text-slate-500">Sales distribution chart will be displayed here</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">PRODUCT PERFORMANCE</CardTitle>
            <div className="flex space-x-2 text-xs">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <LayoutDashboard className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-sm text-slate-500">Product performance chart will be displayed here</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expiring Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">EXPIRING PRODUCTS</CardTitle>
            <div className="flex space-x-2 text-xs">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Thermometer className="h-4 w-4" />
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
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-center text-sm text-gray-500">No expiring products</td>
                    </tr>
                  ) : (
                    dashboardData?.expiringProducts?.map((product) => (
                      <tr key={product.id} className="border-b border-gray-100">
                        <td className="px-4 py-2 text-sm">{product.drugName}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold 
                            ${product.status === 'expired' 
                              ? 'bg-red-500 text-white' 
                              : product.status === 'near' 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-gray-100'
                            }`}>
                            {product.status === 'expired' ? 'Expired' : 'Near Expiry'}
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">PRODUCTS WITH LOW STOCK</CardTitle>
            <div className="flex space-x-2 text-xs">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <AlertCircle className="h-4 w-4" />
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
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-center text-sm text-gray-500">No low stock products</td>
                    </tr>
                  ) : (
                    dashboardData?.lowStockProducts?.map((product) => (
                      <tr key={product.id} className="border-b border-gray-100">
                        <td className="px-4 py-2 text-sm">{product.drugName}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold 
                            ${product.quantity === 0 
                              ? 'bg-red-500 text-white' 
                              : product.quantity < 5 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-yellow-100'
                            }`}>
                            {product.quantity === 0 ? 'Out of Stock' : product.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">{new Date().toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
