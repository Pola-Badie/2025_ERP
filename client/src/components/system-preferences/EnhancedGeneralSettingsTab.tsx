import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Globe, Calendar, DollarSign, Clock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const generalSettingsSchema = z.object({
  language: z.enum(['en', 'ar']),
  timezone: z.string(),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
  currency: z.enum(['EGP', 'USD', 'EUR']),
  businessHours: z.string(),
  fiscalYearStart: z.string(),
  taxRate: z.number().min(0).max(100),
});

type GeneralSettingsData = z.infer<typeof generalSettingsSchema>;

const timezones = [
  { value: 'Africa/Cairo', label: 'Cairo (UTC+2)' },
  { value: 'Europe/London', label: 'London (UTC+0)' },
  { value: 'America/New_York', label: 'New York (UTC-5)' },
  { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
  { value: 'Asia/Riyadh', label: 'Riyadh (UTC+3)' },
];

const EnhancedGeneralSettingsTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch general settings from system preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['/api/system-preferences'],
    refetchOnWindowFocus: false,
  });

  // Setup form
  const form = useForm<GeneralSettingsData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      language: 'en',
      timezone: 'Africa/Cairo',
      dateFormat: 'DD/MM/YYYY',
      currency: 'EGP',
      businessHours: '08:00-18:00',
      fiscalYearStart: '01/01',
      taxRate: 14,
    },
  });

  // Extract general preferences and update form
  React.useEffect(() => {
    if (preferences) {
      const generalPrefs = preferences.filter((pref: any) => pref.category === 'general' || pref.category === 'company');
      const formData: Partial<GeneralSettingsData> = {};

      generalPrefs.forEach((pref: any) => {
        switch (pref.key) {
          case 'language':
            formData.language = pref.value as 'en' | 'ar';
            break;
          case 'timezone':
            formData.timezone = pref.value;
            break;
          case 'dateFormat':
            formData.dateFormat = pref.value as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
            break;
          case 'currency':
            formData.currency = pref.value as 'EGP' | 'USD' | 'EUR';
            break;
          case 'businessHours':
            formData.businessHours = pref.value;
            break;
          case 'fiscalYearStart':
            formData.fiscalYearStart = pref.value;
            break;
          case 'taxRate':
            formData.taxRate = parseFloat(pref.value) || 14;
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
    mutationFn: async (data: GeneralSettingsData) => {
      const updates = [
        { key: 'language', value: data.language },
        { key: 'timezone', value: data.timezone },
        { key: 'dateFormat', value: data.dateFormat },
        { key: 'currency', value: data.currency },
        { key: 'businessHours', value: data.businessHours },
        { key: 'fiscalYearStart', value: data.fiscalYearStart },
        { key: 'taxRate', value: data.taxRate },
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
        description: "General settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update general settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GeneralSettingsData) => {
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          General Settings
        </CardTitle>
        <CardDescription>
          Configure basic system preferences and regional settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Localization */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Localization
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="language">System Language</Label>
                <Select
                  value={form.watch('language')}
                  onValueChange={(value: 'en' | 'ar') => form.setValue('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية (Arabic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={form.watch('timezone')}
                  onValueChange={(value) => form.setValue('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Date and Number Formats */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Formats
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select
                  value={form.watch('dateFormat')}
                  onValueChange={(value: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD') => form.setValue('dateFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Select
                  value={form.watch('currency')}
                  onValueChange={(value: 'EGP' | 'USD' | 'EUR') => form.setValue('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EGP">Egyptian Pound (EGP)</SelectItem>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Business Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Business Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="businessHours">Business Hours</Label>
                <Select
                  value={form.watch('businessHours')}
                  onValueChange={(value) => form.setValue('businessHours', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business hours" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="08:00-17:00">8:00 AM - 5:00 PM</SelectItem>
                    <SelectItem value="08:00-18:00">8:00 AM - 6:00 PM</SelectItem>
                    <SelectItem value="09:00-17:00">9:00 AM - 5:00 PM</SelectItem>
                    <SelectItem value="09:00-18:00">9:00 AM - 6:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fiscalYearStart">Fiscal Year Start</Label>
                <Select
                  value={form.watch('fiscalYearStart')}
                  onValueChange={(value) => form.setValue('fiscalYearStart', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fiscal year start" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="01/01">January 1st</SelectItem>
                    <SelectItem value="07/01">July 1st</SelectItem>
                    <SelectItem value="04/01">April 1st</SelectItem>
                    <SelectItem value="10/01">October 1st</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tax Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Tax Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                <Select
                  value={String(form.watch('taxRate'))}
                  onValueChange={(value) => form.setValue('taxRate', parseFloat(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tax rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (Tax Exempt)</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="14">14% (Egypt Standard)</SelectItem>
                    <SelectItem value="15">15%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                  </SelectContent>
                </Select>
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
              Save General Settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EnhancedGeneralSettingsTab;