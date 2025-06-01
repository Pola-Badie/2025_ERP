import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CloudIcon, HardDriveIcon, DatabaseIcon, DownloadIcon, UploadIcon, ClockIcon, ShieldIcon } from 'lucide-react';

interface BackupTabProps {
  preferences: any;
  refetch: () => void;
}

const BackupTab: React.FC<BackupTabProps> = ({ preferences, refetch }) => {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '02:00',
    cloudBackup: false,
    cloudProvider: 'none',
    localBackup: true,
    backupRetention: '30',
    encryptBackups: true,
    compressBackups: true,
    includeFiles: true,
    includeDatabase: true,
  });

  useEffect(() => {
    if (preferences) {
      const backupPrefs = preferences.filter((pref: any) => pref.category === 'backup');
      if (backupPrefs.length) {
        const prefsObj: any = {};
        backupPrefs.forEach((pref: any) => {
          prefsObj[pref.key.replace('backup_', '')] = pref.value;
        });
        
        setSettings({
          autoBackup: prefsObj.autoBackup !== false,
          backupFrequency: prefsObj.backupFrequency || 'daily',
          backupTime: prefsObj.backupTime || '02:00',
          cloudBackup: prefsObj.cloudBackup || false,
          cloudProvider: prefsObj.cloudProvider || 'none',
          localBackup: prefsObj.localBackup !== false,
          backupRetention: prefsObj.backupRetention?.toString() || '30',
          encryptBackups: prefsObj.encryptBackups !== false,
          compressBackups: prefsObj.compressBackups !== false,
          includeFiles: prefsObj.includeFiles !== false,
          includeDatabase: prefsObj.includeDatabase !== false,
        });
      }
    }
  }, [preferences]);

  const updatePreferenceMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: any }) => {
      return apiRequest('PATCH', `/api/system-preferences/${key}`, { value });
    },
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update backup setting.',
        variant: 'destructive',
      });
    },
  });

  const createPreferenceMutation = useMutation({
    mutationFn: async (preference: any) => {
      return apiRequest('POST', `/api/system-preferences`, preference);
    },
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create backup setting.',
        variant: 'destructive',
      });
    },
  });

  const handleChangeSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    const fullKey = `backup_${key}`;
    const existingPref = preferences?.find((pref: any) => pref.key === fullKey);

    if (existingPref) {
      updatePreferenceMutation.mutate({ key: fullKey, value });
    } else {
      createPreferenceMutation.mutate({
        key: fullKey,
        value,
        category: 'backup',
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        description: `Backup setting for ${key}`,
        dataType: typeof value === 'boolean' ? 'boolean' : 'string',
      });
    }
  };

  const handleManualBackup = () => {
    toast({
      title: 'Backup Started',
      description: 'Manual backup has been initiated. You will be notified when complete.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Backup & Recovery</h3>
          <p className="text-sm text-muted-foreground">
            Configure automatic backups and data recovery settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Download Backup
          </Button>
          <Button onClick={handleManualBackup}>
            <CloudIcon className="h-4 w-4 mr-2" />
            Backup Now
          </Button>
        </div>
      </div>

      {/* Backup Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <CloudIcon className="h-6 w-6 mx-auto text-green-700 mb-1" />
          <div className="text-sm text-green-600">Auto Backup</div>
          <div className="text-lg font-bold text-green-700">
            {settings.autoBackup ? 'Enabled' : 'Disabled'}
          </div>
        </div>
        <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <ClockIcon className="h-6 w-6 mx-auto text-blue-700 mb-1" />
          <div className="text-sm text-blue-600">Frequency</div>
          <div className="text-lg font-bold text-blue-700">{settings.backupFrequency}</div>
        </div>
        <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <HardDriveIcon className="h-6 w-6 mx-auto text-purple-700 mb-1" />
          <div className="text-sm text-purple-600">Retention</div>
          <div className="text-lg font-bold text-purple-700">{settings.backupRetention} days</div>
        </div>
        <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <ShieldIcon className="h-6 w-6 mx-auto text-orange-700 mb-1" />
          <div className="text-sm text-orange-600">Encryption</div>
          <div className="text-lg font-bold text-orange-700">
            {settings.encryptBackups ? 'On' : 'Off'}
          </div>
        </div>
      </div>

      {/* Backup Schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ClockIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Backup Schedule</CardTitle>
              <CardDescription>Configure automatic backup timing and frequency</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="autoBackup">Automatic Backups</Label>
                <p className="text-sm text-muted-foreground">
                  Enable scheduled automatic backups
                </p>
              </div>
            </div>
            <Switch
              id="autoBackup"
              checked={settings.autoBackup}
              onCheckedChange={(checked) => handleChangeSetting('autoBackup', checked)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="backupFrequency">Backup Frequency</Label>
              <Select
                value={settings.backupFrequency}
                onValueChange={(value) => handleChangeSetting('backupFrequency', value)}
                disabled={!settings.autoBackup}
              >
                <SelectTrigger id="backupFrequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Every Hour</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How often automatic backups should run
              </p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="backupTime">Backup Time</Label>
              <Input
                id="backupTime"
                type="time"
                value={settings.backupTime}
                onChange={(e) => handleChangeSetting('backupTime', e.target.value)}
                disabled={!settings.autoBackup}
              />
              <p className="text-sm text-muted-foreground">
                Preferred time for automatic backups
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="backupRetention">Backup Retention (Days)</Label>
            <Input
              id="backupRetention"
              type="number"
              value={settings.backupRetention}
              onChange={(e) => handleChangeSetting('backupRetention', e.target.value)}
              min="1"
              max="365"
            />
            <p className="text-sm text-muted-foreground">
              Number of days to keep backup files
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Backup Storage */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <HardDriveIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Backup Storage</CardTitle>
              <CardDescription>Configure where backups are stored</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <HardDriveIcon className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="localBackup">Local Storage</Label>
                <p className="text-sm text-muted-foreground">
                  Store backups on local server storage
                </p>
              </div>
            </div>
            <Switch
              id="localBackup"
              checked={settings.localBackup}
              onCheckedChange={(checked) => handleChangeSetting('localBackup', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CloudIcon className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="cloudBackup">Cloud Storage</Label>
                <p className="text-sm text-muted-foreground">
                  Store backups in cloud storage
                </p>
              </div>
            </div>
            <Switch
              id="cloudBackup"
              checked={settings.cloudBackup}
              onCheckedChange={(checked) => handleChangeSetting('cloudBackup', checked)}
            />
          </div>

          {settings.cloudBackup && (
            <div className="space-y-3">
              <Label htmlFor="cloudProvider">Cloud Provider</Label>
              <Select
                value={settings.cloudProvider}
                onValueChange={(value) => handleChangeSetting('cloudProvider', value)}
              >
                <SelectTrigger id="cloudProvider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aws">Amazon S3</SelectItem>
                  <SelectItem value="google">Google Cloud Storage</SelectItem>
                  <SelectItem value="azure">Azure Blob Storage</SelectItem>
                  <SelectItem value="dropbox">Dropbox</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Cloud storage provider for backups
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <DatabaseIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Backup Options</CardTitle>
              <CardDescription>Configure what data to include in backups</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <DatabaseIcon className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="includeDatabase">Include Database</Label>
                <p className="text-sm text-muted-foreground">
                  Include all database data in backups
                </p>
              </div>
            </div>
            <Switch
              id="includeDatabase"
              checked={settings.includeDatabase}
              onCheckedChange={(checked) => handleChangeSetting('includeDatabase', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <UploadIcon className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="includeFiles">Include Uploaded Files</Label>
                <p className="text-sm text-muted-foreground">
                  Include user uploaded files and documents
                </p>
              </div>
            </div>
            <Switch
              id="includeFiles"
              checked={settings.includeFiles}
              onCheckedChange={(checked) => handleChangeSetting('includeFiles', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <ShieldIcon className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="encryptBackups">Encrypt Backups</Label>
                <p className="text-sm text-muted-foreground">
                  Encrypt backup files for security
                </p>
              </div>
            </div>
            <Switch
              id="encryptBackups"
              checked={settings.encryptBackups}
              onCheckedChange={(checked) => handleChangeSetting('encryptBackups', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CloudIcon className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="compressBackups">Compress Backups</Label>
                <p className="text-sm text-muted-foreground">
                  Compress backup files to save storage space
                </p>
              </div>
            </div>
            <Switch
              id="compressBackups"
              checked={settings.compressBackups}
              onCheckedChange={(checked) => handleChangeSetting('compressBackups', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupTab;