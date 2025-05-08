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
    userManagement: 'User Management',
    preferences: 'Preferences',
    systemPreferences: 'System Preferences',
    label: 'Label',
    reports: 'Reports',
    procurement: 'Procurement',
    
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
    
    // Chart of Accounts
    addAccount: 'Add Account',
    accountType: 'Type',
    subtype: 'Subtype',
    balance: 'Balance',
    
    // Customers
    addCustomer: 'Add Customer',
    
    // Suppliers
    addSupplier: 'Add Supplier',
    
    // Quotations
    createQuotation: 'Create Quotation',
    quotationHistory: 'Quotation History',
    
    // Order Management
    orders: 'Order Management',
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
    userManagement: 'إدارة المستخدمين',
    preferences: 'التفضيلات',
    systemPreferences: 'تفضيلات النظام',
    label: 'الملصقات',
    reports: 'التقارير',
    procurement: 'المشتريات',
    
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
    
    // Chart of Accounts
    addAccount: 'إضافة حساب',
    accountType: 'النوع',
    subtype: 'النوع الفرعي',
    balance: 'الرصيد',
    
    // Customers
    addCustomer: 'إضافة عميل',
    
    // Suppliers
    addSupplier: 'إضافة مورد',
    
    // Quotations
    createQuotation: 'إنشاء عرض سعر',
    quotationHistory: 'سجل عروض الأسعار',
    
    // Order Management
    orders: 'إدارة الطلبات',
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  
  // Update language and log changes for debugging
  const handleSetLanguage = (newLanguage: Language) => {
    console.log('Changing language to:', newLanguage);
    setLanguage(newLanguage);
  };
  
  // Translation function
  const t = (key: string): string => {
    console.log('Translating key:', key, 'in language:', language);
    if (!translations[language][key]) {
      console.log('Missing translation for key:', key);
    }
    return translations[language][key] || key;
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook to use the language context
export const useLanguage = () => useContext(LanguageContext);