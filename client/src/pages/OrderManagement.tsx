import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Loader2, 
  Save, 
  Eye, 
  FileText, 
  Edit,
  Trash2,
  Plus,
  PlusCircle,
  X,
  Search,
  Download,
  FileDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  CommandList,
} from "@/components/ui/command";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { queryClient } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

const OrderManagement = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('create');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [batchNumber, setBatchNumber] = useState('');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  
  // Production order states
  const [rawMaterials, setRawMaterials] = useState([]);
  const [materialToAdd, setMaterialToAdd] = useState(null);
  const [materialQuantity, setMaterialQuantity] = useState(0);
  const [materialUnitPrice, setMaterialUnitPrice] = useState('0.00');
  const [finalProductDescription, setFinalProductDescription] = useState('');
  
  // Packaging states
  const [packagingItems, setPackagingItems] = useState([]);
  const [packagingToAdd, setPackagingToAdd] = useState(null);
  const [packagingQuantity, setPackagingQuantity] = useState(0);
  const [packagingUnitPrice, setPackagingUnitPrice] = useState('0.00');
  const [taxPercentage, setTaxPercentage] = useState(14);
  const [subtotalPrice, setSubtotalPrice] = useState('0.00');
  const [totalPrice, setTotalPrice] = useState('0.00');
  const [transportationCost, setTransportationCost] = useState('0.00');
  const [transportationNotes, setTransportationNotes] = useState('');
  
  // Refining order states
  const [refiningBatchNumber, setRefiningBatchNumber] = useState('');
  const [sourceType, setSourceType] = useState('production');
  const [sourceProductionOrder, setSourceProductionOrder] = useState('');
  const [sourceStockItem, setSourceStockItem] = useState('');
  const [refiningSteps, setRefiningSteps] = useState([]);
  const [newRefiningStep, setNewRefiningStep] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [refiningTaxPercentage, setRefiningTaxPercentage] = useState(14);
  const [refiningSubtotal, setRefiningSubtotal] = useState('0.00');
  const [refiningCost, setRefiningCost] = useState('0.00');
  const [refiningTransportationCost, setRefiningTransportationCost] = useState('0.00');
  const [refiningTransportationNotes, setRefiningTransportationNotes] = useState('');
  
  // Generate batch number on component mount
  useEffect(() => {
    generateBatchNumber('production');
  }, []);
  
  const generateBatchNumber = async (type) => {
    try {
      // Get the current date in YYMMDD format
      const today = new Date();
      const dateStr = format(today, 'yyMMdd');
      
      // Get random numbers to create a unique batch number (3 digits)
      const randomNum = Math.floor(100 + Math.random() * 900);
      
      // Generate batch numbers with new format
      if (type === 'production') {
        // Format: BATCH-100-YYMMDD
        const batchNumber = `BATCH-${randomNum}-${dateStr}`;
        setBatchNumber(batchNumber);
      } else {
        // Format: REF-100-YYMMDD
        const refBatchNumber = `REF-${randomNum}-${dateStr}`;
        setRefiningBatchNumber(refBatchNumber);
      }
    } catch (error) {
      console.error('Error generating batch number:', error);
      // Default batch numbers if something fails
      const now = new Date();
      const dateCode = format(now, 'yyMMdd');
      
      if (type === 'production') {
        setBatchNumber(`BATCH-100-${dateCode}`);
      } else {
        setRefiningBatchNumber(`REF-100-${dateCode}`);
      }
    }
  };

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers');
      if (!response.ok) throw new Error('Failed to fetch customers');
      return response.json();
    }
  });

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => 
    customer.name?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.company?.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Management</h1>
      </div>
      
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="create" onClick={() => generateBatchNumber('production')}>
            Production Orders
          </TabsTrigger>
          <TabsTrigger value="refining" onClick={() => generateBatchNumber('refining')}>
            Refining Orders
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <div className="bg-white p-6 rounded-md border mb-6">
            <h2 className="text-xl font-bold mb-4">Create Production Order</h2>
            
            {/* Customer Selection */}
            <div className="mb-4">
              <Label>Customer</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedCustomer ? `${selectedCustomer.name} - ${selectedCustomer.company || 'No Company'}` : "Select customer..."}
                    <svg className="h-4 w-4 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" />
                    </svg>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-full max-w-[500px]">
                  <Command>
                    <CommandInput placeholder="Search customer..." />
                    <CommandList>
                      <CommandEmpty>No customers found.</CommandEmpty>
                      <CommandGroup>
                        {filteredCustomers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            onSelect={() => {
                              setSelectedCustomer(customer);
                            }}
                          >
                            <div className="flex flex-col">
                              <span>{customer.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {customer.company || 'No Company'} - {customer.sector || 'No Sector'}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Batch Number - EDITABLE */}
            <div className="mb-4">
              <Label>Batch Number</Label>
              <div className="flex gap-2">
                <Input
                  className="flex-1"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={() => generateBatchNumber('production')}
                  title="Generate new batch number"
                >
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-.75-.75H11.77a.75.75 0 000 1.5h2.434l-.31.31a7 7 0 00-11.712 3.138.75.75 0 001.449.39 5.5 5.5 0 019.201-2.466l.312.311H7.39a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="refining">
          <div className="bg-white p-6 rounded-md border mb-6">
            <h2 className="text-xl font-bold mb-4">Create Refining Order</h2>
            
            {/* Batch Number - EDITABLE */}
            <div className="mb-4">
              <Label>Batch Number</Label>
              <div className="flex gap-2">
                <Input
                  className="flex-1"
                  value={refiningBatchNumber}
                  onChange={(e) => setRefiningBatchNumber(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={() => generateBatchNumber('refining')}
                  title="Generate new batch number"
                >
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-.75-.75H11.77a.75.75 0 000 1.5h2.434l-.31.31a7 7 0 00-11.712 3.138.75.75 0 001.449.39 5.5 5.5 0 019.201-2.466l.312.311H7.39a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderManagement;
