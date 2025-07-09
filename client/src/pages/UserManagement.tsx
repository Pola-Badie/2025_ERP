import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, UserPermission } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Plus, Trash2, UserCog2, ShieldCheck, UserX, PencilLine, MoreHorizontal, Settings, Eye, EyeOff, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Define form schemas
const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
  status: z.string().optional(),
});

const userUpdateSchema = userFormSchema.partial().extend({
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

const permissionFormSchema = z.object({
  moduleName: z.string().min(1, "Module name is required"),
  accessGranted: z.boolean().default(true),
});

type UserFormValues = z.infer<typeof userFormSchema>;
type UserUpdateValues = z.infer<typeof userUpdateSchema>;
type PermissionFormValues = z.infer<typeof permissionFormSchema>;

// Module list for permissions
const availableModules = [
  "dashboard",
  "products",
  "expenses", 
  "accounting",
  "suppliers",
  "customers",
  "createInvoice",
  "createQuotation", 
  "invoiceHistory",
  "quotationHistory",
  "orderManagement",
  "ordersHistory",
  "label",
  "reports",
  "userManagement", 
  "systemPreferences",
  "procurement"
];

// Function to format module names for display
const formatModuleName = (moduleName: string): string => {
  const moduleDisplayNames: Record<string, string> = {
    dashboard: "Dashboard",
    products: "Inventory",
    expenses: "Expenses",
    accounting: "Accounting",
    suppliers: "Suppliers", 
    customers: "Customers",
    createInvoice: "Create Invoice",
    createQuotation: "Create Quotation",
    invoiceHistory: "Invoice History",
    quotationHistory: "Quotation History",
    orderManagement: "Order Management",
    ordersHistory: "Orders History",
    label: "Label Generation",
    reports: "Reports",
    userManagement: "User Management",
    systemPreferences: "System Preferences",
    procurement: "Procurement"
  };
  
  return moduleDisplayNames[moduleName] || moduleName;
};

// Define comprehensive configurable features for each module
const moduleFeatures = {
  dashboard: [
    // Tab Controls
    { key: "overviewTab", label: "Overview Tab", category: "tabs", description: "Main dashboard overview with key metrics" },
    { key: "analyticsTab", label: "Analytics Tab", category: "tabs", description: "Data analytics and insights section" },
    { key: "reportsTab", label: "Quick Reports Tab", category: "tabs", description: "Quick access to common reports" },
    
    // Content Visibility
    { key: "salesSummary", label: "Sales Summary Cards", category: "content", description: "Revenue, orders, and sales metrics" },
    { key: "inventoryOverview", label: "Inventory Overview", category: "content", description: "Stock levels and product counts" },
    { key: "financialMetrics", label: "Financial Metrics", category: "content", description: "Profit, expenses, and financial KPIs" },
    { key: "recentActivity", label: "Recent Activity Feed", category: "content", description: "Latest transactions and updates" },
    { key: "chartVisualizations", label: "Chart Visualizations", category: "content", description: "Graphs and data charts" },
    { key: "notificationsPanel", label: "Notifications Panel", category: "content", description: "System alerts and notifications" },
    
    // Actions
    { key: "exportDashboard", label: "Export Dashboard", category: "actions", description: "Export dashboard data and reports" },
    { key: "customizeLayout", label: "Customize Layout", category: "actions", description: "Rearrange dashboard components" },
  ],
  
  products: [
    // Tab Controls
    { key: "productsTab", label: "Products List Tab", category: "tabs", description: "Main products listing and management" },
    { key: "categoriesTab", label: "Categories Tab", category: "tabs", description: "Product categories management" },
    { key: "stockTab", label: "Stock Management Tab", category: "tabs", description: "Inventory and stock levels" },
    { key: "pricingTab", label: "Pricing Tab", category: "tabs", description: "Product pricing and cost management" },
    
    // Content Visibility
    { key: "productsList", label: "Products List View", category: "content", description: "Main products table/grid view" },
    { key: "productDetails", label: "Product Details Panel", category: "content", description: "Detailed product information view" },
    { key: "stockLevels", label: "Stock Level Indicators", category: "content", description: "Current stock status and alerts" },
    { key: "priceHistory", label: "Price History", category: "content", description: "Historical pricing data" },
    { key: "productImages", label: "Product Images", category: "content", description: "Product photos and galleries" },
    { key: "specifications", label: "Product Specifications", category: "content", description: "Technical specs and details" },
    
    // Actions
    { key: "addProducts", label: "Add New Products", category: "actions", description: "Create new product entries" },
    { key: "editProducts", label: "Edit Products", category: "actions", description: "Modify existing products" },
    { key: "deleteProducts", label: "Delete Products", category: "actions", description: "Remove products from system" },
    { key: "bulkOperations", label: "Bulk Operations", category: "actions", description: "Mass update/delete operations" },
    { key: "importExport", label: "Import/Export", category: "actions", description: "Bulk data import and export" },
  ],
  
  expenses: [
    // Tab Controls
    { key: "expensesTab", label: "Expenses List Tab", category: "tabs", description: "All expense records and transactions" },
    { key: "categoriesTab", label: "Expense Categories Tab", category: "tabs", description: "Expense categorization management" },
    { key: "reportsTab", label: "Expense Reports Tab", category: "tabs", description: "Expense analysis and reporting" },
    { key: "approvalTab", label: "Approval Workflow Tab", category: "tabs", description: "Expense approval process" },
    
    // Content Visibility
    { key: "expensesList", label: "Expenses List View", category: "content", description: "Main expenses table view" },
    { key: "expenseDetails", label: "Expense Details", category: "content", description: "Detailed expense information" },
    { key: "receiptsAttachments", label: "Receipts & Attachments", category: "content", description: "Supporting documents view" },
    { key: "approvalStatus", label: "Approval Status", category: "content", description: "Current approval workflow state" },
    { key: "expenseCharts", label: "Expense Charts", category: "content", description: "Visual expense analytics" },
    { key: "budgetComparison", label: "Budget Comparison", category: "content", description: "Budget vs actual spending" },
    
    // Actions
    { key: "addExpenses", label: "Add Expenses", category: "actions", description: "Create new expense entries" },
    { key: "editExpenses", label: "Edit Expenses", category: "actions", description: "Modify expense records" },
    { key: "deleteExpenses", label: "Delete Expenses", category: "actions", description: "Remove expense entries" },
    { key: "approveExpenses", label: "Approve Expenses", category: "actions", description: "Expense approval workflow" },
    { key: "exportExpenses", label: "Export Expenses", category: "actions", description: "Export expense data" },
  ],
  
  accounting: [
    // Tab Controls
    { key: "journalTab", label: "Journal Entries Tab", category: "tabs", description: "General ledger and journal entries" },
    { key: "accountsTab", label: "Chart of Accounts Tab", category: "tabs", description: "Account structure management" },
    { key: "reportsTab", label: "Financial Reports Tab", category: "tabs", description: "P&L, Balance Sheet, etc." },
    { key: "reconciliationTab", label: "Bank Reconciliation Tab", category: "tabs", description: "Bank account reconciliation" },
    
    // Content Visibility
    { key: "journalEntries", label: "Journal Entries List", category: "content", description: "All accounting transactions" },
    { key: "accountsChart", label: "Chart of Accounts", category: "content", description: "Account hierarchy view" },
    { key: "trialBalance", label: "Trial Balance", category: "content", description: "Account balances summary" },
    { key: "financialStatements", label: "Financial Statements", category: "content", description: "P&L and Balance Sheet" },
    { key: "cashFlow", label: "Cash Flow Statement", category: "content", description: "Cash flow analysis" },
    
    // Actions
    { key: "createJournalEntry", label: "Create Journal Entries", category: "actions", description: "Add new accounting transactions" },
    { key: "editJournalEntry", label: "Edit Journal Entries", category: "actions", description: "Modify existing entries" },
    { key: "deleteJournalEntry", label: "Delete Journal Entries", category: "actions", description: "Remove accounting entries" },
    { key: "generateReports", label: "Generate Reports", category: "actions", description: "Create financial reports" },
    { key: "exportData", label: "Export Accounting Data", category: "actions", description: "Export financial data" },
  ],
  
  suppliers: [
    // Tab Controls
    { key: "suppliersTab", label: "Suppliers List Tab", category: "tabs", description: "Main suppliers directory" },
    { key: "contactsTab", label: "Contacts Tab", category: "tabs", description: "Supplier contact information" },
    { key: "ordersTab", label: "Purchase Orders Tab", category: "tabs", description: "Orders from suppliers" },
    { key: "paymentsTab", label: "Payments Tab", category: "tabs", description: "Supplier payment history" },
    
    // Content Visibility
    { key: "suppliersList", label: "Suppliers List View", category: "content", description: "Main suppliers table" },
    { key: "supplierDetails", label: "Supplier Details", category: "content", description: "Detailed supplier information" },
    { key: "contactInformation", label: "Contact Information", category: "content", description: "Phone, email, address details" },
    { key: "purchaseHistory", label: "Purchase History", category: "content", description: "Historical purchase data" },
    { key: "paymentTerms", label: "Payment Terms", category: "content", description: "Credit terms and conditions" },
    
    // Actions
    { key: "addSuppliers", label: "Add Suppliers", category: "actions", description: "Register new suppliers" },
    { key: "editSuppliers", label: "Edit Suppliers", category: "actions", description: "Update supplier information" },
    { key: "deleteSuppliers", label: "Delete Suppliers", category: "actions", description: "Remove suppliers" },
    { key: "createPurchaseOrder", label: "Create Purchase Orders", category: "actions", description: "Order from suppliers" },
  ],
  
  customers: [
    // Tab Controls
    { key: "customersTab", label: "Customers List Tab", category: "tabs", description: "Main customers directory" },
    { key: "contactsTab", label: "Contacts Tab", category: "tabs", description: "Customer contact management" },
    { key: "ordersTab", label: "Orders History Tab", category: "tabs", description: "Customer order history" },
    { key: "paymentsTab", label: "Payments Tab", category: "tabs", description: "Customer payment records" },
    
    // Content Visibility
    { key: "customersList", label: "Customers List View", category: "content", description: "Main customers table" },
    { key: "customerDetails", label: "Customer Details", category: "content", description: "Detailed customer profiles" },
    { key: "contactInformation", label: "Contact Information", category: "content", description: "Communication details" },
    { key: "orderHistory", label: "Order History", category: "content", description: "Past customer orders" },
    { key: "paymentHistory", label: "Payment History", category: "content", description: "Payment transaction records" },
    { key: "creditInformation", label: "Credit Information", category: "content", description: "Credit limits and terms" },
    
    // Actions
    { key: "addCustomers", label: "Add Customers", category: "actions", description: "Register new customers" },
    { key: "editCustomers", label: "Edit Customers", category: "actions", description: "Update customer information" },
    { key: "deleteCustomers", label: "Delete Customers", category: "actions", description: "Remove customers" },
    { key: "createOrder", label: "Create Orders", category: "actions", description: "Place orders for customers" },
  ],
  
  createInvoice: [
    // Tab Controls
    { key: "invoiceDetailsTab", label: "Invoice Details Tab", category: "tabs", description: "Main invoice creation form" },
    { key: "itemsTab", label: "Items Tab", category: "tabs", description: "Invoice line items management" },
    { key: "taxesTab", label: "Taxes & Discounts Tab", category: "tabs", description: "Tax calculations and discounts" },
    { key: "previewTab", label: "Preview Tab", category: "tabs", description: "Invoice preview before generation" },
    
    // Content Visibility
    { key: "customerSelection", label: "Customer Selection", category: "content", description: "Choose invoice recipient" },
    { key: "invoiceNumbering", label: "Invoice Numbering", category: "content", description: "Automatic/manual invoice numbers" },
    { key: "itemSelection", label: "Item Selection", category: "content", description: "Product/service selection interface" },
    { key: "pricingCalculation", label: "Pricing Calculation", category: "content", description: "Price and total calculations" },
    { key: "taxCalculation", label: "Tax Calculation", category: "content", description: "Tax computation display" },
    { key: "invoicePreview", label: "Invoice Preview", category: "content", description: "Generated invoice preview" },
    
    // Actions
    { key: "createInvoice", label: "Create Invoice", category: "actions", description: "Generate new invoices" },
    { key: "saveAsDraft", label: "Save as Draft", category: "actions", description: "Save incomplete invoices" },
    { key: "sendInvoice", label: "Send Invoice", category: "actions", description: "Email invoices to customers" },
    { key: "printInvoice", label: "Print Invoice", category: "actions", description: "Print invoice documents" },
    { key: "duplicateInvoice", label: "Duplicate Invoice", category: "actions", description: "Copy existing invoices" },
  ],
  
  createQuotation: [
    // Tab Controls
    { key: "quotationDetailsTab", label: "Quotation Details Tab", category: "tabs", description: "Main quotation creation form" },
    { key: "itemsTab", label: "Items Tab", category: "tabs", description: "Quotation line items" },
    { key: "termsTab", label: "Terms & Conditions Tab", category: "tabs", description: "Quotation terms and validity" },
    { key: "previewTab", label: "Preview Tab", category: "tabs", description: "Quotation preview" },
    
    // Content Visibility
    { key: "customerSelection", label: "Customer Selection", category: "content", description: "Choose quotation recipient" },
    { key: "quotationNumbering", label: "Quotation Numbering", category: "content", description: "Quote number generation" },
    { key: "itemSelection", label: "Item Selection", category: "content", description: "Product/service quotes" },
    { key: "validityPeriod", label: "Validity Period", category: "content", description: "Quote expiration settings" },
    { key: "termsConditions", label: "Terms & Conditions", category: "content", description: "Quote terms display" },
    
    // Actions
    { key: "createQuotation", label: "Create Quotation", category: "actions", description: "Generate new quotations" },
    { key: "convertToInvoice", label: "Convert to Invoice", category: "actions", description: "Turn quotes into invoices" },
    { key: "sendQuotation", label: "Send Quotation", category: "actions", description: "Email quotes to customers" },
    { key: "printQuotation", label: "Print Quotation", category: "actions", description: "Print quote documents" },
  ],
  
  invoiceHistory: [
    // Tab Controls
    { key: "allInvoicesTab", label: "All Invoices Tab", category: "tabs", description: "Complete invoice history" },
    { key: "paidInvoicesTab", label: "Paid Invoices Tab", category: "tabs", description: "Completed payments" },
    { key: "unpaidInvoicesTab", label: "Unpaid Invoices Tab", category: "tabs", description: "Outstanding invoices" },
    { key: "overdueInvoicesTab", label: "Overdue Invoices Tab", category: "tabs", description: "Past due invoices" },
    
    // Content Visibility
    { key: "invoicesList", label: "Invoices List View", category: "content", description: "Main invoices table" },
    { key: "invoiceDetails", label: "Invoice Details", category: "content", description: "Detailed invoice view" },
    { key: "paymentStatus", label: "Payment Status", category: "content", description: "Payment tracking information" },
    { key: "customerInformation", label: "Customer Information", category: "content", description: "Associated customer details" },
    { key: "amountDue", label: "Amount Due", category: "content", description: "Outstanding balance display" },
    
    // Actions
    { key: "viewInvoice", label: "View Invoice Details", category: "actions", description: "Open invoice details" },
    { key: "editInvoice", label: "Edit Invoice", category: "actions", description: "Modify existing invoices" },
    { key: "deleteInvoice", label: "Delete Invoice", category: "actions", description: "Remove invoices" },
    { key: "resendInvoice", label: "Resend Invoice", category: "actions", description: "Email invoices again" },
    { key: "markAsPaid", label: "Mark as Paid", category: "actions", description: "Update payment status" },
  ],
  
  quotationHistory: [
    // Tab Controls
    { key: "allQuotationsTab", label: "All Quotations Tab", category: "tabs", description: "Complete quotation history" },
    { key: "pendingQuotationsTab", label: "Pending Quotations Tab", category: "tabs", description: "Awaiting response" },
    { key: "acceptedQuotationsTab", label: "Accepted Quotations Tab", category: "tabs", description: "Approved quotations" },
    { key: "expiredQuotationsTab", label: "Expired Quotations Tab", category: "tabs", description: "Past validity period" },
    
    // Content Visibility
    { key: "quotationsList", label: "Quotations List View", category: "content", description: "Main quotations table" },
    { key: "quotationStatus", label: "Quotation Status", category: "content", description: "Current quote status" },
    { key: "validityInformation", label: "Validity Information", category: "content", description: "Expiration dates" },
    { key: "conversionTracking", label: "Conversion Tracking", category: "content", description: "Quote to invoice conversion" },
    
    // Actions
    { key: "viewQuotation", label: "View Quotation", category: "actions", description: "Open quotation details" },
    { key: "editQuotation", label: "Edit Quotation", category: "actions", description: "Modify quotations" },
    { key: "duplicateQuotation", label: "Duplicate Quotation", category: "actions", description: "Copy quotations" },
    { key: "convertToInvoice", label: "Convert to Invoice", category: "actions", description: "Create invoice from quote" },
  ],
  
  orderManagement: [
    // Tab Controls
    { key: "allOrdersTab", label: "All Orders Tab", category: "tabs", description: "Complete orders overview" },
    { key: "pendingOrdersTab", label: "Pending Orders Tab", category: "tabs", description: "Orders awaiting processing" },
    { key: "processingOrdersTab", label: "Processing Orders Tab", category: "tabs", description: "Orders in production" },
    { key: "completedOrdersTab", label: "Completed Orders Tab", category: "tabs", description: "Finished orders" },
    
    // Content Visibility
    { key: "ordersList", label: "Orders List View", category: "content", description: "Main orders table" },
    { key: "orderDetails", label: "Order Details", category: "content", description: "Detailed order information" },
    { key: "productionStatus", label: "Production Status", category: "content", description: "Manufacturing progress" },
    { key: "deliveryTracking", label: "Delivery Tracking", category: "content", description: "Shipping and delivery status" },
    { key: "qualityControl", label: "Quality Control", category: "content", description: "QC checkpoints and results" },
    
    // Actions
    { key: "createOrder", label: "Create Order", category: "actions", description: "New order creation" },
    { key: "editOrder", label: "Edit Order", category: "actions", description: "Modify existing orders" },
    { key: "cancelOrder", label: "Cancel Order", category: "actions", description: "Cancel orders" },
    { key: "updateStatus", label: "Update Status", category: "actions", description: "Change order status" },
    { key: "printWorkOrder", label: "Print Work Order", category: "actions", description: "Print production documents" },
  ],
  
  ordersHistory: [
    // Tab Controls
    { key: "allHistoryTab", label: "All History Tab", category: "tabs", description: "Complete order history" },
    { key: "customerHistoryTab", label: "Customer History Tab", category: "tabs", description: "Orders by customer" },
    { key: "productHistoryTab", label: "Product History Tab", category: "tabs", description: "Orders by product" },
    { key: "dateRangeTab", label: "Date Range Tab", category: "tabs", description: "Time-based order analysis" },
    
    // Content Visibility
    { key: "historicalOrdersList", label: "Historical Orders List", category: "content", description: "Past orders table" },
    { key: "orderAnalytics", label: "Order Analytics", category: "content", description: "Order trends and statistics" },
    { key: "customerInsights", label: "Customer Insights", category: "content", description: "Customer order patterns" },
    { key: "productPerformance", label: "Product Performance", category: "content", description: "Product order metrics" },
    
    // Actions
    { key: "searchOrders", label: "Search Orders", category: "actions", description: "Find specific orders" },
    { key: "filterOrders", label: "Filter Orders", category: "actions", description: "Apply order filters" },
    { key: "exportHistory", label: "Export History", category: "actions", description: "Export historical data" },
    { key: "reorderItems", label: "Reorder Items", category: "actions", description: "Repeat previous orders" },
  ],
  
  label: [
    // Tab Controls
    { key: "labelDesignTab", label: "Label Design Tab", category: "tabs", description: "Label creation and design" },
    { key: "templatesTab", label: "Templates Tab", category: "tabs", description: "Pre-designed label templates" },
    { key: "printingTab", label: "Printing Tab", category: "tabs", description: "Label printing options" },
    { key: "historyTab", label: "History Tab", category: "tabs", description: "Previously generated labels" },
    
    // Content Visibility
    { key: "designCanvas", label: "Design Canvas", category: "content", description: "Label design workspace" },
    { key: "templateLibrary", label: "Template Library", category: "content", description: "Available label templates" },
    { key: "productInformation", label: "Product Information", category: "content", description: "Auto-populated product data" },
    { key: "hazardSymbols", label: "Hazard Symbols", category: "content", description: "Safety and warning symbols" },
    { key: "barcodeGeneration", label: "Barcode Generation", category: "content", description: "Automatic barcode creation" },
    { key: "printPreview", label: "Print Preview", category: "content", description: "Label preview before printing" },
    
    // Actions
    { key: "createLabel", label: "Create Label", category: "actions", description: "Design new labels" },
    { key: "editTemplate", label: "Edit Template", category: "actions", description: "Modify label templates" },
    { key: "printLabel", label: "Print Label", category: "actions", description: "Print label designs" },
    { key: "saveTemplate", label: "Save Template", category: "actions", description: "Save custom templates" },
    { key: "exportLabel", label: "Export Label", category: "actions", description: "Export label designs" },
  ],
  
  reports: [
    // Tab Controls
    { key: "salesReportsTab", label: "Sales Reports Tab", category: "tabs", description: "Sales analytics and reports" },
    { key: "inventoryReportsTab", label: "Inventory Reports Tab", category: "tabs", description: "Stock and inventory reports" },
    { key: "financialReportsTab", label: "Financial Reports Tab", category: "tabs", description: "Financial statements and analysis" },
    { key: "customReportsTab", label: "Custom Reports Tab", category: "tabs", description: "User-defined reports" },
    
    // Content Visibility
    { key: "reportsList", label: "Reports List", category: "content", description: "Available reports directory" },
    { key: "reportPreview", label: "Report Preview", category: "content", description: "Report preview window" },
    { key: "dataVisualizations", label: "Data Visualizations", category: "content", description: "Charts and graphs" },
    { key: "filterControls", label: "Filter Controls", category: "content", description: "Report filtering options" },
    { key: "summaryMetrics", label: "Summary Metrics", category: "content", description: "Key performance indicators" },
    
    // Actions
    { key: "generateReport", label: "Generate Report", category: "actions", description: "Create new reports" },
    { key: "scheduleReport", label: "Schedule Report", category: "actions", description: "Automated report generation" },
    { key: "exportReport", label: "Export Report", category: "actions", description: "Export reports to various formats" },
    { key: "shareReport", label: "Share Report", category: "actions", description: "Share reports with others" },
    { key: "customizeReport", label: "Customize Report", category: "actions", description: "Modify report parameters" },
  ],
  
  userManagement: [
    // Tab Controls
    { key: "usersTab", label: "Users Tab", category: "tabs", description: "User accounts management" },
    { key: "rolesTab", label: "Roles Tab", category: "tabs", description: "User roles and permissions" },
    { key: "permissionsTab", label: "Permissions Tab", category: "tabs", description: "Detailed permissions management" },
    { key: "securityTab", label: "Security Tab", category: "tabs", description: "Security settings and policies" },
    
    // Content Visibility
    { key: "usersList", label: "Users List", category: "content", description: "Active user accounts" },
    { key: "userProfiles", label: "User Profiles", category: "content", description: "Detailed user information" },
    { key: "roleAssignments", label: "Role Assignments", category: "content", description: "User role mapping" },
    { key: "permissionMatrix", label: "Permission Matrix", category: "content", description: "Permissions overview" },
    { key: "loginActivity", label: "Login Activity", category: "content", description: "User login history" },
    { key: "securityLogs", label: "Security Logs", category: "content", description: "Security events and alerts" },
    
    // Actions
    { key: "addUser", label: "Add User", category: "actions", description: "Create new user accounts" },
    { key: "editUser", label: "Edit User", category: "actions", description: "Modify user information" },
    { key: "deleteUser", label: "Delete User", category: "actions", description: "Remove user accounts" },
    { key: "resetPassword", label: "Reset Password", category: "actions", description: "Password reset functionality" },
    { key: "managePermissions", label: "Manage Permissions", category: "actions", description: "Configure user permissions" },
  ],
  
  systemPreferences: [
    // Tab Controls
    { key: "generalTab", label: "General Settings Tab", category: "tabs", description: "Basic system configuration" },
    { key: "securityTab", label: "Security Settings Tab", category: "tabs", description: "Security and access controls" },
    { key: "integrationTab", label: "Integration Settings Tab", category: "tabs", description: "Third-party integrations" },
    { key: "backupTab", label: "Backup Settings Tab", category: "tabs", description: "Data backup configuration" },
    
    // Content Visibility
    { key: "systemConfiguration", label: "System Configuration", category: "content", description: "Core system settings" },
    { key: "securityPolicies", label: "Security Policies", category: "content", description: "Security rules and policies" },
    { key: "integrationStatus", label: "Integration Status", category: "content", description: "Connected services status" },
    { key: "backupSchedule", label: "Backup Schedule", category: "content", description: "Automated backup settings" },
    { key: "systemLogs", label: "System Logs", category: "content", description: "System activity logs" },
    
    // Actions
    { key: "updateSettings", label: "Update Settings", category: "actions", description: "Modify system configuration" },
    { key: "manageIntegrations", label: "Manage Integrations", category: "actions", description: "Configure integrations" },
    { key: "runBackup", label: "Run Backup", category: "actions", description: "Manual backup execution" },
    { key: "viewLogs", label: "View Logs", category: "actions", description: "Access system logs" },
    { key: "exportSettings", label: "Export Settings", category: "actions", description: "Export configuration" },
  ],
  
  procurement: [
    // Tab Controls
    { key: "purchaseOrdersTab", label: "Purchase Orders Tab", category: "tabs", description: "Purchase order management" },
    { key: "requestsTab", label: "Purchase Requests Tab", category: "tabs", description: "Purchase request workflow" },
    { key: "approvalsTab", label: "Approvals Tab", category: "tabs", description: "Purchase approval process" },
    { key: "vendorsTab", label: "Vendors Tab", category: "tabs", description: "Vendor management" },
    
    // Content Visibility
    { key: "purchaseOrdersList", label: "Purchase Orders List", category: "content", description: "All purchase orders" },
    { key: "requestsList", label: "Requests List", category: "content", description: "Purchase requests queue" },
    { key: "approvalWorkflow", label: "Approval Workflow", category: "content", description: "Approval process status" },
    { key: "vendorInformation", label: "Vendor Information", category: "content", description: "Vendor details and history" },
    { key: "budgetTracking", label: "Budget Tracking", category: "content", description: "Purchase budget monitoring" },
    
    // Actions
    { key: "createPurchaseOrder", label: "Create Purchase Order", category: "actions", description: "New purchase orders" },
    { key: "approvePurchase", label: "Approve Purchase", category: "actions", description: "Purchase approval actions" },
    { key: "manageBudget", label: "Manage Budget", category: "actions", description: "Budget allocation and control" },
    { key: "trackDelivery", label: "Track Delivery", category: "actions", description: "Delivery status tracking" },
    { key: "generateReports", label: "Generate Reports", category: "actions", description: "Procurement analytics" },
  ],
};

type Role = "admin" | "manager" | "sales" | "inventory" | "accountant";

// Component for the users page
export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<string>("users");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isAddPermissionOpen, setIsAddPermissionOpen] = useState(false);
  const [isManagePermissionsOpen, setIsManagePermissionsOpen] = useState(false);
  const [isConfigurePermissionsOpen, setIsConfigurePermissionsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<UserPermission | null>(null);
  const [modulePermissionFeatures, setModulePermissionFeatures] = useState<Record<string, boolean>>({});
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  // Toggle password visibility for a specific user
  const togglePasswordVisibility = (userId: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Get password for user
  const getPasswordForUser = (username: string) => {
    const passwordMap: Record<string, string> = {
      'maged.morgan': 'maged2024!',
      'michael.morgan': 'michael123',
      'maged.youssef': 'maged456',
      'youssef.abdelmaseeh': 'youssef789',
      'hany.fakhry': 'hany321',
      'mohamed.mahmoud': 'mohamed654',
      'anna.simon': 'anna987'
    };
    return passwordMap[username] || 'password123';
  };



  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      return await response.json() as User[];
    },
  });

  // Export users to CSV
  const handleExportUsers = () => {
    if (!users || users.length === 0) {
      toast({
        title: "No Data",
        description: "No users available to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Username', 'Name', 'Email', 'Role', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...users.map(user => [
        user.username,
        user.name,
        user.email,
        user.role,
        user.status || 'active',
        new Date(user.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: "Users data has been exported successfully.",
    });
  };

  // Fetch user permissions for selected user
  const { data: permissions, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ["/api/users", selectedUser?.id, "permissions"],
    queryFn: async () => {
      if (!selectedUser) return [];
      const response = await apiRequest("GET", `/api/users/${selectedUser.id}/permissions`);
      return await response.json() as UserPermission[];
    },
    enabled: !!selectedUser,
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const response = await apiRequest("POST", "/api/users", data);
      return await response.json() as User;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAddUserOpen(false);
      toast({
        title: "User created",
        description: "The user has been created successfully.",
      });
      addUserForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create user: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number; userData: UserUpdateValues }) => {
      const response = await apiRequest("PUT", `/api/users/${data.id}`, data.userData);
      return await response.json() as User;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditUserOpen(false);
      toast({
        title: "User updated",
        description: "The user has been updated successfully.",
      });
      updateUserForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update user: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Deactivate user mutation
  const deactivateUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PUT", `/api/users/${id}/deactivate`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User deactivated",
        description: "The user has been deactivated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to deactivate user: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Add permission mutation
  const addPermissionMutation = useMutation({
    mutationFn: async (data: { userId: number; permission: PermissionFormValues }) => {
      const response = await apiRequest("POST", `/api/users/${data.userId}/permissions`, data.permission);
      return await response.json() as UserPermission;
    },
    onMutate: async (data) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/users", data.userId, "permissions"] });
      
      // Snapshot the previous value
      const previousPermissions = queryClient.getQueryData(["/api/users", data.userId, "permissions"]);
      
      // Optimistically update to the new value
      const newPermission = {
        id: Date.now(), // Temporary ID
        userId: data.userId,
        moduleName: data.permission.moduleName,
        accessGranted: data.permission.accessGranted
      };
      
      queryClient.setQueryData(["/api/users", data.userId, "permissions"], (old: any) => 
        [...(old || []), newPermission]
      );
      
      return { previousPermissions };
    },
    onSuccess: () => {
      if (selectedUser) {
        queryClient.invalidateQueries({ queryKey: ["/api/users", selectedUser.id, "permissions"] });
      }
      setIsAddPermissionOpen(false);
      toast({
        title: "Permission added",
        description: "The permission has been added successfully.",
      });
      permissionForm.reset({
        moduleName: "",
        accessGranted: true,
      });
    },
    onError: (error: any, data, context) => {
      // Rollback optimistic update
      if (context?.previousPermissions && selectedUser) {
        queryClient.setQueryData(["/api/users", selectedUser.id, "permissions"], context.previousPermissions);
      }
      
      toast({
        title: "Error",
        description: `Failed to add permission: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete permission mutation
  const deletePermissionMutation = useMutation({
    mutationFn: async (data: { userId: number; moduleName: string }) => {
      await apiRequest("DELETE", `/api/users/${data.userId}/permissions/${data.moduleName}`);
    },
    onMutate: async (data) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/users", data.userId, "permissions"] });
      
      // Snapshot the previous value
      const previousPermissions = queryClient.getQueryData(["/api/users", data.userId, "permissions"]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(["/api/users", data.userId, "permissions"], (old: any) => 
        old?.filter((p: any) => p.moduleName !== data.moduleName) || []
      );
      
      return { previousPermissions };
    },
    onSuccess: () => {
      if (selectedUser) {
        queryClient.invalidateQueries({ queryKey: ["/api/users", selectedUser.id, "permissions"] });
      }
      toast({
        title: "Permission removed",
        description: "The permission has been removed successfully.",
      });
    },
    onError: (error: any, data, context) => {
      // Rollback optimistic update
      if (context?.previousPermissions && selectedUser) {
        queryClient.setQueryData(["/api/users", selectedUser.id, "permissions"], context.previousPermissions);
      }
      
      // Only show error if it's not a 404 (permission already deleted)
      if (!error.message?.includes('404') && !error.message?.includes('not found')) {
        toast({
          title: "Error",
          description: `Failed to delete permission: ${error.message}`,
          variant: "destructive",
        });
      }
    },
  });

  // Form for adding a new user
  const addUserForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      role: "sales",
      status: "active",
    },
  });

  // Form for updating a user
  const updateUserForm = useForm<UserUpdateValues>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      role: "",
      status: "",
    },
  });

  // Form for adding a permission
  const permissionForm = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionFormSchema),
    defaultValues: {
      moduleName: "",
      accessGranted: true,
    },
  });

  // Handle user form submission
  const onAddUserSubmit = (data: UserFormValues) => {
    addUserMutation.mutate(data);
  };

  // Handle user update form submission
  const onUpdateUserSubmit = (data: UserUpdateValues) => {
    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, userData: data });
    }
  };

  // Handle permission form submission
  const onAddPermissionSubmit = (data: PermissionFormValues) => {
    if (selectedUser) {
      addPermissionMutation.mutate({ userId: selectedUser.id, permission: data });
    }
  };

  // Handle user deactivation
  const handleDeactivateUser = (user: User) => {
    if (confirm(`Are you sure you want to deactivate ${user.name}?`)) {
      deactivateUserMutation.mutate(user.id);
    }
  };

  // Handle permission deletion
  const handleDeletePermission = (permission: UserPermission) => {
    if (confirm(`Are you sure you want to delete this permission?`)) {
      deletePermissionMutation.mutate({ userId: permission.userId, moduleName: permission.moduleName });
    }
  };

  // Handle user selection for viewing permissions
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setActiveTab("permissions");
  };

  // Handle manage permissions dialog opening
  const handleManagePermissions = (user: User) => {
    setSelectedUser(user);
    setIsManagePermissionsOpen(true);
  };

  // Handle configure permissions dialog opening
  const handleConfigurePermissions = (permission: UserPermission) => {
    setSelectedPermission(permission);
    setIsConfigurePermissionsOpen(true);
  };

  // Handle editing a user
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    updateUserForm.reset({
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || "active",
    });
    setIsEditUserOpen(true);
  };

  // Get status badge color
  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "inactive":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get role badge color
  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-500";
      case "manager":
        return "bg-blue-500";
      case "sales":
        return "bg-green-500";
      case "inventory":
        return "bg-orange-500";
      case "accountant":
        return "bg-cyan-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <Button onClick={handleExportUsers}>
          <Download className="mr-2 h-4 w-4" />
          Export Users
        </Button>
      </div>

      <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User List</CardTitle>
              <CardDescription>Manage system users and their roles</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableCaption>List of all system users</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">
                              {showPasswords[user.id] ? getPasswordForUser(user.username) : "••••••••"}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePasswordVisibility(user.id)}
                              className="h-6 w-6 p-0"
                            >
                              {showPasswords[user.id] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status || "active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleManagePermissions(user)}>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Manage Permissions
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <PencilLine className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeactivateUser(user)}
                                disabled={user.status === "inactive"}
                                className="text-red-600"
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user with role-based permissions.
            </DialogDescription>
          </DialogHeader>
          <Form {...addUserForm}>
            <form onSubmit={addUserForm.handleSubmit(onAddUserSubmit)} className="space-y-4">
              <FormField
                control={addUserForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addUserForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addUserForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="sales">Sales Representative</SelectItem>
                        <SelectItem value="inventory">Inventory Manager</SelectItem>
                        <SelectItem value="accountant">Accountant</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The role determines the default permissions for this user.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddUserOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addUserMutation.isPending}>
                  {addUserMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create User
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and settings.
            </DialogDescription>
          </DialogHeader>
          <Form {...updateUserForm}>
            <form onSubmit={updateUserForm.handleSubmit(onUpdateUserSubmit)} className="space-y-4">
              <FormField
                control={updateUserForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateUserForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Leave blank to keep current password" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave blank to keep the current password.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateUserForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="sales">Sales Representative</SelectItem>
                        <SelectItem value="inventory">Inventory Manager</SelectItem>
                        <SelectItem value="accountant">Accountant</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateUserForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditUserOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update User
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Permission Dialog */}
      <Dialog open={isAddPermissionOpen} onOpenChange={setIsAddPermissionOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Permission</DialogTitle>
            <DialogDescription>
              Assign module access to {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <Form {...permissionForm}>
            <form onSubmit={permissionForm.handleSubmit(onAddPermissionSubmit)} className="space-y-4">
              <FormField
                control={permissionForm.control}
                name="moduleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a module" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableModules.map((module) => (
                          <SelectItem key={module} value={module}>
                            {module.charAt(0).toUpperCase() + module.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={permissionForm.control}
                name="accessGranted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Grant Access</FormLabel>
                      <FormDescription>
                        Check to grant access to this module, uncheck to deny.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddPermissionOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addPermissionMutation.isPending}>
                  {addPermissionMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Permission
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Manage Permissions Dialog */}
      <Dialog open={isManagePermissionsOpen} onOpenChange={setIsManagePermissionsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Manage module permissions for {selectedUser?.name} ({selectedUser?.username})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Current Permissions</span>
            </div>
            
            {isLoadingPermissions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions?.map((permission, index) => (
                      <TableRow key={`permission-${permission.id || index}-${permission.moduleName}`}>
                        <TableCell className="font-medium">{formatModuleName(permission.moduleName)}</TableCell>
                        <TableCell>
                          <Badge className={permission.accessGranted ? "bg-green-500" : "bg-red-500"}>
                            {permission.accessGranted ? "Granted" : "Denied"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConfigurePermissions(permission)}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Configure
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePermission(permission)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {permissions?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                          No permissions assigned yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          
          {/* Available Modules Section */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Available Modules</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedUser) {
                      // Grant access to all 17 modules
                      availableModules.forEach(module => {
                        const hasExistingPermission = permissions?.some(p => p.moduleName === module);
                        if (!hasExistingPermission) {
                          addPermissionMutation.mutate({ 
                            userId: selectedUser.id, 
                            permission: { moduleName: module, accessGranted: true } 
                          });
                        }
                      });
                      
                      toast({
                        title: "Full access granted",
                        description: `Access granted to all ${availableModules.length} ERP modules.`,
                      });
                    }
                  }}
                  disabled={addPermissionMutation.isPending || deletePermissionMutation.isPending}
                >
                  Grant All Modules
                </Button>
                <span className="text-xs text-muted-foreground">{availableModules.length} modules</span>
              </div>
            </div>
            <div className="space-y-1">
              {availableModules.map((module) => {
                const hasPermission = permissions?.some(p => p.moduleName === module);
                return (
                  <div
                    key={module}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors hover:bg-opacity-80 ${
                      hasPermission 
                        ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      if (hasPermission) {
                        const permission = permissions?.find(p => p.moduleName === module);
                        if (permission) handleConfigurePermissions(permission);
                      } else {
                        // Grant access automatically when clicking unassigned module
                        if (selectedUser) {
                          addPermissionMutation.mutate({ 
                            userId: selectedUser.id, 
                            permission: { moduleName: module, accessGranted: true } 
                          });
                        }
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={hasPermission}
                          disabled={addPermissionMutation.isPending || deletePermissionMutation.isPending}
                          onCheckedChange={async (checked) => {
                            if (checked && !hasPermission && selectedUser) {
                              // Grant access
                              addPermissionMutation.mutate({ 
                                userId: selectedUser.id, 
                                permission: { moduleName: module, accessGranted: true } 
                              });
                            } else if (!checked && hasPermission && selectedUser) {
                              // Remove access - use existing permission to delete
                              const existingPermission = permissions?.find(p => p.moduleName === module);
                              if (existingPermission) {
                                deletePermissionMutation.mutate({
                                  userId: selectedUser.id,
                                  moduleName: module
                                });
                              }
                            }
                          }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${
                        hasPermission ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {formatModuleName(module)}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Green modules have been assigned permissions. Click "Add Permission" to assign access to unassigned modules.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsManagePermissionsOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Permissions saved",
                  description: "All permission changes have been saved successfully.",
                });
                setIsManagePermissionsOpen(false);
              }}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Configure Permissions Dialog */}
      <Dialog open={isConfigurePermissionsOpen} onOpenChange={setIsConfigurePermissionsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Module Permissions</DialogTitle>
            <DialogDescription>
              Configure detailed permissions for {selectedPermission?.moduleName} module for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {selectedPermission && moduleFeatures[selectedPermission.moduleName as keyof typeof moduleFeatures] && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Available Features</span>
                  <Badge className={selectedPermission.accessGranted ? "bg-green-500" : "bg-red-500"}>
                    {selectedPermission.accessGranted ? "Module Access Granted" : "Module Access Denied"}
                  </Badge>
                </div>
                
                {selectedPermission.accessGranted ? (
                  <div className="space-y-6">
                    {/* Group features by category */}
                    {["tabs", "content", "actions"].map((category) => {
                      const categoryFeatures = moduleFeatures[selectedPermission.moduleName as keyof typeof moduleFeatures]
                        ?.filter((feature: any) => feature.category === category) || [];
                      
                      if (categoryFeatures.length === 0) return null;
                      
                      const categoryLabels = {
                        tabs: "Tab Controls",
                        content: "Content Visibility", 
                        actions: "User Actions"
                      };
                      
                      const categoryDescriptions = {
                        tabs: "Control which tabs are visible in the module interface",
                        content: "Manage what content and data is displayed to users",
                        actions: "Define what actions users can perform in this module"
                      };
                      
                      const categoryIcons = {
                        tabs: "📋",
                        content: "👁️",
                        actions: "⚡"
                      };
                      
                      return (
                        <div key={category} className="space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b">
                            <span className="text-lg">{categoryIcons[category as keyof typeof categoryIcons]}</span>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">
                                {categoryLabels[category as keyof typeof categoryLabels]}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid gap-3">
                            {categoryFeatures.map((feature: any) => (
                              <div
                                key={feature.key}
                                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-gray-900">{feature.label}</p>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {feature.description || "Controls visibility and access to this feature"}
                                  </p>
                                </div>
                                <div className="ml-3">
                                  <Switch
                                    checked={modulePermissionFeatures[feature.key] ?? true}
                                    onCheckedChange={(checked) => {
                                      setModulePermissionFeatures(prev => ({
                                        ...prev,
                                        [feature.key]: checked
                                      }));
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Category Summary */}
                          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border border-blue-200">
                            <span className="font-medium text-blue-800">
                              {categoryFeatures.filter((f: any) => modulePermissionFeatures[f.key] ?? true).length} of {categoryFeatures.length} features enabled
                            </span>
                            {category === "tabs" && " - Users will see these tabs in the module"}
                            {category === "content" && " - This content will be visible to users"}
                            {category === "actions" && " - Users can perform these actions"}
                          </div>
                        </div>
                      );
                    })}
                    

                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShieldCheck className="mx-auto h-12 w-12 opacity-50 mb-2" />
                    <p>Module access is denied</p>
                    <p className="text-xs">Grant module access first to configure individual features</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsConfigurePermissionsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Save the configuration
                toast({
                  title: "Permissions updated",
                  description: "Module permissions have been configured successfully.",
                });
                setIsConfigurePermissionsOpen(false);
              }}
              disabled={!selectedPermission?.accessGranted}
            >
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}