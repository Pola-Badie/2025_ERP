import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Phone, MapPin, FileText } from 'lucide-react';
import { CustomerData } from './CustomerCard';

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (customer: Partial<CustomerData>) => void;
}

const AddCustomerDialog: React.FC<AddCustomerDialogProps> = ({
  open,
  onOpenChange,
  onSave
}) => {
  // Industry sectors to select from
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
  
  const [customer, setCustomer] = useState<Partial<CustomerData>>({
    name: '',
    company: '',
    position: '',
    sector: 'Healthcare', // Default sector
    phone: '',
    email: '',
    address: ''
  });
  const [nameError, setNameError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
    
    // Clear name error if name is being typed
    if (name === 'name' && value.trim() && nameError) {
      setNameError(null);
    }
  };
  
  const handleSectorChange = (value: string) => {
    setCustomer(prev => ({ ...prev, sector: value }));
  };
  
  const handleSave = () => {
    // Basic validation
    if (!customer.name?.trim()) {
      setNameError('Customer name is required');
      return;
    }
    
    onSave(customer);
    
    // Reset form
    setCustomer({
      name: '',
      company: '',
      position: '',
      sector: '',
      phone: '',
      email: '',
      address: ''
    });
    setNameError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">Add New Customer</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">Create comprehensive customer details and business relationship information</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information Section */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Customer Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-blue-700 font-medium">Customer Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Full customer name"
                  value={customer.name || ''}
                  onChange={handleInputChange}
                  className={`border-blue-200 focus:ring-blue-500 ${nameError ? "border-red-500" : ""}`}
                />
                {nameError && (
                  <p className="text-sm text-red-500">{nameError}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position" className="text-blue-700 font-medium">Position/Title</Label>
                <Input
                  id="position"
                  name="position"
                  placeholder="Job title or position"
                  value={customer.position || ''}
                  onChange={handleInputChange}
                  className="border-blue-200 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-700">Customer Status</label>
                <select className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Active Customer</option>
                  <option>Inactive Customer</option>
                  <option>Prospect</option>
                  <option>VIP Customer</option>
                </select>
              </div>
            </div>
          </div>

          {/* Company Information Section */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Company Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company" className="text-green-700 font-medium">Company Name</Label>
                <Input
                  id="company"
                  name="company"
                  placeholder="Full company name"
                  value={customer.company || ''}
                  onChange={handleInputChange}
                  className="border-green-200 focus:ring-green-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sector" className="text-green-700 font-medium">Industry Sector</Label>
                <Select 
                  defaultValue={customer.sector} 
                  onValueChange={handleSectorChange}
                >
                  <SelectTrigger className="border-green-200 focus:ring-green-500">
                    <SelectValue placeholder="Select industry sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {industrySectors.map((sector) => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-purple-700 font-medium">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="Phone number"
                  value={customer.phone || ''}
                  onChange={handleInputChange}
                  className="border-purple-200 focus:ring-purple-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-purple-700 font-medium">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="customer@example.com"
                  value={customer.email || ''}
                  onChange={handleInputChange}
                  className="border-purple-200 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Address & Tax Information Section */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Address & Tax Information
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address" className="text-orange-700 font-medium">Complete Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  placeholder="Customer address"
                  value={customer.address || ''}
                  onChange={handleInputChange}
                  className="min-h-[80px] border-orange-200 focus:ring-orange-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taxNumber" className="text-orange-700 font-medium">Tax Number (ETA Registration)</Label>
                <Input
                  id="taxNumber"
                  name="taxNumber"
                  placeholder="Enter Egyptian Tax Authority registration number"
                  value={customer.taxNumber || ''}
                  onChange={handleInputChange}
                  className="border-orange-200 focus:ring-orange-500"
                />
                <p className="text-xs text-orange-600">
                  Required for invoices to appear in customer's ETA portal
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-end space-x-2 pt-6">
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>
            Save Customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomerDialog;