import { Switch, Route } from "wouter";
import Dashboard from "@/pages/Dashboard";
import Expenses from "@/pages/Expenses";
import Inventory from "@/pages/Inventory";
import InventoryNew from "@/pages/InventoryNew";
import Reports from "@/pages/Reports";
import Approvals from "@/pages/Approvals";
import BackupRestore from "@/pages/BackupRestore";
import Settings from "@/pages/Settings";
import Preferences from "@/pages/Preferences";
import SystemPreferences from "@/pages/SystemPreferences";
import CreateInvoice from "@/pages/CreateInvoice";
import InvoiceHistory from "@/pages/InvoiceHistory";
import LabelGenerator from "@/pages/LabelGenerator";
import Accounting from "@/pages/Accounting";
import UserManagement from "@/pages/UserManagement";
import CustomersDemo from "@/pages/customers-demo";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/MainLayout";
import { useState, useEffect } from "react";

function App() {
  // Set document title
  useEffect(() => {
    document.title = "PharmaOverseas - Pharmaceutical ERP System";
  }, []);

  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/inventory-new" component={InventoryNew} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/sales" component={Reports} />
        <Route path="/reports" component={Reports} />
        <Route path="/accounting" component={Accounting} />
        <Route path="/create-invoice" component={CreateInvoice} />
        <Route path="/invoice-history" component={InvoiceHistory} />
        <Route path="/label" component={LabelGenerator} />
        <Route path="/suppliers" component={Approvals} />
        <Route path="/backup" component={BackupRestore} />
        <Route path="/settings" component={Settings} />
        <Route path="/preferences" component={Preferences} />
        <Route path="/system-preferences" component={SystemPreferences} />
        <Route path="/users" component={UserManagement} />
        <Route path="/customers-demo" component={CustomersDemo} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

export default App;
