import React, { createContext, useContext, useState } from 'react';
const PaginationContext = createContext(undefined);
export const PaginationProvider = ({ children }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(8); // 8 items per page
    const getTotalPages = (totalItems) => {
        return Math.ceil(totalItems / itemsPerPage);
    };
    const getPageItems = (items) => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return items.slice(startIndex, endIndex);
    };
    const resetPage = () => {
        setCurrentPage(1);
    };
    return (<PaginationContext.Provider value={{
            currentPage,
            itemsPerPage,
            setCurrentPage,
            setItemsPerPage: (items) => { },
            getTotalPages,
            getPageItems,
            resetPage,
        }}>
      {children}
    </PaginationContext.Provider>);
};
export const usePagination = () => {
    const context = useContext(PaginationContext);
    if (context === undefined) {
        throw new Error('usePagination must be used within a PaginationProvider');
    }
    return context;
};
