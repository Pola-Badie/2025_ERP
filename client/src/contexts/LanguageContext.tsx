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
    inventory: 'Inventory',
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
    addProduct: 'Add Product',
    
    // Dialog translations
    editProductInfo: 'Edit Product Information',
    addNewProduct: 'Add New Product',
    updateProductDetails: 'Update comprehensive product details and inventory information',
    registerNewProduct: 'Register a new pharmaceutical product with complete details and specifications',
    productHistory: 'Product History & Analytics',
    comprehensiveHistory: 'Comprehensive history and performance analytics for',
    loadingProductDetails: 'Loading product details...',
    
    // Inventory Settings Dialog
    configureInventoryOptions: 'Configure Inventory Dropdown Options',
    manageDropdownOptions: 'Manage the options available in Units of Measure, Product Types, Status Options, and Location Types dropdowns.',
    unitsOfMeasure: 'Units of Measure',
    itemTypes: 'Item Types',
    statusOptions: 'Status Options',
    locationTypes: 'Location Types',
    newUnitPlaceholder: 'New unit (e.g., mL, tablets)',
    newItemTypePlaceholder: 'New item type',
    newStatusPlaceholder: 'New status option',
    newLocationPlaceholder: 'New location type',
    done: 'Done',
    
    // Additional ProductForm translations
    chemicalName: 'Chemical Name',
    
    // Create Invoice
    createInvoiceModule: 'Create Invoice',
    customerInfo: 'Customer Information',
    chooseCustomer: 'Choose Customer',
    customerName: 'Customer Name',
    company: 'Company',
    position: 'Position',
    email: 'Email',
    phone: 'Phone',
    sector: 'Sector',
    address: 'Address',
    taxNumber: 'Tax Number',
    invoiceItems: 'Invoice Items',
    selectProduct: 'Select Product',
    productName: 'Product Name',
    unitPrice: 'Unit Price',
    total: 'Total',
    addInvoiceItem: 'Add Item',
    removeItem: 'Remove Item',
    subtotal: 'Subtotal',
    discount: 'Discount',
    tax: 'Tax',
    grandTotal: 'Grand Total',
    paymentInfo: 'Payment Information',
    paymentStatus: 'Payment Status',
    paymentMethod: 'Payment Method',
    amountPaid: 'Amount Paid',
    generateInvoice: 'Generate Invoice',
    printInvoice: 'Print Invoice',
    downloadPdf: 'Download PDF',
    paid: 'Paid',
    unpaid: 'Unpaid',
    partial: 'Partial',
    cash: 'Cash',
    visa: 'Visa',
    cheque: 'Cheque',
    bankTransfer: 'Bank Transfer',
    etaNumber: 'ETA Number'
  },
  ar: {
    // Navigation
    dashboard: 'لوحة التحكم',
    products: 'المنتجات',
    inventory: 'المخزون',
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
    addProduct: 'إضافة منتج',
    
    // Dialog translations
    editProductInfo: 'تحرير معلومات المنتج',
    addNewProduct: 'إضافة منتج جديد',
    updateProductDetails: 'تحديث تفاصيل المنتج الشاملة ومعلومات المخزون',
    registerNewProduct: 'تسجيل منتج صيدلاني جديد بتفاصيل ومواصفات كاملة',
    productHistory: 'تاريخ المنتج والتحليلات',
    comprehensiveHistory: 'تاريخ شامل وتحليلات الأداء لـ',
    loadingProductDetails: 'جاري تحميل تفاصيل المنتج...',
    
    // Inventory Settings Dialog
    configureInventoryOptions: 'تكوين خيارات القوائم المنسدلة للمخزون',
    manageDropdownOptions: 'إدارة الخيارات المتاحة في وحدات القياس وأنواع المنتجات وخيارات الحالة وأنواع المواقع.',
    unitsOfMeasure: 'وحدات القياس',
    itemTypes: 'أنواع العناصر',
    statusOptions: 'خيارات الحالة',
    locationTypes: 'أنواع المواقع',
    newUnitPlaceholder: 'وحدة جديدة (مثل: مل، أقراص)',
    newItemTypePlaceholder: 'نوع عنصر جديد',
    newStatusPlaceholder: 'خيار حالة جديد',
    newLocationPlaceholder: 'نوع موقع جديد',
    done: 'تم',
    
    // Additional ProductForm translations
    drugName: 'اسم الدواء',
    chemicalName: 'الاسم الكيميائي',
    description: 'الوصف',
    unitOfMeasure: 'وحدة القياس',
    lowStockThreshold: 'حد المخزون المنخفض',
    costPrice: 'سعر التكلفة',
    sellingPrice: 'سعر البيع',
    warehouse: 'المستودع',
    shelfNumber: 'رقم الرف',
    status: 'الحالة',
    productType: 'نوع المنتج',
    
    // Form buttons
    saving: 'جاري الحفظ...',
    saveProduct: 'حفظ المنتج',
    updateProduct: 'تحديث المنتج',
    
    // Create Invoice
    createInvoiceArabic: 'إنشاء فاتورة',
    customerInfo: 'معلومات العميل',
    chooseCustomer: 'اختر العميل',
    customerName: 'اسم العميل',
    company: 'الشركة',
    position: 'المنصب',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    sector: 'القطاع',
    address: 'العنوان',
    taxNumber: 'الرقم الضريبي',
    invoiceItems: 'عناصر الفاتورة',
    selectProduct: 'اختر المنتج',
    productName: 'اسم المنتج',
    unitPrice: 'سعر الوحدة',
    total: 'المجموع',
    addInvoiceItem: 'إضافة عنصر',
    removeItem: 'إزالة العنصر',
    subtotal: 'المجموع الفرعي',
    discount: 'الخصم',
    tax: 'الضريبة',
    grandTotal: 'الإجمالي الكلي',
    paymentInfo: 'معلومات الدفع',
    paymentStatus: 'حالة الدفع',
    paymentMethod: 'طريقة الدفع',
    amountPaid: 'المبلغ المدفوع',
    generateInvoice: 'إنشاء الفاتورة',
    printInvoice: 'طباعة الفاتورة',
    downloadPdf: 'تحميل PDF',
    paid: 'مدفوع',
    unpaid: 'غير مدفوع',
    partial: 'جزئي',
    cash: 'نقداً',
    visa: 'فيزا',
    cheque: 'شيك',
    bankTransfer: 'تحويل بنكي',
    etaNumber: 'رقم ETA'
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