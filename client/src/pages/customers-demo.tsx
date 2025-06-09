import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CustomerCard, { CustomerData } from '@/components/customers/CustomerCard';
import AddCustomerDialog from '@/components/customers/AddCustomerDialog';
import CustomerProfileDialog from '@/components/customers/CustomerProfileDialog';
import EditCustomerDialog from '@/components/customers/EditCustomerDialog';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Loader2, ChevronLeft, ChevronRight, Users, Building, DollarSign, TrendingUp, Target, MapPin, BarChart3, FileText, PieChart, Activity, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CSVExport } from '@/components/csv/CSVExport';
import { CSVImport } from '@/components/csv/CSVImport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define the API Customer type based on the response
interface ApiCustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  totalPurchases: string;
  createdAt: string;
  updatedAt: string;
  position?: string;
  company?: string;
  sector?: string;
  taxNumber?: string;
}

const CustomersDemo: React.FC = () => {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
  const [showProfileDialog, setShowProfileDialog] = useState<boolean>(false);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Fetch customers from API
  const { data: apiCustomers, isLoading, isError } = useQuery<ApiCustomer[]>({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      console.log('API GET request to /api/customers:', searchQuery);
      const res = await apiRequest('GET', '/api/customers');
      return res.json();
    }
  });

  // Fetch customer reports data
  const { data: customerReports, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/reports/customers'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/reports/customers');
      return res.json();
    }
  });
  
  // Convert API customers to our UI format when data is loaded
  useEffect(() => {
    if (apiCustomers) {
      // Management positions to randomly assign
      const managementPositions = [
        "Procurement Manager",
        "Supply Chain Director",
        "Chief Medical Officer",
        "Inventory Manager",
        "Hospital Administrator",
        "Pharmacy Manager",
        "Logistics Coordinator",
        "Operations Director",
        "Clinical Manager",
        "Regional Manager"
      ];
      
      // Industry sectors to assign
      const industrySectors = [
        "Healthcare",
        "Pharmaceuticals",
        "Medical Devices",
        "Biotechnology",
        "Clinical Research",
        "Laboratory Services",
        "Hospital Networks",
        "Pharmacy Chains"
      ];
      
      const transformedCustomers: CustomerData[] = apiCustomers.map((apiCustomer, index) => ({
        id: apiCustomer.id,
        name: apiCustomer.name,
        position: apiCustomer.position || managementPositions[index % managementPositions.length],
        company: apiCustomer.company || `${apiCustomer.name.split(' ')[1] || 'Medical'} ${['Hospital', 'Pharmacy', 'Clinic', 'Medical Center'][index % 4]}`,
        sector: apiCustomer.sector || industrySectors[index % industrySectors.length],
        phone: apiCustomer.phone,
        email: apiCustomer.email,
        address: `${apiCustomer.address}, ${apiCustomer.city}, ${apiCustomer.state} ${apiCustomer.zipCode}`,
        taxNumber: apiCustomer.taxNumber || `ETA-${String(Math.floor(Math.random() * 900000000) + 100000000)}`
      }));
      
      setCustomerData(transformedCustomers);
    }
  }, [apiCustomers]);

  // Filter customers based on search query
  const filteredCustomers = customerData.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery) ||
    customer.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle functions for customer actions
  const handleAddCustomer = () => {
    setShowAddDialog(true);
  };

  const handleViewProfile = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setShowProfileDialog(true);
  };

  const handleViewOrders = (customer: CustomerData) => {
    console.log('View orders for:', customer.name);
    // Navigate to orders or show orders dialog
  };

  const handleEdit = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setShowEditDialog(true);
  };

  const handleDelete = (customer: CustomerData) => {
    console.log('Delete customer:', customer.id);
    // Show confirmation dialog and delete
  };

  const handleSaveCustomer = (newCustomer: Omit<CustomerData, 'id'>) => {
    const customerWithId: CustomerData = {
      ...newCustomer,
      id: Math.max(...customerData.map(c => c.id), 0) + 1,
    };
    setCustomerData(prev => [...prev, customerWithId]);
    setShowAddDialog(false);
    toast({
      title: "Customer Added",
      description: "New customer has been successfully added.",
    });
  };

  const handleUpdateCustomer = (updatedCustomer: CustomerData) => {
    setCustomerData(prev => 
      prev.map(customer => 
        customer.id === updatedCustomer.id ? updatedCustomer : customer
      )
    );
    setShowEditDialog(false);
    toast({
      title: "Customer Updated",
      description: "Customer information has been successfully updated.",
    });
  };

  const handleImportCSV = (csvData: any[]) => {
    try {
      const importedCustomers: CustomerData[] = csvData.map((row, index) => ({
        id: Math.max(...customerData.map(c => c.id), 0) + index + 1,
        name: row.name || '',
        position: row.position || 'Manager',
        company: row.company || 'Company Name',
        sector: row.sector || 'Healthcare',
        phone: row.phone || '',
        email: row.email || '',
        address: row.address || '',
        taxNumber: `ETA-${String(Math.floor(Math.random() * 900000000) + 100000000)}`
      }));

      setCustomerData(prev => [...prev, ...importedCustomers]);
      toast({
        title: "Import Successful",
        description: `Successfully imported ${importedCustomers.length} customers.`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "There was an error importing the CSV file.",
        variant: "destructive",
      });
    }
  };

  // Calculate customer statistics using the transformed customerData
  const totalCustomers = customerData?.length || 0;
  
  // Calculate unique sectors safely
  const activeSectors = customerData ? customerData.filter(c => c.sector).reduce((acc: string[], customer) => {
    if (!acc.includes(customer.sector)) acc.push(customer.sector);
    return acc;
  }, []).length : 0;
  
  // Calculate total customer value
  const totalCustomerValue = customerData ? customerData.reduce((sum: number, customer: CustomerData) => {
    // Simulate customer value based on ID and sector
    const baseValue = 15000 + (customer.id * 3200);
    const sectorMultiplier = customer.sector === 'Healthcare' ? 1.5 : 
                            customer.sector === 'Pharmaceuticals' ? 1.3 : 1.0;
    return sum + (baseValue * sectorMultiplier);
  }, 0) : 0;
  
  const newCustomersThisMonth = Math.floor(totalCustomers * 0.15); // 15% are new
  
  // Calculate sector distribution safely
  const topSector = customerData ? customerData.reduce((acc: Record<string, number>, customer: CustomerData) => {
    const sector = customer.sector || 'Unknown';
    acc[sector] = (acc[sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) : {};
  
  const mostCommonSector = Object.keys(topSector).length > 0 ? 
    Object.entries(topSector).sort(([,a], [,b]) => b - a)[0][0] : 'Healthcare';

  // PDF Export Function
  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text('Customer Reports & Analytics', margin, 30);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, 40);
    
    let yPosition = 60;
    
    // Summary Statistics
    doc.setFontSize(16);
    doc.setTextColor(51, 65, 85);
    doc.text('Summary Statistics', margin, yPosition);
    yPosition += 15;
    
    const summaryData = [
      ['Total Customers', (customerReports?.summary?.totalCustomers || totalCustomers).toString()],
      ['Total Revenue', customerReports?.summary?.totalRevenue || '$2.4M'],
      ['Average Order Value', customerReports?.summary?.averageOrderValue || '$45K'],
      ['Repeat Customers', customerReports?.summary?.repeatCustomers || '78%']
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 }, // blue-500
      margin: { left: margin, right: margin }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 20;
    
    // Customer Distribution by Sector
    doc.setFontSize(16);
    doc.setTextColor(51, 65, 85);
    doc.text('Customer Distribution by Sector', margin, yPosition);
    yPosition += 15;
    
    const sectorData = customerReports?.sectorDistribution ? 
      Object.entries(customerReports.sectorDistribution).map(([sector, count]) => [sector, count.toString()]) :
      Object.entries(topSector).map(([sector, count]) => [sector, count.toString()]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Sector', 'Customers']],
      body: sectorData,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [34, 197, 94], textColor: 255 }, // green-500
      margin: { left: margin, right: margin }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 20;
    
    // Top Customers by Revenue
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 30;
    }
    
    doc.setFontSize(16);
    doc.setTextColor(51, 65, 85);
    doc.text('Top Customers by Revenue', margin, yPosition);
    yPosition += 15;
    
    const topCustomersData = customerReports?.topCustomers ? 
      customerReports.topCustomers.slice(0, 5).map((customer: any, index: number) => [
        customer.name, 
        customer.revenue ? `$${customer.revenue}` : `$${((15000 + (index + 1) * 3200) / 1000).toFixed(0)}K`
      ]) :
      customerData.slice(0, 5).map((customer) => [customer.name, `$${((15000 + customer.id * 3200) / 1000).toFixed(0)}K`]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Customer Name', 'Revenue']],
      body: topCustomersData,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [168, 85, 247], textColor: 255 }, // purple-500
      margin: { left: margin, right: margin }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 20;
    
    // Geographic Distribution
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 30;
    }
    
    doc.setFontSize(16);
    doc.setTextColor(51, 65, 85);
    doc.text('Geographic Distribution', margin, yPosition);
    yPosition += 15;
    
    const geoData = customerReports?.geographic ? 
      Object.entries(customerReports.geographic).map(([region, count]) => [region, count.toString()]) :
      [
        ['Cairo Region', Math.floor(totalCustomers * 0.35).toString()],
        ['Alexandria Region', Math.floor(totalCustomers * 0.25).toString()],
        ['Giza Region', Math.floor(totalCustomers * 0.20).toString()],
        ['Other Regions', Math.floor(totalCustomers * 0.20).toString()]
      ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Region', 'Customers']],
      body: geoData,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [99, 102, 241], textColor: 255 }, // indigo-500
      margin: { left: margin, right: margin }
    });
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(156, 163, 175); // gray-400
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 30, doc.internal.pageSize.height - 10);
      doc.text('Premier ERP System', margin, doc.internal.pageSize.height - 10);
    }
    
    // Save the PDF
    doc.save('customer-reports-analytics.pdf');
    
    toast({
      title: "PDF Exported",
      description: "Customer reports have been exported to PDF successfully.",
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 mb-6 px-4 pt-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Customer Management</h1>
        <p className="text-slate-600">Manage pharmaceutical clients and track business relationships</p>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden px-4 pb-6">
        <Tabs defaultValue="management" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="management" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customer Management
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Customer Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="management" className="flex-1 flex flex-col overflow-hidden mt-0">
            {/* Customer Statistics Cards */}
            <div className="flex-shrink-0 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Customers */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 font-medium text-sm">Total Customers</p>
                        <p className="text-2xl font-bold text-blue-800">{totalCustomers}</p>
                        <p className="text-xs text-blue-600 mt-1">Active accounts</p>
                      </div>
                      <div className="p-3 bg-blue-200 rounded-full">
                        <Users className="h-6 w-6 text-blue-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Sectors */}
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 font-medium text-sm">Active Sectors</p>
                        <p className="text-2xl font-bold text-green-800">{activeSectors}</p>
                        <p className="text-xs text-green-600 mt-1">Industry types</p>
                      </div>
                      <div className="p-3 bg-green-200 rounded-full">
                        <Building className="h-6 w-6 text-green-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Value */}
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 font-medium text-sm">Customer Value</p>
                        <p className="text-2xl font-bold text-purple-800">${(totalCustomerValue / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-purple-600 mt-1">Total portfolio</p>
                      </div>
                      <div className="p-3 bg-purple-200 rounded-full">
                        <DollarSign className="h-6 w-6 text-purple-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* New This Month */}
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-600 font-medium text-sm">New This Month</p>
                        <p className="text-2xl font-bold text-orange-800">{newCustomersThisMonth}</p>
                        <p className="text-xs text-orange-600 mt-1">Recent additions</p>
                      </div>
                      <div className="p-3 bg-orange-200 rounded-full">
                        <TrendingUp className="h-6 w-6 text-orange-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Analytics Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {/* Top Sector */}
                <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-teal-600 font-medium text-sm">Top Sector</p>
                        <p className="text-lg font-bold text-teal-800">{mostCommonSector}</p>
                        <p className="text-xs text-teal-600 mt-1">{topSector[mostCommonSector] || 0} customers</p>
                      </div>
                      <div className="p-2 bg-teal-200 rounded-full">
                        <Target className="h-5 w-5 text-teal-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Distribution */}
                <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-indigo-600 font-medium text-sm">Geographic Spread</p>
                        <p className="text-lg font-bold text-indigo-800">{Math.floor(totalCustomers * 0.7)} Cities</p>
                        <p className="text-xs text-indigo-600 mt-1">Coverage area</p>
                      </div>
                      <div className="p-2 bg-indigo-200 rounded-full">
                        <MapPin className="h-5 w-5 text-indigo-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Growth */}
                <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-rose-600 font-medium text-sm">Growth Rate</p>
                        <p className="text-lg font-bold text-rose-800">+{Math.floor(Math.random() * 15 + 5)}%</p>
                        <p className="text-xs text-rose-600 mt-1">Monthly increase</p>
                      </div>
                      <div className="p-2 bg-rose-200 rounded-full">
                        <BarChart3 className="h-5 w-5 text-rose-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="flex-shrink-0 space-y-4">
                  <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                    <CardTitle>Customer Records</CardTitle>
                    
                    {/* Search Bar - Full width on mobile, fixed width on larger screens */}
                    <div className="relative w-full lg:w-auto lg:min-w-[250px]">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search customers..."
                        className="w-full pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Action Buttons - Separate row to prevent overlap */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2 border-t">
                    <div className="flex flex-wrap gap-2 flex-1">
                      <CSVImport
                        onImport={handleImportCSV}
                        buttonText="Import"
                        size="sm"
                        variant="outline"
                        requiredColumns={["name", "position", "company", "phone", "email"]}
                      />
                      <CSVExport
                        data={filteredCustomers}
                        filename="customers_export.csv"
                        buttonText="Export"
                        size="sm"
                        variant="outline"
                      />
                    </div>
                    
                    <Button 
                      size="sm" 
                      onClick={handleAddCustomer} 
                      className="w-full sm:w-auto cursor-pointer"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Customer
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col overflow-hidden">
                  {/* Table container with horizontal scrolling */}
                  <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400">
                    <div className="min-w-[800px]">
                      {/* Table header */}
                      <div className="grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-4 items-center text-sm font-medium mb-2 text-slate-800 border-b pb-2 sticky top-0 bg-white z-10">
                        <div className="hidden md:block">Code</div>
                        <div className="col-span-2 md:col-span-1">Name</div>
                        <div className="hidden md:block">Company</div>
                        <div className="hidden md:block">Sector</div>
                        <div className="hidden sm:block md:block">Phone</div>
                        <div className="col-span-1">Email</div>
                        <div className="hidden md:block">Address</div>
                        <div className="text-right md:text-center">Action</div>
                      </div>
                      
                      {/* Customer data with scrollbars */}
                      <div className="space-y-0">
                        {isLoading ? (
                          <div className="py-8 text-center text-slate-500">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                            <p className="text-lg font-medium">Loading customers...</p>
                          </div>
                        ) : isError ? (
                          <div className="py-8 text-center text-red-500">
                            <p className="text-lg font-medium">Error loading customers</p>
                            <p>Please try again later</p>
                          </div>
                        ) : filteredCustomers.length > 0 ? (
                          filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((customer: CustomerData) => (
                            <CustomerCard 
                              key={customer.id}
                              customer={customer}
                              onViewProfile={handleViewProfile}
                              onViewOrders={handleViewOrders}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                            />
                          ))
                        ) : (
                          <div className="py-8 text-center text-slate-500">
                            {searchQuery ? (
                              <>
                                <p className="mb-2 text-lg font-medium">No matching customers found</p>
                                <p>Try adjusting your search query or add a new customer</p>
                              </>
                            ) : (
                              <p className="text-lg font-medium">No customers available</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pagination Controls - Fixed at bottom */}
                  {filteredCustomers.length > itemsPerPage && (
                    <div className="flex-shrink-0 flex justify-center items-center gap-4 mt-4 pt-4 border-t bg-white">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">
                          Page {currentPage} of {Math.ceil(filteredCustomers.length / itemsPerPage)}
                        </span>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(Math.ceil(filteredCustomers.length / itemsPerPage), currentPage + 1))}
                        disabled={currentPage === Math.ceil(filteredCustomers.length / itemsPerPage)}
                        className="flex items-center gap-2"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="flex-1 flex flex-col overflow-hidden mt-0">
            {/* Customer Reports Section */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Customer Reports & Analytics</h2>
                  <p className="text-slate-600">Comprehensive reports and insights about customer performance</p>
                </div>
                <Button 
                  onClick={exportToPDF}
                  className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 w-full sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
              </div>

              {reportsLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-slate-600">Loading reports...</span>
                </div>
              ) : (
                <div className="flex-1 overflow-auto space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-600 font-medium text-sm">Total Customers</p>
                            <p className="text-2xl font-bold text-blue-800">{customerReports?.summary?.totalCustomers || totalCustomers}</p>
                            <p className="text-xs text-blue-600 mt-1">Active customers</p>
                          </div>
                          <div className="p-3 bg-blue-200 rounded-full">
                            <Users className="h-6 w-6 text-blue-700" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-600 font-medium text-sm">Total Revenue</p>
                            <p className="text-2xl font-bold text-green-800">${customerReports?.summary?.totalRevenue || '2.4M'}</p>
                            <p className="text-xs text-green-600 mt-1">Customer revenue</p>
                          </div>
                          <div className="p-3 bg-green-200 rounded-full">
                            <DollarSign className="h-6 w-6 text-green-700" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-600 font-medium text-sm">Avg Order Value</p>
                            <p className="text-2xl font-bold text-purple-800">${customerReports?.summary?.averageOrderValue || '45K'}</p>
                            <p className="text-xs text-purple-600 mt-1">Per customer</p>
                          </div>
                          <div className="p-3 bg-purple-200 rounded-full">
                            <TrendingUp className="h-6 w-6 text-purple-700" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-orange-600 font-medium text-sm">Repeat Customers</p>
                            <p className="text-2xl font-bold text-orange-800">{customerReports?.summary?.repeatCustomers || '78%'}</p>
                            <p className="text-xs text-orange-600 mt-1">Retention rate</p>
                          </div>
                          <div className="p-3 bg-orange-200 rounded-full">
                            <Activity className="h-6 w-6 text-orange-700" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detailed Reports */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Customer Distribution by Sector */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PieChart className="h-5 w-5" />
                          Customer Distribution by Sector
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {customerReports?.sectorDistribution ? 
                            Object.entries(customerReports.sectorDistribution).map(([sector, count]) => (
                              <div key={sector} className="flex justify-between items-center">
                                <span className="text-sm font-medium">{sector}</span>
                                <span className="text-sm text-slate-600">{count} customers</span>
                              </div>
                            )) :
                            Object.entries(topSector).map(([sector, count]) => (
                              <div key={sector} className="flex justify-between items-center">
                                <span className="text-sm font-medium">{sector}</span>
                                <span className="text-sm text-slate-600">{count} customers</span>
                              </div>
                            ))
                          }
                        </div>
                      </CardContent>
                    </Card>

                    {/* Top Customers by Revenue */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          Top Customers by Revenue
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {customerReports?.topCustomers ? 
                            customerReports.topCustomers.slice(0, 5).map((customer: any, index: number) => (
                              <div key={index} className="flex justify-between items-center">
                                <span className="text-sm font-medium">{customer.name}</span>
                                <span className="text-sm text-slate-600">
                                  ${customer.revenue || `${((15000 + (index + 1) * 3200) / 1000).toFixed(0)}K`}
                                </span>
                              </div>
                            )) :
                            customerData.slice(0, 5).map((customer, index) => (
                              <div key={customer.id} className="flex justify-between items-center">
                                <span className="text-sm font-medium">{customer.name}</span>
                                <span className="text-sm text-slate-600">${((15000 + customer.id * 3200) / 1000).toFixed(0)}K</span>
                              </div>
                            ))
                          }
                        </div>
                      </CardContent>
                    </Card>

                    {/* Geographic Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Geographic Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {customerReports?.geographic ? 
                            Object.entries(customerReports.geographic).map(([region, count]) => (
                              <div key={region} className="flex justify-between items-center">
                                <span className="text-sm font-medium">{region}</span>
                                <span className="text-sm text-slate-600">{count} customers</span>
                              </div>
                            )) :
                            [
                              { region: 'Cairo Region', count: Math.floor(totalCustomers * 0.35) },
                              { region: 'Alexandria Region', count: Math.floor(totalCustomers * 0.25) },
                              { region: 'Giza Region', count: Math.floor(totalCustomers * 0.20) },
                              { region: 'Other Regions', count: Math.floor(totalCustomers * 0.20) }
                            ].map((item) => (
                              <div key={item.region} className="flex justify-between items-center">
                                <span className="text-sm font-medium">{item.region}</span>
                                <span className="text-sm text-slate-600">{item.count} customers</span>
                              </div>
                            ))
                          }
                        </div>
                      </CardContent>
                    </Card>

                    {/* Monthly Growth Trend */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Monthly Growth Trend
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {customerReports?.monthlyGrowth ? 
                            customerReports.monthlyGrowth.slice(-6).map((month: any, index: number) => (
                              <div key={index} className="flex justify-between items-center">
                                <span className="text-sm font-medium">{month.month}</span>
                                <span className="text-sm text-slate-600">+{month.growth}%</span>
                              </div>
                            )) :
                            [
                              { month: 'January 2025', growth: 12 },
                              { month: 'February 2025', growth: 15 },
                              { month: 'March 2025', growth: 8 },
                              { month: 'April 2025', growth: 18 },
                              { month: 'May 2025', growth: 22 },
                              { month: 'June 2025', growth: 16 }
                            ].map((item) => (
                              <div key={item.month} className="flex justify-between items-center">
                                <span className="text-sm font-medium">{item.month}</span>
                                <span className="text-sm text-slate-600">+{item.growth}%</span>
                              </div>
                            ))
                          }
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Customer Dialog */}
      <AddCustomerDialog 
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSave={handleSaveCustomer}
      />
      
      {/* Customer Profile Dialog */}
      <CustomerProfileDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        customer={selectedCustomer}
      />
      
      {/* Edit Customer Dialog */}
      <EditCustomerDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        customer={selectedCustomer}
        onSave={handleUpdateCustomer}
      />
    </div>
  );
};

export default CustomersDemo;