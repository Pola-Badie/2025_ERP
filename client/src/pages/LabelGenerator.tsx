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
  AlertCircle,
  Ban,
  Package,
  Calendar as CalendarIcon,
  FileDown,
  Barcode,
  Trash,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';

// Import hazard symbol images
import hazardExplosive from "@assets/hazard_0_0.png";
import hazardOxidising from "@assets/hazard_0_1.png";
import hazardFlammable from "@assets/hazard_0_2.png";
import hazardCorrosive from "@assets/hazard_0_3.png";
import hazardEnvironment from "@assets/hazard_0_4.png";
import hazardHarmful from "@assets/hazard_1_0.png";
import hazardHighlyFlammable from "@assets/hazard_1_1.png";
import hazardToxic from "@assets/hazard_1_2.png";
import hazardIrritant from "@assets/hazard_1_3.png";
import hazardVeryToxic from "@assets/hazard_1_4.png";

// Import packaging images
import packagingStandard from "@assets/Packaging-6.png";
import packagingPremium from "@assets/Packaging-5.png";
import packagingIndustrial from "@assets/Packaging-7.png";

// Define schemas for form validation
const productFormSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  sellingPrice: z.coerce.number().optional(),
  categoryId: z.coerce.number().optional(),
  formula: z.string().optional(),
  molecularWeight: z.string().optional(),
  manufacturingDate: z.date().optional(),
  expiryDate: z.date().optional(),
  batchNumber: z.string().optional(),
  weight: z.string().optional(),
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
  const [selectedHazard, setSelectedHazard] = useState<string>('');
  const [secondaryHazard, setSecondaryHazard] = useState<string | null>(null);
  const [selectedPackaging, setSelectedPackaging] = useState<string>('');
  const [labTests, setLabTests] = useState<Array<{ type: string; value: string }>>([]);
  const [isFormValid, setIsFormValid] = useState(false);

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
      formula: '',
      molecularWeight: '',
      batchNumber: '',
      weight: '',
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
    
    // Update form values with product data
    form.reset({
      name: product.name,
      sku: product.sku || '',
      sellingPrice: product.sellingPrice || 0,
      categoryId: product.categoryId || 0,
      formula: product.formula || '',
      molecularWeight: product.molecularWeight?.toString() || '',
      batchNumber: product.batchNumber || '',
      weight: product.weight?.toString() || '',
      manufacturingDate: product.manufacturingDate 
        ? new Date(product.manufacturingDate) 
        : undefined,
      expiryDate: product.expiryDate 
        ? new Date(product.expiryDate) 
        : undefined,
    });
    
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

  // Form validation
  useEffect(() => {
    const values = form.getValues();
    const isValid = !!(values.name);
    setIsFormValid(isValid);
  }, [form, selectedProduct]);

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
  
  // Get hazard image path based on hazard type
  const getHazardImagePath = (hazardType: string) => {
    switch (hazardType) {
      case 'explosive':
        return hazardExplosive;
      case 'oxidising':
        return hazardOxidising;
      case 'flammable':
        return hazardFlammable;
      case 'corrosive':
        return hazardCorrosive;
      case 'environment':
        return hazardEnvironment;
      case 'harmful':
        return hazardHarmful;
      case 'highlyFlammable':
        return hazardHighlyFlammable;
      case 'toxic':
        return hazardToxic;
      case 'irritant':
        return hazardIrritant;
      case 'veryToxic':
        return hazardVeryToxic;
      default:
        return '';
    }
  };
  
  // Get packaging image path based on packaging type
  const getPackagingImagePath = (packagingType: string) => {
    switch (packagingType) {
      case 'standard':
        return packagingStandard;
      case 'premium':
        return packagingPremium;
      case 'industrial':
        return packagingIndustrial;
      default:
        return '';
    }
  };
  
  // Lab tests management
  const addLabTest = () => {
    setLabTests([...labTests, { type: '', value: '' }]);
  };
  
  const removeLabTest = (index: number) => {
    const newLabTests = [...labTests];
    newLabTests.splice(index, 1);
    setLabTests(newLabTests);
  };
  
  const updateLabTest = (index: number, field: 'type' | 'value', value: string) => {
    const newLabTests = [...labTests];
    newLabTests[index][field] = value;
    setLabTests(newLabTests);
  };
  
  // Reset form
  const resetForm = () => {
    form.reset({
      name: '',
      sku: '',
      sellingPrice: 0,
      categoryId: 0,
      formula: '',
      molecularWeight: '',
      batchNumber: '',
      weight: '',
    });
    setSelectedProduct(null);
    setSelectedHazard('');
    setSecondaryHazard(null);
    setSelectedPackaging('');
    setLabTests([]);
    setBarcodeURL(null);
  };

  // Custom printing functionality
  const printLabel = () => {
    if (!labelRef.current) return;
    
    setIsGenerating(true);
    
    // Use html2canvas to create a canvas from the label
    html2canvas(labelRef.current).then(canvas => {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: 'Error',
          description: 'Could not open print window. Please check your popup blocker settings.',
          variant: 'destructive',
        });
        setIsGenerating(false);
        return;
      }
      
      // Add the image to the new window and trigger print
      printWindow.document.write(`
        <html>
          <head>
            <title>Label: ${form.getValues("name")}</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
              img { max-width: 100%; }
              @media print {
                body { margin: 0; padding: 0; }
              }
            </style>
          </head>
          <body>
            <img src="${canvas.toDataURL('image/png')}" />
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 200);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Show success message after a delay
      setTimeout(() => {
        setIsGenerating(false);
        toast({
          title: 'Print prepared',
          description: `Label for ${form.getValues("name")} has been sent to printer`,
        });
      }, 1000);
    }).catch(error => {
      console.error('Printing error:', error);
      setIsGenerating(false);
      toast({
        title: 'Error',
        description: 'Failed to prepare label for printing',
        variant: 'destructive',
      });
    });
  };

  // Handle PDF export
  const downloadPdfLabel = async () => {
    if (!labelRef.current) return;

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

      pdf.save(`${form.getValues("name")}-Label.pdf`);

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
                                    Create new product
                                  </Button>
                                </div>
                              ) : (
                                <p className="py-6 text-center text-sm">No products found.</p>
                              )}
                            </CommandEmpty>
                            <CommandGroup>
                              {products.map((product) => (
                                <CommandItem
                                  key={product.id}
                                  value={product.name}
                                  onSelect={() => handleSelectProduct(product)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedProduct?.id === product.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {product.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                 
                  {selectedProduct && (
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Category:</Label>
                          <p className="font-medium">{selectedProduct.category?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-xs">SKU:</Label>
                          <p className="font-medium">{selectedProduct.sku || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </TabsContent>
              
              <TabsContent value="new" className="space-y-4 pt-4">
                {/* New Product Form Fields */}
                <div className="space-y-4">
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
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="space-y-4 pt-4">
              <h3 className="font-medium">Label Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="formula"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chemical Formula</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. C6H12O6" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="molecularWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Molecular Weight</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 180.16" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="manufacturingDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Manufacturing Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
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
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
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
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="batchNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter batch number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 25" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Hazard Type Selection */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Hazard Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Primary Hazard Type</Label>
                    <Select 
                      onValueChange={(value) => setSelectedHazard(value)}
                      value={selectedHazard}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select hazard type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="explosive">Explosive</SelectItem>
                        <SelectItem value="oxidising">Oxidising</SelectItem>
                        <SelectItem value="flammable">Extremely Flammable</SelectItem>
                        <SelectItem value="corrosive">Corrosive</SelectItem>
                        <SelectItem value="environment">Dangerous for the Environment</SelectItem>
                        <SelectItem value="harmful">Harmful</SelectItem>
                        <SelectItem value="highlyFlammable">Highly Flammable</SelectItem>
                        <SelectItem value="toxic">Toxic</SelectItem>
                        <SelectItem value="irritant">Irritant</SelectItem>
                        <SelectItem value="veryToxic">Very Toxic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Secondary Hazard (Optional)</Label>
                    <Select 
                      onValueChange={(value) => setSecondaryHazard(value)}
                      value={secondaryHazard || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select secondary hazard (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="explosive">Explosive</SelectItem>
                        <SelectItem value="oxidising">Oxidising</SelectItem>
                        <SelectItem value="flammable">Extremely Flammable</SelectItem>
                        <SelectItem value="corrosive">Corrosive</SelectItem>
                        <SelectItem value="environment">Dangerous for the Environment</SelectItem>
                        <SelectItem value="harmful">Harmful</SelectItem>
                        <SelectItem value="highlyFlammable">Highly Flammable</SelectItem>
                        <SelectItem value="toxic">Toxic</SelectItem>
                        <SelectItem value="irritant">Irritant</SelectItem>
                        <SelectItem value="veryToxic">Very Toxic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div className="flex flex-col items-center">
                    <Label className="mb-2">Primary Hazard</Label>
                    <div className="w-24 h-32 border rounded-md flex items-center justify-center bg-amber-50">
                      {selectedHazard ? (
                        <img 
                          src={getHazardImagePath(selectedHazard)} 
                          alt={selectedHazard} 
                          className="max-w-full max-h-full" 
                        />
                      ) : (
                        <AlertCircle className="text-muted-foreground h-8 w-8" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <Label className="mb-2">Secondary Hazard</Label>
                    <div className="w-24 h-32 border rounded-md flex items-center justify-center bg-amber-50">
                      {secondaryHazard ? (
                        <img 
                          src={getHazardImagePath(secondaryHazard)} 
                          alt={secondaryHazard}
                          className="max-w-full max-h-full" 
                        />
                      ) : (
                        <Ban className="text-muted-foreground h-8 w-8" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lab Test Fields */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Laboratory Tests</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addLabTest}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Lab Test
                  </Button>
                </div>
                
                {labTests.map((test, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4 border p-3 rounded-md">
                    <div>
                      <Label>Lab Test Type</Label>
                      <Select 
                        value={test.type} 
                        onValueChange={(value) => updateLabTest(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select test type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assay">Assay</SelectItem>
                          <SelectItem value="ph">pH</SelectItem>
                          <SelectItem value="dissolution">Dissolution</SelectItem>
                          <SelectItem value="impurity">Impurity</SelectItem>
                          <SelectItem value="moisture">Moisture</SelectItem>
                          <SelectItem value="chloride">Chloride (CI)</SelectItem>
                          <SelectItem value="iron">Iron (Fe)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label>Lab Test {index + 1}</Label>
                        <Input 
                          value={test.value} 
                          onChange={(e) => updateLabTest(index, 'value', e.target.value)}
                          placeholder="Test value"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-6"
                        onClick={() => removeLabTest(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Packaging Type Selection */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Packaging Selection</h3>
                </div>

                <div>
                  <Label>Packaging Type</Label>
                  <Select 
                    onValueChange={(value) => setSelectedPackaging(value)}
                    value={selectedPackaging}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select packaging type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="mt-4 p-2 border rounded-md flex justify-center bg-slate-50">
                    {selectedPackaging ? (
                      <img 
                        src={getPackagingImagePath(selectedPackaging)} 
                        alt={`${selectedPackaging} packaging`}
                        className="max-h-32 object-contain" 
                      />
                    ) : (
                      <Package className="text-muted-foreground h-16 w-16 my-8" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Right Side - Preview & Generate */}
        <div className="space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Label Preview</CardTitle>
              <CardDescription>
                Preview how the label will look when printed
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow pt-0">
              <div 
                ref={labelRef} 
                className="min-h-[500px] border rounded-md p-4 bg-white"
              >
                {/* Label preview */}
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p>Generating label...</p>
                  </div>
                ) : form.getValues("name") ? (
                  <div className="label-preview bg-white">
                    {/* Blue header with company name */}
                    <div className="bg-sky-500 text-white p-3">
                      <div className="text-2xl font-bold uppercase text-center">MORGAN CHEMICALS IND. CO.</div>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-2 p-3">
                      {/* Left side with QR code and atom logo */}
                      <div className="col-span-1">
                        <div className="flex flex-col items-center space-y-4">
                          {/* QR Code */}
                          <div className="w-24 h-24 bg-white border">
                            <Barcode className="w-full h-full p-2" />
                          </div>
                          
                          {/* Logo placeholder */}
                          <div className="w-20 h-20 flex items-center justify-center">
                            <div className="relative w-16 h-16">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full bg-blue-500"></div>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-3 border-2 border-green-500 rounded-full transform rotate-45"></div>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-3 border-2 border-red-500 rounded-full transform -rotate-45"></div>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-3 border-2 border-orange-500 rounded-full transform rotate-90"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Center section with product info */}
                      <div className="col-span-3 flex flex-col space-y-2">
                        {/* Product name */}
                        <div className="text-xl font-bold text-center">
                          {form.getValues("name")}
                        </div>
                        
                        {/* Formula and MW line */}
                        <div className="flex justify-between text-sm font-semibold">
                          <div>
                            <span className="font-bold">Formula:</span> {form.getValues("formula") || 'N/A'}
                          </div>
                          <div>
                            <span className="font-bold">M.W.:</span> {form.getValues("molecularWeight") || 'N/A'}
                          </div>
                        </div>
                        
                        {/* Assay & appearance line */}
                        <div className="flex justify-between text-sm">
                          <div>
                            <span className="font-bold">Assay:</span> NLT {labTests.find(t => t.type === 'assay')?.value || 'N/A'}
                          </div>
                          <div>
                            <span className="font-bold">Appearance:</span> conform
                          </div>
                        </div>
                        
                        {/* Additional lab tests */}
                        {labTests.filter(t => t.type !== 'assay').map((test, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="font-bold">{test.type}:</span>
                            <span>LT {test.value || 'N/A'} ppm</span>
                          </div>
                        ))}
                        
                        <div className="text-xs mt-2">
                          Complies with the chemical specifications of B.P
                        </div>
                      </div>
                      
                      {/* Right section with dates and hazard */}
                      <div className="col-span-1">
                        <div className="flex flex-col h-full">
                          {/* Dates section */}
                          <div className="space-y-1 text-sm mb-2">
                            <div>
                              <div className="font-bold">Manf. Date:</div>
                              <div>
                                {form.getValues("manufacturingDate") 
                                  ? new Date(form.getValues("manufacturingDate") as Date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                  : "N/A"}
                              </div>
                            </div>
                            <div>
                              <div className="font-bold">EXP:</div>
                              <div>
                                {form.getValues("expiryDate")
                                  ? new Date(form.getValues("expiryDate") as Date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                  : "N/A"}
                              </div>
                            </div>
                            <div>
                              <div className="font-bold">Batch no.:</div>
                              <div>{form.getValues("batchNumber") || "N/A"}</div>
                            </div>
                            <div className="mt-1">
                              <div className="font-bold text-right">{form.getValues("weight") || "25"} Kg.</div>
                            </div>
                          </div>
                          
                          {/* Hazard symbol */}
                          {selectedHazard && (
                            <div className="mt-auto">
                              <img 
                                src={getHazardImagePath(selectedHazard)} 
                                alt={selectedHazard} 
                                className="w-full h-auto" 
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Arabic footer with contact details */}
                    <div className="bg-sky-100 text-xs p-2 text-center">
                      <p>إنتاج شركة مرجان للصناعات الكيماوية (العاشر من رمضان) صنع في مصر</p>
                      <p className="font-semibold mt-1">Head office & factory: 3rd industrial Zone A1 Taba St. Tenth of Ramadan city</p>
                      <p className="mt-1">
                        <span className="mr-2">Mob: 01223991290</span>
                        <span className="mr-2">Fax: 055/4410115</span>
                        <span>Tel: 055/4410890 - 055/4410891 - 055/4410255</span>
                      </p>
                      <p>E-mail: morgan_chem.ind@hotmail.com</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Package className="h-12 w-12 mb-2 opacity-30" />
                    <p>Fill out the form to preview the label</p>
                    <p className="text-xs mt-1">All required fields must be completed</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetForm}
                disabled={isGenerating}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadPdfLabel}
                  disabled={isGenerating || !isFormValid}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button
                  type="button"
                  onClick={printLabel}
                  disabled={isGenerating || !isFormValid}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LabelGenerator;