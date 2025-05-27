import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-blue-900">New Customer</DialogTitle>
          <DialogDescription>
            Add a new customer to your pharmaceutical business network
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Company Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-800">Company Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  name="company"
                  placeholder="Pharma Corp Ltd."
                  value={customer.company || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="name">Contact Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Smith"
                  value={customer.name || ''}
                  onChange={handleInputChange}
                  className={nameError ? "border-red-500" : ""}
                />
                {nameError && (
                  <p className="text-sm text-red-500">{nameError}</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  name="position"
                  placeholder="Procurement Manager"
                  value={customer.position || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="sector">Industry Sector</Label>
                <Select 
                  defaultValue={customer.sector} 
                  onValueChange={handleSectorChange}
                >
                  <SelectTrigger>
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
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-6 bg-green-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-800">Contact Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="+20 101 234 5678"
                  value={customer.phone || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contact@company.com"
                  value={customer.email || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Business & Tax Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-800">Business & Tax Information</h3>
            </div>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="taxNumber">Tax Number (ETA Registration)</Label>
                <Input
                  id="taxNumber"
                  name="taxNumber"
                  placeholder="Enter Egyptian Tax Authority registration number"
                  value={customer.taxNumber || ''}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-muted-foreground">
                  Required for invoices to appear in customer's ETA portal
                </p>
              </div>
            </div>
          </div>

          {/* Address Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-6 bg-purple-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-800">Address Information</h3>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="address">Business Address</Label>
              <Textarea
                id="address"
                name="address"
                placeholder="Enter complete business address including city and postal code"
                value={customer.address || ''}
                onChange={handleInputChange}
                className="min-h-[80px]"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex items-center justify-between pt-6 border-t">
          <DialogClose asChild>
            <Button variant="outline" type="button" className="min-w-[100px]">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} className="min-w-[140px] bg-blue-600 hover:bg-blue-700">
            Save Customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomerDialog;