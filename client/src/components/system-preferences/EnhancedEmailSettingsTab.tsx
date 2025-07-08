import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Send, Shield, Eye, EyeOff } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const emailSettingsSchema = z.object({
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.string().min(1, "SMTP port is required"),
  smtpUsername: z.string().min(1, "SMTP username is required"),
  smtpPassword: z.string().min(1, "SMTP password is required"),
  encryption: z.enum(['none', 'ssl', 'tls']),
  fromName: z.string().min(1, "From name is required"),
  fromEmail: z.string().email("Valid email is required"),
  isEnabled: z.boolean(),
});

type EmailSettingsData = z.infer<typeof emailSettingsSchema>;

const EnhancedEmailSettingsTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  // Fetch email settings
  const { data: emailSettings, isLoading } = useQuery({
    queryKey: ['/api/email-settings'],
    refetchOnWindowFocus: false,
  });

  // Setup form
  const form = useForm<EmailSettingsData>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      smtpUsername: '',
      smtpPassword: '',
      encryption: 'tls',
      fromName: 'Premier ERP System',
      fromEmail: '',
      isEnabled: false,
    },
  });

  // Update form when data loads
  React.useEffect(() => {
    if (emailSettings) {
      form.reset({
        ...emailSettings,
        smtpPort: String(emailSettings.smtpPort || 587),
        isEnabled: emailSettings.isEnabled === true || emailSettings.isEnabled === 'true',
      });
    }
  }, [emailSettings, form]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: EmailSettingsData) => 
      apiRequest('/api/email-settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-settings'] });
      toast({
        title: "Success",
        description: "Email settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update email settings",
        variant: "destructive",
      });
    },
  });

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: (email: string) => 
      apiRequest('/api/test-email', {
        method: 'POST',
        body: JSON.stringify({ testEmail: email }),
      }),
    onSuccess: (data) => {
      toast({
        title: "Test Email Sent",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Test Email Failed",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmailSettingsData) => {
    updateMutation.mutate(data);
  };

  const handleTestEmail = () => {
    if (!testEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to test",
        variant: "destructive",
      });
      return;
    }
    testEmailMutation.mutate(testEmail);
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
            <Mail className="h-5 w-5" />
            Email Configuration
          </CardTitle>
          <CardDescription>
            Configure SMTP settings for sending emails from the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Enable/Disable Email */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">Enable Email System</Label>
                <p className="text-sm text-gray-600">
                  Allow the system to send emails for notifications and alerts
                </p>
              </div>
              <Switch
                checked={form.watch('isEnabled')}
                onCheckedChange={(checked) => form.setValue('isEnabled', checked)}
              />
            </div>

            {/* SMTP Server Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                SMTP Server Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host *</Label>
                  <Input
                    id="smtpHost"
                    {...form.register('smtpHost')}
                    placeholder="smtp.gmail.com"
                  />
                  {form.formState.errors.smtpHost && (
                    <p className="text-sm text-red-600">{form.formState.errors.smtpHost.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port *</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    {...form.register('smtpPort')}
                    placeholder="587"
                  />
                  {form.formState.errors.smtpPort && (
                    <p className="text-sm text-red-600">{form.formState.errors.smtpPort.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="encryption">Encryption Type</Label>
                  <Select
                    value={form.watch('encryption')}
                    onValueChange={(value: 'none' | 'ssl' | 'tls') => form.setValue('encryption', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select encryption" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="tls">TLS (Recommended)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtpUsername">SMTP Username *</Label>
                  <Input
                    id="smtpUsername"
                    {...form.register('smtpUsername')}
                    placeholder="your-email@gmail.com"
                  />
                  {form.formState.errors.smtpUsername && (
                    <p className="text-sm text-red-600">{form.formState.errors.smtpUsername.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password *</Label>
                  <div className="relative">
                    <Input
                      id="smtpPassword"
                      type={showPassword ? 'text' : 'password'}
                      {...form.register('smtpPassword')}
                      placeholder="App password or account password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {form.formState.errors.smtpPassword && (
                    <p className="text-sm text-red-600">{form.formState.errors.smtpPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Email Identity */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Email Identity</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name *</Label>
                  <Input
                    id="fromName"
                    {...form.register('fromName')}
                    placeholder="Premier ERP System"
                  />
                  {form.formState.errors.fromName && (
                    <p className="text-sm text-red-600">{form.formState.errors.fromName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email *</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    {...form.register('fromEmail')}
                    placeholder="noreply@premiererp.com"
                  />
                  {form.formState.errors.fromEmail && (
                    <p className="text-sm text-red-600">{form.formState.errors.fromEmail.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
                className="min-w-32"
              >
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Test Email Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Test Email Configuration
          </CardTitle>
          <CardDescription>
            Send a test email to verify your SMTP settings are working correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="Enter email address to test"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleTestEmail}
              disabled={testEmailMutation.isPending || !form.watch('isEnabled')}
              className="min-w-32"
            >
              {testEmailMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Test Email
            </Button>
          </div>
          {!form.watch('isEnabled') && (
            <p className="text-sm text-amber-600 mt-2">
              Email system is disabled. Enable it above to send test emails.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedEmailSettingsTab;