import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import ProductionOrderFields from './ProductionOrderFields';
import RefiningOrderFields from './RefiningOrderFields';
import AdditionalFeesSection from './AdditionalFeesSection';
import OrderSummary from './OrderSummary';

interface OrderFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ onCancel, onSuccess }) => {
  const [orderType, setOrderType] = useState<'production' | 'refining'>('production');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [additionalFees, setAdditionalFees] = useState<any[]>([]);
  const [targetProduct, setTargetProduct] = useState<any>(null);
  const [expectedOutputQuantity, setExpectedOutputQuantity] = useState<string>('');
  const [refiningSteps, setRefiningSteps] = useState<string>('');
  
  const { toast } = useToast();

  // Base schema for both order types
  const formSchema = z.object({
    customerId: z.string().min(1, 'Customer is required'),
    description: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: '',
      description: '',
    },
  });

  // Fetch customers for the dropdown
  const { data: customers } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      return response.json();
    }
  });

  // Handle customer selection
  const handleCustomerChange = (value: string) => {
    setSelectedCustomerId(Number(value));
    form.setValue('customerId', value);
  };

  // Calculate totals
  const calculateTotals = () => {
    const materialCost = orderItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
    const feesTotal = additionalFees.reduce((sum, fee) => sum + Number(fee.amount), 0);
    const totalCost = materialCost + feesTotal;
    
    return {
      materialCost: materialCost.toFixed(2),
      feesTotal: feesTotal.toFixed(2),
      totalCost: totalCost.toFixed(2)
    };
  };

  const totals = calculateTotals();

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (orderItems.length === 0) {
        toast({
          title: 'Material items required',
          description: 'Please add at least one material item to the order',
          variant: 'destructive',
        });
        return;
      }

      // Prepare the data based on order type
      const orderData = {
        orderType,
        customerId: Number(values.customerId),
        description: values.description || '',
        items: orderItems,
        fees: additionalFees,
        totalMaterialCost: totals.materialCost,
        totalAdditionalFees: totals.feesTotal,
        totalCost: totals.totalCost,
      };

      // Add production-specific fields
      if (orderType === 'production' && targetProduct) {
        Object.assign(orderData, {
          targetProductId: targetProduct.id,
          expectedOutputQuantity: expectedOutputQuantity,
        });
      }
      
      // Add refining-specific fields
      if (orderType === 'refining') {
        Object.assign(orderData, {
          refiningSteps: refiningSteps,
        });
      }

      // Send the data to the server
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      toast({
        title: 'Order created',
        description: 'Your order has been created successfully',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create order',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="production" onValueChange={(value) => setOrderType(value as 'production' | 'refining')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="production">Production Order</TabsTrigger>
          <TabsTrigger value="refining">Refining Order</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
            {/* Common Fields for Both Order Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select
                      onValueChange={handleCustomerChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name} ({customer.company})
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional details about this order"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Order Type Specific Fields */}
            <TabsContent value="production" className="space-y-6 border p-4 rounded-lg">
              <ProductionOrderFields 
                orderItems={orderItems} 
                setOrderItems={setOrderItems}
                targetProduct={targetProduct}
                setTargetProduct={setTargetProduct}
                expectedOutputQuantity={expectedOutputQuantity}
                setExpectedOutputQuantity={setExpectedOutputQuantity}
              />
            </TabsContent>

            <TabsContent value="refining" className="space-y-6 border p-4 rounded-lg">
              <RefiningOrderFields 
                orderItems={orderItems} 
                setOrderItems={setOrderItems}
                refiningSteps={refiningSteps}
                setRefiningSteps={setRefiningSteps}
              />
            </TabsContent>

            {/* Additional Fees Section (Common for both types) */}
            <AdditionalFeesSection 
              additionalFees={additionalFees} 
              setAdditionalFees={setAdditionalFees} 
            />

            {/* Order Summary */}
            <OrderSummary 
              materialCost={totals.materialCost}
              feesTotal={totals.feesTotal}
              totalCost={totals.totalCost}
            />

            {/* Form Actions */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                Create Order
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  );
};

export default OrderForm;