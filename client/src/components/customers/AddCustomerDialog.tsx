import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-2 border-blue-200 shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 -m-6 mb-6 rounded-t-lg">
          <DialogTitle className="text-2xl font-bold flex items-center">
            <div className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            Add New Customer
          </DialogTitle>
          <p className="text-blue-100 mt-2">Create a new customer profile for your pharmaceutical business</p>
        </DialogHeader>
        
        <div className="grid gap-6 py-4 px-1">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
            <Label htmlFor="company" className="text-sm font-semibold text-gray-700 mb-2 block">Company Name</Label>
            <Input
              id="company"
              name="company"
              placeholder="Enter company name"
              value={customer.company || ''}
              onChange={handleInputChange}
              className="border-blue-200 focus:border-blue-500 focus:ring-blue-200"
            />
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-2 block">Contact Person Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Enter contact person name"
              value={customer.name || ''}
              onChange={handleInputChange}
              className={nameError ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-blue-200 focus:border-blue-500 focus:ring-blue-200"}
            />
            {nameError && (
              <p className="text-sm text-red-500 mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {nameError}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
              <Label htmlFor="position" className="text-sm font-semibold text-gray-700 mb-2 block">Position/Title</Label>
              <Input
                id="position"
                name="position"
                placeholder="Job title or position"
                value={customer.position || ''}
                onChange={handleInputChange}
                className="border-blue-200 focus:border-blue-500 focus:ring-blue-200"
              />
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 mb-2 block">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="+1 (555) 123-4567"
                value={customer.phone || ''}
                onChange={handleInputChange}
                className="border-blue-200 focus:border-blue-500 focus:ring-blue-200"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
              <Label htmlFor="sector" className="text-sm font-semibold text-gray-700 mb-2 block">Industry Sector</Label>
              <Select 
                defaultValue={customer.sector} 
                onValueChange={handleSectorChange}
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-200">
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
            
            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2 block">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="customer@example.com"
                value={customer.email || ''}
                onChange={handleInputChange}
                className="border-blue-200 focus:border-blue-500 focus:ring-blue-200"
              />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
            <Label htmlFor="taxNumber" className="text-sm font-semibold text-gray-700 mb-2 block flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Tax Number (ETA Registration)
            </Label>
            <Input
              id="taxNumber"
              name="taxNumber"
              placeholder="Enter Egyptian Tax Authority registration number"
              value={customer.taxNumber || ''}
              onChange={handleInputChange}
              className="border-green-200 focus:border-green-500 focus:ring-green-200"
            />
            <p className="text-xs text-green-600 mt-2 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Required for invoices to appear in customer's ETA portal
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
            <Label htmlFor="address" className="text-sm font-semibold text-gray-700 mb-2 block">Complete Address</Label>
            <Textarea
              id="address"
              name="address"
              placeholder="Enter full business address including street, city, and postal code"
              value={customer.address || ''}
              onChange={handleInputChange}
              className="min-h-[80px] border-blue-200 focus:border-blue-500 focus:ring-blue-200"
            />
          </div>
        </div>
        
        <DialogFooter className="flex items-center justify-between pt-6 border-t border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
          <DialogClose asChild>
            <Button 
              variant="outline" 
              type="button"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </Button>
          </DialogClose>
          <Button 
            type="button" 
            onClick={handleSave}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Save Customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomerDialog;