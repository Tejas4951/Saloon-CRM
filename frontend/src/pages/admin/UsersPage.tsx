import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext-Loginpage';
import { toast } from '@/components/ui/use-toast';
import { userService, type UserInfoDto } from '@/services/userService';
import { cn } from '@/lib/utils';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShopSelector } from '@/components/admin';
import { Users, Users2, UserCog, Loader2, PenSquare, Trash2, AlertCircle, Check, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md flex items-center text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Something went wrong. Please try again later.</span>
        </div>
      );
    }
    return this.props.children;
  }
}

interface UsersPageProps {
  selectedShop: string;
  onShopChange: (shopId: string) => void;
  shops: Record<string, string>;
  isLoading: boolean;
}

type UserRole = 'all' | 'staff' | 'admin';

interface UsersState {
  staff: UserInfoDto[];
  admin: UserInfoDto[];
  loading: boolean;
  error: string | null;
}

function UsersPageContent({ 
  selectedShop, 
  onShopChange, 
  shops, 
  isLoading: isShopsLoading 
}: UsersPageProps) {
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [, setDeleteError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    role: string;
    shopName: string;
    loading: boolean;
    error: string | null;
  }>({
    role: '',
    shopName: '',
    loading: false,
    error: null
  });
  const [selectedRole, setSelectedRole] = useState<UserRole>('all');
  const [users, setUsers] = useState<UsersState>({
    staff: [],
    admin: [],
    loading: false,
    error: null
  });
  
  const { token } = useAuth();
  
  // Role filter buttons
  const roleFilters = [
    { 
      id: 'all' as const, 
      label: 'All', 
      icon: <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" /> 
    },
    { 
      id: 'staff' as const, 
      label: 'Staff', 
      icon: <Users2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" /> 
    },
    { 
      id: 'admin' as const, 
      label: 'Admin', 
      icon: <UserCog className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" /> 
    },
  ] as const;
  
  if (!token) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-md">
        Please log in to view this page.
      </div>
    );
  }

  // Handle edit user
  const handleEditUser = async (userId: number) => {
    if (!token) return;
    
    try {
      setEditingUser(userId);
      setEditForm(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await userService.getUserById(userId, token);
      
      if (response.success && response.data) {
        const userData = response.data;
        setEditForm(prev => ({
          ...prev,
          role: userData.role || '',
          shopName: userData.shopName || '',
          loading: false
        }));
      } else {
        throw new Error(response.error || 'Failed to fetch user details');
      }
    } catch (error: any) {
      console.error('Error fetching user details:', error);
      const errorMessage = error.error || error.message || 'Failed to fetch user details';
      setEditForm(prev => ({ ...prev, error: errorMessage, loading: false }));
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({
      role: '',
      shopName: '',
      loading: false,
      error: null
    });
  };

  // Handle save changes
  const handleSaveChanges = async (userId: number) => {
    if (!token) return;
    
    try {
      setEditForm(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await userService.updateUserRoleAndShop(
        {
          userId,
          role: editForm.role,
          shopName: editForm.shopName
        },
        token
      );
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'User updated successfully',
          variant: 'default',
        });
        
        // Refresh the users list
        fetchUsers();
        handleCancelEdit();
      } else {
        throw new Error(response.error || 'Failed to update user');
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      const errorMessage = error.error || error.message || 'Failed to update user';
      setEditForm(prev => ({ ...prev, error: errorMessage, loading: false }));
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Fetch users when shop or role changes
  const fetchUsers = useCallback(async () => {
    if (!selectedShop || !token) {
      console.log('No shop selected or token missing');
      return;
    }
    
    console.log('Fetching users for shop:', selectedShop, 'role:', selectedRole);
    setUsers(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Only fetch the roles we need
      const requests = [];
      
      if (selectedRole === 'all' || selectedRole === 'staff') {
        requests.push(userService.getUsersByRole(selectedShop, 'STAFF', token));
      } else {
        requests.push(Promise.resolve({ success: true, data: [], statusCode: 200, message: '', timestamp: new Date().toISOString(), error: null }));
      }
      
      if (selectedRole === 'all' || selectedRole === 'admin') {
        requests.push(userService.getUsersByRole(selectedShop, 'ADMIN', token));
      } else {
        requests.push(Promise.resolve({ success: true, data: [], statusCode: 200, message: '', timestamp: new Date().toISOString(), error: null }));
      }
      
      const [staffResponse, adminResponse] = await Promise.all(requests);
      
      setUsers({
        staff: staffResponse.data || [],
        admin: adminResponse.data || [],
        loading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      const errorMessage = error.message || 'Failed to load users';
      setUsers({
        staff: [],
        admin: [],
        loading: false,
        error: errorMessage
      });
      
      // Only show toast for non-validation errors
      if (!error.message?.includes('Invalid shop ID')) {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  }, [selectedShop, selectedRole, token]);
  
  // Handle user deletion
  const handleDeleteUser = async (userId: number, _role: 'STAFF' | 'ADMIN') => {
    if (!token) return;
    
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    setDeleteLoading(userId);
    setDeleteError(null);
    
    try {
      const response = await userService.deleteUser(userId, token);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: response.message || 'User deleted successfully',
          variant: 'default',
        });
        
        // Refresh the users list
        fetchUsers();
      } else {
        throw new Error(response.error || 'Failed to delete user');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      const errorMessage = error.error || error.message || 'Failed to delete user';
      setDeleteError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            View and manage all user accounts.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <ShopSelector 
            selectedShop={selectedShop}
            onShopChange={onShopChange}
            shops={shops}
            isLoading={isShopsLoading}
          />
        </div>
      </div>
      
      {/* Role Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        
        <div className="flex-1 overflow-x-auto">
          <div className="flex flex-nowrap gap-1 sm:gap-2 pb-2">
            {roleFilters.map(({ id, label, icon }) => (
              <Button
                key={id}
                variant={selectedRole === id ? 'default' : 'outline'}
                size="sm"
                disabled={users.loading} // Fix isLoading reference
                className={cn(
                  'flex items-center whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3',
                  selectedRole !== id && 'bg-background hover:bg-accent hover:text-accent-foreground',
                  'flex-shrink-0' // Prevent buttons from shrinking
                )}
                onClick={() => handleRoleChange(id)}
              >
                {icon}
                <span className="truncate">{label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
      {users.error && (
        <div className="text-red-500 text-sm p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
          {users.error}
        </div>
      )}

      {!selectedShop ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              <p>Please select a shop to view users</p>
            </div>
          </CardContent>
        </Card>
      ) : users.loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Staff Table */}
          {(selectedRole === 'all' || selectedRole === 'staff') && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Staff Members</CardTitle>
                    <CardDescription>
                      {users.staff.length} {users.staff.length === 1 ? 'member' : 'members'} found
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Shop</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.staff.length > 0 ? (
                      users.staff.map((user, index) => (
                        <TableRow key={`staff-${user.userId}`}>
                          <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-medium">{user.fullName}</TableCell>
                          <TableCell>
                            {editingUser === user.userId ? (
                              <Select
                                value={editForm.role}
                                onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}
                              >
                                <SelectTrigger className="w-[120px] h-8">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ADMIN">Admin</SelectItem>
                                  <SelectItem value="STAFF">Staff</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                                {user.role}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingUser === user.userId ? (
                              <Select
                                value={editForm.shopName}
                                onValueChange={(value) => setEditForm(prev => ({ ...prev, shopName: value }))}
                              >
                                <SelectTrigger className="w-[180px] h-8">
                                  <SelectValue placeholder="Select shop" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(shops).map(([id, name]) => (
                                    <SelectItem key={id} value={name}>
                                      {name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span>{user.shopName || 'N/A'}</span>
                            )}
                          </TableCell>
                          <TableCell>{user.userId}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {editingUser === user.userId ? (
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
                                    onClick={() => handleSaveChanges(user.userId)}
                                    disabled={editForm.loading}
                                  >
                                    {editForm.loading ? (
                                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5 mr-1.5" />
                                    )}
                                    <span>Save</span>
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8"
                                    onClick={handleCancelEdit}
                                    disabled={editForm.loading}
                                  >
                                    <X className="h-3.5 w-3.5 mr-1.5" />
                                    <span>Cancel</span>
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8"
                                  onClick={() => handleEditUser(user.userId)}
                                  disabled={!!editingUser}
                                >
                                  <PenSquare className="h-3.5 w-3.5 mr-1.5" />
                                  <span>Edit</span>
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                                onClick={() => handleDeleteUser(user.userId, 'STAFF')}
                                disabled={deleteLoading === user.userId}
                              >
                                {deleteLoading === user.userId ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                    <span>Deleting...</span>
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                    <span>Delete</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No staff members found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Admin Table */}
          {(selectedRole === 'all' || selectedRole === 'admin') && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Administrators</CardTitle>
                    <CardDescription>
                      {users.admin.length} {users.admin.length === 1 ? 'admin' : 'admins'} found
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Shop</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.admin.length > 0 ? (
                      users.admin.map((user, index) => (
                        <TableRow key={`admin-${user.userId}`}>
                          <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-medium">{user.fullName}</TableCell>
                          <TableCell>
                            {editingUser === user.userId ? (
                              <Select
                                value={editForm.role}
                                onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}
                              >
                                <SelectTrigger className="w-[120px] h-8">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ADMIN">Admin</SelectItem>
                                  <SelectItem value="STAFF">Staff</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">
                                {user.role}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingUser === user.userId ? (
                              <Select
                                value={editForm.shopName}
                                onValueChange={(value) => setEditForm(prev => ({ ...prev, shopName: value }))}
                              >
                                <SelectTrigger className="w-[180px] h-8">
                                  <SelectValue placeholder="Select shop" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(shops).map(([id, name]) => (
                                    <SelectItem key={id} value={name}>
                                      {name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span>{user.shopName || 'N/A'}</span>
                            )}
                          </TableCell>
                          <TableCell>{user.userId}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {editingUser === user.userId ? (
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
                                    onClick={() => handleSaveChanges(user.userId)}
                                    disabled={editForm.loading}
                                  >
                                    {editForm.loading ? (
                                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5 mr-1.5" />
                                    )}
                                    <span>Save</span>
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8"
                                    onClick={handleCancelEdit}
                                    disabled={editForm.loading}
                                  >
                                    <X className="h-3.5 w-3.5 mr-1.5" />
                                    <span>Cancel</span>
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8"
                                  onClick={() => handleEditUser(user.userId)}
                                  disabled={!!editingUser}
                                >
                                  <PenSquare className="h-3.5 w-3.5 mr-1.5" />
                                  <span>Edit</span>
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                                onClick={() => handleDeleteUser(user.userId, 'STAFF')}
                                disabled={deleteLoading === user.userId}
                              >
                                {deleteLoading === user.userId ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                    <span>Deleting...</span>
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                    <span>Delete</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No administrators found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// Export the component wrapped with ErrorBoundary
export function UsersPage(props: UsersPageProps) {
  return (
    <ErrorBoundary>
      <UsersPageContent {...props} />
    </ErrorBoundary>
  );
}
