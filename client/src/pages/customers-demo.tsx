import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CustomerCard, { CustomerData } from '@/components/customers/CustomerCard';
import AddCustomerDialog from '@/components/customers/AddCustomerDialog';
import CustomerProfileDialog from '@/components/customers/CustomerProfileDialog';
import EditCustomerDialog from '@/components/customers/EditCustomerDialog';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Loader2, ChevronLeft, ChevronRight, Users, Building, DollarSign, TrendingUp, Target, MapPin, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CSVExport } from '@/components/csv/CSVExport';
import { CSVImport } from '@/components/csv/CSVImport';

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
  // States
  const [searchQuery, setSearchQuery] = useState<string>('');
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
        "Food & Beverage",
        "Chemical Manufacturing",
        "Research & Development",
        "Hospital & Clinics",
        "Retail Pharmacy",
        "Wholesale Distribution"
      ];
      
      const formattedCustomers: CustomerData[] = apiCustomers.map(customer => ({
        id: customer.id,
        name: customer.name,
        // Use existing data or assign management position
        position: customer.position || managementPositions[customer.id % managementPositions.length],
        company: customer.company || customer.city + " Pharmaceuticals", // Using city as part of company name
        // Use existing data or assign industry sector
        sector: customer.sector || industrySectors[customer.id % industrySectors.length],
        phone: customer.phone,
        email: customer.email,
        address: `${customer.address}, ${customer.city}, ${customer.state} ${customer.zipCode}`,
        taxNumber: customer.taxNumber || `TAX-${(customer.id * 12345).toString().padStart(6, '0')}` // Use existing or generate tax numbers
      }));
      setCustomerData(formattedCustomers);
    }
  }, [apiCustomers]);

  // Action handlers (just for demo purposes)
  const handleViewProfile = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setShowProfileDialog(true);
  };

  const handleViewOrders = (customer: CustomerData) => {
    toast({
      title: "View Orders",
      description: `Viewing orders for ${customer.name} at ${customer.company}`
    });
  };

  const handleEdit = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setShowEditDialog(true);
  };
  
  const handleUpdateCustomer = (id: number, updatedCustomer: Partial<CustomerData>) => {
    // In a real app, this would be an API call to update the customer
    setCustomerData(prevData => 
      prevData.map(customer => 
        customer.id === id 
          ? { ...customer, ...updatedCustomer } 
          : customer
      )
    );
    
    toast({
      title: "Customer Updated",
      description: `${updatedCustomer.name} has been updated successfully`,
    });
    
    setShowEditDialog(false);
  };

  const handleDelete = (customer: CustomerData) => {
    // In a real app, this would be an API call to delete the customer
    setCustomerData(prevData => 
      prevData.filter(c => c.id !== customer.id)
    );
    
    toast({
      title: "Customer Deleted",
      description: `${customer.name} has been removed`,
      variant: "destructive"
    });
  };
  
  const handleAddCustomer = () => {
    setShowAddDialog(true);
  };
  
  const handleSaveCustomer = (customer: Partial<CustomerData>) => {
    // In a real app, this would be an API call
    // For demo, we'll add the new customer to our local state
    const newCustomer: CustomerData = {
      id: customerData.length + 1,
      name: customer.name || '',
      position: customer.position || '',
      company: customer.company || '',
      sector: customer.sector || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      taxNumber: customer.taxNumber || `TAX-${Math.floor(Math.random() * 900000) + 100000}`
    };
    
    setCustomerData(prevData => [...prevData, newCustomer]);
    
    toast({
      title: "Customer Added",
      description: `${customer.name} has been added successfully`,
    });
    
    setShowAddDialog(false);
  };
  
  // Filter customers based on search query
  const filteredCustomers = customerData.filter(customer => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.position.toLowerCase().includes(query) ||
      customer.company.toLowerCase().includes(query) ||
      customer.sector.toLowerCase().includes(query) ||
      customer.phone.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.address.toLowerCase().includes(query)
    );
  });
  
  // Industry sectors to assign
  const industrySectors = [
    "Healthcare",
    "Pharmaceuticals",
    "Medical Devices",
    "Biotechnology",
    "Food & Beverage",
    "Chemical Manufacturing",
    "Research & Development",
    "Hospital & Clinics",
    "Retail Pharmacy",
    "Wholesale Distribution"
  ];
  
  // Handle CSV import
  const handleImportCSV = (csvData: Record<string, string>[]) => {
    try {
      // Transform CSV data to our CustomerData format
      const importedCustomers = csvData.map((row, index) => {
        // Get sector from CSV or select a valid sector from our list
        const csvSector = row.sector || row.Sector || '';
        const sector = industrySectors.includes(csvSector) 
          ? csvSector 
          : industrySectors[Math.floor(Math.random() * industrySectors.length)];
          
        return {
          id: customerData.length + index + 1,
          name: row.name || row.Name || '',
          position: row.position || row.Position || 'Procurement Manager',
          company: row.company || row.Company || 'Pharmaceutical Company',
          sector: sector,
          phone: row.phone || row.Phone || '',
          email: row.email || row.Email || '',
          address: row.address || row.Address || ''
        } as CustomerData;
      });
      
      // Add the imported customers to our state
      setCustomerData(prev => [...prev, ...importedCustomers]);
      
      toast({
        title: 'Import Successful',
        description: `Imported ${importedCustomers.length} customers.`,
      });
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import customers data.',
        variant: 'destructive'
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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 mb-6 px-4 pt-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Customer Management</h1>
        <p className="text-slate-600">Manage pharmaceutical clients and track business relationships</p>
      </div>

      {/* Customer Statistics Cards */}
      <div className="flex-shrink-0 mb-6 px-4">
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

      <div className="flex-1 flex flex-col overflow-hidden px-4 pb-6">
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