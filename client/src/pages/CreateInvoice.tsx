import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Check, ChevronsUpDown, Loader2, Plus, Trash, FileText, X, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Form validation schema
const invoiceFormSchema = z.object({
  customer: z.object({
    id: z.number().optional(),
    name: z.string().min(1, 'Customer name is required'),
    company: z.string().optional().or(z.literal('')),
    position: z.string().optional().or(z.literal('')),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    sector: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
  }),
  items: z.array(z.object({
    productId: z.number().min(1, 'Product is required'),
    productName: z.string(),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price must be positive'),
    total: z.number().min(0),
  })).min(1, 'At least one item is required'),
  subtotal: z.number(),
  taxRate: z.number().min(0).max(100),
  taxAmount: z.number(),
  grandTotal: z.number(),
  paymentStatus: z.enum(['paid', 'unpaid', 'partial']),
  paymentMethod: z.enum(['cash', 'visa', 'cheque', 'bank_transfer']).optional(),
  paymentProofFile: z.any().optional(),
  paymentTerms: z.string().default('0'),
  amountPaid: z.number().min(0),
  notes: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

// Helper function to save form data to localStorage
const saveFormToLocalStorage = (data: InvoiceFormValues) => {
  localStorage.setItem('savedInvoice', JSON.stringify(data));
};

// Helper function to load form data from localStorage
const loadFormFromLocalStorage = (): InvoiceFormValues | null => {
  const savedData = localStorage.getItem('savedInvoice');
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (e) {
      console.error('Error parsing saved invoice data:', e);
      return null;
    }
  }
  return null;
};

const CreateInvoice = () => {
  const { toast } = useToast();
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [openProductPopovers, setOpenProductPopovers] = useState<{[key: number]: boolean}>({});

  // Fetch customers with optimized performance
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<any[]>({
    queryKey: ['/api/customers', customerSearchTerm],
    queryFn: async () => {
      if (customerSearchTerm && customerSearchTerm.length > 0) {
        const res = await apiRequest('GET', `/api/customers?query=${encodeURIComponent(customerSearchTerm)}`);
        return await res.json();
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes of cache
    enabled: customerSearchTerm.length > 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Fetch products with optimized performance
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<any[]>({
    queryKey: ['/api/products', productSearchTerm],
    queryFn: async () => {
      // Only make API call when actively searching
      if (productSearchTerm && productSearchTerm.length > 0) {
        const res = await apiRequest('GET', `/api/products?query=${encodeURIComponent(productSearchTerm)}`);
        return await res.json();
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes of cache
    enabled: true,
    // Add these optimizations:
    refetchOnWindowFocus: false, // Don't refetch when tab gets focus
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnReconnect: false, // Don't refetch when reconnecting
  });

  // Get the active invoice tab data
  const getActiveTabData = useCallback(() => {
    const activeTabData = invoiceTabs.find(tab => tab.id === activeTab);
    return activeTabData?.formData || getDefaultFormValues();
  }, [activeTab, invoiceTabs]);

  // Set up the form with the active tab's data
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: getActiveTabData(),
  });
  
  // Save form data to local storage when it changes
  const saveFormData = useCallback((data: InvoiceFormValues) => {
    setInvoiceTabs(prev => {
      const updated = prev.map(tab => 
        tab.id === activeTab 
          ? { ...tab, formData: data } 
          : tab
      );
      localStorage.setItem('invoiceTabs', JSON.stringify(updated));
      return updated;
    });
  }, [activeTab]);

  const { fields, append, remove } = useFieldArray({
    name: 'items',
    control: form.control,
  });

  // Watch form values for calculations
  const watchItems = form.watch('items');
  const watchTaxRate = form.watch('taxRate');
  const watchPaymentStatus = form.watch('paymentStatus');

  // Mutation for creating a customer
  const createCustomerMutation = useMutation({
    mutationFn: async (newCustomer: any) => {
      const response = await apiRequest('POST', '/api/customers', newCustomer);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Customer created',
        description: `Successfully created customer: ${data.name}`,
      });
      form.setValue('customer', {
        id: data.id,
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
      });
      setIsCreatingCustomer(false);
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create customer. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Mutation for creating an invoice
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      const response = await apiRequest('POST', '/api/invoices', invoiceData);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Invoice created',
        description: `Successfully created invoice #${data.invoiceNumber}`,
      });
      setIsSubmitting(false);
      setShowInvoicePreview(true);
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create invoice. Please try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });

  // Calculate subtotal, tax, and total whenever items or tax rate changes
  // Using React.useCallback to memoize the calculation function
  const calculateTotals = React.useCallback(() => {
    if (watchItems) {
      // Calculate item totals and update in a batch to reduce renders
      const updatedTotals = watchItems.map((item, index) => {
        const total = item.quantity * item.unitPrice;
        return { index, total };
      });
      
      // Set all totals at once
      updatedTotals.forEach(({ index, total }) => {
        form.setValue(`items.${index}.total`, total);
      });

      // Calculate derived values
      const subtotal = updatedTotals.reduce((sum, { total }) => sum + total, 0);
      const taxAmount = (subtotal * watchTaxRate) / 100;
      const grandTotal = subtotal + taxAmount;
      
      // Update form values all at once
      form.setValue('subtotal', subtotal);
      form.setValue('taxAmount', taxAmount);
      form.setValue('grandTotal', grandTotal);
    }
  }, [watchItems, watchTaxRate, form]);

  // Run the calculation with a small delay to avoid too frequent updates
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateTotals();
      
      // Save the form data when it changes
      const currentValues = form.getValues();
      saveFormData(currentValues);
    }, 50);
    
    return () => clearTimeout(timer);
  }, [calculateTotals, saveFormData]);
  
  // Load the correct form data when the active tab changes
  useEffect(() => {
    const tabData = getActiveTabData();
    form.reset(tabData);
  }, [activeTab, form, getActiveTabData]);
  
  // Functions to manage tabs
  const addNewInvoiceTab = () => {
    if (invoiceTabs.length >= 4) {
      toast({
        title: "Maximum invoices reached",
        description: "You can have a maximum of 4 invoices open at once.",
        variant: "destructive"
      });
      return;
    }
    
    const newTabId = `invoice-${invoiceTabs.length + 1}`;
    const newTab: InvoiceTab = {
      id: newTabId,
      name: `Invoice ${invoiceTabs.length + 1}`,
      formData: getDefaultFormValues(),
    };
    
    setInvoiceTabs(prev => {
      const updated = [...prev, newTab];
      localStorage.setItem('invoiceTabs', JSON.stringify(updated));
      return updated;
    });
    
    setActiveTab(newTabId);
  };
  
  const closeInvoiceTab = (tabId: string) => {
    // Don't allow closing the last tab
    if (invoiceTabs.length <= 1) {
      return;
    }
    
    setInvoiceTabs(prev => {
      const updated = prev.filter(tab => tab.id !== tabId);
      localStorage.setItem('invoiceTabs', JSON.stringify(updated));
      
      // If we're closing the active tab, switch to another tab
      if (activeTab === tabId) {
        setActiveTab(updated[0].id);
      }
      
      return updated;
    });
  };

  // Update amount paid based on payment status
  useEffect(() => {
    const grandTotal = form.getValues('grandTotal');
    
    if (watchPaymentStatus === 'paid') {
      form.setValue('amountPaid', grandTotal);
    } else if (watchPaymentStatus === 'unpaid') {
      form.setValue('amountPaid', 0);
    }
    // If partial, leave the amount as is for user to specify
  }, [watchPaymentStatus, form]);

  // Add new product row
  const addProductRow = () => {
    append({
      productId: 0,
      productName: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    });
  };

  // Handle product selection
  const handleProductSelection = (productId: number, index: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.productId`, product.id);
      form.setValue(`items.${index}.productName`, product.name);
      form.setValue(`items.${index}.unitPrice`, parseFloat(product.sellingPrice));
      // The total will be calculated in the useEffect
      
      // Close this product's popover
      setOpenProductPopovers(prev => ({
        ...prev,
        [index]: false
      }));
      
      // Reset the search term after selection
      setProductSearchTerm('');
    }
  };

  // Handle customer selection
  const handleCustomerSelection = (customer: any) => {
    form.setValue('customer', {
      id: customer.id,
      name: customer.name,
      company: customer.company || '',
      position: customer.position || '',
      email: customer.email || '',
      phone: customer.phone || '',
      sector: customer.sector || '',
      address: customer.address || '',
    });
  };

  // Handle customer creation
  const handleCustomerCreation = (data: any) => {
    createCustomerMutation.mutate({
      name: data.customer.name,
      company: data.customer.company,
      position: data.customer.position,
      email: data.customer.email,
      phone: data.customer.phone,
      sector: data.customer.sector,
      address: data.customer.address,
    });
  };

  // Handle form submission
  const onSubmit = (data: InvoiceFormValues) => {
    setIsSubmitting(true);
    
    const invoiceData = {
      customer: data.customer.id 
        ? { id: data.customer.id } 
        : { 
            name: data.customer.name,
            company: data.customer.company,
            position: data.customer.position,
            email: data.customer.email,
            phone: data.customer.phone,
            sector: data.customer.sector,
            address: data.customer.address,
          },
      items: data.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      subtotal: data.subtotal,
      taxRate: data.taxRate,
      taxAmount: data.taxAmount,
      grandTotal: data.grandTotal,
      paymentStatus: data.paymentStatus,
      paymentMethod: data.paymentMethod,
      paymentTerms: data.paymentTerms,
      amountPaid: data.amountPaid,
      notes: data.notes,
    };
    
    createInvoiceMutation.mutate(invoiceData, {
      onSuccess: (data) => {
        // After successfully creating an invoice, remove this tab from storage
        setInvoiceTabs(prev => {
          const updated = prev.filter(tab => tab.id !== activeTab);
          
          // If no more tabs, create a new empty one
          if (updated.length === 0) {
            const newTab = {
              id: 'invoice-1',
              name: 'Invoice 1',
              formData: getDefaultFormValues(),
            };
            updated.push(newTab);
          }
          
          localStorage.setItem('invoiceTabs', JSON.stringify(updated));
          
          // Switch to the first available tab
          setActiveTab(updated[0].id);
          
          return updated;
        });
      }
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Create New Invoice</h1>
          <p className="text-muted-foreground">Create a new invoice by selecting a customer and adding products</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => window.history.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Invoice
          </Button>
        </div>
      </div>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Section */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>
              Select an existing customer or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Customer</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsCreatingCustomer(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Customer
                    </Button>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {form.watch('customer.name') || "Select customer..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Search customer..." 
                              value={customerSearchTerm}
                              onValueChange={setCustomerSearchTerm}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {customerSearchTerm.length > 0 ? (
                                  <div className="py-6 text-center text-sm">
                                    <p>No customers found for "{customerSearchTerm}"</p>
                                    <Button 
                                      variant="outline" 
                                      className="mt-2"
                                      onClick={() => setIsCreatingCustomer(true)}
                                    >
                                      <Plus className="mr-2 h-4 w-4" />
                                      Create New Customer
                                    </Button>
                                  </div>
                                ) : (
                                  "Type to search customers..."
                                )}
                              </CommandEmpty>
                              <CommandGroup heading="Customers">
                                {customers.map((customer) => (
                                  <CommandItem
                                    key={customer.id}
                                    value={customer.name}
                                    onSelect={() => handleCustomerSelection(customer)}
                                    className="flex items-center"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        form.watch('customer.id') === customer.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span>{customer.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {customer.phone || customer.email}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                              <CommandGroup>
                                <CommandItem
                                  onSelect={() => setIsCreatingCustomer(true)}
                                  className="text-blue-600"
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Create New Customer
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Customer Details Display */}
                {form.watch('customer.name') && !isCreatingCustomer && (
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      {form.watch('customer.company') ? (
                        <div>
                          <h3 className="font-medium">{form.watch('customer.company')}</h3>
                          <p className="text-sm">{form.watch('customer.name')}</p>
                        </div>
                      ) : (
                        <h3 className="font-medium">{form.watch('customer.name')}</h3>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => form.setValue('customer', {
                          id: undefined,
                          name: '',
                          company: '',
                          position: '',
                          email: '',
                          phone: '',
                          sector: '',
                          address: '',
                        })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {form.watch('customer.position') && (
                      <p className="text-sm text-muted-foreground">Position: {form.watch('customer.position')}</p>
                    )}
                    {form.watch('customer.phone') && (
                      <p className="text-sm text-muted-foreground">Phone: {form.watch('customer.phone')}</p>
                    )}
                    {form.watch('customer.sector') && (
                      <p className="text-sm text-muted-foreground">Sector: {form.watch('customer.sector')}</p>
                    )}
                    {form.watch('customer.email') && (
                      <p className="text-sm text-muted-foreground">Email: {form.watch('customer.email')}</p>
                    )}
                    {form.watch('customer.address') && (
                      <p className="text-sm text-muted-foreground">Address: {form.watch('customer.address')}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Create New Customer Form */}
              {isCreatingCustomer && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">New Customer</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsCreatingCustomer(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <Label htmlFor="customerCompany">Company Name</Label>
                    <Input
                      id="customerCompany"
                      placeholder="Company name"
                      {...form.register('customer.company')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerName">Name</Label>
                    <Input
                      id="customerName"
                      placeholder="Customer name"
                      {...form.register('customer.name')}
                    />
                    {form.formState.errors.customer?.name && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.customer.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="customerPosition">Position</Label>
                    <Input
                      id="customerPosition"
                      placeholder="Job title/Position"
                      {...form.register('customer.position')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone</Label>
                    <Input
                      id="customerPhone"
                      placeholder="Phone number"
                      {...form.register('customer.phone')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerSector">Sector</Label>
                    <Input
                      id="customerSector"
                      placeholder="Business sector"
                      {...form.register('customer.sector')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      placeholder="customer@example.com"
                      {...form.register('customer.email')}
                    />
                    {form.formState.errors.customer?.email && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.customer.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="customerAddress">Address</Label>
                    <Textarea
                      id="customerAddress"
                      placeholder="Customer address"
                      {...form.register('customer.address')}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={form.handleSubmit(handleCustomerCreation)}
                    disabled={createCustomerMutation.isPending}
                  >
                    {createCustomerMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Customer
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items Section */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
            <CardDescription>
              Add products to this invoice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-4">
              <div className="space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addProductRow}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
              <div className="space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.print()}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Invoice
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Product</TableHead>
                    <TableHead className="w-[100px] text-right">Quantity</TableHead>
                    <TableHead className="w-[150px] text-right">Unit Price</TableHead>
                    <TableHead className="w-[150px] text-right">Total</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Popover 
                          open={openProductPopovers[index]} 
                          onOpenChange={(isOpen) => {
                            setOpenProductPopovers(prev => ({
                              ...prev,
                              [index]: isOpen
                            }));
                            // Clear search term when opening popover
                            if (isOpen) {
                              setProductSearchTerm('');
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                            >
                              {field.productName || "Select a product..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0">
                            <Command>
                              <CommandInput 
                                placeholder="Search products..." 
                                value={productSearchTerm}
                                onValueChange={setProductSearchTerm}
                                className="h-9" 
                              />
                              <CommandList>
                                <CommandEmpty>
                                  <p className="py-3 text-center text-sm">No products found</p>
                                </CommandEmpty>
                                <CommandGroup heading="Products">
                                  {products.map((product) => (
                                    <CommandItem
                                      key={product.id}
                                      onSelect={() => handleProductSelection(product.id, index)}
                                      className="flex items-center justify-between"
                                    >
                                      <div>
                                        <span className="font-medium">{product.name}</span>
                                        <span className="ml-2 text-sm text-muted-foreground">
                                          {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: 'USD'
                                          }).format(product.sellingPrice)}
                                        </span>
                                      </div>
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          field.productId === product.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="1"
                          className="w-20 text-right ml-auto"
                          {...form.register(`items.${index}.quantity`, { 
                            valueAsNumber: true,
                            onChange: (e) => {
                              const value = parseInt(e.target.value);
                              if (value < 1) e.target.value = "1";
                            }
                          })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-24 text-right ml-auto"
                          {...form.register(`items.${index}.unitPrice`, { 
                            valueAsNumber: true 
                          })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(form.watch(`items.${index}.total`) || 0)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={fields.length === 1}
                          onClick={() => remove(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addProductRow}
                        className="mt-2"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Details */}
              <div className="space-y-4">
                <h3 className="font-medium">Payment Details</h3>
                <div>
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select
                    value={form.watch('paymentStatus')}
                    onValueChange={(value) => form.setValue('paymentStatus', value as 'paid' | 'unpaid' | 'partial')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partial">Partial Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={(form.watch('paymentMethod') || '') as 'cash' | 'visa' | 'cheque' | 'bank_transfer'}
                    onValueChange={(value) => form.setValue('paymentMethod', value as 'cash' | 'visa' | 'cheque' | 'bank_transfer' | undefined)}
                  >
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="visa">Visa</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {(form.watch('paymentMethod') === 'cheque' || form.watch('paymentMethod') === 'bank_transfer') && (
                  <div>
                    <Label htmlFor="paymentProof">Upload {form.watch('paymentMethod') === 'cheque' ? 'Cheque' : 'Transfer'} Document</Label>
                    <Input
                      id="paymentProof"
                      type="file"
                      className="mt-1"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          form.setValue('paymentProofFile', e.target.files[0]);
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {form.watch('paymentMethod') === 'cheque' 
                        ? 'Upload a scanned copy or photo of the cheque' 
                        : 'Upload the bank transfer receipt or confirmation'}
                    </p>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select
                    value={form.watch('paymentTerms') || '0'}
                    onValueChange={(value) => form.setValue('paymentTerms', value)}
                  >
                    <SelectTrigger id="paymentTerms">
                      <SelectValue placeholder="Select payment terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Immediate Payment</SelectItem>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="14">14 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="45">45 Days</SelectItem>
                      <SelectItem value="60">60 Days</SelectItem>
                      <SelectItem value="90">90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.watch('paymentStatus') === 'partial' && (
                  <div>
                    <Label htmlFor="amountPaid">Amount Paid</Label>
                    <Input
                      id="amountPaid"
                      type="number"
                      min="0"
                      step="0.01"
                      {...form.register('amountPaid', { valueAsNumber: true })}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Invoice notes or payment instructions"
                    {...form.register('notes')}
                  />
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="space-y-4">
                <h3 className="font-medium">Invoice Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(form.watch('subtotal'))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>Tax:</span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        className="w-16"
                        {...form.register('taxRate', { valueAsNumber: true })}
                      />
                      <span>%</span>
                    </div>
                    <span>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(form.watch('taxAmount'))}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(form.watch('grandTotal'))}
                    </span>
                  </div>
                  
                  {form.watch('paymentStatus') === 'partial' && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>Amount Paid:</span>
                        <span>
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(form.watch('amountPaid'))}
                        </span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Balance Due:</span>
                        <span>
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(form.watch('grandTotal') - form.watch('amountPaid'))}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Invoice Preview Dialog */}
      <Dialog open={showInvoicePreview} onOpenChange={setShowInvoicePreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Invoice Created Successfully</DialogTitle>
            <DialogDescription>
              Your invoice has been created and saved to the system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-lg p-6">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold text-blue-600">INVOICE</h2>
                <p className="text-muted-foreground">PharmaOverseas Ltd.</p>
                <p className="text-muted-foreground">123 Pharma Street, Lagos</p>
              </div>
              <div className="text-right">
                <p className="font-bold">Invoice #: INV-{new Date().getFullYear()}-{Math.floor(Math.random() * 10000)}</p>
                <p>Date: {format(new Date(), 'PP')}</p>
                <p>
                  Payment Terms: {form.watch('paymentTerms') === '0' 
                    ? 'Immediate Payment' 
                    : `${form.watch('paymentTerms')} Days`
                  }
                </p>
                {form.watch('paymentMethod') && (
                  <p>
                    Payment Method: {form.watch('paymentMethod')?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                )}
                <p className="mt-2">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-semibold",
                    form.watch('paymentStatus') === 'paid' ? "bg-green-100 text-green-800" :
                    form.watch('paymentStatus') === 'unpaid' ? "bg-red-100 text-red-800" :
                    "bg-yellow-100 text-yellow-800"
                  )}>
                    {form.watch('paymentStatus').charAt(0).toUpperCase() + form.watch('paymentStatus').slice(1)}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-semibold mb-2">Bill To:</h3>
                {form.watch('customer.company') && <p className="font-medium">{form.watch('customer.company')}</p>}
                <p>{form.watch('customer.name')}</p>
                {form.watch('customer.position') && <p>Position: {form.watch('customer.position')}</p>}
                {form.watch('customer.sector') && <p>Sector: {form.watch('customer.sector')}</p>}
                {form.watch('customer.address') && <p>{form.watch('customer.address')}</p>}
                {form.watch('customer.phone') && <p>Phone: {form.watch('customer.phone')}</p>}
                {form.watch('customer.email') && <p>Email: {form.watch('customer.email')}</p>}
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.watch('items').map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(item.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="mt-8 flex justify-end">
              <div className="w-72">
                <div className="flex justify-between mb-2">
                  <span>Subtotal:</span>
                  <span>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(form.watch('subtotal'))}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Tax ({form.watch('taxRate')}%):</span>
                  <span>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(form.watch('taxAmount'))}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold mb-2">
                  <span>Total:</span>
                  <span>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(form.watch('grandTotal'))}
                  </span>
                </div>
                
                {form.watch('paymentStatus') === 'partial' && (
                  <>
                    <div className="flex justify-between text-green-600 mb-2">
                      <span>Amount Paid:</span>
                      <span>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(form.watch('amountPaid'))}
                      </span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Balance Due:</span>
                      <span>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(form.watch('grandTotal') - form.watch('amountPaid'))}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {form.watch('notes') && (
              <div className="mt-8 border-t pt-4">
                <h3 className="font-semibold mb-2">Notes:</h3>
                <p className="text-muted-foreground">{form.watch('notes')}</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex justify-between items-center">
            <Button variant="outline" onClick={() => window.location.href = '/sales'}>
              Go to Sales
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button onClick={() => {
                setShowInvoicePreview(false);
                form.reset();
              }}>
                Create Another
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateInvoice;