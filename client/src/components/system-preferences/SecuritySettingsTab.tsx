import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Shield, Lock, Key, Clock, AlertTriangle } from 'lucide-react';

interface SecuritySettingsTabProps {
  preferences: any[];
  onUpdate: () => void;
}

const SecuritySettingsTab: React.FC<SecuritySettingsTabProps> = ({ preferences, onUpdate }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      password_min_length: 8,
      password_require_uppercase: true,
      password_require_lowercase: true,
      password_require_numbers: true,
      password_require_symbols: false,
      session_timeout: 1440,
      max_login_attempts: 5,
      enable_2fa: false
    }
  });

  // Load preferences into form
  useEffect(() => {
    if (preferences) {
      const securityPrefs = preferences.filter(p => p.category === 'security');
      const formData: any = {};
      
      securityPrefs.forEach(pref => {
        if (pref.key.includes('require_') || pref.key === 'enable_2fa') {
          formData[pref.key] = Boolean(pref.value);
        } else if (pref.key === 'password_min_length' || pref.key === 'session_timeout' || pref.key === 'max_login_attempts') {
          formData[pref.key] = Number(pref.value) || formData[pref.key];
        } else {
          formData[pref.key] = pref.value;
        }
      });
      
      form.reset(formData);
    }
  }, [preferences, form]);

  // Update security preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      const updates = Object.entries(data).map(([key, value]) => ({
        key,
        value,
        category: 'security',
        label: key.replace('password_', '').replace('_', ' ').toLowerCase(),
        description: `Security setting: ${key.replace('password_', '').replace('_', ' ')}`,
        dataType: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string'
      }));

      return apiRequest('POST', '/api/system-preferences/bulk', { preferences: updates });
    },
    onSuccess: () => {
      toast({
        title: 'Security Settings Updated',
        description: 'Your security settings have been saved successfully.',
      });
      onUpdate();
    },
    onError: () => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update security settings. Please try again.',
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
        <Shield className="h-6 w-6 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold">Security Settings</h3>
          <p className="text-sm text-gray-600">Configure security policies and access controls</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Password Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Password Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="password_min_length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Password Length</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        min="4"
                        max="64"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-32"
                      />
                    </FormControl>
                    <p className="text-sm text-gray-600">Characters (minimum 4, maximum 64)</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <p className="text-sm font-medium">Password Requirements</p>
                
                <FormField
                  control={form.control}
                  name="password_require_uppercase"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Require Uppercase Letters</FormLabel>
                        <p className="text-sm text-gray-600">Password must contain at least one uppercase letter (A-Z)</p>
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
                  name="password_require_lowercase"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Require Lowercase Letters</FormLabel>
                        <p className="text-sm text-gray-600">Password must contain at least one lowercase letter (a-z)</p>
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
                  name="password_require_numbers"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Require Numbers</FormLabel>
                        <p className="text-sm text-gray-600">Password must contain at least one number (0-9)</p>
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
                  name="password_require_symbols"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Require Special Characters</FormLabel>
                        <p className="text-sm text-gray-600">Password must contain at least one special character (!@#$%^&*)</p>
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
              </div>
            </CardContent>
          </Card>

          {/* Session Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Session Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="session_timeout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Timeout (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        min="5"
                        max="10080"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-32"
                      />
                    </FormControl>
                    <p className="text-sm text-gray-600">
                      Users will be automatically logged out after this period of inactivity (5 minutes to 1 week)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_login_attempts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Login Attempts</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        min="3"
                        max="10"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-32"
                      />
                    </FormControl>
                    <p className="text-sm text-gray-600">
                      Account will be locked after this many failed login attempts
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Two-Factor Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="enable_2fa"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Two-Factor Authentication</FormLabel>
                      <p className="text-sm text-gray-600">
                        Require users to provide a second form of authentication (SMS, authenticator app)
                      </p>
                      {field.value && (
                        <div className="flex items-center mt-2 text-sm text-amber-600">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Feature coming soon
                        </div>
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

export default SecuritySettingsTab;