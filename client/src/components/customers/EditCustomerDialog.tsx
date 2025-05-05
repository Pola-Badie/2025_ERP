import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomerData } from './CustomerCard';

interface EditCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerData | null;
  onSave: (id: number, updatedCustomer: Partial<CustomerData>) => void;
}

const EditCustomerDialog: React.FC<EditCustomerDialogProps> = ({
  open,
  onOpenChange,
  customer,
  onSave
}) => {
  const [editedCustomer, setEditedCustomer] = useState<Partial<CustomerData>>({});
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  // Update form when customer changes
  useEffect(() => {
    if (customer) {
      setEditedCustomer({ ...customer });
      setFormErrors({});
    }
  }, [customer]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedCustomer(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Validate form before submission
  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!editedCustomer.name?.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!editedCustomer.company?.trim()) {
      errors.company = 'Company name is required';
    }
    
    if (!editedCustomer.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(editedCustomer.email)) {
      errors.email = 'Email format is invalid';
    }
    
    if (!editedCustomer.phone?.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle save
  const handleSave = () => {
    if (!customer) return;
    
    if (validateForm()) {
      onSave(customer.id, editedCustomer);
    }
  };
  
  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Customer</DialogTitle>
          <DialogDescription>
            Make changes to the customer information below
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              name="company"
              placeholder="Company name"
              value={editedCustomer.company || ''}
              onChange={handleInputChange}
              className={formErrors.company ? "border-red-500" : ""}
            />
            {formErrors.company && (
              <p className="text-sm text-red-500">{formErrors.company}</p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Customer name"
              value={editedCustomer.name || ''}
              onChange={handleInputChange}
              className={formErrors.name ? "border-red-500" : ""}
            />
            {formErrors.name && (
              <p className="text-sm text-red-500">{formErrors.name}</p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              name="position"
              placeholder="Job title/Position"
              value={editedCustomer.position || ''}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="Phone number"
              value={editedCustomer.phone || ''}
              onChange={handleInputChange}
              className={formErrors.phone ? "border-red-500" : ""}
            />
            {formErrors.phone && (
              <p className="text-sm text-red-500">{formErrors.phone}</p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="sector">Sector</Label>
            <Input
              id="sector"
              name="sector"
              placeholder="Business sector"
              value={editedCustomer.sector || ''}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="customer@example.com"
              value={editedCustomer.email || ''}
              onChange={handleInputChange}
              className={formErrors.email ? "border-red-500" : ""}
            />
            {formErrors.email && (
              <p className="text-sm text-red-500">{formErrors.email}</p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              placeholder="Customer address"
              value={editedCustomer.address || ''}
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
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCustomerDialog;