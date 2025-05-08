import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface ProductionOrderFieldsProps {
  orderItems: any[];
  setOrderItems: React.Dispatch<React.SetStateAction<any[]>>;
  targetProduct: any;
  setTargetProduct: React.Dispatch<React.SetStateAction<any>>;
  expectedOutputQuantity: string;
  setExpectedOutputQuantity: React.Dispatch<React.SetStateAction<string>>;
}

const ProductionOrderFields: React.FC<ProductionOrderFieldsProps> = ({
  orderItems,
  setOrderItems,
  targetProduct,
  setTargetProduct,
  expectedOutputQuantity,
  setExpectedOutputQuantity
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [unitCost, setUnitCost] = useState<string>('');
  const { toast } = useToast();

  // Fetch raw materials 
  const { data: rawMaterials, isLoading } = useQuery({
    queryKey: ['/api/products/raw-materials'],
    queryFn: async () => {
      const response = await fetch('/api/products/raw-materials');
      if (!response.ok) {
        throw new Error('Failed to fetch raw materials');
      }
      console.log('Raw materials fetched:', await response.clone().json());
      return response.json();
    }
  });

  // Fetch finished products for target product selection
  const { data: products } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products?status=active');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    }
  });

  // Get selected product details
  const getProductById = (id: string) => {
    if (!rawMaterials) return null;
    return rawMaterials.find((product: any) => product.id.toString() === id);
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

  // Handle target product selection
  const handleTargetProductChange = (value: string) => {
    if (!products) return;
    const product = products.find((p: any) => p.id.toString() === value);
    setTargetProduct(product);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Production Details</CardTitle>
          <CardDescription>
            Specify the target product and expected output quantity
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="targetProductDescription">Target Product Description</Label>
            <Input
              id="targetProductDescription"
              placeholder="Enter detailed description of the target product"
              value={targetProduct?.name || ''}
              onChange={(e) => {
                // Create a simple object with just the name
                setTargetProduct({ name: e.target.value });
              }}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Provide a detailed description of the product you want to produce
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expectedOutputQuantity">Expected Output Quantity</Label>
            <Input
              id="expectedOutputQuantity"
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter expected output quantity"
              value={expectedOutputQuantity}
              onChange={(e) => setExpectedOutputQuantity(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw Materials</CardTitle>
          <CardDescription>
            Add the raw materials needed for this production order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="material">Material</Label>
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>Loading materials...</SelectItem>
                  ) : (
                    rawMaterials?.map((material: any) => (
                      <SelectItem key={material.id} value={material.id.toString()}>
                        {material.name}
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

export default ProductionOrderFields;