import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext-Loginpage';
import { useMediaQuery } from '../../hooks/use-media-query';
import { cn } from '@/lib/utils';

// Define form schema using Zod
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

type MaterialFormValues = z.infer<typeof materialFormSchema>;

// Default form values
const defaultValues: Partial<MaterialFormValues> = {
  name: '',
  cost: '',
  description: '',
};

const InventoryManagementSuper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activeTab, setActiveTab] = useState('create-material');

  // Update tab based on URL hash
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['create-material', 'allocate-material', 'material-list', 'in-stock'].includes(hash)) {
      setActiveTab(hash);
    } else {
      // Default to create-material if no valid hash
      navigate('#create-material', { replace: true });
      setActiveTab('create-material');
    }
  }, [location.hash, navigate]);

  return (
    <div className="container mx-auto py-2 px-2 sm:px-4">
      <h1 className="text-2xl font-bold mb-4 px-2 sm:px-0">Inventory Management</h1>
      
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => {
          setActiveTab(value);
          navigate(`#${value}`, { replace: true });
        }}
        className="space-y-4"
      >
        {isMobile ? (
          <div className="flex overflow-x-auto pb-2 space-x-1 px-2">
            <Button 
              variant={activeTab === 'create-material' ? 'default' : 'outline'}
              className="whitespace-nowrap text-xs px-2 py-1 h-8"
              onClick={() => setActiveTab('create-material')}
            >
              Create
            </Button>
            <Button 
              variant={activeTab === 'allocate-material' ? 'default' : 'outline'}
              className="whitespace-nowrap text-xs px-2 py-1 h-8"
              onClick={() => setActiveTab('allocate-material')}
            >
              Allocate
            </Button>
            <Button 
              variant={activeTab === 'material-list' ? 'default' : 'outline'}
              className="whitespace-nowrap text-xs px-2 py-1 h-8"
              onClick={() => setActiveTab('material-list')}
            >
              List
            </Button>
            <Button 
              variant={activeTab === 'in-stock' ? 'default' : 'outline'}
              className="whitespace-nowrap text-xs px-2 py-1 h-8"
              onClick={() => setActiveTab('in-stock')}
            >
              Stock
            </Button>
          </div>
        ) : (
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 h-auto rounded-lg">
            <TabsTrigger 
              value="create-material"
              className="py-2 px-1 text-sm font-medium rounded-md transition-colors"
            >
              Create Material
            </TabsTrigger>
            <TabsTrigger 
              value="allocate-material"
              className="py-2 px-1 text-sm font-medium rounded-md transition-colors"
            >
              Allocate Material
            </TabsTrigger>
            <TabsTrigger 
              value="material-list"
              className="py-2 px-1 text-sm font-medium rounded-md transition-colors"
            >
              Material List
            </TabsTrigger>
            <TabsTrigger 
              value="in-stock"
              className="py-2 px-1 text-sm font-medium rounded-md transition-colors"
            >
              In Stock
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="create-material" className="mt-4">
          <Card className={cn(
            'border rounded-lg overflow-hidden',
            isMobile ? 'border-0 shadow-none' : 'shadow-sm'
          )}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Create New Material</CardTitle>
            </CardHeader>
            <CardContent>
              <MaterialForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocate-material">
          <Card>
            <CardHeader>
              <CardTitle>Allocate Material</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Allocate Material Form will go here */}
              <p className="text-muted-foreground">Material allocation form will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="material-list">
          <Card>
            <CardHeader>
              <CardTitle>Material List</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Material List Table will go here */}
              <p className="text-muted-foreground">List of all materials will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in-stock">
          <Card>
            <CardHeader>
              <CardTitle>In Stock</CardTitle>
            </CardHeader>
            <CardContent>
              {/* In Stock Inventory will go here */}
              <p className="text-muted-foreground">Current stock levels will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Material Form Component
const MaterialForm = () => {
  const { toast } = useToast();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues,
  });

  const onSubmit = async (data: MaterialFormValues) => {
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
          description: data.description || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Material created successfully',
          variant: 'default',
        });
        form.reset();
      } else {
        throw new Error(result.error || result.message || 'Failed to create material');
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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Material Name *</Label>
        <Input
          id="name"
          placeholder="Enter material name"
          {...form.register('name')}
          disabled={isLoading}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cost">Cost *</Label>
        <Input
          id="cost"
          type="number"
          step="0.01"
          placeholder="Enter cost"
          {...form.register('cost')}
          disabled={isLoading}
        />
        {form.formState.errors.cost && (
          <p className="text-sm text-red-500">{form.formState.errors.cost.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter description (optional)"
          {...form.register('description')}
          disabled={isLoading}
          className="min-h-[100px]"
        />
        {form.formState.errors.description && (
          <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
        )}
      </div>

      <CardFooter className="px-0 py-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Material'}
        </Button>
      </CardFooter>
    </form>
  );
};

export default InventoryManagementSuper;
