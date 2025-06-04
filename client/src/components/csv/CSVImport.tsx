import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Package } from 'lucide-react';
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

      {/* Warehouse Selection Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Select Warehouse
            </DialogTitle>
            <DialogDescription>
              Choose which warehouse to import the CSV data to. This will help organize your inventory by location.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Warehouse Location
              </label>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a warehouse..." />
                </SelectTrigger>
                <SelectContent>
                  {warehouseLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-green-600" />
                        <span>{location}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {pendingData.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Ready to import <span className="font-semibold">{pendingData.length} rows</span> of data
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleDialogCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleWarehouseConfirm} 
              disabled={!selectedWarehouse || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Importing...' : 'Import to Warehouse'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};