import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { insertExpenseSchema } from '@shared/schema';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import ReceiptDropzone from './ReceiptDropzone';
import { Category } from '@shared/schema';

// Extend the expense schema with client-side validation
const expenseFormSchema = z.object({
  userId: z.coerce.number(),
  date: z.string(),
  amount: z.coerce.number().positive({ message: 'Amount must be greater than 0' }),
  description: z.string().min(3, { message: 'Description must be at least 3 characters' }),
  category: z.string().min(1, { message: 'Please select a category' }),
  notes: z.string().optional(),
  receipt: z.instanceof(File).optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  onSuccess?: () => void;
  expenseId?: number; // For editing an existing expense
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSuccess, expenseId }) => {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories for select options
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Define default values
  const defaultValues: Partial<ExpenseFormValues> = {
    userId: 1, // Assuming the current user has ID 1
    date: new Date().toISOString().split('T')[0],
    amount: undefined,
    description: '',
    category: '',
    notes: '',
  };

  // Initialize the form
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues,
  });

  // Create expense mutation
  const createExpense = useMutation({
    mutationFn: async (data: ExpenseFormValues) => {
      // Create FormData if there's a receipt
      if (receiptFile) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && key !== 'receipt') {
            formData.append(key, value.toString());
          }
        });
        formData.append('receipt', receiptFile);
        
        const response = await fetch('/api/expenses', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create expense');
        }
        
        return response.json();
      } else {
        // No receipt, use JSON
        return apiRequest('POST', '/api/expenses', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({
        title: 'Success',
        description: 'Expense has been submitted for approval.',
      });
      form.reset();
      setReceiptFile(null);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to submit expense: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ExpenseFormValues) => {
    createExpense.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount ($)</FormLabel>
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
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Enter expense description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
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
                      <SelectItem key={category.id} value={category.name}>
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
          name="receipt"
          render={() => (
            <FormItem>
              <FormLabel>Receipt Upload</FormLabel>
              <FormControl>
                <ReceiptDropzone onFileChange={setReceiptFile} file={receiptFile} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional details about this expense..." 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              form.reset();
              setReceiptFile(null);
              if (onSuccess) onSuccess();
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createExpense.isPending}
          >
            {createExpense.isPending ? 'Submitting...' : 'Submit for Approval'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ExpenseForm;
