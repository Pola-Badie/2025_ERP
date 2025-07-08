import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';

interface EmailConfigTabProps {
  preferences: any[];
  onUpdate: () => void;
}

const EmailConfigTab: React.FC<EmailConfigTabProps> = ({ preferences, onUpdate }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  const form = useForm({
    defaultValues: {
      smtp_host: '',
      smtp_port: 587,
      smtp_username: '',
      smtp_password: '',
      smtp_secure: true,
      email_from_name: 'Premier ERP',
      email_from_address: ''
    }
  });

  // Load preferences into form
  useEffect(() => {
    if (preferences) {
      const emailPrefs = preferences.filter(p => p.category === 'email');
      const formData: any = {};
      
      emailPrefs.forEach(pref => {
        if (pref.key === 'smtp_port') {
          formData[pref.key] = Number(pref.value) || 587;
        } else if (pref.key === 'smtp_secure') {
          formData[pref.key] = Boolean(pref.value);
        } else {
          formData[pref.key] = pref.value || '';
        }
      });
      
      form.reset(formData);
    }
  }, [preferences, form]);

  // Update email preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      const updates = Object.entries(data).map(([key, value]) => ({
        key,
        value,
        category: 'email',
        label: key.replace('smtp_', '').replace('email_', '').replace('_', ' '),
        description: `Email ${key.replace('smtp_', '').replace('email_', '').replace('_', ' ')}`,
        dataType: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string'
      }));

      return apiRequest('POST', '/api/system-preferences/bulk', { preferences: updates });
    },
    onSuccess: () => {
      toast({
        title: 'Email Configuration Updated',
        description: 'Your email settings have been saved successfully.',
      });
      onUpdate();
    },
    onError: () => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update email configuration. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: async (data: { testEmail: string; subject: string; message: string }) => {
      return apiRequest('POST', '/api/system-preferences/test-email', data);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Test Email Sent!',
          description: 'Test email was sent successfully. Check your inbox.',
        });
      } else {
        toast({
          title: 'Test Failed',
          description: data.message || 'Failed to send test email.',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Test Failed',
        description: 'Failed to send test email. Please check your configuration.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    await updatePreferencesMutation.mutateAsync(data);
    setIsLoading(false);
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: 'Email Required',
        description: 'Please enter an email address to send the test email.',
        variant: 'destructive',
      });
      return;
    }

    setIsTestingEmail(true);
    await testEmailMutation.mutateAsync({
      testEmail,
      subject: 'Premier ERP - Test Email Configuration',
      message: 'This is a test email to verify your email configuration is working correctly.'
    });
    setIsTestingEmail(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Mail className="h-6 w-6 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold">Email Configuration</h3>
          <p className="text-sm text-gray-600">Configure SMTP settings for sending emails</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* SMTP Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SMTP Server Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="smtp_host"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Host</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="smtp.gmail.com"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="smtp_port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Port</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          placeholder="587"
                          className="w-full"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="smtp_username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="your-email@gmail.com"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="smtp_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password"
                          placeholder="••••••••"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="smtp_secure"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Use SSL/TLS</FormLabel>
                      <p className="text-sm text-gray-600">
                        Enable secure connection to SMTP server
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Sender Information */}
          <Card>
            <CardHeader>
              <CardTitle>Sender Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email_from_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Premier ERP"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email_from_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email"
                          placeholder="noreply@premiererp.com"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Test Email */}
          <Card>
            <CardHeader>
              <CardTitle>Test Email Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input 
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button"
                  onClick={handleTestEmail}
                  disabled={isTestingEmail || !testEmail}
                  variant="outline"
                >
                  {isTestingEmail ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Enter an email address to test your configuration. We'll send a test email to verify it's working.
              </p>
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

export default EmailConfigTab;