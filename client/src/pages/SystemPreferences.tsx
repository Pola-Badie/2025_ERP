import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Import tabs
import UserManagementTab from '@/components/system-preferences/UserManagementTab';
import InventorySettingsTab from '@/components/system-preferences/InventorySettingsTab';
import FinancialSettingsTab from '@/components/system-preferences/FinancialSettingsTab';
import AccessControlTab from '@/components/system-preferences/AccessControlTab';
import NotificationsTab from '@/components/system-preferences/NotificationsTab';
import CompanyInfoTab from '@/components/system-preferences/CompanyInfoTab';

const SystemPreferences = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('user-management');

  // Fetch system preferences
  const { data: preferences, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/system-preferences'],
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    toast({
      title: "Error loading preferences",
      description: "Failed to load system preferences. Please try again.",
      variant: "destructive",
    });
  }

  return (
    <div className="container px-4 md:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">System Preferences</h1>
      </div>

      <Tabs defaultValue="user-management" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-6">
          <TabsTrigger value="user-management">Users</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="access-control">Access Control</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
        </TabsList>

        <div className="grid gap-6">
          <TabsContent value="user-management">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Create, edit, and manage user accounts and roles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagementTab preferences={preferences} refetch={refetch} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Settings</CardTitle>
                <CardDescription>
                  Configure global inventory settings, units, and tracking options.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InventorySettingsTab preferences={preferences} refetch={refetch} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle>Financial Settings</CardTitle>
                <CardDescription>
                  Set currency, tax rates, payment terms, and invoice options.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FinancialSettingsTab preferences={preferences} refetch={refetch} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access-control">
            <Card>
              <CardHeader>
                <CardTitle>System Access Control</CardTitle>
                <CardDescription>
                  Configure session timeouts, maintenance mode, and access logs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AccessControlTab preferences={preferences} refetch={refetch} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications & Alerts</CardTitle>
                <CardDescription>
                  Configure alert thresholds, expiry notifications, and critical error settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationsTab preferences={preferences} refetch={refetch} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Manage company details, logo, and invoice customization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CompanyInfoTab preferences={preferences} refetch={refetch} />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default SystemPreferences;