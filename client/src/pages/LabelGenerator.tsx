import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Check,
  ChevronsUpDown,
  Printer,
  Download,
  Plus,
  Tag,
  Search,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useReactToPrint } from 'react-to-print';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Define schemas for form validation
const productFormSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  sellingPrice: z.coerce.number().min(0.01, 'Price must be greater than 0'),
  categoryId: z.coerce.number().min(1, 'Category is required'),
});

// Define the available label formats
const labelFormats = [
  { id: 'small', name: 'Small (50x30mm)', width: 50, height: 30 },
  { id: 'medium', name: 'Medium (70x35mm)', width: 70, height: 35 },
  { id: 'large', name: 'Large (100x50mm)', width: 100, height: 50 },
];

const LabelGenerator: React.FC = () => {
  const { toast } = useToast();
  const labelRef = useRef<HTMLDivElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(labelFormats[0]);
  const [showMultiple, setShowMultiple] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [labelStyle, setLabelStyle] = useState<React.CSSProperties>({
    width: '50mm',
    height: '30mm',
    padding: '3mm',
    border: '1px dashed #ccc',
    margin: '10px',
    position: 'relative',
    backgroundColor: 'white',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [barcodeURL, setBarcodeURL] = useState<string | null>(null);

  // Fetch products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<any[]>({
    queryKey: ['/api/products', searchQuery],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/products?query=${encodeURIComponent(searchQuery)}`);
      return await res.json();
    },
  });

  // Fetch categories for the product form
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<any[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/categories');
      return await res.json();
    },
  });

  // Setup form for new product
  const form = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      sku: '',
      sellingPrice: 0,
      categoryId: 0,
    },
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const response = await apiRequest('POST', '/api/products', productData);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Product created',
        description: `Successfully added ${data.name} to inventory`,
      });
      setSelectedProduct(data);
      setIsAddingProduct(false);
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create product. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Handle form submission for new product
  const onSubmit = (data: z.infer<typeof productFormSchema>) => {
    createProductMutation.mutate(data);
  };

  // Handle product selection
  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setSearchQuery('');
  };

  // Update label style when format changes
  useEffect(() => {
    setLabelStyle((prev) => ({
      ...prev,
      width: `${selectedFormat.width}mm`,
      height: `${selectedFormat.height}mm`,
    }));
  }, [selectedFormat]);

  // Generate barcode when product changes
  useEffect(() => {
    if (selectedProduct) {
      generateBarcode();
    }
  }, [selectedProduct]);

  // Generate barcode using JsBarcode
  const generateBarcode = () => {
    if (!selectedProduct) return;

    const canvas = document.createElement('canvas');
    JsBarcode(canvas, selectedProduct.sku || selectedProduct.id.toString(), {
      format: 'CODE128',
      width: 2,
      height: 40,
      displayValue: true,
      fontSize: 12,
      margin: 0,
    });
    
    setBarcodeURL(canvas.toDataURL('image/png'));
  };

  // Setup printing functionality
  const handlePrint = () => {
    if (!labelRef.current) return;
    
    setIsGenerating(true);
    
    // Implementation using react-to-print directly
    const printContent = () => labelRef.current;
    const onBeforePrint = () => {
      return new Promise<void>((resolve) => {
        setTimeout(resolve, 1000);
      });
    };
    const onAfterPrint = () => {
      setIsGenerating(false);
      toast({
        title: 'Printed successfully',
        description: `${quantity} label(s) sent to printer`,
      });
    };
    
    const printFunction = useReactToPrint({
      content: printContent,
      documentTitle: `Label-${selectedProduct?.name}`,
      onBeforePrint,
      onAfterPrint,
    });
    
    printFunction();
  };

  // Handle PDF export
  const handleDownloadPDF = async () => {
    if (!labelRef.current || !selectedProduct) return;

    setIsGenerating(true);

    try {
      const canvas = await html2canvas(labelRef.current, {
        scale: 3, // Increase resolution
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [selectedFormat.width + 10, selectedFormat.height + 10],
      });

      pdf.addImage(imgData, 'PNG', 5, 5, selectedFormat.width, selectedFormat.height);
      
      if (showMultiple && quantity > 1) {
        for (let i = 1; i < quantity; i++) {
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 5, 5, selectedFormat.width, selectedFormat.height);
        }
      }

      pdf.save(`${selectedProduct.name}-Label.pdf`);

      toast({
        title: 'PDF generated',
        description: 'Label has been saved as PDF',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Label Generator</h1>
          <p className="text-muted-foreground">Create and print product labels with barcodes</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Side - Selection & Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Product Selection</CardTitle>
            <CardDescription>
              Select an existing product or add a new one
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="existing">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Existing Product</TabsTrigger>
                <TabsTrigger value="new">New Product</TabsTrigger>
              </TabsList>
              
              <TabsContent value="existing" className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="flex-1">
                    <Label>Select Product</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {selectedProduct ? selectedProduct.name : "Select a product..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search products..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>
                              {searchQuery ? (
                                <div className="py-6 text-center text-sm">
                                  <p>No products found for "{searchQuery}"</p>
                                  <Button
                                    variant="link"
                                    className="mt-2"
                                    onClick={() => {
                                      form.setValue('name', searchQuery);
                                      document.querySelector('[data-value="new"]')?.dispatchEvent(
                                        new MouseEvent('click', { bubbles: true })
                                      );
                                    }}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add as new product
                                  </Button>
                                </div>
                              ) : (
                                <p className="py-6 text-center text-sm">Start typing to search...</p>
                              )}
                            </CommandEmpty>

                            <CommandGroup heading="Products">
                              {products.map((product) => (
                                <CommandItem
                                  key={product.id}
                                  onSelect={() => handleSelectProduct(product)}
                                  className="flex items-center justify-between"
                                >
                                  <div>
                                    <span className="font-medium">{product.name}</span>
                                    <span className="ml-2 text-sm text-muted-foreground">
                                      {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD'
                                      }).format(product.sellingPrice)}
                                    </span>
                                  </div>
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      selectedProduct?.id === product.id
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
                  </div>

                  {selectedProduct && (
                    <div className="p-4 border rounded-md bg-muted/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{selectedProduct.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            SKU: {selectedProduct.sku || selectedProduct.id}
                          </p>
                          <p className="text-sm font-medium mt-1">
                            Price: {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD'
                            }).format(selectedProduct.sellingPrice)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedProduct(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="new" className="space-y-4 pt-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter product SKU" {...field} />
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
                          <FormLabel>Selling Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id.toString()}
                                >
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={createProductMutation.isPending}>
                      {createProductMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Add Product
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label>Label Format</Label>
                <Select
                  value={selectedFormat.id}
                  onValueChange={(value) => {
                    const format = labelFormats.find(f => f.id === value);
                    if (format) setSelectedFormat(format);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {labelFormats.map((format) => (
                      <SelectItem key={format.id} value={format.id}>
                        {format.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="multiple-labels">Multiple Labels</Label>
                  <p className="text-[0.8rem] text-muted-foreground">
                    Generate multiple copies of the same label
                  </p>
                </div>
                <Switch
                  id="multiple-labels"
                  checked={showMultiple}
                  onCheckedChange={setShowMultiple}
                />
              </div>

              {showMultiple && (
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max="100"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">labels</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={generateBarcode}
              disabled={!selectedProduct}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Barcode
            </Button>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => handlePrint()}
                disabled={!selectedProduct || isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="mr-2 h-4 w-4" />
                )}
                Print
              </Button>
              <Button
                onClick={handleDownloadPDF}
                disabled={!selectedProduct || isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download PDF
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Right Side - Label Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Label Preview</CardTitle>
            <CardDescription>
              Preview how the label will look when printed
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-[300px] bg-gray-50 rounded-md p-6">
            {selectedProduct ? (
              <div 
                ref={labelRef} 
                style={labelStyle}
                className="flex flex-col justify-between font-sans"
              >
                <div className="text-center">
                  <h3 className="font-bold" style={{ fontSize: `${selectedFormat.width * 0.07}mm` }}>
                    {selectedProduct.name}
                  </h3>
                  <p className="font-semibold" style={{ fontSize: `${selectedFormat.width * 0.05}mm` }}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(selectedProduct.sellingPrice)}
                  </p>
                </div>
                
                <div className="flex justify-center mt-2">
                  {barcodeURL && (
                    <img
                      src={barcodeURL}
                      alt="Product Barcode"
                      style={{ 
                        width: `${selectedFormat.width * 0.8}mm`,
                        maxHeight: `${selectedFormat.height * 0.4}mm`,
                      }}
                    />
                  )}
                </div>
                
                <div className="text-center mt-1">
                  <p className="text-xs text-muted-foreground">
                    PharmaOverseas Ltd.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Select a product to generate a label</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            {selectedProduct ? (
              <p>Label size: {selectedFormat.width}mm × {selectedFormat.height}mm</p>
            ) : (
              <p>No product selected</p>
            )}
          </CardFooter>
        </Card>
      </div>

      {showMultiple && selectedProduct && (
        <div className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Multiple Labels Preview</CardTitle>
              <CardDescription>
                This shows how multiple labels will be generated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: Math.min(quantity, 8) }).map((_, index) => (
                  <div
                    key={index}
                    style={{
                      ...labelStyle,
                      transform: 'scale(0.7)',
                      transformOrigin: 'top left',
                      margin: '0',
                    }}
                    className="flex flex-col justify-between font-sans border-dashed border-gray-300"
                  >
                    <div className="text-center">
                      <h3 className="font-bold" style={{ fontSize: `${selectedFormat.width * 0.07}mm` }}>
                        {selectedProduct.name}
                      </h3>
                      <p className="font-semibold" style={{ fontSize: `${selectedFormat.width * 0.05}mm` }}>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(selectedProduct.sellingPrice)}
                      </p>
                    </div>
                    
                    <div className="flex justify-center mt-2">
                      {barcodeURL && (
                        <img
                          src={barcodeURL}
                          alt="Product Barcode"
                          style={{ 
                            width: `${selectedFormat.width * 0.8}mm`,
                            maxHeight: `${selectedFormat.height * 0.4}mm`,
                          }}
                        />
                      )}
                    </div>
                    
                    <div className="text-center mt-1">
                      <p className="text-xs text-muted-foreground">
                        PharmaOverseas Ltd.
                      </p>
                    </div>
                  </div>
                ))}
                {quantity > 8 && (
                  <div className="flex items-center justify-center p-4 border border-dashed rounded-md">
                    <p className="text-muted-foreground">+{quantity - 8} more labels</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LabelGenerator;