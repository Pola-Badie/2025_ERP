import React, { createContext, useState, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CSVExport, CSVImport } from '@/components/csv';
export const CSVContext = createContext(null);
export function useCSV() {
    const context = useContext(CSVContext);
    if (!context) {
        throw new Error('useCSV must be used within a CSVProvider');
    }
    return context;
}
export const CSVProvider = ({ children }) => {
    const [csvData, setCSVData] = useState([]);
    const [csvOptions, setCSVOptions] = useState({});
    const [container, setContainer] = useState(null);
    useEffect(() => {
        // Find the container for the CSV buttons
        const csvContainer = document.getElementById('csv-import-export-container');
        if (csvContainer) {
            setContainer(csvContainer);
        }
    }, []);
    const clearCSV = () => {
        setCSVData([]);
        setCSVOptions({});
    };
    // Create the CSV buttons to be rendered in the header
    const csvButtons = (<>
      {csvOptions.onImport && container && (createPortal(<CSVImport onImport={csvOptions.onImport} buttonText={csvOptions.importButtonText} requiredColumns={csvOptions.requiredColumns} validateRow={csvOptions.validateRow} className="text-xs"/>, container))}
      {csvData.length > 0 && container && (createPortal(<CSVExport data={csvData} filename={csvOptions.filename} headers={csvOptions.headers} customHeaders={csvOptions.customHeaders} buttonText={csvOptions.exportButtonText} className="text-xs" disabled={csvOptions.disabled} showStorageDropdown={csvOptions.showStorageDropdown} storageLocations={csvOptions.storageLocations} onStorageFilter={csvOptions.onStorageFilter}/>, container))}
    </>);
    return (<CSVContext.Provider value={{ setCSVData, setCSVOptions, clearCSV }}>
      {children}
      {csvButtons}
    </CSVContext.Provider>);
};
