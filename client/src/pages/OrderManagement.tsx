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
import { exportOrdersToCSV } from '@/utils/exportHelpers';
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
  const [activeTab, setActiveTab] = useState<'create' | 'refining'>('create');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [batchNumber, setBatchNumber] = useState('');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);
  
  // Production order states
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [materialToAdd, setMaterialToAdd] = useState<any>(null);
  const [materialQuantity, setMaterialQuantity] = useState<number>(0);
  const [materialUnitPrice, setMaterialUnitPrice] = useState<string>('0.00');
  const [finalProductDescription, setFinalProductDescription] = useState('');
  
  // Packaging states
  const [packagingItems, setPackagingItems] = useState<any[]>([]);
  const [packagingToAdd, setPackagingToAdd] = useState<any>(null);
  const [packagingQuantity, setPackagingQuantity] = useState<number>(0);
  const [packagingUnitPrice, setPackagingUnitPrice] = useState<string>('0.00');
  const [taxPercentage, setTaxPercentage] = useState<number>(14);
  const [subtotalPrice, setSubtotalPrice] = useState('0.00');
  const [totalPrice, setTotalPrice] = useState('0.00');
  const [transportationCost, setTransportationCost] = useState<string>('0.00');
  const [transportationNotes, setTransportationNotes] = useState<string>('');
  
  // Refining order states
  const [refiningBatchNumber, setRefiningBatchNumber] = useState('');
  const [sourceType, setSourceType] = useState('production');
  const [sourceProductionOrder, setSourceProductionOrder] = useState<string>('');
  const [sourceStockItem, setSourceStockItem] = useState<string>('');
  const [refiningSteps, setRefiningSteps] = useState<string[]>([]);
  const [newRefiningStep, setNewRefiningStep] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [refiningTaxPercentage, setRefiningTaxPercentage] = useState<number>(14);
  const [refiningSubtotal, setRefiningSubtotal] = useState('0.00');
  const [refiningCost, setRefiningCost] = useState('0.00');
  const [refiningTransportationCost, setRefiningTransportationCost] = useState<string>('0.00');
  const [refiningTransportationNotes, setRefiningTransportationNotes] = useState<string>('');
  
  // Fetch customers
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      return response.json();
    }
  });
  
  // Fetch raw materials
  const { data: materials, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['/api/products/raw-materials'],
    queryFn: async () => {
      const response = await fetch('/api/products/raw-materials');
      if (!response.ok) {
        throw new Error('Failed to fetch raw materials');
      }
      return response.json();
    }
  });
  
  // Fetch all orders
  const { data: allOrders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      return response.json();
    }
  });
  
  // Separate production and refining orders
  const productionOrders = React.useMemo(() => {
    return allOrders?.filter((order: any) => order.orderType === 'production') || [];
  }, [allOrders]);
  
  const refiningOrders = React.useMemo(() => {
    return allOrders?.filter((order: any) => order.orderType === 'refining') || [];
  }, [allOrders]);

  // Calculate subtotal and total price (with tax) when raw materials, packaging items, tax percentage, or transportation cost change
  useEffect(() => {
    // Calculate materials cost
    const materialsCost = rawMaterials.reduce((sum, material) => {
      return sum + (material.quantity * parseFloat(material.unitPrice));
    }, 0);
    
    // Calculate packaging cost
    const packagingCost = packagingItems.reduce((sum, item) => {
      return sum + (item.quantity * parseFloat(item.unitPrice));
    }, 0);
    
    // Add transportation cost
    const transportCost = parseFloat(transportationCost) || 0;
    
    // Calculate the total subtotal
    const subtotal = materialsCost + packagingCost + transportCost;
    setSubtotalPrice(subtotal.toFixed(2));
    
    // Calculate total with tax
    const taxAmount = subtotal * (taxPercentage / 100);
    const total = subtotal + taxAmount;
    setTotalPrice(total.toFixed(2));
  }, [rawMaterials, packagingItems, transportationCost, taxPercentage]);
  
  // Calculate refining cost with tax and transportation
  useEffect(() => {
    const subtotal = parseFloat(refiningSubtotal);
    const transportCost = parseFloat(refiningTransportationCost) || 0;
    const baseSubtotal = subtotal + transportCost;
    const taxAmount = baseSubtotal * (refiningTaxPercentage / 100);
    const total = baseSubtotal + taxAmount;
    setRefiningCost(total.toFixed(2));
  }, [refiningSubtotal, refiningTransportationCost, refiningTaxPercentage]);
  
  // Generate batch number on component mount
  useEffect(() => {
    generateBatchNumber('production');
  }, []);
  
  // Filter customers based on search term
  const filteredCustomers = customers ? customers.filter((customer: any) => {
    const term = customerSearchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(term) ||
      customer.company?.toLowerCase().includes(term) ||
      customer.sector?.toLowerCase().includes(term)
    );
  }) : [];
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'create' | 'refining');
    
    // Generate appropriate batch number when switching tabs
    if (value === 'create' && !batchNumber) {
      generateBatchNumber('production');
    } else if (value === 'refining' && !refiningBatchNumber) {
      generateBatchNumber('refining');
    }
  };
  
  const generateBatchNumber = async (type: 'production' | 'refining') => {
    try {
      // Get the current date in YYMMDD format
      const today = new Date();
      const dateStr = format(today, 'yyMMdd');
      
      // Get random numbers to create a unique batch number
      const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
      
      // Generate a chemical batch number with the CHEM prefix
      const chemPrefix = type === 'production' ? 'CHEM-' : 'CHEM-REF-';
      const generatedBatchNumber = `${chemPrefix}${randomNum}-${dateStr}`;
      
      if (type === 'production') {
        setBatchNumber(generatedBatchNumber);
      } else {
        setRefiningBatchNumber(generatedBatchNumber);
      }
    } catch (error) {
      console.error('Error generating batch number:', error);
      // Default batch numbers if API fails - include date in the fallback
      const now = new Date();
      const dateCode = `${now.getFullYear().toString().slice(2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
      
      if (type === 'production') {
        setBatchNumber(`CHEM-0001-${dateCode}`);
      } else {
        setRefiningBatchNumber(`REF-0001-${dateCode}`);
      }
    }
  };

  // Function to validate production order
  const validateProductionOrder = () => {
    if (!selectedCustomer) {
      toast({
        title: "Missing Customer",
        description: "Please select a customer for this order",
        variant: "destructive",
      });
      return false;
    }
    
    if (rawMaterials.length === 0) {
      toast({
        title: "No Materials",
        description: "Please add at least one raw material",
        variant: "destructive",
      });
      return false;
    }
    
    if (!finalProductDescription.trim()) {
      toast({
        title: "Missing Product Description",
        description: "Please enter a description for the final product",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  // Function to validate refining order
  const validateRefiningOrder = () => {
    if (!selectedCustomer) {
      toast({
        title: "Missing Customer",
        description: "Please select a customer for this refining order",
        variant: "destructive",
      });
      return false;
    }
    
    if (sourceType === 'production' && !sourceProductionOrder) {
      toast({
        title: "Missing Source",
        description: "Please select a source production order",
        variant: "destructive",
      });
      return false;
    }
    
    if (sourceType === 'stock' && !sourceStockItem) {
      toast({
        title: "Missing Source",
        description: "Please select a source stock item",
        variant: "destructive",
      });
      return false;
    }
    
    if (refiningSteps.length === 0) {
      toast({
        title: "No Refining Steps",
        description: "Please add at least one refining step",
        variant: "destructive",
      });
      return false;
    }
    
    if (!expectedOutput.trim()) {
      toast({
        title: "Missing Expected Output",
        description: "Please enter the expected output of the refining process",
        variant: "destructive",
      });
      return false;
    }
    
    if (parseFloat(refiningSubtotal) <= 0) {
      toast({
        title: "Invalid Cost",
        description: "Please enter a valid cost for the refining process",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  // Production order export functions
  // Function to handle exporting production orders to CSV
  const handleExportProductionOrders = () => {
    const result = exportOrdersToCSV(productionOrders, 'production');
    if (result.success) {
      toast({
        title: "Export Successful",
        description: result.message
      });
    } else {
      toast({
        title: "Export Failed",
        description: result.message,
        variant: "destructive"
      });
    }
  };
  
  // Function to handle warehouse-specific exports
  const handleExportProductionOrdersByWarehouse = (warehouseType: string) => {
    const result = exportOrdersToCSV(productionOrders, 'production', warehouseType);
    if (result.success) {
      toast({
        title: "Export Successful",
        description: result.message
      });
    } else {
      toast({
        title: "Export Failed",
        description: result.message,
        variant: "destructive"
      });
    }
  };
  
  // Function to handle exporting refining orders to CSV
  const handleExportRefiningOrders = () => {
    const result = exportOrdersToCSV(refiningOrders, 'refining');
    if (result.success) {
      toast({
        title: "Export Successful",
        description: result.message
      });
    } else {
      toast({
        title: "Export Failed",
        description: result.message,
        variant: "destructive"
      });
    }
  };
  
  // Function to handle warehouse-specific refining exports
  const handleExportRefiningOrdersByWarehouse = (warehouseType: string) => {
    const result = exportOrdersToCSV(refiningOrders, 'refining', warehouseType);
    if (result.success) {
      toast({
        title: "Export Successful",
        description: result.message
      });
    } else {
      toast({
        title: "Export Failed",
        description: result.message,
        variant: "destructive"
      });
    }
  };

  // Other functions would go here
  // This is a placeholder - we would add all the other functionality here
  
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Order Management</h1>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Production Orders</TabsTrigger>
          <TabsTrigger value="refining">Refining Orders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          {/* Production Orders tab content */}
          <div className="space-y-6">
            <div className="bg-white rounded-md shadow-sm p-6 border">
              <h2 className="text-xl font-bold mb-4">Create Production Order</h2>
              
              {/* Customer Selection */}
              <div className="grid gap-4 mb-6">
                <div className="grid gap-2">
                  <Label>Customer</Label>
                  <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={customerPopoverOpen}
                        className="justify-between"
                      >
                        {selectedCustomer
                          ? `${selectedCustomer.name} - ${selectedCustomer.company || 'No Company'}`
                          : "Select customer..."}
                        <svg className="h-4 w-4 shrink-0 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" />
                        </svg>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[300px]">
                      <Command>
                        <CommandInput
                          placeholder="Search customer..."
                          className="h-9"
                          value={customerSearchTerm}
                          onValueChange={setCustomerSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>No customers found.</CommandEmpty>
                          <CommandGroup>
                            {filteredCustomers.map((customer: any) => (
                              <CommandItem
                                key={customer.id}
                                value={customer.id.toString()}
                                onSelect={() => {
                                  setSelectedCustomer(customer);
                                  setCustomerPopoverOpen(false);
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
                
                {selectedCustomer && (
                  <div className="bg-muted p-3 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{selectedCustomer.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedCustomer.company}</p>
                        <div className="mt-1">
                          <Badge variant="secondary">{selectedCustomer.sector}</Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCustomer(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Batch Number */}
                <div className="grid gap-2">
                  <Label>Batch Number</Label>
                  <div className="flex gap-2">
                    <Input
                      className="flex-1"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      readOnly
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
              
              {/* More code would go here for materials, packaging, etc. */}
            </div>
            
            {/* Production Orders History */}
            <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Production Orders History</h2>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <FileDown className="h-4 w-4" />
                        Export to CSV
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleExportProductionOrders()}>
                        All Warehouses
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportProductionOrdersByWarehouse("Warehouse 1")}>
                        Warehouse 1
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportProductionOrdersByWarehouse("Warehouse 2")}>
                        Warehouse 2
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportProductionOrdersByWarehouse("Central Storage")}>
                        Central Storage
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="refining">
          {/* Refining Orders tab content */}
          <div className="space-y-6">
            <div className="bg-white rounded-md shadow-sm p-6 border">
              <h2 className="text-xl font-bold mb-4">Create Refining Order</h2>
              
              {/* Refining Order History */}
              <div className="mt-8 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Refining Orders History</h2>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <FileDown className="h-4 w-4" />
                          Export to CSV
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleExportRefiningOrders()}>
                          All Warehouses
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportRefiningOrdersByWarehouse("Warehouse 1")}>
                          Warehouse 1
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportRefiningOrdersByWarehouse("Warehouse 2")}>
                          Warehouse 2
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportRefiningOrdersByWarehouse("Central Storage")}>
                          Central Storage
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderManagement;