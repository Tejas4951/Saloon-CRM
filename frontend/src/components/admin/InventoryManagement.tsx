import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext-Loginpage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Trash2 } from 'lucide-react';
import { shopService } from '@/services/shopService';

// Types
interface Material {
  id: string;
  name: string;
  description?: string;
  cost?: number;
}

// Define form schemas using Zod
const materialFormSchema = z.object({
  name: z.string()
    .min(1, 'Material name is required')
    .max(100, 'Material name must be less than 100 characters'),
  cost: z.string()
    .min(1, 'Cost is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Cost must be a number greater than 0',
    }),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
});

const allocateMaterialSchema = z.object({
  materialId: z.string().min(1, 'Material is required'),
  shopId: z.string().min(1, 'Shop is required'),
  quantity: z.string()
    .min(1, 'Quantity is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Quantity must be greater than 0',
    }),
  note: z.string().max(500, 'Note must be less than 500 characters').optional(),
});

type MaterialFormValues = z.infer<typeof materialFormSchema>;
type AllocateMaterialValues = z.infer<typeof allocateMaterialSchema>;

interface InventoryManagementProps {
  activeTab: string;
}

export const InventoryManagement = ({ activeTab }: InventoryManagementProps) => {
  const { toast } = useToast();
  const { token } = useAuth();
  const [materials, setMaterials] = useState<Record<string, string>>({});
  const [materialList, setMaterialList] = useState<Material[]>([]);
  const [shops, setShops] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const materialForm = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      name: '',
      cost: '',
      description: '',
    },
  });

  const allocateForm = useForm<AllocateMaterialValues>({
    resolver: zodResolver(allocateMaterialSchema),
    defaultValues: {
      materialId: '',
      shopId: '',
      quantity: '',
      note: '',
    },
  });

  // Fetch materials when the component mounts or when the tab changes
  useEffect(() => {
    if ((activeTab === 'inventory-allocate' || activeTab === 'inventory-list') && token) {
      fetchMaterials();
      
      if (activeTab === 'inventory-allocate') {
        fetchShops();
      }
    }
  }, [activeTab, token]);

  const fetchMaterials = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8080/getmateriallist', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        const materialsData = data.data;
        setMaterials(materialsData);
        
        // Convert the materials object to an array for the table
        const materialsArray = Object.entries(materialsData).map(([id, name]) => ({
          id,
          name: String(name),
        }));
        
        setMaterialList(materialsArray);
      } else {
        throw new Error(data.error || 'Failed to fetch materials');
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch materials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShops = async () => {
    if (!token) return;
    
    try {
      const shopsData = await shopService.getAllShops(token);
      setShops(shopsData);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch shops',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: MaterialFormValues) => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8080/register/material', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: data.name,
          cost: parseFloat(data.cost),
          description: data.description || '',
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData?.error || 'Failed to create material';
        throw new Error(errorMessage);
      }

      toast({
        title: 'Success',
        description: 'Material created successfully',
      });
      
      materialForm.reset();
      
      // Refresh materials list if we're on the allocate tab
      if (activeTab === 'inventory-allocate') {
        await fetchMaterials();
      }
    } catch (error) {
      console.error('Error creating material:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create material',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMaterial = (material: Material) => {
    setSelectedMaterial(material);
    // Reset the form with the selected material's data
    materialForm.reset({
      name: material.name,
      cost: material.cost?.toString() || '0',
      description: material.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (material: Material) => {
    setSelectedMaterial(material);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteMaterial = async () => {
    // Show under pipeline message
    toast({
      title: 'Info',
      description: 'This feature is under pipeline',
      variant: 'default',
    });
    
    // Close the delete dialog
    setIsDeleteDialogOpen(false);
    setSelectedMaterial(null);
    
    // Commented out the actual API call
    /*
    if (!token || !selectedMaterial) return;
    
    try {
      setIsDeleting(true);
      const response = await fetch(`http://localhost:8080/material/${selectedMaterial.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.error || 'Failed to delete material');
      }

      toast({
        title: 'Success',
        description: 'Material deleted successfully',
      });
      
      // Refresh the materials list
      await fetchMaterials();
      setIsDeleteDialogOpen(false);
      setSelectedMaterial(null);
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete material',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
    */
  };

  const handleUpdateMaterial = async (data: MaterialFormValues) => {
    // Show under pipeline message
    toast({
      title: 'Info',
      description: 'This feature is under pipeline',
      variant: 'default',
    });
    
    // Close the edit dialog
    setIsEditDialogOpen(false);
    setSelectedMaterial(null);
    
    // Commented out the actual API call
    /*
    if (!token || !selectedMaterial) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:8080/material/${selectedMaterial.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: data.name,
          cost: parseFloat(data.cost),
          description: data.description || '',
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.error || 'Failed to update material');
      }

      toast({
        title: 'Success',
        description: 'Material updated successfully',
      });
      
      // Refresh the materials list
      await fetchMaterials();
      setIsEditDialogOpen(false);
      setSelectedMaterial(null);
    } catch (error) {
      console.error('Error updating material:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update material',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
    */
  };

  const onAllocateSubmit = async (data: AllocateMaterialValues) => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8080/material/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          materialId: parseInt(data.materialId),
          shopId: parseInt(data.shopId),
          quantity: parseFloat(data.quantity),
          note: data.note || '',
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData?.error || 'Failed to allocate material';
        throw new Error(errorMessage);
      }

      toast({
        title: 'Success',
        description: responseData.message || 'Material allocated successfully',
      });
      
      allocateForm.reset();
    } catch (error) {
      console.error('Error allocating material:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to allocate material',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render different content based on activeTab
  const renderContent = () => {
    switch (activeTab) {
      case 'inventory-create':
        return (
          <Card className="border rounded-lg overflow-hidden shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Create New Material</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={materialForm.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Material Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter material name"
                    {...materialForm.register('name')}
                    disabled={isLoading}
                  />
                  {materialForm.formState.errors.name && (
                    <p className="text-sm text-red-500">{materialForm.formState.errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost (₹)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    placeholder="Enter cost"
                    {...materialForm.register('cost')}
                    disabled={isLoading}
                  />
                  {materialForm.formState.errors.cost && (
                    <p className="text-sm text-red-500">{materialForm.formState.errors.cost.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter description"
                    {...materialForm.register('description')}
                    rows={3}
                    disabled={isLoading}
                  />
                  {materialForm.formState.errors.description && (
                    <p className="text-sm text-red-500">{materialForm.formState.errors.description.message}</p>
                  )}
                </div>
                
                <Button type="submit" className="mt-4" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Material'}
                </Button>
              </form>
            </CardContent>
          </Card>
        );
        
      case 'inventory-allocate':
        return (
          <Card className="border rounded-lg overflow-hidden shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Allocate Material</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...allocateForm}>
                <form onSubmit={allocateForm.handleSubmit(onAllocateSubmit)} className="space-y-4">
                  <FormField
                    control={allocateForm.control}
                    name="materialId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(materials).map(([id, name]) => (
                              <SelectItem key={id} value={id}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={allocateForm.control}
                    name="shopId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select shop" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(shops).map(([id, name]) => (
                              <SelectItem key={id} value={id}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={allocateForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="Enter quantity"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={allocateForm.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Note (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter any notes"
                            rows={3}
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="mt-4" disabled={isLoading}>
                    {isLoading ? 'Allocating...' : 'Allocate Material'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        );
        
      case 'inventory-list':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Material List</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : materialList.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No materials found.</p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {materialList.map((material) => (
                          <TableRow key={material.id}>
                            <TableCell className="font-medium">{material.id}</TableCell>
                            <TableCell>{material.name}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditMaterial(material)}
                                  disabled={isLoading}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(material)}
                                  disabled={isLoading}
                                  className="text-red-600 hover:text-red-700"
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

            {/* Edit Material Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Material</DialogTitle>
                </DialogHeader>
                <Form {...materialForm}>
                  <form onSubmit={materialForm.handleSubmit(handleUpdateMaterial)} className="space-y-4">
                    <FormField
                      control={materialForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter material name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={materialForm.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost (₹)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Enter cost"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={materialForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter description"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditDialogOpen(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Material</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>
                    Are you sure you want to delete <strong>{selectedMaterial?.name}</strong>? This action cannot be
                    undone.
                  </p>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsDeleteDialogOpen(false)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteMaterial}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        );
        
      case 'inventory-stock':
        return (
          <Card>
            <CardHeader>
              <CardTitle>In Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Current stock levels will be displayed here.</p>
            </CardContent>
          </Card>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-2 px-2 sm:px-4">
      {renderContent()}
    </div>
  );
};

export default InventoryManagement;
