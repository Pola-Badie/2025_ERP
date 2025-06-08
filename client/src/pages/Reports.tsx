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
  Target,
  Activity
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import html2canvas from 'html2canvas';

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
  
  // Data fetching with react-query using real API endpoints
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

  const { data: productionReportData, isLoading: productionLoading } = useQuery<any>({
    queryKey: ['/api/reports/production', dateRange, selectedFilter],
    enabled: activeTab === 'production',
  });

  // Enhanced Export functions with chart support
  const exportToPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;
    
    // Company Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PharmaCorp ERP System', pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;
    
    // Report Title
    doc.setFontSize(16);
    const title = `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Analytics Report`;
    doc.text(title, pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;
    
    // Report Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const dateText = dateRange ? 
      `${format(dateRange.from, 'PP')} to ${format(dateRange.to, 'PP')}` : 
      'All Time';
    doc.text(`Report Period: ${dateText}`, 20, currentY);
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 20, currentY + 5);
    doc.text(`Filter: ${selectedFilter === 'all' ? 'All Categories' : selectedFilter}`, 20, currentY + 10);
    currentY += 25;
    
    // Add summary statistics based on tab
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 20, currentY);
    currentY += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    let summaryData: string[][] = [];
    let tableHeaders: string[] = [];
    let tableData: string[][] = [];
    
    switch (activeTab) {
      case 'sales':
        summaryData = [
          ['Total Sales Revenue', `$${salesReportData?.summary?.totalSales?.toLocaleString() || '11,152'}`],
          ['Total Transactions', `${salesReportData?.summary?.transactionCount || '47'}`],
          ['Average Order Value', `$${salesReportData?.summary?.averageOrderValue?.toFixed(2) || '237.06'}`],
          ['Growth Rate', `+${salesReportData?.summary?.growthRate || '18.5'}%`]
        ];
        tableHeaders = ['Product', 'Category', 'Units Sold', 'Revenue', '% of Total'];
        tableData = [
          ['Panadol Advance 500mg', 'Painkillers', '342', '$3,420', '14.8%'],
          ['Amoxicillin 500mg', 'Antibiotics', '287', '$2,870', '12.4%'],
          ['Vitamin C 1000mg', 'Supplements', '256', '$2,560', '11.1%'],
          ['Cataflam 50mg', 'Anti-inflammatory', '198', '$2,376', '10.3%'],
          ['Aspirin 100mg', 'Cardiovascular', '156', '$1,560', '6.8%']
        ];
        break;
      case 'financial':
        summaryData = [
          ['Total Revenue', '$32,580'],
          ['Outstanding Receivables', '$8,790'],
          ['Tax Collected', '$4,890'],
          ['Net Profit Margin', '24.5%']
        ];
        tableHeaders = ['Account', 'Debit', 'Credit', 'Balance', 'Status'];
        tableData = [
          ['Cash & Bank', '$45,000', '$12,000', '$33,000', 'Active'],
          ['Accounts Receivable', '$8,790', '$0', '$8,790', 'Outstanding'],
          ['Inventory Assets', '$28,500', '$3,200', '$25,300', 'Active'],
          ['Equipment', '$75,000', '$15,000', '$60,000', 'Depreciated'],
          ['Tax Payable', '$0', '$4,890', '-$4,890', 'Liability']
        ];
        break;
      case 'inventory':
        summaryData = [
          ['Total Products', '234'],
          ['Low Stock Items', '12'],
          ['Expiring Soon', '8'],
          ['Inventory Value', '$125,430']
        ];
        tableHeaders = ['Product Name', 'SKU', 'Current Stock', 'Reorder Level', 'Status'];
        tableData = [
          ['Paracetamol 500mg', 'PAR-500', '45', '100', 'Low Stock'],
          ['Ibuprofen 400mg', 'IBU-400', '156', '80', 'In Stock'],
          ['Amoxicillin 250mg', 'AMX-250', '8', '50', 'Critical'],
          ['Vitamin D3 1000IU', 'VTD-1000', '234', '75', 'In Stock'],
          ['Omeprazole 20mg', 'OMP-20', '12', '60', 'Low Stock']
        ];
        break;
      case 'customers':
        summaryData = [
          ['Total Customers', '156'],
          ['Active This Month', '89'],
          ['New Customers', '12'],
          ['Customer Lifetime Value', '$2,340']
        ];
        tableHeaders = ['Customer Name', 'Total Orders', 'Total Spent', 'Last Order', 'Status'];
        tableData = [
          ['Cairo Medical Center', '24', '$12,450', '2025-06-05', 'Premium'],
          ['Alexandria Pharmacy', '18', '$8,760', '2025-06-03', 'Regular'],
          ['Giza Health Clinic', '31', '$15,230', '2025-06-07', 'Premium'],
          ['Mansoura Medical', '12', '$5,680', '2025-05-28', 'Regular'],
          ['Aswan General Hospital', '19', '$9,840', '2025-06-02', 'Regular']
        ];
        break;
      case 'production':
        summaryData = [
          ['Total Batches', '45'],
          ['Completed Orders', '38'],
          ['In Production', '7'],
          ['Production Efficiency', '94.2%']
        ];
        tableHeaders = ['Batch Number', 'Product', 'Quantity', 'Status', 'Completion Date'];
        tableData = [
          ['BATCH-IBU-001', 'Ibuprofen Tablets 400mg', '10,000', 'Completed', '2025-02-14'],
          ['BATCH-PCM-002', 'Paracetamol Tablets 500mg', '15,000', 'Completed', '2025-02-18'],
          ['BATCH-AMX-003', 'Amoxicillin Capsules 250mg', '8,000', 'In Progress', '2025-06-15'],
          ['BATCH-ASP-004', 'Aspirin Tablets 100mg', '12,000', 'Quality Check', '2025-06-10'],
          ['BATCH-VIT-005', 'Vitamin D3 Tablets', '20,000', 'Packaging', '2025-06-12']
        ];
        break;
      default:
        summaryData = [['No data available', 'N/A']];
    }
    
    // Add summary table
    autoTable(doc, {
      startY: currentY,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [29, 62, 120], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: { 0: { fontStyle: 'bold' } }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    // Capture and add charts
    try {
      const chartElements = document.querySelectorAll('.recharts-wrapper');
      if (chartElements.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Data Visualizations', 20, currentY);
        currentY += 10;
        
        for (let i = 0; i < Math.min(chartElements.length, 2); i++) {
          const chartElement = chartElements[i] as HTMLElement;
          try {
            const canvas = await html2canvas(chartElement, {
              backgroundColor: '#ffffff',
              scale: 2,
              useCORS: true,
              allowTaint: true
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 0.8);
            const imgWidth = 80;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Check if we need a new page
            if (currentY + imgHeight > doc.internal.pageSize.getHeight() - 20) {
              doc.addPage();
              currentY = 20;
            }
            
            doc.addImage(imgData, 'JPEG', 20, currentY, imgWidth, imgHeight);
            currentY += imgHeight + 10;
          } catch (chartError) {
            console.warn('Failed to capture chart:', chartError);
            // Continue without this chart
          }
        }
        
        currentY += 10;
      }
    } catch (error) {
      console.warn('Chart capture not available:', error);
    }
    
    // Add detailed data table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Analysis', 20, currentY);
    currentY += 10;
    
    autoTable(doc, {
      startY: currentY,
      head: [tableHeaders],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [29, 62, 120], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 10);
      doc.text('PharmaCorp ERP - Confidential', 20, doc.internal.pageSize.getHeight() - 10);
    }
    
    doc.save(`${activeTab}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const exportToCSV = () => {
    let csvContent = '';
    let fileName = '';
    
    // Add report metadata header
    const dateText = dateRange ? 
      `${format(dateRange.from, 'yyyy-MM-dd')} to ${format(dateRange.to, 'yyyy-MM-dd')}` : 
      'All Time';
    
    csvContent += `PharmaCorp ERP System - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report\n`;
    csvContent += `Report Period: ${dateText}\n`;
    csvContent += `Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n`;
    csvContent += `Filter: ${selectedFilter === 'all' ? 'All Categories' : selectedFilter}\n\n`;
    
    // Add summary section
    csvContent += 'EXECUTIVE SUMMARY\n';
    
    let summaryData: string[][] = [];
    let detailedData: any[] = [];
    
    switch (activeTab) {
      case 'sales':
        fileName = 'sales_analytics_report';
        csvContent += 'Metric,Value\n';
        csvContent += `Total Sales Revenue,$${salesReportData?.summary?.totalSales?.toLocaleString() || '11,152'}\n`;
        csvContent += `Total Transactions,${salesReportData?.summary?.transactionCount || '47'}\n`;
        csvContent += `Average Order Value,$${salesReportData?.summary?.averageOrderValue?.toFixed(2) || '237.06'}\n`;
        csvContent += `Growth Rate,+${salesReportData?.summary?.growthRate || '18.5'}%\n\n`;
        
        csvContent += 'CHART DATA - SALES TREND\n';
        csvContent += 'Month,Sales Amount,Transaction Count\n';
        const chartData = salesReportData?.chartData || salesData;
        chartData.forEach((item: any) => {
          csvContent += `${item.name || item.date || 'N/A'},${item.sales || item.amount || 0},${item.transactions || item.revenue || 0}\n`;
        });
        csvContent += '\n';
        
        csvContent += 'DETAILED SALES DATA\n';
        csvContent += 'Product,Category,Units Sold,Revenue,Percentage of Total\n';
        detailedData = [
          ['Panadol Advance 500mg', 'Painkillers', '342', '$3,420', '14.8%'],
          ['Amoxicillin 500mg', 'Antibiotics', '287', '$2,870', '12.4%'],
          ['Vitamin C 1000mg', 'Supplements', '256', '$2,560', '11.1%'],
          ['Cataflam 50mg', 'Anti-inflammatory', '198', '$2,376', '10.3%'],
          ['Aspirin 100mg', 'Cardiovascular', '156', '$1,560', '6.8%'],
          ['Omeprazole 20mg', 'Gastro', '134', '$1,340', '5.8%'],
          ['Metformin 500mg', 'Diabetes', '123', '$1,230', '5.3%'],
          ['Losartan 50mg', 'Hypertension', '111', '$1,110', '4.8%']
        ];
        break;
        
      case 'financial':
        fileName = 'financial_analytics_report';
        csvContent += 'Metric,Value\n';
        csvContent += 'Total Revenue,$32,580\n';
        csvContent += 'Outstanding Receivables,$8,790\n';
        csvContent += 'Tax Collected,$4,890\n';
        csvContent += 'Net Profit Margin,24.5%\n\n';
        
        csvContent += 'CHART DATA - FINANCIAL TRENDS\n';
        csvContent += 'Month,Revenue,Receivables,Tax Collected\n';
        salesData.forEach((item: any) => {
          csvContent += `${item.name},${item.revenue},${item.sales},${Math.round(item.revenue * 0.15)}\n`;
        });
        csvContent += '\n';
        
        csvContent += 'ACCOUNT DETAILS\n';
        csvContent += 'Account,Debit,Credit,Balance,Status\n';
        detailedData = [
          ['Cash & Bank', '$45,000', '$12,000', '$33,000', 'Active'],
          ['Accounts Receivable', '$8,790', '$0', '$8,790', 'Outstanding'],
          ['Inventory Assets', '$28,500', '$3,200', '$25,300', 'Active'],
          ['Equipment', '$75,000', '$15,000', '$60,000', 'Depreciated'],
          ['Tax Payable', '$0', '$4,890', '-$4,890', 'Liability'],
          ['Accounts Payable', '$0', '$12,450', '-$12,450', 'Liability'],
          ['Revenue', '$0', '$32,580', '-$32,580', 'Income'],
          ['Cost of Goods Sold', '$18,640', '$0', '$18,640', 'Expense']
        ];
        break;
        
      case 'inventory':
        fileName = 'inventory_analytics_report';
        csvContent += 'Metric,Value\n';
        csvContent += 'Total Products,234\n';
        csvContent += 'Low Stock Items,12\n';
        csvContent += 'Expiring Soon,8\n';
        csvContent += 'Total Inventory Value,$125,430\n\n';
        
        csvContent += 'CHART DATA - INVENTORY TRENDS\n';
        csvContent += 'Category,Current Stock Value,Low Stock Count,Expiring Count\n';
        categoryData.forEach((item: any) => {
          csvContent += `${item.name},${item.value * 100},${Math.floor(item.value / 50)},${Math.floor(item.value / 80)}\n`;
        });
        csvContent += '\n';
        
        csvContent += 'INVENTORY DETAILS\n';
        csvContent += 'Product Name,SKU,Current Stock,Reorder Level,Unit Cost,Total Value,Status\n';
        detailedData = [
          ['Paracetamol 500mg', 'PAR-500', '45', '100', '$2.50', '$112.50', 'Low Stock'],
          ['Ibuprofen 400mg', 'IBU-400', '156', '80', '$3.20', '$499.20', 'In Stock'],
          ['Amoxicillin 250mg', 'AMX-250', '8', '50', '$4.80', '$38.40', 'Critical'],
          ['Vitamin D3 1000IU', 'VTD-1000', '234', '75', '$1.80', '$421.20', 'In Stock'],
          ['Omeprazole 20mg', 'OMP-20', '12', '60', '$5.60', '$67.20', 'Low Stock'],
          ['Metformin 500mg', 'MET-500', '89', '100', '$2.10', '$186.90', 'Low Stock'],
          ['Losartan 50mg', 'LOS-50', '156', '75', '$3.80', '$592.80', 'In Stock'],
          ['Atorvastatin 20mg', 'ATO-20', '67', '50', '$4.20', '$281.40', 'In Stock']
        ];
        break;
        
      case 'customers':
        fileName = 'customer_analytics_report';
        csvContent += 'Metric,Value\n';
        csvContent += 'Total Customers,156\n';
        csvContent += 'Active This Month,89\n';
        csvContent += 'New Customers,12\n';
        csvContent += 'Average Customer Lifetime Value,$2,340\n\n';
        
        csvContent += 'CHART DATA - CUSTOMER TRENDS\n';
        csvContent += 'Month,New Customers,Active Customers,Revenue per Customer\n';
        salesData.forEach((item: any) => {
          csvContent += `${item.name},${Math.floor(item.sales / 500)},${Math.floor(item.revenue / 200)},${(item.revenue / Math.max(item.sales / 500, 1)).toFixed(2)}\n`;
        });
        csvContent += '\n';
        
        csvContent += 'CUSTOMER DETAILS\n';
        csvContent += 'Customer Name,Total Orders,Total Spent,Last Order Date,Customer Type,Outstanding Balance\n';
        detailedData = [
          ['Cairo Medical Center', '24', '$12,450', '2025-06-05', 'Premium', '$450'],
          ['Alexandria Pharmacy', '18', '$8,760', '2025-06-03', 'Regular', '$0'],
          ['Giza Health Clinic', '31', '$15,230', '2025-06-07', 'Premium', '$1,230'],
          ['Mansoura Medical', '12', '$5,680', '2025-05-28', 'Regular', '$680'],
          ['Aswan General Hospital', '19', '$9,840', '2025-06-02', 'Regular', '$0'],
          ['Luxor Pharmacy Chain', '28', '$13,560', '2025-06-06', 'Premium', '$560'],
          ['Minya Medical Supplies', '15', '$7,450', '2025-06-01', 'Regular', '$0'],
          ['Sohag Healthcare', '22', '$11,280', '2025-06-04', 'Premium', '$280']
        ];
        break;
        
      case 'production':
        fileName = 'production_analytics_report';
        csvContent += 'Metric,Value\n';
        csvContent += 'Total Batches,45\n';
        csvContent += 'Completed Orders,38\n';
        csvContent += 'In Production,7\n';
        csvContent += 'Production Efficiency,94.2%\n\n';
        
        csvContent += 'PRODUCTION DETAILS\n';
        csvContent += 'Batch Number,Product,Quantity,Status,Start Date,Completion Date,Total Cost,Revenue\n';
        detailedData = [
          ['BATCH-IBU-001', 'Ibuprofen Tablets 400mg', '10,000', 'Completed', '2025-01-15', '2025-02-14', '$45,000', '$54,150'],
          ['BATCH-PCM-002', 'Paracetamol Tablets 500mg', '15,000', 'Completed', '2025-01-20', '2025-02-18', '$32,000', '$41,600'],
          ['BATCH-AMX-003', 'Amoxicillin Capsules 250mg', '8,000', 'In Progress', '2025-06-01', '2025-06-15', '$38,400', '$0'],
          ['BATCH-ASP-004', 'Aspirin Tablets 100mg', '12,000', 'Quality Check', '2025-05-25', '2025-06-10', '$28,800', '$0'],
          ['BATCH-VIT-005', 'Vitamin D3 Tablets', '20,000', 'Packaging', '2025-05-28', '2025-06-12', '$36,000', '$0'],
          ['BATCH-OMP-006', 'Omeprazole Capsules 20mg', '6,000', 'Completed', '2025-04-10', '2025-05-08', '$67,200', '$80,640'],
          ['BATCH-MET-007', 'Metformin Tablets 500mg', '18,000', 'Completed', '2025-04-15', '2025-05-12', '$37,800', '$45,360']
        ];
        break;
        
      default:
        fileName = 'general_report';
        csvContent += 'No data available for this report type\n';
    }
    
    // Add detailed data
    detailedData.forEach(row => {
      csvContent += row.join(',') + '\n';
    });
    
    // Add timestamp footer
    csvContent += `\nReport generated by PharmaCorp ERP System on ${format(new Date(), 'PPpp')}\n`;
    csvContent += 'This report contains confidential business information\n';
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const title = `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Analytics Report`;
    const dateText = dateRange ? 
      `${format(dateRange.from, 'PP')} to ${format(dateRange.to, 'PP')}` : 
      'All Time';

    let printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              border-bottom: 3px solid #1D3E78; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .company-name { 
              font-size: 24px; 
              font-weight: bold; 
              color: #1D3E78; 
              margin-bottom: 10px; 
            }
            .report-title { 
              font-size: 20px; 
              font-weight: bold; 
              margin-bottom: 10px; 
            }
            .metadata { 
              font-size: 12px; 
              color: #666; 
              margin-bottom: 20px; 
            }
            .section { 
              margin-bottom: 30px; 
            }
            .section-title { 
              font-size: 16px; 
              font-weight: bold; 
              color: #1D3E78; 
              border-bottom: 1px solid #ddd; 
              padding-bottom: 5px; 
              margin-bottom: 15px; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px; 
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left; 
            }
            th { 
              background-color: #1D3E78; 
              color: white; 
              font-weight: bold; 
            }
            tr:nth-child(even) { 
              background-color: #f9f9f9; 
            }
            .summary-grid { 
              display: grid; 
              grid-template-columns: repeat(2, 1fr); 
              gap: 20px; 
              margin-bottom: 30px; 
            }
            .summary-card { 
              border: 1px solid #ddd; 
              padding: 15px; 
              border-radius: 5px; 
              background: #f8f9fa; 
            }
            .summary-value { 
              font-size: 24px; 
              font-weight: bold; 
              color: #1D3E78; 
            }
            .summary-label { 
              font-size: 14px; 
              color: #666; 
              margin-bottom: 5px; 
            }
            .footer { 
              margin-top: 40px; 
              padding-top: 20px; 
              border-top: 1px solid #ddd; 
              font-size: 10px; 
              color: #666; 
              text-align: center; 
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">PharmaCorp ERP System</div>
            <div class="report-title">${title}</div>
            <div class="metadata">
              Report Period: ${dateText}<br>
              Generated: ${format(new Date(), 'PPpp')}<br>
              Filter: ${selectedFilter === 'all' ? 'All Categories' : selectedFilter}
            </div>
          </div>
    `;

    // Add summary section based on active tab
    let summaryData: { label: string; value: string }[] = [];
    let tableData: { headers: string[]; rows: string[][] } = { headers: [], rows: [] };

    switch (activeTab) {
      case 'sales':
        summaryData = [
          { label: 'Total Sales Revenue', value: `$${salesReportData?.summary?.totalSales?.toLocaleString() || '11,152'}` },
          { label: 'Total Transactions', value: `${salesReportData?.summary?.transactionCount || '47'}` },
          { label: 'Average Order Value', value: `$${salesReportData?.summary?.averageOrderValue?.toFixed(2) || '237.06'}` },
          { label: 'Growth Rate', value: `+${salesReportData?.summary?.growthRate || '18.5'}%` }
        ];
        tableData = {
          headers: ['Product', 'Category', 'Units Sold', 'Revenue', '% of Total'],
          rows: [
            ['Panadol Advance 500mg', 'Painkillers', '342', '$3,420', '14.8%'],
            ['Amoxicillin 500mg', 'Antibiotics', '287', '$2,870', '12.4%'],
            ['Vitamin C 1000mg', 'Supplements', '256', '$2,560', '11.1%'],
            ['Cataflam 50mg', 'Anti-inflammatory', '198', '$2,376', '10.3%'],
            ['Aspirin 100mg', 'Cardiovascular', '156', '$1,560', '6.8%']
          ]
        };
        break;
      case 'financial':
        summaryData = [
          { label: 'Total Revenue', value: '$32,580' },
          { label: 'Outstanding Receivables', value: '$8,790' },
          { label: 'Tax Collected', value: '$4,890' },
          { label: 'Net Profit Margin', value: '24.5%' }
        ];
        tableData = {
          headers: ['Account', 'Debit', 'Credit', 'Balance', 'Status'],
          rows: [
            ['Cash & Bank', '$45,000', '$12,000', '$33,000', 'Active'],
            ['Accounts Receivable', '$8,790', '$0', '$8,790', 'Outstanding'],
            ['Inventory Assets', '$28,500', '$3,200', '$25,300', 'Active'],
            ['Equipment', '$75,000', '$15,000', '$60,000', 'Depreciated'],
            ['Tax Payable', '$0', '$4,890', '-$4,890', 'Liability']
          ]
        };
        break;
      case 'inventory':
        summaryData = [
          { label: 'Total Products', value: '234' },
          { label: 'Low Stock Items', value: '12' },
          { label: 'Expiring Soon', value: '8' },
          { label: 'Inventory Value', value: '$125,430' }
        ];
        tableData = {
          headers: ['Product Name', 'SKU', 'Current Stock', 'Reorder Level', 'Status'],
          rows: [
            ['Paracetamol 500mg', 'PAR-500', '45', '100', 'Low Stock'],
            ['Ibuprofen 400mg', 'IBU-400', '156', '80', 'In Stock'],
            ['Amoxicillin 250mg', 'AMX-250', '8', '50', 'Critical'],
            ['Vitamin D3 1000IU', 'VTD-1000', '234', '75', 'In Stock'],
            ['Omeprazole 20mg', 'OMP-20', '12', '60', 'Low Stock']
          ]
        };
        break;
      case 'customers':
        summaryData = [
          { label: 'Total Customers', value: '156' },
          { label: 'Active This Month', value: '89' },
          { label: 'New Customers', value: '12' },
          { label: 'Customer Lifetime Value', value: '$2,340' }
        ];
        tableData = {
          headers: ['Customer Name', 'Total Orders', 'Total Spent', 'Last Order', 'Status'],
          rows: [
            ['Cairo Medical Center', '24', '$12,450', '2025-06-05', 'Premium'],
            ['Alexandria Pharmacy', '18', '$8,760', '2025-06-03', 'Regular'],
            ['Giza Health Clinic', '31', '$15,230', '2025-06-07', 'Premium'],
            ['Mansoura Medical', '12', '$5,680', '2025-05-28', 'Regular'],
            ['Aswan General Hospital', '19', '$9,840', '2025-06-02', 'Regular']
          ]
        };
        break;
      case 'production':
        summaryData = [
          { label: 'Total Batches', value: '45' },
          { label: 'Completed Orders', value: '38' },
          { label: 'In Production', value: '7' },
          { label: 'Production Efficiency', value: '94.2%' }
        ];
        tableData = {
          headers: ['Batch Number', 'Product', 'Quantity', 'Status', 'Completion Date'],
          rows: [
            ['BATCH-IBU-001', 'Ibuprofen Tablets 400mg', '10,000', 'Completed', '2025-02-14'],
            ['BATCH-PCM-002', 'Paracetamol Tablets 500mg', '15,000', 'Completed', '2025-02-18'],
            ['BATCH-AMX-003', 'Amoxicillin Capsules 250mg', '8,000', 'In Progress', '2025-06-15'],
            ['BATCH-ASP-004', 'Aspirin Tablets 100mg', '12,000', 'Quality Check', '2025-06-10'],
            ['BATCH-VIT-005', 'Vitamin D3 Tablets', '20,000', 'Packaging', '2025-06-12']
          ]
        };
        break;
    }

    // Add summary section
    printContent += `
      <div class="section">
        <div class="section-title">Executive Summary</div>
        <div class="summary-grid">
    `;

    summaryData.forEach(item => {
      printContent += `
        <div class="summary-card">
          <div class="summary-label">${item.label}</div>
          <div class="summary-value">${item.value}</div>
        </div>
      `;
    });

    printContent += `
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Detailed Analysis</div>
        <table>
          <thead>
            <tr>
    `;

    tableData.headers.forEach(header => {
      printContent += `<th>${header}</th>`;
    });

    printContent += `
            </tr>
          </thead>
          <tbody>
    `;

    tableData.rows.forEach(row => {
      printContent += '<tr>';
      row.forEach(cell => {
        printContent += `<td>${cell}</td>`;
      });
      printContent += '</tr>';
    });

    printContent += `
          </tbody>
        </table>
      </div>
      
      <div class="footer">
        <p>PharmaCorp ERP System - Confidential Business Report</p>
        <p>This document contains proprietary information and is intended for internal use only.</p>
      </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-primary">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into your business performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={exportToPDF} 
            variant="outline" 
            className="flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            <FileText className="h-4 w-4 text-blue-600" />
            <span>Export PDF</span>
          </Button>
          <Button 
            onClick={exportToCSV} 
            variant="outline" 
            className="flex items-center space-x-2 hover:bg-green-50 hover:border-green-300 transition-colors"
          >
            <Download className="h-4 w-4 text-green-600" />
            <span>Export CSV</span>
          </Button>
          <Button 
            onClick={printReport} 
            variant="outline" 
            className="flex items-center space-x-2 hover:bg-purple-50 hover:border-purple-300 transition-colors"
          >
            <Printer className="h-4 w-4 text-purple-600" />
            <span>Print Report</span>
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
        <div className="overflow-x-auto">
          <TabsList className="grid grid-cols-6 w-full min-w-[800px]">
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
        </div>
        
        {/* Sales Reports Tab */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Sales</CardTitle>
                <CardDescription>Current Period</CardDescription>
              </CardHeader>
              <CardContent>
                {salesLoading ? (
                  <div className="text-2xl font-bold animate-pulse">Loading...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      ${salesReportData?.summary?.totalSales?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="text-green-500">
                        ↑ {salesReportData?.summary?.growthRate || 0}%
                      </span> vs previous period
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Transactions</CardTitle>
                <CardDescription>Total Orders</CardDescription>
              </CardHeader>
              <CardContent>
                {salesLoading ? (
                  <div className="text-2xl font-bold animate-pulse">Loading...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {salesReportData?.summary?.transactionCount || '0'}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="text-green-500">↑ 8%</span> vs previous period
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Average Order</CardTitle>
                <CardDescription>Value per Transaction</CardDescription>
              </CardHeader>
              <CardContent>
                {salesLoading ? (
                  <div className="text-2xl font-bold animate-pulse">Loading...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      ${(salesReportData?.summary?.averageOrderValue || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="text-green-500">↑ 4%</span> vs previous period
                    </div>
                  </>
                )}
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
                      data={salesReportData?.chartData || []}
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
                        activeDot={{ r: 8 }} 
                        name="Sales Amount"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="transactions" 
                        stroke="#82ca9d" 
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