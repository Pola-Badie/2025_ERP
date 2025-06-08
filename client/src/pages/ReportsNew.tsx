import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { Download, FileText, TrendingUp, DollarSign, Package, Users, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DateRange } from 'react-day-picker';

const COLORS = ['#1976D2', '#388E3C', '#F57C00', '#D32F2F', '#7B1FA2', '#0097A7'];

export default function ReportsNew() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // API Data Queries
  const { data: salesData } = useQuery({
    queryKey: ['/api/reports/sales'],
    queryFn: () => fetch('/api/reports/sales').then(res => res.json())
  });

  const { data: financialData } = useQuery({
    queryKey: ['/api/reports/financial'],
    queryFn: () => fetch('/api/reports/financial').then(res => res.json())
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['/api/reports/inventory'],
    queryFn: () => fetch('/api/reports/inventory').then(res => res.json())
  });

  const { data: customersData } = useQuery({
    queryKey: ['/api/reports/customers'],
    queryFn: () => fetch('/api/reports/customers').then(res => res.json())
  });

  const { data: productionData } = useQuery({
    queryKey: ['/api/reports/production'],
    queryFn: () => fetch('/api/reports/production').then(res => res.json())
  });

  const { data: refiningData } = useQuery({
    queryKey: ['/api/reports/refining'],
    queryFn: () => fetch('/api/reports/refining').then(res => res.json())
  });

  const getReportData = (reportType: string) => {
    switch (reportType.toLowerCase()) {
      case 'sales': return salesData;
      case 'financial': return financialData;
      case 'inventory': return inventoryData;
      case 'customers': return customersData;
      case 'production': return productionData;
      case 'refining': return refiningData;
      default: return null;
    }
  };

  const getDetailedTableData = (reportType: string) => {
    const reportData = getReportData(reportType);
    if (!reportData) return null;

    switch (reportType.toLowerCase()) {
      case 'sales':
        return {
          headers: ['Invoice #', 'Customer', 'Product', 'Quantity', 'Amount', 'Date', 'Status'],
          rows: reportData.transactions?.map((t: any) => [
            t.invoiceNumber,
            t.customerName,
            t.productName,
            `${t.quantity} ${t.unit}`,
            `$${t.totalAmount?.toFixed(2)}`,
            new Date(t.date).toLocaleDateString(),
            t.status
          ]) || []
        };
      case 'financial':
        return {
          headers: ['Date', 'Description', 'Category', 'Amount', 'Type', 'Reference'],
          rows: reportData.transactions?.map((t: any) => [
            new Date(t.date).toLocaleDateString(),
            t.description,
            t.category,
            `$${Math.abs(t.amount).toFixed(2)}`,
            t.amount > 0 ? 'Income' : 'Expense',
            t.reference
          ]) || []
        };
      case 'inventory':
        return {
          headers: ['Product', 'SKU', 'Current Stock', 'Unit', 'Value', 'Status', 'Last Updated'],
          rows: reportData.products?.map((p: any) => [
            p.name,
            p.sku,
            p.currentStock.toString(),
            p.unit,
            `$${(p.currentStock * p.unitPrice).toFixed(2)}`,
            p.currentStock < p.minStock ? 'Low Stock' : 'In Stock',
            new Date(p.lastUpdated).toLocaleDateString()
          ]) || []
        };
      default:
        return null;
    }
  };

  const exportToPDF = async (reportType: string) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Professional header
      pdf.setFillColor(25, 118, 210);
      pdf.rect(0, 0, pageWidth, 35, 'F');
      
      pdf.setFontSize(22);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MORGAN CHEMICAL ERP', 20, 22);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Advanced Analytics & Business Intelligence Platform', 20, 30);
      
      // Report title
      pdf.setFontSize(20);
      pdf.setTextColor(25, 118, 210);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${reportType.toUpperCase()} ANALYTICS REPORT`, 20, 50);
      
      // Metadata
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      const currentDate = new Date().toLocaleDateString();
      
      pdf.text(`Generated: ${currentDate}`, 20, 58);
      pdf.text(`Report Period: Current Month`, 20, 64);
      pdf.text(`Data Source: Live ERP Database | Classification: Confidential`, 20, 70);
      
      // Executive Summary
      pdf.setFontSize(16);
      pdf.setTextColor(25, 118, 210);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EXECUTIVE SUMMARY', 20, 90);
      
      let yPosition = 110;
      
      // Add summary metrics
      const summaryMetrics = [
        ['Total Sales', '$3,816', 'Total Revenue'],
        ['Transactions', '6', 'Total Orders'],
        ['Average Order', '$636.00', 'Per Transaction'],
        ['Top Category', 'Pain Relievers', 'Best Performing']
      ];
      
      summaryMetrics.forEach((metric, index) => {
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont('helvetica', 'normal');
        pdf.text(metric[0], 20, yPosition + (index * 20));
        
        pdf.setFontSize(14);
        pdf.setTextColor(33, 37, 41);
        pdf.setFont('helvetica', 'bold');
        pdf.text(metric[1], 20, yPosition + (index * 20) + 8);
      });
      
      yPosition += 100;
      
      // Add detailed data table
      const reportTableData = getDetailedTableData(reportType);
      if (reportTableData) {
        pdf.setFontSize(16);
        pdf.setTextColor(25, 118, 210);
        pdf.setFont('helvetica', 'bold');
        pdf.text('DETAILED DATA ANALYSIS', 20, yPosition);
        yPosition += 20;
        
        (pdf as any).autoTable({
          head: [reportTableData.headers],
          body: reportTableData.rows,
          startY: yPosition,
          theme: 'grid',
          styles: { 
            fontSize: 8,
            cellPadding: 2,
            lineColor: [220, 220, 220],
            lineWidth: 0.1
          },
          headStyles: { 
            fillColor: [25, 118, 210],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250]
          }
        });
      }
      
      // Footer
      pdf.setFillColor(248, 249, 250);
      pdf.rect(0, pageHeight - 20, pageWidth, 20, 'F');
      
      pdf.setFontSize(8);
      pdf.setTextColor(108, 117, 125);
      pdf.text('Morgan Chemical ERP | Confidential Business Intelligence Report', 20, pageHeight - 10);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 60, pageHeight - 10);
      
      // Save PDF
      const pdfFilename = `Morgan-Chemical-${reportType}-Report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(pdfFilename);
      
    } catch (error) {
      console.error('PDF export error:', error);
    }
  };

  const exportToExcel = async (reportType: string) => {
    try {
      const reportData = getReportData(reportType);
      if (!reportData) return;

      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      
      // Create summary data
      const summaryData = [
        ['Metric', 'Value'],
        ['Total Sales', '$3,816'],
        ['Transactions', '6'],
        ['Average Order', '$636.00'],
        ['Top Category', 'Pain Relievers']
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');
      
      // Add detailed data sheet
      const detailedTableData = getDetailedTableData(reportType);
      if (detailedTableData) {
        const analyticsData = [detailedTableData.headers, ...detailedTableData.rows];
        const analyticsSheet = XLSX.utils.aoa_to_sheet(analyticsData);
        XLSX.utils.book_append_sheet(workbook, analyticsSheet, 'Detailed Analytics');
      }
      
      // Save Excel file
      const excelFilename = `Morgan-Chemical-${reportType}-Report-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, excelFilename);
      
    } catch (error) {
      console.error('Excel export error:', error);
    }
  };

  const renderCharts = (reportType: string) => {
    const reportData = getReportData(reportType);
    if (!reportData || !reportData.chartData) return null;

    return (
      <div className="space-y-6">
        {/* Monthly Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Trend Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.chartData.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#1976D2" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.chartData.categories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.chartData.categories.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Metrics Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.chartData.performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="current" fill="#1976D2" name="Current" />
                <Bar dataKey="target" fill="#388E3C" name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPreviewDialog = (reportType: string) => {
    const reportData = getReportData(reportType);
    if (!reportData) return null;

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-600">
              {reportType.toUpperCase()} ANALYTICS REPORT - PREVIEW
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Executive Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-600 mb-4">EXECUTIVE SUMMARY</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-xl font-bold">$3,816</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="text-xl font-bold">6</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Order</p>
                  <p className="text-xl font-bold">$636.00</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Top Category</p>
                  <p className="text-xl font-bold">Pain Relievers</p>
                </div>
              </div>
            </div>

            {/* Charts */}
            {renderCharts(reportType)}

            {/* Detailed Data Table */}
            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-4">DETAILED DATA ANALYSIS</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      {getDetailedTableData(reportType)?.headers.map((header, index) => (
                        <th key={index} className="border border-gray-300 px-4 py-2 text-left">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {getDetailedTableData(reportType)?.rows.slice(0, 10).map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const reportTypes = [
    { id: 'sales', name: 'Sales Analytics', icon: DollarSign, color: 'text-green-600' },
    { id: 'financial', name: 'Financial Reports', icon: TrendingUp, color: 'text-blue-600' },
    { id: 'inventory', name: 'Inventory Analysis', icon: Package, color: 'text-orange-600' },
    { id: 'customers', name: 'Customer Analytics', icon: Users, color: 'text-purple-600' },
    { id: 'production', name: 'Production Reports', icon: Calendar, color: 'text-red-600' },
    { id: 'refining', name: 'Refining Analytics', icon: TrendingUp, color: 'text-indigo-600' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive business intelligence and data insights</p>
        </div>
        <DatePickerWithRange 
          date={dateRange} 
          onDateChange={setDateRange}
          className="w-auto"
        />
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          {reportTypes.map((report) => (
            <TabsTrigger key={report.id} value={report.id} className="flex items-center gap-2">
              <report.icon className={`h-4 w-4 ${report.color}`} />
              {report.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {reportTypes.map((report) => (
          <TabsContent key={report.id} value={report.id} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <report.icon className={`h-5 w-5 ${report.color}`} />
                    {report.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    {renderPreviewDialog(report.id)}
                    <Button onClick={() => exportToPDF(report.id)} size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                    <Button onClick={() => exportToExcel(report.id)} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderCharts(report.id)}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}