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
const quotationFormSchema = z.object({
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
  validUntil: z.string().default(''),
  notes: z.string().optional(),
});

type QuotationFormValues = z.infer<typeof quotationFormSchema>;

const CreateQuotation = () => {
  const { toast } = useToast();
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuotationPreview, setShowQuotationPreview] = useState(false);

  // Fetch customers
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<any[]>({
    queryKey: ['/api/customers', customerSearchTerm],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/customers?query=${encodeURIComponent(customerSearchTerm)}`);
      return await res.json();
    },
    enabled: customerSearchTerm.length > 0,
  });

  // Fetch products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<any[]>({
    queryKey: ['/api/products', productSearchTerm],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/products?query=${encodeURIComponent(productSearchTerm)}`);
      return await res.json();
    },
  });

  // Calculate default valid until date (30 days from now)
  const defaultValidUntil = () => {
    const today = new Date();
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);
    return format(thirtyDaysLater, 'yyyy-MM-dd');
  };

  // Set up the form
  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
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
      taxRate: 0,
      taxAmount: 0,
      grandTotal: 0,
      validUntil: defaultValidUntil(),
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: 'items',
    control: form.control,
  });

  // Watch form values for calculations
  const watchItems = form.watch('items');
  const watchTaxRate = form.watch('taxRate');

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

  // Mutation for creating a quotation
  const createQuotationMutation = useMutation({
    mutationFn: async (quotationData: any) => {
      const response = await apiRequest('POST', '/api/quotations', quotationData);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Quotation created',
        description: `Successfully created quotation #${data.quotationNumber || 'New'}`,
      });
      setIsSubmitting(false);
      setShowQuotationPreview(true);
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create quotation. Please try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });

  // Calculate subtotal, tax, and total whenever items or tax rate changes
  useEffect(() => {
    if (watchItems) {
      // Calculate item totals
      const updatedItems = watchItems.map(item => ({
        ...item,
        total: item.quantity * item.unitPrice,
      }));

      // Update items with calculated totals
      updatedItems.forEach((item, index) => {
        form.setValue(`items.${index}.total`, item.total);
      });

      // Calculate subtotal
      const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
      form.setValue('subtotal', subtotal);

      // Calculate tax amount
      const taxAmount = (subtotal * watchTaxRate) / 100;
      form.setValue('taxAmount', taxAmount);

      // Calculate grand total
      const grandTotal = subtotal + taxAmount;
      form.setValue('grandTotal', grandTotal);
    }
  }, [watchItems, watchTaxRate, form]);

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
  const onSubmit = (data: QuotationFormValues) => {
    setIsSubmitting(true);
    
    const quotationData = {
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
      validUntil: data.validUntil,
      notes: data.notes,
    };
    
    createQuotationMutation.mutate(quotationData);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Create Quotation</h1>
          <p className="text-muted-foreground">Create a new price quotation for a customer</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => window.history.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Quotation
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    placeholder="Company name"
                    {...form.register('customer.company')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Input
                    placeholder="Position"
                    {...form.register('customer.position')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    placeholder="Phone number"
                    {...form.register('customer.phone')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    placeholder="Email address"
                    type="email"
                    {...form.register('customer.email')}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Address</Label>
                  <Textarea
                    placeholder="Customer address"
                    className="resize-none"
                    rows={2}
                    {...form.register('customer.address')}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quotation Items */}
        <Card>
          <CardHeader>
            <CardTitle>Quotation Items</CardTitle>
            <CardDescription>
              Add products to this quotation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Product</TableHead>
                    <TableHead className="w-[100px]">Quantity</TableHead>
                    <TableHead className="w-[150px]">Unit Price</TableHead>
                    <TableHead className="w-[150px]">Total</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                            >
                              {form.watch(`items.${index}.productName`) || "Select product..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0">
                            <Command>
                              <CommandInput 
                                placeholder="Search product..." 
                                value={productSearchTerm}
                                onValueChange={setProductSearchTerm}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  {productSearchTerm.length > 0 ? 
                                    `No products found for "${productSearchTerm}"` : 
                                    "Type to search products..."}
                                </CommandEmpty>
                                <CommandGroup heading="Products">
                                  {products.map((product) => (
                                    <CommandItem
                                      key={product.id}
                                      value={product.name}
                                      onSelect={() => handleProductSelection(product.id, index)}
                                      className="flex items-center"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          form.watch(`items.${index}.productId`) === product.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span>{product.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {product.category || 'No category'} - {product.sku}
                                        </span>
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
                        <Input
                          type="number"
                          min="1"
                          {...form.register(`items.${index}.quantity`, {
                            valueAsNumber: true,
                          })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...form.register(`items.${index}.unitPrice`, {
                            valueAsNumber: true,
                          })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          readOnly
                          value={form.watch(`items.${index}.total`).toFixed(2)}
                          className="bg-muted"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProductRow}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quotation Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Quotation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Valid Until</Label>
                  <Input
                    type="date"
                    {...form.register('validUntil')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional notes for this quotation"
                    className="h-[120px]"
                    {...form.register('notes')}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between py-2">
                  <span className="font-medium">Subtotal:</span>
                  <span>${form.watch('subtotal').toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <Label>Tax Rate (%):</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    className="w-32"
                    {...form.register('taxRate', {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-medium">Tax Amount:</span>
                  <span>${form.watch('taxAmount').toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between py-2">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-lg font-bold">${form.watch('grandTotal').toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Create Customer Dialog */}
      <Dialog open={isCreatingCustomer} onOpenChange={setIsCreatingCustomer}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Customer</DialogTitle>
            <DialogDescription>
              Fill in the customer details below to create a new customer record.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Name *</Label>
              <Input
                id="customer-name"
                placeholder="Full name"
                {...form.register('customer.name')}
              />
              {form.formState.errors.customer?.name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.customer.name.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-company">Company</Label>
                <Input
                  id="customer-company"
                  placeholder="Company name"
                  {...form.register('customer.company')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-position">Position</Label>
                <Input
                  id="customer-position"
                  placeholder="Job title"
                  {...form.register('customer.position')}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Phone</Label>
                <Input
                  id="customer-phone"
                  placeholder="Phone number"
                  {...form.register('customer.phone')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-email">Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  placeholder="Email address"
                  {...form.register('customer.email')}
                />
                {form.formState.errors.customer?.email && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.customer.email.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-sector">Sector</Label>
                <Input
                  id="customer-sector"
                  placeholder="Business sector"
                  {...form.register('customer.sector')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-address">Address</Label>
              <Textarea
                id="customer-address"
                placeholder="Full address"
                {...form.register('customer.address')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreatingCustomer(false)}
              disabled={createCustomerMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(handleCustomerCreation)}
              disabled={createCustomerMutation.isPending}
            >
              {createCustomerMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quotation Preview Dialog */}
      <Dialog open={showQuotationPreview} onOpenChange={setShowQuotationPreview}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Quotation Preview</span>
              <div className="flex items-center space-x-2">
                <Button size="icon" variant="outline">
                  <Printer className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => setShowQuotationPreview(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="border rounded-lg p-8 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-blue-800">QUOTATION</h2>
                <p className="text-gray-500">Quotation # [Auto-generated]</p>
                <p className="text-gray-500">Date: {format(new Date(), 'dd/MM/yyyy')}</p>
                <p className="text-gray-500">Valid Until: {form.watch('validUntil')}</p>
              </div>
              <div className="text-right">
                <h3 className="font-bold text-xl">PharmaOverseas</h3>
                <p>123 Pharma Street</p>
                <p>Medical City, MC 12345</p>
                <p>+1 (555) 123-4567</p>
                <p>info@pharmaoverseas.com</p>
              </div>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-gray-700">Quotation To:</h4>
                <p className="font-bold">{form.watch('customer.name')}</p>
                {form.watch('customer.company') && (
                  <p>{form.watch('customer.company')}</p>
                )}
                {form.watch('customer.address') && (
                  <p>{form.watch('customer.address')}</p>
                )}
                {form.watch('customer.phone') && (
                  <p>Phone: {form.watch('customer.phone')}</p>
                )}
                {form.watch('customer.email') && (
                  <p>Email: {form.watch('customer.email')}</p>
                )}
              </div>
            </div>
            
            <div className="mt-8">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="w-[40px]">#</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.watch('items').map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">${parseFloat(item.unitPrice.toString()).toFixed(2)}</TableCell>
                      <TableCell className="text-right">${parseFloat(item.total.toString()).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-4 flex justify-end">
              <div className="w-1/3">
                <div className="flex justify-between py-2">
                  <span className="font-medium">Subtotal:</span>
                  <span>${form.watch('subtotal').toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-medium">Tax ({form.watch('taxRate')}%):</span>
                  <span>${form.watch('taxAmount').toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-200 mt-2">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-lg font-bold">${form.watch('grandTotal').toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {form.watch('notes') && (
              <div className="mt-8 border-t border-gray-200 pt-4">
                <h4 className="font-semibold mb-2">Notes:</h4>
                <p className="text-gray-700">{form.watch('notes')}</p>
              </div>
            )}
            
            <div className="mt-8 border-t border-gray-200 pt-4 text-center text-gray-500 text-sm">
              <p>Thank you for your business!</p>
              <p>This is a computer-generated document and requires no signature.</p>
              <p>Terms and conditions apply. This quotation is valid until {form.watch('validUntil')}.</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowQuotationPreview(false);
                // Reset form
                form.reset();
              }}
            >
              Close and Create New
            </Button>
            <Button onClick={() => window.location.href = "/"}>
              Go to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateQuotation;