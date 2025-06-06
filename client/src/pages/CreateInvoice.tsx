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
import { Check, ChevronsUpDown, Loader2, Plus, Trash, X, Printer, RefreshCw, RotateCcw, Save, FileText, Calendar, User, Package, Eye, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { PrintableInvoice } from '@/components/PrintableInvoice';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    taxNumber: z.string().optional().or(z.literal('')),
  }),
  items: z.array(z.object({
    productId: z.number().min(1, 'Product is required'),
    productName: z.string(),
    category: z.string().optional(),
    batchNo: z.string().optional(),
    gs1Code: z.string().optional(),
    type: z.string().optional(),
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
  paperInvoiceNumber: z.string().optional(),
  approvalNumber: z.string().optional(),
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
    taxNumber: '',
  },
  items: [
    {
      productId: 0,
      productName: '',
      category: '',
      batchNo: '',
      gs1Code: '',
      type: '',
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
  paperInvoiceNumber: '',
  approvalNumber: '',
  notes: '',
};

const CreateInvoice = () => {
  const { toast } = useToast();
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openProductPopovers, setOpenProductPopovers] = useState<{[key: number]: boolean}>({});
  const [showQuotationSelector, setShowQuotationSelector] = useState(false);
  const [showOrderSelector, setShowOrderSelector] = useState(false);
  
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
  const getCurrentDraft = () => {
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

  // Set up the form with stable default values
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: defaultFormValues,
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
        try {
          const res = await apiRequest('GET', `/api/customers?query=${encodeURIComponent(customerSearchTerm)}`);
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          const text = await res.text();
          if (!text) return [];
          return JSON.parse(text);
        } catch (error) {
          console.error('Error fetching customers:', error);
          return [];
        }
      }
      return [];
    },
    enabled: customerSearchTerm.length > 0,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Fetch all products from inventory
  const { data: allProducts = [] } = useQuery<any[]>({
    queryKey: ['/api/products'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/products');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const text = await res.text();
        if (!text) return [];
        return JSON.parse(text);
      } catch (error) {
        console.error('Error fetching products:', error);
        return [];
      }
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Fetch categories to map category names
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/categories');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const text = await res.text();
        if (!text) return [];
        return JSON.parse(text);
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Fetch quotations from quotations history
  const { data: quotations = [] } = useQuery<any[]>({
    queryKey: ['/api/quotations', '', 'all', 'all', 'all'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/quotations?query=&status=all&type=all&date=all');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const text = await res.text();
        if (!text) return [];
        return JSON.parse(text);
      } catch (error) {
        console.error('Error fetching quotations:', error);
        return [];
      }
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Fetch orders from order history
  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ['/api/orders/production-history'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/orders/production-history');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const text = await res.text();
        if (!text) return [];
        return JSON.parse(text);
      } catch (error) {
        console.error('Error fetching order history:', error);
        return [];
      }
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Filter products based on search term
  const products = productSearchTerm.length > 0 
    ? allProducts.filter(product => 
        product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.drugName?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(productSearchTerm.toLowerCase())
      )
    : allProducts;

  // Calculate totals automatically when form values change
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.items && Array.isArray(value.items)) {
        let hasChanges = false;
        const updates: any = {};

        // Calculate line totals
        value.items.forEach((item, index) => {
          if (item && typeof item.quantity === 'number' && typeof item.unitPrice === 'number') {
            const lineTotal = Number((item.quantity * item.unitPrice).toFixed(2));
            if (Math.abs(lineTotal - (item.total || 0)) > 0.01) {
              updates[`items.${index}.total`] = lineTotal;
              hasChanges = true;
            }
          }
        });

        // Calculate subtotal
        const subtotal = Number(value.items.reduce((sum, item) => {
          return sum + (item?.total || 0);
        }, 0).toFixed(2));
        
        if (Math.abs(subtotal - (value.subtotal || 0)) > 0.01) {
          updates.subtotal = subtotal;
          hasChanges = true;
        }

        // Calculate discount amount
        let discountAmount = 0;
        if (value.discountType === 'percentage' && value.discountValue) {
          discountAmount = Number(((subtotal * value.discountValue) / 100).toFixed(2));
        } else if (value.discountType === 'amount' && value.discountValue) {
          discountAmount = Number(value.discountValue);
        }
        
        if (Math.abs(discountAmount - (value.discountAmount || 0)) > 0.01) {
          updates.discountAmount = discountAmount;
          hasChanges = true;
        }

        // Calculate tax amount
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = value.taxRate ? Number(((taxableAmount * value.taxRate) / 100).toFixed(2)) : 0;
        
        if (Math.abs(taxAmount - (value.taxAmount || 0)) > 0.01) {
          updates.taxAmount = taxAmount;
          hasChanges = true;
        }

        // Calculate grand total
        const grandTotal = Number((taxableAmount + taxAmount).toFixed(2));
        
        if (Math.abs(grandTotal - (value.grandTotal || 0)) > 0.01) {
          updates.grandTotal = grandTotal;
          hasChanges = true;
        }

        // Apply all updates at once to prevent multiple re-renders
        if (hasChanges) {
          Object.entries(updates).forEach(([path, value]) => {
            form.setValue(path as any, value, { shouldValidate: false });
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Mutation for creating a customer
  const createCustomerMutation = useMutation({
    mutationFn: async (newCustomer: any) => {
      try {
        const response = await apiRequest('POST', '/api/customers', newCustomer);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        if (!text) throw new Error('Empty response');
        return JSON.parse(text);
      } catch (error) {
        console.error('Error creating customer:', error);
        throw error;
      }
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
      console.error('Customer creation error:', error);
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
      try {
        const response = await apiRequest('POST', '/api/invoices', invoiceData);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        if (!text) throw new Error('Empty response');
        return JSON.parse(text);
      } catch (error) {
        console.error('Error creating invoice:', error);
        throw error;
      }
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
      console.error('Invoice creation error:', error);
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

  // Save draft periodically (separated from calculations to prevent loops)
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentFormData = form.getValues();
      setInvoiceDrafts(prev => {
        const activeDraft = prev.find(draft => draft.id === activeInvoiceId);
        if (activeDraft && JSON.stringify(activeDraft.data) !== JSON.stringify(currentFormData)) {
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
        }
        return prev;
      });
    }, 2000); // Further increased delay and only save if data actually changed
    
    return () => clearTimeout(timer);
  }, [watchItems, watchTaxRate, watchDiscountType, watchDiscountValue, activeInvoiceId, form]);

  // Update amount paid based on payment status
  useEffect(() => {
    const grandTotal = form.getValues('grandTotal') || 0;
    
    if (watchPaymentStatus === 'paid' && grandTotal > 0) {
      const currentAmountPaid = form.getValues('amountPaid') || 0;
      if (Math.abs(grandTotal - currentAmountPaid) > 0.01) {
        form.setValue('amountPaid', grandTotal, { shouldValidate: false });
      }
    } else if (watchPaymentStatus === 'unpaid') {
      const currentAmountPaid = form.getValues('amountPaid') || 0;
      if (currentAmountPaid !== 0) {
        form.setValue('amountPaid', 0, { shouldValidate: false });
      }
    }
    // If partial, leave the amount as is for user to specify
  }, [watchPaymentStatus]);

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
      // Find category name by ID
      const category = categories.find(c => c.id === product.categoryId);
      const categoryName = category ? category.name : `Category ${product.categoryId}`;
      
      form.setValue(`items.${index}.productId`, product.id);
      form.setValue(`items.${index}.productName`, product.name);
      form.setValue(`items.${index}.category`, categoryName);
      form.setValue(`items.${index}.batchNo`, product.sku || '');
      form.setValue(`items.${index}.gs1Code`, product.barcode || '');
      form.setValue(`items.${index}.type`, product.productType || '');
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
      taxNumber: customer.taxNumber || '',
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
      taxNumber: data.customer.taxNumber,
    });
  };

  // Handle quotation selection and import items
  const handleQuotationSelection = (quotation: any) => {
    // Set customer if exists in quotation (using quotations history structure)
    if (quotation.customerName) {
      form.setValue('customer', {
        id: quotation.customerId,
        name: quotation.customerName,
        company: quotation.customerName,
        position: '',
        email: '',
        phone: '',
        sector: '',
        address: '',
        taxNumber: '',
      });
    }

    // Clear existing items
    fields.forEach((_, index) => {
      if (index > 0) remove(index);
    });

    // Import quotation items (using quotations history structure)
    if (quotation.items && quotation.items.length > 0) {
      // Remove the default empty item first
      remove(0);
      
      quotation.items.forEach((item: any, index: number) => {
        append({
          productId: index + 1,
          productName: item.productName || '',
          category: item.specifications || '',
          batchNo: '',
          gs1Code: '',
          type: quotation.type || '',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          total: item.total || 0,
        });
      });
    }

    setShowQuotationSelector(false);
    
    toast({
      title: "Quotation Imported",
      description: `Items from quotation ${quotation.quotationNumber} have been imported`,
    });
  };

  const handleOrderSelection = (order: any) => {
    // Set customer from order
    if (order.customerName) {
      form.setValue('customer', {
        id: order.id,
        name: order.customerName,
        company: order.customerCompany || order.customerName,
        position: '',
        email: '',
        phone: '',
        sector: '',
        address: '',
      });
    }

    // Clear existing items
    fields.forEach((_, index) => {
      if (index > 0) remove(index);
    });

    // Create invoice item from order data
    // Remove the default empty item first
    remove(0);
    
    // Add the target product as an invoice item
    append({
      productId: order.id,
      productName: order.targetProduct || '',
      category: 'Pharmaceutical',
      batchNo: order.batchNumber || '',
      gs1Code: '',
      type: order.type || 'manufacturing',
      quantity: 1,
      unitPrice: order.revenue || order.totalCost || 0,
      total: order.revenue || order.totalCost || 0,
    });

    setShowOrderSelector(false);
    
    toast({
      title: "Order Imported",
      description: `Order ${order.orderNumber} has been imported to invoice`,
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
  
  // Print and PDF state
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const printRef = React.useRef<HTMLDivElement>(null);

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

  // Print functionality
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${getCurrentDraft()?.name || activeInvoiceId}`,
    onAfterPrint: () => {
      toast({
        title: "Invoice Printed",
        description: "Invoice has been sent to printer successfully",
      });
    }
  });

  // PDF generation functionality
  const generatePDF = async () => {
    if (!printRef.current) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const fileName = `Invoice-${getCurrentDraft()?.name || activeInvoiceId}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "PDF Generated",
        description: `Invoice PDF saved as ${fileName}`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Preview invoice function
  const previewInvoice = () => {
    const formData = form.getValues();
    
    // Validate that we have minimum required data
    if (!formData.customer.name || formData.items.length === 0) {
      toast({
        title: "Preview Not Available",
        description: "Please add customer information and at least one item to preview the invoice.",
        variant: "destructive",
      });
      return;
    }
    
    setShowInvoicePreview(true);
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
              <Button 
                variant="outline" 
                onClick={previewInvoice}
                disabled={isSubmitting}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview Invoice
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

                {/* Paper Invoice Number Field */}
                <div className="space-y-2">
                  <Label htmlFor="paperInvoiceNumber">Paper Invoice Number</Label>
                  <Input
                    id="paperInvoiceNumber"
                    placeholder="P-2025001"
                    {...form.register('paperInvoiceNumber')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Physical invoice reference number for record-keeping
                  </p>
                </div>

                {/* Approval Number Field */}
                <div className="space-y-2">
                  <Label htmlFor="approvalNumber">Approval No.</Label>
                  <Input
                    id="approvalNumber"
                    placeholder="APP-2025001"
                    {...form.register('approvalNumber')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Internal approval reference number
                  </p>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQuotationSelector(true)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Select from Quotations
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowOrderSelector(true)}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Select from Order History
                </Button>
              </div>
              <div className="space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPrintPreview(true)}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Preview
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Product</TableHead>
                    <TableHead className="w-[120px]">Category</TableHead>
                    <TableHead className="w-[100px]">Batch No.</TableHead>
                    <TableHead className="w-[120px]">GS1 Code</TableHead>
                    <TableHead className="w-[80px]">Type</TableHead>
                    <TableHead className="w-[100px] text-right">Quantity</TableHead>
                    <TableHead className="w-[120px] text-right">Unit Price</TableHead>
                    <TableHead className="w-[120px] text-right">Total</TableHead>
                    <TableHead className="w-[60px]">Action</TableHead>
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
                              className="w-full justify-between text-left"
                            >
                              <span className="truncate">
                                {form.watch(`items.${index}.productName`) || "Select a product..."}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0">
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
                                      className="flex flex-col items-start py-2"
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <div className="flex-1">
                                          <div className="font-medium">{product.name}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {categories.find(c => c.id === product.categoryId)?.name || 'No Category'} • {product.sku || 'No SKU'} • {product.barcode || 'No Barcode'}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-sm font-medium">
                                            {new Intl.NumberFormat('en-US', {
                                              style: 'currency',
                                              currency: 'USD'
                                            }).format(product.sellingPrice)}
                                          </div>
                                          <Check
                                            className={cn(
                                              "h-4 w-4 mt-1",
                                              field.productId === product.id
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{form.watch(`items.${index}.category`) || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{form.watch(`items.${index}.batchNo`) || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{form.watch(`items.${index}.gs1Code`) || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{form.watch(`items.${index}.type`) || '-'}</span>
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
                        <span className="font-medium">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(form.watch(`items.${index}.total`) || 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={fields.length === 1}
                          onClick={() => {
                            if (fields.length > 1) {
                              remove(index);
                            }
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {fields.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4">
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
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Draft Invoices</h2>
              <p className="text-muted-foreground">Manage your saved invoice drafts</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                // Clear all drafts
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
            >
              <Trash className="mr-2 h-4 w-4" />
              Clear All Drafts
            </Button>
          </div>

          {savedDrafts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Draft Invoices</h3>
                <p className="text-muted-foreground text-center mb-4">
                  You haven't saved any invoice drafts yet. Create an invoice and use "Save as Draft" to see them here.
                </p>
                <Button onClick={() => setMainTab("create")} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Invoice
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {savedDrafts.map((draft) => (
                <Card key={draft.key} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <h3 className="font-medium">
                            {draft.customer?.name ? `Invoice for ${draft.customer.name}` : 'Untitled Invoice Draft'}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Draft
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>{draft.customer?.company || draft.customer?.name || 'No customer selected'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>Saved {new Date(draft.savedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4" />
                            <span>{draft.items?.length || 0} items</span>
                          </div>
                        </div>
                        
                        {draft.items && draft.items.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-green-600">
                              Total: {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD'
                              }).format(draft.grandTotal || 0)}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadDraft(draft.key)}
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Load Draft
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDraft(draft.key)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quotation Selector Dialog */}
      <Dialog open={showQuotationSelector} onOpenChange={setShowQuotationSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select from Quotations</DialogTitle>
            <DialogDescription>
              Choose a quotation to import its items and customer information into this invoice
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {quotations.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Quotations Found</h3>
                <p className="text-muted-foreground">
                  There are no quotations available to import from.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {quotations.map((quotation) => (
                  <Card key={quotation.id} className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleQuotationSelection(quotation)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium">{quotation.quotationNumber}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              quotation.status === 'approved' ? 'bg-green-100 text-green-800' :
                              quotation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {quotation.status}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span>{quotation.customerName || 'No Customer'}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(quotation.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4" />
                                <span>{quotation.items?.length || 0} items</span>
                              </div>
                            </div>
                          </div>
                          
                          {quotation.items && quotation.items.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-blue-600">
                                Total: {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'USD'
                                }).format(quotation.total || quotation.amount || 0)}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <Button variant="outline" size="sm">
                          Import
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuotationSelector(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Selector Dialog */}
      <Dialog open={showOrderSelector} onOpenChange={setShowOrderSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select from Order History</DialogTitle>
            <DialogDescription>
              Choose a completed order to import its details into this invoice
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Orders Found</h3>
                <p className="text-muted-foreground">
                  There are no completed orders available to import from.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {orders.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleOrderSelection(order)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            <div>
                              <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                              <p className="text-sm text-muted-foreground">
                                {order.targetProduct}
                              </p>
                            </div>
                            <div className="ml-auto flex items-center space-x-2">
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                order.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {order.status}
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span>{order.customerName}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4" />
                                <span>Batch: {order.batchNumber}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <p className="text-sm font-medium text-green-600">
                              Revenue: {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD'
                              }).format(order.revenue || order.totalCost || 0)}
                            </p>
                          </div>
                        </div>
                        
                        <Button variant="outline" size="sm">
                          Import
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderSelector(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Preview Dialog */}
      <Dialog open={showInvoicePreview} onOpenChange={setShowInvoicePreview}>
        <DialogContent className="max-w-6xl h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Invoice Preview</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  disabled={!printRef.current}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generatePDF}
                  disabled={isGeneratingPDF || !printRef.current}
                >
                  {isGeneratingPDF ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              Preview your invoice before printing or downloading
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto border rounded-md bg-gray-50 p-4">
            <div ref={printRef}>
              <PrintableInvoice
                invoiceNumber={`INV-${getCurrentDraft()?.name || activeInvoiceId}-${new Date().getFullYear()}`}
                date={new Date()}
                customer={{
                  name: form.watch('customer.name') || '',
                  company: form.watch('customer.company') || '',
                  email: form.watch('customer.email') || '',
                  phone: form.watch('customer.phone') || '',
                  address: form.watch('customer.address') || '',
                }}
                items={form.watch('items').map(item => ({
                  productName: item.productName || '',
                  category: item.category || '',
                  batchNo: item.batchNo || '',
                  quantity: item.quantity || 0,
                  unitPrice: item.unitPrice || 0,
                  total: item.total || 0,
                }))}
                subtotal={form.watch('subtotal') || 0}
                discountAmount={form.watch('discountAmount') || 0}
                taxRate={form.watch('taxRate') || 0}
                taxAmount={form.watch('taxAmount') || 0}
                grandTotal={form.watch('grandTotal') || 0}
                paymentTerms={form.watch('paymentTerms') || '0'}
                notes={form.watch('notes') || ''}
                amountPaid={form.watch('amountPaid') || 0}
                paymentStatus={form.watch('paymentStatus') || 'unpaid'}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoicePreview(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Preview Dialog */}
      <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
        <DialogContent className="max-w-4xl h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Print Preview</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const printContent = document.getElementById('print-content');
                    if (printContent) {
                      const newWindow = window.open('', '_blank');
                      if (newWindow) {
                        newWindow.document.write(`
                          <html>
                            <head>
                              <title>Invoice Print</title>
                              <style>
                                body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                                .printable-invoice { max-width: none; margin: 0; }
                                @media print {
                                  body { margin: 0; padding: 0; }
                                  @page { margin: 0.5in; }
                                }
                              </style>
                            </head>
                            <body>
                              ${printContent.innerHTML}
                            </body>
                          </html>
                        `);
                        newWindow.document.close();
                        newWindow.print();
                        newWindow.close();
                      }
                    }
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              Preview your invoice before printing
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto border rounded-md bg-gray-50 p-4">
            <div id="print-content">
              <div className="printable-invoice bg-white p-8 max-w-4xl mx-auto text-black">
                {/* Header */}
                <div className="flex justify-between items-start mb-8 border-b pb-6">
                  <div className="company-info">
                    <h1 className="text-3xl font-bold text-blue-600 mb-2">Morgan ERP</h1>
                    <p className="text-gray-600 text-sm">Enterprise Resource Planning System</p>
                    <div className="mt-4 text-sm text-gray-600">
                      <p>123 Business District</p>
                      <p>Cairo, Egypt 11511</p>
                      <p>Phone: +20 2 1234 5678</p>
                      <p>Email: info@morganerp.com</p>
                    </div>
                  </div>
                  
                  <div className="invoice-header text-right">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">INVOICE</h2>
                    <div className="text-sm">
                      <p><span className="font-semibold">Invoice #:</span> INV-{getCurrentDraft()?.name || activeInvoiceId}-{new Date().getFullYear()}</p>
                      <p><span className="font-semibold">Date:</span> {new Date().toLocaleDateString()}</p>
                      <p><span className="font-semibold">Due Date:</span> {new Date(Date.now() + (parseInt(form.watch('paymentTerms') || '0') * 24 * 60 * 60 * 1000)).toLocaleDateString()}</p>
                      {form.watch('paperInvoiceNumber') && (
                        <p><span className="font-semibold">Paper Invoice #:</span> {form.watch('paperInvoiceNumber')}</p>
                      )}
                      {form.watch('approvalNumber') && (
                        <p><span className="font-semibold">Approval No.:</span> {form.watch('approvalNumber')}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="customer-info mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Bill To:</h3>
                  <div className="bg-gray-50 p-4 rounded border">
                    <p className="font-semibold text-lg">{form.watch('customer.name') || 'No customer selected'}</p>
                    {form.watch('customer.company') && <p className="text-gray-600">{form.watch('customer.company')}</p>}
                    {form.watch('customer.address') && <p className="text-gray-600 mt-2">{form.watch('customer.address')}</p>}
                    <div className="flex gap-8 mt-2 text-sm">
                      {form.watch('customer.email') && <p><span className="font-medium">Email:</span> {form.watch('customer.email')}</p>}
                      {form.watch('customer.phone') && <p><span className="font-medium">Phone:</span> {form.watch('customer.phone')}</p>}
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="items-table mb-8">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Item Description</th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Category</th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Batch No.</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Qty</th>
                        <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Unit Price</th>
                        <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.watch('items').map((item, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 px-4 py-2">{item.productName || ''}</td>
                          <td className="border border-gray-300 px-4 py-2">{item.category || ''}</td>
                          <td className="border border-gray-300 px-4 py-2">{item.batchNo || ''}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity || 0}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">${(item.unitPrice || 0).toFixed(2)}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">${(item.total || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="summary flex justify-end mb-8">
                  <div className="w-80">
                    <div className="bg-gray-50 p-4 rounded border">
                      <div className="flex justify-between py-2">
                        <span>Subtotal:</span>
                        <span>${(form.watch('subtotal') || 0).toFixed(2)}</span>
                      </div>
                      {form.watch('discountAmount') > 0 && (
                        <div className="flex justify-between py-2 text-green-600">
                          <span>Discount:</span>
                          <span>-${(form.watch('discountAmount') || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-2">
                        <span>Tax ({form.watch('taxRate') || 0}%):</span>
                        <span>${(form.watch('taxAmount') || 0).toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between py-2 font-bold text-lg">
                          <span>Total:</span>
                          <span>${(form.watch('grandTotal') || 0).toFixed(2)}</span>
                        </div>
                      </div>
                      {form.watch('paymentStatus') === 'partial' && (
                        <>
                          <div className="flex justify-between py-2 text-green-600">
                            <span>Amount Paid:</span>
                            <span>${(form.watch('amountPaid') || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between py-2 text-red-600 font-semibold">
                            <span>Balance Due:</span>
                            <span>${((form.watch('grandTotal') || 0) - (form.watch('amountPaid') || 0)).toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {form.watch('notes') && (
                  <div className="notes mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Notes:</h3>
                    <div className="bg-gray-50 p-4 rounded border">
                      <p className="text-sm">{form.watch('notes')}</p>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="footer text-center text-sm text-gray-600 border-t pt-4">
                  <p>Thank you for your business!</p>
                  <p>Payment Terms: {form.watch('paymentTerms') === '0' ? 'Due Immediately' : `Net ${form.watch('paymentTerms')} Days`}</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrintPreview(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateInvoice;