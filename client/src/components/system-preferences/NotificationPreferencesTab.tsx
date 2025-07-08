import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Bell, Mail, AlertTriangle, Package, Calendar } from 'lucide-react';

interface NotificationPreferencesTabProps {
  preferences: any[];
  onUpdate: () => void;
}

const NotificationPreferencesTab: React.FC<NotificationPreferencesTabProps> = ({ preferences, onUpdate }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      notifications_enabled: true,
      email_notifications: true,
      low_stock_threshold: 10,
      expiry_warning_days: 30,
      notification_email: ''
    }
  });

  // Load preferences into form
  useEffect(() => {
    if (preferences) {
      const notificationPrefs = preferences.filter(p => p.category === 'notifications');
      const formData: any = {};
      
      notificationPrefs.forEach(pref => {
        if (pref.key === 'notifications_enabled' || pref.key === 'email_notifications') {
          formData[pref.key] = Boolean(pref.value);
        } else if (pref.key === 'low_stock_threshold' || pref.key === 'expiry_warning_days') {
          formData[pref.key] = Number(pref.value) || formData[pref.key];
        } else {
          formData[pref.key] = pref.value || '';
        }
      });
      
      form.reset(formData);
    }
  }, [preferences, form]);

  // Update notification preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      const updates = Object.entries(data).map(([key, value]) => ({
        key,
        value,
        category: 'notifications',
        label: key.replace('notification_', '').replace('_', ' ').toLowerCase(),
        description: `Notification setting: ${key.replace('notification_', '').replace('_', ' ')}`,
        dataType: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string'
      }));

      return apiRequest('POST', '/api/system-preferences/bulk', { preferences: updates });
    },
    onSuccess: () => {
      toast({
        title: 'Notification Settings Updated',
        description: 'Your notification preferences have been saved successfully.',
      });
      onUpdate();
    },
    onError: () => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update notification settings. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    await updatePreferencesMutation.mutateAsync(data);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Bell className="h-6 w-6 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold">Notification Preferences</h3>
          <p className="text-sm text-gray-600">Configure alerts and notification settings</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* General Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="notifications_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Enable System Notifications</FormLabel>
                      <p className="text-sm text-gray-600">Allow the system to send notifications and alerts</p>
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

              <FormField
                control={form.control}
                name="email_notifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        Email Notifications
                      </FormLabel>
                      <p className="text-sm text-gray-600">Send notifications via email</p>
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

              <FormField
                control={form.control}
                name="notification_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="email"
                        placeholder="alerts@premiererp.com"
                        className="w-full"
                      />
                    </FormControl>
                    <p className="text-sm text-gray-600">
                      Email address where system alerts will be sent
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Inventory Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Inventory Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="low_stock_threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Low Stock Threshold</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        min="1"
                        max="1000"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-32"
                      />
                    </FormControl>
                    <p className="text-sm text-gray-600">
                      Send alerts when product quantity falls below this level
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiry_warning_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Warning Period (days)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        min="1"
                        max="365"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-32"
                      />
                    </FormControl>
                    <p className="text-sm text-gray-600">
                      Send alerts this many days before products expire
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Notification Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                Notification Examples
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center text-orange-700">
                  <Package className="h-4 w-4 mr-2" />
                  <span className="font-medium">Low Stock Alert</span>
                </div>
                <p className="text-sm text-orange-600 mt-1">
                  Product "Aspirin 100mg" is running low (5 units remaining). Threshold: {form.watch('low_stock_threshold')} units.
                </p>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center text-red-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="font-medium">Expiry Warning</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  Product "Cataflam 500mg" will expire in {form.watch('expiry_warning_days')} days. Please review inventory.
                </p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center text-blue-700">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="font-medium">Email Delivery</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  {form.watch('email_notifications') 
                    ? `Alerts will be sent to: ${form.watch('notification_email') || 'No email configured'}`
                    : 'Email notifications are disabled'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

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

export default NotificationPreferencesTab;