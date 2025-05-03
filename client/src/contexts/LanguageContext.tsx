import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

// Create the context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

// Translations dictionary
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    dashboard: 'Dashboard',
    products: 'Products',
    expenses: 'Expenses',
    sales: 'Sales',
    accounting: 'Financial Accounting',
    customers: 'Customers',
    suppliers: 'Suppliers',
    quotations: 'Quotations',
    logout: 'Logout',
    
    // Navigation Items
    management: 'Management',
    userManagement: 'User Management',
    preferences: 'Preferences',
    systemPreferences: 'System Preferences',
    label: 'Label',
    reports: 'Reports',
    
    // Dashboard
    totalCustomers: 'Total Customers',
    totalProducts: 'Total Products',
    totalSales: 'Total Sales',
    recentSales: 'Recent Sales',
    
    // Products
    addProduct: 'Add Product',
    code: 'Code',
    name: 'Name',
    price: 'Price',
    quantity: 'Quantity',
    category: 'Category',
    status: 'Status',
    actions: 'Actions',
    
    // Sales
    createInvoice: 'Create Invoice',
    invoiceHistory: 'Invoice History',
    
    // Financial Accounting
    journalEntries: 'Journal Entries',
    chartOfAccounts: 'Chart of Accounts',
    pnlStatement: 'P&L Statement',
    balanceSheet: 'Balance Sheet',
    accountingPeriods: 'Accounting Periods',
    customerPayments: 'Customer Payments',
    
    // Customers
    addCustomer: 'Add Customer',
    
    // Suppliers
    addSupplier: 'Add Supplier',
    
    // Quotations
    createQuotation: 'Create Quotation',
    quotationHistory: 'Quotation History',
  },
  ar: {
    // Common
    dashboard: 'لوحة التحكم',
    products: 'المنتجات',
    expenses: 'المصروفات',
    sales: 'المبيعات',
    accounting: 'المحاسبة المالية',
    customers: 'العملاء',
    suppliers: 'الموردين',
    quotations: 'عروض الأسعار',
    logout: 'تسجيل الخروج',
    
    // Navigation Items
    management: 'الإدارة',
    userManagement: 'إدارة المستخدمين',
    preferences: 'التفضيلات',
    systemPreferences: 'تفضيلات النظام',
    label: 'الملصقات',
    reports: 'التقارير',
    
    // Dashboard
    totalCustomers: 'إجمالي العملاء',
    totalProducts: 'إجمالي المنتجات',
    totalSales: 'إجمالي المبيعات',
    recentSales: 'المبيعات الأخيرة',
    
    // Products
    addProduct: 'إضافة منتج',
    code: 'الرمز',
    name: 'الاسم',
    price: 'السعر',
    quantity: 'الكمية',
    category: 'الفئة',
    status: 'الحالة',
    actions: 'الإجراءات',
    
    // Sales
    createInvoice: 'إنشاء فاتورة',
    invoiceHistory: 'سجل الفواتير',
    
    // Financial Accounting
    journalEntries: 'القيود المحاسبية',
    chartOfAccounts: 'شجرة الحسابات',
    pnlStatement: 'قائمة الدخل',
    balanceSheet: 'الميزانية العمومية',
    accountingPeriods: 'الفترات المحاسبية',
    customerPayments: 'مدفوعات العملاء',
    
    // Customers
    addCustomer: 'إضافة عميل',
    
    // Suppliers
    addSupplier: 'إضافة مورد',
    
    // Quotations
    createQuotation: 'إنشاء عرض سعر',
    quotationHistory: 'سجل عروض الأسعار',
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  
  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || key;
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook to use the language context
export const useLanguage = () => useContext(LanguageContext);