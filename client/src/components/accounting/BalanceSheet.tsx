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
import { Download, FileText, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Badge } from '@/components/ui/badge';

interface BalanceSheetData {
  date: string;
  assets: {
    total: number;
    byAccount: {
      id: number;
      code: string;
      name: string;
      amount: number;
    }[];
  };
  liabilities: {
    total: number;
    byAccount: {
      id: number;
      code: string;
      name: string;
      amount: number;
    }[];
  };
  equity: {
    total: number;
    byAccount: {
      id: number;
      code: string;
      name: string;
      amount: number;
    }[];
  };
  isBalanced: boolean;
}

const BalanceSheet: React.FC = () => {
  const { toast } = useToast();
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPrinting, setIsPrinting] = useState(false);

  // Fetch Balance Sheet data
  const { data, isLoading, refetch } = useQuery<BalanceSheetData>({
    queryKey: ['/api/reports/balance-sheet', reportDate],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', `/api/reports/balance-sheet?date=${reportDate}`);
        return await res.json();
      } catch (error) {
        console.error("Error fetching Balance Sheet data:", error);
        throw error;
      }
    },
    enabled: true,
  });

  // Generate PDF
  const generatePDF = async () => {
    const reportElement = document.getElementById('balance-sheet-report');
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
      pdf.save(`Balance_Sheet_${format(new Date(reportDate), 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: "PDF Generated",
        description: "Your Balance Sheet report has been downloaded",
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
        <h3 className="text-lg font-medium">Balance Sheet</h3>
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
          <CardTitle className="text-md">Report Date</CardTitle>
          <CardDescription>Select the date for the balance sheet</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex space-x-4 items-end">
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="reportDate" className="text-sm font-medium">As of Date</label>
              <Input
                id="reportDate"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
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
          <h3 className="text-lg font-medium">No Balance Sheet data available</h3>
          <p className="text-muted-foreground">Select a date and generate the report</p>
        </div>
      ) : (
        <Card className="w-full" id="balance-sheet-report">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">PharmaOverseas</CardTitle>
            <CardDescription className="text-md font-medium">
              Balance Sheet
            </CardDescription>
            <CardDescription>
              As of {format(new Date(data.date), 'MMMM dd, yyyy')}
            </CardDescription>
            <div className="flex justify-center mt-2">
              {data.isBalanced ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Balanced
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  Not Balanced
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Assets Section */}
            <div className="space-y-2">
              <h4 className="text-lg font-semibold">Assets</h4>
              {data.assets.byAccount.length === 0 ? (
                <p className="text-muted-foreground italic">No asset accounts with balances</p>
              ) : (
                <div className="space-y-1">
                  {data.assets.byAccount.map((account) => (
                    <div key={account.id} className="flex justify-between text-sm">
                      <span>{account.code} - {account.name}</span>
                      <span>{formatCurrency(account.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium mt-2">
                    <span>Total Assets</span>
                    <span>{formatCurrency(data.assets.total)}</span>
                  </div>
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Liabilities Section */}
            <div className="space-y-2">
              <h4 className="text-lg font-semibold">Liabilities</h4>
              {data.liabilities.byAccount.length === 0 ? (
                <p className="text-muted-foreground italic">No liability accounts with balances</p>
              ) : (
                <div className="space-y-1">
                  {data.liabilities.byAccount.map((account) => (
                    <div key={account.id} className="flex justify-between text-sm">
                      <span>{account.code} - {account.name}</span>
                      <span>{formatCurrency(account.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium mt-2">
                    <span>Total Liabilities</span>
                    <span>{formatCurrency(data.liabilities.total)}</span>
                  </div>
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Equity Section */}
            <div className="space-y-2">
              <h4 className="text-lg font-semibold">Equity</h4>
              {data.equity.byAccount.length === 0 ? (
                <p className="text-muted-foreground italic">No equity accounts with balances</p>
              ) : (
                <div className="space-y-1">
                  {data.equity.byAccount.map((account) => (
                    <div key={account.id} className="flex justify-between text-sm">
                      <span>{account.code} - {account.name}</span>
                      <span>{formatCurrency(account.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium mt-2">
                    <span>Total Equity</span>
                    <span>{formatCurrency(data.equity.total)}</span>
                  </div>
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Total Liabilities and Equity */}
            <div className="flex justify-between items-center bg-muted/20 p-4 rounded">
              <span className="font-bold text-lg">Total Liabilities & Equity</span>
              <span className="font-bold text-lg">
                {formatCurrency(data.liabilities.total + data.equity.total)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BalanceSheet;