import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface InventorySettingsTabProps {
  preferences: any;
  refetch: () => void;
}

const InventorySettingsTab: React.FC<InventorySettingsTabProps> = ({ preferences, refetch }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // State for inventory settings
  const [settings, setSettings] = useState({
    lowStockThreshold: '10',
    defaultUnit: 'kg',
    batchTracking: true,
    expiryAlerts: true,
    barcodeGeneration: false,
  });

  // Initialize state from preferences
  useEffect(() => {
    if (preferences) {
      const inventoryPrefs = preferences.filter((pref: any) => pref.category === 'inventory');
      if (inventoryPrefs.length) {
        const prefsObj: any = {};
        inventoryPrefs.forEach((pref: any) => {
          prefsObj[pref.key.replace('inventory_', '')] = pref.value;
        });
        
        setSettings({
          lowStockThreshold: prefsObj.lowStockThreshold?.toString() || '10',
          defaultUnit: prefsObj.defaultUnit || 'kg',
          batchTracking: prefsObj.batchTracking || false,
          expiryAlerts: prefsObj.expiryAlerts || true,
          barcodeGeneration: prefsObj.barcodeGeneration || false,
        });
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

  const handleChangeSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    const fullKey = `inventory_${key}`;
    const existingPref = preferences?.find((pref: any) => pref.key === fullKey);

    if (existingPref) {
      updatePreferenceMutation.mutate({ key: fullKey, value });
    } else {
      createPreferenceMutation.mutate({
        key: fullKey,
        value,
        category: 'inventory',
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        description: `Inventory setting for ${key}`,
        dataType: typeof value === 'boolean' ? 'boolean' : 'string',
      });
    }
  };

  const handleSaveAll = async () => {
    setIsLoading(true);
    
    try {
      // Create array of all settings to save
      const settingsToSave = Object.entries(settings).map(([key, value]) => ({
        key: `inventory_${key}`,
        value,
        existingPref: preferences?.find((pref: any) => pref.key === `inventory_${key}`),
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
            category: 'inventory',
            label: setting.key.replace('inventory_', '').charAt(0).toUpperCase() + 
                  setting.key.replace('inventory_', '').slice(1).replace(/([A-Z])/g, ' $1'),
            description: `Inventory setting for ${setting.key.replace('inventory_', '')}`,
            dataType: typeof setting.value === 'boolean' ? 'boolean' : 'string',
          });
        }
      }
      
      toast({
        title: 'Settings Saved',
        description: 'Inventory settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save all settings.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Inventory Configuration</h3>
        <Button onClick={handleSaveAll} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save All Settings
        </Button>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Low Stock Settings */}
        <div className="space-y-3">
          <Label htmlFor="lowStockThreshold">Default Low Stock Threshold</Label>
          <Input
            id="lowStockThreshold"
            type="number"
            value={settings.lowStockThreshold}
            onChange={(e) => handleChangeSetting('lowStockThreshold', e.target.value)}
            min="0"
          />
          <p className="text-sm text-muted-foreground">
            Products with stock below this threshold will be flagged as low stock
          </p>
        </div>
        
        {/* Default Unit */}
        <div className="space-y-3">
          <Label htmlFor="defaultUnit">Default Unit of Measurement</Label>
          <Select
            value={settings.defaultUnit}
            onValueChange={(value) => handleChangeSetting('defaultUnit', value)}
          >
            <SelectTrigger id="defaultUnit">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">Kilogram (kg)</SelectItem>
              <SelectItem value="g">Gram (g)</SelectItem>
              <SelectItem value="mg">Milligram (mg)</SelectItem>
              <SelectItem value="liter">Liter (L)</SelectItem>
              <SelectItem value="ml">Milliliter (ml)</SelectItem>
              <SelectItem value="piece">Piece (pcs)</SelectItem>
              <SelectItem value="box">Box</SelectItem>
              <SelectItem value="bottle">Bottle</SelectItem>
              <SelectItem value="vial">Vial</SelectItem>
              <SelectItem value="ampoule">Ampoule</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            The default unit of measurement for new products
          </p>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h4 className="text-base font-medium">Tracking Options</h4>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="batchTracking">Batch Tracking</Label>
            <p className="text-sm text-muted-foreground">
              Enable tracking of product batches and lot numbers
            </p>
          </div>
          <Switch
            id="batchTracking"
            checked={settings.batchTracking}
            onCheckedChange={(checked) => handleChangeSetting('batchTracking', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="expiryAlerts">Expiry Date Alerts</Label>
            <p className="text-sm text-muted-foreground">
              Enable notifications for products approaching expiry date
            </p>
          </div>
          <Switch
            id="expiryAlerts"
            checked={settings.expiryAlerts}
            onCheckedChange={(checked) => handleChangeSetting('expiryAlerts', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="barcodeGeneration">Barcode Generation</Label>
            <p className="text-sm text-muted-foreground">
              Automatically generate barcodes for new products
            </p>
          </div>
          <Switch
            id="barcodeGeneration"
            checked={settings.barcodeGeneration}
            onCheckedChange={(checked) => handleChangeSetting('barcodeGeneration', checked)}
          />
        </div>
      </div>
    </div>
  );
};

export default InventorySettingsTab;