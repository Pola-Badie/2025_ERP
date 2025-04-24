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
import { ArrowDown, Download, FileText, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PnLData {
  startDate: string;
  endDate: string;
  revenue: {
    total: number;
    byAccount: {
      id: number;
      code: string;
      name: string;
      amount: number;
    }[];
  };
  expenses: {
    total: number;
    byAccount: {
      id: number;
      code: string;
      name: string;
      amount: number;
    }[];
  };
  netProfit: number;
}

const ProfitAndLoss: React.FC = () => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [isPrinting, setIsPrinting] = useState(false);

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
    enabled: true,
  });

  // Handle date range change
  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
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
        <Button 
          variant="outline" 
          onClick={generatePDF}
          disabled={isLoading || !data || isPrinting}
        >
          <Download className="h-4 w-4 mr-2" />
          {isPrinting ? "Generating PDF..." : "Export as PDF"}
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-md">Date Range</CardTitle>
          <CardDescription>Select the period for the P&L statement</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex space-x-4 items-end">
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="startDate" className="text-sm font-medium">Start Date</label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="endDate" className="text-sm font-medium">End Date</label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              />
            </div>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Report
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
          <CardHeader className="text-center">
            <CardTitle className="text-xl">PharmaOverseas</CardTitle>
            <CardDescription className="text-md font-medium">
              Profit & Loss Statement
            </CardDescription>
            <CardDescription>
              {format(new Date(data.startDate), 'MMMM dd, yyyy')} to {format(new Date(data.endDate), 'MMMM dd, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Revenue Section */}
            <div className="space-y-2">
              <h4 className="text-lg font-semibold">Revenue</h4>
              {data.revenue.byAccount.length === 0 ? (
                <p className="text-muted-foreground italic">No revenue accounts with activity</p>
              ) : (
                <div className="space-y-1">
                  {data.revenue.byAccount.map((account) => (
                    <div key={account.id} className="flex justify-between text-sm">
                      <span>{account.code} - {account.name}</span>
                      <span>{formatCurrency(account.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium mt-2">
                    <span>Total Revenue</span>
                    <span>{formatCurrency(data.revenue.total)}</span>
                  </div>
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Expenses Section */}
            <div className="space-y-2">
              <h4 className="text-lg font-semibold">Expenses</h4>
              {data.expenses.byAccount.length === 0 ? (
                <p className="text-muted-foreground italic">No expense accounts with activity</p>
              ) : (
                <div className="space-y-1">
                  {data.expenses.byAccount.map((account) => (
                    <div key={account.id} className="flex justify-between text-sm">
                      <span>{account.code} - {account.name}</span>
                      <span>{formatCurrency(account.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium mt-2">
                    <span>Total Expenses</span>
                    <span>{formatCurrency(data.expenses.total)}</span>
                  </div>
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Net Profit/Loss */}
            <div className="flex justify-between items-center bg-muted/20 p-4 rounded">
              <span className="font-bold text-lg">Net {data.netProfit >= 0 ? 'Profit' : 'Loss'}</span>
              <div className="flex items-center">
                <span className={`font-bold text-lg ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.netProfit)}
                </span>
                {data.netProfit >= 0 ? (
                  <ArrowDown className="h-5 w-5 text-green-600 ml-1 rotate-180" />
                ) : (
                  <ArrowDown className="h-5 w-5 text-red-600 ml-1" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfitAndLoss;