import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, UserPermission } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, UserCog2, ShieldCheck, UserX, PencilLine, MoreHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Define form schemas
const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
  status: z.string().optional(),
});

const userUpdateSchema = userFormSchema.partial().extend({
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

const permissionFormSchema = z.object({
  moduleName: z.string().min(1, "Module name is required"),
  accessGranted: z.boolean().default(true),
});

type UserFormValues = z.infer<typeof userFormSchema>;
type UserUpdateValues = z.infer<typeof userUpdateSchema>;
type PermissionFormValues = z.infer<typeof permissionFormSchema>;

// Module list for permissions
const availableModules = [
  "dashboard",
  "inventory",
  "sales",
  "purchases",
  "customers",
  "suppliers",
  "accounting",
  "reports",
  "users",
  "settings",
];

type Role = "admin" | "manager" | "sales" | "inventory" | "accountant";

// Component for the users page
export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<string>("users");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isAddPermissionOpen, setIsAddPermissionOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      return await response.json() as User[];
    },
  });

  // Fetch user permissions for selected user
  const { data: permissions, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ["/api/users", selectedUser?.id, "permissions"],
    queryFn: async () => {
      if (!selectedUser) return [];
      const response = await apiRequest("GET", `/api/users/${selectedUser.id}/permissions`);
      return await response.json() as UserPermission[];
    },
    enabled: !!selectedUser,
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const response = await apiRequest("POST", "/api/users", data);
      return await response.json() as User;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAddUserOpen(false);
      toast({
        title: "User created",
        description: "The user has been created successfully.",
      });
      addUserForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create user: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number; userData: UserUpdateValues }) => {
      const response = await apiRequest("PUT", `/api/users/${data.id}`, data.userData);
      return await response.json() as User;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditUserOpen(false);
      toast({
        title: "User updated",
        description: "The user has been updated successfully.",
      });
      updateUserForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update user: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Deactivate user mutation
  const deactivateUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PUT", `/api/users/${id}/deactivate`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User deactivated",
        description: "The user has been deactivated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to deactivate user: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Add permission mutation
  const addPermissionMutation = useMutation({
    mutationFn: async (data: { userId: number; permission: PermissionFormValues }) => {
      const response = await apiRequest("POST", `/api/users/${data.userId}/permissions`, data.permission);
      return await response.json() as UserPermission;
    },
    onSuccess: () => {
      if (selectedUser) {
        queryClient.invalidateQueries({ queryKey: ["/api/users", selectedUser.id, "permissions"] });
      }
      setIsAddPermissionOpen(false);
      toast({
        title: "Permission added",
        description: "The permission has been added successfully.",
      });
      permissionForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add permission: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete permission mutation
  const deletePermissionMutation = useMutation({
    mutationFn: async (data: { userId: number; moduleName: string }) => {
      await apiRequest("DELETE", `/api/users/${data.userId}/permissions/${data.moduleName}`);
    },
    onSuccess: () => {
      if (selectedUser) {
        queryClient.invalidateQueries({ queryKey: ["/api/users", selectedUser.id, "permissions"] });
      }
      toast({
        title: "Permission deleted",
        description: "The permission has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete permission: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form for adding a new user
  const addUserForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      role: "sales",
      status: "active",
    },
  });

  // Form for updating a user
  const updateUserForm = useForm<UserUpdateValues>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      role: "",
      status: "",
    },
  });

  // Form for adding a permission
  const permissionForm = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionFormSchema),
    defaultValues: {
      moduleName: "",
      accessGranted: true,
    },
  });

  // Handle user form submission
  const onAddUserSubmit = (data: UserFormValues) => {
    addUserMutation.mutate(data);
  };

  // Handle user update form submission
  const onUpdateUserSubmit = (data: UserUpdateValues) => {
    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, userData: data });
    }
  };

  // Handle permission form submission
  const onAddPermissionSubmit = (data: PermissionFormValues) => {
    if (selectedUser) {
      addPermissionMutation.mutate({ userId: selectedUser.id, permission: data });
    }
  };

  // Handle user deactivation
  const handleDeactivateUser = (user: User) => {
    if (confirm(`Are you sure you want to deactivate ${user.name}?`)) {
      deactivateUserMutation.mutate(user.id);
    }
  };

  // Handle permission deletion
  const handleDeletePermission = (permission: UserPermission) => {
    if (confirm(`Are you sure you want to delete this permission?`)) {
      deletePermissionMutation.mutate({ userId: permission.userId, moduleName: permission.moduleName });
    }
  };

  // Handle user selection for viewing permissions
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setActiveTab("permissions");
  };

  // Handle editing a user
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    updateUserForm.reset({
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || "active",
    });
    setIsEditUserOpen(true);
  };

  // Get status badge color
  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "inactive":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get role badge color
  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-500";
      case "manager":
        return "bg-blue-500";
      case "sales":
        return "bg-green-500";
      case "inventory":
        return "bg-orange-500";
      case "accountant":
        return "bg-cyan-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <Button onClick={() => setIsAddUserOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="users">
            <UserCog2 className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="permissions" disabled={!selectedUser}>
            <ShieldCheck className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User List</CardTitle>
              <CardDescription>Manage system users and their roles</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableCaption>List of all system users</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status || "active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleUserSelect(user)}>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Manage Permissions
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <PencilLine className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeactivateUser(user)}
                                disabled={user.status === "inactive"}
                                className="text-red-600"
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          {selectedUser && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Permission Management</CardTitle>
                    <CardDescription>
                      Manage permissions for {selectedUser.name} ({selectedUser.username})
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsAddPermissionOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Permission
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingPermissions ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableCaption>User's module permissions</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Module</TableHead>
                        <TableHead>Access</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permissions?.map((permission) => (
                        <TableRow key={`${permission.userId}-${permission.moduleName}`}>
                          <TableCell className="font-medium">{permission.moduleName}</TableCell>
                          <TableCell>
                            <Badge className={permission.accessGranted ? "bg-green-500" : "bg-red-500"}>
                              {permission.accessGranted ? "Granted" : "Denied"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePermission(permission)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {permissions?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                            No permissions assigned yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user with role-based permissions.
            </DialogDescription>
          </DialogHeader>
          <Form {...addUserForm}>
            <form onSubmit={addUserForm.handleSubmit(onAddUserSubmit)} className="space-y-4">
              <FormField
                control={addUserForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addUserForm.control}
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
                control={addUserForm.control}
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
                control={addUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="sales">Sales Representative</SelectItem>
                        <SelectItem value="inventory">Inventory Manager</SelectItem>
                        <SelectItem value="accountant">Accountant</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The role determines the default permissions for this user.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddUserOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addUserMutation.isPending}>
                  {addUserMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create User
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and settings.
            </DialogDescription>
          </DialogHeader>
          <Form {...updateUserForm}>
            <form onSubmit={updateUserForm.handleSubmit(onUpdateUserSubmit)} className="space-y-4">
              <FormField
                control={updateUserForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateUserForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Leave blank to keep current password" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave blank to keep the current password.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateUserForm.control}
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
                control={updateUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="sales">Sales Representative</SelectItem>
                        <SelectItem value="inventory">Inventory Manager</SelectItem>
                        <SelectItem value="accountant">Accountant</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateUserForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditUserOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update User
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Permission Dialog */}
      <Dialog open={isAddPermissionOpen} onOpenChange={setIsAddPermissionOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Permission</DialogTitle>
            <DialogDescription>
              Assign module access to {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <Form {...permissionForm}>
            <form onSubmit={permissionForm.handleSubmit(onAddPermissionSubmit)} className="space-y-4">
              <FormField
                control={permissionForm.control}
                name="moduleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a module" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableModules.map((module) => (
                          <SelectItem key={module} value={module}>
                            {module.charAt(0).toUpperCase() + module.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={permissionForm.control}
                name="accessGranted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Grant Access</FormLabel>
                      <FormDescription>
                        Check to grant access to this module, uncheck to deny.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddPermissionOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addPermissionMutation.isPending}>
                  {addPermissionMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Permission
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}