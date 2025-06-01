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
import { Loader2, PlusCircle, Pencil, UserX, Check, X } from 'lucide-react';
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
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Fetch users
  const { data: users = [], isLoading, isError, refetch: refetchUsers } = useQuery({
    queryKey: ['/api/users'],
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

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (userData: UserFormValues) => {
      const res = await apiRequest('POST', '/api/users', userData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'User Added',
        description: 'User has been added successfully.',
      });
      form.reset();
      setIsAddUserDialogOpen(false);
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add user.',
        variant: 'destructive',
      });
    },
  });

  // Edit user mutation
  const editUserMutation = useMutation({
    mutationFn: async (userData: Omit<UserFormValues, 'password'> & { id: number }) => {
      const { id, ...data } = userData;
      const res = await apiRequest('PATCH', `/api/users/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'User Updated',
        description: 'User has been updated successfully.',
      });
      editForm.reset();
      setIsEditUserDialogOpen(false);
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user.',
        variant: 'destructive',
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest('DELETE', `/api/users/${userId}`);
      return res;
    },
    onSuccess: () => {
      toast({
        title: 'User Deleted',
        description: 'User has been deleted successfully.',
      });
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user.',
        variant: 'destructive',
      });
    },
  });

  const handleAddUser = (values: UserFormValues) => {
    addUserMutation.mutate(values);
  };

  const handleEditUser = (values: Omit<UserFormValues, 'password'> & { id: number }) => {
    editUserMutation.mutate(values);
  };

  const openEditUserDialog = (user: any) => {
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">User Account Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage system user accounts, roles, and access permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Export Users
          </Button>
          <Button onClick={() => setIsAddUserDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-2xl font-bold text-blue-700">
            {users?.length || 0}
          </div>
          <div className="text-sm text-blue-600">Total Users</div>
        </div>
        <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-2xl font-bold text-green-700">
            {users?.filter((u: any) => u.role === 'admin').length || 0}
          </div>
          <div className="text-sm text-green-600">Administrators</div>
        </div>
        <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="text-2xl font-bold text-purple-700">
            {users?.filter((u: any) => u.role === 'manager').length || 0}
          </div>
          <div className="text-sm text-purple-600">Managers</div>
        </div>
        <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-2xl font-bold text-orange-700">
            {users?.filter((u: any) => u.role === 'staff').length || 0}
          </div>
          <div className="text-sm text-orange-600">Staff Members</div>
        </div>
      </div>

      {isError ? (
        <div className="text-center py-8 text-red-500">
          Error loading users. Please try again.
        </div>
      ) : (
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditUserDialog(user)}
                        className="h-8 w-8 p-0 mr-2"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <UserX className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with the specified role and permissions.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddUser)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
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
                      <Input placeholder="John Doe" {...field} />
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
                      <Input type="email" placeholder="user@example.com" {...field} />
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
                      <Input type="password" placeholder="******" {...field} />
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddUserDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || addUserMutation.isPending}
                >
                  {(form.formState.isSubmitting || addUserMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add User
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
              Update user information and role.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditUser)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
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
                      <Input placeholder="John Doe" {...field} />
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
                      <Input type="email" placeholder="user@example.com" {...field} />
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditUserDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editForm.formState.isSubmitting || editUserMutation.isPending}
                >
                  {(editForm.formState.isSubmitting || editUserMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Role permissions section - will be added later */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Role Permissions</h3>
        <div className="text-muted-foreground text-sm">
          Define what each role can access and modify in the system.
          <Button variant="outline" className="ml-4">Configure Permissions</Button>
        </div>
      </div>
    </div>
  );
};

export default UserManagementTab;