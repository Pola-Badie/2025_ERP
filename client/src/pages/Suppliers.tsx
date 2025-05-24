import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Truck, PlusCircle, Edit, Trash2, Search, X, Loader2, Eye } from 'lucide-react';
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

      {/* View Profile Dialog */}
      <Dialog open={isViewProfileOpen} onOpenChange={setIsViewProfileOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Supplier Profile
            </DialogTitle>
            <DialogDescription>
              Complete information for {selectedSupplier?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Company Name</label>
                  <p className="text-sm bg-gray-50 p-2 rounded border">{selectedSupplier.name}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Contact Person</label>
                  <p className="text-sm bg-gray-50 p-2 rounded border">{selectedSupplier.contactPerson || 'Not specified'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm bg-gray-50 p-2 rounded border">{selectedSupplier.email || 'Not specified'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-sm bg-gray-50 p-2 rounded border">{selectedSupplier.phone || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Address</label>
                <p className="text-sm bg-gray-50 p-2 rounded border">
                  {selectedSupplier.address ? `${selectedSupplier.address}, ${selectedSupplier.city}, ${selectedSupplier.state} ${selectedSupplier.zipCode}` : 'Not specified'}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ETA Number (Tax Registration)</label>
                <p className="text-sm bg-gray-50 p-2 rounded border">
                  {selectedSupplier.etaNumber ? (
                    <span className="text-blue-600 font-medium">{selectedSupplier.etaNumber}</span>
                  ) : (
                    <span className="text-gray-500">Not registered with ETA</span>
                  )}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Materials & Services</label>
                <p className="text-sm bg-gray-50 p-2 rounded border min-h-[60px]">
                  {selectedSupplier.materials || 'No materials specified'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <span className="font-medium">Created:</span> {new Date(selectedSupplier.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Updated:</span> {new Date(selectedSupplier.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewProfileOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewProfileOpen(false);
              selectedSupplier && handleEdit(selectedSupplier);
            }}>
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