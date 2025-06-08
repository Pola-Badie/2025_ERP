import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  XCircle,
  Maximize2,
  X
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

// Chart Modal Component
const ChartModal = ({ title, description, children, trigger }: { 
  title: string; 
  description: string; 
  children: React.ReactNode; 
  trigger: React.ReactNode;
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Sales Trend</CardTitle>
                    <CardDescription>
                      Sales trend over the selected period
                    </CardDescription>
                  </div>
                  <ChartModal
                    title="Sales Trend - Expanded View"
                    description="Detailed sales trend analysis over the selected period"
                    trigger={
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    }
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={salesReportData?.chartData || salesData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 20,
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
                          strokeWidth={3}
                          name="Sales Amount"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="transactions" 
                          stroke="#82ca9d"
                          strokeWidth={3}
                          name="Transactions"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartModal>
                </div>
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Sales by Category</CardTitle>
                    <CardDescription>
                      Distribution of sales across product categories
                    </CardDescription>
                  </div>
                  <ChartModal
                    title="Sales by Category - Expanded View"
                    description="Detailed breakdown of sales distribution across product categories"
                    trigger={
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    }
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={120}
                          innerRadius={40}
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
                  </ChartModal>
                </div>
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Revenue vs. Receivables</CardTitle>
                    <CardDescription>
                      Comparison between collected revenue and outstanding receivables
                    </CardDescription>
                  </div>
                  <ChartModal
                    title="Revenue vs. Receivables - Expanded View"
                    description="Detailed comparison between collected revenue and outstanding receivables"
                    trigger={
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    }
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={salesData}
                        margin={{
                          top: 30,
                          right: 30,
                          left: 30,
                          bottom: 30,
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
                  </ChartModal>
                </div>
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tax Summary</CardTitle>
                    <CardDescription>
                      Monthly breakdown of collected VAT/sales tax
                    </CardDescription>
                  </div>
                  <ChartModal
                    title="Tax Summary - Expanded View"
                    description="Detailed monthly breakdown of collected VAT/sales tax"
                    trigger={
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    }
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={salesData}
                        margin={{
                          top: 30,
                          right: 30,
                          left: 30,
                          bottom: 30,
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
                          strokeWidth={3}
                          name="Tax Collected"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartModal>
                </div>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Products</CardTitle>
                <CardDescription>Active Inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inventoryReportData?.summary?.totalProducts || '245'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 5%</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Low Stock Items</CardTitle>
                <CardDescription>Need Reorder</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {inventoryReportData?.summary?.lowStockItems || '12'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-red-500">↑ 2</span> new alerts
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Value</CardTitle>
                <CardDescription>Inventory Worth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${inventoryReportData?.summary?.totalValue?.toLocaleString() || '125,840'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 3%</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Categories</CardTitle>
                <CardDescription>Product Types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inventoryReportData?.summary?.categories || '8'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Active categories
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Stock Levels by Category</CardTitle>
                    <CardDescription>
                      Current inventory levels across product categories
                    </CardDescription>
                  </div>
                  <ChartModal
                    title="Stock Levels by Category - Expanded View"
                    description="Detailed inventory levels across all product categories"
                    trigger={
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    }
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categoryData}
                        margin={{
                          top: 30,
                          right: 30,
                          left: 30,
                          bottom: 30,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" name="Stock Level" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartModal>
                </div>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryData}
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
                    <Bar dataKey="value" fill="#8884d8" name="Stock Level" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Inventory Turnover</CardTitle>
                    <CardDescription>
                      Monthly inventory turnover rates
                    </CardDescription>
                  </div>
                  <ChartModal
                    title="Inventory Turnover - Expanded View"
                    description="Detailed monthly inventory turnover analysis"
                    trigger={
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    }
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={salesData}
                        margin={{
                          top: 30,
                          right: 30,
                          left: 30,
                          bottom: 30,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="sales" 
                          stroke="#82ca9d"
                          strokeWidth={3}
                          name="Turnover Rate"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartModal>
                </div>
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
                      dataKey="sales" 
                      stroke="#82ca9d"
                      strokeWidth={2}
                      name="Turnover Rate"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Customers</CardTitle>
                <CardDescription>Active Customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customerReportData?.summary?.totalCustomers || '168'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 7%</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">New Customers</CardTitle>
                <CardDescription>This Month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {customerReportData?.summary?.newCustomers || '23'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 15%</span> growth
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Customer Lifetime Value</CardTitle>
                <CardDescription>Average CLV</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${customerReportData?.summary?.averageLifetimeValue?.toLocaleString() || '2,450'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 4%</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Retention Rate</CardTitle>
                <CardDescription>Customer Retention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customerReportData?.summary?.retentionRate || '92%'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 2%</span> improvement
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Customer Acquisition</CardTitle>
                    <CardDescription>
                      Monthly new customer acquisition trends
                    </CardDescription>
                  </div>
                  <ChartModal
                    title="Customer Acquisition - Expanded View"
                    description="Detailed monthly customer acquisition trends and patterns"
                    trigger={
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    }
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={salesData}
                        margin={{
                          top: 30,
                          right: 30,
                          left: 30,
                          bottom: 30,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="sales" 
                          stroke="#8884d8"
                          fillOpacity={0.6}
                          fill="#8884d8"
                          name="New Customers"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartModal>
                </div>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
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
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#8884d8"
                      fillOpacity={0.6}
                      fill="#8884d8"
                      name="New Customers"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Customer Segments</CardTitle>
                    <CardDescription>
                      Distribution of customers by business type
                    </CardDescription>
                  </div>
                  <ChartModal
                    title="Customer Segments - Expanded View"
                    description="Detailed customer distribution across business segments"
                    trigger={
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    }
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={120}
                          innerRadius={40}
                          fill="#82ca9d"
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
                  </ChartModal>
                </div>
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
                      fill="#82ca9d"
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

        <TabsContent value="production" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Production</CardTitle>
                <CardDescription>Units Produced</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {productionReportData?.summary?.totalProduction?.toLocaleString() || '15,820'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 12%</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Efficiency Rate</CardTitle>
                <CardDescription>Production Efficiency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {productionReportData?.summary?.efficiencyRate || '94.2%'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 3%</span> improvement
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quality Score</CardTitle>
                <CardDescription>Average QC Score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {productionReportData?.summary?.qualityScore || '98.5%'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 1%</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Downtime</CardTitle>
                <CardDescription>Hours Lost</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {productionReportData?.summary?.downtime || '8.5h'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-red-500">↑ 2h</span> vs previous period
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Production Output</CardTitle>
                    <CardDescription>
                      Daily production output trends
                    </CardDescription>
                  </div>
                  <ChartModal
                    title="Production Output - Expanded View"
                    description="Detailed daily production output analysis and trends"
                    trigger={
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    }
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={salesData}
                        margin={{
                          top: 30,
                          right: 30,
                          left: 30,
                          bottom: 30,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="sales" fill="#8884d8" name="Units Produced" />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#ff7300"
                          strokeWidth={3}
                          name="Efficiency %"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </ChartModal>
                </div>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
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
                    <Bar dataKey="sales" fill="#8884d8" name="Units Produced" />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#ff7300"
                      strokeWidth={2}
                      name="Efficiency %"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quality Control</CardTitle>
                    <CardDescription>
                      Quality metrics and pass rates
                    </CardDescription>
                  </div>
                  <ChartModal
                    title="Quality Control - Expanded View"
                    description="Detailed quality control metrics and pass rate analysis"
                    trigger={
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    }
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={salesData}
                        margin={{
                          top: 30,
                          right: 30,
                          left: 30,
                          bottom: 30,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#10b981"
                          fillOpacity={0.6}
                          fill="#10b981"
                          name="Pass Rate %"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartModal>
                </div>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
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
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981"
                      fillOpacity={0.6}
                      fill="#10b981"
                      name="Pass Rate %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="refining" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Batches Refined</CardTitle>
                <CardDescription>Completed Batches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {refiningReportData?.summary?.batchesRefined || '342'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 8%</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Yield Rate</CardTitle>
                <CardDescription>Average Yield</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {refiningReportData?.summary?.yieldRate || '97.8%'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 2%</span> improvement
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Purity Level</CardTitle>
                <CardDescription>Average Purity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {refiningReportData?.summary?.purityLevel || '99.2%'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 0.5%</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Waste Reduction</CardTitle>
                <CardDescription>Waste Minimized</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {refiningReportData?.summary?.wasteReduction || '15.3%'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 3%</span> reduction
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Refining Efficiency</CardTitle>
                    <CardDescription>
                      Weekly refining efficiency trends
                    </CardDescription>
                  </div>
                  <ChartModal
                    title="Refining Efficiency - Expanded View"
                    description="Detailed weekly refining efficiency analysis and optimization"
                    trigger={
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    }
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={salesData}
                        margin={{
                          top: 30,
                          right: 30,
                          left: 30,
                          bottom: 30,
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
                          stroke="#6366f1"
                          strokeWidth={3}
                          name="Efficiency %"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="sales" 
                          stroke="#f59e0b"
                          strokeWidth={3}
                          name="Yield %"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartModal>
                </div>
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
                      stroke="#6366f1"
                      strokeWidth={2}
                      name="Efficiency %"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="Yield %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Process Distribution</CardTitle>
                    <CardDescription>
                      Distribution across refining processes
                    </CardDescription>
                  </div>
                  <ChartModal
                    title="Process Distribution - Expanded View"
                    description="Detailed distribution analysis across all refining processes"
                    trigger={
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    }
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={120}
                          innerRadius={40}
                          fill="#6366f1"
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
                  </ChartModal>
                </div>
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
                      fill="#6366f1"
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
      </Tabs>
    </div>
  );
}