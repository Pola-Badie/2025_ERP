import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Building2, Upload, Image } from 'lucide-react';

interface CompanyInfoTabProps {
  preferences: any[];
  onUpdate: () => void;
}

const CompanyInfoTab: React.FC<CompanyInfoTabProps> = ({ preferences, onUpdate }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      company_name: '',
      company_address: '',
      company_phone: '',
      company_email: '',
      company_website: '',
      company_logo: ''
    }
  });

  // Load preferences into form
  useEffect(() => {
    if (preferences) {
      const companyPrefs = preferences.filter(p => p.category === 'company');
      const formData: any = {};
      
      companyPrefs.forEach(pref => {
        formData[pref.key] = pref.value || '';
      });
      
      form.reset(formData);
    }
  }, [preferences, form]);

  // Update multiple preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      const updates = Object.entries(data).map(([key, value]) => ({
        key,
        value,
        category: 'company',
        label: key.replace('company_', '').replace('_', ' ').toLowerCase(),
        description: `Company ${key.replace('company_', '').replace('_', ' ')}`,
        dataType: 'string'
      }));

      return apiRequest('POST', '/api/system-preferences/bulk', { preferences: updates });
    },
    onSuccess: () => {
      toast({
        title: 'Company Information Updated',
        description: 'Your company information has been saved successfully.',
      });
      onUpdate();
    },
    onError: () => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update company information. Please try again.',
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
        <Building2 className="h-6 w-6 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold">Company Information</h3>
          <p className="text-sm text-gray-600">Configure your company details and branding</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Name */}
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
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

            {/* Company Email */}
            <FormField
              control={form.control}
              name="company_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Email</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="email"
                      placeholder="info@premiererp.com"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Phone */}
            <FormField
              control={form.control}
              name="company_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="+1 (555) 123-4567"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Website */}
            <FormField
              control={form.control}
              name="company_website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="https://www.premiererp.com"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Company Address */}
          <FormField
            control={form.control}
            name="company_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Address</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="123 Business Street, City, State 12345, Country"
                    className="w-full"
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Company Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Image className="h-5 w-5 mr-2" />
                Company Logo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="company_logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL or File Path</FormLabel>
                    <FormControl>
                      <div className="flex space-x-2">
                        <Input 
                          {...field} 
                          placeholder="/uploads/company-logo.png"
                          className="flex-1"
                        />
                        <Button type="button" variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                    {field.value && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">Current logo: {field.value}</p>
                      </div>
                    )}
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

export default CompanyInfoTab;