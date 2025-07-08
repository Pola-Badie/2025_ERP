import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Globe, Clock, DollarSign, FileText, Settings, AlertTriangle, Info } from 'lucide-react';

interface GeneralSettingsTabProps {
  preferences: any[];
  onUpdate: () => void;
}

const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({ preferences, onUpdate }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      system_language: 'en',
      system_timezone: 'UTC',
      date_format: 'YYYY-MM-DD',
      currency_symbol: 'USD',
      records_per_page: 10,
      maintenance_mode: false
    }
  });

  // Fetch system information
  const { data: systemInfo } = useQuery({
    queryKey: ['/api/system-preferences/system-info'],
    refetchOnWindowFocus: false,
  });

  // Load preferences into form
  useEffect(() => {
    if (preferences) {
      const generalPrefs = preferences.filter(p => p.category === 'general');
      const formData: any = {};
      
      generalPrefs.forEach(pref => {
        if (pref.key === 'maintenance_mode') {
          formData[pref.key] = Boolean(pref.value);
        } else if (pref.key === 'records_per_page') {
          formData[pref.key] = Number(pref.value) || 10;
        } else {
          formData[pref.key] = pref.value || formData[pref.key];
        }
      });
      
      form.reset(formData);
    }
  }, [preferences, form]);

  // Update general preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      const updates = Object.entries(data).map(([key, value]) => ({
        key,
        value,
        category: 'general',
        label: key.replace('system_', '').replace('_', ' ').toLowerCase(),
        description: `General setting: ${key.replace('system_', '').replace('_', ' ')}`,
        dataType: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string'
      }));

      return apiRequest('POST', '/api/system-preferences/bulk', { preferences: updates });
    },
    onSuccess: () => {
      toast({
        title: 'General Settings Updated',
        description: 'Your general settings have been saved successfully.',
      });
      onUpdate();
    },
    onError: () => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update general settings. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    await updatePreferencesMutation.mutateAsync(data);
    setIsLoading(false);
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Globe className="h-6 w-6 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold">General Settings</h3>
          <p className="text-sm text-gray-600">Configure system-wide preferences and locale settings</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Localization Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Localization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="system_language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>System Language</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ar">العربية (Arabic)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="system_timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>System Timezone</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time (US)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (US)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (US)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (US)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                          <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                          <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                          <SelectItem value="Africa/Cairo">Cairo (EET)</SelectItem>
                          <SelectItem value="Asia/Riyadh">Riyadh (AST)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Format</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select date format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency_symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                          <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                          <SelectItem value="EGP">EGP - Egyptian Pound (£E)</SelectItem>
                          <SelectItem value="SAR">SAR - Saudi Riyal (﷼)</SelectItem>
                          <SelectItem value="AED">AED - UAE Dirham (د.إ)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Display Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="records_per_page"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Records Per Page</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        min="5"
                        max="100"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-32"
                      />
                    </FormControl>
                    <p className="text-sm text-gray-600">
                      Default number of records to display in tables and lists
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* System Maintenance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                System Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="maintenance_mode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                        Maintenance Mode
                      </FormLabel>
                      <p className="text-sm text-gray-600">
                        Temporarily disable system access for maintenance
                      </p>
                      {field.value && (
                        <p className="text-sm text-amber-600 font-medium">
                          ⚠️ System is currently in maintenance mode
                        </p>
                      )}
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* System Information */}
          {systemInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">System Version</p>
                    <p className="text-gray-600">{systemInfo.version}</p>
                  </div>
                  <div>
                    <p className="font-medium">Database Status</p>
                    <p className="text-gray-600">{systemInfo.database}</p>
                  </div>
                  <div>
                    <p className="font-medium">System Uptime</p>
                    <p className="text-gray-600">{formatUptime(systemInfo.uptime)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Node.js Version</p>
                    <p className="text-gray-600">{systemInfo.nodeVersion}</p>
                  </div>
                  <div>
                    <p className="font-medium">Platform</p>
                    <p className="text-gray-600">{systemInfo.platform}</p>
                  </div>
                  <div>
                    <p className="font-medium">Memory Usage</p>
                    <p className="text-gray-600">
                      {Math.round(systemInfo.memory.heapUsed / 1024 / 1024)} MB / {Math.round(systemInfo.memory.heapTotal / 1024 / 1024)} MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => form.reset()}
            >
              Reset
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || updatePreferencesMutation.isPending}
              className="min-w-[120px]"
            >
              {isLoading || updatePreferencesMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default GeneralSettingsTab;