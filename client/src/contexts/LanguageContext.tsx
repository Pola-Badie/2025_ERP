import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys
const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    products: 'Products',
    expenses: 'Expenses',
    accounting: 'Accounting',
    suppliers: 'Suppliers',
    customers: 'Customers',
    createInvoice: 'Create Invoice',
    createQuotation: 'Create Quotation',
    invoiceHistory: 'Invoice History',
    quotationHistory: 'Quotation History',
    orderManagement: 'Order Management',
    ordersHistory: 'Orders History',
    label: 'Label',
    reports: 'Reports',
    procurement: 'Procurement',
    userManagement: 'User Management',
    systemPreferences: 'System Preferences',
    logout: 'Logout',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    import: 'Import',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    
    // Profile & Settings
    profile: 'Profile',
    settings: 'Settings',
    notifications: 'Notifications',
    language: 'Language',
    english: 'English',
    arabic: 'العربية',
    
    // Financial
    totalAssets: 'Total Assets',
    totalLiabilities: 'Total Liabilities',
    monthlyRevenue: 'Monthly Revenue',
    monthlyExpenses: 'Monthly Expenses',
    
    // Company
    companyName: 'Morgan Chemical ERP'
  },
  ar: {
    // Navigation
    dashboard: 'لوحة التحكم',
    products: 'المنتجات',
    expenses: 'المصروفات',
    accounting: 'المحاسبة',
    suppliers: 'الموردين',
    customers: 'العملاء',
    createInvoice: 'إنشاء فاتورة',
    createQuotation: 'إنشاء عرض سعر',
    invoiceHistory: 'تاريخ الفواتير',
    quotationHistory: 'تاريخ عروض الأسعار',
    orderManagement: 'إدارة الطلبات',
    ordersHistory: 'تاريخ الطلبات',
    label: 'تسمية',
    reports: 'التقارير',
    procurement: 'المشتريات',
    userManagement: 'إدارة المستخدمين',
    systemPreferences: 'إعدادات النظام',
    logout: 'تسجيل الخروج',
    
    // Common
    save: 'حفظ',
    cancel: 'إلغاء',
    edit: 'تعديل',
    delete: 'حذف',
    add: 'إضافة',
    search: 'بحث',
    filter: 'فلتر',
    export: 'تصدير',
    import: 'استيراد',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجح',
    warning: 'تحذير',
    
    // Profile & Settings
    profile: 'الملف الشخصي',
    settings: 'الإعدادات',
    notifications: 'الإشعارات',
    language: 'اللغة',
    english: 'English',
    arabic: 'العربية',
    
    // Financial
    totalAssets: 'إجمالي الأصول',
    totalLiabilities: 'إجمالي الخصوم',
    monthlyRevenue: 'الإيرادات الشهرية',
    monthlyExpenses: 'المصروفات الشهرية',
    
    // Company
    companyName: 'نظام إدارة موارد مورجان الكيميائية'
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    
    // Update document direction and lang attribute
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const isRTL = language === 'ar';

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  useEffect(() => {
    // Set initial direction and lang
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};