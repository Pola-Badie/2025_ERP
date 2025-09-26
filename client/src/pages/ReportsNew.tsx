// ============================================================================
// ENHANCED REPORTS PAGE - Integration with Existing Financial Reports
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Package, Factory, Users, DollarSign, Calendar, Download, 
  RefreshCw, AlertCircle, FileText, Calculator, Receipt
} from 'lucide-react';

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function EnhancedReportsPage() {
  const [selectedReport, setSelectedReport] = useState('trial-balance');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Financial reports data
  const [reportData, setReportData] = useState<any>(null);
  
  // Business analytics data
  const [salesData, setSalesData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [productionData, setProductionData] = useState<any>(null);
  const [customersData, setCustomersData] = useState<any>(null);
  const [financeData, setFinanceData] = useState<any>(null);

  // Initialize dates
  useEffect(() => {
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    
    setStartDate(sixMonthsAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
    setSelectedMonth(today.toISOString().slice(0, 7));
  }, []);

  // Generate month options
  const getMonthOptions = () => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    return options;
  };

  const monthOptions = getMonthOptions();

  // Report types including new business analytics
  const reportTypes = [
    // Financial Reports
    { value: 'trial-balance', label: 'Trial Balance', category: 'financial' },
    { value: 'profit-loss', label: 'Profit & Loss Statement', category: 'financial' },
    { value: 'balance-sheet', label: 'Balance Sheet', category: 'financial' },
    { value: 'cash-flow', label: 'Cash Flow Statement', category: 'financial' },
    { value: 'chart-of-accounts', label: 'Chart of Accounts', category: 'financial' },
    { value: 'journal-entries', label: 'Journal Entries', category: 'financial' },
    { value: 'general-ledger', label: 'General Ledger', category: 'financial' },
    { value: 'account-summary', label: 'Account Summary', category: 'financial' },
    { value: 'aging-analysis', label: 'Aging Analysis', category: 'financial' },
    
    // Business Analytics Reports
    { value: 'sales-analysis', label: 'Sales Analysis', category: 'analytics' },
    { value: 'inventory-analysis', label: 'Inventory Analysis', category: 'analytics' },
    { value: 'production-analysis', label: 'Production Analysis', category: 'analytics' },
    { value: 'top-customers', label: 'Top Customers', category: 'analytics' },
    { value: 'finance-breakdown', label: 'Finance Breakdown', category: 'analytics' }
  ];

  // API service functions for financial reports
  const fetchFinancialReport = async (reportType: string) => {
    const params = new URLSearchParams();
    if (reportType === 'balance-sheet') {
      params.append('asOfDate', endDate);
    } else {
      params.append('startDate', startDate);
      params.append('endDate', endDate);
    }
    
    const response = await fetch(`/api/reports/${reportType}?${params}`);
    if (!response.ok) throw new Error(`Failed to fetch ${reportType}`);
    return response.json();
  };

  // API service functions for business analytics
  const fetchSalesAnalysis = async () => {
    const response = await fetch(`/api/reports/sales-analysis?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) throw new Error('Failed to fetch sales analysis');
    return response.json();
  };

  const fetchInventoryAnalysis = async () => {
    const response = await fetch(`/api/reports/inventory-analysis`);
    if (!response.ok) throw new Error('Failed to fetch inventory analysis');
    return response.json();
  };

  const fetchProductionAnalysis = async () => {
    const response = await fetch(`/api/reports/production-analysis?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) throw new Error('Failed to fetch production analysis');
    return response.json();
  };

  const fetchTopCustomers = async () => {
    const response = await fetch(`/api/reports/top-customers?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) throw new Error('Failed to fetch top customers');
    return response.json();
  };

  const fetchFinanceBreakdown = async () => {
    const response = await fetch(`/api/reports/finance-breakdown?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) throw new Error('Failed to fetch finance breakdown');
    return response.json();
  };

  // Fetch report data based on selected report type
  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const reportType = selectedReport;
      const reportInfo = reportTypes.find(r => r.value === reportType);
      
      if (reportInfo?.category === 'financial') {
        const data = await fetchFinancialReport(reportType);
        setReportData(data);
        // Clear analytics data
        setSalesData(null);
        setInventoryData(null);
        setProductionData(null);
        setCustomersData(null);
        setFinanceData(null);
      } else {
        // Clear financial data
        setReportData(null);
        
        // Fetch analytics data
        switch (reportType) {
          case 'sales-analysis':
            const sales = await fetchSalesAnalysis();
            setSalesData(sales);
            break;
          case 'inventory-analysis':
            const inventory = await fetchInventoryAnalysis();
            setInventoryData(inventory);
            break;
          case 'production-analysis':
            const production = await fetchProductionAnalysis();
            setProductionData(production);
            break;
          case 'top-customers':
            const customers = await fetchTopCustomers();
            setCustomersData(customers);
            break;
          case 'finance-breakdown':
            const finance = await fetchFinanceBreakdown();
            setFinanceData(finance);
            break;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchReport();
    }
  }, [selectedReport, startDate, endDate]);

  // Handle month selection
  const handleMonthSelect = (value: string) => {
    setSelectedMonth(value);
    const date = new Date(value);
    setStartDate(new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]);
    setEndDate(new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0]);
  };

  // Export functions
  const handleExportPDF = async () => {
    try {
      const reportInfo = reportTypes.find(r => r.value === selectedReport);
      if (reportInfo?.category === 'analytics') {
        // Export analytics report
        window.open(`/api/reports/export-all/pdf?startDate=${startDate}&endDate=${endDate}`, '_blank');
      } else {
        // Export financial report
        const params = selectedReport === 'balance-sheet' 
          ? { asOfDate: endDate } 
          : { startDate, endDate };
        const queryString = new URLSearchParams(params).toString();
        window.open(`/api/reports/${selectedReport}/pdf?${queryString}`, '_blank');
      }
    } catch (err) {
      setError('Failed to export PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      const reportInfo = reportTypes.find(r => r.value === selectedReport);
      if (reportInfo?.category === 'analytics') {
        // Export analytics report
        window.open(`/api/reports/export-all/excel?startDate=${startDate}&endDate=${endDate}`, '_blank');
      } else {
        // Export financial report
        const params = selectedReport === 'balance-sheet' 
          ? { asOfDate: endDate } 
          : { startDate, endDate };
        const queryString = new URLSearchParams(params).toString();
        window.open(`/api/reports/${selectedReport}/excel?${queryString}`, '_blank');
      }
    } catch (err) {
      setError('Failed to export Excel');
    }
  };

  // Render Sales Analysis
  const renderSalesAnalysis = () => {
    if (!salesData) return null;

    // Prepare chart data for trends
    const trendChartData = salesData.trends?.reduce((acc: any[], item: any) => {
      const month = new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const existing = acc.find(x => x.month === month);
      if (existing) {
        existing[`${item.grade}_revenue`] = parseFloat(item.total_revenue);
      } else {
        acc.push({
          month,
          [`${item.grade}_revenue`]: parseFloat(item.total_revenue)
        });
      }
      return acc;
    }, []) || [];

    // Prepare grade distribution data
    const gradeData = salesData.topItems?.reduce((acc: any[], item: any) => {
      const existing = acc.find(x => x.grade === item.grade);
      if (existing) {
        existing.value += parseFloat(item.total_revenue);
      } else {
        acc.push({
          grade: item.grade === 'P' ? 'Pharma' : item.grade === 'F' ? 'Food' : 'Technical',
          value: parseFloat(item.total_revenue)
        });
      }
      return acc;
    }, []) || [];

    return (
      <div className="space-y-6">
        {/* Top Month KPI */}
        {salesData.topMonth && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Top Performing Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Month</p>
                  <p className="text-2xl font-bold">
                    {new Date(salesData.topMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${parseFloat(salesData.topMonth.total_sales).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Invoices</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {salesData.topMonth.invoice_count}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Items by Grade */}
          <Card>
            <CardHeader>
              <CardTitle>Top Items by Grade (P/F/T)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {salesData.topItems?.slice(0, 8).map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={item.grade === 'P' ? 'default' : item.grade === 'F' ? 'secondary' : 'outline'}>
                          {item.grade === 'P' ? 'Pharma' : item.grade === 'F' ? 'Food' : 'Technical'}
                        </Badge>
                        <span className="text-sm text-gray-600">Qty: {parseFloat(item.total_quantity).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">${parseFloat(item.total_revenue).toLocaleString()}</p>
                      <p className="text-sm text-gray-600">{item.order_count} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Grade Distribution Chart */}
          {gradeData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sales by Product Grade</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={gradeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({grade, value}) => `${grade}: $${value.toLocaleString()}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {gradeData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Monthly Trends Chart */}
        {trendChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Sales Trends by Grade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `$${value?.toLocaleString() || 0}`} />
                  <Legend />
                  <Line type="monotone" dataKey="P_revenue" stroke="#8884d8" strokeWidth={2} name="Pharma Revenue" />
                  <Line type="monotone" dataKey="F_revenue" stroke="#82ca9d" strokeWidth={2} name="Food Revenue" />
                  <Line type="monotone" dataKey="T_revenue" stroke="#ffc658" strokeWidth={2} name="Technical Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Render Inventory Analysis
  const renderInventoryAnalysis = () => {
    if (!inventoryData) return null;

    return (
      <div className="space-y-6">
        {/* Inventory Value Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Inventory Value Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  ${parseFloat(inventoryData.totalValue || 0).toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-blue-600">{inventoryData.summary?.totalItems || 0}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">{inventoryData.summary?.lowStockItems || 0}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">High Value Items</p>
                <p className="text-2xl font-bold text-purple-600">{inventoryData.summary?.highValueItems || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Inventory Items */}
        {inventoryData.inventory?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>How Much I Owe (Inventory Value)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryData.inventory.slice(0, 10).map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell>
                        <Badge variant={item.grade === 'P' ? 'default' : item.grade === 'F' ? 'secondary' : 'outline'}>
                          {item.grade === 'P' ? 'Pharma' : item.grade === 'F' ? 'Food' : 'Technical'}
                        </Badge>
                      </TableCell>
                      <TableCell>{parseFloat(item.current_stock).toLocaleString()}</TableCell>
                      <TableCell>${parseFloat(item.unit_cost).toFixed(2)}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        ${parseFloat(item.inventory_value).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.stock_status === 'Low Stock' ? 'destructive' : 'outline'}>
                          {item.stock_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Inventory Value Chart */}
        {inventoryData.inventory?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Inventory Value by Product</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={inventoryData.inventory.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                  <Bar dataKey="inventory_value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Render Production Analysis
  const renderProductionAnalysis = () => {
    if (!productionData) return null;

    return (
      <div className="space-y-6">
        {/* Most Produced Item */}
        {productionData.mostProduced && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5 text-blue-600" />
                Most Produced Item & Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Product</p>
                  <p className="text-xl font-bold">{productionData.mostProduced.product_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Produced</p>
                  <p className="text-2xl font-bold text-green-600">
                    {parseFloat(productionData.mostProduced.total_produced).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Cost</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${parseFloat(productionData.mostProduced.total_production_cost).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Cost per Order</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${parseFloat(productionData.mostProduced.avg_cost_per_order).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Cost Breakdown Chart */}
              {productionData.costBreakdown?.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={productionData.costBreakdown.map((item: any) => ({
                        type: item.cost_type,
                        amount: parseFloat(item.total_amount)
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({type, amount}) => `${type}: $${amount.toLocaleString()}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {productionData.costBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* Detailed Cost Breakdown Table */}
        {productionData.costBreakdown?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Production Cost Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cost Type</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productionData.costBreakdown.map((item: any, index: number) => {
                    const total = productionData.costBreakdown.reduce((sum: number, i: any) => 
                      sum + parseFloat(i.total_amount), 0);
                    const percentage = (parseFloat(item.total_amount) / total * 100).toFixed(1);
                    
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.cost_type}</TableCell>
                        <TableCell className="font-bold text-green-600">
                          ${parseFloat(item.total_amount).toLocaleString()}
                        </TableCell>
                        <TableCell>{percentage}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Render Top Customers
  const renderTopCustomers = () => {
    if (!customersData) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customersData.summary?.totalCustomers || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${parseFloat(customersData.summary?.totalRevenue || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Customer Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${parseFloat(customersData.summary?.avgCustomerValue || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Top Segment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customersData.summary?.topSegment || 'N/A'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Rankings Table */}
        {customersData.customers?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Top Customers by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Total Revenue</TableHead>
                    <TableHead>Avg Order Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customersData.customers.map((customer: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-bold">#{index + 1}</TableCell>
                      <TableCell className="font-medium">{customer.customer_name}</TableCell>
                      <TableCell>{customer.total_orders}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        ${parseFloat(customer.total_revenue).toLocaleString()}
                      </TableCell>
                      <TableCell>${parseFloat(customer.avg_order_value).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Render Finance Breakdown
  const renderFinanceBreakdown = () => {
    if (!financeData) return null;

    const chartData = [
      { name: 'Revenue', value: parseFloat(financeData.summary?.totalRevenue || 0) },
      { name: 'Expenses', value: Math.abs(parseFloat(financeData.summary?.totalExpenses || 0)) }
    ];

    return (
      <div className="space-y-6">
        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${parseFloat(financeData.summary?.totalRevenue || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${Math.abs(parseFloat(financeData.summary?.totalExpenses || 0)).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${parseFloat(financeData.summary?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${parseFloat(financeData.summary?.netProfit || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Profit Margin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {parseFloat(financeData.summary?.profitMargin || 0).toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Cash Position</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${parseFloat(financeData.summary?.cashPosition || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ${parseFloat(financeData.summary?.cashPosition || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue vs Expenses Chart */}
        {chartData[0].value > 0 || chartData[1].value > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, value}) => `${name}: $${value.toLocaleString()}`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#4CAF50" />
                    <Cell fill="#F44336" />
                  </Pie>
                  <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}
      </div>
    );
  };

  // Main render
  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive business intelligence and data insights</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={fetchReport} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Controls Section */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Select a report" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map(report => (
                    <SelectItem key={report.value} value={report.value}>
                      {report.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="month">Month</Label>
              <Select value={selectedMonth} onValueChange={handleMonthSelect}>
                <SelectTrigger id="month">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading report data...</p>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      {!loading && !error && (
        <div>
          {selectedReport === 'sales-analysis' && renderSalesAnalysis()}
          {selectedReport === 'inventory-analysis' && renderInventoryAnalysis()}
          {selectedReport === 'production-analysis' && renderProductionAnalysis()}
          {selectedReport === 'top-customers' && renderTopCustomers()}
          {selectedReport === 'finance-breakdown' && renderFinanceBreakdown()}
          
          {/* Render financial reports if available */}
          {reportData && (
            <Card>
              <CardHeader>
                <CardTitle>{reportTypes.find(r => r.value === selectedReport)?.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(reportData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}