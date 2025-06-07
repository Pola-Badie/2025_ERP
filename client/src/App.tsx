import { Switch, Route } from "wouter";
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { LanguageProvider } from "./contexts/LanguageContext";
import { CSVProvider } from "./contexts/CSVContext";
import { PaginationProvider } from "./contexts/PaginationContext";

// Lazy load components for better performance
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Expenses = lazy(() => import("@/pages/Expenses"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const Reports = lazy(() => import("@/pages/Reports"));
const Suppliers = lazy(() => import("@/pages/Suppliers"));
const BackupRestore = lazy(() => import("@/pages/BackupRestore"));
const Settings = lazy(() => import("@/pages/Settings"));
const SystemPreferences = lazy(() => import("@/pages/SystemPreferences"));
const CreateInvoice = lazy(() => import("@/pages/CreateInvoice"));
const CreateQuotation = lazy(() => import("@/pages/CreateQuotation"));
const InvoiceHistory = lazy(() => import("@/pages/InvoiceHistory"));
const QuotationHistory = lazy(() => import("@/pages/QuotationHistory"));
const LabelGenerator = lazy(() => import("@/pages/LabelGenerator"));
const Accounting = lazy(() => import("@/pages/Accounting"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));
const CustomersDemo = lazy(() => import("@/pages/customers-demo"));
const Procurement = lazy(() => import("@/pages/Procurement"));
const OrderManagement = lazy(() => import("@/pages/OrderManagement"));
const OrdersHistory = lazy(() => import("@/pages/OrdersHistory"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Payroll = lazy(() => import("@/pages/Payroll"));
const Login = lazy(() => import("@/pages/Login"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

function App() {
  // Set document title
  useEffect(() => {
    document.title = "Morgan ERP - Enterprise Resource Planning System";
  }, []);

  return (
    <LanguageProvider>
      <CSVProvider>
        <PaginationProvider>
          <MainLayout>
            <Suspense fallback={<PageLoader />}>
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/inventory" component={Inventory} />
                <Route path="/expenses" component={Expenses} />
                <Route path="/sales" component={Reports} />
                <Route path="/reports" component={Reports} />
                <Route path="/accounting" component={Accounting} />
                <Route path="/create-invoice" component={CreateInvoice} />
                <Route path="/create-quotation" component={CreateQuotation} />
                <Route path="/invoice-history" component={InvoiceHistory} />
                <Route path="/quotation-history" component={QuotationHistory} />
                <Route path="/label" component={LabelGenerator} />
                <Route path="/suppliers" component={Suppliers} />
                <Route path="/backup" component={BackupRestore} />
                <Route path="/settings" component={Settings} />
                <Route path="/system-preferences" component={SystemPreferences} />
                <Route path="/users" component={UserManagement} />
                <Route path="/customers-demo" component={CustomersDemo} />
                <Route path="/procurement" component={Procurement} />
                <Route path="/order-management" component={OrderManagement} />
                <Route path="/orders-history" component={OrdersHistory} />
                <Route path="/notifications" component={Notifications} />
                <Route path="/payroll" component={Payroll} />
                <Route path="/login" component={Login} />
                <Route component={NotFound} />
              </Switch>
            </Suspense>
          </MainLayout>
        </PaginationProvider>
      </CSVProvider>
    </LanguageProvider>
  );
}

export default App;
