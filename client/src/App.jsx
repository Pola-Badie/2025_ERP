import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { LanguageProvider } from "./contexts/LanguageContext";
import { CSVProvider } from "./contexts/CSVContext";
import { PaginationProvider } from "./contexts/PaginationContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { UserPermissionsProvider } from "./contexts/UserPermissionsContext";
import { useUserPermissions } from "./contexts/UserPermissionsContext";
import { Redirect } from "wouter";
// Import components directly to avoid issues with wouter
import DashboardNew from "@/pages/DashboardNew";
import Expenses from "@/pages/Expenses";
import Inventory from "@/pages/Inventory";
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
import Customers from "@/pages/customers";
import Procurement from "@/pages/Procurement";
import OrderManagement from "@/pages/OrderManagement";
import OrdersHistory from "@/pages/OrdersHistory";
import Notifications from "@/pages/Notifications";
import Payroll from "@/pages/Payroll";
import Reports from "@/pages/Reports";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
// Component to redirect to first available module
function FirstAvailableRoute() {
    const { permissions, isLoading, hasPermission } = useUserPermissions();
    const { user } = useAuth();
    if (isLoading) {
        return (<div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600"/>
      </div>);
    }
    // Admin users go to dashboard
    if (user?.role === 'admin') {
        return <DashboardNew />;
    }
    // For staff users, redirect to first available module
    const moduleRoutes = [
        { permission: 'inventory', route: '/inventory' },
        { permission: 'accounting', route: '/accounting' },
        { permission: 'expenses', route: '/expenses' },
        { permission: 'reports', route: '/reports' },
        { permission: 'suppliers', route: '/suppliers' },
        { permission: 'customers', route: '/customers' },
        { permission: 'procurement', route: '/procurement' },
        { permission: 'order-management', route: '/order-management' },
        { permission: 'orders-history', route: '/orders-history' },
        { permission: 'users', route: '/users' },
        { permission: 'payroll', route: '/payroll' },
        { permission: 'settings', route: '/settings' },
        { permission: 'notifications', route: '/notifications' }
    ];
    // Find first available module
    for (const moduleRoute of moduleRoutes) {
        if (hasPermission(moduleRoute.permission)) {
            return <Redirect to={moduleRoute.route}/>;
        }
    }
    // If no permissions found, show access denied
    return (<div className="flex items-center justify-center min-h-screen p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Restricted</h2>
        <p className="text-gray-600">You don't have access to any modules. Contact your administrator.</p>
      </div>
    </div>);
}
// Separate component to use auth hook inside AuthProvider
function AppContent() {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return (<div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600"/>
      </div>);
    }
    return (<Switch>
      <Route path="/login" component={Login}/>
      <Route>
        {() => (isAuthenticated ? (<MainLayout>
              <Switch>
                <Route path="/" component={FirstAvailableRoute}/>
                <Route path="/inventory" component={Inventory}/>
                <Route path="/expenses" component={Expenses}/>
                <Route path="/accounting" component={Accounting}/>
                <Route path="/reports" component={Reports}/>
                <Route path="/create-invoice" component={CreateInvoice}/>
                <Route path="/create-quotation" component={CreateQuotation}/>
                <Route path="/invoice-history" component={InvoiceHistory}/>
                <Route path="/quotation-history" component={QuotationHistory}/>
                <Route path="/label" component={LabelGenerator}/>
                <Route path="/suppliers" component={Suppliers}/>
                <Route path="/backup" component={BackupRestore}/>
                <Route path="/settings" component={Settings}/>
                <Route path="/system-preferences" component={SystemPreferences}/>
                <Route path="/users" component={UserManagement}/>
                <Route path="/customers" component={Customers}/>
                <Route path="/customers-demo">
                  {() => {
                window.location.replace('/customers');
                return null;
            }}
                </Route>
                <Route path="/procurement" component={Procurement}/>
                <Route path="/order-management" component={OrderManagement}/>
                <Route path="/orders-history" component={OrdersHistory}/>
                <Route path="/notifications" component={Notifications}/>
                <Route path="/payroll" component={Payroll}/>
                <Route component={NotFound}/>
              </Switch>
            </MainLayout>) : (<Login />))}
      </Route>
    </Switch>);
}
function App() {
    // Set document title
    useEffect(() => {
        document.title = "Premier ERP - Enterprise Resource Planning System";
    }, []);
    return (<AuthProvider>
      <UserPermissionsProvider>
        <LanguageProvider>
          <CSVProvider>
            <PaginationProvider>
              <NotificationProvider>
                <SidebarProvider>
                  <AppContent />
                </SidebarProvider>
              </NotificationProvider>
            </PaginationProvider>
          </CSVProvider>
        </LanguageProvider>
      </UserPermissionsProvider>
    </AuthProvider>);
}
export default App;
