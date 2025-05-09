import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ProductionOrderFields from './ProductionOrderFields';
import RefiningOrderFields from './RefiningOrderFields';

interface OrderFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

interface Material {
  id: number;
  name: string;
  quantity: number;
  unitPrice: string;
  unitOfMeasure?: string;
}

const OrderForm: React.FC<OrderFormProps> = ({ onCancel, onSuccess }) => {
  const { toast } = useToast();
  const [orderType, setOrderType] = useState<'production' | 'refining'>('production');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Shared state
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  // Production order state
  const [batchNumber, setBatchNumber] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([]);
  const [productDescription, setProductDescription] = useState('');
  const [totalPrice, setTotalPrice] = useState('0.00');
  
  // Refining order state
  const [refiningBatchNumber, setRefiningBatchNumber] = useState('');
  const [sourceType, setSourceType] = useState('production');
  const [selectedProductionOrder, setSelectedProductionOrder] = useState('');
  const [selectedStockItem, setSelectedStockItem] = useState('');
  const [refiningSteps, setRefiningSteps] = useState<string[]>([]);
  const [expectedOutput, setExpectedOutput] = useState('');
  const [costAdjustments, setCostAdjustments] = useState('0.00');
  
  // Calculate total price whenever materials change
  useEffect(() => {
    const total = selectedMaterials.reduce((sum, material) => {
      const quantity = parseFloat(material.quantity.toString()) || 0;
      const unitPrice = parseFloat(material.unitPrice) || 0;
      return sum + (quantity * unitPrice);
    }, 0);
    
    setTotalPrice(total.toFixed(2));
  }, [selectedMaterials]);
  
  const handleTabChange = (value: string) => {
    setOrderType(value as 'production' | 'refining');
  };
  
  const validateProductionOrder = () => {
    if (!selectedCustomer) {
      toast({
        title: "Validation Error",
        description: "Please select a customer",
        variant: "destructive",
      });
      return false;
    }
    
    if (!batchNumber) {
      toast({
        title: "Validation Error",
        description: "Please provide a batch number",
        variant: "destructive",
      });
      return false;
    }
    
    if (selectedMaterials.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one material",
        variant: "destructive",
      });
      return false;
    }
    
    if (!productDescription) {
      toast({
        title: "Validation Error",
        description: "Please provide a product description",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const validateRefiningOrder = () => {
    if (!selectedCustomer) {
      toast({
        title: "Validation Error",
        description: "Please select a customer",
        variant: "destructive",
      });
      return false;
    }
    
    if (!refiningBatchNumber) {
      toast({
        title: "Validation Error",
        description: "Please provide a batch number",
        variant: "destructive",
      });
      return false;
    }
    
    if (sourceType === 'production' && !selectedProductionOrder) {
      toast({
        title: "Validation Error",
        description: "Please select a production order",
        variant: "destructive",
      });
      return false;
    }
    
    if (sourceType === 'stock' && !selectedStockItem) {
      toast({
        title: "Validation Error",
        description: "Please select a stock item",
        variant: "destructive",
      });
      return false;
    }
    
    if (refiningSteps.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one refining step",
        variant: "destructive",
      });
      return false;
    }
    
    if (!expectedOutput) {
      toast({
        title: "Validation Error",
        description: "Please describe the expected output",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async () => {
    let isValid = false;
    
    if (orderType === 'production') {
      isValid = validateProductionOrder();
    } else {
      isValid = validateRefiningOrder();
    }
    
    if (!isValid) return;
    
    setIsSubmitting(true);
    
    try {
      // Prepare order data
      const orderData = orderType === 'production'
        ? {
            orderType: 'production',
            batchNumber,
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            materials: selectedMaterials,
            finalProduct: productDescription,
            totalMaterialCost: totalPrice,
            totalAdditionalFees: '0.00',
            totalCost: totalPrice,
          }
        : {
            orderType: 'refining',
            batchNumber: refiningBatchNumber,
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            sourceType,
            sourceId: sourceType === 'production' ? selectedProductionOrder : selectedStockItem,
            refiningSteps: refiningSteps.join('||'),
            expectedOutput,
            totalMaterialCost: '0.00',
            totalAdditionalFees: costAdjustments,
            totalCost: costAdjustments,
          };
      
      // Send API request
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create order: ${response.statusText}`);
      }
      
      toast({
        title: "Success",
        description: `${orderType === 'production' ? 'Production' : 'Refining'} order created successfully`,
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create order",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="production" onValueChange={handleTabChange}>
        <TabsList className="grid w-[500px] grid-cols-2 mb-6">
          <TabsTrigger value="production">Production Order</TabsTrigger>
          <TabsTrigger value="refining">Refining Process</TabsTrigger>
        </TabsList>
        
        <TabsContent value="production" className="space-y-6">
          <ProductionOrderFields
            batchNumber={batchNumber}
            onBatchNumberChange={setBatchNumber}
            selectedCustomer={selectedCustomer}
            onCustomerSelect={setSelectedCustomer}
            selectedMaterials={selectedMaterials}
            onMaterialsChange={setSelectedMaterials}
            productDescription={productDescription}
            onProductDescriptionChange={setProductDescription}
            totalPrice={totalPrice}
          />
        </TabsContent>
        
        <TabsContent value="refining" className="space-y-6">
          <RefiningOrderFields
            batchNumber={refiningBatchNumber}
            onBatchNumberChange={setRefiningBatchNumber}
            selectedCustomer={selectedCustomer}
            onCustomerSelect={setSelectedCustomer}
            sourceType={sourceType}
            onSourceTypeChange={setSourceType}
            selectedProductionOrder={selectedProductionOrder}
            onProductionOrderSelect={setSelectedProductionOrder}
            selectedStockItem={selectedStockItem}
            onStockItemSelect={setSelectedStockItem}
            refiningSteps={refiningSteps}
            onRefiningStepsChange={setRefiningSteps}
            expectedOutput={expectedOutput}
            onExpectedOutputChange={setExpectedOutput}
            costAdjustments={costAdjustments}
            onCostAdjustmentsChange={setCostAdjustments}
          />
        </TabsContent>
      </Tabs>
      
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting && (
            <span className="mr-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
          )}
          Create {orderType === 'production' ? 'Production' : 'Refining'} Order
        </Button>
      </div>
    </div>
  );
};

export default OrderForm;