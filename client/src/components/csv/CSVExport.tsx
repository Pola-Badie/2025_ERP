import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, ChevronDown } from 'lucide-react';
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
  showStorageDropdown?: boolean;
  storageLocations?: string[];
  onStorageFilter?: (location: string | null) => T[];
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
  disabled,
  showStorageDropdown = false,
  storageLocations = ['Warehouse 1', 'Warehouse 2', 'Central Storage'],
  onStorageFilter
}: CSVExportProps<T>) => {
  
  const handleExport = (storageLocation?: string | null) => {
    let exportData = data;
    
    // Filter by storage location if provided
    if (storageLocation && onStorageFilter) {
      exportData = onStorageFilter(storageLocation);
    }
    
    if (!exportData || exportData.length === 0) {
      console.error('No data to export');
      return;
    }
    
    let exportHeaders = headers;
    
    // If custom headers mapping is provided, transform the data
    if (customHeaders && !headers) {
      // Get the real headers from the first data item
      const dataHeaders = Object.keys(exportData[0]);
      
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
      exportData = exportData.map(item => {
        const newItem: Record<string, any> = {};
        validHeaders.forEach(header => {
          newItem[customHeaders[header]] = item[header];
        });
        return newItem as T;
      });
    }
    
    const csvContent = exportToCSV(exportData, exportHeaders);
    const finalFilename = storageLocation 
      ? filename.replace('.csv', `-${storageLocation.toLowerCase().replace(/ /g, '-')}.csv`)
      : filename;
    downloadCSV(csvContent, finalFilename);
  };
  
  if (showStorageDropdown) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant}
            size={size}
            className={`${className} flex items-center gap-2`}
            disabled={disabled || !data || data.length === 0}
          >
            <Download className="w-4 h-4" />
            {buttonText}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleExport()}>
            All Locations
          </DropdownMenuItem>
          {storageLocations.map((location) => (
            <DropdownMenuItem key={location} onClick={() => handleExport(location)}>
              {location}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  return (
    <Button 
      variant={variant}
      size={size}
      onClick={() => handleExport()} 
      className={className}
      disabled={disabled || !data || data.length === 0}
    >
      <Download className="w-4 h-4 mr-2" />
      {buttonText}
    </Button>
  );
};