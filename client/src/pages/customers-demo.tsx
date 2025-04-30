import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Customer Data Format</h1>
        <p className="text-slate-600">Sample customer data display with the requested format</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Text Format (Plain)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm whitespace-pre-wrap bg-slate-50 p-4 rounded-md">
              {customerData.map((customer, index) => (
                <div key={customer.id} className="mb-6">
                  <div className="mb-1 font-bold text-slate-700">Customer #{index + 1}</div>
                  {`Name        : ${customer.name}
Position    : ${customer.position}
Company     : ${customer.company}
Sector      : ${customer.sector}
Phone       : ${customer.phone}
Email       : ${customer.email}
Address     : ${customer.address}
Action      : [📝 View Profile] [📄 View Orders] [✏️ Edit] [🗑 Delete]
`}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Component Format (Interactive)</CardTitle>
          </CardHeader>
          <CardContent>
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