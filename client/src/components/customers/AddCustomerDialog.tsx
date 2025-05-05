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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">New Customer</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              name="company"
              placeholder="Company name"
              value={customer.company || ''}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Customer name"
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
              placeholder="Job title/Position"
              value={customer.position || ''}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="Phone number"
              value={customer.phone || ''}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="sector">Sector</Label>
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
          
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="customer@example.com"
              value={customer.email || ''}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              placeholder="Customer address"
              value={customer.address || ''}
              onChange={handleInputChange}
              className="min-h-[80px]"
            />
          </div>
        </div>
        
        <DialogFooter className="flex items-center justify-between">
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