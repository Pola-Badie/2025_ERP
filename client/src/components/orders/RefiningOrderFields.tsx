import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import CustomerSearch from './CustomerSearch';
import CustomerDetails from './CustomerDetails';
import BatchNumberField from './BatchNumberField';

interface RefiningOrderFieldsProps {
  batchNumber: string;
  onBatchNumberChange: (value: string) => void;
  selectedCustomer: any;
  onCustomerSelect: (customer: any) => void;
  sourceType: string;
  onSourceTypeChange: (value: string) => void;
  selectedProductionOrder: string;
  onProductionOrderSelect: (orderId: string) => void;
  selectedStockItem: string;
  onStockItemSelect: (productId: string) => void;
  refiningSteps: string[];
  onRefiningStepsChange: (steps: string[]) => void;
  expectedOutput: string;
  onExpectedOutputChange: (value: string) => void;
  costAdjustments: string;
  onCostAdjustmentsChange: (value: string) => void;
}

const RefiningOrderFields: React.FC<RefiningOrderFieldsProps> = ({
  batchNumber,
  onBatchNumberChange,
  selectedCustomer,
  onCustomerSelect,
  sourceType,
  onSourceTypeChange,
  selectedProductionOrder,
  onProductionOrderSelect,
  selectedStockItem,
  onStockItemSelect,
  refiningSteps,
  onRefiningStepsChange,
  expectedOutput,
  onExpectedOutputChange,
  costAdjustments,
  onCostAdjustmentsChange
}) => {
  const [productionOrders, setProductionOrders] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch production orders and semi-finished products
  useEffect(() => {
    setIsLoading(true);
    
    // Fetch production orders
    fetch('/api/orders?orderType=production')
      .then(response => response.json())
      .then(data => {
        setProductionOrders(data || []);
      })
      .catch(error => {
        console.error('Error fetching production orders:', error);
        // Fallback data for demo
        setProductionOrders([
          { id: 1, orderNumber: 'PROD-000001', finalProduct: 'Sample Production 1' },
          { id: 2, orderNumber: 'PROD-000002', finalProduct: 'Sample Production 2' }
        ]);
      });
    
    // Fetch semi-finished products
    fetch('/api/products/semi-finished')
      .then(response => response.json())
      .then(data => {
        setStockItems(data || []);
      })
      .catch(error => {
        console.error('Error fetching semi-finished products:', error);
      })
      .finally(() => setIsLoading(false));
  }, []);
  
  const addRefiningStep = () => {
    onRefiningStepsChange([...refiningSteps, '']);
  };
  
  const updateRefiningStep = (index: number, value: string) => {
    const newSteps = [...refiningSteps];
    newSteps[index] = value;
    onRefiningStepsChange(newSteps);
  };
  
  const removeRefiningStep = (index: number) => {
    onRefiningStepsChange(refiningSteps.filter((_, i) => i !== index));
  };
  
  const getSourceMaterialName = () => {
    if (sourceType === 'production') {
      const order = productionOrders.find(o => o.id.toString() === selectedProductionOrder);
      return order?.finalProduct || '';
    } else {
      const product = stockItems.find(p => p.id.toString() === selectedStockItem);
      return product?.name || '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Batch Number */}
          <BatchNumberField 
            orderType="refining"
            value={batchNumber}
            onChange={onBatchNumberChange}
          />
          
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <CustomerSearch 
              selectedCustomer={selectedCustomer} 
              onCustomerSelect={onCustomerSelect}
            />
            {selectedCustomer && <CustomerDetails customer={selectedCustomer} />}
          </div>
          
          {/* Source Type Selection */}
          <div className="space-y-3">
            <Label>Source Material</Label>
            <RadioGroup 
              value={sourceType} 
              onValueChange={onSourceTypeChange}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="production" id="production" />
                <Label htmlFor="production">From Production Order</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="stock" id="stock" />
                <Label htmlFor="stock">From Stock</Label>
              </div>
            </RadioGroup>
            
            {/* Source Selection based on type */}
            <div className="pt-2">
              {sourceType === 'production' ? (
                <>
                  <Label htmlFor="productionOrder" className="mb-1 block">Production Order</Label>
                  <Select 
                    value={selectedProductionOrder}
                    onValueChange={onProductionOrderSelect}
                    disabled={isLoading || productionOrders.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a production order" />
                    </SelectTrigger>
                    <SelectContent>
                      {productionOrders.length > 0 ? (
                        productionOrders.map(order => (
                          <SelectItem key={order.id} value={order.id.toString()}>
                            {order.orderNumber} - {order.finalProduct || 'N/A'}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No production orders available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <>
                  <Label htmlFor="stockItem" className="mb-1 block">Stock Item</Label>
                  <Select 
                    value={selectedStockItem}
                    onValueChange={onStockItemSelect}
                    disabled={isLoading || stockItems.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a stock item" />
                    </SelectTrigger>
                    <SelectContent>
                      {stockItems.length > 0 ? (
                        stockItems.map(item => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.name} {item.unitOfMeasure ? `(${item.unitOfMeasure})` : ''}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No semi-finished products available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>
          
          {/* Expected Output */}
          <div className="space-y-2">
            <Label htmlFor="expectedOutput">Expected Output</Label>
            <Textarea
              id="expectedOutput"
              placeholder="Describe the expected output after refining..."
              value={expectedOutput}
              onChange={(e) => onExpectedOutputChange(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Refining Steps */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Refining Process Steps</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addRefiningStep}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </div>
            
            {refiningSteps.length > 0 ? (
              <div className="space-y-3">
                {refiningSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="flex-grow">
                      <Textarea
                        value={step}
                        onChange={(e) => updateRefiningStep(index, e.target.value)}
                        placeholder={`Step ${index + 1}`}
                        rows={2}
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeRefiningStep(index)}
                      className="mt-1"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border rounded-md text-muted-foreground">
                No refining steps added. Click "Add Step" to begin.
              </div>
            )}
          </div>
          
          {/* Cost Adjustments */}
          <div className="space-y-2">
            <Label htmlFor="costAdjustments">Additional Cost</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
              <Input
                id="costAdjustments"
                value={costAdjustments}
                onChange={(e) => onCostAdjustmentsChange(e.target.value)}
                className="pl-8"
                placeholder="0.00"
              />
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="space-y-2">
            <Label>Order Summary</Label>
            <Card className="border border-blue-100">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Source Material:</div>
                    <div className="font-medium">{getSourceMaterialName() || 'Not selected'}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Process:</div>
                    <div className="font-medium">{refiningSteps.length} step(s)</div>
                  </div>
                  
                  <div className="pt-2 border-t flex justify-between text-lg font-bold">
                    <span>Total Cost:</span>
                    <span>${costAdjustments || '0.00'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefiningOrderFields;