import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Printer,
  Download,
  Tag,
  Loader2,
  RefreshCw,
  Plus,
  FileDown,
  Trash2,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
  const [productQuery, setProductQuery] = useState('');
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
    queryKey: ['/api/products', productQuery],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/products${productQuery ? `?query=${encodeURIComponent(productQuery)}` : ''}`);
      return await res.json();
    },
  });

  // Update label style when format changes
  useEffect(() => {
    setLabelStyle(prev => ({
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

  // Handle product selection
  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
  };

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

  // Handle print button
  const handlePrint = () => {
    if (!labelRef.current || !selectedProduct) return;
    
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
            <title>Label: ${selectedProduct.name}</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
              img { max-width: 100%; }
              @media print {
                body { margin: 0; padding: 0; }
                ${showMultiple && quantity > 1 ? `img { page-break-after: always; }` : ''}
              }
            </style>
          </head>
          <body>
            ${showMultiple && quantity > 1 
              ? Array(quantity).fill(0).map(() => `<img src="${canvas.toDataURL('image/png')}" />`).join('\n')
              : `<img src="${canvas.toDataURL('image/png')}" />`
            }
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      setTimeout(() => {
        setIsGenerating(false);
        toast({
          title: 'Print prepared',
          description: `Label for ${selectedProduct.name} has been sent to printer`,
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

  // Handle PDF download
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

  // State for the enhanced label UI
  const [productName, setProductName] = useState('');
  const [formula, setFormula] = useState('');
  const [molecularWeight, setMolecularWeight] = useState('');
  const [manufacturingDate, setManufacturingDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [weight, setWeight] = useState('');
  const [selectedHazard, setSelectedHazard] = useState('');
  const [selectedSpecification, setSelectedSpecification] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [labTests, setLabTests] = useState<Array<{ type: string; value: string }>>([]);

  // Add a lab test
  const addLabTest = () => {
    setLabTests([...labTests, { type: '', value: '' }]);
  };

  // Update a lab test
  const updateLabTest = (index: number, field: 'type' | 'value', value: string) => {
    const newLabTests = [...labTests];
    newLabTests[index][field] = value;
    setLabTests(newLabTests);
  };

  // Remove a lab test
  const removeLabTest = (index: number) => {
    const newLabTests = [...labTests];
    newLabTests.splice(index, 1);
    setLabTests(newLabTests);
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

  // When a product is selected in the enhanced UI
  const handleSelectProductAdvanced = (product: any) => {
    setSelectedProduct(product);
    setProductName(product.name);
    setFormula(product.formula || '');
    setMolecularWeight(product.molecularWeight || '');
    setBatchNumber(product.batchNumber || `B-${Math.floor(Math.random() * 10000)}`);
    setWeight(product.weight || '25');
    setManufacturingDate(product.manufacturingDate || '');
    setExpiryDate(product.expiryDate || '');
    generateBarcode();
  };

  // Reset the enhanced form
  const resetEnhancedForm = () => {
    setProductName('');
    setFormula('');
    setMolecularWeight('');
    setManufacturingDate('');
    setExpiryDate('');
    setBatchNumber('');
    setWeight('');
    setSelectedHazard('');
    setSelectedSpecification('');
    setSelectedSize('');
    setLabTests([]);
    setSelectedProduct(null);
    setBarcodeURL(null);
  };

  // Generate PDF for the enhanced label
  const downloadEnhancedPDF = async () => {
    if (!labelRef.current) return;

    setIsGenerating(true);

    try {
      const canvas = await html2canvas(labelRef.current, {
        scale: 3,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Calculate sizing based on selected size
      let imgWidth = 190; // default width
      let imgHeight = (canvas.height * imgWidth) / canvas.width;
      let xPosition = 10;
      let yPosition = 10;
      
      switch (selectedSize) {
        case '1/2':
          imgWidth = 190;
          break;
        case '1/3':
          imgWidth = 190/1.5;
          break;
        case '1/6':
          imgWidth = 190/3;
          break;
        case '1/24':
          imgWidth = 190/6;
          break;
        default:
          break;
      }
      
      imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', xPosition, yPosition, imgWidth, imgHeight);
      pdf.save(`${productName || 'Chemical-Label'}.pdf`);

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

      <Tabs defaultValue="standard">
        <TabsList className="mb-6">
          <TabsTrigger value="standard">Standard Labels</TabsTrigger>
          <TabsTrigger value="enhanced">Chemical Labels</TabsTrigger>
        </TabsList>

        {/* Standard Label Generator */}
        <TabsContent value="standard">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Side - Products List */}
            <Card>
              <CardHeader>
                <CardTitle>Product Selection</CardTitle>
                <CardDescription>Select a product to generate a label</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="product-search">Search Products</Label>
                  <div className="relative mt-1">
                    <Input
                      id="product-search"
                      placeholder="Search by name, SKU, or category"
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="mt-4 border rounded-md h-64 overflow-y-auto">
                  {isLoadingProducts ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : products.length > 0 ? (
                    <ul className="divide-y">
                      {products.map((product) => (
                        <li
                          key={product.id}
                          className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                            selectedProduct?.id === product.id ? "bg-muted" : ""
                          }`}
                          onClick={() => handleSelectProduct(product)}
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            SKU: {product.sku || "N/A"} | Category: {product.category?.name || "N/A"}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <Tag className="h-8 w-8 mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {productQuery
                          ? "No products found. Try a different search term."
                          : "Select a product to generate a label."}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right Side - Preview & Generate */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Label Format</CardTitle>
                  <CardDescription>Customize how the label appears</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Label Size</Label>
                      <Select 
                        value={selectedFormat.id}
                        onValueChange={(value) => {
                          const format = labelFormats.find(f => f.id === value);
                          if (format) setSelectedFormat(format);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select label size" />
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
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="multiple-labels"
                        checked={showMultiple}
                        onCheckedChange={setShowMultiple}
                      />
                      <Label htmlFor="multiple-labels">Multiple labels</Label>
                    </div>
                    
                    {showMultiple && (
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          min={1}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Output</CardTitle>
                  <CardDescription>Preview and generate your label</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 flex justify-center">
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
                              style={{ maxWidth: '100%', height: 'auto' }}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        <Tag className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>Select a product to preview label</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedProduct(null)}
                    disabled={!selectedProduct}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleDownloadPDF}
                      disabled={!selectedProduct || isGenerating}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      onClick={() => handlePrint()}
                      disabled={!selectedProduct || isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Printer className="mr-2 h-4 w-4" />
                          Print
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Enhanced Label Generator (Chemical Labels) */}
        <TabsContent value="enhanced">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column - Form Inputs */}
            <Card>
              <CardHeader>
                <CardTitle>Chemical Label Details</CardTitle>
                <CardDescription>
                  Enter information for your chemical product label
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Product</Label>
                  <div className="relative">
                    <Select onValueChange={(productId) => {
                      const product = products.find(p => p.id.toString() === productId);
                      if (product) handleSelectProductAdvanced(product);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product..." />
                      </SelectTrigger>
                      <SelectContent sideOffset={5} className="max-h-[300px] overflow-y-auto z-50" position="popper" side="bottom" align="start">
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>Name</Label>
                  <Input 
                    placeholder="Enter product name" 
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Formula</Label>
                  <Input 
                    placeholder="e.g. C6H12O6" 
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>M.W.</Label>
                  <Input 
                    placeholder="Molecular Weight" 
                    value={molecularWeight}
                    onChange={(e) => setMolecularWeight(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Manf. Date</Label>
                  <Input 
                    placeholder="Manufacturing Date" 
                    value={manufacturingDate}
                    onChange={(e) => setManufacturingDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Exp. Date</Label>
                  <Input 
                    placeholder="Expiry Date" 
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Batch No.</Label>
                  <Input 
                    placeholder="Batch Number" 
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Weight</Label>
                  <Input 
                    placeholder="Weight in kg" 
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Lab Tests</Label>
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
                    <div key={index} className="grid grid-cols-5 gap-2 items-center">
                      <div className="col-span-2">
                        <Select 
                          value={test.type} 
                          onValueChange={(value) => updateLabTest(index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Lab Test Type" />
                          </SelectTrigger>
                          <SelectContent sideOffset={5} className="max-h-[300px] overflow-y-auto" position="popper" side="bottom" align="start">
                            <SelectItem value="assay">Assay</SelectItem>
                            <SelectItem value="ph">pH</SelectItem>
                            <SelectItem value="melting_point">Melting point</SelectItem>
                            <SelectItem value="identification">Identification</SelectItem>
                            <SelectItem value="loss_on_drying">Loss on drying</SelectItem>
                            <SelectItem value="loss_on_ignition">Loss on ignition</SelectItem>
                            <SelectItem value="water_insoluble">Water insoluble matter</SelectItem>
                            <SelectItem value="acid_insoluble">Acid insoluble matter</SelectItem>
                            <SelectItem value="nonvolatile_matter">Nonvolatile matter</SelectItem>
                            <SelectItem value="test_sulphate">Test for sulphate (SO4)</SelectItem>
                            <SelectItem value="test_chlorine">Test for chlorine (Cl)</SelectItem>
                            <SelectItem value="test_phosphate">Test for phosphate (PO4)</SelectItem>
                            <SelectItem value="test_iron">Test for iron (Fe)</SelectItem>
                            <SelectItem value="test_fluoride">Test for fluoride (F)</SelectItem>
                            <SelectItem value="test_arsenic">Test for Arsenic (As)</SelectItem>
                            <SelectItem value="test_lead">Test for lead (Pb)</SelectItem>
                            <SelectItem value="test_mercury">Test for mercury (Hg)</SelectItem>
                            <SelectItem value="test_barium">Test for barium (Ba)</SelectItem>
                            <SelectItem value="heavy_metals">Test for heavy metals</SelectItem>
                            <SelectItem value="moisture_content">Moisture content</SelectItem>
                            <SelectItem value="dissolution">Dissolution</SelectItem>
                            <SelectItem value="impurity">Impurity</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input 
                          value={test.value} 
                          onChange={(e) => updateLabTest(index, 'value', e.target.value)}
                          placeholder="Value"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLabTest(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>


              </CardContent>
            </Card>
            
            {/* Right Column - Preview & Settings */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Label Preview</CardTitle>
                  <CardDescription>Preview how the label will look when printed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 mb-6 min-h-[300px] flex justify-center">
                    {productName ? (
                      <div 
                        ref={labelRef} 
                        className="bg-white overflow-hidden"
                      >
                        {/* Blue header with company name */}
                        <div className="bg-sky-500 text-white p-3">
                          <div className="text-xl font-bold uppercase text-center">MORGAN CHEMICALS IND. CO.</div>
                        </div>
                        
                        <div className="grid grid-cols-5 gap-2 p-3">
                          {/* Left side with QR code */}
                          <div className="col-span-1">
                            <div className="flex flex-col items-center space-y-2">
                              {/* Barcode placeholder */}
                              <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                                {barcodeURL ? (
                                  <img src={barcodeURL} alt="Barcode" className="max-w-full max-h-full" />
                                ) : (
                                  <Tag className="h-8 w-8 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Center section with product info */}
                          <div className="col-span-3 flex flex-col space-y-1">
                            {/* Product name */}
                            <div className="text-lg font-bold text-center">
                              {productName}
                            </div>
                            
                            {/* Formula and MW line */}
                            <div className="flex justify-between text-xs">
                              <div className="font-semibold">
                                {formula && <span>Formula: {formula}</span>}
                              </div>
                              <div>
                                {molecularWeight && <span>M.W: {molecularWeight}</span>}
                              </div>
                            </div>
                            
                            {/* Lab tests */}
                            {labTests.map((test, index) => (
                              <div key={index} className="flex justify-between text-xs">
                                <span className="font-semibold">{test.type}:</span>
                                <span>{test.value}</span>
                              </div>
                            ))}
                            
                            {selectedSpecification && (
                              <div className="text-xs text-center mt-2 font-semibold">
                                Complies with {selectedSpecification} specifications
                              </div>
                            )}
                          </div>
                          
                          {/* Right section with dates */}
                          <div className="col-span-1">
                            <div className="flex flex-col h-full text-xs">
                              {/* Dates section */}
                              <div className="space-y-1">
                                {manufacturingDate && (
                                  <div>
                                    <div className="font-semibold">Manf. Date:</div>
                                    <div>{manufacturingDate}</div>
                                  </div>
                                )}
                                
                                {expiryDate && (
                                  <div>
                                    <div className="font-semibold">Exp. Date:</div>
                                    <div>{expiryDate}</div>
                                  </div>
                                )}
                                
                                {batchNumber && (
                                  <div>
                                    <div className="font-semibold">Batch No:</div>
                                    <div>{batchNumber}</div>
                                  </div>
                                )}
                                
                                {weight && (
                                  <div className="text-right mt-1">
                                    <div className="font-bold">{weight} Kg</div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Hazard symbol */}
                              {selectedHazard && (
                                <div className="mt-auto">
                                  <img 
                                    src={getHazardImagePath(selectedHazard)} 
                                    alt="Hazard symbol" 
                                    className="w-full h-auto mt-2" 
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Footer with company contact */}
                        <div className="bg-sky-100 text-xs p-2 text-center">
                          <p className="font-semibold">Head office & factory: 3rd industrial Zone A1 Taba St.</p>
                          <p>Tel: 055/4410890 | Fax: 055/4410115 | E-mail: info@morganchem.com</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <Package className="h-12 w-12 mb-2 opacity-30" />
                        <p className="text-muted-foreground">Fill out the form to preview the label</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Settings */}
                  <div className="pt-3">
                    <h3 className="text-base font-medium mb-4">Label Settings</h3>
                    <div className="flex flex-wrap justify-between gap-6">
                      <div className="space-y-1.5 min-w-[30%] flex-1">
                        <Label htmlFor="hazard-type">Hazardous Type</Label>
                        <Select 
                          value={selectedHazard}
                          onValueChange={setSelectedHazard}
                        >
                          <SelectTrigger id="hazard-type" className="w-full">
                            <SelectValue placeholder="Select hazard type" />
                          </SelectTrigger>
                          <SelectContent sideOffset={5} className="max-h-[300px] overflow-y-auto z-50" position="popper" side="bottom" align="start">
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="explosive">Explosive</SelectItem>
                            <SelectItem value="oxidising">Oxidising</SelectItem>
                            <SelectItem value="flammable">Extremely Flammable</SelectItem>
                            <SelectItem value="corrosive">Corrosive</SelectItem>
                            <SelectItem value="environment">Dangerous for Environment</SelectItem>
                            <SelectItem value="harmful">Harmful</SelectItem>
                            <SelectItem value="highlyFlammable">Highly Flammable</SelectItem>
                            <SelectItem value="toxic">Toxic</SelectItem>
                            <SelectItem value="irritant">Irritant</SelectItem>
                            <SelectItem value="veryToxic">Very Toxic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-1.5 min-w-[30%] flex-1">
                        <Label htmlFor="chem-spec">Chemical Specifications</Label>
                        <Select 
                          value={selectedSpecification}
                          onValueChange={setSelectedSpecification}
                        >
                          <SelectTrigger id="chem-spec" className="w-full">
                            <SelectValue placeholder="Select specification" />
                          </SelectTrigger>
                          <SelectContent sideOffset={5} className="max-h-[300px] overflow-y-auto z-50" position="popper" side="bottom" align="start">
                            <SelectItem value="FCC">FCC</SelectItem>
                            <SelectItem value="USP">USP</SelectItem>
                            <SelectItem value="BP">BP</SelectItem>
                            <SelectItem value="EXTRA PURE">EXTRA PURE</SelectItem>
                            <SelectItem value="TECHNICAL GRADE">TECHNICAL GRADE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-1.5 min-w-[30%] flex-1">
                        <Label htmlFor="label-size">Size on A4</Label>
                        <Select 
                          value={selectedSize}
                          onValueChange={setSelectedSize}
                        >
                          <SelectTrigger id="label-size" className="w-full">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent sideOffset={5} className="max-h-[300px] overflow-y-auto z-50" position="popper" side="bottom" align="start">
                            <SelectItem value="1/2">1/2</SelectItem>
                            <SelectItem value="1/3">1/3</SelectItem>
                            <SelectItem value="1/6">1/6</SelectItem>
                            <SelectItem value="1/24">1/24</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetEnhancedForm}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={downloadEnhancedPDF}
                      disabled={isGenerating || !productName}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handlePrint()}
                      disabled={isGenerating || !productName}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LabelGenerator;