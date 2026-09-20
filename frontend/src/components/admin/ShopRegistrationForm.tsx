import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { shopService } from '@/services/shopService';
import { useAuth } from '@/contexts/AuthContext-Loginpage';
import { Loader2 } from 'lucide-react';

const shopFormSchema = z.object({
  shopName: z.string().min(3, 'Shop name must be at least 3 characters'),
  address: z.string().min(5, 'Address is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email is required'),
  ownerName: z.string().min(2, 'Owner name is required'),
});

type ShopFormValues = z.infer<typeof shopFormSchema>;

interface ShopRegistrationFormProps {
  onShopRegistered?: () => Promise<void>;
}

export function ShopRegistrationForm({ onShopRegistered }: ShopRegistrationFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ShopFormValues>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: {
      shopName: '',
      address: '',
      phoneNumber: '',
      email: '',
      ownerName: '',
    },
  });

  const onSubmit = async (data: ShopFormValues) => {
    if (!user?.token) {
      toast({
        title: 'Error',
        description: 'You must be logged in to register a shop.',
        variant: 'destructive',
      });
      return;
    }

    console.log('Form submitted with data:', data);
    setIsSubmitting(true);
    try {
      console.log('Calling shopService.registerShop...');
      const result = await shopService.registerShop(data, user.token);
      console.log('shopService.registerShop result:', result);
      
      toast({
        title: 'Success',
        description: 'Shop registered successfully!',
        variant: 'default',
        duration: 1000, // Show for 1 second
      });
      
      // Reset form on success
      form.reset();
      
      // Notify parent component to refresh shops list
      if (onShopRegistered) {
        console.log('Calling onShopRegistered callback...');
        await onShopRegistered();
        console.log('onShopRegistered callback completed');
      }
    } catch (error: any) {
      console.error('Error registering shop:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to register shop. Please try again.',
        variant: 'destructive',
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => document.querySelector('[role="alert"]')?.remove()}
            className="ml-2"
          >
            OK
          </Button>
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shop Name */}
          <div className="space-y-2">
            <Label htmlFor="shopName">Shop Name</Label>
            <Input
              id="shopName"
              placeholder="Enter shop name"
              {...form.register('shopName')}
              disabled={isSubmitting}
            />
            {form.formState.errors.shopName && (
              <p className="text-sm text-red-500">
                {form.formState.errors.shopName.message}
              </p>
            )}
          </div>

          {/* Owner Name */}
          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner Name</Label>
            <Input
              id="ownerName"
              placeholder="Enter owner's name"
              {...form.register('ownerName')}
              disabled={isSubmitting}
            />
            {form.formState.errors.ownerName && (
              <p className="text-sm text-red-500">
                {form.formState.errors.ownerName.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              {...form.register('email')}
              disabled={isSubmitting}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              placeholder="Enter contact number"
              {...form.register('phoneNumber')}
              disabled={isSubmitting}
            />
            {form.formState.errors.phoneNumber && (
              <p className="text-sm text-red-500">
                {form.formState.errors.phoneNumber.message}
              </p>
            )}
          </div>

          {/* Address (full width) */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="Enter shop address"
              {...form.register('address')}
              disabled={isSubmitting}
            />
            {form.formState.errors.address && (
              <p className="text-sm text-red-500">
                {form.formState.errors.address.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSubmitting}
            className="mr-2"
          >
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              'Register Shop'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
