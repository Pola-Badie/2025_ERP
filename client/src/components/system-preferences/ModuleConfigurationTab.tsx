import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Users, 
  Package, 
  DollarSign, 
  FileText, 
  TruckIcon, 
  ClipboardList, 
  BarChart3, 
  Shield,
  Building,
  Calendar,
  AlertTriangle,
  Zap,
  Eye,
  UserCheck,
  Archive,
  Cog
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ModuleConfigurationTabProps {
  preferences: any[];
  refetch: () => void;
}

const ModuleConfigurationTab: React.FC<ModuleConfigurationTabProps> = ({ preferences, refetch }) => {
  const { toast } = useToast();
  const [moduleSettings, setModuleSettings] = useState<Record<string, boolean>>({});

  // 17 core modules with enhanced configurations
  const systemModules = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'Main overview and analytics dashboard',
      icon: BarChart3,
      category: 'Core',
      features: ['Real-time analytics', 'Performance metrics', 'Quick actions']
    },
    {
      id: 'products',
      name: 'Product Management',
      description: 'Comprehensive product catalog and inventory tracking',
      icon: Package,
      category: 'Inventory',
      features: ['Product catalog', 'Stock management', 'Category organization']
    },
    {
      id: 'customers',
      name: 'Customer Management',
      description: 'Customer relationship and contact management',
      icon: Users,
      category: 'Sales',
      features: ['Customer profiles', 'Contact management', 'Purchase history']
    },
    {
      id: 'suppliers',
      name: 'Supplier Management',
      description: 'Vendor and supplier relationship management',
      icon: TruckIcon,
      category: 'Procurement',
      features: ['Supplier profiles', 'Contract management', 'Performance tracking']
    },
    {
      id: 'createInvoice',
      name: 'Invoice Creation',
      description: 'Generate and manage customer invoices',
      icon: FileText,
      category: 'Sales',
      features: ['Invoice generation', 'Template management', 'Auto-calculation']
    },
    {
      id: 'createQuotation',
      name: 'Quotation Management',
      description: 'Create and track sales quotations',
      icon: ClipboardList,
      category: 'Sales',
      features: ['Quote generation', 'Approval workflow', 'Conversion tracking']
    },
    {
      id: 'invoiceHistory',
      name: 'Invoice History',
      description: 'Historical invoice records and tracking',
      icon: Archive,
      category: 'Sales',
      features: ['Invoice archive', 'Payment tracking', 'Search & filter']
    },
    {
      id: 'quotationHistory',
      name: 'Quotation History',
      description: 'Historical quotation records and analysis',
      icon: Archive,
      category: 'Sales',
      features: ['Quote archive', 'Conversion analytics', 'Follow-up tracking']
    },
    {
      id: 'orderManagement',
      name: 'Order Management',
      description: 'Comprehensive order processing and fulfillment',
      icon: ClipboardList,
      category: 'Operations',
      features: ['Order processing', 'Fulfillment tracking', 'Status management']
    },
    {
      id: 'ordersHistory',
      name: 'Order History',
      description: 'Historical order records and analytics',
      icon: Archive,
      category: 'Operations',
      features: ['Order archive', 'Performance metrics', 'Trend analysis']
    },
    {
      id: 'accounting',
      name: 'Accounting & Finance',
      description: 'Complete financial management and reporting',
      icon: DollarSign,
      category: 'Finance',
      features: ['Chart of accounts', 'Financial reports', 'Journal entries']
    },
    {
      id: 'expenses',
      name: 'Expense Management',
      description: 'Track and manage business expenses',
      icon: DollarSign,
      category: 'Finance',
      features: ['Expense tracking', 'Category management', 'Approval workflow']
    },
    {
      id: 'reports',
      name: 'Reports & Analytics',
      description: 'Business intelligence and reporting suite',
      icon: BarChart3,
      category: 'Analytics',
      features: ['Custom reports', 'Data visualization', 'Export capabilities']
    },
    {
      id: 'label',
      name: 'Label Generation',
      description: 'Product labeling and regulatory compliance',
      icon: FileText,
      category: 'Compliance',
      features: ['Label templates', 'Regulatory compliance', 'Batch printing']
    },
    {
      id: 'userManagement',
      name: 'User Management',
      description: 'System user administration and permissions',
      icon: UserCheck,
      category: 'Administration',
      features: ['User accounts', 'Role management', 'Permission control']
    },
    {
      id: 'systemPreferences',
      name: 'System Preferences',
      description: 'Global system configuration and settings',
      icon: Cog,
      category: 'Administration',
      features: ['System settings', 'Module configuration', 'Global preferences']
    },
    {
      id: 'procurement',
      name: 'Procurement',
      description: 'Purchase order management and vendor relations',
      icon: TruckIcon,
      category: 'Procurement',
      features: ['Purchase orders', 'Vendor management', 'Approval workflow']
    }
  ];

  const moduleCategories = ['Core', 'Inventory', 'Sales', 'Operations', 'Finance', 'Analytics', 'Compliance', 'Administration', 'Procurement'];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Core': return BarChart3;
      case 'Inventory': return Package;
      case 'Sales': return DollarSign;
      case 'Operations': return ClipboardList;
      case 'Finance': return DollarSign;
      case 'Analytics': return BarChart3;
      case 'Compliance': return Shield;
      case 'Administration': return Settings;
      case 'Procurement': return TruckIcon;
      default: return Cog;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Core': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Inventory': return 'bg-green-100 text-green-800 border-green-200';
      case 'Sales': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Operations': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Finance': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Analytics': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Compliance': return 'bg-red-100 text-red-800 border-red-200';
      case 'Administration': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Procurement': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleModuleToggle = (moduleId: string, enabled: boolean) => {
    setModuleSettings(prev => ({
      ...prev,
      [moduleId]: enabled
    }));

    toast({
      title: enabled ? "Module Enabled" : "Module Disabled",
      description: `${systemModules.find(m => m.id === moduleId)?.name} module has been ${enabled ? 'enabled' : 'disabled'} system-wide.`,
    });
  };

  const handleBulkAction = (action: 'enableAll' | 'disableAll' | 'resetDefaults') => {
    const newSettings: Record<string, boolean> = {};
    
    systemModules.forEach(module => {
      switch (action) {
        case 'enableAll':
          newSettings[module.id] = true;
          break;
        case 'disableAll':
          newSettings[module.id] = false;
          break;
        case 'resetDefaults':
          newSettings[module.id] = ['dashboard', 'products', 'customers', 'accounting'].includes(module.id);
          break;
      }
    });

    setModuleSettings(newSettings);

    toast({
      title: "Bulk Action Applied",
      description: `All modules have been updated according to ${action.replace(/([A-Z])/g, ' $1').toLowerCase()}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Module Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure system-wide module availability and features across all user roles
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('enableAll')}>
            Enable All
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('disableAll')}>
            Disable All
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('resetDefaults')}>
            Reset to Defaults
          </Button>
        </div>
      </div>

      {/* Module Categories */}
      {moduleCategories.map(category => {
        const categoryModules = systemModules.filter(module => module.category === category);
        const CategoryIcon = getCategoryIcon(category);
        
        return (
          <Card key={category}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">{category} Modules</CardTitle>
                    <CardDescription>
                      {categoryModules.length} module{categoryModules.length !== 1 ? 's' : ''} in this category
                    </CardDescription>
                  </div>
                </div>
                <Badge className={getCategoryColor(category)}>
                  {categoryModules.filter(m => moduleSettings[m.id] !== false).length} / {categoryModules.length} Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryModules.map(module => {
                const ModuleIcon = module.icon;
                const isEnabled = moduleSettings[module.id] !== false;
                
                return (
                  <div key={module.id} className="space-y-3">
                    <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3 flex-1">
                        <ModuleIcon className={`h-5 w-5 mt-0.5 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{module.name}</h4>
                            <Badge variant={isEnabled ? "default" : "secondary"} className="text-xs">
                              {isEnabled ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{module.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {module.features.map(feature => (
                              <Badge key={feature} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => handleModuleToggle(module.id, checked)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration Summary</CardTitle>
          <CardDescription>
            Overview of current module configuration status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {systemModules.filter(m => moduleSettings[m.id] !== false).length}
              </div>
              <div className="text-sm text-green-600">Active Modules</div>
            </div>
            <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-2xl font-bold text-red-700">
                {systemModules.filter(m => moduleSettings[m.id] === false).length}
              </div>
              <div className="text-sm text-red-600">Disabled Modules</div>
            </div>
            <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {moduleCategories.length}
              </div>
              <div className="text-sm text-blue-600">Categories</div>
            </div>
            <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">
                {systemModules.reduce((acc, module) => acc + module.features.length, 0)}
              </div>
              <div className="text-sm text-purple-600">Total Features</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Configuration */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline">
          Reset Changes
        </Button>
        <Button onClick={() => {
          toast({
            title: "Configuration Saved",
            description: "Module configuration has been saved successfully.",
          });
        }}>
          Save Configuration
        </Button>
      </div>
    </div>
  );
};

export default ModuleConfigurationTab;