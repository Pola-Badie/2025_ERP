import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, Thermometer, AlertCircle, Maximize2, BarChart, Minimize2,
  Bell, UserPlus, Receipt, PackagePlus, UserCog, AlertTriangle, Eye,
  User, Settings, LogOut, ChevronDown, Edit2, Save, X, Upload, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define types for dashboard data
interface DashboardSummary {
  totalCustomers: number;
  newCustomers: number;
  todaySales: number;
  monthSales: number;
  lowStockProducts: Product[];
  expiringProducts: Product[];
}

interface Product {
  id: number;
  name: string;
  drugName: string;
  quantity: number;
  expiryDate: string;
  status: string;
}

// Sample data for the sales overview chart (monthly data)
const salesData = [
  { name: 'Jan', sales: 65 },
  { name: 'Feb', sales: 59 },
  { name: 'Mar', sales: 80 },
  { name: 'Apr', sales: 81 },
  { name: 'May', sales: 56 },
  { name: 'Jun', sales: 55 },
  { name: 'Jul', sales: 40 },
  { name: 'Aug', sales: 50 },
  { name: 'Sep', sales: 65 },
  { name: 'Oct', sales: 75 },
  { name: 'Nov', sales: 96 },
  { name: 'Dec', sales: 110 },
];

// Sample data for pie charts
const salesDistributionData = [
  { name: 'Antibiotics', value: 23.5, color: '#1D3E78' },
  { name: 'Pain Relief', value: 23.5, color: '#3BCEAC' },
  { name: 'Vitamins', value: 36.3, color: '#0077B6' },
  { name: 'Supplements', value: 16.7, color: '#48CAE4' },
];

const categoryPerformanceData = [
  { name: 'Pain Relief', value: 23.5, color: '#3BCEAC' },
  { name: 'Antibiotics', value: 23.5, color: '#0077B6' },
  { name: 'Vitamins', value: 23.5, color: '#48CAE4' },
  { name: 'Heart Medicine', value: 23.5, color: '#90E0EF' },
  { name: 'Other', value: 6.0, color: '#CAF0F8' },
];

const Dashboard: React.FC = () => {
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isExpiringProductsCollapsed, setIsExpiringProductsCollapsed] = useState(false);
  const [isLowStockProductsCollapsed, setIsLowStockProductsCollapsed] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Profile dialog state
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@pharmaerp.com',
    role: 'System Administrator',
    phone: '+20 123 456 7890',
    department: 'Administration',
    bio: 'Experienced pharmaceutical administrator with over 10 years in ERP systems management.',
    joinDate: '2023-01-15',
    lastLogin: new Date().toISOString(),
    avatar: '',
  });

  // Profile picture upload states
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);

  // Settings dialog state
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const [settingsData, setSettingsData] = useState({
    language: 'en',
    currency: 'EGP',
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Africa/Cairo',
    notifications: {
      email: true,
      sms: false,
      push: true,
      lowStock: true,
      expiration: true,
    },
    theme: 'light',
    autoLogout: 30,
    defaultView: 'dashboard',
  });
  
  const { toast } = useToast();

  // Profile management functions
  const handleSaveProfile = async () => {
    try {
      // Here you would typically make an API call to save the profile
      // For now, we'll simulate a successful save
      setIsEditingProfile(false);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    // Reset form data to original values if needed
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Settings management functions
  const handleSaveSettings = async () => {
    try {
      // Save settings to localStorage for persistence
      localStorage.setItem('pharmaSettings', JSON.stringify(settingsData));
      
      // Apply theme changes immediately
      if (settingsData.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (settingsData.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // Auto theme - check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      toast({
        title: "Settings Saved Successfully!",
        description: "Your preferences have been updated and will take effect immediately.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSettingsChange = (field: string, value: any) => {
    setSettingsData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setSettingsData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value
      }
    }));
  };

  // Profile picture upload handlers
  const handlePictureUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image size must be less than 5MB');
      return;
    }

    setIsUploadingPicture(true);
    
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPicturePreview(result);
        setProfileData(prev => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Profile picture uploaded successfully');
    } catch (error) {
      console.error('Error uploading picture:', error);
      alert('Failed to upload picture. Please try again.');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleRemovePicture = () => {
    setPicturePreview(null);
    setProfileData(prev => ({ ...prev, avatar: '' }));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePictureUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handlePictureUpload(file);
    }
  };
  
  // Get responsive chart settings based on screen width
  const getChartSettings = () => {
    const width = window.innerWidth;
    if (width < 640) {
      return {
        interval: 2 as const, // Only show every 3rd month on extra small screens
        fontSize: 8,
        minTickGap: 15,
        margin: { top: 15, right: 10, left: 0, bottom: 5 }
      };
    } else if (width < 768) {
      return {
        interval: 1 as const, // Show every other month on small screens
        fontSize: 9,
        minTickGap: 20,
        margin: { top: 15, right: 15, left: 0, bottom: 10 }
      };
    } else {
      return {
        interval: "preserveStart" as const, // Show first, last, and some middle months on larger screens
        fontSize: 10,
        minTickGap: 25,
        margin: { top: 20, right: 20, left: 0, bottom: 10 }
      };
    }
  };

  const [chartSettings, setChartSettings] = useState(getChartSettings());
  
  // Check screen width on component mount and when window resizes
  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setChartSettings(getChartSettings());
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard/summary'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/dashboard/summary');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        return data as DashboardSummary;
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Return default data structure with zeros
        return {
          totalCustomers: 0,
          newCustomers: 0,
          todaySales: 0,
          monthSales: 0,
          lowStockProducts: [],
          expiringProducts: []
        } as DashboardSummary;
      }
    }
  });

  // Custom tooltip for the line chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded">
          <p className="text-xs">{`${payload[0].name} : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">DASHBOARD</h1>
          <p className="text-sm text-slate-500">Pharmacy Management Overview</p>
        </div>
        <div className="flex mt-4 md:mt-0 space-x-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="relative" 
                size="icon"
                onClick={() => setLocation('/notifications')}
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">5</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Recent Activity</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                <div className="p-2 hover:bg-slate-100 rounded-md">
                  <div className="flex items-start space-x-2">
                    <div className="bg-blue-100 rounded-full p-2">
                      <UserPlus className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">User Login</p>
                      <p className="text-xs text-slate-500">Dr. Sarah Johnson logged in from Cairo location</p>
                      <p className="text-xs text-slate-400 mt-1">10 minutes ago</p>
                    </div>
                  </div>
                </div>
                <div className="p-2 hover:bg-slate-100 rounded-md">
                  <div className="flex items-start space-x-2">
                    <div className="bg-green-100 rounded-full p-2">
                      <Receipt className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New Invoice Created</p>
                      <p className="text-xs text-slate-500">Invoice #INV-2025-0042 for Ahmed Hassan</p>
                      <p className="text-xs text-slate-400 mt-1">25 minutes ago</p>
                    </div>
                  </div>
                </div>
                <div className="p-2 hover:bg-slate-100 rounded-md">
                  <div className="flex items-start space-x-2">
                    <div className="bg-yellow-100 rounded-full p-2">
                      <PackagePlus className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Product Updated</p>
                      <p className="text-xs text-slate-500">Panadol Advance inventory updated to 250 units</p>
                      <p className="text-xs text-slate-400 mt-1">1 hour ago</p>
                    </div>
                  </div>
                </div>
                <div className="p-2 hover:bg-slate-100 rounded-md">
                  <div className="flex items-start space-x-2">
                    <div className="bg-purple-100 rounded-full p-2">
                      <UserCog className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">System Setting Changed</p>
                      <p className="text-xs text-slate-500">Default currency changed to EGP</p>
                      <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
                    </div>
                  </div>
                </div>
                <div className="p-2 hover:bg-slate-100 rounded-md">
                  <div className="flex items-start space-x-2">
                    <div className="bg-red-100 rounded-full p-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Low Stock Alert</p>
                      <p className="text-xs text-slate-500">Aspirin has reached the minimum stock level</p>
                      <p className="text-xs text-slate-400 mt-1">3 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setLocation('/notifications')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View All Activity
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative p-0 h-10 rounded-full">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 rounded-full h-10 w-10 flex items-center justify-center overflow-hidden border-2 border-blue-200">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left hidden md:block">
                      <p className="text-sm font-medium">Dr. Sarah Johnson</p>
                      <p className="text-xs text-slate-500">Administrator</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-500 hidden md:block" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsProfileDialogOpen(true)}>
                  <User className="h-4 w-4 mr-2" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsSettingsDialogOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-[#F16F6F] text-white rounded-md border-none overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjgwIiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')] bg-no-repeat bg-right-top bg-contain opacity-30"></div>
          <CardHeader className="pb-0 relative z-10">
            <CardTitle className="text-sm font-medium">TOTAL CUSTOMERS</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">{isLoading ? "..." : dashboardData?.totalCustomers || 250}</div>
            <p className="text-xs mt-1">Total Customers Served</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#57CBEB] text-white rounded-md border-none overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjgwIiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')] bg-no-repeat bg-right-top bg-contain opacity-30"></div>
          <CardHeader className="pb-0 relative z-10">
            <CardTitle className="text-sm font-medium">NEW CUSTOMERS</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">{isLoading ? "..." : dashboardData?.newCustomers || 32}</div>
            <p className="text-xs mt-1">Customers Added</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#7E75C0] text-white rounded-md border-none overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjgwIiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')] bg-no-repeat bg-right-top bg-contain opacity-30"></div>
          <CardHeader className="pb-0 relative z-10">
            <CardTitle className="text-sm font-medium">TODAY'S SALES</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">
              {isLoading ? "..." : `EGP ${dashboardData?.todaySales.toLocaleString() || "1750"}`}
            </div>
            <p className="text-xs mt-1">Today</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#3BCEAC] text-white rounded-md border-none overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjgwIiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')] bg-no-repeat bg-right-top bg-contain opacity-30"></div>
          <CardHeader className="pb-0 relative z-10">
            <CardTitle className="text-sm font-medium">MONTH SALES</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">
              {isLoading ? "..." : `EGP ${dashboardData?.monthSales.toLocaleString() || "12,500"}`}
            </div>
            <p className="text-xs mt-1">Monthly</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Sales Overview Chart */}
        <Card className="bg-white border rounded-md shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <CardTitle className="text-sm font-medium text-gray-700">SALES OVERVIEW</CardTitle>
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <BarChart className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <Minimize2 className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={salesData}
                margin={chartSettings.margin}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={props => {
                    const { x, y, payload } = props;
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text 
                          x={0} 
                          y={0} 
                          dy={16} 
                          textAnchor="middle" 
                          fill="#666" 
                          fontSize={chartSettings.fontSize}
                        >
                          {/* Abbreviate month names to 3 characters */}
                          {payload.value.substring(0, 3)}
                        </text>
                      </g>
                    );
                  }}
                  padding={{ left: 10, right: 10 }}
                  height={30}
                  // Use numeric values for small screens, and explicit controls for larger screens
                  interval={typeof chartSettings.interval === 'number' ? chartSettings.interval : 'preserveStartEnd'}
                  minTickGap={chartSettings.minTickGap}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: chartSettings.fontSize }} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3BCEAC" 
                  strokeWidth={3}
                  dot={{ r: 4, stroke: '#3BCEAC', fill: 'white', strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: '#3BCEAC', fill: '#3BCEAC' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales Distribution Chart */}
        <Card className="bg-white border rounded-md shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <CardTitle className="text-sm font-medium text-gray-700">SALES DISTRIBUTION</CardTitle>
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <BarChart className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <Minimize2 className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2 h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={70}
                  fill="#8884d8"
                  paddingAngle={0}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  labelLine={false}
                >
                  {salesDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Performance Chart */}
        <Card className="bg-white border rounded-md shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <CardTitle className="text-sm font-medium text-gray-700">CATEGORY PERFORMANCE</CardTitle>
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <BarChart className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <Minimize2 className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2 h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPerformanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={70}
                  fill="#8884d8"
                  paddingAngle={0}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  labelLine={false}
                >
                  {categoryPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log and Product Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity Log */}
        <Card className="bg-white border rounded-md shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <CardTitle className="text-sm font-medium text-gray-700">RECENT ACTIVITY LOG</CardTitle>
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[400px]">
              <div className="divide-y divide-gray-100">
                <div className="p-3 hover:bg-slate-50">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                      <UserPlus className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">User Login</p>
                      <p className="text-xs text-slate-500 mt-0.5">Admin user Dr. Sarah Johnson logged in from Cairo location</p>
                      <p className="text-xs text-slate-400 mt-1">10 minutes ago</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 hover:bg-slate-50">
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                      <Receipt className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">New Invoice Created</p>
                      <p className="text-xs text-slate-500 mt-0.5">Invoice #INV-2025-0042 for Ahmed Hassan was created by Sales Rep</p>
                      <p className="text-xs text-slate-400 mt-1">25 minutes ago</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 hover:bg-slate-50">
                  <div className="flex items-start space-x-3">
                    <div className="bg-yellow-100 rounded-full p-2 flex-shrink-0">
                      <PackagePlus className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Product Updated</p>
                      <p className="text-xs text-slate-500 mt-0.5">Panadol Advance inventory was updated to 250 units by Inventory Manager</p>
                      <p className="text-xs text-slate-400 mt-1">1 hour ago</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 hover:bg-slate-50">
                  <div className="flex items-start space-x-3">
                    <div className="bg-purple-100 rounded-full p-2 flex-shrink-0">
                      <UserCog className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">System Setting Changed</p>
                      <p className="text-xs text-slate-500 mt-0.5">Default currency was changed to EGP by System Administrator</p>
                      <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 hover:bg-slate-50">
                  <div className="flex items-start space-x-3">
                    <div className="bg-red-100 rounded-full p-2 flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Low Stock Alert</p>
                      <p className="text-xs text-slate-500 mt-0.5">Aspirin has reached the minimum stock level. Requires attention</p>
                      <p className="text-xs text-slate-400 mt-1">3 hours ago</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 hover:bg-slate-50">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                      <UserPlus className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">New User Created</p>
                      <p className="text-xs text-slate-500 mt-0.5">New Sales Representative account was created for Mahmoud Ali</p>
                      <p className="text-xs text-slate-400 mt-1">Yesterday, 15:30</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 hover:bg-slate-50">
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                      <Receipt className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Payment Received</p>
                      <p className="text-xs text-slate-500 mt-0.5">Payment of EGP 5,250 received for invoice #INV-2025-0039</p>
                      <p className="text-xs text-slate-400 mt-1">Yesterday, 13:45</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-3 py-2 border-t border-gray-100">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setLocation('/notifications')}
              >
                <Eye className="h-4 w-4 mr-2" />
                View All Activity
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Product Tables */}
        <div className="lg:col-span-2 grid grid-cols-1 gap-4">
          {/* Expiring Products */}
          <Card 
            className={`bg-white border rounded-md shadow-sm transition-all duration-200 ${
              isExpiringProductsCollapsed ? 'hover:shadow-md cursor-pointer' : 'hover:shadow-md'
            }`}
          >
            <CardHeader 
              className="flex flex-row items-center justify-between pb-2 border-b cursor-pointer"
              onClick={() => setIsExpiringProductsCollapsed(!isExpiringProductsCollapsed)}
            >
              <CardTitle className="text-sm font-medium text-gray-700">EXPIRING PRODUCTS</CardTitle>
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-sm hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Action for maximize
                  }}
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-sm hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Action for thermometer
                  }}
                >
                  <Thermometer className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-sm hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpiringProductsCollapsed(!isExpiringProductsCollapsed);
                  }}
                >
                  {isExpiringProductsCollapsed ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                </Button>
              </div>
            </CardHeader>
            {!isExpiringProductsCollapsed && (
              <CardContent className="p-0">
                <div className="overflow-auto max-h-[300px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Drug Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Expiry Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-center text-sm text-gray-500">Loading...</td>
                        </tr>
                      ) : dashboardData?.expiringProducts?.length === 0 ? (
                        <>
                          <tr 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              const product: Product = {
                                id: 1,
                                name: "Panadol Advance",
                                drugName: "Panadol Advance",
                                quantity: 45,
                                expiryDate: "2024-08-20",
                                status: "near"
                              };
                              setSelectedProduct(product);
                            }}
                          >
                            <td className="px-4 py-2 text-sm">Panadol Advance</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#FFB454] text-white">
                                NEAR
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">20 Aug 2024</td>
                          </tr>
                          <tr 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              const product: Product = {
                                id: 2,
                                name: "Diclofenac 500mg",
                                drugName: "Diclofenac 500mg",
                                quantity: 30,
                                expiryDate: "2024-09-19",
                                status: "near"
                              };
                              setSelectedProduct(product);
                            }}
                          >
                            <td className="px-4 py-2 text-sm">Diclofenac 500mg</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#FFB454] text-white">
                                NEAR
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">19 Sep 2024</td>
                          </tr>
                          <tr className="hover:bg-gray-50 cursor-pointer">
                            <td className="px-4 py-2 text-sm">Diosmin/Hesperidin</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#FFB454] text-white">
                                NEAR
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">15 Dec 2024</td>
                          </tr>
                          <tr className="hover:bg-gray-50 cursor-pointer">
                            <td className="px-4 py-2 text-sm">Metformin 850mg</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#FFB454] text-white">
                                NEAR
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">20 Sep 2024</td>
                          </tr>
                          <tr className="hover:bg-gray-50 cursor-pointer">
                            <td className="px-4 py-2 text-sm">Amoxicillin 500mg</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#FFB454] text-white">
                                NEAR
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">15 Oct 2024</td>
                          </tr>
                          <tr className="hover:bg-gray-50 cursor-pointer">
                            <td className="px-4 py-2 text-sm">Ibuprofen 400mg</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#FFB454] text-white">
                                NEAR
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">30 Nov 2024</td>
                          </tr>
                          <tr className="hover:bg-gray-50 cursor-pointer">
                            <td className="px-4 py-2 text-sm">Aspirin 100mg</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#FFB454] text-white">
                                NEAR
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">05 Sep 2024</td>
                          </tr>
                          <tr className="hover:bg-gray-50 cursor-pointer">
                            <td className="px-4 py-2 text-sm">Omeprazole 20mg</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#FFB454] text-white">
                                NEAR
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">18 Oct 2024</td>
                          </tr>
                          <tr className="hover:bg-gray-50 cursor-pointer">
                            <td className="px-4 py-2 text-sm">Cetirizine 10mg</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#FFB454] text-white">
                                NEAR
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">25 Nov 2024</td>
                          </tr>
                          <tr 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              const product: Product = {
                                id: 10,
                                name: "Atorvastatin 20mg",
                                drugName: "Atorvastatin 20mg",
                                quantity: 42,
                                expiryDate: "2024-12-12",
                                status: "near"
                              };
                              setSelectedProduct(product);
                            }}
                          >
                            <td className="px-4 py-2 text-sm">Atorvastatin 20mg</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#FFB454] text-white">
                                NEAR
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">12 Dec 2024</td>
                          </tr>
                          <tr 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              const product: Product = {
                                id: 12,
                                name: "Fluoxetine 20mg",
                                drugName: "Fluoxetine 20mg",
                                quantity: 35,
                                expiryDate: "2024-10-05",
                                status: "near"
                              };
                              setSelectedProduct(product);
                            }}
                          >
                            <td className="px-4 py-2 text-sm">Fluoxetine 20mg</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#FFB454] text-white">
                                NEAR
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">05 Oct 2024</td>
                          </tr>
                          <tr 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              const product: Product = {
                                id: 13,
                                name: "Sertraline 50mg",
                                drugName: "Sertraline 50mg",
                                quantity: 28,
                                expiryDate: "2024-11-18",
                                status: "near"
                              };
                              setSelectedProduct(product);
                            }}
                          >
                            <td className="px-4 py-2 text-sm">Sertraline 50mg</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#FFB454] text-white">
                                NEAR
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">18 Nov 2024</td>
                          </tr>
                        </>
                      ) : (
                        dashboardData?.expiringProducts?.map((product: Product) => (
                          <tr 
                            key={product.id} 
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedProduct(product)}
                          >
                            <td className="px-4 py-2 text-sm">{product.drugName}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                product.status === 'expired' || product.status !== 'near' ? 'bg-[#F16F6F] text-white' : 
                                'bg-[#FFB454] text-white'
                              }`}>
                                {product.status === 'near' ? 'NEAR EXPIRY' : 'EXPIRED'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">{new Date(product.expiryDate).toLocaleDateString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Low Stock Products */}
          <Card 
            className={`bg-white border rounded-md shadow-sm transition-all duration-200 ${
              isLowStockProductsCollapsed ? 'hover:shadow-md cursor-pointer' : 'hover:shadow-md'
            }`}
          >
            <CardHeader 
              className="flex flex-row items-center justify-between pb-2 border-b cursor-pointer"
              onClick={() => setIsLowStockProductsCollapsed(!isLowStockProductsCollapsed)}
            >
              <CardTitle className="text-sm font-medium text-gray-700">PRODUCTS WITH LOW STOCK</CardTitle>
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-sm hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Action for maximize
                  }}
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-sm hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Action for alert
                  }}
                >
                  <AlertCircle className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-sm hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLowStockProductsCollapsed(!isLowStockProductsCollapsed);
                  }}
                >
                  {isLowStockProductsCollapsed ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                </Button>
              </div>
            </CardHeader>
            {!isLowStockProductsCollapsed && (
              <CardContent className="p-0">
                <div className="overflow-auto max-h-[300px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Drug Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Stock Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-center text-sm text-gray-500">Loading...</td>
                        </tr>
                      ) : dashboardData?.lowStockProducts?.length === 0 ? (
                        <>
                          <tr 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              const product: Product = {
                                id: 11,
                                name: "Aspirin",
                                drugName: "Aspirin",
                                quantity: 10,
                                expiryDate: "2024-12-19",
                                status: "low_stock"
                              };
                              setSelectedProduct(product);
                            }}
                          >
                            <td className="px-4 py-2 text-sm">Aspirin</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#F16F6F] text-white">
                                10
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">19 June 2024</td>
                          </tr>
                          <tr 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              const product: Product = {
                                id: 14,
                                name: "Amoxicillin 500mg",
                                drugName: "Amoxicillin 500mg",
                                quantity: 8,
                                expiryDate: "2024-12-22",
                                status: "low_stock"
                              };
                              setSelectedProduct(product);
                            }}
                          >
                            <td className="px-4 py-2 text-sm">Amoxicillin 500mg</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#F16F6F] text-white">
                                8
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">22 June 2024</td>
                          </tr>
                          <tr className="hover:bg-gray-50 cursor-pointer">
                            <td className="px-4 py-2 text-sm">Paracetamol 500mg</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#F16F6F] text-white">
                                10
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">15 June 2024</td>
                          </tr>
                          <tr className="hover:bg-gray-50 cursor-pointer">
                            <td className="px-4 py-2 text-sm">Metformin 850mg</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#F16F6F] text-white">
                                8
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">20 June 2024</td>
                          </tr>
                          <tr className="hover:bg-gray-50 cursor-pointer">
                            <td className="px-4 py-2 text-sm">Enalapril 10mg</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#F16F6F] text-white">
                                10
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">25 June 2024</td>
                          </tr>
                          <tr className="hover:bg-gray-50 cursor-pointer">
                            <td className="px-4 py-2 text-sm">Omeprazole 20mg</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#F16F6F] text-white">
                                8
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">28 June 2024</td>
                          </tr>
                          <tr className="hover:bg-gray-50 cursor-pointer">
                            <td className="px-4 py-2 text-sm">Diclofenac 50mg</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#F16F6F] text-white">
                                10
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">14 June 2024</td>
                          </tr>
                          <tr className="hover:bg-gray-50 cursor-pointer">
                            <td className="px-4 py-2 text-sm">Atorvastatin 20mg</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#F16F6F] text-white">
                                8
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">18 June 2024</td>
                          </tr>
                          <tr className="hover:bg-gray-50 cursor-pointer">
                            <td className="px-4 py-2 text-sm">Cetirizine 10mg</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#F16F6F] text-white">
                                10
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">23 June 2024</td>
                          </tr>
                          <tr className="hover:bg-gray-50 cursor-pointer">
                            <td className="px-4 py-2 text-sm">Amlodipine 5mg</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#F16F6F] text-white">
                                8
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">16 June 2024</td>
                          </tr>
                        </>
                      ) : (
                        dashboardData?.lowStockProducts?.map((product: Product) => (
                          <tr 
                            key={product.id} 
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedProduct(product)}
                          >
                            <td className="px-4 py-2 text-sm">{product.drugName}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                product.quantity === 0 || product.status === 'out_of_stock'
                                  ? 'bg-[#F16F6F] text-white' 
                                  : 'bg-[#F16F6F] text-white'
                              }`}>
                                {product.quantity === 0 || product.status === 'out_of_stock' ? 'OUT OF STOCK' : '10'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">19 June 2024</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">Product form will be implemented here.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Details Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected product
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Product Name</h3>
                  <p className="text-sm">{selectedProduct.name || selectedProduct.drugName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      selectedProduct.status === 'expired' ? 'bg-[#F16F6F] text-white' : 
                      selectedProduct.status === 'near' ? 'bg-[#FFB454] text-white' :
                      'bg-green-500 text-white'
                    }`}>
                      {selectedProduct.status === 'expired' ? 'EXPIRED' : 
                       selectedProduct.status === 'near' ? 'NEAR EXPIRY' :
                       selectedProduct.status === 'out_of_stock' ? 'OUT OF STOCK' : 'ACTIVE'}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Quantity</h3>
                  <p className="text-sm">{selectedProduct.quantity !== undefined ? selectedProduct.quantity : 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Expiry Date</h3>
                  <p className="text-sm">{selectedProduct.expiryDate ? new Date(selectedProduct.expiryDate).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              
              <div className="pt-4 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedProduct(null)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    // Action to view full product details or edit the product
                    setSelectedProduct(null);
                  }}
                >
                  View Full Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profileData.avatar} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                  {profileData.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">User Profile</h2>
                <p className="text-sm text-gray-500">Manage your account information</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Profile Picture Upload Section */}
            <div className="flex flex-col items-center space-y-4 p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={picturePreview || profileData.avatar} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl font-semibold">
                    {profileData.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {isUploadingPicture && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              
              {isEditingProfile && (
                <div className="w-full max-w-md space-y-3">
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('picture-upload')?.click()}
                  >
                    <div className="space-y-2">
                      <div className="mx-auto h-12 w-12 text-blue-400">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 48 48">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
                        </svg>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-blue-600">Click to upload</span>
                        <span className="text-gray-500"> or drag and drop</span>
                      </div>
                      <p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  </div>
                  
                  <input
                    id="picture-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('picture-upload')?.click()}
                      disabled={isUploadingPicture}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                    
                    {(picturePreview || profileData.avatar) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemovePicture}
                        disabled={isUploadingPicture}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  disabled={!isEditingProfile}
                  className={isEditingProfile ? 'border-blue-300 focus:border-blue-500' : 'bg-gray-50'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  disabled={!isEditingProfile}
                  className={isEditingProfile ? 'border-blue-300 focus:border-blue-500' : 'bg-gray-50'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                  disabled={!isEditingProfile}
                  className={isEditingProfile ? 'border-blue-300 focus:border-blue-500' : 'bg-gray-50'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={profileData.department}
                  onChange={(e) => handleProfileChange('department', e.target.value)}
                  disabled={!isEditingProfile}
                  className={isEditingProfile ? 'border-blue-300 focus:border-blue-500' : 'bg-gray-50'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={profileData.role}
                  disabled
                  className="bg-gray-100 text-gray-500"
                />
                <p className="text-xs text-gray-400">Role cannot be changed from this interface</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="joinDate">Join Date</Label>
                <Input
                  id="joinDate"
                  value={new Date(profileData.joinDate).toLocaleDateString()}
                  disabled
                  className="bg-gray-100 text-gray-500"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => handleProfileChange('bio', e.target.value)}
                disabled={!isEditingProfile}
                className={isEditingProfile ? 'border-blue-300 focus:border-blue-500' : 'bg-gray-50'}
                rows={3}
                placeholder="Tell us about yourself..."
              />
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h3 className="font-medium text-gray-700">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Last Login:</span>
                  <p className="font-medium">{new Date(profileData.lastLogin).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Account Status:</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsProfileDialogOpen(false)}
            >
              Close
            </Button>
            
            <div className="flex gap-2">
              {isEditingProfile ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditingProfile(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold">Application Settings</h2>
              </div>
            </DialogTitle>
            <DialogDescription>
              Customize your ERP experience with language, currency, notifications, and security preferences.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* General Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">General Preferences</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language" className="flex items-center gap-2">
                    🌐 Language
                  </Label>
                  <select
                    id="language"
                    value={settingsData.language}
                    onChange={(e) => handleSettingsChange('language', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white hover:border-gray-400"
                  >
                    <option value="en">🇺🇸 English</option>
                    <option value="ar">🇪🇬 العربية (Arabic)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency" className="flex items-center gap-2">
                    💰 Default Currency
                  </Label>
                  <select
                    id="currency"
                    value={settingsData.currency}
                    onChange={(e) => handleSettingsChange('currency', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white hover:border-gray-400"
                  >
                    <option value="EGP">🇪🇬 EGP - Egyptian Pound</option>
                    <option value="USD">🇺🇸 USD - US Dollar</option>
                    <option value="EUR">🇪🇺 EUR - Euro</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateFormat" className="flex items-center gap-2">
                    📅 Date Format
                  </Label>
                  <select
                    id="dateFormat"
                    value={settingsData.dateFormat}
                    onChange={(e) => handleSettingsChange('dateFormat', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white hover:border-gray-400"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="flex items-center gap-2">
                    🌍 Timezone
                  </Label>
                  <select
                    id="timezone"
                    value={settingsData.timezone}
                    onChange={(e) => handleSettingsChange('timezone', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white hover:border-gray-400"
                  >
                    <option value="Africa/Cairo">🇪🇬 Cairo (UTC+2)</option>
                    <option value="UTC">🌐 UTC (UTC+0)</option>
                    <option value="America/New_York">🇺🇸 New York (UTC-5)</option>
                    <option value="Europe/London">🇬🇧 London (UTC+0)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Notification Preferences</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Email Notifications</Label>
                    <p className="text-xs text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={settingsData.notifications.email}
                    onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">SMS Notifications</Label>
                    <p className="text-xs text-gray-500">Receive notifications via SMS</p>
                  </div>
                  <Switch
                    checked={settingsData.notifications.sms}
                    onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Push Notifications</Label>
                    <p className="text-xs text-gray-500">Receive browser push notifications</p>
                  </div>
                  <Switch
                    checked={settingsData.notifications.push}
                    onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Low Stock Alerts</Label>
                    <p className="text-xs text-gray-500">Get notified when products are running low</p>
                  </div>
                  <Switch
                    checked={settingsData.notifications.lowStock}
                    onCheckedChange={(checked) => handleNotificationChange('lowStock', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Expiration Alerts</Label>
                    <p className="text-xs text-gray-500">Get notified about expiring products</p>
                  </div>
                  <Switch
                    checked={settingsData.notifications.expiration}
                    onCheckedChange={(checked) => handleNotificationChange('expiration', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Security & Privacy</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="autoLogout" className="flex items-center gap-2">
                    🔒 Auto Logout
                  </Label>
                  <select
                    id="autoLogout"
                    value={settingsData.autoLogout}
                    onChange={(e) => handleSettingsChange('autoLogout', parseInt(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white hover:border-gray-400"
                  >
                    <option value={15}>⏱️ 15 minutes</option>
                    <option value={30}>⏱️ 30 minutes</option>
                    <option value={60}>⏱️ 1 hour</option>
                    <option value={120}>⏱️ 2 hours</option>
                    <option value={0}>♾️ Never</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultView" className="flex items-center gap-2">
                    🏠 Default Page
                  </Label>
                  <select
                    id="defaultView"
                    value={settingsData.defaultView}
                    onChange={(e) => handleSettingsChange('defaultView', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white hover:border-gray-400"
                  >
                    <option value="dashboard">📊 Dashboard</option>
                    <option value="products">📦 Products</option>
                    <option value="customers">👥 Customers</option>
                    <option value="invoices">📄 Invoices</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Display Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Display Preferences</h3>
              
              <div className="space-y-2">
                <Label htmlFor="theme" className="flex items-center gap-2">
                  🎨 Theme
                </Label>
                <select
                  id="theme"
                  value={settingsData.theme}
                  onChange={(e) => handleSettingsChange('theme', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white hover:border-gray-400"
                >
                  <option value="light">☀️ Light</option>
                  <option value="dark">🌙 Dark</option>
                  <option value="auto">🔄 Auto (System)</option>
                </select>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">Advanced Settings</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    For advanced system preferences like backup schedules, user permissions, and integrations, 
                    visit the <strong>System Preferences</strong> page from the main navigation.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsSettingsDialogOpen(false)}
            >
              Cancel
            </Button>
            
            <Button
              onClick={() => {
                handleSaveSettings();
                setIsSettingsDialogOpen(false);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
