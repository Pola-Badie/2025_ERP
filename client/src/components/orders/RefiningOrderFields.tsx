import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Trash, PlusCircle } from 'lucide-react';

interface RefiningOrderFieldsProps {
  orderItems: any[];
  setOrderItems: React.Dispatch<React.SetStateAction<any[]>>;
  refiningSteps: string;
  setRefiningSteps: React.Dispatch<React.SetStateAction<string>>;
}

const RefiningOrderFields: React.FC<RefiningOrderFieldsProps> = ({
  orderItems,
  setOrderItems,
  refiningSteps,
  setRefiningSteps
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [unitCost, setUnitCost] = useState<string>('');
  const { toast } = useToast();

  // Fetch semi-finished products
  const { data: semiFinishedProducts, isLoading } = useQuery({
    queryKey: ['/api/products/semi-finished'],
    queryFn: async () => {
      const response = await fetch('/api/products/semi-finished');
      if (!response.ok) {
        throw new Error('Failed to fetch semi-finished products');
      }
      console.log('Semi-finished products fetched:', await response.clone().json());
      return response.json();
    }
  });

  // Get selected product details
  const getProductById = (id: string) => {
    if (!semiFinishedProducts) return null;
    return semiFinishedProducts.find((product: any) => product.id.toString() === id);
  };

  // Add item to order
  const handleAddItem = () => {
    if (!selectedProductId || !quantity || !unitCost) {
      toast({
        title: 'Incomplete item',
        description: 'Please select a product, quantity, and unit cost',
        variant: 'destructive',
      });
      return;
    }

    const product = getProductById(selectedProductId);
    if (!product) {
      toast({
        title: 'Product not found',
        description: 'The selected product could not be found',
        variant: 'destructive',
      });
      return;
    }

    const quantityNum = parseFloat(quantity);
    const unitCostNum = parseFloat(unitCost);
    
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: 'Invalid quantity',
        description: 'Please enter a positive number for quantity',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(unitCostNum) || unitCostNum <= 0) {
      toast({
        title: 'Invalid unit cost',
        description: 'Please enter a positive number for unit cost',
        variant: 'destructive',
      });
      return;
    }

    const subtotal = quantityNum * unitCostNum;

    const newItem = {
      productId: parseInt(selectedProductId),
      productName: product.name,
      quantity: quantityNum,
      unitCost: unitCostNum.toFixed(2),
      subtotal: subtotal.toFixed(2),
    };

    setOrderItems([...orderItems, newItem]);
    setSelectedProductId('');
    setQuantity('');
    setUnitCost('');
  };

  // Remove item from order
  const handleRemoveItem = (index: number) => {
    const updatedItems = [...orderItems];
    updatedItems.splice(index, 1);
    setOrderItems(updatedItems);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Refining Details</CardTitle>
          <CardDescription>
            Specify the refining process steps and materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="refiningSteps">Refining Process Details</Label>
              <Textarea
                id="refiningSteps"
                placeholder="Describe the refining process steps in detail"
                className="resize-none h-32"
                value={refiningSteps}
                onChange={(e) => setRefiningSteps(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Materials to Refine</CardTitle>
          <CardDescription>
            Add the semi-finished products to be refined
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="material">Semi-Finished Product</Label>
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>Loading products...</SelectItem>
                  ) : (
                    semiFinishedProducts?.map((product: any) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                placeholder="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="unitCost">Unit Cost</Label>
              <Input
                id="unitCost"
                type="number"
                min="0"
                step="0.01"
                placeholder="Unit Cost"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddItem} className="w-full">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </div>
          </div>

          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No materials added yet
                    </TableCell>
                  </TableRow>
                ) : (
                  orderItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.unitCost}</TableCell>
                      <TableCell>${item.subtotal}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
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
    </div>
  );
};

export default RefiningOrderFields;