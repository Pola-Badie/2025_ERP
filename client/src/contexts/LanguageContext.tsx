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
    companyName: 'Morgan Chemical ERP',
    
    // Inventory Management
    inventoryManagement: 'Inventory Management',
    addItem: 'Add Item',
    importCsv: 'Import CSV',
    exportCsv: 'Export CSV',
    createLabels: 'Create Labels',
    inventorySettings: 'Inventory Settings',
    warehouseSelector: 'Warehouse Selector',
    addWarehouse: 'Add Warehouse',
    editWarehouse: 'Edit Warehouse',
    allStock: 'All Stock',
    viewingInventory: 'Viewing inventory across',
    allWarehouses: 'all warehouses',
    viewingInventoryFor: 'Viewing inventory for',
    inventory: 'Inventory',
    categories: 'Categories',
    searchInventory: 'Search inventory...',
    filterByStatus: 'Filter by status',
    filterByCategory: 'Filter by category',
    allStatuses: 'All Statuses',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    expired: 'Expired',
    allCategories: 'All Categories',
    product: 'Product',
    category: 'Category',
    batchNo: 'Batch No.',
    gs1Code: 'GS1 Code',
    type: 'Type',
    quantity: 'Quantity',
    location: 'Location',
    shelf: 'Shelf',
    price: 'Price',
    expiryDate: 'Expiry Date',
    actions: 'Actions',
    createLabel: 'Create Label',
    showHistory: 'Show History',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    of: 'of',
    noProductsFound: 'No products found',
    tryAdjustingFilters: 'Try adjusting your filters',
    addFirstProduct: 'Add your first product to get started',
    addProduct: 'Add Product'
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
    companyName: 'نظام إدارة موارد مورجان الكيميائية',
    
    // Inventory Management
    inventoryManagement: 'إدارة المخزون',
    addItem: 'إضافة عنصر',
    importCsv: 'استيراد CSV',
    exportCsv: 'تصدير CSV',
    createLabels: 'إنشاء ملصقات',
    inventorySettings: 'إعدادات المخزون',
    warehouseSelector: 'محدد المستودع',
    addWarehouse: 'إضافة مستودع',
    editWarehouse: 'تعديل المستودع',
    allStock: 'جميع المخزون',
    viewingInventory: 'عرض المخزون عبر',
    allWarehouses: 'جميع المستودعات',
    viewingInventoryFor: 'عرض المخزون لـ',
    inventory: 'المخزون',
    categories: 'الفئات',
    searchInventory: 'البحث في المخزون...',
    filterByStatus: 'فلتر حسب الحالة',
    filterByCategory: 'فلتر حسب الفئة',
    allStatuses: 'جميع الحالات',
    inStock: 'متوفر',
    outOfStock: 'نفد المخزون',
    expired: 'منتهي الصلاحية',
    allCategories: 'جميع الفئات',
    product: 'المنتج',
    category: 'الفئة',
    batchNo: 'رقم الدفعة',
    gs1Code: 'كود GS1',
    type: 'النوع',
    quantity: 'الكمية',
    location: 'الموقع',
    shelf: 'الرف',
    price: 'السعر',
    expiryDate: 'تاريخ الانتهاء',
    actions: 'الإجراءات',
    createLabel: 'إنشاء ملصق',
    showHistory: 'عرض التاريخ',
    previous: 'السابق',
    next: 'التالي',
    page: 'صفحة',
    of: 'من',
    noProductsFound: 'لم يتم العثور على منتجات',
    tryAdjustingFilters: 'جرب تعديل المرشحات',
    addFirstProduct: 'أضف منتجك الأول للبدء',
    addProduct: 'إضافة منتج'
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