import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CustomerCard, { CustomerData } from '@/components/customers/CustomerCard';
import AddCustomerDialog from '@/components/customers/AddCustomerDialog';
import CustomerProfileDialog from '@/components/customers/CustomerProfileDialog';
import EditCustomerDialog from '@/components/customers/EditCustomerDialog';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Loader2 } from 'lucide-react';
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
}

const CustomersDemo: React.FC = () => {
  // States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
  const [showProfileDialog, setShowProfileDialog] = useState<boolean>(false);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData[]>([]);
  
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
        // Assign a management position based on customer ID (for consistency)
        position: managementPositions[customer.id % managementPositions.length],
        company: customer.city + " Pharmaceuticals", // Using city as part of company name
        // Assign an industry sector based on customer ID (for consistency)
        sector: industrySectors[customer.id % industrySectors.length],
        phone: customer.phone,
        email: customer.email,
        address: `${customer.address}, ${customer.city}, ${customer.state} ${customer.zipCode}`
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
      address: customer.address || ''
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

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Customer Data</h1>
        <p className="text-slate-600">Information about our customers and their business details</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle>Customer Records</CardTitle>
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  className="w-[150px] sm:w-[200px] pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Import/Export Buttons */}
              <div className="flex space-x-2">
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
              
              <Button size="sm" onClick={handleAddCustomer}>
                <Plus className="h-4 w-4 mr-1" /> Add Customer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Table header */}
            <div className="grid grid-cols-7 gap-4 items-center text-sm font-medium mb-2 text-slate-800 border-b pb-2">
              <div className="">Name</div>
              <div className="hidden md:block">Company</div>
              <div className="hidden md:block">Sector</div>
              <div className="">Phone</div>
              <div className="">Email</div>
              <div className="hidden md:block">Address</div>
              <div className="text-center">Action</div>
            </div>
            
            {/* Customer data */}
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
              filteredCustomers.map((customer: CustomerData) => (
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