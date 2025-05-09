import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Button } from '@/components/ui/button';

interface CustomerSearchProps {
  onCustomerSelect: (customer: any) => void;
  selectedCustomer: any | null;
  disabled?: boolean;
}

const CustomerSearch: React.FC<CustomerSearchProps> = ({ 
  onCustomerSelect, 
  selectedCustomer,
  disabled = false 
}) => {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      const data = await response.json();
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCustomerDisplay = (customer: any) => {
    return `${customer.name} - ${customer.company || 'N/A'}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
        >
          {selectedCustomer ? formatCustomerDisplay(selectedCustomer) : "Choose Customer..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search customers..." />
          <CommandEmpty>
            {loading ? "Loading customers..." : "No customers found."}
          </CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {customers.map((customer) => (
              <CommandItem
                key={customer.id}
                onSelect={() => {
                  onCustomerSelect(customer);
                  setOpen(false);
                }}
                className="flex flex-col items-start py-3"
              >
                <div className="flex items-center w-full">
                  <span className="font-medium">{customer.name}</span>
                  {selectedCustomer?.id === customer.id && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground grid grid-cols-2 w-full mt-1">
                  <span>Company: {customer.company || 'N/A'}</span>
                  <span>Sector: {customer.sector || 'N/A'}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CustomerSearch;