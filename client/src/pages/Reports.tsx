import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';
import {
  Calendar,
  Clock,
  Download,
  Factory,
  File,
  FileText,
  Filter,
  Printer,
  RefreshCw,
  Settings,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Users,
  Package,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Sample data
const categoryData = [
  { name: 'Antibiotics', value: 35 },
  { name: 'Painkillers', value: 25 },
  { name: 'Supplements', value: 20 },
  { name: 'Anti-inflammatory', value: 15 },
  { name: 'Cardiovascular', value: 5 },
];

const salesData = [
  { name: 'Jan', sales: 4000, revenue: 2400 },
  { name: 'Feb', sales: 3000, revenue: 1398 },
  { name: 'Mar', sales: 2000, revenue: 9800 },
  { name: 'Apr', sales: 2780, revenue: 3908 },
  { name: 'May', sales: 1890, revenue: 4800 },
  { name: 'Jun', sales: 2390, revenue: 3800 },
];

export default function Reports() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>({
    from: new Date(2023, 0, 1),
    to: new Date(2023, 11, 31)
  });

  // Fetch sales report data
  const { data: salesReportData, isLoading: salesLoading } = useQuery({
    queryKey: ['/api/reports/sales'],
    enabled: true
  });

  // Fetch financial report data
  const { data: financialReportData, isLoading: financialLoading } = useQuery({
    queryKey: ['/api/reports/financial'],
    enabled: true
  });

  // Fetch inventory report data
  const { data: inventoryReportData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['/api/reports/inventory'],
    enabled: true
  });

  // Fetch customer report data
  const { data: customerReportData, isLoading: customerLoading } = useQuery({
    queryKey: ['/api/reports/customers'],
    enabled: true
  });

  // Fetch production report data
  const { data: productionReportData, isLoading: productionLoading } = useQuery({
    queryKey: ['/api/reports/production'],
    enabled: true
  });

  // Export handlers
  const exportToPDF = async (title: string, data: any) => {
    const pdf = new jsPDF();
    pdf.text(title, 20, 20);
    pdf.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  const exportToCSV = (title: string, data: any) => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(data[0] || {}).join(",") + "\n" +
      data.map((row: any) => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={printReport}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="refining">Refining</TabsTrigger>
        </TabsList>

        {/* Sales Reports Tab */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Sales</CardTitle>
                <CardDescription>Current Period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${salesReportData?.summary?.totalSales?.toLocaleString() || '11,152'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 12%</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Transactions</CardTitle>
                <CardDescription>Total Count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesReportData?.summary?.transactionCount || '89'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 8%</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Average Order</CardTitle>
                <CardDescription>Per Transaction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${salesReportData?.summary?.averageOrderValue?.toFixed(2) || '125.31'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-red-500">↓ 2%</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Top Category</CardTitle>
                <CardDescription>Best Performer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesReportData?.summary?.topCategory || 'Antibiotics'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 15%</span> growth
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
                <CardDescription>
                  Sales trend over the selected period
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {salesLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-pulse">Loading chart data...</div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={salesReportData?.chartData || salesData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#8884d8"
                        strokeWidth={2}
                        name="Sales Amount"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="transactions" 
                        stroke="#82ca9d"
                        strokeWidth={2}
                        name="Transactions"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>
                  Distribution of sales across product categories
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Reports Tab */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Revenue</CardTitle>
                <CardDescription>Current Period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$32,580</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 8%</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Outstanding Receivables</CardTitle>
                <CardDescription>Unpaid Invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$8,790</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-red-500">↑ 3%</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Tax Collected</CardTitle>
                <CardDescription>VAT/Sales Tax</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$4,890</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 6%</span> vs previous period
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs. Receivables</CardTitle>
                <CardDescription>
                  Comparison between collected revenue and outstanding receivables
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                    <Bar dataKey="sales" fill="#82ca9d" name="Receivables" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tax Summary</CardTitle>
                <CardDescription>
                  Monthly breakdown of collected VAT/sales tax
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={salesData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Tax Collected"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Other tabs with similar structure... */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Inventory Reports</h3>
            <p className="mt-1 text-sm text-gray-500">Coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Customer Reports</h3>
            <p className="mt-1 text-sm text-gray-500">Coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <div className="text-center py-12">
            <Factory className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Production Reports</h3>
            <p className="mt-1 text-sm text-gray-500">Coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="refining" className="space-y-4">
          <div className="text-center py-12">
            <Settings className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Refining Reports</h3>
            <p className="mt-1 text-sm text-gray-500">Coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}