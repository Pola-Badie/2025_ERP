import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, UserPlus } from 'lucide-react';
import CustomerCard, { CustomerData } from '@/components/customers/CustomerCard';
import { toast } from '@/hooks/use-toast';

const CustomersDemo: React.FC = () => {
  // Sample customer data
  const customerData: CustomerData[] = [
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

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Customer Data</h1>
        <p className="text-slate-600">Information about our customers and their business details</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Customer Records</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="text-sm">
                <FileText className="h-4 w-4 mr-1" /> Export
              </Button>
              <Button variant="default" size="sm" className="text-sm bg-[#3BCEAC] hover:bg-[#34b89a]">
                <UserPlus className="h-4 w-4 mr-1" /> Add Customer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Table header */}
            <div className="grid grid-cols-7 md:grid-cols-8 gap-2 items-center text-sm font-medium mb-2 text-slate-500 border-b pb-2">
              <div className="col-span-2 md:col-span-1">Name</div>
              <div className="md:col-span-1 hidden md:block">Company</div>
              <div className="col-span-1 hidden md:block">Sector</div>
              <div className="col-span-2 md:col-span-1">Phone</div>
              <div className="col-span-2 md:col-span-2">Email</div>
              <div className="col-span-2 hidden md:block">Address</div>
              <div className="text-right">Actions</div>
            </div>
            
            {/* Customer data */}
            {customerData.map(customer => (
              <CustomerCard 
                key={customer.id}
                customer={customer}
                onViewProfile={handleViewProfile}
                onViewOrders={handleViewOrders}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomersDemo;