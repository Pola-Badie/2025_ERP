import React, { createContext, useContext, useState } from 'react';
const SidebarContext = createContext(undefined);
export const SidebarProvider = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const toggleCollapsed = () => {
        setIsCollapsed(!isCollapsed);
    };
    return (<SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>);
};
export const useSidebarContext = () => {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebarContext must be used within a SidebarProvider');
    }
    return context;
};
