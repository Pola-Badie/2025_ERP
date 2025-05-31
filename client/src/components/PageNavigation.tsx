import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';

const PageNavigation: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { t, language } = useLanguage();

  // Define the page order for navigation
  const pages = [
    { path: '/', key: 'dashboard', name: 'Dashboard' },
    { path: '/products', key: 'products', name: 'Products' },
    { path: '/customers', key: 'customers', name: 'Customers' },
    { path: '/suppliers', key: 'suppliers', name: 'Suppliers' },
    { path: '/expenses', key: 'expenses', name: 'Expenses' },
    { path: '/accounting', key: 'accounting', name: 'Accounting' },
    { path: '/order-management', key: 'orderManagement', name: 'Order Management' },
    { path: '/orders-history', key: 'ordersHistory', name: 'Orders History' },
    { path: '/quotation-history', key: 'quotationHistory', name: 'Quotation History' },
    { path: '/create-invoice', key: 'createInvoice', name: 'Create Invoice' },
    { path: '/create-quotation', key: 'createQuotation', name: 'Create Quotation' },
    { path: '/invoice-history', key: 'invoiceHistory', name: 'Invoice History' },
    { path: '/user-management', key: 'userManagement', name: 'User Management' },
    { path: '/system-preferences', key: 'systemPreferences', name: 'System Preferences' },
    { path: '/procurement', key: 'procurement', name: 'Procurement' },
    { path: '/reports', key: 'reports', name: 'Reports' }
  ];

  // Find current page index
  const currentIndex = pages.findIndex(page => page.path === location);
  
  // Get previous and next pages
  const previousPage = currentIndex > 0 ? pages[currentIndex - 1] : null;
  const nextPage = currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null;

  // Don't show navigation if we can't find the current page
  if (currentIndex === -1) return null;

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  return (
    <div className={`flex items-center justify-between mb-6 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
      {/* Previous Page Button */}
      <div className="flex-1">
        {previousPage && (
          <Button
            variant="outline"
            onClick={() => handleNavigation(previousPage.path)}
            className={`flex items-center gap-2 text-sm hover:bg-blue-50 border-blue-200 ${
              language === 'ar' ? 'flex-row-reverse' : ''
            }`}
          >
            {language === 'ar' ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {t(previousPage.key) || previousPage.name}
            </span>
            <span className="sm:hidden">
              {language === 'ar' ? 'التالي' : 'Prev'}
            </span>
          </Button>
        )}
      </div>

      {/* Current Page Indicator */}
      <div className="flex-2 text-center px-4">
        <div className="text-sm text-muted-foreground">
          {currentIndex + 1} of {pages.length}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {t(pages[currentIndex].key) || pages[currentIndex].name}
        </div>
      </div>

      {/* Next Page Button */}
      <div className="flex-1 flex justify-end">
        {nextPage && (
          <Button
            variant="outline"
            onClick={() => handleNavigation(nextPage.path)}
            className={`flex items-center gap-2 text-sm hover:bg-blue-50 border-blue-200 ${
              language === 'ar' ? 'flex-row-reverse' : ''
            }`}
          >
            <span className="hidden sm:inline">
              {t(nextPage.key) || nextPage.name}
            </span>
            <span className="sm:hidden">
              {language === 'ar' ? 'السابق' : 'Next'}
            </span>
            {language === 'ar' ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default PageNavigation;