import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CustomerCard, { CustomerData } from '@/components/customers/CustomerCard';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';

const CustomersDemo: React.FC = () => {
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Sample customer data
  const allCustomerData: CustomerData[] = [
    {
      id: 1,
      name: "Ahmed Salah",
      position: "Procurement Manager",
      company: "Cairo Pharmaceuticals",
      sector: "Healthcare",
      phone: "+20 112-345-6789",
      email: "ahmed.salah@cairopharma.com",
      address: "15 Nile Road, Cairo, Egypt"
    },
    {
      id: 2,
      name: "Nadia Ali",
      position: "Supply Chain Director",
      company: "Alexandria Chemicals",
      sector: "Chemical Manufacturing",
      phone: "+20 122-987-6543",
      email: "nadia.ali@alexchem.com",
      address: "27 Mediterranean Avenue, Alexandria, Egypt"
    },
    {
      id: 3,
      name: "Mohammed Ibrahim",
      position: "Chief Medical Officer",
      company: "Al-Delta Hospital Group",
      sector: "Medical Services",
      phone: "+20 106-732-4582",
      email: "m.ibrahim@deltahealth.org",
      address: "8 Mansoura Road, Tanta, Egypt"
    }
  ];

  // Action handlers (just for demo purposes)
  const handleViewProfile = (customer: CustomerData) => {
    toast({
      title: "View Profile",
      description: `Viewing profile for ${customer.name}`
    });
  };

  const handleViewOrders = (customer: CustomerData) => {
    toast({
      title: "View Orders",
      description: `Viewing orders for ${customer.name} at ${customer.company}`
    });
  };

  const handleEdit = (customer: CustomerData) => {
    toast({
      title: "Edit Customer",
      description: `Editing details for ${customer.name}`
    });
  };

  const handleDelete = (customer: CustomerData) => {
    toast({
      title: "Delete Customer",
      description: `Request to delete ${customer.name}`,
      variant: "destructive"
    });
  };
  
  const handleAddCustomer = () => {
    toast({
      title: "Add Customer",
      description: "Opening customer creation form"
    });
  };
  
  // Filter customers based on search query
  const filteredCustomers = allCustomerData.filter(customer => {
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
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  className="w-[150px] sm:w-[200px] pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
            {filteredCustomers.length > 0 ? (
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
    </div>
  );
};

export default CustomersDemo;