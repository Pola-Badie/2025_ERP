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
import { format, addDays } from 'date-fns';
import { Check, ChevronsUpDown, Loader2, Plus, Trash, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Calendar } from '@/components/ui/calendar';

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
    uom: z.string().optional(),
  })).min(1, 'At least one item is required'),
  subtotal: z.number(),
  taxRate: z.number().min(0).max(100),
  taxAmount: z.number(),
  grandTotal: z.number(),
  validUntil: z.date(),
  notes: z.string().optional(),
});

type QuotationFormValues = z.infer<typeof quotationFormSchema>;

const CreateQuotation: React.FC = () => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 30));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openCustomerSelect, setOpenCustomerSelect] = useState(false);
  const [openProductSelect, setOpenProductSelect] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Type definition for Product and Customer
  interface Product {
    id: number;
    name: string;
    drugName?: string;
    sellingPrice: number | string;
    [key: string]: any;
  }

  interface Customer {
    id: number;
    name: string;
    companyName?: string;
    position?: string;
    email: string;
    phone: string;
    sector?: string;
    address: string;
    [key: string]: any;
  }

  // Fetch customers
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ['/api/customers', customerSearchTerm],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/customers?query=${encodeURIComponent(customerSearchTerm)}`);
      return await res.json();
    },
    enabled: customerSearchTerm.length > 0,
  });

  // Fetch products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products', productSearchTerm],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/products?query=${encodeURIComponent(productSearchTerm)}`);
      return await res.json();
    },
  });

  // Form setup with react-hook-form and zod validation
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
      items: [],
      subtotal: 0,
      taxRate: 0,
      taxAmount: 0,
      grandTotal: 0,
      validUntil: addDays(new Date(), 30),
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Calculate totals whenever items change
  React.useEffect(() => {
    const items = form.getValues('items');
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxRate = form.getValues('taxRate') || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const grandTotal = subtotal + taxAmount;

    form.setValue('subtotal', subtotal);
    form.setValue('taxAmount', taxAmount);
    form.setValue('grandTotal', grandTotal);
  }, [form.watch('items'), form.watch('taxRate')]);

  // Set the validUntil date when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      form.setValue('validUntil', selectedDate);
    }
  }, [selectedDate, form]);

  // Mutation for creating a quotation
  const createQuotationMutation = useMutation({
    mutationFn: async (data: QuotationFormValues) => {
      const response = await apiRequest('POST', '/api/quotations', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
      toast({
        title: 'Success',
        description: 'Quotation created successfully',
      });
      form.reset({
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
        items: [],
        subtotal: 0,
        taxRate: 0,
        taxAmount: 0,
        grandTotal: 0,
        validUntil: addDays(new Date(), 30),
        notes: '',
      });
      setSelectedDate(addDays(new Date(), 30));
    },
    onError: (error) => {
      console.error('Error creating quotation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create quotation. Please try again.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const onSubmit = (data: QuotationFormValues) => {
    console.log('Submitting quotation:', data);
    setIsSubmitting(true);
    createQuotationMutation.mutate(data);
  };

  // Add item to quotation
  const handleAddItem = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    // If we're editing an existing item
    if (selectedItemIndex !== null) {
      const items = form.getValues('items');
      items[selectedItemIndex] = {
        productId,
        productName: product.name,
        quantity: 1,
        unitPrice: parseFloat(product.sellingPrice.toString()),
        total: parseFloat(product.sellingPrice.toString()),
      };
      form.setValue('items', items);
      setSelectedItemIndex(null);
    } else {
      // Add new item
      append({
        productId,
        productName: product.name,
        quantity: 1,
        unitPrice: parseFloat(product.sellingPrice.toString()),
        total: parseFloat(product.sellingPrice.toString()),
      });
    }
    setOpenProductSelect(false);
  };

  // Update item quantity and recalculate total
  const updateItemQuantity = (index: number, quantity: number) => {
    const items = form.getValues('items');
    items[index].quantity = quantity;
    items[index].total = quantity * items[index].unitPrice;
    form.setValue('items', items);
  };
  
  // Update item unit price and recalculate total
  const updateItemUnitPrice = (index: number, unitPrice: number) => {
    const items = form.getValues('items');
    items[index].unitPrice = unitPrice;
    items[index].total = items[index].quantity * unitPrice;
    form.setValue('items', items);
  };

  // Select customer
  const handleSelectCustomer = (customerId: number) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      form.setValue('customer', {
        id: customer.id,
        name: customer.name,
        company: customer.companyName || '',
        position: customer.position || '',
        email: customer.email,
        phone: customer.phone,
        sector: customer.sector || '',
        address: customer.address,
      });
      setOpenCustomerSelect(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Create Quotation</CardTitle>
          <CardDescription>
            Create a new quotation for a customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Customer Selection */}
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Popover open={openCustomerSelect} onOpenChange={setOpenCustomerSelect}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCustomerSelect}
                      className="w-full justify-between"
                    >
                      {form.watch('customer.name') || 'Select customer...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search customers..." />
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.name}
                            onSelect={() => handleSelectCustomer(customer.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                form.watch('customer.id') === customer.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {customer.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Valid Until Date */}
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <div className="relative">
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setCalendarOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Quotation Items */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Quotation Items</CardTitle>
                <CardDescription>
                  Add products to this quotation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4">
                  <div className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        append({
                          productId: 0,
                          productName: '',
                          quantity: 1,
                          unitPrice: 0,
                          total: 0,
                          uom: 'unit',
                        });
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Product</TableHead>
                        <TableHead className="w-[100px] text-center">UoM</TableHead>
                        <TableHead className="w-[80px] text-right">Quantity</TableHead>
                        <TableHead className="w-[120px] text-right">Unit Price</TableHead>
                        <TableHead className="w-[120px] text-right">Total</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                            No items added yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        fields.map((field, index) => (
                          <TableRow key={field.id}>
                            <TableCell>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                  >
                                    {form.watch(`items.${index}.productName`) || "Select a product..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                  <Command>
                                    <CommandInput 
                                      placeholder="Search products..." 
                                      value={productSearchTerm}
                                      onValueChange={(value) => {
                                        setProductSearchTerm(value);
                                        const searchTerm = value.toLowerCase();
                                        setFilteredProducts(
                                          products.filter(p => 
                                            p.name.toLowerCase().includes(searchTerm) || 
                                            (p.drugName && p.drugName.toLowerCase().includes(searchTerm))
                                          )
                                        );
                                      }}
                                      className="h-9" 
                                    />
                                    <CommandList>
                                      <CommandEmpty>
                                        <p className="py-3 text-center text-sm">No products found</p>
                                      </CommandEmpty>
                                      <CommandGroup heading="Products">
                                        {(filteredProducts.length > 0 ? filteredProducts : products).map((product) => (
                                          <CommandItem
                                            key={product.id}
                                            onSelect={() => {
                                              const items = form.getValues('items');
                                              items[index] = {
                                                productId: product.id,
                                                productName: product.name,
                                                quantity: 1,
                                                unitPrice: parseFloat(product.sellingPrice.toString()),
                                                total: parseFloat(product.sellingPrice.toString()),
                                                uom: product.uom || 'unit',
                                              };
                                              form.setValue('items', items);
                                            }}
                                            className="flex items-center justify-between"
                                          >
                                            <div>
                                              <span className="font-medium">{product.name}</span>
                                              <span className="ml-2 text-sm text-muted-foreground">
                                                {new Intl.NumberFormat('en-US', {
                                                  style: 'currency',
                                                  currency: 'USD'
                                                }).format(parseFloat(product.sellingPrice.toString()))}
                                              </span>
                                            </div>
                                            <Check
                                              className={cn(
                                                "ml-auto h-4 w-4",
                                                form.watch(`items.${index}.productId`) === product.id
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
                            <TableCell className="text-center">
                              <Select
                                value={form.watch(`items.${index}.uom`) || 'unit'}
                                onValueChange={(value) => {
                                  const items = form.getValues('items');
                                  items[index].uom = value;
                                  form.setValue('items', items);
                                }}
                              >
                                <SelectTrigger className="w-[150px]">
                                  <SelectValue placeholder="Select UoM" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unit">Unit</SelectItem>
                                  <SelectItem value="pieces">Pieces (PCS)</SelectItem>
                                  <SelectItem value="liters">Liters (L)</SelectItem>
                                  <SelectItem value="tons">Tons (T)</SelectItem>
                                  <SelectItem value="kilograms">Kilograms (KG)</SelectItem>
                                  <SelectItem value="grams">Grams (g)</SelectItem>
                                  <SelectItem value="milligrams">Milligrams (mg)</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                min={1}
                                value={form.watch(`items.${index}.quantity`)}
                                onChange={(e) => {
                                  // This approach prevents the "0" issue while keeping arrows
                                  const value = parseInt(e.target.value);
                                  if (isNaN(value) || value < 1) {
                                    updateItemQuantity(index, 1);
                                  } else {
                                    updateItemQuantity(index, value);
                                  }
                                }}
                                className="w-16 text-right ml-auto"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                value={form.watch(`items.${index}.unitPrice`)}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value);
                                  if (isNaN(value) || value < 0) {
                                    updateItemUnitPrice(index, 0);
                                  } else {
                                    updateItemUnitPrice(index, value);
                                  }
                                }}
                                className="w-24 text-right ml-auto"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD'
                              }).format(form.watch(`items.${index}.total`))}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <div className="mb-6">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add notes to this quotation..."
                className="mt-1"
                {...form.register('notes')}
              />
            </div>

            {/* Tax and Totals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min={0}
                  max={100}
                  {...form.register('taxRate', { valueAsNumber: true })}
                  className="mt-1"
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>${form.watch('subtotal').toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({form.watch('taxRate')}%):</span>
                  <span>${form.watch('taxAmount').toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${form.watch('grandTotal').toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Create Quotation
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateQuotation;