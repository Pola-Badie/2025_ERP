import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { parseCSV, readFileAsText } from '@/lib/csv-utils';
import { useToast } from '@/hooks/use-toast';

interface CSVImportProps {
  onImport: (data: Record<string, string>[]) => void;
  buttonText?: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  accept?: string;
  hasHeader?: boolean;
  requiredColumns?: string[];
  validateRow?: (row: Record<string, string>) => boolean | string;
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
  validateRow
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  
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
      
      // All validations passed, call the onImport callback
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
    </>
  );
};