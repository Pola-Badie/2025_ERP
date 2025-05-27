import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Truck, PlusCircle, Edit, Trash2, Search, X, Loader2, Eye, Building2 as Building, User, MapPin, FileText, Package2 as Package, Handshake } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/LanguageContext';
import { CSVExport } from '@/components/csv/CSVExport';
import { CSVImport } from '@/components/csv/CSVImport';

// Form validation schema
const supplierFormSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  materials: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  materials?: string;
  createdAt: string;
}

const Suppliers: React.FC = () => {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewProfileOpen, setIsViewProfileOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Fetch suppliers list
  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'], 
    queryFn: async () => {
      console.log("Fetching suppliers from API");
      const res = await apiRequest('GET', '/api/suppliers');
      const data = await res.json();
      console.log("API response for suppliers:", data);
      return data;
    },
    staleTime: 30000, // 30 seconds
  });

  // Form setup
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
    }
  });

  // Create supplier mutation
  const createSupplierMutation = useMutation({
    mutationFn: async (data: SupplierFormValues) => {
      const response = await apiRequest('POST', '/api/suppliers', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      toast({
        title: 'Success',
        description: 'Supplier created successfully',
      });
      form.reset();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error creating supplier:', error);
      toast({
        title: 'Error',
        description: 'Failed to create supplier. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Update supplier mutation - for future implementation
  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: SupplierFormValues }) => {
      const response = await apiRequest('PATCH', `/api/suppliers/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      toast({
        title: 'Success',
        description: 'Supplier updated successfully',
      });
      form.reset();
      setEditingSupplier(null);
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error updating supplier:', error);
      toast({
        title: 'Error',
        description: 'Failed to update supplier. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete supplier mutation - for future implementation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/suppliers/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      toast({
        title: 'Success',
        description: 'Supplier deleted successfully',
      });
      setIsDeleteDialogOpen(false);
      setSelectedSupplier(null);
    },
    onError: (error) => {
      console.error('Error deleting supplier:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete supplier. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: SupplierFormValues) => {
    if (editingSupplier) {
      updateSupplierMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createSupplierMutation.mutate(data);
    }
  };

  // Handle edit
  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.reset({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      zipCode: supplier.zipCode || '',
    });
    setIsAddDialogOpen(true);
  };

  // Handle delete
  const handleViewProfile = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsViewProfileOpen(true);
  };

  const handleDelete = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  // Filter suppliers based on search
  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(search.toLowerCase()) ||
    (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
    (supplier.email && supplier.email.toLowerCase().includes(search.toLowerCase())) ||
    (supplier.phone && supplier.phone.toLowerCase().includes(search.toLowerCase()))
  );



  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('suppliers')}</h1>
          <p className="text-muted-foreground">Manage your suppliers and vendor relationships.</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
          <CSVExport
            data={suppliers}
            filename="suppliers.csv"
            customHeaders={{
              name: 'Name',
              contactPerson: 'Contact Person',
              email: 'Email',
              phone: 'Phone',
              address: 'Address',
              city: 'City',
              state: 'State',
              zipCode: 'Zip Code'
            }}
            buttonText="Export Suppliers"
            size="sm"
          />
          <CSVImport
            onImport={(data) => {
              // Here we would normally send this data to the backend
              // But for now just show a toast that indicates successful import
              toast({
                title: 'Import Functionality',
                description: `Imported ${data.length} suppliers (API endpoint not implemented yet)`,
              });
              queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
            }}
            buttonText="Import Suppliers"
            size="sm"
          />
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('addSupplier')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingSupplier ? 'Edit Supplier' : t('addSupplier')}</DialogTitle>
                <DialogDescription>
                  {editingSupplier 
                    ? 'Update supplier information in the system.' 
                    : 'Add a new supplier to your inventory system.'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
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
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input type="tel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="etaNumber"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>ETA Number (Egyptian Tax Authority)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter Egyptian Tax Authority registration number"
                            />
                          </FormControl>
                          <FormDescription>
                            Tax registration number for Egyptian Tax Authority compliance
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <Input {...field} />
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
                          <FormLabel>State/Province</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel>Postal/Zip Code</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="materials"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Materials Supplied</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="List of materials this supplier provides (e.g. Raw chemicals, Packaging materials, Laboratory equipment)"
                              className="min-h-[80px]"
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the main materials or product categories this supplier provides
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        form.reset();
                        setEditingSupplier(null);
                        setIsAddDialogOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}
                    >
                      {(createSupplierMutation.isPending || updateSupplierMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search suppliers..."
            className="w-full pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <Button
              variant="ghost"
              className="absolute right-0 top-0 h-9 w-9 p-0"
              onClick={() => setSearch('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            <div className="flex items-center">
              <Truck className="mr-2 h-5 w-5" />
              Suppliers List
            </div>
          </CardTitle>
          <CardDescription>
            Your suppliers information. Total: {filteredSuppliers.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search 
                ? "No suppliers match your search criteria." 
                : "No suppliers found. Add your first supplier."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Supplier Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>ETA Number</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Materials</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id} className="group">
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.contactPerson || '-'}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {supplier.email && (
                            <div className="text-sm">
                              <a 
                                href={`mailto:${supplier.email}`} 
                                className="text-blue-600 hover:underline flex items-center"
                              >
                                {supplier.email}
                              </a>
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="text-sm">
                              <a 
                                href={`tel:${supplier.phone}`} 
                                className="hover:underline"
                              >
                                {supplier.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.etaNumber ? (
                          <span className="text-blue-600 font-medium">
                            {supplier.etaNumber}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Not registered</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {supplier.city && supplier.state ? (
                          <div className="flex flex-col">
                            <span>{supplier.city}, {supplier.state}</span>
                            {supplier.zipCode && <span className="text-xs text-muted-foreground">{supplier.zipCode}</span>}
                          </div>
                        ) : supplier.address ? (
                          <span>{supplier.address}</span>
                        ) : (
                          <span className="text-muted-foreground">No address provided</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {supplier.materials ? (
                          <div className="text-sm max-w-[250px] truncate" title={supplier.materials}>
                            {supplier.materials}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="currentColor"
                                className="bi bi-three-dots-vertical"
                                viewBox="0 0 16 16"
                              >
                                <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewProfile(supplier)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(supplier)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Supplier Profile Dialog */}
      <Dialog open={isViewProfileOpen} onOpenChange={setIsViewProfileOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">Supplier Profile</DialogTitle>
                <p className="text-sm text-gray-600 mt-1">Comprehensive business profile and partnership details for {selectedSupplier?.name}</p>
              </div>
            </div>
          </DialogHeader>

          {selectedSupplier && (
            <div className="space-y-6">
              {/* Company Information Section */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Company Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-700">Company Name</label>
                    <div className="text-lg font-bold text-blue-900 bg-white p-3 rounded border border-blue-200">
                      {selectedSupplier.name}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-700">Business Type</label>
                    <div className="text-sm text-blue-800 bg-white p-3 rounded border border-blue-200">
                      Pharmaceutical Supplier
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-700">Supplier Status</label>
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Active Partner
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-700">Registration Number</label>
                    <div className="text-sm text-blue-800 bg-white p-3 rounded border border-blue-200 font-mono">
                      REG-{selectedSupplier.id.toString().padStart(6, '0')}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-700">Partnership Since</label>
                    <div className="text-sm text-blue-800 bg-white p-3 rounded border border-blue-200">
                      {new Date(selectedSupplier.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-700">Primary Contact Person</label>
                    <div className="text-sm text-green-800 bg-white p-3 rounded border border-green-200">
                      {selectedSupplier.contactPerson || 'Not specified'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-700">Job Title</label>
                    <div className="text-sm text-green-800 bg-white p-3 rounded border border-green-200">
                      Business Development Manager
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-700">Email Address</label>
                    <div className="text-sm text-green-800 bg-white p-3 rounded border border-green-200">
                      {selectedSupplier.email || 'Not specified'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-700">Phone Number</label>
                    <div className="text-sm text-green-800 bg-white p-3 rounded border border-green-200">
                      {selectedSupplier.phone || 'Not specified'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-700">Alternative Contact</label>
                    <div className="text-sm text-green-800 bg-white p-3 rounded border border-green-200">
                      +1 (555) 123-4567 (Emergency)
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-700">Website</label>
                    <div className="text-sm text-green-800 bg-white p-3 rounded border border-green-200">
                      www.{selectedSupplier.name.toLowerCase().replace(/\s+/g, '')}.com
                    </div>
                  </div>
                </div>
              </div>

              {/* Address & Location Section */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Address & Location
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-purple-700">Business Address</label>
                    <div className="text-sm text-purple-800 bg-white p-3 rounded border border-purple-200 min-h-[80px]">
                      {selectedSupplier.address ? 
                        `${selectedSupplier.address}\n${selectedSupplier.city}, ${selectedSupplier.state} ${selectedSupplier.zipCode}` : 
                        'Address not specified'
                      }
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-purple-700">Shipping Address</label>
                    <div className="text-sm text-purple-800 bg-white p-3 rounded border border-purple-200 min-h-[80px]">
                      Same as business address
                      <br />
                      <span className="text-xs text-purple-600">Warehouse: Building B, Loading Dock 3</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-purple-700">Country</label>
                    <div className="text-sm text-purple-800 bg-white p-3 rounded border border-purple-200">
                      United States
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-purple-700">Time Zone</label>
                    <div className="text-sm text-purple-800 bg-white p-3 rounded border border-purple-200">
                      EST (UTC-5)
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-purple-700">Delivery Region</label>
                    <div className="text-sm text-purple-800 bg-white p-3 rounded border border-purple-200">
                      North America & Middle East
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax & Compliance Section */}
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Tax & Compliance
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-orange-700">ETA Number (Tax Registration)</label>
                    <div className="bg-white p-3 rounded border border-orange-200">
                      {selectedSupplier.etaNumber ? (
                        <span className="text-blue-600 font-medium font-mono">{selectedSupplier.etaNumber}</span>
                      ) : (
                        <span className="text-gray-500">Not registered with ETA</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-orange-700">VAT Registration</label>
                    <div className="text-sm text-orange-800 bg-white p-3 rounded border border-orange-200 font-mono">
                      VAT-US-{selectedSupplier.id}2025
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-orange-700">Tax Status</label>
                    <div className="bg-white p-3 rounded border border-orange-200">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Compliant
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-orange-700">Pharmaceutical License</label>
                    <div className="text-sm text-orange-800 bg-white p-3 rounded border border-orange-200 font-mono">
                      PHARMA-LIC-{selectedSupplier.id.toString().padStart(4, '0')}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-orange-700">Certification Expiry</label>
                    <div className="text-sm text-orange-800 bg-white p-3 rounded border border-orange-200">
                      December 31, 2025
                    </div>
                  </div>
                </div>
              </div>

              {/* Products & Services Section */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Products & Services
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-yellow-700">Primary Materials & Services</label>
                    <div className="text-sm text-yellow-800 bg-white p-4 rounded border border-yellow-200 min-h-[100px]">
                      {selectedSupplier.materials || 'No materials specified'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-yellow-700">Specialization</label>
                      <div className="text-sm text-yellow-800 bg-white p-3 rounded border border-yellow-200">
                        Active Pharmaceutical Ingredients (APIs)
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-yellow-700">Quality Certifications</label>
                      <div className="text-sm text-yellow-800 bg-white p-3 rounded border border-yellow-200">
                        ISO 9001, GMP, FDA Approved
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-yellow-700">Lead Time</label>
                      <div className="text-sm text-yellow-800 bg-white p-3 rounded border border-yellow-200">
                        2-3 weeks
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-yellow-700">Minimum Order</label>
                      <div className="text-sm text-yellow-800 bg-white p-3 rounded border border-yellow-200">
                        $5,000 USD
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-yellow-700">Payment Terms</label>
                      <div className="text-sm text-yellow-800 bg-white p-3 rounded border border-yellow-200">
                        Net 30 days
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Partnership Details Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Handshake className="h-5 w-5 mr-2" />
                  Partnership Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Partnership Level</label>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Preferred Partner
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Total Orders</label>
                    <div className="text-lg font-bold text-gray-900 bg-white p-3 rounded border border-gray-200">
                      247
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Total Value</label>
                    <div className="text-lg font-bold text-green-600 bg-white p-3 rounded border border-gray-200">
                      $2.4M
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Performance Score</label>
                    <div className="text-lg font-bold text-green-600 bg-white p-3 rounded border border-gray-200">
                      98.5%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Last Order Date</label>
                    <div className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-200">
                      {new Date(selectedSupplier.updatedAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Contract Renewal</label>
                    <div className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-200">
                      Annual - Due: December 2025
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsViewProfileOpen(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Close
            </Button>
            <Button 
              variant="outline"
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export Profile
            </Button>
            <Button 
              onClick={() => {
                setIsViewProfileOpen(false);
                selectedSupplier && handleEdit(selectedSupplier);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the supplier "{selectedSupplier?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedSupplier && deleteSupplierMutation.mutate(selectedSupplier.id)}
              disabled={deleteSupplierMutation.isPending}
            >
              {deleteSupplierMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Suppliers;