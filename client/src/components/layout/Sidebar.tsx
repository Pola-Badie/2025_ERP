import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ className, isMobile, onClose }) => {
  const [location] = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: 'dashboard' },
    { path: '/inventory', label: 'Inventory', icon: 'package' },
    { path: '/sales', label: 'Sales', icon: 'shopping-cart' },
    { path: '/suppliers', label: 'Suppliers', icon: 'truck' },
    { path: '/backup', label: 'Backup & Recovery', icon: 'database' },
    { path: '/settings', label: 'Settings', icon: 'settings' },
  ];

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'dashboard':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard">
            <rect width="7" height="9" x="3" y="3" rx="1"></rect>
            <rect width="7" height="5" x="14" y="3" rx="1"></rect>
            <rect width="7" height="9" x="14" y="12" rx="1"></rect>
            <rect width="7" height="5" x="3" y="16" rx="1"></rect>
          </svg>
        );
      case 'package':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-package">
            <path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.29 7 12 12 20.71 7"></polyline>
            <line x1="12" x2="12" y1="22" y2="12"></line>
          </svg>
        );
      case 'shopping-cart':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-cart">
            <circle cx="8" cy="21" r="1"></circle>
            <circle cx="19" cy="21" r="1"></circle>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
          </svg>
        );
      case 'truck':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-truck">
            <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"></path>
            <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"></path>
            <circle cx="7" cy="18" r="2"></circle>
            <circle cx="17" cy="18" r="2"></circle>
          </svg>
        );
      case 'database':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-database">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
          </svg>
        );
      case 'settings':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn(className, "bg-white")}>
      <div className="flex h-16 items-center px-6 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M9 3v1m0 0v1m0-1h1m-1 0H8m13 0a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 8v8m-4-4h8"></path>
          </svg>
          <span className="font-bold text-xl">PharmERP</span>
        </div>
        {isMobile && (
          <button 
            onClick={onClose}
            className="ml-auto text-slate-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <a 
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100",
                    location === item.path && "bg-primary-50 text-primary-700 font-medium"
                  )}
                  onClick={isMobile ? onClose : undefined}
                >
                  <span className={cn(
                    location === item.path ? "text-primary" : "text-gray-500"
                  )}>
                    {renderIcon(item.icon)}
                  </span>
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center">
          <img className="w-10 h-10 rounded-full" src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80" alt="Profile picture" />
          <div className="ml-3">
            <p className="text-sm font-medium text-slate-700">Dr. Sarah Johnson</p>
            <p className="text-xs text-slate-500">Head Pharmacist</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
