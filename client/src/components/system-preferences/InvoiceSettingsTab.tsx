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
import { FileText, Settings, Palette, Layout } from 'lucide-react';

const invoiceSettingsSchema = z.object({
  invoicePrefix: z.string().min(1, 'Invoice prefix is required'),
  invoiceNumberFormat: z.string().min(1, 'Number format is required'),
  invoiceStartNumber: z.number().min(1, 'Start number must be at least 1'),
  defaultTerms: z.string().optional(),
  defaultNotes: z.string().optional(),
  showLogo: z.boolean().default(true),
  showCompanyDetails: z.boolean().default(true),
  showBankDetails: z.boolean().default(false),
  logoPosition: z.enum(['left', 'center', 'right']).default('left'),
  headerColor: z.string().default('#1e40af'),
  fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
  pageOrientation: z.enum(['portrait', 'landscape']).default('portrait'),
  marginSize: z.enum(['small', 'medium', 'large']).default('medium'),
  includeQrCode: z.boolean().default(false),
  dueAfterDays: z.number().min(0).default(30),
  lateFeePercentage: z.number().min(0).max(100).default(0),
  discountTerms: z.string().optional(),
});

type InvoiceSettingsFormData = z.infer<typeof invoiceSettingsSchema>;

export function InvoiceSettingsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/invoice-settings'],
    staleTime: 5 * 60 * 1000,
  });

  const form = useForm<InvoiceSettingsFormData>({
    resolver: zodResolver(invoiceSettingsSchema),
    defaultValues: {
      invoicePrefix: 'INV',
      invoiceNumberFormat: 'YYYY-NNNN',
      invoiceStartNumber: 1,
      defaultTerms: 'Payment is due within 30 days of invoice date.',
      defaultNotes: '',
      showLogo: true,
      showCompanyDetails: true,
      showBankDetails: false,
      logoPosition: 'left',
      headerColor: '#1e40af',
      fontSize: 'medium',
      pageOrientation: 'portrait',
      marginSize: 'medium',
      includeQrCode: false,
      dueAfterDays: 30,
      lateFeePercentage: 0,
      discountTerms: '',
      ...(settings || {}),
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: InvoiceSettingsFormData) => {
      const response = await fetch('/api/invoice-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update invoice settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoice-settings'] });
      toast({
        title: 'Settings Updated',
        description: 'Invoice settings have been saved successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update invoice settings. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: InvoiceSettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-8">Loading invoice settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Invoice Settings</h2>
        <p className="text-gray-600 mt-1">Configure how invoices are generated and formatted in your ERP system.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Invoice Numbering */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Numbering
              </CardTitle>
              <CardDescription>
                Configure how invoice numbers are generated and formatted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="invoicePrefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Prefix</FormLabel>
                      <FormControl>
                        <Input placeholder="INV" {...field} />
                      </FormControl>
                      <FormDescription>Prefix for invoice numbers (e.g., INV, INVOICE)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="invoiceNumberFormat"
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
                      <FormDescription>Format for invoice numbers</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="invoiceStartNumber"
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
                      <FormDescription>First invoice number to use</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Payment Terms & Conditions
              </CardTitle>
              <CardDescription>
                Set default payment terms and conditions for invoices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dueAfterDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Due After (Days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                        />
                      </FormControl>
                      <FormDescription>Number of days for payment to be due</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lateFeePercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Late Fee Percentage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>Late fee percentage for overdue payments</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                        placeholder="Payment is due within 30 days of invoice date..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Default terms that appear on all invoices</FormDescription>
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
                        placeholder="Thank you for your business..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Default notes that appear on all invoices</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Terms</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="2/10 Net 30 (2% discount if paid within 10 days)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Early payment discount terms</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Display Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Display Options
              </CardTitle>
              <CardDescription>
                Customize how invoices appear when printed or exported.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="showLogo"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Show Company Logo</FormLabel>
                          <FormDescription>Display company logo on invoices</FormDescription>
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
                    name="showBankDetails"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Show Bank Details</FormLabel>
                          <FormDescription>Display bank account information</FormDescription>
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
                          <FormDescription>Add QR code for payment or verification</FormDescription>
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
              </div>

              <Separator />

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
                    <FormDescription>Color for invoice headers and accents</FormDescription>
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