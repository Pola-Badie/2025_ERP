import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Database, Download, Upload, Calendar, HardDrive, AlertCircle } from 'lucide-react';

interface BackupRecoveryTabProps {
  preferences: any[];
  onUpdate: () => void;
}

const BackupRecoveryTab: React.FC<BackupRecoveryTabProps> = ({ preferences, onUpdate }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [backupDescription, setBackupDescription] = useState('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  const form = useForm({
    defaultValues: {
      auto_backup_enabled: true,
      backup_frequency: 'daily',
      backup_retention_days: 30,
      backup_location: './backups'
    }
  });

  // Load preferences into form
  useEffect(() => {
    if (preferences) {
      const backupPrefs = preferences.filter(p => p.category === 'backup');
      const formData: any = {};
      
      backupPrefs.forEach(pref => {
        if (pref.key === 'auto_backup_enabled') {
          formData[pref.key] = Boolean(pref.value);
        } else if (pref.key === 'backup_retention_days') {
          formData[pref.key] = Number(pref.value) || 30;
        } else {
          formData[pref.key] = pref.value || formData[pref.key];
        }
      });
      
      form.reset(formData);
    }
  }, [preferences, form]);

  // Fetch available backups
  const { data: backups, isLoading: isLoadingBackups, refetch: refetchBackups } = useQuery({
    queryKey: ['/api/system-preferences/backups'],
    refetchOnWindowFocus: false,
  });

  // Update backup preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      const updates = Object.entries(data).map(([key, value]) => ({
        key,
        value,
        category: 'backup',
        label: key.replace('backup_', '').replace('_', ' ').toLowerCase(),
        description: `Backup setting: ${key.replace('backup_', '').replace('_', ' ')}`,
        dataType: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string'
      }));

      return apiRequest('POST', '/api/system-preferences/bulk', { preferences: updates });
    },
    onSuccess: () => {
      toast({
        title: 'Backup Settings Updated',
        description: 'Your backup settings have been saved successfully.',
      });
      onUpdate();
    },
    onError: () => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update backup settings. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Create manual backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async (data: { backupName: string; description: string }) => {
      return apiRequest('POST', '/api/system-preferences/create-backup', data);
    },
    onSuccess: (data) => {
      toast({
        title: 'Backup Created',
        description: `Backup "${data.filename}" has been created successfully.`,
      });
      refetchBackups();
      setBackupName('');
      setBackupDescription('');
    },
    onError: () => {
      toast({
        title: 'Backup Failed',
        description: 'Failed to create backup. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    await updatePreferencesMutation.mutateAsync(data);
    setIsLoading(false);
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    await createBackupMutation.mutateAsync({
      backupName: backupName || `Manual_Backup_${new Date().toISOString().split('T')[0]}`,
      description: backupDescription || 'Manual backup created via System Preferences'
    });
    setIsCreatingBackup(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Database className="h-6 w-6 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold">Backup & Recovery</h3>
          <p className="text-sm text-gray-600">Configure automatic backups and create manual backups</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Automatic Backup Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Automatic Backup Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="auto_backup_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Automatic Backups</FormLabel>
                      <p className="text-sm text-gray-600">Automatically create backups on a schedule</p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="backup_frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Backup Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="backup_retention_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Retention Period (days)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          min="1"
                          max="365"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <p className="text-sm text-gray-600">How long to keep backup files</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="backup_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Backup Location</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="./backups"
                      />
                    </FormControl>
                    <p className="text-sm text-gray-600">Directory where backup files will be stored</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Manual Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HardDrive className="h-5 w-5 mr-2" />
                Manual Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Backup Name (Optional)</label>
                  <Input 
                    value={backupName}
                    onChange={(e) => setBackupName(e.target.value)}
                    placeholder="My_Backup_Name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Input 
                    value={backupDescription}
                    onChange={(e) => setBackupDescription(e.target.value)}
                    placeholder="Backup description..."
                    className="mt-1"
                  />
                </div>
              </div>
              
              <Button 
                type="button"
                onClick={handleCreateBackup}
                disabled={isCreatingBackup || createBackupMutation.isPending}
                className="w-full md:w-auto"
              >
                {isCreatingBackup || createBackupMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating Backup...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Create Manual Backup
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Backups */}
          <Card>
            <CardHeader>
              <CardTitle>Available Backups</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBackups ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading backups...
                </div>
              ) : backups && backups.length > 0 ? (
                <div className="space-y-2">
                  {backups.map((backup: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{backup.filename}</p>
                        <p className="text-sm text-gray-600">
                          Size: {backup.size} • Created: {new Date(backup.created).toLocaleString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No backups available</p>
                  <p className="text-sm">Create your first backup using the button above</p>
                </div>
              )}
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

export default BackupRecoveryTab;