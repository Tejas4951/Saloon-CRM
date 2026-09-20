'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { serviceService, RegisterServiceRequest } from '@/services/serviceService';
import { useAuth } from '@/contexts/AuthContext-Loginpage';
import { Loader2, Image as ImageIcon, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const serviceFormSchema = z.object({
  serviceName: z.string().min(3, 'Service name must be at least 3 characters'),
  shopId: z.string().min(1, 'Please select a shop'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  totalPrice: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Please enter a valid price',
  }),
  durationMinutes: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Please enter a valid duration',
  }),
  category: z.string().min(2, 'Category is required'),
  genderApplicable: z.enum(['MALE', 'FEMALE', 'UNISEX']),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export function ServiceRegistrationForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shops, setShops] = useState<Record<number, string>>({});
  const [isLoadingShops, setIsLoadingShops] = useState(true);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      serviceName: '',
      shopId: '',
      description: '',
      totalPrice: '',
      durationMinutes: '',
      category: '',
      genderApplicable: 'UNISEX',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file (JPEG, PNG, etc.)',
          variant: 'destructive',
        });
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Maximum file size is 5MB',
          variant: 'destructive',
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Load shops on component mount
  useEffect(() => {
    const loadShops = async () => {
      if (!user?.token) return;
      
      try {
        const shopsData = await serviceService.getAllShops(user.token);
        setShops(shopsData);
      } catch (error) {
        console.error('Error loading shops:', error);
        toast({
          title: 'Error',
          description: 'Failed to load shops. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingShops(false);
      }
    };

    loadShops();
  }, [user?.token, toast]);

  const onSubmit = async (values: ServiceFormValues) => {
    if (!user?.token) {
      toast({
        title: 'Authentication Error',
        description: 'Please log in to continue',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: 'Photo Required',
        description: 'Please select a photo for the service',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const serviceData: RegisterServiceRequest = {
        ...values,
        shopId: parseInt(values.shopId),
        totalPrice: parseFloat(values.totalPrice),
        durationMinutes: parseInt(values.durationMinutes),
      };

      await serviceService.registerService(serviceData, selectedFile, user.token);
      
      toast({
        title: 'Success',
        description: 'Service registered successfully!',
        variant: 'default',
      });
      
      // Reset form on success
      form.reset();
    } catch (error: any) {
      console.error('Error registering service:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to register service. Please try again.',
        variant: 'destructive',
        action: (
          <Button variant="outline" size="sm">
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
          {/* Service Name */}
          <div className="space-y-2">
            <Label htmlFor="serviceName">Service Name</Label>
            <Input
              id="serviceName"
              placeholder="Enter service name"
              {...form.register('serviceName')}
              disabled={isSubmitting}
            />
            {form.formState.errors.serviceName && (
              <p className="text-sm text-red-500">
                {form.formState.errors.serviceName.message}
              </p>
            )}
          </div>

          {/* Shop Selection */}
          <div className="space-y-2">
            <Label htmlFor="shopId">Shop</Label>
            <Select
              onValueChange={(value) => form.setValue('shopId', value)}
              value={form.watch('shopId')}
              disabled={isSubmitting || isLoadingShops}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a shop" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(shops).map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.shopId && (
              <p className="text-sm text-red-500">
                {form.formState.errors.shopId.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g., Hair, Nails, Facial"
              {...form.register('category')}
              disabled={isSubmitting}
            />
            {form.formState.errors.category && (
              <p className="text-sm text-red-500">
                {form.formState.errors.category.message}
              </p>
            )}
          </div>

          {/* Gender Applicable */}
          <div className="space-y-2">
            <Label htmlFor="genderApplicable">Gender</Label>
            <Select
              onValueChange={(value: 'MALE' | 'FEMALE' | 'UNISEX') => 
                form.setValue('genderApplicable', value)
              }
              value={form.watch('genderApplicable')}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="UNISEX">Unisex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="totalPrice">Price (₹)</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <Input
                id="totalPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-7"
                {...form.register('totalPrice', {
                  setValueAs: (value) => {
                    // Remove any non-numeric characters except decimal point
                    const num = value.replace(/[^0-9.]/g, '');
                    return num === '' ? '' : parseFloat(num).toFixed(2);
                  },
                })}
                onBlur={(e) => {
                  // Format the value with 2 decimal places when input loses focus
                  const value = e.target.value;
                  if (value && !isNaN(parseFloat(value))) {
                    e.target.value = parseFloat(value).toFixed(2);
                  }
                }}
                disabled={isSubmitting}
              />
            </div>
            {form.formState.errors.totalPrice && (
              <p className="text-sm text-red-500">
                {form.formState.errors.totalPrice.message}
              </p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="durationMinutes">Duration (minutes)</Label>
            <Input
              id="durationMinutes"
              type="number"
              min="1"
              placeholder="e.g., 30, 45, 60"
              {...form.register('durationMinutes')}
              disabled={isSubmitting}
            />
            {form.formState.errors.durationMinutes && (
              <p className="text-sm text-red-500">
                {form.formState.errors.durationMinutes.message}
              </p>
            )}
          </div>

          {/* Description (full width) */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter service description"
              className="min-h-[100px]"
              {...form.register('description')}
              disabled={isSubmitting}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-4 border-t pt-4">
          <div>
            <Label htmlFor="photoFile">Service Photo</Label>
            <div className="mt-2 flex items-center gap-4">
              <div className="relative flex-1">
                <input
                  type="file"
                  id="photoFile"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {selectedFile ? 'Change Photo' : 'Upload Photo'}
                </Button>
              </div>
              {selectedFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  disabled={isSubmitting}
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove photo</span>
                </Button>
              )}
            </div>
            {previewUrl && (
              <div className="mt-4">
                <div className="relative w-32 h-32 border rounded-md overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Upload a high-quality photo of the service (max 5MB, JPG/PNG)
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
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
              'Register Service'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
