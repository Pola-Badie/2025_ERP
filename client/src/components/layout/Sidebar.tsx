import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Home, Package, ShoppingCart, FileText, PieChart, Briefcase, Settings, DollarSign, Sliders, FilePlus, Receipt, BookOpen, Users, UserPlus, ClipboardList, Calculator, Landmark } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SidebarProps {
  className?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ className, isMobile, onClose }) => {
  const [location] = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { path: '/', key: 'dashboard', icon: 'home' },
    { path: '/inventory', key: 'products', icon: 'package' },
    { path: '/expenses', key: 'expenses', icon: 'dollar-sign' },
    { path: '/accounting', key: 'accounting', icon: 'landmark' },
    { path: '/create-invoice', key: 'createInvoice', icon: 'file-plus' },
    { path: '/create-quotation', key: 'createQuotation', icon: 'file-plus' },
    { path: '/invoice-history', key: 'invoiceHistory', icon: 'receipt' },
    { path: '/quotation-history', key: 'quotationHistory', icon: 'clipboard-list' },
    { path: '/label', key: 'label', icon: 'file-text' },
    { path: '/reports', key: 'reports', icon: 'pie-chart' },
    { path: '/management', key: 'management', icon: 'briefcase' },
    { path: '/users', key: 'userManagement', icon: 'users' },
    { path: '/preferences', key: 'preferences', icon: 'settings' },
    { path: '/system-preferences', key: 'systemPreferences', icon: 'sliders' },
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
      case 'calculator':
        return <Calculator size={20} />;
      case 'landmark':
        return <Landmark size={20} />;
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
                  {t(item.key).toUpperCase()}
                </span>
                {location === item.path && (
                  <span className={language === 'ar' ? 'mr-auto' : 'ml-auto'}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d={language === 'ar' ? "M15 18L9 12L15 6" : "M9 18L15 12L9 6"} stroke="#3BCEAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-[#2A3F55] mt-auto space-y-3">
        {/* Language Selector */}
        <div className={`flex items-center justify-center mb-2 ${language === 'ar' ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
          <button 
            className={cn(
              "text-sm px-3 py-1 border rounded-md transition-colors flex-1",
              language === 'en' 
                ? "bg-[#3BCEAC] text-white border-[#3BCEAC]" 
                : "text-[#3BCEAC] border-[#3BCEAC] hover:bg-[#26405A]"
            )}
            onClick={() => setLanguage('en')}
          >
            English
          </button>
          <button 
            className={cn(
              "text-sm px-3 py-1 border rounded-md transition-colors flex-1",
              language === 'ar' 
                ? "bg-[#3BCEAC] text-white border-[#3BCEAC]" 
                : "text-[#3BCEAC] border-[#3BCEAC] hover:bg-[#26405A]"
            )}
            onClick={() => setLanguage('ar')}
          >
            عربي
          </button>
        </div>
        
        {/* Logout Button */}
        <div className="flex items-center justify-center">
          <button className="text-white bg-red-600 hover:bg-red-700 rounded-md px-4 py-2 w-full flex items-center justify-center transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={language === 'ar' ? "M7 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 003 3h4a3 3 0 003-3V7a3 3 0 00-3-3h-4a3 3 0 00-3 3v1" : "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"} />
            </svg>
            {t('logout')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
