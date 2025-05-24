import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  XCircleIcon,
  RefreshCwIcon,
  FileTextIcon,
  CreditCardIcon,
  DownloadIcon,
  UploadIcon,
  ExternalLinkIcon
} from 'lucide-react';

interface ETAIntegrationTabProps {
  preferences: any[];
  refetch: () => void;
}

const etaLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
});

const ETAIntegrationTab: React.FC<ETAIntegrationTabProps> = ({ preferences, refetch }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  const form = useForm<z.infer<typeof etaLoginSchema>>({
    resolver: zodResolver(etaLoginSchema),
    defaultValues: {
      username: '',
      password: '',
      clientId: '',
      clientSecret: '',
    },
  });

  const handleETALogin = async (values: z.infer<typeof etaLoginSchema>) => {
    setIsConnecting(true);
    setConnectionStatus('connecting');
    
    try {
      // Call real ETA authentication API
      const response = await fetch('/api/eta/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: values.clientId,
          clientSecret: values.clientSecret,
          username: values.username,
          pin: values.password, // Using password field as PIN
          apiKey: 'YOUR_ETA_API_KEY', // This should be provided by user
          environment: 'production'
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsConnected(true);
        setConnectionStatus('connected');
        setLastSync(new Date().toLocaleString());
        console.log('Connected to ETA successfully');
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      setIsConnected(false);
      console.error('ETA connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setLastSync(null);
    form.reset();
  };

  const handleSyncInvoices = async () => {
    setIsConnecting(true);
    try {
      // Simulate invoice sync
      await new Promise(resolve => setTimeout(resolve, 1500));
      setLastSync(new Date().toLocaleString());
    } finally {
      setIsConnecting(false);
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircleIcon className="w-3 h-3 mr-1" />Connected</Badge>;
      case 'connecting':
        return <Badge variant="secondary"><RefreshCwIcon className="w-3 h-3 mr-1 animate-spin" />Connecting...</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircleIcon className="w-3 h-3 mr-1" />Connection Failed</Badge>;
      default:
        return <Badge variant="outline"><AlertTriangleIcon className="w-3 h-3 mr-1" />Not Connected</Badge>;
    }
  };

  // SVG for ETA Logo
  const ETALogo = () => (
    <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center text-white font-bold text-xs">
      <div className="text-center">
        <div className="text-sm font-bold">ETA</div>
        <div className="text-xs">مصلحة الضرائب</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ETALogo />
              <div>
                <CardTitle className="text-xl">Egyptian Tax Authority Integration</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect to ETA for automated invoice submission and tax compliance
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
      </Card>

      {/* Connection Status */}
      {connectionStatus === 'connected' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircleIcon className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Successfully connected to Egyptian Tax Authority portal. Invoice submissions are now automated.
            {lastSync && <span className="block mt-1 text-sm">Last sync: {lastSync}</span>}
          </AlertDescription>
        </Alert>
      )}

      {connectionStatus === 'error' && (
        <Alert variant="destructive">
          <XCircleIcon className="h-4 w-4" />
          <AlertDescription>
            Failed to connect to ETA portal. Please check your credentials and try again.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCardIcon className="w-5 h-5 mr-2" />
              ETA Portal Credentials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleETALogin)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ETA Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your ETA portal username" 
                          {...field} 
                          disabled={isConnected}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ETA Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter your ETA portal password" 
                          {...field} 
                          disabled={isConnected}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client ID</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter ETA API Client ID" 
                          {...field} 
                          disabled={isConnected}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Secret</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter ETA API Client Secret" 
                          {...field} 
                          disabled={isConnected}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-2 pt-4">
                  {!isConnected ? (
                    <Button 
                      type="submit" 
                      disabled={isConnecting}
                      className="flex-1"
                    >
                      {isConnecting && <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />}
                      Connect to ETA
                    </Button>
                  ) : (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleDisconnect}
                      className="flex-1"
                    >
                      Disconnect
                    </Button>
                  )}
                  
                  <Button type="button" variant="outline" asChild>
                    <a href="https://sdk.invoicing.eta.gov.eg/ereceiptapi/" target="_blank" rel="noopener noreferrer">
                      <ExternalLinkIcon className="w-4 h-4 mr-2" />
                      ETA API Docs
                    </a>
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Integration Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileTextIcon className="w-5 h-5 mr-2" />
              Integration Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoSync">Automatic Invoice Submission</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically submit invoices to ETA when created
                </p>
              </div>
              <Switch
                id="autoSync"
                checked={autoSyncEnabled}
                onCheckedChange={setAutoSyncEnabled}
                disabled={!isConnected}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Invoice Actions</h4>
              
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={handleSyncInvoices}
                disabled={!isConnected || isConnecting}
              >
                <UploadIcon className="w-4 h-4 mr-2" />
                {isConnecting ? 'Syncing...' : 'Sync Pending Invoices'}
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start"
                disabled={!isConnected}
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Download Tax Reports
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start"
                disabled={!isConnected}
              >
                <FileTextIcon className="w-4 h-4 mr-2" />
                View Submission History
              </Button>
            </div>

            {lastSync && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Last synchronization: <span className="font-medium">{lastSync}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compliance Information */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Compliance Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <FileTextIcon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h4 className="font-medium text-blue-800">Invoice Submissions</h4>
              <p className="text-sm text-blue-600 mt-1">45 this month</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircleIcon className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h4 className="font-medium text-green-800">Successful Submissions</h4>
              <p className="text-sm text-green-600 mt-1">43 completed</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <AlertTriangleIcon className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <h4 className="font-medium text-orange-800">Pending Review</h4>
              <p className="text-sm text-orange-600 mt-1">2 invoices</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ETAIntegrationTab;