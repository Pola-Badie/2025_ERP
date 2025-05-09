import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Material {
  id: number;
  name: string;
  quantity: number;
  unitPrice: string;
  unitOfMeasure?: string;
}

interface MaterialsSelectionProps {
  selectedMaterials: Material[];
  onMaterialsChange: (materials: Material[]) => void;
  materialType?: 'raw' | 'semi-finished' | 'all';
}

const MaterialsSelection: React.FC<MaterialsSelectionProps> = ({ 
  selectedMaterials, 
  onMaterialsChange,
  materialType = 'raw'
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availableMaterials, setAvailableMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, [materialType]);

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      let endpoint = '/api/products';
      
      // Use specific endpoints for material types if available
      if (materialType === 'raw') {
        endpoint = '/api/products/raw-materials';
      } else if (materialType === 'semi-finished') {
        endpoint = '/api/products/semi-finished';
      }
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch materials: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAvailableMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      // Fallback to regular products endpoint if specific endpoint fails
      if (materialType !== 'all') {
        try {
          const fallbackResponse = await fetch('/api/products');
          const fallbackData = await fallbackResponse.json();
          
          // Filter by productType if possible
          const filtered = fallbackData.filter((p: any) => {
            if (materialType === 'raw') {
              return p.productType === 'raw' || p.type === 'raw' || p.product_type === 'raw';
            } else if (materialType === 'semi-finished') {
              return p.productType === 'semi-raw' || p.productType === 'semi-finished' || 
                     p.type === 'semi-raw' || p.type === 'semi-finished' ||
                     p.product_type === 'semi-raw' || p.product_type === 'semi-finished';
            }
            return true;
          });
          
          setAvailableMaterials(filtered);
        } catch (fallbackError) {
          console.error('Error fetching fallback products:', fallbackError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSubtotal = (material: Material) => {
    const quantity = parseFloat(material.quantity.toString()) || 0;
    const unitPrice = parseFloat(material.unitPrice) || 0;
    return (quantity * unitPrice).toFixed(2);
  };

  const updateMaterialQuantity = (index: number, quantity: number) => {
    const newMaterials = [...selectedMaterials];
    newMaterials[index] = { ...newMaterials[index], quantity };
    onMaterialsChange(newMaterials);
  };

  const updateMaterialPrice = (index: number, price: string) => {
    const newMaterials = [...selectedMaterials];
    newMaterials[index] = { ...newMaterials[index], unitPrice: price };
    onMaterialsChange(newMaterials);
  };

  const removeMaterial = (index: number) => {
    const newMaterials = selectedMaterials.filter((_, i) => i !== index);
    onMaterialsChange(newMaterials);
  };

  const addMaterial = (material: any) => {
    // Check if already selected
    const exists = selectedMaterials.some(m => m.id === material.id);
    if (exists) return;
    
    const newMaterial = {
      id: material.id,
      name: material.name,
      quantity: 1,
      unitPrice: material.costPrice || "0",
      unitOfMeasure: material.unitOfMeasure
    };
    
    onMaterialsChange([...selectedMaterials, newMaterial]);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Raw Materials</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </Button>
      </div>

      {selectedMaterials.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedMaterials.map((material, index) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">
                    {material.name}
                    {material.unitOfMeasure && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({material.unitOfMeasure})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={material.quantity}
                      onChange={(e) => updateMaterialQuantity(index, parseInt(e.target.value) || 1)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={material.unitPrice}
                      onChange={(e) => updateMaterialPrice(index, e.target.value)}
                      className="w-28"
                    />
                  </TableCell>
                  <TableCell>${calculateSubtotal(material)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMaterial(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 border rounded-md text-muted-foreground">
          No materials selected. Click "Add Material" to begin.
        </div>
      )}

      {/* Material Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Select Materials</DialogTitle>
            <DialogDescription>
              Choose the materials needed for this order.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableMaterials.length > 0 ? (
                    availableMaterials.map((material) => (
                      <TableRow key={material.id} className="hover:bg-muted">
                        <TableCell className="font-medium">
                          {material.name}
                          {material.unitOfMeasure && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({material.unitOfMeasure})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{material.quantity || 0}</TableCell>
                        <TableCell>${parseFloat(material.costPrice || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addMaterial(material)}
                            disabled={selectedMaterials.some(m => m.id === material.id)}
                          >
                            {selectedMaterials.some(m => m.id === material.id) ? "Added" : "Add"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No materials found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaterialsSelection;