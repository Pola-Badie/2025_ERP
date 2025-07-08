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
import { Loader2, Shield, Lock, Timer, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const securitySettingsSchema = z.object({
  sessionTimeout: z.number().min(5).max(480), // 5 minutes to 8 hours
  passwordMinLength: z.number().min(6).max(32),
  requireSpecialChars: z.boolean(),
  requireUppercase: z.boolean(),
  requireNumbers: z.boolean(),
  maxLoginAttempts: z.number().min(3).max(10),
  enableTwoFactor: z.boolean(),
  autoLockout: z.boolean(),
  lockoutDuration: z.number().min(1).max(60), // 1 to 60 minutes
});

type SecuritySettingsData = z.infer<typeof securitySettingsSchema>;

const EnhancedSecuritySettingsTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch security settings from system preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['/api/system-preferences'],
    refetchOnWindowFocus: false,
  });

  // Setup form
  const form = useForm<SecuritySettingsData>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      sessionTimeout: 30,
      passwordMinLength: 8,
      requireSpecialChars: true,
      requireUppercase: true,
      requireNumbers: true,
      maxLoginAttempts: 5,
      enableTwoFactor: false,
      autoLockout: true,
      lockoutDuration: 15,
    },
  });

  // Extract security preferences and update form
  React.useEffect(() => {
    if (preferences) {
      const securityPrefs = preferences.filter((pref: any) => pref.category === 'security');
      const formData: Partial<SecuritySettingsData> = {};

      securityPrefs.forEach((pref: any) => {
        switch (pref.key) {
          case 'sessionTimeout':
            formData.sessionTimeout = parseInt(pref.value) || 30;
            break;
          case 'passwordMinLength':
            formData.passwordMinLength = parseInt(pref.value) || 8;
            break;
          case 'requireSpecialChars':
            formData.requireSpecialChars = pref.value === 'true';
            break;
          case 'maxLoginAttempts':
            formData.maxLoginAttempts = parseInt(pref.value) || 5;
            break;
          // Add more security preferences as needed
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
    mutationFn: async (data: SecuritySettingsData) => {
      const updates = [
        { key: 'sessionTimeout', value: data.sessionTimeout },
        { key: 'passwordMinLength', value: data.passwordMinLength },
        { key: 'requireSpecialChars', value: data.requireSpecialChars },
        { key: 'maxLoginAttempts', value: data.maxLoginAttempts },
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
        description: "Security settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update security settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SecuritySettingsData) => {
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
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure security policies and authentication requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Session Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Session Management
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sessionTimeout">Session Timeout</Label>
                    <span className="text-sm font-medium">{form.watch('sessionTimeout')} minutes</span>
                  </div>
                  <Slider
                    value={[form.watch('sessionTimeout')]}
                    onValueChange={([value]) => form.setValue('sessionTimeout', value)}
                    max={480}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-600">
                    Users will be automatically logged out after this period of inactivity
                  </p>
                </div>
              </div>
            </div>

            {/* Password Policy */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password Policy
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                    <span className="text-sm font-medium">{form.watch('passwordMinLength')} characters</span>
                  </div>
                  <Slider
                    value={[form.watch('passwordMinLength')]}
                    onValueChange={([value]) => form.setValue('passwordMinLength', value)}
                    max={32}
                    min={6}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Require Special Characters</Label>
                      <p className="text-sm text-gray-600">
                        Passwords must contain at least one special character (!@#$%^&*)
                      </p>
                    </div>
                    <Switch
                      checked={form.watch('requireSpecialChars')}
                      onCheckedChange={(checked) => form.setValue('requireSpecialChars', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Require Uppercase Letters</Label>
                      <p className="text-sm text-gray-600">
                        Passwords must contain at least one uppercase letter
                      </p>
                    </div>
                    <Switch
                      checked={form.watch('requireUppercase')}
                      onCheckedChange={(checked) => form.setValue('requireUppercase', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Require Numbers</Label>
                      <p className="text-sm text-gray-600">
                        Passwords must contain at least one number
                      </p>
                    </div>
                    <Switch
                      checked={form.watch('requireNumbers')}
                      onCheckedChange={(checked) => form.setValue('requireNumbers', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Login Security */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Login Security
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maxLoginAttempts">Maximum Login Attempts</Label>
                    <span className="text-sm font-medium">{form.watch('maxLoginAttempts')} attempts</span>
                  </div>
                  <Slider
                    value={[form.watch('maxLoginAttempts')]}
                    onValueChange={([value]) => form.setValue('maxLoginAttempts', value)}
                    max={10}
                    min={3}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-600">
                    Account will be locked after this many failed login attempts
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Enable Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-600">
                      Require additional verification for login (Coming Soon)
                    </p>
                  </div>
                  <Switch
                    checked={form.watch('enableTwoFactor')}
                    onCheckedChange={(checked) => form.setValue('enableTwoFactor', checked)}
                    disabled
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Auto Account Lockout</Label>
                    <p className="text-sm text-gray-600">
                      Automatically lock accounts after failed login attempts
                    </p>
                  </div>
                  <Switch
                    checked={form.watch('autoLockout')}
                    onCheckedChange={(checked) => form.setValue('autoLockout', checked)}
                  />
                </div>

                {form.watch('autoLockout') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="lockoutDuration">Lockout Duration</Label>
                      <span className="text-sm font-medium">{form.watch('lockoutDuration')} minutes</span>
                    </div>
                    <Slider
                      value={[form.watch('lockoutDuration')]}
                      onValueChange={([value]) => form.setValue('lockoutDuration', value)}
                      max={60}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                )}
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
                Save Security Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedSecuritySettingsTab;