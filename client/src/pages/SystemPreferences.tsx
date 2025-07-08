import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import {
  Building2,
  Mail,
  Shield,
  Database,
  Bell,
  Settings
} from 'lucide-react';

// Import enhanced functional tab components
import EnhancedCompanyInfoTab from '@/components/system-preferences/EnhancedCompanyInfoTab';
import EnhancedEmailSettingsTab from '@/components/system-preferences/EnhancedEmailSettingsTab';
import EnhancedSecuritySettingsTab from '@/components/system-preferences/EnhancedSecuritySettingsTab';
import EnhancedBackupTab from '@/components/system-preferences/EnhancedBackupTab';
import EnhancedNotificationsTab from '@/components/system-preferences/EnhancedNotificationsTab';
import EnhancedGeneralSettingsTab from '@/components/system-preferences/EnhancedGeneralSettingsTab';

const SystemPreferences: React.FC = () => {
  const [activeTab, setActiveTab] = useState('company');

  // Fetch system preferences
  const { data: preferences, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/system-preferences'],
    refetchOnWindowFocus: false,
  });

  const renderTabIcon = (tabValue: string) => {
    const activeClass = activeTab === tabValue ? 'text-primary' : 'text-muted-foreground';
    
    switch (tabValue) {
      case 'company':
        return <Building2 className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'email':
        return <Mail className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'security':
        return <Shield className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'backup':
        return <Database className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'notifications':
        return <Bell className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'general':
        return <Settings className={`h-5 w-5 mr-2 ${activeClass}`} />;
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
          Configure system-wide settings and preferences for your Premier ERP
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs 
            defaultValue="company" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b rounded-none h-auto gap-1">
              <TabsTrigger 
                value="company" 
                className="flex items-center justify-center py-3 px-2 text-xs lg:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none min-w-0"
              >
                {renderTabIcon('company')}
                <span className="hidden sm:inline ml-1 truncate">Company</span>
              </TabsTrigger>
              <TabsTrigger 
                value="email" 
                className="flex items-center justify-center py-3 px-2 text-xs lg:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none min-w-0"
              >
                {renderTabIcon('email')}
                <span className="hidden sm:inline ml-1 truncate">Email</span>
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="flex items-center justify-center py-3 px-2 text-xs lg:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none min-w-0"
              >
                {renderTabIcon('security')}
                <span className="hidden sm:inline ml-1 truncate">Security</span>
              </TabsTrigger>
              <TabsTrigger 
                value="backup" 
                className="flex items-center justify-center py-3 px-2 text-xs lg:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none min-w-0"
              >
                {renderTabIcon('backup')}
                <span className="hidden sm:inline ml-1 truncate">Backup</span>
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="flex items-center justify-center py-3 px-2 text-xs lg:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none min-w-0"
              >
                {renderTabIcon('notifications')}
                <span className="hidden lg:inline ml-1 truncate">Notifications</span>
              </TabsTrigger>
              <TabsTrigger 
                value="general" 
                className="flex items-center justify-center py-3 px-2 text-xs lg:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none min-w-0"
              >
                {renderTabIcon('general')}
                <span className="hidden lg:inline ml-1 truncate">General</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="p-6">
              <TabsContent value="company" className="mt-0">
                <EnhancedCompanyInfoTab />
              </TabsContent>
              
              <TabsContent value="email" className="mt-0">
                <EnhancedEmailSettingsTab />
              </TabsContent>
              
              <TabsContent value="security" className="mt-0">
                <EnhancedSecuritySettingsTab />
              </TabsContent>
              
              <TabsContent value="backup" className="mt-0">
                <EnhancedBackupTab />
              </TabsContent>
              
              <TabsContent value="notifications" className="mt-0">
                <EnhancedNotificationsTab />
              </TabsContent>
              
              <TabsContent value="general" className="mt-0">
                <EnhancedGeneralSettingsTab />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemPreferences;