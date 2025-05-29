import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Define the form schema with the expiry date field
const productFormSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  drugName: z.string().min(3, { message: 'Drug name must be at least 3 characters' }),
  categoryId: z.coerce.number().positive({ message: 'Please select a category' }),
  sku: z.string().min(1, { message: 'SKU is required' }),
  gs1Code: z.string().optional(),
  description: z.string().optional(),
  quantity: z.coerce.number().int().nonnegative({ message: 'Quantity must be a non-negative integer' }),
  unitOfMeasure: z.string().min(1, { message: 'Please select a unit of measure' }),
  lowStockThreshold: z.coerce.number().int().nonnegative({ message: 'Low stock threshold must be a non-negative integer' }),
  reorderLevel: z.coerce.number().int().nonnegative().optional(),
  maxStockLevel: z.coerce.number().int().nonnegative().optional(),
  criticalLevel: z.coerce.number().int().nonnegative().optional(),
  alertFrequency: z.string().optional(),
  costPrice: z.coerce.number().positive({ message: 'Cost price must be greater than 0' }),
  sellingPrice: z.coerce.number().positive({ message: 'Selling price must be greater than 0' }),
  location: z.string().optional(),
  shelf: z.string().optional(),
  expiryDate: z.string().optional(),
  status: z.string().default('active'),
  productType: z.string().default('finished'),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  onSuccess?: () => void;
  productId?: number; // For editing an existing product
  initialData?: any; // For populating form with existing product data
}

interface Category {
  id: number;
  name: string;
  description: string | null;
}

const ProductForm: React.FC<ProductFormProps> = ({ onSuccess, productId, initialData }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Warehouse data - would normally come from an API endpoint
  const [warehouses] = useState([
    { id: 1, name: 'Warehouse 1', location: 'Cairo' },
    { id: 2, name: 'Warehouse 2', location: 'Alexandria' },
    { id: 3, name: 'Warehouse 3', location: 'Giza' },
    { id: 4, name: 'Warehouse 4', location: 'Aswan' },
    { id: 5, name: 'Warehouse 5', location: 'Luxor' },
    { id: 6, name: 'Warehouse 6', location: 'Port Said' },
  ]);

  // Fetch categories for select options
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Define default values, populating from initialData if provided
  const defaultValues: Partial<ProductFormValues> = {
    name: initialData?.name || '',
    drugName: initialData?.drugName || '',
    categoryId: initialData?.categoryId || 0,
    sku: initialData?.sku || '',
    gs1Code: initialData?.gs1Code || '',
    description: initialData?.description || '',
    quantity: initialData?.quantity || 0,
    unitOfMeasure: initialData?.unitOfMeasure || 'PCS',
    lowStockThreshold: initialData?.lowStockThreshold || 10,
    reorderLevel: initialData?.reorderLevel || 25,
    maxStockLevel: initialData?.maxStockLevel || 250,
    criticalLevel: initialData?.criticalLevel || 5,
    alertFrequency: initialData?.alertFrequency || 'daily',
    costPrice: initialData?.costPrice || 0,
    sellingPrice: initialData?.sellingPrice || 0,
    location: initialData?.location || '',
    shelf: initialData?.shelf || '',
    expiryDate: initialData?.expiryDate || '',
    status: initialData?.status || 'active',
    productType: initialData?.productType || 'finished',
  };

  // Initialize the form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  // Create product mutation
  const createProduct = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      // Create a new FormData instance for file uploads if needed
      return apiRequest('POST', '/api/products', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Success',
        description: 'Product has been added successfully.',
      });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add product: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Update product mutation
  const updateProduct = useMutation({
    mutationFn: async (data: ProductFormValues & { id: number }) => {
      return apiRequest('PATCH', `/api/products/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Success',
        description: 'Product has been updated successfully.',
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update product: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    // Create a clean object with only the fields needed for API submission using the specified format
    const formattedData = {
      name: data.name,
      drugName: data.drugName,
      categoryId: data.categoryId.toString(),
      sku: data.sku,
      gs1Code: data.gs1Code || '',
      description: data.description || '',
      quantity: parseFloat(data.quantity.toString()),
      lowStockThreshold: parseInt(data.lowStockThreshold.toString()),
      costPrice: parseFloat(data.costPrice.toString()),
      sellingPrice: parseFloat(data.sellingPrice.toString()),
      unitOfMeasure: data.unitOfMeasure,
      location: data.location || '',
      shelf: data.shelf || '',
      status: data.status || 'active',
      productType: data.productType || 'finished',
      // Format date as YYYY-MM-DD if it exists
      ...(data.expiryDate ? { 
        expiryDate: new Date(data.expiryDate).toISOString().split('T')[0]
      } : {})
    };
    
    if (initialData?.id) {
      // If we have an ID, we're updating an existing product
      updateProduct.mutate({ 
        ...formattedData, 
        id: initialData.id 
      } as any);
    } else {
      // Otherwise we're creating a new product
      createProduct.mutate(formattedData as any);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter product name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="drugName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Drug Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter pharmaceutical name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(Number(value))} 
                  value={field.value ? field.value.toString() : "0"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingCategories ? (
                      <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                    ) : (
                      categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Batch No.</FormLabel>
                <FormControl>
                  <Input placeholder="Enter SKU (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="gs1Code"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                GS1 Code 
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">
                  ETA Compatible
                </span>
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter GS1 Code for ETA compliance (optional)" 
                  {...field}
                  value={field.value || ''}
                  className="font-mono"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Product description..." 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    min="0"
                    step="1"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="unitOfMeasure"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit of Measure</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="L">Liters (L)</SelectItem>
                    <SelectItem value="PCS">Pieces (PCS)</SelectItem>
                    <SelectItem value="T">Tons (T)</SelectItem>
                    <SelectItem value="KG">Kilograms (KG)</SelectItem>
                    <SelectItem value="g">Grams (g)</SelectItem>
                    <SelectItem value="mg">Milligrams (mg)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="lowStockThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Low Stock Threshold</FormLabel>
                <div className="flex space-x-2">
                  <Select 
                    onValueChange={(value) => {
                      if (value !== 'custom') {
                        field.onChange(parseInt(value));
                      }
                    }} 
                    value={field.value ? field.value.toString() : ''}
                  >
                    <FormControl>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select threshold" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="5">Very Low (5 units)</SelectItem>
                      <SelectItem value="10">Low (10 units)</SelectItem>
                      <SelectItem value="20">Medium (20 units)</SelectItem>
                      <SelectItem value="50">High (50 units)</SelectItem>
                      <SelectItem value="100">Very High (100 units)</SelectItem>
                      <SelectItem value="custom">Custom Amount</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    type="number" 
                    placeholder="Custom" 
                    min="0"
                    step="1"
                    className="w-24"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
          
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="costPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Price ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    step="0.01" 
                    min="0"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="sellingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    step="0.01" 
                    min="0"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Warehouse</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.name}>
                        {warehouse.name} - {warehouse.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="shelf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shelf Number/ID</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="S-101, Rack-3, etc." 
                    {...field} 
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="expiryDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Expiry Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(new Date(field.value), "dd/MM/yy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : '')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">In Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="near">Near Expiry</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="productType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="raw">Raw Material</SelectItem>
                    <SelectItem value="semi-raw">Semi-Raw Material</SelectItem>
                    <SelectItem value="finished">Finished Product</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              form.reset();
              if (onSuccess) onSuccess();
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createProduct.isPending || updateProduct.isPending}
          >
            {createProduct.isPending || updateProduct.isPending 
              ? 'Saving...' 
              : initialData?.id 
                ? 'Update Product' 
                : 'Save Product'
            }
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;