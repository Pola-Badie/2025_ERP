import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { FileText, Settings, Palette, Layout, Clock } from 'lucide-react';

const quotationSettingsSchema = z.object({
  quotationPrefix: z.string().min(1, 'Quotation prefix is required'),
  quotationNumberFormat: z.string().min(1, 'Number format is required'),
  quotationStartNumber: z.number().min(1, 'Start number must be at least 1'),
  defaultTerms: z.string().optional(),
  defaultNotes: z.string().optional(),
  validityDays: z.number().min(1, 'Validity days must be at least 1').default(30),
  showLogo: z.boolean().default(true),
  showCompanyDetails: z.boolean().default(true),
  showTransportationOptions: z.boolean().default(true),
  logoPosition: z.enum(['left', 'center', 'right']).default('left'),
  headerColor: z.string().default('#1e40af'),
  fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
  pageOrientation: z.enum(['portrait', 'landscape']).default('portrait'),
  marginSize: z.enum(['small', 'medium', 'large']).default('medium'),
  includeQrCode: z.boolean().default(false),
  showPricing: z.boolean().default(true),
  showSpecifications: z.boolean().default(true),
  showProcessingTime: z.boolean().default(true),
  autoConvertToInvoice: z.boolean().default(false),
  requireCustomerApproval: z.boolean().default(false),
  allowOnlineAcceptance: z.boolean().default(false),
  defaultQuotationType: z.enum(['manufacturing', 'refining', 'finished']).default('manufacturing'),
});

type QuotationSettingsFormData = z.infer<typeof quotationSettingsSchema>;

export function QuotationSettingsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/quotation-settings'],
    staleTime: 5 * 60 * 1000,
  });

  const form = useForm<QuotationSettingsFormData>({
    resolver: zodResolver(quotationSettingsSchema),
    defaultValues: {
      quotationPrefix: 'QUO',
      quotationNumberFormat: 'YYYY-NNNN',
      quotationStartNumber: 1,
      defaultTerms: 'This quotation is valid for 30 days from the date of issue.',
      defaultNotes: '',
      validityDays: 30,
      showLogo: true,
      showCompanyDetails: true,
      showTransportationOptions: true,
      logoPosition: 'left',
      headerColor: '#1e40af',
      fontSize: 'medium',
      pageOrientation: 'portrait',
      marginSize: 'medium',
      includeQrCode: false,
      showPricing: true,
      showSpecifications: true,
      showProcessingTime: true,
      autoConvertToInvoice: false,
      requireCustomerApproval: false,
      allowOnlineAcceptance: false,
      defaultQuotationType: 'manufacturing',
      ...(settings || {}),
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: QuotationSettingsFormData) => {
      const response = await fetch('/api/quotation-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update quotation settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotation-settings'] });
      toast({
        title: 'Settings Updated',
        description: 'Quotation settings have been saved successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update quotation settings. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: QuotationSettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-8">Loading quotation settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Quotation Settings</h2>
        <p className="text-gray-600 mt-1">Configure how quotations are generated and formatted in your ERP system.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Quotation Numbering */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Quotation Numbering
              </CardTitle>
              <CardDescription>
                Configure how quotation numbers are generated and formatted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="quotationPrefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quotation Prefix</FormLabel>
                      <FormControl>
                        <Input placeholder="QUO" {...field} />
                      </FormControl>
                      <FormDescription>Prefix for quotation numbers (e.g., QUO, QUOTE)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quotationNumberFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number Format</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="YYYY-NNNN">YYYY-NNNN (2024-0001)</SelectItem>
                            <SelectItem value="NNNN">NNNN (0001)</SelectItem>
                            <SelectItem value="MM-YYYY-NNNN">MM-YYYY-NNNN (01-2024-0001)</SelectItem>
                            <SelectItem value="YYYY-MM-NNNN">YYYY-MM-NNNN (2024-01-0001)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>Format for quotation numbers</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quotationStartNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starting Number</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription>First quotation number to use</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quotation Behavior */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quotation Behavior & Terms
              </CardTitle>
              <CardDescription>
                Set default behavior and terms for quotations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="validityDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Validity Period (Days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                        />
                      </FormControl>
                      <FormDescription>Default number of days quotation remains valid</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultQuotationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Quotation Type</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manufacturing">Manufacturing Services</SelectItem>
                            <SelectItem value="refining">Refining & Processing</SelectItem>
                            <SelectItem value="finished">Finished Products</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>Default type for new quotations</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="autoConvertToInvoice"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Auto-convert to Invoice</FormLabel>
                          <FormDescription>Automatically create invoice when quotation is accepted</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requireCustomerApproval"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Require Customer Approval</FormLabel>
                          <FormDescription>Customer must approve before proceeding</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="allowOnlineAcceptance"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Allow Online Acceptance</FormLabel>
                          <FormDescription>Enable digital signature and acceptance</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="defaultTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Terms & Conditions</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="This quotation is valid for 30 days from the date of issue..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Default terms that appear on all quotations</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Thank you for considering our services..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Default notes that appear on all quotations</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Display Content Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Content & Display Options
              </CardTitle>
              <CardDescription>
                Customize what information appears on quotations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">General Display</h4>
                  
                  <FormField
                    control={form.control}
                    name="showLogo"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Show Company Logo</FormLabel>
                          <FormDescription>Display company logo on quotations</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="showCompanyDetails"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Show Company Details</FormLabel>
                          <FormDescription>Display company address and contact info</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="includeQrCode"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Include QR Code</FormLabel>
                          <FormDescription>Add QR code for online acceptance</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Product Information</h4>
                  
                  <FormField
                    control={form.control}
                    name="showPricing"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Show Pricing</FormLabel>
                          <FormDescription>Display unit prices and totals</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="showSpecifications"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Show Specifications</FormLabel>
                          <FormDescription>Display product specifications and grades</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="showProcessingTime"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Show Processing Time</FormLabel>
                          <FormDescription>Display estimated processing times</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="showTransportationOptions"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Show Transportation Options</FormLabel>
                          <FormDescription>Display delivery and transportation details</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="logoPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo Position</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fontSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Font Size</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pageOrientation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Orientation</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="portrait">Portrait</SelectItem>
                            <SelectItem value="landscape">Landscape</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marginSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Margins</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="headerColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Header Color</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          type="color"
                          className="w-16 h-10 p-1 border rounded"
                          {...field}
                        />
                      </FormControl>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="#1e40af"
                          className="flex-1"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormDescription>Color for quotation headers and accents</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="min-w-32"
            >
              {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}