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
import { Download, FileText, RefreshCw, CheckCircle2, AlertCircle, FileDown, Image, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BalanceSheetAccountData {
  id: number;
  code: string;
  name: string;
  openingBalance: number;
  debits: number;
  credits: number;
  closingBalance: number;
}

interface BalanceSheetData {
  date: string;
  assets: {
    total: number;
    byCategory: {
      name: string;
      total: number;
      accounts: BalanceSheetAccountData[];
    }[];
  };
  liabilities: {
    total: number;
    byCategory: {
      name: string;
      total: number;
      accounts: BalanceSheetAccountData[];
    }[];
  };
  equity: {
    total: number;
    byCategory: {
      name: string;
      total: number;
      accounts: BalanceSheetAccountData[];
    }[];
  };
  isBalanced: boolean;
}

const BalanceSheet: React.FC = () => {
  const { toast } = useToast();
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "assets" | "liabilities" | "equity">("all");

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
    enabled: false, // Start disabled, generate on button click
  });

  // Generate report function
  const generateReport = () => {
    refetch();
    toast({
      title: "Generating Balance Sheet",
      description: `Generating report as of ${format(new Date(reportDate), 'MMMM dd, yyyy')}`,
    });
  };

  // Generate PDF
  const generatePDF = async () => {
    const reportElement = document.getElementById('balance-sheet-report');
    if (!reportElement) return;

    setIsPrinting(true);
    try {
      // Store original styles
      const originalHeight = reportElement.style.height;
      const originalMaxHeight = reportElement.style.maxHeight;
      const originalOverflow = reportElement.style.overflow;
      
      // Temporarily expand to capture full content
      reportElement.style.height = 'auto';
      reportElement.style.maxHeight = 'none';
      reportElement.style.overflow = 'visible';
      
      // Wait for layout to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        height: reportElement.scrollHeight,
        windowHeight: reportElement.scrollHeight,
        allowTaint: true
      });
      
      // Restore original styles
      reportElement.style.height = originalHeight;
      reportElement.style.maxHeight = originalMaxHeight;
      reportElement.style.overflow = originalOverflow;
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Handle multiple pages if content is long
      if (imgHeight > 297) { // A4 height is 297mm
        const pageHeight = 297;
        const totalPages = Math.ceil(imgHeight / pageHeight);
        
        for (let i = 0; i < totalPages; i++) {
          if (i > 0) pdf.addPage();
          
          const yPosition = -(pageHeight * i);
          pdf.addImage(imgData, 'PNG', 0, yPosition, imgWidth, imgHeight);
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      }
      
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

  // Export handlers
  const handleExportPNG = async () => {
    const reportElement = document.getElementById('balance-sheet-report');
    if (!reportElement || !data) return;

    setIsPrinting(true);
    try {
      // Store original styles
      const originalHeight = reportElement.style.height;
      const originalMaxHeight = reportElement.style.maxHeight;
      const originalOverflow = reportElement.style.overflow;
      
      // Temporarily expand to capture full content
      reportElement.style.height = 'auto';
      reportElement.style.maxHeight = 'none';
      reportElement.style.overflow = 'visible';
      
      // Wait for layout to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        height: reportElement.scrollHeight,
        windowHeight: reportElement.scrollHeight,
        allowTaint: true,
        logging: false
      });
      
      // Restore original styles
      reportElement.style.height = originalHeight;
      reportElement.style.maxHeight = originalMaxHeight;
      reportElement.style.overflow = originalOverflow;
      
      const link = document.createElement('a');
      link.download = `Balance_Sheet_${format(new Date(reportDate), 'yyyy-MM-dd')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({
        title: "PNG Generated",
        description: "Your Balance Sheet image has been downloaded",
      });
    } catch (error) {
      console.error("Error generating PNG:", error);
      toast({
        title: "PNG Generation Failed",
        description: "There was an error generating the image",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExportExcel = () => {
    if (!data) return;
    
    const csvData = [];
    csvData.push(['PharmaOverseas Balance Sheet']);
    csvData.push([`As of ${format(new Date(data.date), 'MMMM dd, yyyy')}`]);
    csvData.push([]);
    
    // Assets
    csvData.push(['ASSETS']);
    csvData.push(['Account Code', 'Account Name', 'Opening Balance', 'Debits', 'Credits', 'Closing Balance']);
    
    data.assets.byCategory.forEach(category => {
      csvData.push([category.name, '', '', '', '', formatCurrency(category.total)]);
      category.accounts.forEach(account => {
        csvData.push([
          account.code,
          account.name,
          account.openingBalance,
          account.debits,
          account.credits,
          account.closingBalance
        ]);
      });
    });
    csvData.push(['Total Assets', '', '', '', '', data.assets.total]);
    csvData.push([]);
    
    // Liabilities
    csvData.push(['LIABILITIES']);
    csvData.push(['Account Code', 'Account Name', 'Opening Balance', 'Debits', 'Credits', 'Closing Balance']);
    
    data.liabilities.byCategory.forEach(category => {
      csvData.push([category.name, '', '', '', '', formatCurrency(category.total)]);
      category.accounts.forEach(account => {
        csvData.push([
          account.code,
          account.name,
          account.openingBalance,
          account.debits,
          account.credits,
          account.closingBalance
        ]);
      });
    });
    csvData.push(['Total Liabilities', '', '', '', '', data.liabilities.total]);
    csvData.push([]);
    
    // Equity
    csvData.push(['EQUITY']);
    csvData.push(['Account Code', 'Account Name', 'Opening Balance', 'Debits', 'Credits', 'Closing Balance']);
    
    data.equity.byCategory.forEach(category => {
      csvData.push([category.name, '', '', '', '', formatCurrency(category.total)]);
      category.accounts.forEach(account => {
        csvData.push([
          account.code,
          account.name,
          account.openingBalance,
          account.debits,
          account.credits,
          account.closingBalance
        ]);
      });
    });
    csvData.push(['Total Equity', '', '', '', '', data.equity.total]);
    csvData.push([]);
    csvData.push(['Total Liabilities & Equity', '', '', '', '', data.liabilities.total + data.equity.total]);
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Balance_Sheet_${format(new Date(reportDate), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Excel Export Complete",
      description: "Your Balance Sheet data has been exported to CSV format",
    });
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
      <div>
        <h3 className="text-lg font-medium">Balance Sheet</h3>
      </div>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-md">Report Controls</CardTitle>
          <CardDescription>Select the parameters for the balance sheet</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="grid w-full max-w-xs items-center gap-1.5">
              <label htmlFor="reportDate" className="text-sm font-medium">As of Date</label>
              <Input
                id="reportDate"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>
            <div className="grid w-full max-w-xs items-center gap-1.5">
              <label htmlFor="category-filter" className="text-sm font-medium">Category Filter</label>
              <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
                <SelectTrigger id="category-filter">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="assets">Assets Only</SelectItem>
                  <SelectItem value="liabilities">Liabilities Only</SelectItem>
                  <SelectItem value="equity">Equity Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generateReport} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Generating...' : 'Generate Report'}
            </Button>
            
            {data && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={isPrinting}>
                    <Download className="h-4 w-4 mr-2" />
                    {isPrinting ? 'Exporting...' : 'Export'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={generatePDF} disabled={isPrinting}>
                    <FileText className="h-4 w-4 mr-2 text-red-600" />
                    <div className="flex flex-col">
                      <span className="font-medium">Export as PDF</span>
                      <span className="text-xs text-gray-500">Printable document</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPNG} disabled={isPrinting}>
                    <Image className="h-4 w-4 mr-2 text-blue-600" />
                    <div className="flex flex-col">
                      <span className="font-medium">Export as PNG</span>
                      <span className="text-xs text-gray-500">High-quality image</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel} disabled={isPrinting}>
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                    <div className="flex flex-col">
                      <span className="font-medium">Export as Excel</span>
                      <span className="text-xs text-gray-500">CSV spreadsheet format</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
          <CardHeader className="bg-navy-700 text-white text-center py-2">
            <CardTitle className="text-lg">PharmaOverseas</CardTitle>
            <CardDescription className="text-white text-sm font-medium">
              Balance Sheet
            </CardDescription>
            <CardDescription className="text-white text-xs">
              As of {format(new Date(data.date), 'MMMM dd, yyyy')}
            </CardDescription>
            <div className="flex justify-center mt-1">
              {data.isBalanced ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Balanced
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Balanced
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-3">
            {/* Assets Section */}
            {(categoryFilter === "all" || categoryFilter === "assets") && (
              <>
                <div>
                  <h4 className="text-sm font-semibold text-navy-700 mb-1">Assets</h4>
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow className="text-xs">
                        <TableHead className="w-1/5 p-1 text-xs">Code</TableHead>
                        <TableHead className="w-1/4 p-1 text-xs">Account Name</TableHead>
                        <TableHead className="text-right p-1 text-xs">Opening</TableHead>
                        <TableHead className="text-right p-1 text-xs">Debits</TableHead>
                        <TableHead className="text-right p-1 text-xs">Credits</TableHead>
                        <TableHead className="text-right p-1 text-xs">Closing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.assets.byCategory.map((category) => (
                        <React.Fragment key={category.name}>
                          {/* Category header */}
                          <TableRow className="bg-gray-100">
                            <TableCell colSpan={3} className="font-medium text-xs p-1">
                              {category.name}
                            </TableCell>
                            <TableCell colSpan={3} className="text-right font-medium text-xs p-1">
                              {formatCurrency(category.total)}
                            </TableCell>
                          </TableRow>
                          
                          {/* Category accounts */}
                          {category.accounts.map((account) => (
                            <TableRow key={account.id}>
                              <TableCell className="font-mono text-xs p-1">{account.code}</TableCell>
                              <TableCell className="text-xs p-1">{account.name}</TableCell>
                              <TableCell className="text-right text-xs p-1">{formatCurrency(account.openingBalance)}</TableCell>
                              <TableCell className="text-right text-xs p-1">{formatCurrency(account.debits)}</TableCell>
                              <TableCell className="text-right text-xs p-1">{formatCurrency(account.credits)}</TableCell>
                              <TableCell className="text-right font-medium text-xs p-1">{formatCurrency(account.closingBalance)}</TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))}
                      
                      {/* Total row */}
                      <TableRow className="bg-blue-50 font-bold">
                        <TableCell colSpan={5} className="text-right text-xs p-1">Total Assets</TableCell>
                        <TableCell className="text-right text-xs p-1">{formatCurrency(data.assets.total)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
            
            {/* Liabilities Section */}
            {(categoryFilter === "all" || categoryFilter === "liabilities") && (
              <>
                <div>
                  <h4 className="text-sm font-semibold text-navy-700 mb-1">Liabilities</h4>
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow className="text-xs">
                        <TableHead className="w-1/5 p-1 text-xs">Code</TableHead>
                        <TableHead className="w-1/4 p-1 text-xs">Account Name</TableHead>
                        <TableHead className="text-right p-1 text-xs">Opening</TableHead>
                        <TableHead className="text-right p-1 text-xs">Debits</TableHead>
                        <TableHead className="text-right p-1 text-xs">Credits</TableHead>
                        <TableHead className="text-right p-1 text-xs">Closing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.liabilities.byCategory.map((category) => (
                        <React.Fragment key={category.name}>
                          {/* Category header */}
                          <TableRow className="bg-gray-100">
                            <TableCell colSpan={3} className="font-medium text-xs p-1">
                              {category.name}
                            </TableCell>
                            <TableCell colSpan={3} className="text-right font-medium text-xs p-1">
                              {formatCurrency(category.total)}
                            </TableCell>
                          </TableRow>
                          
                          {/* Category accounts */}
                          {category.accounts.map((account) => (
                            <TableRow key={account.id}>
                              <TableCell className="font-mono text-xs p-1">{account.code}</TableCell>
                              <TableCell className="text-xs p-1">{account.name}</TableCell>
                              <TableCell className="text-right text-xs p-1">{formatCurrency(account.openingBalance)}</TableCell>
                              <TableCell className="text-right text-xs p-1">{formatCurrency(account.debits)}</TableCell>
                              <TableCell className="text-right text-xs p-1">{formatCurrency(account.credits)}</TableCell>
                              <TableCell className="text-right font-medium text-xs p-1">{formatCurrency(account.closingBalance)}</TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))}
                      
                      {/* Total row */}
                      <TableRow className="bg-blue-50 font-bold">
                        <TableCell colSpan={5} className="text-right text-xs p-1">Total Liabilities</TableCell>
                        <TableCell className="text-right text-xs p-1">{formatCurrency(data.liabilities.total)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
            
            {/* Equity Section */}
            {(categoryFilter === "all" || categoryFilter === "equity") && (
              <>
                <div>
                  <h4 className="text-sm font-semibold text-navy-700 mb-1">Equity</h4>
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow className="text-xs">
                        <TableHead className="w-1/5 p-1 text-xs">Code</TableHead>
                        <TableHead className="w-1/4 p-1 text-xs">Account Name</TableHead>
                        <TableHead className="text-right p-1 text-xs">Opening</TableHead>
                        <TableHead className="text-right p-1 text-xs">Debits</TableHead>
                        <TableHead className="text-right p-1 text-xs">Credits</TableHead>
                        <TableHead className="text-right p-1 text-xs">Closing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.equity.byCategory.map((category) => (
                        <React.Fragment key={category.name}>
                          {/* Category header */}
                          <TableRow className="bg-gray-100">
                            <TableCell colSpan={3} className="font-medium text-xs p-1">
                              {category.name}
                            </TableCell>
                            <TableCell colSpan={3} className="text-right font-medium text-xs p-1">
                              {formatCurrency(category.total)}
                            </TableCell>
                          </TableRow>
                          
                          {/* Category accounts */}
                          {category.accounts.map((account) => (
                            <TableRow key={account.id}>
                              <TableCell className="font-mono text-xs p-1">{account.code}</TableCell>
                              <TableCell className="text-xs p-1">{account.name}</TableCell>
                              <TableCell className="text-right text-xs p-1">{formatCurrency(account.openingBalance)}</TableCell>
                              <TableCell className="text-right text-xs p-1">{formatCurrency(account.debits)}</TableCell>
                              <TableCell className="text-right text-xs p-1">{formatCurrency(account.credits)}</TableCell>
                              <TableCell className="text-right font-medium text-xs p-1">{formatCurrency(account.closingBalance)}</TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))}
                      
                      {/* Total row */}
                      <TableRow className="bg-blue-50 font-bold">
                        <TableCell colSpan={5} className="text-right text-xs p-1">Total Equity</TableCell>
                        <TableCell className="text-right text-xs p-1">{formatCurrency(data.equity.total)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
            
            {categoryFilter === "all" && (
              <>
                {/* Total Liabilities and Equity */}
                <div className="flex justify-between items-center bg-navy-700/10 p-2 rounded">
                  <span className="font-bold text-sm">Total Liabilities & Equity</span>
                  <span className="font-bold text-sm">
                    {formatCurrency(data.liabilities.total + data.equity.total)}
                  </span>
                </div>
                
                {/* Validation check */}
                <div className="flex justify-center mt-2">
                  {data.isBalanced ? (
                    <div className="flex items-center text-green-700">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      <span className="text-xs">Balance Sheet is balanced. Assets ({formatCurrency(data.assets.total)}) = Liabilities + Equity ({formatCurrency(data.liabilities.total + data.equity.total)})</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-700">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span className="text-xs">Balance Sheet is not balanced! Assets ({formatCurrency(data.assets.total)}) ≠ Liabilities + Equity ({formatCurrency(data.liabilities.total + data.equity.total)})</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BalanceSheet;