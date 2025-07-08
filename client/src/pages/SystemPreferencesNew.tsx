import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Settings, Building2, Mail, Shield, Database, Bell, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Import tab components
import CompanyInfoTab from '@/components/system-preferences/CompanyInfoTab';
import EmailConfigTab from '@/components/system-preferences/EmailConfigTab';
import SecuritySettingsTab from '@/components/system-preferences/SecuritySettingsTab';
import BackupRecoveryTab from '@/components/system-preferences/BackupRecoveryTab';
import NotificationPreferencesTab from '@/components/system-preferences/NotificationPreferencesTab';
import GeneralSettingsTab from '@/components/system-preferences/GeneralSettingsTab';

const SystemPreferencesNew: React.FC = () => {
  const [activeTab, setActiveTab] = useState('company');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all system preferences
  const { data: allPreferences, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/system-preferences'],
    refetchOnWindowFocus: false,
  });

  // Initialize default preferences
  const initializeMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/system-preferences/initialize'),
    onSuccess: (data) => {
      toast({
        title: 'System Initialized',
        description: `${data.created} default preferences have been created.`,
      });
      refetch();
    },
    onError: () => {
      toast({
        title: 'Initialization Failed',
        description: 'Failed to initialize default preferences.',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading system preferences...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Preferences</h3>
              <p className="text-red-600 mb-4">Failed to load system preferences. Please try again.</p>
              <button 
                onClick={() => refetch()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if preferences need initialization
  const needsInitialization = !allPreferences || allPreferences.length === 0;

  if (needsInitialization) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Settings className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-blue-800 mb-2">System Setup Required</h3>
              <p className="text-blue-600 mb-4">
                It looks like this is your first time accessing System Preferences. 
                We need to initialize default settings for your Premier ERP system.
              </p>
              <button 
                onClick={() => initializeMutation.mutate()}
                disabled={initializeMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center mx-auto"
              >
                {initializeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Initializing...
                  </>
                ) : (
                  'Initialize System Preferences'
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Preferences</h1>
          <p className="text-gray-600 mt-1">
            Configure system-wide settings and preferences for your Premier ERP
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Settings className="h-4 w-4" />
          <span>Premier ERP System</span>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-200">
              <TabsList className="grid w-full grid-cols-6 h-auto p-0 bg-transparent">
                <TabsTrigger 
                  value="company" 
                  className="flex flex-col items-center p-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                >
                  <Building2 className="h-5 w-5 mb-1" />
                  <span className="text-xs">Company Info</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="email" 
                  className="flex flex-col items-center p-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                >
                  <Mail className="h-5 w-5 mb-1" />
                  <span className="text-xs">Email Config</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="flex flex-col items-center p-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                >
                  <Shield className="h-5 w-5 mb-1" />
                  <span className="text-xs">Security</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="backup" 
                  className="flex flex-col items-center p-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                >
                  <Database className="h-5 w-5 mb-1" />
                  <span className="text-xs">Backup</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="flex flex-col items-center p-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                >
                  <Bell className="h-5 w-5 mb-1" />
                  <span className="text-xs">Notifications</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="general" 
                  className="flex flex-col items-center p-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                >
                  <Globe className="h-5 w-5 mb-1" />
                  <span className="text-xs">General</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="company" className="mt-0">
                <CompanyInfoTab preferences={allPreferences} onUpdate={refetch} />
              </TabsContent>
              
              <TabsContent value="email" className="mt-0">
                <EmailConfigTab preferences={allPreferences} onUpdate={refetch} />
              </TabsContent>
              
              <TabsContent value="security" className="mt-0">
                <SecuritySettingsTab preferences={allPreferences} onUpdate={refetch} />
              </TabsContent>
              
              <TabsContent value="backup" className="mt-0">
                <BackupRecoveryTab preferences={allPreferences} onUpdate={refetch} />
              </TabsContent>
              
              <TabsContent value="notifications" className="mt-0">
                <NotificationPreferencesTab preferences={allPreferences} onUpdate={refetch} />
              </TabsContent>
              
              <TabsContent value="general" className="mt-0">
                <GeneralSettingsTab preferences={allPreferences} onUpdate={refetch} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemPreferencesNew;