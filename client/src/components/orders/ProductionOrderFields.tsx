import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CustomerSearch from './CustomerSearch';
import CustomerDetails from './CustomerDetails';
import MaterialsSelection from './MaterialsSelection';
import BatchNumberField from './BatchNumberField';
import { Card, CardContent } from '@/components/ui/card';

interface Material {
  id: number;
  name: string;
  quantity: number;
  unitPrice: string;
  unitOfMeasure?: string;
}

interface ProductionOrderFieldsProps {
  batchNumber: string;
  onBatchNumberChange: (value: string) => void;
  selectedCustomer: any;
  onCustomerSelect: (customer: any) => void;
  selectedMaterials: Material[];
  onMaterialsChange: (materials: Material[]) => void;
  productDescription: string;
  onProductDescriptionChange: (value: string) => void;
  totalPrice: string;
}

const ProductionOrderFields: React.FC<ProductionOrderFieldsProps> = ({
  batchNumber,
  onBatchNumberChange,
  selectedCustomer,
  onCustomerSelect,
  selectedMaterials,
  onMaterialsChange,
  productDescription,
  onProductDescriptionChange,
  totalPrice
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Batch Number */}
          <BatchNumberField 
            orderType="production"
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
          
          {/* Target Product Description */}
          <div className="space-y-2">
            <Label htmlFor="productDescription">Final Product Description</Label>
            <Textarea
              id="productDescription"
              placeholder="Describe the product to be produced..."
              value={productDescription}
              onChange={(e) => onProductDescriptionChange(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Raw Materials */}
          <MaterialsSelection 
            selectedMaterials={selectedMaterials}
            onMaterialsChange={onMaterialsChange}
            materialType="raw"
          />
          
          {/* Order Summary */}
          <div className="space-y-2">
            <Label>Order Summary</Label>
            <Card className="border border-blue-100">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Materials Cost:</span>
                    <span>${totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Cost:</span>
                    <span>${totalPrice}</span>
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

export default ProductionOrderFields;