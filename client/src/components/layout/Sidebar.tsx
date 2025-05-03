import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Home, Package, ShoppingCart, FileText, PieChart, Briefcase, Settings, DollarSign, Sliders, FilePlus, Receipt, BookOpen, Users, UserPlus, ClipboardList } from 'lucide-react';

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
    { path: '/expenses', label: 'EXPENSES', icon: 'dollar-sign' },
    { path: '/accounting', label: 'ACCOUNTING', icon: 'book-open' },
    { path: '/create-invoice', label: 'CREATE INVOICE', icon: 'file-plus' },
    { path: '/create-quotation', label: 'CREATE QUOTATION', icon: 'file-plus' },
    { path: '/invoice-history', label: 'INVOICE HISTORY', icon: 'receipt' },
    { path: '/quotation-history', label: 'QUOTATION HISTORY', icon: 'clipboard-list' },
    { path: '/label', label: 'LABEL', icon: 'file-text' },
    { path: '/customers-demo', label: 'CUSTOMERS DATA', icon: 'user-plus' },
    { path: '/reports', label: 'REPORTS', icon: 'pie-chart' },
    { path: '/management', label: 'MANAGEMENT', icon: 'briefcase' },
    { path: '/users', label: 'USER MANAGEMENT', icon: 'users' },
    { path: '/preferences', label: 'PREFERENCES', icon: 'settings' },
    { path: '/system-preferences', label: 'SYSTEM PREFERENCES', icon: 'sliders' },
  ];

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'home':
        return <Home size={20} />;
      case 'package':
        return <Package size={20} />;
      case 'dollar-sign':
        return <DollarSign size={20} />;
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
      case 'sliders':
        return <Sliders size={20} />;
      case 'file-plus':
        return <FilePlus size={20} />;
      case 'receipt':
        return <Receipt size={20} />;
      case 'book-open':
        return <BookOpen size={20} />;
      case 'users':
        return <Users size={20} />;
      case 'user-plus':
        return <UserPlus size={20} />;
      case 'clipboard-list':
        return <ClipboardList size={20} />;
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
              <Link 
                href={item.path}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 border-l-4 border-transparent hover:bg-[#26405A] cursor-pointer",
                  location === item.path && "bg-[#26405A] border-l-4 border-[#3BCEAC]"
                )}
                onClick={() => {
                  if (isMobile && onClose) onClose();
                }}
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
              </Link>
            </li>
          ))}
        </ul>
      </nav>

    </div>
  );
};

export default Sidebar;
