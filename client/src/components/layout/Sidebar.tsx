import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Home, Package, ShoppingCart, FileText, PieChart, Briefcase, Settings } from 'lucide-react';

interface SidebarProps {
  className?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ className, isMobile, onClose }) => {
  const [location] = useLocation();

  const navItems = [
    { path: '/', label: 'DASHBOARD', icon: 'home' },
    { path: '/inventory', label: 'INVENTORY', icon: 'package' },
    { path: '/sales', label: 'SALES', icon: 'shopping-cart' },
    { path: '/label', label: 'LABEL', icon: 'file-text' },
    { path: '/invoices', label: 'INVOICES / RECEIPTS', icon: 'file-text' },
    { path: '/reports', label: 'REPORTS', icon: 'pie-chart' },
    { path: '/management', label: 'MANAGEMENT', icon: 'briefcase' },
    { path: '/preference', label: 'PREFERENCE', icon: 'settings' },
  ];

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'home':
        return <Home size={20} />;
      case 'package':
        return <Package size={20} />;
      case 'shopping-cart':
        return <ShoppingCart size={20} />;
      case 'file-text':
        return <FileText size={20} />;
      case 'pie-chart':
        return <PieChart size={20} />;
      case 'briefcase':
        return <Briefcase size={20} />;
      case 'settings':
        return <Settings size={20} />;
      default:
        return null;
    }
  };

  return (
    <div className={cn(className, "bg-[#1C3149] text-white min-h-screen")}>
      <div className="flex h-16 items-center px-6 border-b border-[#2A3F55]">
        <div className="flex items-center space-x-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#3BCEAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="#3BCEAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21.1667 8H16" stroke="#3BCEAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 8H2.83337" stroke="#3BCEAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19.07 19.0697L15.18 15.1797" stroke="#3BCEAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.82 8.82L4.93 4.93" stroke="#3BCEAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19.07 4.93L15.18 8.82" stroke="#3BCEAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.82 15.1797L4.93 19.0697" stroke="#3BCEAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-bold text-xl">PharmaOverseas</span>
        </div>
        {isMobile && (
          <button 
            onClick={onClose}
            className="ml-auto text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-0">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <a 
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 border-l-4 border-transparent hover:bg-[#26405A]",
                    location === item.path && "bg-[#26405A] border-l-4 border-[#3BCEAC]"
                  )}
                  onClick={isMobile ? onClose : undefined}
                >
                  <span className={cn(
                    "text-gray-300",
                    location === item.path && "text-[#3BCEAC]"
                  )}>
                    {renderIcon(item.icon)}
                  </span>
                  <span className={cn(
                    "text-sm font-medium",
                    location === item.path && "text-[#3BCEAC]"
                  )}>
                    {item.label}
                  </span>
                  {location === item.path && (
                    <span className="ml-auto">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18L15 12L9 6" stroke="#3BCEAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-[#2A3F55] mt-auto">
        <div className="flex items-center justify-center">
          <button className="text-[#3BCEAC] hover:text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 8.00001H17V6.00001C17 3.24001 14.76 1.00001 12 1.00001C9.24 1.00001 7 3.24001 7 6.00001V8.00001H6C4.9 8.00001 4 8.90001 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.90001 19.1 8.00001 18 8.00001ZM9 6.00001C9 4.34001 10.34 3.00001 12 3.00001C13.66 3.00001 15 4.34001 15 6.00001V8.00001H9V6.00001ZM18 20H6V10H18V20ZM12 17C13.1 17 14 16.1 14 15C14 13.9 13.1 13 12 13C10.9 13 10 13.9 10 15C10 16.1 10.9 17 12 17Z" fill="currentColor"/>
            </svg>
          </button>
          <div className="text-center ml-3">
            <span className="text-white text-sm">About</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
