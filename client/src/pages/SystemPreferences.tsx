import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import {
  UsersIcon,
  BoxIcon,
  DollarSignIcon,
  ShieldIcon,
  BellIcon,
  BuildingIcon,
} from 'lucide-react';

// Import tab components
import UserManagementTab from '@/components/system-preferences/UserManagementTab';
import InventorySettingsTab from '@/components/system-preferences/InventorySettingsTab';
import FinancialSettingsTab from '@/components/system-preferences/FinancialSettingsTab';
import AccessControlTab from '@/components/system-preferences/AccessControlTab';
import NotificationsTab from '@/components/system-preferences/NotificationsTab';
import CompanyInfoTab from '@/components/system-preferences/CompanyInfoTab';

const SystemPreferences: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');

  // Fetch system preferences
  const { data: preferences, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/system-preferences'],
    refetchOnWindowFocus: false,
  });

  const renderTabIcon = (tabValue: string) => {
    const activeClass = activeTab === tabValue ? 'text-primary' : 'text-muted-foreground';
    
    switch (tabValue) {
      case 'users':
        return <UsersIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'inventory':
        return <BoxIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'financial':
        return <DollarSignIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'access':
        return <ShieldIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'notifications':
        return <BellIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'company':
        return <BuildingIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> Failed to load system preferences. Please try again or contact support.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">System Preferences</h1>
        <p className="text-muted-foreground">
          Configure system-wide settings and preferences for your PharmaOverseas ERP
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs 
            defaultValue="users" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 md:grid-cols-6 border-b rounded-none h-auto">
              <TabsTrigger 
                value="users" 
                className="flex items-center justify-center py-3 px-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                {renderTabIcon('users')}
                <span className="hidden md:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger 
                value="inventory" 
                className="flex items-center justify-center py-3 px-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                {renderTabIcon('inventory')}
                <span className="hidden md:inline">Inventory</span>
              </TabsTrigger>
              <TabsTrigger 
                value="financial" 
                className="flex items-center justify-center py-3 px-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                {renderTabIcon('financial')}
                <span className="hidden md:inline">Financial</span>
              </TabsTrigger>
              <TabsTrigger 
                value="access" 
                className="flex items-center justify-center py-3 px-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                {renderTabIcon('access')}
                <span className="hidden md:inline">Access</span>
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="flex items-center justify-center py-3 px-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                {renderTabIcon('notifications')}
                <span className="hidden md:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger 
                value="company" 
                className="flex items-center justify-center py-3 px-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                {renderTabIcon('company')}
                <span className="hidden md:inline">Company</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="p-6">
              <TabsContent value="users" className="mt-0">
                <UserManagementTab preferences={preferences} refetch={refetch} />
              </TabsContent>
              
              <TabsContent value="inventory" className="mt-0">
                <InventorySettingsTab preferences={preferences} refetch={refetch} />
              </TabsContent>
              
              <TabsContent value="financial" className="mt-0">
                <FinancialSettingsTab preferences={preferences} refetch={refetch} />
              </TabsContent>
              
              <TabsContent value="access" className="mt-0">
                <AccessControlTab preferences={preferences} refetch={refetch} />
              </TabsContent>
              
              <TabsContent value="notifications" className="mt-0">
                <NotificationsTab preferences={preferences} refetch={refetch} />
              </TabsContent>
              
              <TabsContent value="company" className="mt-0">
                <CompanyInfoTab preferences={preferences} refetch={refetch} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemPreferences;