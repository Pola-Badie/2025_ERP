import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Icons
import { 
  Search, Plus, Download, Upload, Users, Building, DollarSign, TrendingUp, 
  Phone, Mail, MapPin, Edit, Trash2, Eye, BarChart3, Loader2,
  FileText, Database, Filter, RefreshCw
} from 'lucide-react';

// Form handling
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// CSV Import/Export
import { CSVImport } from '@/components/csv/CSVImport';
import { CSVExport } from '@/components/csv/CSVExport';

// Customer validation schema
const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone number is required'),
  company: z.string().optional(),
  position: z.string().optional(),
  sector: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  taxNumber: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company?: string;
  position?: string;
  sector?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  taxNumber?: string;
  totalPurchases: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomerReports {
  summary: {
    totalCustomers: number;
    activeCustomers: number;
    newCustomersThisMonth: number;
    totalRevenue: string;
    averageOrderValue: string;
    repeatCustomers: string;
    averageLifetimeValue: string;
  };
  sectorDistribution: Record<string, number>;
  geographic: Record<string, number>;
  topCustomers: Array<{
    id: number;
    name: string;
    revenue: string;
    orderCount: number;
  }>;
  monthlyGrowth: Array<{
    month: string;
    newCustomers: number;
    growth: number;
  }>;
}

const CustomersPage = () => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Fetch customers with real-time data
  const { data: customers = [], isLoading: customersLoading, error: customersError } = useQuery<Customer[]>({
    queryKey: ['/api/v1/customers', searchQuery, sectorFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (sectorFilter && sectorFilter !== 'all') params.append('sector', sectorFilter);
      
      const url = `/api/v1/customers${params.toString() ? `?${params.toString()}` : ''}`;
      return await apiRequest('GET', url);
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time data
  });

  // Fetch customer reports with real database calculations
  const { data: reports, isLoading: reportsLoading } = useQuery<CustomerReports>({
    queryKey: ['/api/v1/reports/customers'],
    queryFn: async () => await apiRequest('GET', '/api/v1/reports/customers'),
    refetchInterval: 60000, // Refresh reports every minute
  });

  // Form for adding/editing customers
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      sector: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      taxNumber: '',
    },
  });

  // Mutations for CRUD operations
  const createCustomerMutation = useMutation({
    mutationFn: (data: CustomerFormData) => apiRequest('POST', '/api/v1/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/reports/customers'] });
      setShowAddDialog(false);
      form.reset();
      toast({ title: 'Success', description: 'Customer created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to create customer', variant: 'destructive' });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CustomerFormData }) => 
      apiRequest('PATCH', `/api/v1/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/reports/customers'] });
      setShowEditDialog(false);
      setSelectedCustomer(null);
      form.reset();
      toast({ title: 'Success', description: 'Customer updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to update customer', variant: 'destructive' });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/v1/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/reports/customers'] });
      setShowDeleteDialog(false);
      setSelectedCustomer(null);
      toast({ title: 'Success', description: 'Customer deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to delete customer', variant: 'destructive' });
    },
  });

  // Handle CSV import with real database integration
  const handleCSVImport = async (data: any[]) => {
    try {
      const result = await apiRequest('POST', '/api/v1/bulk/import-json', {
        type: 'customers',
        data,
      });

      if (result.success) {
        const message = `Imported ${result.imported || 0} customers successfully`;
        toast({ title: 'Import Complete', description: message });
        queryClient.invalidateQueries({ queryKey: ['/api/v1/customers'] });
        queryClient.invalidateQueries({ queryKey: ['/api/v1/reports/customers'] });
      } else {
        throw new Error(result.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({ 
        title: 'Import Failed', 
        description: error instanceof Error ? error.message : 'Failed to import customers',
        variant: 'destructive'
      });
    }
  };

  // Handle form submissions
  const onAddSubmit = (data: CustomerFormData) => {
    createCustomerMutation.mutate(data);
  };

  const onEditSubmit = (data: CustomerFormData) => {
    if (selectedCustomer) {
      updateCustomerMutation.mutate({ id: selectedCustomer.id, data });
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    form.reset({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company || '',
      position: customer.position || '',
      sector: customer.sector || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      zipCode: customer.zipCode || '',
      taxNumber: customer.taxNumber || '',
    });
    setShowEditDialog(true);
  };

  const handleDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeleteDialog(true);
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailsDialog(true);
  };

  // Get unique sectors for filter
  const sectors = Array.from(new Set(customers.map(c => c.sector).filter(Boolean)));

  if (customersError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-12">
            <Database className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Database Connection Error</h2>
            <p className="text-muted-foreground mb-4">Failed to load customer data from database</p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/v1/customers'] })}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="customers-page">
      {/* Header with Real-Time Statistics */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">
            {t('customers').toUpperCase()}
          </h1>
          <p className="text-muted-foreground">
            Real-time customer management with ERP integration
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <CSVImport
            onImport={handleCSVImport}
            buttonText="Import CSV"
            size="sm"
            variant="outline"
            dataType="customers"
            data-testid="import-csv-button"
          />
          <CSVExport
            data={customers}
            filename="customers_export.csv"
            buttonText="Export"
            size="sm"
            variant="outline"
            data-testid="export-csv-button"
          />
          <Button onClick={() => setShowAddDialog(true)} data-testid="add-customer-button">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Real-Time Statistics Cards */}
      {reports && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="total-customers-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-customers-count">
                {reportsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  reports.summary.totalCustomers.toLocaleString()
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {reports.summary.activeCustomers} active this month
              </p>
            </CardContent>
          </Card>

          <Card data-testid="total-revenue-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-revenue-amount">
                {reportsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  `EGP ${parseFloat(reports.summary.totalRevenue).toLocaleString()}`
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg: EGP {reports.summary.averageOrderValue}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="repeat-customers-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Repeat Customers</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="repeat-customers-rate">
                {reportsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  reports.summary.repeatCustomers
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Customer retention rate
              </p>
            </CardContent>
          </Card>

          <Card data-testid="average-lifetime-value-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Lifetime Value</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="average-lifetime-value">
                {reportsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  `EGP ${parseFloat(reports.summary.averageLifetimeValue).toLocaleString()}`
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Per customer value
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers by name, email, company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger data-testid="sector-filter">
                  <SelectValue placeholder="Filter by sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  {sectors.map((sector) => (
                    <SelectItem key={sector} value={sector || "unknown"}>
                      {sector || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table with Real Database Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Customer Database
            {customersLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customersLoading ? (
            <div className="text-center py-12">
              <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
              <p>Loading customer data from database...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No customers found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || sectorFilter 
                  ? 'No customers match your search criteria'
                  : 'Start by adding your first customer or importing from CSV'
                }
              </p>
              {!searchQuery && !sectorFilter && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Customer
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Company/Sector</TableHead>
                    <TableHead>Purchases</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id} data-testid={`customer-row-${customer.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium" data-testid={`customer-name-${customer.id}`}>
                            {customer.name}
                          </div>
                          {customer.position && (
                            <div className="text-sm text-muted-foreground">
                              {customer.position}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {customer.company && (
                            <div className="font-medium">{customer.company}</div>
                          )}
                          {customer.sector && (
                            <Badge variant="outline" className="text-xs">
                              {customer.sector}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium" data-testid={`customer-purchases-${customer.id}`}>
                          EGP {parseFloat(customer.totalPurchases || '0').toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewDetails(customer)}
                            data-testid={`view-customer-${customer.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(customer)}
                            data-testid={`edit-customer-${customer.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(customer)}
                            data-testid={`delete-customer-${customer.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Customer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="add-customer-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="add-customer-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="add-customer-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="add-customer-company" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="add-customer-position" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sector"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sector</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="add-customer-sector" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="add-customer-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="add-customer-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="add-customer-state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="add-customer-zip" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Number</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="add-customer-tax" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)}
                  data-testid="cancel-add-customer"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCustomerMutation.isPending}
                  data-testid="save-add-customer"
                >
                  {createCustomerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Customer'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="edit-customer-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="edit-customer-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="edit-customer-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="edit-customer-company" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="edit-customer-position" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sector"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sector</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="edit-customer-sector" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="edit-customer-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="edit-customer-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="edit-customer-state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="edit-customer-zip" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Number</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="edit-customer-tax" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)}
                  data-testid="cancel-edit-customer"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateCustomerMutation.isPending}
                  data-testid="save-edit-customer"
                >
                  {updateCustomerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Customer'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete {selectedCustomer?.name}?</p>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone and will remove all customer data from the database.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              data-testid="cancel-delete-customer"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedCustomer && deleteCustomerMutation.mutate(selectedCustomer.id)}
              disabled={deleteCustomerMutation.isPending}
              data-testid="confirm-delete-customer"
            >
              {deleteCustomerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Customer'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{selectedCustomer.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    {selectedCustomer.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {[selectedCustomer.address, selectedCustomer.city, selectedCustomer.state, selectedCustomer.zipCode]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Business Information</h3>
                  <div className="space-y-2 text-sm">
                    {selectedCustomer.company && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{selectedCustomer.company}</span>
                      </div>
                    )}
                    {selectedCustomer.position && (
                      <div>
                        <strong>Position:</strong> {selectedCustomer.position}
                      </div>
                    )}
                    {selectedCustomer.sector && (
                      <div>
                        <strong>Sector:</strong> {selectedCustomer.sector}
                      </div>
                    )}
                    {selectedCustomer.taxNumber && (
                      <div>
                        <strong>Tax Number:</strong> {selectedCustomer.taxNumber}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Total Purchases: EGP {parseFloat(selectedCustomer.totalPurchases || '0').toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Database Information</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Customer ID: {selectedCustomer.id}</div>
                  <div>Created: {new Date(selectedCustomer.createdAt).toLocaleDateString()}</div>
                  <div>Last Updated: {new Date(selectedCustomer.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersPage;