import { Switch, Route } from "wouter";
import React, { useState, useEffect, Suspense } from "react";
import { Loader2 } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { LanguageProvider } from "./contexts/LanguageContext";
import { CSVProvider } from "./contexts/CSVContext";

// Import components directly to avoid issues with wouter
import Dashboard from "@/pages/Dashboard";
import Expenses from "@/pages/Expenses";
import Inventory from "@/pages/Inventory";
import Reports from "@/pages/Reports";
import Suppliers from "@/pages/Suppliers";
import BackupRestore from "@/pages/BackupRestore";
import Settings from "@/pages/Settings";
import SystemPreferences from "@/pages/SystemPreferences";
import CreateInvoice from "@/pages/CreateInvoice";
import CreateQuotation from "@/pages/CreateQuotation";
import InvoiceHistory from "@/pages/InvoiceHistory";
import QuotationHistory from "@/pages/QuotationHistory";
import LabelGenerator from "@/pages/LabelGenerator";
import Accounting from "@/pages/Accounting";
import UserManagement from "@/pages/UserManagement";
import CustomersDemo from "@/pages/customers-demo";
import Procurement from "@/pages/Procurement";
import OrderManagement from "@/pages/OrderManagement";
import NotFound from "@/pages/not-found";

function App() {
  // Set document title
  useEffect(() => {
    document.title = "PharmaOverseas - Pharmaceutical ERP System";
  }, []);

  return (
    <LanguageProvider>
      <CSVProvider>
        <MainLayout>
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
            <Route component={NotFound} />
          </Switch>
        </MainLayout>
      </CSVProvider>
    </LanguageProvider>
  );
}

export default App;
