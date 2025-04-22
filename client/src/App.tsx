import { Switch, Route } from "wouter";
import Dashboard from "@/pages/Dashboard";
import Expenses from "@/pages/Expenses";
import Reports from "@/pages/Reports";
import Approvals from "@/pages/Approvals";
import BackupRestore from "@/pages/BackupRestore";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/MainLayout";
import { useState, useEffect } from "react";

function App() {
  // Set document title
  useEffect(() => {
    document.title = "ExpenseEstate - Real Estate Expense Management";
  }, []);

  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/reports" component={Reports} />
        <Route path="/approvals" component={Approvals} />
        <Route path="/backup" component={BackupRestore} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

export default App;
