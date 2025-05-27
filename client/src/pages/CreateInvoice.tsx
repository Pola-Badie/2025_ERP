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
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, ChevronsUpDown, Loader2, Plus, Trash, X, Printer, RefreshCw, RotateCcw, Save, FileText, Calendar, User, DollarSign, Edit, Eye, Send, ChevronDown, MessageCircle, Mail, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  discountType: z.enum(['none', 'percentage', 'amount']).default('none'),
  discountValue: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
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

// Interface for our invoice drafts
interface InvoiceDraft {
  id: string;
  name: string;
  data: InvoiceFormValues;
  lastUpdated: string;
}

// Default form values
const defaultFormValues: InvoiceFormValues = {
  customer: {
    id: undefined,
    name: '',
    company: '',
    position: '',
    email: '',
    phone: '',
    sector: '',
    address: '',
  },
  items: [
    {
      productId: 0,
      productName: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    },
  ],
  subtotal: 0,
  discountType: 'none',
  discountValue: 0,
  discountAmount: 0,
  taxRate: 0,
  taxAmount: 0,
  grandTotal: 0,
  paymentStatus: 'unpaid',
  paymentMethod: undefined,
  paymentProofFile: undefined,
  paymentTerms: '0',
  amountPaid: 0,
  notes: '',
};

const CreateInvoice = () => {
  const { toast } = useToast();
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [openProductPopovers, setOpenProductPopovers] = useState<{[key: number]: boolean}>({});
  
  // Multi-invoice state
  // Store last active invoice ID in localStorage too
  const getInitialActiveInvoiceId = () => {
    const savedActiveId = localStorage.getItem('activeInvoiceId');
    return savedActiveId || "draft-1";
  };
  
  const [activeInvoiceId, setActiveInvoiceId] = useState<string>(getInitialActiveInvoiceId);
  
  // Update localStorage when active invoice changes
  const updateActiveInvoiceId = (newId: string) => {
    setActiveInvoiceId(newId);
    localStorage.setItem('activeInvoiceId', newId);
  };
  
  const [invoiceDrafts, setInvoiceDrafts] = useState<InvoiceDraft[]>(() => {
    try {
      const savedDrafts = localStorage.getItem('invoiceDrafts');
      if (savedDrafts) {
        const parsed = JSON.parse(savedDrafts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Don't change activeInvoiceId here - it's already set from localStorage
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading invoice drafts:', e);
    }
    
    // Default to one invoice draft if nothing valid is saved
    return [{
      id: 'draft-1',
      name: 'Invoice 1',
      data: defaultFormValues,
      lastUpdated: new Date().toISOString()
    }];
  });

  // Function to save drafts to localStorage
  const saveDrafts = (drafts: InvoiceDraft[]) => {
    localStorage.setItem('invoiceDrafts', JSON.stringify(drafts));
  };
  
  // Reset all invoices to start with a single "Invoice 1" draft
  const resetAllInvoices = () => {
    // Create a fresh Invoice 1
    const newDraft: InvoiceDraft = {
      id: 'draft-1',
      name: 'Invoice 1',
      data: defaultFormValues,
      lastUpdated: new Date().toISOString()
    };
    
    // Set our invoices array to just this one draft
    setInvoiceDrafts([newDraft]);
    
    // Save to localStorage
    saveDrafts([newDraft]);
    
    // Set the active invoice to this one
    updateActiveInvoiceId('draft-1');
    
    // Reset the form with default values
    form.reset(defaultFormValues);
    
    toast({
      title: "Invoices reset",
      description: "All invoice drafts have been cleared. Starting fresh with Invoice 1.",
    });
  };

  // Get the currently active draft
  const getCurrentDraft = (): InvoiceDraft | undefined => {
    return invoiceDrafts.find(draft => draft.id === activeInvoiceId);
  };
  
  // Refresh only product and customer data, not invoice drafts
  const refreshInvoiceData = () => {
    // Refresh customers and products data without affecting invoiceDrafts state
    queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
    queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    
    // Don't reset the activeInvoiceId or invoice drafts
    toast({
      title: "Data refreshed",
      description: "Customer and product data has been refreshed. Your invoice drafts remain unchanged.",
    });
  };

  // Set up the form
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: getCurrentDraft()?.data || defaultFormValues,
  });

  const { fields, append, remove } = useFieldArray({
    name: 'items',
    control: form.control,
  });

  // Watch form values for calculations
  const watchItems = form.watch('items');
  const watchTaxRate = form.watch('taxRate');
  const watchDiscountType = form.watch('discountType');
  const watchDiscountValue = form.watch('discountValue');
  const watchPaymentStatus = form.watch('paymentStatus');

  // Fetch customers data
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ['/api/customers', customerSearchTerm],
    queryFn: async () => {
      if (customerSearchTerm.length > 0) {
        const res = await apiRequest('GET', `/api/customers?query=${encodeURIComponent(customerSearchTerm)}`);
        return await res.json();
      }
      return [];
    },
    enabled: customerSearchTerm.length > 0,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  // Fetch products data
  const { data: products = [] } = useQuery<any[]>({
    queryKey: ['/api/products', productSearchTerm],
    queryFn: async () => {
      if (productSearchTerm.length > 0) {
        const res = await apiRequest('GET', `/api/products?query=${encodeURIComponent(productSearchTerm)}`);
        return await res.json();
      }
      return [];
    },
    enabled: productSearchTerm.length > 0,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

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
        company: data.company || '',
        position: data.position || '',
        email: data.email || '',
        phone: data.phone || '',
        sector: data.sector || '',
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
      
      // Remove this draft after successful creation
      setInvoiceDrafts(prev => {
        const updated = prev.filter(draft => draft.id !== activeInvoiceId);
        
        // If no more drafts, create a new empty one
        if (updated.length === 0) {
          updated.push({
            id: 'draft-1',
            name: 'Invoice 1',
            data: defaultFormValues,
            lastUpdated: new Date().toISOString()
          });
        }
        
        saveDrafts(updated);
        
        // Set active invoice to the first one
        updateActiveInvoiceId(updated[0].id);
        
        return updated;
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

  // Update form when active invoice changes
  useEffect(() => {
    const activeDraft = getCurrentDraft();
    if (activeDraft) {
      form.reset(activeDraft.data);
    }
  }, [activeInvoiceId, form]);

  // Calculate totals whenever items, discount, or tax rate changes
  useEffect(() => {
    if (watchItems) {
      // Calculate item totals
      watchItems.forEach((item, index) => {
        const total = item.quantity * item.unitPrice;
        form.setValue(`items.${index}.total`, total);
      });

      // Calculate subtotal
      const subtotal = watchItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      form.setValue('subtotal', subtotal);
      
      // Calculate discount
      let discountAmount = 0;
      if (watchDiscountType === 'percentage' && watchDiscountValue > 0) {
        discountAmount = (subtotal * watchDiscountValue) / 100;
      } else if (watchDiscountType === 'amount' && watchDiscountValue > 0) {
        discountAmount = Math.min(watchDiscountValue, subtotal); // Can't discount more than subtotal
      }
      form.setValue('discountAmount', discountAmount);
      
      // Calculate tax and grand total
      const subtotalAfterDiscount = subtotal - discountAmount;
      const taxAmount = (subtotalAfterDiscount * watchTaxRate) / 100;
      const grandTotal = subtotalAfterDiscount + taxAmount;

      form.setValue('taxAmount', taxAmount);
      form.setValue('grandTotal', grandTotal);
      
      // If payment status is 'paid', update amount paid
      if (form.getValues('paymentStatus') === 'paid') {
        form.setValue('amountPaid', grandTotal);
      }
    }
    
    // Save the current draft with a small delay to avoid too frequent updates
    const timer = setTimeout(() => {
      const currentFormData = form.getValues();
      setInvoiceDrafts(prev => {
        const updated = prev.map(draft => 
          draft.id === activeInvoiceId 
            ? { 
                ...draft, 
                data: currentFormData,
                lastUpdated: new Date().toISOString() 
              }
            : draft
        );
        saveDrafts(updated);
        return updated;
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, [watchItems, watchTaxRate, form, activeInvoiceId]);

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

  // Add a new invoice draft
  const addNewDraft = () => {
    if (invoiceDrafts.length >= 4) {
      toast({
        title: "Maximum invoices reached",
        description: "You can only work on up to 4 invoices at a time.",
        variant: "destructive"
      });
      return;
    }
    
    const newId = `draft-${Date.now()}`;
    const newDraft: InvoiceDraft = {
      id: newId,
      name: `Invoice ${invoiceDrafts.length + 1}`,
      data: defaultFormValues,
      lastUpdated: new Date().toISOString()
    };
    
    setInvoiceDrafts(prev => {
      const updated = [...prev, newDraft];
      saveDrafts(updated);
      return updated;
    });
    
    updateActiveInvoiceId(newId);
  };
  
  // Remove an invoice draft
  const removeDraft = (draftId: string) => {
    if (invoiceDrafts.length <= 1) {
      toast({
        title: "Cannot remove draft",
        description: "You need at least one invoice draft.",
        variant: "destructive"
      });
      return;
    }
    
    setInvoiceDrafts(prev => {
      const updated = prev.filter(draft => draft.id !== draftId);
      saveDrafts(updated);
      
      // If removing the active draft, switch to another one
      if (activeInvoiceId === draftId) {
        updateActiveInvoiceId(updated[0].id);
      }
      
      return updated;
    });
  };

  // Handle product selection
  const handleProductSelection = (productId: number, index: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.productId`, product.id);
      form.setValue(`items.${index}.productName`, product.name);
      form.setValue(`items.${index}.unitPrice`, parseFloat(product.sellingPrice));
      
      // Close this product's popover
      setOpenProductPopovers(prev => ({
        ...prev,
        [index]: false
      }));
      
      // Reset the search term
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
    
    createInvoiceMutation.mutate(invoiceData);
  };

  const [mainTab, setMainTab] = useState("create");
  const [savedDrafts, setSavedDrafts] = useState<any[]>([]);

  // Load saved drafts from localStorage
  useEffect(() => {
    const loadSavedDrafts = () => {
      const drafts = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('invoice_draft_')) {
          try {
            const draft = JSON.parse(localStorage.getItem(key) || '{}');
            if (draft.status === 'draft') {
              drafts.push({
                id: key.replace('invoice_draft_', ''),
                key: key,
                ...draft
              });
            }
          } catch (e) {
            console.error('Error parsing draft:', e);
          }
        }
      }
      setSavedDrafts(drafts.sort((a: any, b: any) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()));
    };

    loadSavedDrafts();
    // Refresh drafts when tab changes
    const interval = setInterval(loadSavedDrafts, 1000);
    return () => clearInterval(interval);
  }, [mainTab]);

  const loadDraft = (draftKey: string) => {
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey) || '{}');
      form.reset(draft);
      setMainTab("create");
      toast({
        title: "Draft Loaded",
        description: "Invoice draft has been loaded successfully",
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to load draft",
        variant: "destructive",
      });
    }
  };

  const deleteDraft = (draftKey: string) => {
    localStorage.removeItem(draftKey);
    setSavedDrafts(prev => prev.filter((draft: any) => draft.key !== draftKey));
    toast({
      title: "Draft Deleted",
      description: "Invoice draft has been deleted",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Invoice Management</h1>
          <p className="text-muted-foreground">Create new invoices and manage your drafts</p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create" className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Draft Invoices ({savedDrafts.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Create Invoice Tab */}
        <TabsContent value="create" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Create New Invoice</h2>
              <p className="text-muted-foreground">Create a new invoice by selecting a customer and adding products</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => window.history.back()} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  const currentData = form.getValues();
                  // Save current invoice data to local storage as draft
                  localStorage.setItem(`invoice_draft_${activeInvoiceId}`, JSON.stringify({
                    ...currentData,
                    savedAt: new Date().toISOString(),
                    status: 'draft'
                  }));
                  toast({
                    title: "Draft Saved",
                    description: "Invoice has been saved as draft successfully",
                  });
                }}
                disabled={isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Invoice
              </Button>
            </div>
          </div>
      
      {/* Invoice Drafts Tabs */}
      <div className="border rounded-md p-4 mb-6 bg-background">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Invoices In Progress</h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetAllInvoices}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Invoice 1
            </Button>
            {invoiceDrafts.length < 4 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addNewDraft}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
              </Button>
            )}
          </div>
        </div>
        
        <Tabs value={activeInvoiceId} onValueChange={updateActiveInvoiceId}>
          <TabsList className="grid grid-cols-4 w-full">
            {invoiceDrafts.map(draft => (
              <TabsTrigger key={draft.id} value={draft.id} className="relative">
                <span>{draft.name}</span>
                {invoiceDrafts.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 absolute -top-2 -right-2 rounded-full opacity-70 hover:opacity-100 bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDraft(draft.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={activeInvoiceId}>
            {/* Tab content is actually the entire form below */}
          </TabsContent>
        </Tabs>
        
        <div className="mt-2 text-sm text-muted-foreground">
          <p>Your invoice progress is automatically saved. You can work on up to 4 invoices at the same time.</p>
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
                    <Label htmlFor="customerTaxNumber">Tax Number (ETA Registration)</Label>
                    <Input
                      id="customerTaxNumber"
                      placeholder="Egyptian Tax Authority registration number"
                      {...form.register('customer.taxNumber')}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Required for invoices to appear in customer's ETA portal
                    </p>
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
                  {fields.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No items added. Click "Add Item" to add products to this invoice.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {fields.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addProductRow}
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Item
                </Button>
              )}
            </div>

            <Separator className="my-6" />

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
                
                {form.watch('paymentStatus') !== 'unpaid' && (
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select
                      value={form.watch('paymentMethod') || ''}
                      onValueChange={(value) => form.setValue('paymentMethod', value as any)}
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
                )}
                
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
                  </div>
                )}
                
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
                  <Select
                    value={form.watch('paymentTerms')}
                    onValueChange={(value) => form.setValue('paymentTerms', value)}
                  >
                    <SelectTrigger id="paymentTerms">
                      <SelectValue placeholder="Select payment terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Due Immediately (0 days)</SelectItem>
                      <SelectItem value="7">Net 7 (7 days)</SelectItem>
                      <SelectItem value="15">Net 15 (15 days)</SelectItem>
                      <SelectItem value="30">Net 30 (30 days)</SelectItem>
                      <SelectItem value="60">Net 60 (60 days)</SelectItem>
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
              </div>
              
              {/* Order Summary */}
              <div>
                <h3 className="font-medium mb-4">Order Summary</h3>
                <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                  <div className="grid grid-cols-2 text-sm py-2">
                    <span>Subtotal</span>
                    <span className="text-right font-medium">{new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(form.watch('subtotal') || 0)}</span>
                  </div>
                  
                  {/* Discount Section */}
                  <div className="grid grid-cols-2 gap-2 items-center border-b pb-2">
                    <Label htmlFor="discountType" className="text-sm">Discount</Label>
                    <div className="flex justify-end space-x-2">
                      <Select
                        value={form.watch('discountType')}
                        onValueChange={(value) => form.setValue('discountType', value as 'none' | 'percentage' | 'amount')}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="amount">Amount</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {form.watch('discountType') !== 'none' && (
                        <Input
                          type="number"
                          min="0"
                          step={form.watch('discountType') === 'percentage' ? '1' : '0.01'}
                          max={form.watch('discountType') === 'percentage' ? '100' : undefined}
                          className="w-20 text-right"
                          {...form.register('discountValue', { 
                            valueAsNumber: true,
                            onChange: (e) => {
                              if (form.watch('discountType') === 'percentage' && parseFloat(e.target.value) > 100) {
                                e.target.value = "100";
                              }
                            }
                          })}
                        />
                      )}
                    </div>
                  </div>
                  
                  {form.watch('discountType') !== 'none' && form.watch('discountAmount') > 0 && (
                    <div className="grid grid-cols-2 text-sm py-2">
                      <span>Discount {form.watch('discountType') === 'percentage' ? 
                        `(${form.watch('discountValue')}%)` : 'Amount'}</span>
                      <span className="text-right font-medium text-green-600">-{new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(form.watch('discountAmount') || 0)}</span>
                    </div>
                  )}
                  
                  {/* Subtotal after discount shown only if discount applied */}
                  {form.watch('discountType') !== 'none' && form.watch('discountAmount') > 0 && (
                    <div className="grid grid-cols-2 text-sm py-2 border-b pb-2">
                      <span>Subtotal after discount</span>
                      <span className="text-right font-medium">{new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format((form.watch('subtotal') || 0) - (form.watch('discountAmount') || 0))}</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 items-center border-b pb-2">
                    <Label htmlFor="taxRate" className="text-sm">Tax Rate (%)</Label>
                    <div className="flex justify-end">
                      <Input
                        id="taxRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-20 text-right"
                        {...form.register('taxRate', { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 text-sm py-2">
                    <span>Tax Amount</span>
                    <span className="text-right font-medium">{new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(form.watch('taxAmount') || 0)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 py-2">
                    <span className="font-semibold">Total</span>
                    <span className="text-right font-bold text-lg">{new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(form.watch('grandTotal') || 0)}</span>
                  </div>
                  
                  {form.watch('paymentStatus') === 'partial' && (
                    <>
                      <div className="grid grid-cols-2 text-sm py-2">
                        <span>Amount Paid</span>
                        <span className="text-right font-medium text-green-600">{new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(form.watch('amountPaid') || 0)}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 text-sm py-2">
                        <span>Balance Due</span>
                        <span className="text-right font-medium text-red-600">{new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format((form.watch('grandTotal') || 0) - (form.watch('amountPaid') || 0))}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Notes */}
            <div className="mt-6">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes or terms..."
                className="min-h-[100px]"
                {...form.register('notes')}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => window.history.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Invoice
            </Button>
          </CardFooter>
        </Card>
      </form>
      
      {/* Invoice Preview Dialog */}
      <Dialog open={showInvoicePreview} onOpenChange={setShowInvoicePreview}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Invoice Created</DialogTitle>
            <DialogDescription>
              Your invoice has been created successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>What would you like to do next?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => window.location.href = "/invoices"}>
              View All Invoices
            </Button>
            <Button onClick={() => {
              setShowInvoicePreview(false);
              form.reset(defaultFormValues);
            }}>
              Create Another Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>

        {/* Draft Invoices Tab */}
        <TabsContent value="drafts" className="space-y-6">
          <Card className="bg-gradient-to-br from-slate-50 to-blue-50/50 border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="h-6 w-6 text-blue-600" />
                    Draft Invoice Management
                  </CardTitle>
                  <CardDescription className="text-slate-600 mt-1">
                    Manage your saved invoice drafts • {savedDrafts.length} drafts available
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setMainTab("create")}
                    className="hover:bg-green-50 hover:border-green-200"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Invoice
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const keysToRemove = [];
                      for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith('invoice_draft_')) {
                          keysToRemove.push(key);
                        }
                      }
                      keysToRemove.forEach(key => localStorage.removeItem(key));
                      setSavedDrafts([]);
                      toast({
                        title: "All Drafts Cleared",
                        description: "All invoice drafts have been deleted",
                      });
                    }}
                    disabled={savedDrafts.length === 0}
                    className="hover:bg-red-50 hover:border-red-200"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {savedDrafts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-slate-800">No Draft Invoices</h3>
                  <p className="text-slate-600 mb-6 max-w-md mx-auto">
                    Create invoices and save them as drafts to manage your pharmaceutical billing workflow efficiently.
                  </p>
                  <Button onClick={() => setMainTab("create")} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Invoice
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600">Total Drafts</p>
                          <p className="text-2xl font-bold text-slate-800">{savedDrafts.length}</p>
                        </div>
                        <FileText className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600">Draft Value</p>
                          <p className="text-2xl font-bold text-green-600">
                            ${savedDrafts.reduce((sum, draft) => sum + (draft.grandTotal || 0), 0).toFixed(2)}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600">With Customers</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {savedDrafts.filter(draft => draft.customer?.name).length}
                          </p>
                        </div>
                        <User className="h-8 w-8 text-purple-600" />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600">This Week</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {savedDrafts.filter(draft => {
                              const savedDate = new Date(draft.savedAt);
                              const weekAgo = new Date();
                              weekAgo.setDate(weekAgo.getDate() - 7);
                              return savedDate >= weekAgo;
                            }).length}
                          </p>
                        </div>
                        <Calendar className="h-8 w-8 text-orange-600" />
                      </div>
                    </div>
                  </div>

                  {/* Draft Invoices List */}
                  <div className="space-y-4">
                    {savedDrafts.map((draft, index) => (
                      <Card key={draft.key} className="border-dashed hover:shadow-md transition-all duration-200 bg-white">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-800">
                                  {draft.customer?.name 
                                    ? `Invoice for ${draft.customer.company || draft.customer.name}` 
                                    : `Draft Invoice #${index + 1}`}
                                </h4>
                                <p className="text-sm text-slate-500">
                                  {draft.customer?.company && draft.customer?.name && `${draft.customer.name} • `}
                                  {draft.items?.length || 0} items • 
                                  {new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD'
                                  }).format(draft.grandTotal || 0)}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                  Saved {new Date(draft.savedAt).toLocaleDateString()} at {new Date(draft.savedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  loadDraft(draft.key);
                                  setMainTab("create");
                                  toast({
                                    title: "Draft Loaded",
                                    description: "Invoice draft loaded for editing",
                                  });
                                }}
                                className="hover:bg-blue-50 hover:border-blue-200"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  toast({
                                    title: "Preview Loading",
                                    description: "Preparing invoice preview...",
                                  });
                                  // You can implement a preview dialog here
                                }}
                                className="hover:bg-green-50 hover:border-green-200"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Preview
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                    <Send className="h-3 w-3 mr-1" />
                                    Send
                                    <ChevronDown className="h-3 w-3 ml-1" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      toast({
                                        title: "Sending via WhatsApp",
                                        description: `Opening WhatsApp for ${draft.customer?.name || 'customer'}...`,
                                      });
                                      const message = `Hello! Please find your invoice draft for ${draft.customer?.company || draft.customer?.name || 'your order'}. Total amount: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(draft.grandTotal || 0)}`;
                                      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                                    }}
                                  >
                                    <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                                    Send via WhatsApp
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      toast({
                                        title: "Opening Email Client",
                                        description: `Preparing email for ${draft.customer?.name || 'customer'}...`,
                                      });
                                      const subject = `Invoice Draft - ${draft.customer?.company || draft.customer?.name || 'Your Order'}`;
                                      const body = `Dear ${draft.customer?.name || 'Valued Customer'},%0A%0APlease find attached your invoice draft.%0A%0ATotal Amount: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(draft.grandTotal || 0)}%0A%0ABest regards,%0AYour Pharmaceutical Team`;
                                      window.location.href = `mailto:${draft.customer?.email || ''}?subject=${subject}&body=${body}`;
                                    }}
                                  >
                                    <Mail className="h-4 w-4 mr-2 text-blue-600" />
                                    Send via Email
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete this invoice draft? This action cannot be undone.`)) {
                                    deleteDraft(draft.key);
                                    toast({
                                      title: "Draft Deleted",
                                      description: "Invoice draft has been permanently deleted.",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreateInvoice;