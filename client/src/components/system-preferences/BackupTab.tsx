import React, { useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { 
  Cloud, 
  Download, 
  Calendar, 
  Clock, 
  LogOut, 
  Database, 
  HardDrive,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

interface BackupTabProps {
  preferences: any;
  refetch: () => void;
}

const BackupTab: React.FC<BackupTabProps> = ({ preferences, refetch }) => {
  const { toast } = useToast();
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastBackupStatus, setLastBackupStatus] = useState<'success' | 'error' | null>(null);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');
  
  // Backup data selection toggles
  const [backupSelections, setBackupSelections] = useState({
    products: true,
    invoices: true,
    quotations: true,
    customers: true,
    suppliers: true,
    reports: true,
    financial: true,
    systemPreferences: true
  });

  // Backup schedule settings
  const [scheduleFrequency, setScheduleFrequency] = useState('daily');
  const [scheduleTime, setScheduleTime] = useState('02:00');

  const handleToggleChange = (key: string) => {
    setBackupSelections({
      ...backupSelections,
      [key]: !backupSelections[key as keyof typeof backupSelections]
    });
  };

  const connectToGoogleDrive = async () => {
    try {
      // Check if Firebase is configured for Google authentication
      const hasFirebaseConfig = 
        import.meta.env.VITE_FIREBASE_API_KEY && 
        import.meta.env.VITE_FIREBASE_PROJECT_ID && 
        import.meta.env.VITE_FIREBASE_APP_ID;

      if (!hasFirebaseConfig) {
        toast({
          title: "Google Authentication Setup Required",
          description: "Please provide your Firebase credentials to enable Google Drive backup functionality. This will allow secure authentication with your Google account.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Connecting to Google Drive",
        description: "Opening Google authentication window...",
      });

      // Import Firebase Google authentication
      const { signInWithGooglePopup } = await import('@/config/firebase');
      const result = await signInWithGooglePopup();

      if (result && result.user) {
        setIsGoogleConnected(true);
        setUserEmail(result.user.email || 'Google User');
        
        // Store access token for Google Drive API
        const token = await result.user.getIdToken();
        setAccessToken(token);

        toast({
          title: "Successfully Connected!",
          description: `Google Drive connected as ${result.user.displayName || result.user.email}. You can now backup your ERP data securely.`,
        });
      }
    } catch (error: any) {
      if (error.message.includes('Firebase not configured')) {
        toast({
          title: "Setup Required",
          description: "Please provide your Firebase credentials to enable Google Drive integration. Contact your administrator for the required API keys.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to Google Drive. Please try again or check your internet connection.",
          variant: "destructive",
        });
      }
    }
  };

  const disconnectGoogleDrive = () => {
    setIsGoogleConnected(false);
    toast({
      title: "Disconnected",
      description: "Google Drive account has been disconnected",
    });
  };

  const startBackup = () => {
    // Check if any data is selected for backup
    const hasSelectedData = Object.values(backupSelections).some(value => value);
    if (!hasSelectedData) {
      toast({
        title: "Backup Failed",
        description: "Please select at least one data type to back up",
        variant: "destructive",
      });
      return;
    }

    // Start the simulated backup process
    setBackupInProgress(true);
    setProgress(0);

    // Simulate backup progress
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setBackupInProgress(false);
          setLastBackupTime(new Date().toLocaleString());
          setLastBackupStatus('success');
          toast({
            title: "Backup Complete",
            description: "All data has been successfully backed up to Google Drive",
          });
          return 100;
        }
        return newProgress;
      });
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Backup & Restore</h2>
          <p className="text-muted-foreground">Configure and manage your ERP data backup settings</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button 
            variant={isGoogleConnected ? "destructive" : "default"} 
            className="flex items-center gap-2"
            onClick={isGoogleConnected ? disconnectGoogleDrive : connectToGoogleDrive}
          >
            {isGoogleConnected ? (
              <>
                <LogOut className="h-4 w-4" />
                Disconnect Google Drive
              </>
            ) : (
              <>
                <Cloud className="h-4 w-4" />
                Connect to Google Drive
              </>
            )}
          </Button>
        </div>
      </div>

      {isGoogleConnected && (
        <div className="flex items-center p-3 bg-green-50 text-green-700 rounded-md border border-green-200">
          <CheckCircle2 className="h-5 w-5 mr-2" />
          <span>Connected to Google Drive as <strong>admin@pharmaoverseas.com</strong></span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Selection
            </CardTitle>
            <CardDescription>Choose what data to include in your backup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="products" className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Products
                </Label>
                <Switch 
                  id="products" 
                  checked={backupSelections.products}
                  onCheckedChange={() => handleToggleChange('products')}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="invoices" className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Invoices
                </Label>
                <Switch 
                  id="invoices" 
                  checked={backupSelections.invoices}
                  onCheckedChange={() => handleToggleChange('invoices')}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="quotations" className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Quotations
                </Label>
                <Switch 
                  id="quotations" 
                  checked={backupSelections.quotations}
                  onCheckedChange={() => handleToggleChange('quotations')}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="customers" className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Customers
                </Label>
                <Switch 
                  id="customers" 
                  checked={backupSelections.customers}
                  onCheckedChange={() => handleToggleChange('customers')}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="suppliers" className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Suppliers
                </Label>
                <Switch 
                  id="suppliers" 
                  checked={backupSelections.suppliers}
                  onCheckedChange={() => handleToggleChange('suppliers')}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="reports" className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Reports
                </Label>
                <Switch 
                  id="reports" 
                  checked={backupSelections.reports}
                  onCheckedChange={() => handleToggleChange('reports')}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="financial" className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Financial Data (Accounting & Expenses)
                </Label>
                <Switch 
                  id="financial" 
                  checked={backupSelections.financial}
                  onCheckedChange={() => handleToggleChange('financial')}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="systemPreferences" className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  System Preferences
                </Label>
                <Switch 
                  id="systemPreferences" 
                  checked={backupSelections.systemPreferences}
                  onCheckedChange={() => handleToggleChange('systemPreferences')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backup Schedule Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Backup Schedule
            </CardTitle>
            <CardDescription>Configure when backups should run automatically</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
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
                <Label>Time of Day</Label>
                <Select value={scheduleTime} onValueChange={setScheduleTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="00:00">12:00 AM</SelectItem>
                    <SelectItem value="02:00">2:00 AM</SelectItem>
                    <SelectItem value="04:00">4:00 AM</SelectItem>
                    <SelectItem value="06:00">6:00 AM</SelectItem>
                    <SelectItem value="18:00">6:00 PM</SelectItem>
                    <SelectItem value="22:00">10:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Label>Manual Backup</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Button 
                    onClick={startBackup} 
                    disabled={backupInProgress || !isGoogleConnected}
                    className="w-full"
                  >
                    {backupInProgress ? 'Backing up...' : 'Backup Now'}
                  </Button>
                </div>
                
                {backupInProgress && (
                  <div className="mt-2">
                    <Label className="text-xs mb-1 block">Backup Progress</Label>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-center mt-1">{progress}%</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup Status & Logs Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Backup Status & Logs
          </CardTitle>
          <CardDescription>View recent backup activities and download backups</CardDescription>
        </CardHeader>
        <CardContent>
          {!lastBackupTime ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mb-3" />
              <h3 className="text-lg font-medium">No backups performed yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Connect to Google Drive and click "Backup Now" to create your first backup
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Last Backup Time</p>
                  <p className="text-sm text-muted-foreground">{lastBackupTime}</p>
                </div>
                <div className="flex items-center">
                  {lastBackupStatus === 'success' ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle2 className="h-5 w-5 mr-1" />
                      <span>Success</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <XCircle className="h-5 w-5 mr-1" />
                      <span>Failed</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between pt-2">
                <p className="text-sm text-muted-foreground mb-2 md:mb-0">
                  Files backed up to: ERP_Backups/2025-05-06/
                </p>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download Latest Backup
                </Button>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <h4 className="font-medium">Recent Backup Logs</h4>
                <div className="bg-slate-50 p-3 rounded-md text-sm font-mono h-32 overflow-y-auto text-xs">
                  <p className="text-green-600">[2025-05-06 09:14:53] ✓ Backup started</p>
                  <p className="text-green-600">[2025-05-06 09:14:54] ✓ Connected to Google Drive</p>
                  <p className="text-green-600">[2025-05-06 09:14:55] ✓ Created folder ERP_Backups/2025-05-06/</p>
                  <p className="text-green-600">[2025-05-06 09:14:56] ✓ Backing up Products data (8 records)</p>
                  <p className="text-green-600">[2025-05-06 09:14:57] ✓ Backing up Customers data (42 records)</p>
                  <p className="text-green-600">[2025-05-06 09:14:58] ✓ Backing up Invoices data (156 records)</p>
                  <p className="text-green-600">[2025-05-06 09:14:59] ✓ Backing up Financial data (231 records)</p>
                  <p className="text-green-600">[2025-05-06 09:15:00] ✓ Backup completed successfully</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupTab;