import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, PlusCircle, Pencil, UserX, Check, X, Download, Settings, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Define user form schema
const userFormSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'staff', 'manager']),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserManagementTabProps {
  preferences: any;
  refetch: () => void;
}

const UserManagementTab: React.FC<UserManagementTabProps> = ({ preferences, refetch }) => {
  const { toast } = useToast();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<any>(null);

  // Fetch users
  const { data: users = [], isLoading, isError, refetch: refetchUsers } = useQuery({
    queryKey: ['/api/users'],
    refetchOnWindowFocus: false,
  });

  // Fetch user permissions for selected user
  const { data: userPermissions = [], refetch: refetchPermissions } = useQuery({
    queryKey: ['/api/users', selectedUserForPermissions?.id, 'permissions'],
    enabled: !!selectedUserForPermissions?.id,
    refetchOnWindowFocus: false,
  });

  // Form for adding new users
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: '',
      name: '',
      email: '',
      password: '',
      role: 'staff',
    },
  });

  // Edit user form
  const editForm = useForm<Omit<UserFormValues, 'password'> & { id: number }>({
    resolver: zodResolver(
      userFormSchema.omit({ password: true }).extend({
        id: z.number(),
      })
    ),
    defaultValues: {
      id: 0,
      username: '',
      name: '',
      email: '',
      role: 'staff',
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: UserFormValues) => {
      return apiRequest('POST', '/api/users', userData);
    },
    onSuccess: () => {
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsAddUserDialogOpen(false);
      form.reset();
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create user',
        variant: 'destructive',
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: Omit<UserFormValues, 'password'> & { id: number }) => {
      const { id, ...updateData } = userData;
      return apiRequest('PATCH', `/api/users/${id}`, updateData);
    },
    onSuccess: () => {
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsEditUserDialogOpen(false);
      setSelectedUser(null);
      editForm.reset();
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update user',
        variant: 'destructive',
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: () => {
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete user',
        variant: 'destructive',
      });
    },
  });

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    editForm.reset({
      id: user.id,
      username: user.username,
      name: user.name || '',
      email: user.email || '',
      role: user.role,
    });
    setIsEditUserDialogOpen(true);
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleManagePermissions = (user: any) => {
    setSelectedUserForPermissions(user);
    setIsPermissionsDialogOpen(true);
  };

  const handleExportUsers = () => {
    // Convert users data to CSV format
    const csvData = users.map((user: any) => ({
      Username: user.username,
      Name: user.name || '',
      Email: user.email || '',
      Role: user.role,
      Status: user.status || 'active'
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Users exported successfully',
    });
  };

  // Calculate user statistics
  const totalUsers = Array.isArray(users) ? users.length : 0;
  const adminCount = Array.isArray(users) ? users.filter((user: any) => user.role === 'admin').length : 0;
  const managerCount = Array.isArray(users) ? users.filter((user: any) => user.role === 'manager').length : 0;
  const staffCount = Array.isArray(users) ? users.filter((user: any) => user.role === 'staff').length : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-red-500">
        Error loading users. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">User Account Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage system user accounts, roles, and access permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Export Users
          </Button>
          <Button onClick={() => setIsAddUserDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* User Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-2xl font-bold text-blue-700">{totalUsers}</div>
          <div className="text-sm text-blue-600">Total Users</div>
        </div>
        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-2xl font-bold text-green-700">{adminCount}</div>
          <div className="text-sm text-green-600">Administrators</div>
        </div>
        <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="text-2xl font-bold text-purple-700">{managerCount}</div>
          <div className="text-sm text-purple-600">Managers</div>
        </div>
        <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-2xl font-bold text-orange-700">{staffCount}</div>
          <div className="text-sm text-orange-600">Staff Members</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No users found. Add your first user to get started.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.name || '-'}</TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className={`capitalize ${user.role === 'admin' ? 'text-blue-600 font-semibold' : ''}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManagePermissions(user)}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserX className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with appropriate role and permissions.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createUserMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
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
                      <Input type="email" placeholder="Enter email" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role assignments.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => updateUserMutation.mutate(data))} className="space-y-4">
              <FormField
                control={editForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Manage Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Manage module permissions for {selectedUserForPermissions?.name || selectedUserForPermissions?.username} ({selectedUserForPermissions?.role})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm font-medium">Current Permissions</div>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                <div>Module</div>
                <div>Access</div>
                <div>Actions</div>
              </div>
              {userPermissions.length > 0 ? (
                userPermissions.map((permission: any) => (
                  <div key={permission.id} className="grid grid-cols-3 gap-4 py-2 border-b items-center">
                    <div className="font-medium">{permission.moduleName}</div>
                    <div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Granted
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No specific permissions configured. User has default role-based access.
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)}>
              Close
            </Button>
            <Button>
              Add Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementTab;