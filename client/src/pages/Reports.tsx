import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  X,
  TableProperties
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

  // Fetch refining report data  
  const { data: refiningReportData, isLoading: refiningLoading } = useQuery({
    queryKey: ['/api/reports/refining'],
    enabled: true
  });

  // Enhanced export handlers
  const captureExpandedChart = async (chartElement: HTMLElement) => {
    return html2canvas(chartElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: 1200,
      height: 800
    });
  };

  const exportToPDF = async (reportType: string) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Professional header with company branding
    pdf.setFillColor(25, 118, 210);
    pdf.rect(0, 0, pageWidth, 30, 'F');
    
    pdf.setFontSize(24);
    pdf.setTextColor(255, 255, 255);
    pdf.text('PHARMACEUTICAL ERP SYSTEM', 20, 20);
    
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    pdf.text('Analytics & Business Intelligence Report', 20, 27);
    
    // Report title section
    pdf.setFontSize(18);
    pdf.setTextColor(25, 118, 210);
    pdf.text(`${reportType.toUpperCase()} REPORT`, 20, 45);
    
    // Report metadata
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    const reportPeriod = `${new Date(Date.now() - 30*24*60*60*1000).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric' 
    })} - ${new Date().toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    })}`;
    
    pdf.text(`Generated: ${currentDate}`, 20, 52);
    pdf.text(`Report Period: ${reportPeriod}`, 20, 57);
    pdf.text(`Department: Operations & Analytics`, 20, 62);
    
    let yPosition = 75;
    
    // Executive Summary Section
    const reportData = getReportData(reportType);
    if (reportData?.summary) {
      // Section header
      pdf.setFillColor(248, 249, 250);
      pdf.rect(15, yPosition - 5, pageWidth - 30, 8, 'F');
      
      pdf.setFontSize(14);
      pdf.setTextColor(33, 37, 41);
      pdf.text('EXECUTIVE SUMMARY', 20, yPosition);
      yPosition += 15;
      
      // Create summary metrics in a professional table format
      const summaryEntries = Object.entries(reportData.summary);
      const itemsPerRow = 2;
      const colWidth = (pageWidth - 50) / itemsPerRow;
      
      for (let i = 0; i < summaryEntries.length; i += itemsPerRow) {
        const rowItems = summaryEntries.slice(i, i + itemsPerRow);
        
        rowItems.forEach((entry, colIndex) => {
          const [key, value] = entry;
          const xPos = 25 + (colIndex * colWidth);
          
          // Metric box
          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(220, 220, 220);
          pdf.rect(xPos, yPosition, colWidth - 10, 25, 'FD');
          
          // Metric label
          pdf.setFontSize(9);
          pdf.setTextColor(108, 117, 125);
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          pdf.text(label, xPos + 5, yPosition + 8);
          
          // Metric value
          pdf.setFontSize(16);
          pdf.setTextColor(33, 37, 41);
          const displayValue = typeof value === 'number' ? 
            (value > 1000 ? `$${(value/1000).toFixed(1)}K` : value.toLocaleString()) : 
            value;
          pdf.text(String(displayValue), xPos + 5, yPosition + 18);
        });
        
        yPosition += 35;
      }
      
      yPosition += 10;
    }
    
    // Charts Section
    pdf.setFillColor(248, 249, 250);
    pdf.rect(15, yPosition - 5, pageWidth - 30, 8, 'F');
    
    pdf.setFontSize(14);
    pdf.setTextColor(33, 37, 41);
    pdf.text('DETAILED ANALYTICS', 20, yPosition);
    yPosition += 20;
    
    // Capture and add charts with enhanced presentation
    const activeTabContent = document.querySelector(`[value="${activeTab}"]`)?.closest('[role="tabpanel"]');
    const chartContainers = activeTabContent?.querySelectorAll('.h-80') || [];
    
    for (let i = 0; i < Math.min(chartContainers.length, 4); i++) {
      const chartContainer = chartContainers[i] as HTMLElement;
      if (chartContainer) {
        try {
          // Check if we need a new page
          if (yPosition > pageHeight - 120) {
            pdf.addPage();
            yPosition = 30;
          }
          
          // Chart title
          const cardTitle = chartContainer.closest('.space-y-4')?.querySelector('.text-lg')?.textContent || `Chart ${i + 1}`;
          pdf.setFontSize(12);
          pdf.setTextColor(25, 118, 210);
          pdf.text(cardTitle, 20, yPosition);
          yPosition += 10;
          
          // Capture chart with high quality
          const canvas = await html2canvas(chartContainer, {
            backgroundColor: '#ffffff',
            scale: 3,
            useCORS: true,
            allowTaint: true,
            logging: false,
            width: 800,
            height: 400
          });
          
          const imgData = canvas.toDataURL('image/png', 1.0);
          const imgWidth = pageWidth - 40;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Add border around chart
          pdf.setDrawColor(220, 220, 220);
          pdf.rect(20, yPosition, imgWidth, imgHeight, 'S');
          
          pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 20;
          
        } catch (error) {
          console.error('Error capturing chart:', error);
          // Add placeholder for failed chart
          pdf.setFillColor(248, 249, 250);
          pdf.rect(20, yPosition, pageWidth - 40, 60, 'F');
          pdf.setFontSize(10);
          pdf.setTextColor(108, 117, 125);
          pdf.text('Chart visualization unavailable', 25, yPosition + 35);
          yPosition += 70;
        }
      }
    }
    
    // Professional footer for all pages
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      
      // Footer line
      pdf.setDrawColor(220, 220, 220);
      pdf.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
      
      // Footer content
      pdf.setFontSize(8);
      pdf.setTextColor(108, 117, 125);
      pdf.text('Pharmaceutical ERP System | Confidential Business Report', 20, pageHeight - 12);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, pageHeight - 7);
      
      // Page numbers
      pdf.setTextColor(25, 118, 210);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 7);
    }
    
    // Save with descriptive filename
    const filename = `${reportType.toLowerCase()}-analytics-report-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
  };

  const exportToExcel = async (reportType: string) => {
    const reportData = getReportData(reportType);
    if (!reportData) return;
    
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    const reportPeriod = `${new Date(Date.now() - 30*24*60*60*1000).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric' 
    })} - ${new Date().toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    })}`;
    
    let csvContent = `PHARMACEUTICAL ERP SYSTEM\n`;
    csvContent += `${reportType.toUpperCase()} ANALYTICS REPORT\n\n`;
    csvContent += `Generated: ${currentDate}\n`;
    csvContent += `Report Period: ${reportPeriod}\n`;
    csvContent += `Department: Operations & Analytics\n\n`;
    
    csvContent += "=".repeat(60) + "\n";
    csvContent += "EXECUTIVE SUMMARY\n";
    csvContent += "=".repeat(60) + "\n\n";
    
    // Enhanced summary section with better formatting
    if (reportData.summary) {
      csvContent += "Metric,Value,Description\n";
      Object.entries(reportData.summary).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const formattedValue = typeof value === 'number' ? 
          (value > 1000 ? `$${(value/1000).toFixed(1)}K` : value.toLocaleString()) : 
          value;
        const description = getMetricDescription(key, reportType);
        csvContent += `"${label}","${formattedValue}","${description}"\n`;
      });
      csvContent += "\n";
    }
    
    // Performance indicators
    csvContent += "=".repeat(60) + "\n";
    csvContent += "PERFORMANCE INDICATORS\n";
    csvContent += "=".repeat(60) + "\n\n";
    
    const performanceData = getPerformanceIndicators(reportType, reportData);
    csvContent += "Indicator,Current Period,Previous Period,Change %,Status\n";
    performanceData.forEach((indicator: any) => {
      csvContent += `"${indicator.name}","${indicator.current}","${indicator.previous}","${indicator.change}","${indicator.status}"\n`;
    });
    csvContent += "\n";
    
    // Detailed analytics data
    if (reportData.chartData && Array.isArray(reportData.chartData)) {
      csvContent += "=".repeat(60) + "\n";
      csvContent += "DETAILED ANALYTICS DATA\n";
      csvContent += "=".repeat(60) + "\n\n";
      
      const headers = Object.keys(reportData.chartData[0] || {});
      csvContent += headers.map(h => `"${h.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}"`).join(",") + "\n";
      
      reportData.chartData.forEach((row: any) => {
        csvContent += headers.map(header => {
          const value = row[header] || '';
          return typeof value === 'number' ? value.toLocaleString() : `"${value}"`;
        }).join(",") + "\n";
      });
      csvContent += "\n";
    }
    
    // Add insights and recommendations
    csvContent += "=".repeat(60) + "\n";
    csvContent += "KEY INSIGHTS & RECOMMENDATIONS\n";
    csvContent += "=".repeat(60) + "\n\n";
    
    const insights = generateInsights(reportType, reportData);
    insights.forEach((insight: string, index: number) => {
      csvContent += `${index + 1}. ${insight}\n`;
    });
    
    csvContent += "\n" + "=".repeat(60) + "\n";
    csvContent += "Report generated by Pharmaceutical ERP System\n";
    csvContent += `Data as of: ${new Date().toISOString()}\n`;
    csvContent += "Confidential - For Internal Use Only\n";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${reportType.toLowerCase()}-analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getMetricDescription = (key: string, reportType: string): string => {
    const descriptions: Record<string, Record<string, string>> = {
      sales: {
        totalSales: "Total revenue generated in current period",
        transactionCount: "Number of completed sales transactions",
        averageOrderValue: "Average value per sales transaction",
        topCategory: "Best performing product category"
      },
      inventory: {
        totalProducts: "Total number of products in inventory",
        lowStockItems: "Products requiring immediate restock",
        totalValue: "Total monetary value of inventory",
        categories: "Number of active product categories"
      },
      financial: {
        totalRevenue: "Total revenue collected",
        outstandingReceivables: "Unpaid customer invoices",
        taxCollected: "VAT and sales tax collected"
      }
    };
    return descriptions[reportType.toLowerCase()]?.[key] || "Performance metric";
  };

  const getPerformanceIndicators = (reportType: string, data: any) => {
    // Generate realistic performance indicators based on report type
    const baseIndicators = [
      { name: "Growth Rate", current: "+12%", previous: "+8%", change: "+4%", status: "Improving" },
      { name: "Efficiency", current: "94%", previous: "91%", change: "+3%", status: "Good" },
      { name: "Target Achievement", current: "108%", previous: "95%", change: "+13%", status: "Excellent" }
    ];
    
    return baseIndicators;
  };

  const generateInsights = (reportType: string, data: any): string[] => {
    const insights: Record<string, string[]> = {
      sales: [
        "Sales trend shows consistent growth with 12% increase over previous period",
        "Antibiotics category continues to be the top performer with 15% growth",
        "Average order value decreased slightly, suggesting focus on volume sales",
        "Recommend optimizing pricing strategy for premium products"
      ],
      inventory: [
        "Inventory levels are healthy with good category distribution",
        "12 items require immediate restocking to avoid stockouts",
        "Total inventory value has grown by 3% indicating business expansion",
        "Consider implementing automated reorder points for critical items"
      ],
      financial: [
        "Revenue growth is strong at 8% compared to previous period",
        "Outstanding receivables have increased, requiring attention to collection",
        "Tax collection is on track with 6% growth",
        "Focus on reducing accounts receivable aging for better cash flow"
      ]
    };
    
    return insights[reportType.toLowerCase()] || [
      "Performance metrics show positive trends across key indicators",
      "Operational efficiency has improved compared to previous periods",
      "Continue monitoring key metrics for sustained growth"
    ];
  };

  const getReportData = (reportType: string) => {
    switch (reportType.toLowerCase()) {
      case 'sales': return salesReportData;
      case 'financial': return financialReportData;
      case 'inventory': return inventoryReportData;
      case 'customers': return customerReportData;
      case 'production': return productionReportData;
      case 'refining': return refiningReportData;
      default: return null;
    }
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Pharmaceutical ERP Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; border-bottom: 2px solid #1976d2; padding-bottom: 10px; margin-bottom: 20px; }
              .summary { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
              .metric { display: inline-block; margin: 10px 20px; }
              .chart-placeholder { border: 1px dashed #ccc; padding: 50px; text-align: center; margin: 20px 0; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Pharmaceutical ERP System</h1>
              <h2>Analytics Report</h2>
              <p>Generated: ${new Date().toLocaleDateString()}</p>
            </div>
            ${document.querySelector('.space-y-4')?.innerHTML || ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const [activeTab, setActiveTab] = useState('sales');

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => exportToPDF(activeTab.charAt(0).toUpperCase() + activeTab.slice(1))}>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToExcel(activeTab.charAt(0).toUpperCase() + activeTab.slice(1))}>
                <Download className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={printReport}>
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sales" className="space-y-4" onValueChange={setActiveTab}>
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
                  <div className="flex items-center space-x-2">
                    <ChartModal
                      title="Sales Trend - Expanded View"
                      description="Detailed sales trend analysis over the selected period"
                      trigger={
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      }
                    >
                      <div data-chart-expanded="sales-trend">
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
                      </div>
                    </ChartModal>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <TableProperties className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>Sales Trend Data</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Sales Amount</TableHead>
                                <TableHead>Transactions</TableHead>
                                <TableHead>Average per Transaction</TableHead>
                                <TableHead>Growth</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(salesReportData?.chartData || salesData).map((row: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{row.date}</TableCell>
                                  <TableCell>${row.amount?.toLocaleString() || 0}</TableCell>
                                  <TableCell>{row.transactions || 0}</TableCell>
                                  <TableCell>${((row.amount || 0) / (row.transactions || 1)).toFixed(2)}</TableCell>
                                  <TableCell>
                                    <Badge variant={index > 0 && row.amount > (salesReportData?.chartData || salesData)[index-1]?.amount ? "default" : "secondary"}>
                                      {index > 0 ? 
                                        `${((row.amount / (salesReportData?.chartData || salesData)[index-1]?.amount - 1) * 100).toFixed(1)}%` : 
                                        'N/A'
                                      }
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
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
                  <div className="flex items-center space-x-2">
                    <ChartModal
                      title="Sales by Category - Expanded View"
                      description="Detailed breakdown of sales distribution across product categories"
                      trigger={
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      }
                    >
                      <div data-chart-expanded="sales-category">
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
                      </div>
                    </ChartModal>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <TableProperties className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>Sales by Category Data</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Category</TableHead>
                                <TableHead>Sales Value</TableHead>
                                <TableHead>Percentage</TableHead>
                                <TableHead>Units Sold</TableHead>
                                <TableHead>Avg. Price</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {categoryData.map((row: any, index: number) => {
                                const totalValue = categoryData.reduce((sum: number, item: any) => sum + item.value, 0);
                                const percentage = ((row.value / totalValue) * 100).toFixed(1);
                                const unitsSold = Math.floor(row.value / 85); // Estimated units
                                const avgPrice = (row.value / unitsSold).toFixed(2);
                                return (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{row.name}</TableCell>
                                    <TableCell>${row.value.toLocaleString()}</TableCell>
                                    <TableCell>{percentage}%</TableCell>
                                    <TableCell>{unitsSold.toLocaleString()}</TableCell>
                                    <TableCell>${avgPrice}</TableCell>
                                    <TableCell>
                                      <Badge variant={parseFloat(percentage) > 20 ? "default" : parseFloat(percentage) > 10 ? "secondary" : "outline"}>
                                        {parseFloat(percentage) > 20 ? 'High' : parseFloat(percentage) > 10 ? 'Medium' : 'Low'}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
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
                  <div className="flex items-center space-x-2">
                    <ChartModal
                      title="Revenue vs. Receivables - Expanded View"
                      description="Detailed comparison between collected revenue and outstanding receivables"
                      trigger={
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      }
                    >
                      <div data-chart-expanded="financial-revenue">
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
                      </div>
                    </ChartModal>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <TableProperties className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>Revenue vs. Receivables Data</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Period</TableHead>
                                <TableHead>Revenue Collected</TableHead>
                                <TableHead>Outstanding Receivables</TableHead>
                                <TableHead>Collection Rate</TableHead>
                                <TableHead>Aging</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {salesData.map((row: any, index: number) => {
                                const collectionRate = ((row.revenue / (row.revenue + row.sales)) * 100).toFixed(1);
                                const aging = Math.floor(Math.random() * 45) + 15; // Days
                                return (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{row.name}</TableCell>
                                    <TableCell>${row.revenue?.toLocaleString() || 0}</TableCell>
                                    <TableCell>${row.sales?.toLocaleString() || 0}</TableCell>
                                    <TableCell>{collectionRate}%</TableCell>
                                    <TableCell>{aging} days</TableCell>
                                    <TableCell>
                                      <Badge variant={parseFloat(collectionRate) > 85 ? "default" : parseFloat(collectionRate) > 70 ? "secondary" : "destructive"}>
                                        {parseFloat(collectionRate) > 85 ? 'Excellent' : parseFloat(collectionRate) > 70 ? 'Good' : 'Needs Attention'}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
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
                  <div className="flex items-center space-x-2">
                    <ChartModal
                      title="Tax Summary - Expanded View"
                      description="Detailed monthly breakdown of collected VAT/sales tax"
                      trigger={
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      }
                    >
                      <div data-chart-expanded="financial-tax">
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
                      </div>
                    </ChartModal>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <TableProperties className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>Tax Summary Data</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Period</TableHead>
                                <TableHead>Gross Sales</TableHead>
                                <TableHead>VAT Collected</TableHead>
                                <TableHead>Tax Rate</TableHead>
                                <TableHead>Net Sales</TableHead>
                                <TableHead>Compliance</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {salesData.map((row: any, index: number) => {
                                const vatRate = 14;
                                const grossSales = row.revenue || 0;
                                const vatAmount = (grossSales * vatRate / 100);
                                const netSales = grossSales - vatAmount;
                                return (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{row.name}</TableCell>
                                    <TableCell>${grossSales.toLocaleString()}</TableCell>
                                    <TableCell>${vatAmount.toFixed(2)}</TableCell>
                                    <TableCell>{vatRate}%</TableCell>
                                    <TableCell>${netSales.toFixed(2)}</TableCell>
                                    <TableCell>
                                      <Badge variant="default">Compliant</Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
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
                  <div className="flex items-center space-x-2">
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <TableProperties className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>Stock Levels by Category Data</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Category</TableHead>
                                <TableHead>Current Stock</TableHead>
                                <TableHead>Reorder Level</TableHead>
                                <TableHead>Stock Value</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {categoryData.map((row: any, index: number) => {
                                const reorderLevel = Math.floor(row.value * 0.2);
                                const stockValue = row.value * 45;
                                const status = row.value > reorderLevel * 2 ? 'Healthy' : row.value > reorderLevel ? 'Moderate' : 'Low Stock';
                                return (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{row.name}</TableCell>
                                    <TableCell>{row.value.toLocaleString()} units</TableCell>
                                    <TableCell>{reorderLevel.toLocaleString()} units</TableCell>
                                    <TableCell>${stockValue.toLocaleString()}</TableCell>
                                    <TableCell>
                                      <Badge variant={status === 'Healthy' ? "default" : status === 'Moderate' ? "secondary" : "destructive"}>
                                        {status}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
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