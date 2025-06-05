import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ArrowDown, Download, FileText, RefreshCw, FileDown, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

interface PnLCategory {
  name: string;
  current: number;
  ytd: number;
  variance: number; // percentage change
  items: {
    id: number;
    code: string;
    name: string;
    current: number;
    ytd: number;
    variance: number;
  }[];
}

interface PnLData {
  startDate: string;
  endDate: string;
  revenue: PnLCategory;
  costOfGoodsSold: PnLCategory;
  grossProfit: {
    current: number;
    ytd: number;
    variance: number;
  };
  operatingExpenses: PnLCategory;
  netProfit: {
    current: number;
    ytd: number;
    variance: number;
  };
}

const ProfitAndLoss: React.FC = () => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [isPrinting, setIsPrinting] = useState(false);
  const [periodType, setPeriodType] = useState<"monthly" | "quarterly" | "yearly">("monthly");

  // Fetch P&L data
  const { data, isLoading, refetch } = useQuery<PnLData>({
    queryKey: ['/api/reports/pnl', dateRange],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', `/api/reports/pnl?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
        return await res.json();
      } catch (error) {
        console.error("Error fetching P&L data:", error);
        throw error;
      }
    },
    enabled: false, // Start disabled, generate on button click
  });

  // Handle date range change
  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle period type change and auto-adjust dates
  const handlePeriodTypeChange = (value: "monthly" | "quarterly" | "yearly") => {
    setPeriodType(value);
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    switch (value) {
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarterly":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  // Generate report with current form values
  const handleGenerateReport = () => {
    toast({
      title: "Generating Report",
      description: "Fetching P&L data...",
    });
    refetch();
  };

  // Generate PDF
  const generatePDF = async () => {
    const reportElement = document.getElementById('pnl-report');
    if (!reportElement) return;

    setIsPrinting(true);
    try {
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 width in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Profit_and_Loss_${format(new Date(dateRange.startDate), 'yyyy-MM-dd')}_to_${format(new Date(dateRange.endDate), 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: "PDF Generated",
        description: "Your P&L report has been downloaded",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Profit & Loss Statement</h3>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => {
              if (!data) return;
              
              const csvData = [];
              
              // Header section
              csvData.push(['PharmaOverseas']);
              csvData.push(['Profit & Loss Statement']);
              csvData.push([`${format(new Date(data.startDate), 'MMMM dd, yyyy')} to ${format(new Date(data.endDate), 'MMMM dd, yyyy')}`]);
              csvData.push(['']);
              
              // Table headers
              csvData.push(['Account', 'Current Period', 'Year-to-Date', 'Variance %']);
              
              // Revenue section
              csvData.push(['REVENUE', '', '', '']);
              data.revenue.items.forEach(item => {
                csvData.push([
                  `${item.code} - ${item.name}`,
                  item.current,
                  item.ytd,
                  `${item.variance > 0 ? '+' : ''}${item.variance.toFixed(2)}%`
                ]);
              });
              csvData.push([
                'Total Revenue',
                data.revenue.current,
                data.revenue.ytd,
                `${data.revenue.variance > 0 ? '+' : ''}${data.revenue.variance.toFixed(2)}%`
              ]);
              csvData.push(['']);
              
              // Cost of Goods Sold section
              csvData.push(['COST OF GOODS SOLD', '', '', '']);
              data.costOfGoodsSold.items.forEach(item => {
                csvData.push([
                  `${item.code} - ${item.name}`,
                  item.current,
                  item.ytd,
                  `${item.variance > 0 ? '+' : ''}${item.variance.toFixed(2)}%`
                ]);
              });
              csvData.push([
                'Total Cost of Goods Sold',
                data.costOfGoodsSold.current,
                data.costOfGoodsSold.ytd,
                `${data.costOfGoodsSold.variance > 0 ? '+' : ''}${data.costOfGoodsSold.variance.toFixed(2)}%`
              ]);
              csvData.push(['']);
              
              // Gross Profit
              csvData.push([
                'GROSS PROFIT',
                data.grossProfit.current,
                data.grossProfit.ytd,
                `${data.grossProfit.variance > 0 ? '+' : ''}${data.grossProfit.variance.toFixed(2)}%`
              ]);
              csvData.push(['']);
              
              // Operating Expenses section
              csvData.push(['OPERATING EXPENSES', '', '', '']);
              data.operatingExpenses.items.forEach(item => {
                csvData.push([
                  `${item.code} - ${item.name}`,
                  item.current,
                  item.ytd,
                  `${item.variance > 0 ? '+' : ''}${item.variance.toFixed(2)}%`
                ]);
              });
              csvData.push([
                'Total Operating Expenses',
                data.operatingExpenses.current,
                data.operatingExpenses.ytd,
                `${data.operatingExpenses.variance > 0 ? '+' : ''}${data.operatingExpenses.variance.toFixed(2)}%`
              ]);
              csvData.push(['']);
              
              // Net Profit/Loss
              csvData.push([
                `NET ${data.netProfit.current >= 0 ? 'PROFIT' : 'LOSS'}`,
                data.netProfit.current,
                data.netProfit.ytd,
                `${data.netProfit.variance > 0 ? '+' : ''}${data.netProfit.variance.toFixed(2)}%`
              ]);
              
              // Create properly formatted CSV content
              const csvContent = csvData.map(row => 
                row.map(cell => {
                  const value = cell?.toString() || '';
                  // Escape commas, quotes, and newlines for CSV
                  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    return `"${value.replace(/"/g, '""')}"`;
                  }
                  return value;
                }).join(',')
              ).join('\n');
              
              // Add UTF-8 BOM for better Excel compatibility
              const BOM = '\uFEFF';
              const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `Profit_and_Loss_${format(new Date(dateRange.startDate), 'yyyy-MM-dd')}_to_${format(new Date(dateRange.endDate), 'yyyy-MM-dd')}.csv`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
            }}
            disabled={isLoading || !data}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={generatePDF}
            disabled={isLoading || !data || isPrinting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isPrinting ? "Generating PDF..." : "Export PDF"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-md">Report Controls</CardTitle>
          <CardDescription>Configure parameters for the P&L statement</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="grid w-full max-w-xs items-center gap-1.5">
              <label htmlFor="startDate" className="text-sm font-medium">Start Date</label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              />
            </div>
            <div className="grid w-full max-w-xs items-center gap-1.5">
              <label htmlFor="endDate" className="text-sm font-medium">End Date</label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              />
            </div>
            <div className="grid w-full max-w-xs items-center gap-1.5">
              <label htmlFor="periodType" className="text-sm font-medium">Period Type</label>
              <Select value={periodType} onValueChange={handlePeriodTypeChange}>
                <SelectTrigger id="periodType">
                  <SelectValue placeholder="Select period type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerateReport} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : !data ? (
        <div className="bg-muted/30 p-8 rounded-lg border border-dashed flex flex-col items-center justify-center text-center">
          <div className="h-10 w-10 text-muted-foreground mb-2">
            <FileText className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-medium">No P&L data available</h3>
          <p className="text-muted-foreground">Select a date range and generate the report</p>
        </div>
      ) : (
        <Card className="w-full" id="pnl-report">
          <CardHeader className="bg-navy-700 text-white text-center py-4">
            <CardTitle className="text-xl">PharmaOverseas</CardTitle>
            <CardDescription className="text-white text-md font-medium">
              Profit & Loss Statement
            </CardDescription>
            <CardDescription className="text-white">
              {format(new Date(data.startDate), 'MMMM dd, yyyy')} to {format(new Date(data.endDate), 'MMMM dd, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-2/5">Account</TableHead>
                  <TableHead className="text-right">Current Period</TableHead>
                  <TableHead className="text-right">Year-to-Date</TableHead>
                  <TableHead className="text-right">Variance %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Revenue Section */}
                <TableRow className="bg-gray-100 font-medium">
                  <TableCell colSpan={4}>Revenue</TableCell>
                </TableRow>
                
                {data.revenue.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-6">{item.code} - {item.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.current)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.ytd)}</TableCell>
                    <TableCell className="text-right flex justify-end items-center">
                      <span className={item.variance > 0 ? 'text-green-600' : item.variance < 0 ? 'text-red-600' : ''}>
                        {item.variance > 0 ? '+' : ''}{item.variance.toFixed(2)}%
                      </span>
                      {item.variance !== 0 && (
                        item.variance > 0 ? 
                          <TrendingUp className="h-4 w-4 ml-1 text-green-600" /> : 
                          <TrendingDown className="h-4 w-4 ml-1 text-red-600" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                
                <TableRow className="bg-blue-50 font-medium">
                  <TableCell>Total Revenue</TableCell>
                  <TableCell className="text-right">{formatCurrency(data.revenue.current)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(data.revenue.ytd)}</TableCell>
                  <TableCell className="text-right flex justify-end items-center">
                    <span className={data.revenue.variance > 0 ? 'text-green-600' : data.revenue.variance < 0 ? 'text-red-600' : ''}>
                      {data.revenue.variance > 0 ? '+' : ''}{data.revenue.variance.toFixed(2)}%
                    </span>
                    {data.revenue.variance !== 0 && (
                      data.revenue.variance > 0 ? 
                        <TrendingUp className="h-4 w-4 ml-1 text-green-600" /> : 
                        <TrendingDown className="h-4 w-4 ml-1 text-red-600" />
                    )}
                  </TableCell>
                </TableRow>
                
                {/* Cost of Goods Sold Section */}
                <TableRow className="bg-gray-100 font-medium">
                  <TableCell colSpan={4}>Cost of Goods Sold</TableCell>
                </TableRow>
                
                {data.costOfGoodsSold.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-6">{item.code} - {item.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.current)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.ytd)}</TableCell>
                    <TableCell className="text-right flex justify-end items-center">
                      <span className={item.variance < 0 ? 'text-green-600' : item.variance > 0 ? 'text-red-600' : ''}>
                        {item.variance > 0 ? '+' : ''}{item.variance.toFixed(2)}%
                      </span>
                      {item.variance !== 0 && (
                        item.variance < 0 ? 
                          <TrendingDown className="h-4 w-4 ml-1 text-green-600" /> : 
                          <TrendingUp className="h-4 w-4 ml-1 text-red-600" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                
                <TableRow className="bg-blue-50 font-medium">
                  <TableCell>Total Cost of Goods Sold</TableCell>
                  <TableCell className="text-right">{formatCurrency(data.costOfGoodsSold.current)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(data.costOfGoodsSold.ytd)}</TableCell>
                  <TableCell className="text-right flex justify-end items-center">
                    <span className={data.costOfGoodsSold.variance < 0 ? 'text-green-600' : data.costOfGoodsSold.variance > 0 ? 'text-red-600' : ''}>
                      {data.costOfGoodsSold.variance > 0 ? '+' : ''}{data.costOfGoodsSold.variance.toFixed(2)}%
                    </span>
                    {data.costOfGoodsSold.variance !== 0 && (
                      data.costOfGoodsSold.variance < 0 ? 
                        <TrendingDown className="h-4 w-4 ml-1 text-green-600" /> : 
                        <TrendingUp className="h-4 w-4 ml-1 text-red-600" />
                    )}
                  </TableCell>
                </TableRow>
                
                {/* Gross Profit Section */}
                <TableRow className="bg-gray-200 font-semibold">
                  <TableCell>Gross Profit</TableCell>
                  <TableCell className="text-right">{formatCurrency(data.grossProfit.current)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(data.grossProfit.ytd)}</TableCell>
                  <TableCell className="text-right flex justify-end items-center">
                    <span className={data.grossProfit.variance > 0 ? 'text-green-600' : data.grossProfit.variance < 0 ? 'text-red-600' : ''}>
                      {data.grossProfit.variance > 0 ? '+' : ''}{data.grossProfit.variance.toFixed(2)}%
                    </span>
                    {data.grossProfit.variance !== 0 && (
                      data.grossProfit.variance > 0 ? 
                        <TrendingUp className="h-4 w-4 ml-1 text-green-600" /> : 
                        <TrendingDown className="h-4 w-4 ml-1 text-red-600" />
                    )}
                  </TableCell>
                </TableRow>
                
                {/* Operating Expenses Section */}
                <TableRow className="bg-gray-100 font-medium">
                  <TableCell colSpan={4}>Operating Expenses</TableCell>
                </TableRow>
                
                {data.operatingExpenses.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-6">{item.code} - {item.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.current)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.ytd)}</TableCell>
                    <TableCell className="text-right flex justify-end items-center">
                      <span className={item.variance < 0 ? 'text-green-600' : item.variance > 0 ? 'text-red-600' : ''}>
                        {item.variance > 0 ? '+' : ''}{item.variance.toFixed(2)}%
                      </span>
                      {item.variance !== 0 && (
                        item.variance < 0 ? 
                          <TrendingDown className="h-4 w-4 ml-1 text-green-600" /> : 
                          <TrendingUp className="h-4 w-4 ml-1 text-red-600" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                
                <TableRow className="bg-blue-50 font-medium">
                  <TableCell>Total Operating Expenses</TableCell>
                  <TableCell className="text-right">{formatCurrency(data.operatingExpenses.current)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(data.operatingExpenses.ytd)}</TableCell>
                  <TableCell className="text-right flex justify-end items-center">
                    <span className={data.operatingExpenses.variance < 0 ? 'text-green-600' : data.operatingExpenses.variance > 0 ? 'text-red-600' : ''}>
                      {data.operatingExpenses.variance > 0 ? '+' : ''}{data.operatingExpenses.variance.toFixed(2)}%
                    </span>
                    {data.operatingExpenses.variance !== 0 && (
                      data.operatingExpenses.variance < 0 ? 
                        <TrendingDown className="h-4 w-4 ml-1 text-green-600" /> : 
                        <TrendingUp className="h-4 w-4 ml-1 text-red-600" />
                    )}
                  </TableCell>
                </TableRow>
                
                {/* Net Profit/Loss */}
                <TableRow className="bg-navy-700/10 font-bold text-lg">
                  <TableCell>Net {data.netProfit.current >= 0 ? 'Profit' : 'Loss'}</TableCell>
                  <TableCell className={`text-right ${data.netProfit.current >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(data.netProfit.current)}
                  </TableCell>
                  <TableCell className={`text-right ${data.netProfit.ytd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(data.netProfit.ytd)}
                  </TableCell>
                  <TableCell className="text-right flex justify-end items-center">
                    <span className={data.netProfit.variance > 0 ? 'text-green-600' : data.netProfit.variance < 0 ? 'text-red-600' : ''}>
                      {data.netProfit.variance > 0 ? '+' : ''}{data.netProfit.variance.toFixed(2)}%
                    </span>
                    {data.netProfit.variance !== 0 && (
                      data.netProfit.variance > 0 ? 
                        <TrendingUp className="h-4 w-4 ml-1 text-green-600" /> : 
                        <TrendingDown className="h-4 w-4 ml-1 text-red-600" />
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfitAndLoss;