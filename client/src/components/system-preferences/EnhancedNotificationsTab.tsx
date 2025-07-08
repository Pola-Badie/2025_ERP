import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Bell, Mail, AlertTriangle, Package, Calendar } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const notificationSettingsSchema = z.object({
  lowStockThreshold: z.number().min(1).max(100),
  expiryWarningDays: z.number().min(1).max(365),
  enableEmailAlerts: z.boolean(),
  enableSmsAlerts: z.boolean(),
  enableDashboardAlerts: z.boolean(),
  enableInventoryAlerts: z.boolean(),
  enableAccountingAlerts: z.boolean(),
  enableUserActivityAlerts: z.boolean(),
  alertEmails: z.string().optional(),
});

type NotificationSettingsData = z.infer<typeof notificationSettingsSchema>;

const EnhancedNotificationsTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notification settings from system preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['/api/system-preferences'],
    refetchOnWindowFocus: false,
  });

  // Setup form
  const form = useForm<NotificationSettingsData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      lowStockThreshold: 10,
      expiryWarningDays: 30,
      enableEmailAlerts: true,
      enableSmsAlerts: false,
      enableDashboardAlerts: true,
      enableInventoryAlerts: true,
      enableAccountingAlerts: true,
      enableUserActivityAlerts: false,
      alertEmails: '',
    },
  });

  // Extract notification preferences and update form
  React.useEffect(() => {
    if (preferences) {
      const notificationPrefs = preferences.filter((pref: any) => pref.category === 'notifications');
      const formData: Partial<NotificationSettingsData> = {};

      notificationPrefs.forEach((pref: any) => {
        switch (pref.key) {
          case 'lowStockThreshold':
            formData.lowStockThreshold = parseInt(pref.value) || 10;
            break;
          case 'expiryWarningDays':
            formData.expiryWarningDays = parseInt(pref.value) || 30;
            break;
          case 'enableEmailAlerts':
            formData.enableEmailAlerts = pref.value === 'true';
            break;
          case 'enableSmsAlerts':
            formData.enableSmsAlerts = pref.value === 'true';
            break;
        }
      });

      if (Object.keys(formData).length > 0) {
        form.reset({ ...form.getValues(), ...formData });
      }
    }
  }, [preferences, form]);

  // Update individual preference mutation
  const updatePreferenceMutation = useMutation({
    mutationFn: ({ key, value }: { key: string, value: any }) => 
      apiRequest(`/api/system-preferences/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      }),
  });

  // Update all settings
  const updateAllMutation = useMutation({
    mutationFn: async (data: NotificationSettingsData) => {
      const updates = [
        { key: 'lowStockThreshold', value: data.lowStockThreshold },
        { key: 'expiryWarningDays', value: data.expiryWarningDays },
        { key: 'enableEmailAlerts', value: data.enableEmailAlerts },
        { key: 'enableSmsAlerts', value: data.enableSmsAlerts },
      ];

      // Update all preferences
      await Promise.all(
        updates.map(update => updatePreferenceMutation.mutateAsync(update))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-preferences'] });
      toast({
        title: "Success",
        description: "Notification settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update notification settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NotificationSettingsData) => {
    updateAllMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure alert preferences and notification thresholds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Alert Channels */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Alert Channels
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Email Alerts</Label>
                    <p className="text-sm text-gray-600">
                      Send notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={form.watch('enableEmailAlerts')}
                    onCheckedChange={(checked) => form.setValue('enableEmailAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">SMS Alerts</Label>
                    <p className="text-sm text-gray-600">
                      Send notifications via SMS (Coming Soon)
                    </p>
                  </div>
                  <Switch
                    checked={form.watch('enableSmsAlerts')}
                    onCheckedChange={(checked) => form.setValue('enableSmsAlerts', checked)}
                    disabled
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Dashboard Alerts</Label>
                    <p className="text-sm text-gray-600">
                      Show notifications on the dashboard
                    </p>
                  </div>
                  <Switch
                    checked={form.watch('enableDashboardAlerts')}
                    onCheckedChange={(checked) => form.setValue('enableDashboardAlerts', checked)}
                  />
                </div>
              </div>

              {form.watch('enableEmailAlerts') && (
                <div className="space-y-2">
                  <Label htmlFor="alertEmails">Alert Email Addresses</Label>
                  <Input
                    id="alertEmails"
                    {...form.register('alertEmails')}
                    placeholder="admin@company.com, manager@company.com"
                  />
                  <p className="text-sm text-gray-600">
                    Separate multiple email addresses with commas
                  </p>
                </div>
              )}
            </div>

            {/* Inventory Alerts */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Inventory Alerts
              </h3>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Enable Inventory Alerts</Label>
                  <p className="text-sm text-gray-600">
                    Get notified about low stock and expiring products
                  </p>
                </div>
                <Switch
                  checked={form.watch('enableInventoryAlerts')}
                  onCheckedChange={(checked) => form.setValue('enableInventoryAlerts', checked)}
                />
              </div>

              {form.watch('enableInventoryAlerts') && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
                      <span className="text-sm font-medium">{form.watch('lowStockThreshold')} units</span>
                    </div>
                    <Slider
                      value={[form.watch('lowStockThreshold')]}
                      onValueChange={([value]) => form.setValue('lowStockThreshold', value)}
                      max={100}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-sm text-gray-600">
                      Alert when product quantity falls below this number
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="expiryWarningDays">Expiry Warning Period</Label>
                      <span className="text-sm font-medium">{form.watch('expiryWarningDays')} days</span>
                    </div>
                    <Slider
                      value={[form.watch('expiryWarningDays')]}
                      onValueChange={([value]) => form.setValue('expiryWarningDays', value)}
                      max={365}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-sm text-gray-600">
                      Alert when products are about to expire within this period
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* System Alerts */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                System Alerts
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Accounting Alerts</Label>
                    <p className="text-sm text-gray-600">
                      Notifications for overdue invoices and payment issues
                    </p>
                  </div>
                  <Switch
                    checked={form.watch('enableAccountingAlerts')}
                    onCheckedChange={(checked) => form.setValue('enableAccountingAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">User Activity Alerts</Label>
                    <p className="text-sm text-gray-600">
                      Notifications for suspicious login activity
                    </p>
                  </div>
                  <Switch
                    checked={form.watch('enableUserActivityAlerts')}
                    onCheckedChange={(checked) => form.setValue('enableUserActivityAlerts', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={updateAllMutation.isPending}
                className="min-w-32"
              >
                {updateAllMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Notification Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedNotificationsTab;