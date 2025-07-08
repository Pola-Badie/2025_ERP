import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database, Download, Calendar, HardDrive, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const backupSettingsSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  backupLocation: z.enum(['local', 'cloud']),
  retentionDays: z.number().min(1).max(365),
  includeUploads: z.boolean(),
  isEnabled: z.boolean(),
});

type BackupSettingsData = z.infer<typeof backupSettingsSchema>;

const EnhancedBackupTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [backupProgress, setBackupProgress] = React.useState(0);

  // Fetch backup settings
  const { data: backupSettings, isLoading } = useQuery({
    queryKey: ['/api/backup-settings'],
    refetchOnWindowFocus: false,
  });

  // Setup form
  const form = useForm<BackupSettingsData>({
    resolver: zodResolver(backupSettingsSchema),
    defaultValues: {
      frequency: 'daily',
      backupLocation: 'local',
      retentionDays: 30,
      includeUploads: true,
      isEnabled: true,
    },
  });

  // Update form when data loads
  React.useEffect(() => {
    if (backupSettings) {
      form.reset({
        frequency: backupSettings.frequency || 'daily',
        backupLocation: backupSettings.backupLocation || 'local',
        retentionDays: parseInt(backupSettings.retentionDays) || 30,
        includeUploads: backupSettings.includeUploads === true || backupSettings.includeUploads === 'true',
        isEnabled: backupSettings.isEnabled === true || backupSettings.isEnabled === 'true',
      });
    }
  }, [backupSettings, form]);

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: (data: BackupSettingsData) => 
      apiRequest('/api/backup-settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/backup-settings'] });
      toast({
        title: "Success",
        description: "Backup settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update backup settings",
        variant: "destructive",
      });
    },
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: () => {
      // Simulate backup progress
      setBackupProgress(0);
      const interval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      return apiRequest('/api/create-backup', {
        method: 'POST',
        body: JSON.stringify({}),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/backup-settings'] });
      toast({
        title: "Backup Created",
        description: data.message,
      });
      setTimeout(() => setBackupProgress(0), 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Backup Failed",
        description: error.message || "Failed to create backup",
        variant: "destructive",
      });
      setBackupProgress(0);
    },
  });

  const onSubmit = (data: BackupSettingsData) => {
    updateMutation.mutate(data);
  };

  const handleCreateBackup = () => {
    createBackupMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const backupCount = parseInt(backupSettings?.count || '0');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup Configuration
          </CardTitle>
          <CardDescription>
            Configure automated backup settings and retention policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Enable/Disable Backup */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">Enable Automated Backups</Label>
                <p className="text-sm text-gray-600">
                  Automatically create backups of your data based on the schedule below
                </p>
              </div>
              <Switch
                checked={form.watch('isEnabled')}
                onCheckedChange={(checked) => form.setValue('isEnabled', checked)}
              />
            </div>

            {/* Backup Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Backup Schedule
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Backup Frequency</Label>
                  <Select
                    value={form.watch('frequency')}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly') => form.setValue('frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backupLocation">Backup Location</Label>
                  <Select
                    value={form.watch('backupLocation')}
                    onValueChange={(value: 'local' | 'cloud') => form.setValue('backupLocation', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local Storage</SelectItem>
                      <SelectItem value="cloud">Cloud Storage (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Retention Policy */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Retention Policy
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="retentionDays">Keep Backups For</Label>
                  <span className="text-sm font-medium">{form.watch('retentionDays')} days</span>
                </div>
                <Slider
                  value={[form.watch('retentionDays')]}
                  onValueChange={([value]) => form.setValue('retentionDays', value)}
                  max={365}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <p className="text-sm text-gray-600">
                  Older backups will be automatically deleted to save storage space
                </p>
              </div>
            </div>

            {/* Backup Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Backup Options</h3>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Include Uploaded Files</Label>
                  <p className="text-sm text-gray-600">
                    Include product images, documents, and other uploaded files in backups
                  </p>
                </div>
                <Switch
                  checked={form.watch('includeUploads')}
                  onCheckedChange={(checked) => form.setValue('includeUploads', checked)}
                />
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
                Save Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Manual Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Manual Backup
          </CardTitle>
          <CardDescription>
            Create an immediate backup of your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Backup Status */}
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Backup System Active</p>
                  <p className="text-sm text-green-700">
                    {backupCount} backups created so far
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {backupProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Creating backup...</span>
                  <span>{backupProgress}%</span>
                </div>
                <Progress value={backupProgress} className="w-full" />
              </div>
            )}

            {/* Create Backup Button */}
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="font-medium">Create Backup Now</p>
                <p className="text-sm text-gray-600">
                  This will create a complete backup of your current data
                </p>
              </div>
              <Button 
                onClick={handleCreateBackup}
                disabled={createBackupMutation.isPending || !form.watch('isEnabled')}
                className="min-w-32"
              >
                {createBackupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Backup
              </Button>
            </div>
            {!form.watch('isEnabled') && (
              <p className="text-sm text-amber-600">
                Backup system is disabled. Enable it above to create backups.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedBackupTab;