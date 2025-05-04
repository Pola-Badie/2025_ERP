/**
 * Utility functions for CSV import and export
 */

/**
 * Converts data array to CSV string
 * @param data Array of objects to convert to CSV
 * @param headers Optional array of header values
 * @returns CSV string
 */
export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  headers?: string[]
): string => {
  if (!data || data.length === 0) {
    return '';
  }
  
  // If headers are not provided, use the keys of the first object
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create the header row
  const headerRow = csvHeaders.join(',');
  
  // Create the data rows
  const rows = data.map(item => {
    return csvHeaders.map(header => {
      // Convert value to string and handle special characters
      const cell = item[header] !== undefined && item[header] !== null
        ? String(item[header])
        : '';
      
      // Escape quotes and wrap in quotes if contains commas or quotes
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',');
  });
  
  // Combine header and data rows
  return [headerRow, ...rows].join('\n');
};

/**
 * Downloads a CSV file
 * @param csvContent CSV string content
 * @param filename Name of the file to download
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Parses a CSV string into an array of objects
 * @param csvText CSV string to parse
 * @param hasHeader Whether the CSV has a header row
 * @returns Array of objects
 */
export const parseCSV = (
  csvText: string,
  hasHeader: boolean = true
): Record<string, string>[] => {
  if (!csvText) {
    return [];
  }
  
  // Split the CSV text into rows
  const rows = csvText.split(/\r?\n/).filter(row => row.trim() !== '');
  
  if (rows.length === 0) {
    return [];
  }
  
  // Parse CSV row, handling quoted fields
  const parseRow = (row: string): string[] => {
    const fields: string[] = [];
    let field = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      const nextChar = i < row.length - 1 ? row[i + 1] : '';
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Double quotes inside quotes - add a single quote
          field += '"';
          i++;
        } else {
          // Toggle quotes
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        fields.push(field);
        field = '';
      } else {
        field += char;
      }
    }
    
    // Add the last field
    fields.push(field);
    return fields;
  };
  
  // Get headers and data
  const headers = hasHeader ? parseRow(rows[0]) : [];
  const startIndex = hasHeader ? 1 : 0;
  
  // Process data rows
  return rows.slice(startIndex).map(row => {
    const fields = parseRow(row);
    const obj: Record<string, string> = {};
    
    if (hasHeader) {
      // Map fields to headers
      headers.forEach((header, index) => {
        obj[header] = index < fields.length ? fields[index] : '';
      });
    } else {
      // Use numeric indices as keys
      fields.forEach((field, index) => {
        obj[`field${index}`] = field;
      });
    }
    
    return obj;
  });
};

/**
 * Reads a file as text
 * @param file File to read
 * @returns Promise that resolves with the file contents
 */
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};