import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
  Cell
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
  TrendingUp
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

// Dummy data for initial design - will be replaced with API data
const salesData = [
  { name: 'Jan', sales: 4000, revenue: 2400 },
  { name: 'Feb', sales: 3000, revenue: 1398 },
  { name: 'Mar', sales: 2000, revenue: 9800 },
  { name: 'Apr', sales: 2780, revenue: 3908 },
  { name: 'May', sales: 1890, revenue: 4800 },
  { name: 'Jun', sales: 2390, revenue: 3800 },
];

const categoryData = [
  { name: 'Antibiotics', value: 400 },
  { name: 'Painkillers', value: 300 },
  { name: 'Supplements', value: 200 },
  { name: 'Antacids', value: 150 },
  { name: 'Antivirals', value: 100 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Data fetching with react-query - will be implemented with actual endpoints
  const { data: salesReportData, isLoading: salesLoading } = useQuery<any>({
    queryKey: ['/api/reports/sales', dateRange, selectedFilter],
    enabled: activeTab === 'sales',
  });

  const { data: financialReportData, isLoading: financialLoading } = useQuery<any>({
    queryKey: ['/api/reports/financial', dateRange, selectedFilter],
    enabled: activeTab === 'financial',
  });

  const { data: inventoryReportData, isLoading: inventoryLoading } = useQuery<any>({
    queryKey: ['/api/reports/inventory', dateRange, selectedFilter],
    enabled: activeTab === 'inventory',
  });

  const { data: customerReportData, isLoading: customerLoading } = useQuery<any>({
    queryKey: ['/api/reports/customers', dateRange, selectedFilter],
    enabled: activeTab === 'customers',
  });

  // Export functions
  const exportToPDF = () => {
    const doc = new jsPDF();
    let title = `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`;
    let dateText = '';
    
    if (dateRange) {
      dateText = `${format(dateRange.from, 'PP')} to ${format(dateRange.to, 'PP')}`;
    }
    
    // Add title and date
    doc.setFontSize(18);
    doc.text(title, 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Date Range: ${dateText}`, 105, 25, { align: 'center' });
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 105, 32, { align: 'center' });
    
    // Add table based on active tab
    autoTable(doc, { 
      startY: 40,
      head: [['Item', 'Value', 'Category', 'Status']],
      body: [
        ['Product A', '$1200', 'Antibiotics', 'Active'],
        ['Product B', '$850', 'Painkillers', 'Low Stock'],
        ['Product C', '$2300', 'Supplements', 'Active'],
      ],
    });
    
    doc.save(`${activeTab}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const exportToCSV = () => {
    let data: any[] = [];
    let fileName = '';
    
    // Different data structure based on tab
    switch (activeTab) {
      case 'sales':
        data = salesData;
        fileName = 'sales_report';
        break;
      case 'financial':
        data = salesData;
        fileName = 'financial_report';
        break;
      case 'inventory':
        data = salesData;
        fileName = 'inventory_report';
        break;
      case 'customers':
        data = salesData;
        fileName = 'customer_report';
        break;
    }
    
    // Convert to CSV
    let csv = 'data:text/csv;charset=utf-8,';
    
    if (data.length > 0) {
      // Add headers
      const headers = Object.keys(data[0]);
      csv += headers.join(',') + '\\r\\n';
      
      // Add rows
      data.forEach(row => {
        let rowData = headers.map(header => row[header]);
        csv += rowData.join(',') + '\\r\\n';
      });
    }
    
    // Create download link
    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-primary">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into your business performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={exportToPDF} variant="outline" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Export PDF</span>
          </Button>
          <Button onClick={exportToCSV} variant="outline" className="flex items-center space-x-2">
            <File className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </Button>
        </div>
      </div>
      
      {/* Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs">From</Label>
                  <Input 
                    type="date" 
                    value={dateRange?.from ? dateRange.from.toISOString().split('T')[0] : ''} 
                    onChange={(e) => {
                      if (e.target.value) {
                        const newFrom = new Date(e.target.value);
                        setDateRange({
                          from: newFrom,
                          to: dateRange?.to || new Date()
                        });
                      }
                    }}
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">To</Label>
                  <Input 
                    type="date" 
                    value={dateRange?.to ? dateRange.to.toISOString().split('T')[0] : ''} 
                    onChange={(e) => {
                      if (e.target.value) {
                        const newTo = new Date(e.target.value);
                        setDateRange({
                          from: dateRange?.from || new Date(new Date().setDate(new Date().getDate() - 30)),
                          to: newTo
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2 w-full md:w-[200px]">
              <Label>Category</Label>
              <Select
                value={selectedFilter}
                onValueChange={setSelectedFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="antibiotics">Antibiotics</SelectItem>
                  <SelectItem value="painkillers">Painkillers</SelectItem>
                  <SelectItem value="supplements">Supplements</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 w-full md:w-[200px]">
              <Label>Payment Status</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 w-full md:w-[200px]">
              <Label>Sales Rep</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Select sales rep" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reps</SelectItem>
                  <SelectItem value="1">John Doe</SelectItem>
                  <SelectItem value="2">Jane Smith</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Apply Filters</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4" />
              <span>Reset</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Report Tabs */}
      <Tabs 
        defaultValue="sales" 
        className="space-y-4"
        onValueChange={(value) => setActiveTab(value)}
      >
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="sales" className="flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4" />
            <span>Sales Reports</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Financial Reports</span>
          </TabsTrigger>
          <TabsTrigger value="production" className="flex items-center space-x-2">
            <Factory className="h-4 w-4" />
            <span>Production Reports</span>
          </TabsTrigger>
          <TabsTrigger value="refining" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Refining Reports</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Inventory Reports</span>
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Customer Reports</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Sales Reports Tab */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Sales</CardTitle>
                <CardDescription>Current Period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$24,780</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 12%</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Transactions</CardTitle>
                <CardDescription>Total Orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">278</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 8%</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Average Order</CardTitle>
                <CardDescription>Value per Transaction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$89.14</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 4%</span> vs previous period
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
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
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
          
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>
                Products with the highest sales volume and revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity Sold
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        % of Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Panadol Advance
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Painkillers
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        342
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $3,420
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        14.8%
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Amoxicillin 500mg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Antibiotics
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        287
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $2,870
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        12.4%
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Vitamin C 1000mg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Supplements
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        256
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $2,560
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        11.1%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
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
                    <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
                    <Bar dataKey="sales" fill="#8884d8" name="Receivables" />
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
                      stroke="#FF8042" 
                      name="Tax Collected"
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Pending Invoices</CardTitle>
              <CardDescription>
                Invoices that are pending payment or partially paid
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issue Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        INV-2023-001
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Lagos General Hospital
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        10/01/2023
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        10/15/2023
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $1,250
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Partial
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        INV-2023-008
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Abuja Medical Center
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        10/05/2023
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        10/19/2023
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $3,780
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Unpaid
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        INV-2023-012
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Kano Pharmacy Ltd
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        10/08/2023
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        10/22/2023
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $2,150
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Partial
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Production Reports Tab */}
        <TabsContent value="production" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Production Orders</CardTitle>
                <CardDescription>Current Period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">127</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 15%</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Production Revenue</CardTitle>
                <CardDescription>Total Value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$452,890</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 18%</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Manufacturing Costs</CardTitle>
                <CardDescription>Total Expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$298,450</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-red-500">↑ 8%</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Net Profit Margin</CardTitle>
                <CardDescription>Production Efficiency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">34.2%</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 2.8%</span> vs previous period
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Production Cost Breakdown</CardTitle>
                <CardDescription>
                  Detailed analysis of production expenses by category
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Raw Materials', value: 45, fill: '#0088FE' },
                        { name: 'Labor Costs', value: 25, fill: '#00C49F' },
                        { name: 'Equipment', value: 15, fill: '#FFBB28' },
                        { name: 'Transportation', value: 8, fill: '#FF8042' },
                        { name: 'Quality Control', value: 4, fill: '#8884D8' },
                        { name: 'Storage', value: 3, fill: '#82CA9D' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Monthly Production Trends</CardTitle>
                <CardDescription>
                  Production volume and revenue trends over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { month: 'Jan', orders: 95, revenue: 380000, costs: 250000 },
                      { month: 'Feb', orders: 102, revenue: 420000, costs: 275000 },
                      { month: 'Mar', orders: 118, revenue: 485000, costs: 315000 },
                      { month: 'Apr', orders: 127, revenue: 525000, costs: 340000 },
                      { month: 'May', orders: 134, revenue: 560000, costs: 365000 },
                      { month: 'Jun', orders: 141, revenue: 595000, costs: 385000 }
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#0088FE" name="Revenue ($)" />
                    <Line type="monotone" dataKey="costs" stroke="#FF8042" name="Costs ($)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Production Orders by Revenue</CardTitle>
              <CardDescription>
                Highest value production orders with detailed cost breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Target Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Manufacturing Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transportation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profit Margin
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        BATCH-001-241205
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Paracetamol 500mg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        MedSupply Egypt
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $18,450
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $2,100
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $28,750
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="text-green-600 font-semibold">28.6%</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        BATCH-002-241204
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Amoxicillin 250mg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Cairo Pharmaceuticals
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $22,800
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $1,950
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $35,200
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="text-green-600 font-semibold">29.7%</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        BATCH-003-241203
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Ibuprofen 400mg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Alexandria Medical
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $16,200
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $1,800
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $25,900
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="text-green-600 font-semibold">30.5%</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Refining Reports Tab */}
        <TabsContent value="refining" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Refining Orders</CardTitle>
                <CardDescription>Current Period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 12%</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Refining Revenue</CardTitle>
                <CardDescription>Total Value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$298,750</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 22%</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Processing Costs</CardTitle>
                <CardDescription>Total Expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$185,420</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-red-500">↑ 6%</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Refining Efficiency</CardTitle>
                <CardDescription>Profit Margin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">37.9%</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 4.2%</span> vs previous period
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Refining Cost Distribution</CardTitle>
                <CardDescription>
                  Breakdown of refining expenses by operational category
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Base Processing', value: 35, fill: '#0088FE' },
                        { name: 'Raw Materials', value: 28, fill: '#00C49F' },
                        { name: 'Labor Costs', value: 18, fill: '#FFBB28' },
                        { name: 'Equipment', value: 12, fill: '#FF8042' },
                        { name: 'Transportation', value: 4, fill: '#8884D8' },
                        { name: 'Quality Control', value: 2, fill: '#82CA9D' },
                        { name: 'Storage', value: 1, fill: '#FFC658' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Monthly Refining Performance</CardTitle>
                <CardDescription>
                  Refining orders and revenue trends over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { month: 'Jan', orders: 72, revenue: 245000, costs: 155000 },
                      { month: 'Feb', orders: 78, revenue: 268000, costs: 168000 },
                      { month: 'Mar', orders: 85, revenue: 295000, costs: 185000 },
                      { month: 'Apr', orders: 89, revenue: 315000, costs: 195000 },
                      { month: 'May', orders: 94, revenue: 335000, costs: 208000 },
                      { month: 'Jun', orders: 97, revenue: 358000, costs: 220000 }
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#0088FE" name="Revenue ($)" />
                    <Bar dataKey="costs" fill="#FF8042" name="Costs ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Refining Orders by Profitability</CardTitle>
              <CardDescription>
                Most profitable refining orders with comprehensive cost analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Processing Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transportation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profit Margin
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        REF-001-241205
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Active Pharmaceutical Ingredient
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Global Pharma Solutions
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $12,850
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $1,200
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $21,500
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="text-green-600 font-semibold">35.3%</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        REF-002-241204
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Chemical Intermediate
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Chemtech Industries
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $15,600
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $1,450
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $26,800
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="text-green-600 font-semibold">36.4%</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        REF-003-241203
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Purified Compound
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Precision Chemicals
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $18,950
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $1,750
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $32,400
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="text-green-600 font-semibold">36.1%</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Inventory Reports Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Inventory Value</CardTitle>
                <CardDescription>Current Stock</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$158,970</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 5%</span> vs previous month
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Low Stock Items</CardTitle>
                <CardDescription>Below Threshold</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">14</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-red-500">↑ 4</span> vs previous month
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Expiring Soon</CardTitle>
                <CardDescription>Within 90 Days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-red-500">↑ 8</span> vs previous period
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Value Over Time</CardTitle>
                <CardDescription>
                  Track changes in total inventory value
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
                      name="Inventory Value"
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Stock Status</CardTitle>
                <CardDescription>
                  Breakdown of inventory by stock status
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Normal Stock', value: 450 },
                        { name: 'Low Stock', value: 14 },
                        { name: 'Out of Stock', value: 8 },
                        { name: 'Expiring Soon', value: 23 },
                      ]}
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
          
          <Card>
            <CardHeader>
              <CardTitle>Low Stock & Expiring Products</CardTitle>
              <CardDescription>
                Products that require attention due to low stock or expiration date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Min Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiry Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Ibuprofen 400mg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Painkillers
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        12
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        50
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        11/15/2024
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Low Stock
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Vitamin B Complex
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Supplements
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        85
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        30
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        12/30/2023
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Expiring Soon
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Ciprofloxacin 500mg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Antibiotics
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        8
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        40
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        03/15/2024
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Low Stock
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Customer Reports Tab */}
        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Customers</CardTitle>
                <CardDescription>Active Accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">142</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 12</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">New Customers</CardTitle>
                <CardDescription>This Period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">16</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 4</span> vs previous period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Average Customer Value</CardTitle>
                <CardDescription>Lifetime Value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$4,250</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">↑ $320</span> vs previous period
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Acquisition</CardTitle>
                <CardDescription>
                  New customers over time
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
                      dataKey="sales" 
                      stroke="#8884d8" 
                      name="New Customers"
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Customer Payment Behavior</CardTitle>
                <CardDescription>
                  Payment timeliness analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'On Time', value: 68 },
                        { name: '1-7 Days Late', value: 18 },
                        { name: '8-30 Days Late', value: 10 },
                        { name: '30+ Days Late', value: 4 },
                      ]}
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
          
          <Card>
            <CardHeader>
              <CardTitle>Most Valuable Customers</CardTitle>
              <CardDescription>
                Customers ranked by total purchase value
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Purchases
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Spent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg. Order Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Purchase
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Lagos General Hospital
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Hospital
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        48
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $78,540
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $1,636
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        10/12/2023
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Abuja Medical Center
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Medical Center
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        36
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $64,320
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $1,787
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        10/05/2023
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Kano Pharmacy Ltd
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Pharmacy
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        52
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $42,890
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $825
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        10/10/2023
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ReportsPage;