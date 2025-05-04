import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportToCSV, downloadCSV } from '@/lib/csv-utils';

interface CSVExportProps<T extends Record<string, any>> {
  data: T[];
  filename?: string;
  headers?: string[];
  customHeaders?: Record<string, string>;
  buttonText?: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
}

export const CSVExport = <T extends Record<string, any>>({
  data,
  filename = 'export.csv',
  headers,
  customHeaders,
  buttonText = 'Export CSV',
  className = '',
  variant = 'outline',
  size = 'default',
  disabled
}: CSVExportProps<T>) => {
  
  const handleExport = () => {
    if (!data || data.length === 0) {
      console.error('No data to export');
      return;
    }
    
    let exportHeaders = headers;
    let exportData = data;
    
    // If custom headers mapping is provided, transform the data
    if (customHeaders && !headers) {
      // Get the real headers from the first data item
      const dataHeaders = Object.keys(data[0]);
      
      // Create a mapping of original headers to custom headers
      // and filter out any headers that don't have a custom mapping
      const headerMap: Record<string, string> = {};
      const validHeaders: string[] = [];
      
      dataHeaders.forEach(header => {
        if (customHeaders[header]) {
          headerMap[header] = customHeaders[header];
          validHeaders.push(header);
        }
      });
      
      // Use the custom header labels for the CSV
      exportHeaders = validHeaders.map(header => customHeaders[header]);
      
      // Transform the data to use only the valid headers
      exportData = data.map(item => {
        const newItem: Record<string, any> = {};
        validHeaders.forEach(header => {
          newItem[customHeaders[header]] = item[header];
        });
        return newItem as T;
      });
    }
    
    const csvContent = exportToCSV(exportData, exportHeaders);
    downloadCSV(csvContent, filename);
  };
  
  return (
    <Button 
      variant={variant} 
      onClick={handleExport} 
      className={className}
      disabled={disabled || !data || data.length === 0}
    >
      <Download className="w-4 h-4 mr-2" />
      {buttonText}
    </Button>
  );
};