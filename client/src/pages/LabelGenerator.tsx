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
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Label Generator</h1>
          <p className="text-muted-foreground">Create and print product labels with barcodes</p>
        </div>
      </div>

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
    </div>
  );
};

export default LabelGenerator;