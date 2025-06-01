import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import {
  UsersIcon,
  PackageIcon,
  DollarSignIcon,
  ShieldIcon,
  MessageSquareIcon,
  CloudIcon,
  FileTextIcon,
  SettingsIcon
} from 'lucide-react';

// Import tab components
import UserManagementTab from '@/components/system-preferences/UserManagementTab-new';
import InventorySettingsTab from '@/components/system-preferences/InventorySettingsTab';
import FinancialConfigurationTab from '@/components/system-preferences/FinancialConfigurationTab';
import SecuritySettingsTab from '@/components/system-preferences/SecuritySettingsTab';
import CommunicationSettingsTab from '@/components/system-preferences/CommunicationSettingsTab';
import BackupTab from '@/components/system-preferences/BackupTab';
import ETAIntegrationTab from '@/components/system-preferences/ETAIntegrationTab';

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
        return <PackageIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'financial':
        return <DollarSignIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'security':
        return <ShieldIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'communication':
        return <MessageSquareIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'backup':
        return <CloudIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'eta':
        return <FileTextIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'modules':
        return <SettingsIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
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
            <TabsList className="grid grid-cols-4 md:grid-cols-8 border-b rounded-none h-auto">
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
                value="security" 
                className="flex items-center justify-center py-3 px-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                {renderTabIcon('security')}
                <span className="hidden md:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger 
                value="communication" 
                className="flex items-center justify-center py-3 px-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                {renderTabIcon('communication')}
                <span className="hidden md:inline">Communication</span>
              </TabsTrigger>
              <TabsTrigger 
                value="backup" 
                className="flex items-center justify-center py-3 px-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                {renderTabIcon('backup')}
                <span className="hidden md:inline">Backup</span>
              </TabsTrigger>
              <TabsTrigger 
                value="eta" 
                className="flex items-center justify-center py-3 px-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                {renderTabIcon('eta')}
                <span className="hidden md:inline">ETA</span>
              </TabsTrigger>
              <TabsTrigger 
                value="modules" 
                className="flex items-center justify-center py-3 px-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                {renderTabIcon('modules')}
                <span className="hidden md:inline">Modules</span>
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
                <FinancialConfigurationTab preferences={preferences} refetch={refetch} />
              </TabsContent>
              
              <TabsContent value="security" className="mt-0">
                <SecuritySettingsTab preferences={preferences} refetch={refetch} />
              </TabsContent>
              
              <TabsContent value="communication" className="mt-0">
                <CommunicationSettingsTab preferences={preferences} refetch={refetch} />
              </TabsContent>
              
              <TabsContent value="backup" className="mt-0">
                <BackupTab preferences={preferences} refetch={refetch} />
              </TabsContent>
              
              <TabsContent value="eta" className="mt-0">
                <ETAIntegrationTab preferences={preferences} refetch={refetch} />
              </TabsContent>
              
              <TabsContent value="modules" className="mt-0">
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold mb-2">Module Configuration</h3>
                  <p className="text-muted-foreground">
                    Advanced module configuration will be available in the next update.
                  </p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemPreferences;