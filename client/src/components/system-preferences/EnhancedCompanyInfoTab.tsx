import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, Mail, Phone, Globe, MapPin } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const companyInfoSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Valid email is required"),
  website: z.string().optional(),
  taxId: z.string().min(1, "Tax ID is required"),
  businessType: z.string().min(1, "Business type is required"),
  industry: z.string().min(1, "Industry is required"),
});

type CompanyInfoData = z.infer<typeof companyInfoSchema>;

const EnhancedCompanyInfoTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch company info
  const { data: companyInfo, isLoading } = useQuery({
    queryKey: ['/api/company-info'],
    refetchOnWindowFocus: false,
  });

  // Setup form
  const form = useForm<CompanyInfoData>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Egypt',
      phone: '',
      email: '',
      website: '',
      taxId: '',
      businessType: 'Chemical Manufacturing',
      industry: 'Chemical Manufacturing',
    },
  });

  // Update form when data loads
  React.useEffect(() => {
    if (companyInfo) {
      form.reset(companyInfo);
    }
  }, [companyInfo, form]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: CompanyInfoData) => 
      apiRequest('/api/company-info', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/company-info'] });
      toast({
        title: "Success",
        description: "Company information updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update company information",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CompanyInfoData) => {
    updateMutation.mutate(data);
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
          <Building2 className="h-5 w-5" />
          Company Information
        </CardTitle>
        <CardDescription>
          Configure your company details and business information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Premier ERP Chemical Manufacturing"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Input
                id="industry"
                {...form.register('industry')}
                placeholder="Chemical Manufacturing"
              />
              {form.formState.errors.industry && (
                <p className="text-sm text-red-600">{form.formState.errors.industry.message}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  placeholder="+20 2 1234 5678"
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    {...form.register('email')}
                    placeholder="info@premiererp.com"
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="website"
                    className="pl-10"
                    {...form.register('website')}
                    placeholder="https://premiererp.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID *</Label>
                <Input
                  id="taxId"
                  {...form.register('taxId')}
                  placeholder="EG-123456789"
                />
                {form.formState.errors.taxId && (
                  <p className="text-sm text-red-600">{form.formState.errors.taxId.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                {...form.register('address')}
                placeholder="123 Chemical Street"
              />
              {form.formState.errors.address && (
                <p className="text-sm text-red-600">{form.formState.errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  {...form.register('city')}
                  placeholder="Cairo"
                />
                {form.formState.errors.city && (
                  <p className="text-sm text-red-600">{form.formState.errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State/Province *</Label>
                <Input
                  id="state"
                  {...form.register('state')}
                  placeholder="Cairo Governorate"
                />
                {form.formState.errors.state && (
                  <p className="text-sm text-red-600">{form.formState.errors.state.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP/Postal Code *</Label>
                <Input
                  id="zipCode"
                  {...form.register('zipCode')}
                  placeholder="11511"
                />
                {form.formState.errors.zipCode && (
                  <p className="text-sm text-red-600">{form.formState.errors.zipCode.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  {...form.register('country')}
                  placeholder="Egypt"
                />
                {form.formState.errors.country && (
                  <p className="text-sm text-red-600">{form.formState.errors.country.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type *</Label>
                <Input
                  id="businessType"
                  {...form.register('businessType')}
                  placeholder="Chemical Manufacturing"
                />
                {form.formState.errors.businessType && (
                  <p className="text-sm text-red-600">{form.formState.errors.businessType.message}</p>
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
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EnhancedCompanyInfoTab;