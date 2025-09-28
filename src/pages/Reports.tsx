import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { TrendingUp, TrendingDown, Users, Package, FileText, DollarSign, AlertCircle, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface SalesData {
  month: string;
  totalSales: number;
  totalRevenue: number;
  avgOrderValue: number;
  uniqueCustomers: number;
}

interface CustomerGrade {
  grade: string;
  gradeName: string;
  customerCount: number;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
}

interface ProductionItem {
  id: number;
  name: string;
  drugName: string;
  grade: string;
  categoryName: string;
  totalSold: number;
  orderFrequency: number;
  totalRevenue: number;
}

interface QuotationConversions {
  totalQuotations: number;
  convertedQuotations: number;
  overallConversionRate: number;
  totalQuotationValue: number;
  convertedValue: number;
  monthlyData: any[];
}

interface InventoryAnalytics {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  totalInventoryCost: number;
  totalInventoryValue: number;
  totalStockUnits: number;
  activeProducts: number;
  warehouseLocations: number;
}

interface TopCustomer {
  id: number;
  name: string;
  company: string;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  lastOrderDate: string;
}

interface ReportsData {
  salesAnalytics: {
    monthlySales: SalesData[];
    summary: {
      totalRevenue: number;
      totalSales: number;
      avgSaleValue: number;
      outstandingAR: number;
    };
  };
  customerGrades: CustomerGrade[];
  productionData: ProductionItem[];
  quotationConversions: QuotationConversions;
  inventoryAnalytics: InventoryAnalytics;
  topCustomers: TopCustomer[];
}

const Reports = () => {
  const { data: reportsData, isLoading, error } = useQuery<ReportsData>({
    queryKey: ['/api/reports/dashboard-analytics'],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time data
  });

  const COLORS = ['#3BCEAC', '#2563eb', '#dc2626', '#ea580c', '#7c3aed', '#059669'];

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Reports Dashboard</h1>
          <Badge variant="outline" className="animate-pulse">Loading Real Data...</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Reports Dashboard</h1>
          <Badge variant="destructive">Error Loading Data</Badge>
        </div>
        <Card className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-semibold">Failed to load reports data</p>
            <p className="text-sm text-gray-600 mt-2">Please refresh the page or contact support</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!reportsData) return null;

  const { salesAnalytics, customerGrades, productionData, quotationConversions, inventoryAnalytics, topCustomers } = reportsData;

  return (
    <div className="space-y-6 p-6" data-testid="reports-dashboard">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Reports Dashboard</h1>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <CheckCircle className="h-4 w-4 mr-1" />
          Real Database Data
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="total-revenue-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(salesAnalytics.summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {salesAnalytics.summary.totalSales} total sales
            </p>
          </CardContent>
        </Card>

        <Card data-testid="active-products-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryAnalytics.activeProducts}</div>
            <p className="text-xs text-muted-foreground">
              {inventoryAnalytics.totalStockUnits} total units
            </p>
          </CardContent>
        </Card>

        <Card data-testid="quotation-conversion-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quote Conversion</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotationConversions.overallConversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {quotationConversions.convertedQuotations} of {quotationConversions.totalQuotations} quotes
            </p>
          </CardContent>
        </Card>

        <Card data-testid="outstanding-ar-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding A/R</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(salesAnalytics.summary.outstandingAR)}</div>
            <p className="text-xs text-muted-foreground">
              Accounts receivable
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4" data-testid="reports-tabs">
        <TabsList>
          <TabsTrigger value="sales" data-testid="tab-sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="customers" data-testid="tab-customers">Customer Grades</TabsTrigger>
          <TabsTrigger value="production" data-testid="tab-production">Production</TabsTrigger>
          <TabsTrigger value="quotations" data-testid="tab-quotations">Quotations</TabsTrigger>
          <TabsTrigger value="inventory" data-testid="tab-inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4" data-testid="sales-analytics-tab">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Sales Trend</CardTitle>
                <CardDescription>Revenue and sales count over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesAnalytics.monthlySales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'totalRevenue' ? formatCurrency(Number(value)) : value,
                        name === 'totalRevenue' ? 'Revenue' : 'Sales Count'
                      ]}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="totalRevenue" stroke="#3BCEAC" strokeWidth={2} name="Revenue" />
                    <Line yAxisId="right" type="monotone" dataKey="totalSales" stroke="#2563eb" strokeWidth={2} name="Sales Count" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Customers by Revenue</CardTitle>
                <CardDescription>Highest value customers in the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCustomers.slice(0, 5).map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.company} • {customer.totalOrders} orders
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatCurrency(customer.totalRevenue)}</p>
                        <p className="text-xs text-muted-foreground">
                          Avg: {formatCurrency(customer.avgOrderValue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4" data-testid="customer-grades-tab">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer Performance by Grade</CardTitle>
                <CardDescription>Revenue distribution across product grades (P, F, T)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={customerGrades}
                      dataKey="totalRevenue"
                      nameKey="gradeName"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.gradeName}: ${formatCurrency(entry.totalRevenue)}`}
                    >
                      {customerGrades.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grade Performance Metrics</CardTitle>
                <CardDescription>Detailed breakdown by product grade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerGrades.map((grade, index) => (
                    <div key={grade.grade} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="font-medium">{grade.gradeName}</span>
                          <Badge variant="outline">{grade.grade}</Badge>
                        </div>
                        <span className="text-sm font-bold">{formatCurrency(grade.totalRevenue)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div>
                          <span className="block font-medium">{grade.customerCount}</span>
                          <span className="text-xs">Customers</span>
                        </div>
                        <div>
                          <span className="block font-medium">{grade.totalOrders}</span>
                          <span className="text-xs">Orders</span>
                        </div>
                        <div>
                          <span className="block font-medium">{formatCurrency(grade.avgOrderValue)}</span>
                          <span className="text-xs">Avg Order</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="production" className="space-y-4" data-testid="production-tab">
          <Card>
            <CardHeader>
              <CardTitle>Most Produced Items</CardTitle>
              <CardDescription>Top 10 products by sales volume and frequency</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={productionData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'totalRevenue' ? formatCurrency(Number(value)) : value,
                      name === 'totalRevenue' ? 'Revenue' : 'Units Sold'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="totalSold" fill="#3BCEAC" name="Units Sold" />
                  <Bar dataKey="orderFrequency" fill="#2563eb" name="Order Frequency" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotations" className="space-y-4" data-testid="quotations-tab">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quotation Conversion Summary</CardTitle>
                <CardDescription>Overall performance and value metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {quotationConversions.overallConversionRate.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {quotationConversions.convertedQuotations}
                    </div>
                    <p className="text-sm text-muted-foreground">Converted</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Quotations:</span>
                    <span className="font-medium">{quotationConversions.totalQuotations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Value:</span>
                    <span className="font-medium">{formatCurrency(quotationConversions.totalQuotationValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Converted Value:</span>
                    <span className="font-medium text-green-600">{formatCurrency(quotationConversions.convertedValue)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Conversion Trends</CardTitle>
                <CardDescription>Conversion rates over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                {quotationConversions.monthlyData && quotationConversions.monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={quotationConversions.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Line 
                        type="monotone" 
                        dataKey="conversion_rate" 
                        stroke="#3BCEAC" 
                        strokeWidth={2}
                        name="Conversion Rate %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No monthly conversion data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4" data-testid="inventory-tab">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Health</CardTitle>
                <CardDescription>Stock status overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Products</span>
                    <Badge variant="outline">{inventoryAnalytics.totalProducts}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Products</span>
                    <Badge variant="default">{inventoryAnalytics.activeProducts}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Low Stock</span>
                    <Badge variant="destructive">{inventoryAnalytics.lowStockCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Out of Stock</span>
                    <Badge variant="destructive">{inventoryAnalytics.outOfStockCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Expiring Soon</span>
                    <Badge variant="secondary">{inventoryAnalytics.expiringSoonCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Expired</span>
                    <Badge variant="destructive">{inventoryAnalytics.expiredCount}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory Value</CardTitle>
                <CardDescription>Financial overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cost Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(inventoryAnalytics.totalInventoryCost)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Selling Value</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(inventoryAnalytics.totalInventoryValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Potential Profit</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrency(inventoryAnalytics.totalInventoryValue - inventoryAnalytics.totalInventoryCost)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Logistics Overview</CardTitle>
                <CardDescription>Operational metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Stock Units</p>
                  <p className="text-2xl font-bold">{inventoryAnalytics.totalStockUnits.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Warehouse Locations</p>
                  <p className="text-2xl font-bold">{inventoryAnalytics.warehouseLocations}</p>
                </div>
                <div className="pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Inventory Turnover</span>
                    <span className="font-medium">
                      {inventoryAnalytics.totalProducts > 0 
                        ? ((salesAnalytics.summary.totalSales / inventoryAnalytics.totalProducts) * 100).toFixed(1)
                        : '0'
                      }%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;