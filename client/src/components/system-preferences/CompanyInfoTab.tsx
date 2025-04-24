import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Loader2, Upload } from 'lucide-react';

interface CompanyInfoTabProps {
  preferences: any;
  refetch: () => void;
}

const CompanyInfoTab: React.FC<CompanyInfoTabProps> = ({ preferences, refetch }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for company settings
  const [settings, setSettings] = useState({
    companyName: 'PharmaOverseas',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    phone: '',
    email: '',
    website: '',
    logoUrl: '',
    invoiceFooter: 'Thank you for your business!',
  });
  
  // State for preview logo
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Initialize state from preferences
  useEffect(() => {
    if (preferences) {
      const companyPrefs = preferences.filter((pref: any) => pref.category === 'company');
      if (companyPrefs.length) {
        const prefsObj: any = {};
        companyPrefs.forEach((pref: any) => {
          prefsObj[pref.key.replace('company_', '')] = pref.value;
        });
        
        setSettings(prev => ({
          ...prev,
          companyName: prefsObj.companyName || 'PharmaOverseas',
          address: prefsObj.address || '',
          city: prefsObj.city || '',
          state: prefsObj.state || '',
          country: prefsObj.country || '',
          zipCode: prefsObj.zipCode || '',
          phone: prefsObj.phone || '',
          email: prefsObj.email || '',
          website: prefsObj.website || '',
          logoUrl: prefsObj.logoUrl || '',
          invoiceFooter: prefsObj.invoiceFooter || 'Thank you for your business!',
        }));
        
        if (prefsObj.logoUrl) {
          setLogoPreview(prefsObj.logoUrl);
        }
      }
    }
  }, [preferences]);

  // Update preferences mutation
  const updatePreferenceMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: any }) => {
      return apiRequest('PATCH', `/api/system-preferences/${key}`, { value });
    },
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update setting.',
        variant: 'destructive',
      });
    },
  });

  // Create preference mutation
  const createPreferenceMutation = useMutation({
    mutationFn: async (preference: any) => {
      return apiRequest('POST', `/api/system-preferences`, preference);
    },
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create setting.',
        variant: 'destructive',
      });
    },
  });

  // Upload logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('POST', '/api/uploads/logo', formData);
    },
    onSuccess: (data) => {
      // Update logo URL in preferences
      handleChangeSetting('logoUrl', data.url);
      setLogoPreview(data.url);
      toast({
        title: 'Logo Uploaded',
        description: 'Company logo has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to upload logo.',
        variant: 'destructive',
      });
    },
  });

  const handleChangeSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    const fullKey = `company_${key}`;
    const existingPref = preferences?.find((pref: any) => pref.key === fullKey);

    if (existingPref) {
      updatePreferenceMutation.mutate({ key: fullKey, value });
    } else {
      createPreferenceMutation.mutate({
        key: fullKey,
        value,
        category: 'company',
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        description: `Company information: ${key}`,
        dataType: 'string',
      });
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.match('image.*')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select an image file (JPEG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Logo image must be smaller than 2MB',
        variant: 'destructive',
      });
      return;
    }

    // Create form data for upload
    const formData = new FormData();
    formData.append('logo', file);
    
    // Upload the file
    uploadLogoMutation.mutate(formData);
  };

  const handleSaveAll = async () => {
    setIsLoading(true);
    
    try {
      // Create array of all settings to save
      const settingsToSave = Object.entries(settings).map(([key, value]) => ({
        key: `company_${key}`,
        value,
        existingPref: preferences?.find((pref: any) => pref.key === `company_${key}`),
      }));
      
      // Process each setting
      for (const setting of settingsToSave) {
        if (setting.existingPref) {
          await updatePreferenceMutation.mutateAsync({ 
            key: setting.key, 
            value: setting.value 
          });
        } else {
          await createPreferenceMutation.mutateAsync({
            key: setting.key,
            value: setting.value,
            category: 'company',
            label: setting.key.replace('company_', '').charAt(0).toUpperCase() + 
                  setting.key.replace('company_', '').slice(1).replace(/([A-Z])/g, ' $1'),
            description: `Company information: ${setting.key.replace('company_', '')}`,
            dataType: 'string',
          });
        }
      }
      
      toast({
        title: 'Settings Saved',
        description: 'Company information has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save company information.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Company Information</h3>
        <Button onClick={handleSaveAll} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save All Information
        </Button>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Company Logo */}
        <div className="space-y-3 md:col-span-1">
          <Label>Company Logo</Label>
          <div className="flex flex-col items-center space-y-4">
            <div className="border rounded-md w-48 h-48 flex items-center justify-center overflow-hidden bg-gray-50">
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="Company Logo" 
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <Upload className="h-12 w-12 mx-auto mb-2" />
                  <p>No logo uploaded</p>
                </div>
              )}
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
            
            <Button 
              type="button" 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadLogoMutation.isPending}
            >
              {uploadLogoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload Logo
            </Button>
          </div>
        </div>
        
        {/* Company Details */}
        <div className="space-y-4 md:col-span-2">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => handleChangeSetting('companyName', e.target.value)}
                placeholder="Company Name"
              />
            </div>
            
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={settings.address}
                onChange={(e) => handleChangeSetting('address', e.target.value)}
                placeholder="Street Address"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={settings.city}
                  onChange={(e) => handleChangeSetting('city', e.target.value)}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={settings.state}
                  onChange={(e) => handleChangeSetting('state', e.target.value)}
                  placeholder="State/Province"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={settings.country}
                  onChange={(e) => handleChangeSetting('country', e.target.value)}
                  placeholder="Country"
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                <Input
                  id="zipCode"
                  value={settings.zipCode}
                  onChange={(e) => handleChangeSetting('zipCode', e.target.value)}
                  placeholder="ZIP/Postal Code"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="space-y-4 md:col-span-3">
          <h4 className="text-base font-medium">Contact Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={settings.phone}
                onChange={(e) => handleChangeSetting('phone', e.target.value)}
                placeholder="Phone Number"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => handleChangeSetting('email', e.target.value)}
                placeholder="Email Address"
              />
            </div>
            
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={settings.website}
                onChange={(e) => handleChangeSetting('website', e.target.value)}
                placeholder="Website URL"
              />
            </div>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h4 className="text-base font-medium">Invoice Customization</h4>
        
        <div>
          <Label htmlFor="invoiceFooter">Invoice Footer Message</Label>
          <Textarea
            id="invoiceFooter"
            value={settings.invoiceFooter}
            onChange={(e) => handleChangeSetting('invoiceFooter', e.target.value)}
            placeholder="Message to display at the bottom of invoices"
            rows={3}
          />
          <p className="text-sm text-muted-foreground mt-1">
            This message will appear at the bottom of all invoices
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoTab;