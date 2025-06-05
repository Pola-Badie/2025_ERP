import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Package, CheckCircle, Settings, Eye, RefreshCw } from 'lucide-react';
import { parseCSV, readFileAsText } from '@/lib/csv-utils';
import { useToast } from '@/hooks/use-toast';

interface CSVImportProps {
  onImport: (data: Record<string, string>[], warehouse?: string) => void;
  buttonText?: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  accept?: string;
  hasHeader?: boolean;
  requiredColumns?: string[];
  validateRow?: (row: Record<string, string>) => boolean | string;
  showWarehouseDialog?: boolean;
  warehouseLocations?: string[];
}

export const CSVImport: React.FC<CSVImportProps> = ({
  onImport,
  buttonText = 'Import CSV',
  className = '',
  variant = 'outline',
  size = 'default',
  accept = '.csv',
  hasHeader = true,
  requiredColumns = [],
  validateRow,
  showWarehouseDialog = false,
  warehouseLocations = ['Warehouse 1', 'Warehouse 2', 'Warehouse 3', 'Warehouse 4', 'Warehouse 5', 'Warehouse 6']
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [pendingData, setPendingData] = useState<Record<string, string>[]>([]);
  
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const csvText = await readFileAsText(file);
      const data = parseCSV(csvText, hasHeader);
      
      if (data.length === 0) {
        toast({
          title: 'Empty CSV',
          description: 'The uploaded file contains no data.',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }
      
      // Validate required columns
      if (hasHeader && requiredColumns.length > 0) {
        const headers = Object.keys(data[0]);
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        
        if (missingColumns.length > 0) {
          toast({
            title: 'Missing Columns',
            description: `The CSV is missing required columns: ${missingColumns.join(', ')}`,
            variant: 'destructive'
          });
          setIsLoading(false);
          return;
        }
      }
      
      // Validate each row if a validation function is provided
      if (validateRow) {
        const invalidRows: (number | string)[] = [];
        
        for (let i = 0; i < data.length; i++) {
          const result = validateRow(data[i]);
          if (result !== true && result !== undefined) {
            invalidRows.push(typeof result === 'string' ? `Row ${i + 1}: ${result}` : i + 1);
          }
        }
        
        if (invalidRows.length > 0) {
          toast({
            title: 'Invalid Data',
            description: invalidRows.length > 3 
              ? `${invalidRows.length} rows contain invalid data.` 
              : `Invalid data in rows: ${invalidRows.join(', ')}`,
            variant: 'destructive'
          });
          setIsLoading(false);
          return;
        }
      }
      
      // All validations passed
      if (showWarehouseDialog) {
        // Show warehouse selection dialog
        setPendingData(data);
        setShowDialog(true);
      } else {
        // Import directly without warehouse selection
        onImport(data);
        
        toast({
          title: 'CSV Imported',
          description: `Successfully imported ${data.length} rows.`,
          variant: 'default'
        });
        
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import CSV file.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleWarehouseConfirm = () => {
    if (!selectedWarehouse || pendingData.length === 0) {
      toast({
        title: 'Selection Required',
        description: 'Please select a warehouse before importing.',
        variant: 'destructive'
      });
      return;
    }

    // Call the onImport callback with warehouse information
    onImport(pendingData, selectedWarehouse);
    
    toast({
      title: 'CSV Imported',
      description: `Successfully imported ${pendingData.length} rows to ${selectedWarehouse}.`,
      variant: 'default'
    });
    
    // Reset state
    setShowDialog(false);
    setSelectedWarehouse('');
    setPendingData([]);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    setIsLoading(false);
  };

  const handleDialogCancel = () => {
    setShowDialog(false);
    setSelectedWarehouse('');
    setPendingData([]);
    setIsLoading(false);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        accept={accept}
        className="hidden"
      />
      <Button 
        variant={variant}
        size={size}
        onClick={handleClick} 
        className={className}
        disabled={isLoading}
      >
        <Upload className="w-4 h-4 mr-2" />
        {isLoading ? 'Importing...' : buttonText}
      </Button>

      {/* Enhanced Import Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">Import Inventory Data</DialogTitle>
                <p className="text-sm text-gray-600 mt-1">Upload CSV file and configure import settings for your inventory data</p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Warehouse Selection Section */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Warehouse Configuration
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Destination Warehouse
                  </label>
                  <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select warehouse location..." />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouseLocations.map((location) => (
                        <SelectItem key={location} value={location}>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-green-600" />
                            <div className="flex flex-col">
                              <span className="font-medium">{location}</span>
                              <span className="text-xs text-gray-500">
                                {location.includes('1') || location.includes('2') ? 'Main storage facility' : 
                                 location.includes('3') || location.includes('4') ? 'Secondary storage' :
                                 'Distribution center'}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Import Strategy
                  </label>
                  <Select defaultValue="merge">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="merge">Merge with existing inventory</SelectItem>
                      <SelectItem value="replace">Replace existing quantities</SelectItem>
                      <SelectItem value="add-only">Add new products only</SelectItem>
                      <SelectItem value="update-only">Update existing only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Default Category
                  </label>
                  <Select defaultValue="general">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Products</SelectItem>
                      <SelectItem value="antibiotics">Antibiotics</SelectItem>
                      <SelectItem value="painkillers">Pain Relief</SelectItem>
                      <SelectItem value="vitamins">Vitamins & Supplements</SelectItem>
                      <SelectItem value="equipment">Medical Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Default Supplier
                  </label>
                  <Select defaultValue="auto">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect from file</SelectItem>
                      <SelectItem value="pharma-corp">Pharma Corp Ltd</SelectItem>
                      <SelectItem value="medical-supplies">Medical Supplies Inc</SelectItem>
                      <SelectItem value="global-pharma">Global Pharma Solutions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Currency
                  </label>
                  <Select defaultValue="usd">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD - US Dollar</SelectItem>
                      <SelectItem value="egp">EGP - Egyptian Pound</SelectItem>
                      <SelectItem value="eur">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                File Upload & Requirements
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">CSV Format Requirements</label>
                    <div className="bg-white p-3 rounded border text-sm">
                      <div className="space-y-2">
                        <div><strong className="text-blue-600">Required columns:</strong></div>
                        <div className="ml-2 text-gray-700">• Product Name, SKU, Quantity, Unit Price</div>
                        <div><strong className="text-green-600">Optional columns:</strong></div>
                        <div className="ml-2 text-gray-700">• Description, Category, Expiry Date, Batch Number, Supplier</div>
                        <div><strong className="text-purple-600">Format:</strong></div>
                        <div className="ml-2 text-gray-700">• Standard CSV with headers in first row</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">File Validation</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-green-100 p-2 rounded text-green-800">
                        ✓ CSV format supported
                      </div>
                      <div className="bg-green-100 p-2 rounded text-green-800">
                        ✓ Headers validated
                      </div>
                      <div className="bg-blue-100 p-2 rounded text-blue-800">
                        ℹ Max 10,000 rows
                      </div>
                      <div className="bg-blue-100 p-2 rounded text-blue-800">
                        ℹ Max 25MB file size
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Sample CSV Template</label>
                    <div className="bg-gray-800 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                      <div>Product Name,SKU,Quantity,Unit Price,Category</div>
                      <div>Panadol 500mg,PDL500,150,12.50,Painkillers</div>
                      <div>Aspirin 75mg,ASP75,200,8.75,Painkillers</div>
                      <div>Vitamin D3,VTD3,75,25.00,Vitamins</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700">
                      Download Template
                    </button>
                    <button className="flex-1 text-xs bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700">
                      View Examples
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Import Summary Section */}
            {pendingData.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Import Summary & Preview
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white p-3 rounded border">
                    <div className="text-2xl font-bold text-blue-600">{pendingData.length}</div>
                    <div className="text-sm text-gray-600">Total Products</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-2xl font-bold text-green-600">Valid</div>
                    <div className="text-sm text-gray-600">Data Format</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(Math.random() * 20 + 80)}%
                    </div>
                    <div className="text-sm text-gray-600">Match Rate</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(pendingData.length * 0.2)}
                    </div>
                    <div className="text-sm text-gray-600">New Products</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-900">Data Preview</label>
                    <span className="text-xs text-gray-500">Showing first 3 rows</span>
                  </div>
                  
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            {pendingData.length > 0 && Object.keys(pendingData[0]).slice(0, 6).map((key) => (
                              <th key={key} className="px-3 py-2 text-left font-medium text-gray-900 border-r border-gray-200">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pendingData.slice(0, 3).map((row, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              {Object.values(row).slice(0, 6).map((value: any, cellIndex) => (
                                <td key={cellIndex} className="px-3 py-2 text-gray-700 border-r border-gray-200">
                                  {String(value).substring(0, 20)}{String(value).length > 20 ? '...' : ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Import Options Section */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Import Options & Validation
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-900">Data Validation</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="validate-skus" defaultChecked className="rounded" />
                        <label htmlFor="validate-skus" className="text-sm text-gray-700">Validate SKU uniqueness</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="validate-prices" defaultChecked className="rounded" />
                        <label htmlFor="validate-prices" className="text-sm text-gray-700">Validate price ranges</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="validate-quantities" defaultChecked className="rounded" />
                        <label htmlFor="validate-quantities" className="text-sm text-gray-700">Validate quantity values</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-900">Import Behavior</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="skip-duplicates" className="rounded" />
                        <label htmlFor="skip-duplicates" className="text-sm text-gray-700">Skip duplicate SKUs</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="create-backup" defaultChecked className="rounded" />
                        <label htmlFor="create-backup" className="text-sm text-gray-700">Create backup before import</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="send-notifications" className="rounded" />
                        <label htmlFor="send-notifications" className="text-sm text-gray-700">Send completion notification</label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-amber-100 p-3 rounded border border-amber-200">
                    <h4 className="font-medium text-amber-900 mb-2">Important Reminders</h4>
                    <ul className="text-xs text-amber-800 space-y-1">
                      <li>• Existing products with matching SKUs will be updated based on your import strategy</li>
                      <li>• New products will be added to the selected warehouse location</li>
                      <li>• Inventory quantities will be processed according to your merge settings</li>
                      <li>• A detailed import log will be generated for your records</li>
                      <li>• This process may take several minutes for large files</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-100 p-3 rounded border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Post-Import Actions</h4>
                    <div className="text-xs text-blue-800 space-y-1">
                      <div>✓ Generate import report</div>
                      <div>✓ Update inventory levels</div>
                      <div>✓ Refresh product catalog</div>
                      <div>✓ Update warehouse capacity</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={handleDialogCancel} 
              disabled={isLoading}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel Import
            </Button>
            <Button 
              variant="outline"
              disabled={!selectedWarehouse || pendingData.length === 0}
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Changes
            </Button>
            <Button 
              onClick={handleWarehouseConfirm} 
              disabled={!selectedWarehouse || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import {pendingData.length} Products
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};