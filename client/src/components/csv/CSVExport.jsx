import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Download, ChevronDown, Database, MapPin, Package } from 'lucide-react';
import { exportToCSV, downloadCSV } from '@/lib/csv-utils';
export const CSVExport = ({ data, filename = 'export.csv', headers, customHeaders, buttonText = 'Export CSV', className = '', variant = 'outline', size = 'default', disabled, showWarehouseDropdown = false, warehouseLocations = ['Warehouse 1', 'Warehouse 2', 'Warehouse 3', 'Warehouse 4', 'Warehouse 5', 'Warehouse 6'], onWarehouseFilter }) => {
    const handleExport = (warehouseLocation) => {
        let exportData = data;
        // Filter by warehouse location if provided
        if (warehouseLocation && onWarehouseFilter) {
            exportData = onWarehouseFilter(warehouseLocation);
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
            const headerMap = {};
            const validHeaders = [];
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
                const newItem = {};
                validHeaders.forEach(header => {
                    newItem[customHeaders[header]] = item[header];
                });
                return newItem;
            });
        }
        const csvContent = exportToCSV(exportData, exportHeaders);
        const finalFilename = warehouseLocation
            ? filename.replace('.csv', `-${warehouseLocation.toLowerCase().replace(/ /g, '-')}.csv`)
            : filename;
        downloadCSV(csvContent, finalFilename);
    };
    // Check if this is likely inventory/product data that needs warehouse filtering
    const hasWarehouseData = data.some((item) => item.location || item.warehouse || item.shelf);
    // Only show dropdown for inventory/product data, simple button for everything else
    if (!hasWarehouseData) {
        return (<Button variant={variant} size={size} className={`${className} flex items-center gap-2`} disabled={disabled || !data || data.length === 0} onClick={() => handleExport()}>
        <Download className="w-4 h-4"/>
        {buttonText}
      </Button>);
    }
    // Show dropdown with warehouse options for inventory data
    return (<DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={`${className} flex items-center gap-2`} disabled={disabled || !data || data.length === 0}>
          <Download className="w-4 h-4"/>
          {buttonText}
          <ChevronDown className="w-4 h-4"/>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <DropdownMenuItem onClick={() => handleExport()}>
          <Database className="w-4 h-4 mr-2 text-blue-600"/>
          <div className="flex flex-col">
            <span className="font-medium">All Stock</span>
            <span className="text-xs text-muted-foreground">Complete inventory export</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {warehouseLocations.map((location) => {
            const isWarehouse = location.startsWith('Warehouse');
            const warehouseNumber = isWarehouse ? location.split(' ')[1] : null;
            return (<DropdownMenuItem key={location} onClick={() => handleExport(location)}>
              {isWarehouse ? (<Package className="w-4 h-4 mr-2 text-green-600"/>) : (<MapPin className="w-4 h-4 mr-2 text-orange-600"/>)}
              <div className="flex flex-col">
                <span className="font-medium">{location}</span>
                <span className="text-xs text-muted-foreground">
                  {isWarehouse ? `Storage facility ${warehouseNumber}` : 'Central distribution'}
                </span>
              </div>
            </DropdownMenuItem>);
        })}
      </DropdownMenuContent>
    </DropdownMenu>);
};
