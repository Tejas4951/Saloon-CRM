import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, User, UserPlus, Mail, Phone, Loader2, Check, X, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { userService } from '@/services/userService';
import { useAuth } from '@/contexts/AuthContext-Loginpage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface UserRegistrationData {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
  shopId?: string;
  profileImage?: FileList;
}

interface UserService {
  getAllUsernames: (token: string) => Promise<string[]>;
  getAllShops: (token: string) => Promise<Record<string, string>>;
  isUsernameAvailable: (username: string, existingUsernames: string[]) => Promise<boolean>;
  registerUser: (formData: FormData, token: string) => Promise<{ message: string }>;
}

type FormData = {
  userName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: Date;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
  shopId?: string;
  profileImage?: FileList;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const formSchema = z.object({
  userName: z.string().min(3, 'Username must be at least 3 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  dateOfBirth: z.date({ required_error: 'A date of birth is required.' }),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'STAFF']),
  shopId: z.string().optional(),
  profileImage: z
    .instanceof(FileList)
    .refine(file => file.length === 0 || file[0]?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      file => file.length === 0 || ACCEPTED_IMAGE_TYPES.includes(file[0]?.type),
      'Only .jpg, .jpeg, .png and .webp formats are supported.'
    )
    .optional(),
}).refine(
  (data) => {
    if (['ADMIN', 'STAFF'].includes(data.role)) {
      return !!data.shopId;
    }
    return true;
  },
  {
    message: 'Shop is required for ADMIN and STAFF roles',
    path: ['shopId'],
  }
);

export function UserRegistrationForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [existingUsernames, setExistingUsernames] = useState<string[]>([]);
  const [shops, setShops] = useState<Record<string, string>>({});
  const [selectedRole, setSelectedRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'STAFF'>('STAFF');
  
  // Get the auth token safely
  const authToken = user?.token || '';

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userName: '',
      fullName: '',
      email: '',
      phoneNumber: '',
      dateOfBirth: new Date(),
      role: 'STAFF',
      shopId: undefined,
      profileImage: undefined,
    },
  });
  
  // Watch for profile image changes to update preview
  const watchProfileImage = form.watch('profileImage');
  
  useEffect(() => {
    const files = watchProfileImage as FileList | undefined;
    if (files?.length && files.length > 0) {
      const file = files[0];
      if (file instanceof File) {
        const reader = new FileReader();
        
        reader.onloadend = () => {
          setPreviewImage(reader.result as string);
        };
        
        reader.readAsDataURL(file);
        return;
      }
    }
    setPreviewImage(null);
  }, [watchProfileImage]);
  
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const { watch } = form;
  const watchRole = watch('role');
  const userName = watch('userName');

  useEffect(() => {
    if (watchRole) setSelectedRole(watchRole);
  }, [watchRole]);

  useEffect(() => {
    const fetchData = async () => {
      if (!authToken) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in to continue',
          variant: 'destructive',
        });
        return;
      }
      
      try {
        const [usernames, shopData] = await Promise.all([
          userService.getAllUsernames(authToken),
          userService.getAllShops(authToken)
        ]);
        setExistingUsernames(usernames);
        setShops(shopData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load required data. Please try again.',
          variant: 'destructive',
        });
      }
    };
    
    fetchData();
  }, [authToken, toast]);

  useEffect(() => {
    const checkUsername = async () => {
      if (userName.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      setIsCheckingUsername(true);
      try {
        const isAvailable = await userService.isUsernameAvailable(userName, existingUsernames);
        setUsernameAvailable(isAvailable);
      } catch (error) {
        console.error('Error checking username:', error);
      } finally {
        setIsCheckingUsername(false);
      }
    };
    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [userName, existingUsernames]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!usernameAvailable) {
      toast({
        title: 'Error',
        description: 'Username is not available',
        variant: 'destructive',
      });
      return;
    }
    
    if (!authToken) {
      toast({
        title: 'Authentication Error',
        description: 'Please log in to continue',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      // Create user data object with the correct field names
      const userData = {
        userName: values.userName,
        email: values.email,
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
        dateOfBirth: format(values.dateOfBirth, 'yyyy-MM-dd'),
        role: values.role,
        shopId: values.shopId ? parseInt(values.shopId) : undefined
      };
      
      // Add the user data as a JSON string in the 'data' field
      const userDataJson = JSON.stringify(userData);
      const userDataBlob = new Blob([userDataJson], { type: 'application/json' });
      formData.append('data', userDataBlob);
      
      // Add the profile image if it exists
      if (values.profileImage && values.profileImage.length > 0) {
        const file = values.profileImage[0];
        formData.append('photoFile', file);
      }
      
      console.log('Request data:', {
        userData,
        hasProfileImage: !!(values.profileImage && values.profileImage.length > 0)
      });
      
      const response = await userService.registerUser(formData, authToken);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: response.message || 'User registered successfully!',
          variant: 'default',
          duration: 3000,
        });
        
        // Get the current shopId before reset
        const currentShopId = form.getValues('shopId');
        
        // Reset form after successful submission but keep shop selection
        form.reset({
          userName: '',
          fullName: '',
          email: '',
          phoneNumber: '',
          dateOfBirth: new Date(),
          role: 'STAFF',
          shopId: currentShopId, // Keep the same shop selected
          profileImage: undefined,
        });
        setPreviewImage(null);
        setUsernameAvailable(null);
      } else {
        throw new Error(response.message || 'Failed to register user');
      }
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Log detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
      }
      
      // Extract error message from the response
      const errorResponse = error.response?.data;
      let errorMessage = 'Failed to register user. Please try again.';
      
      if (errorResponse) {
        // Prefer the 'error' field if it exists, otherwise use 'message'
        errorMessage = errorResponse.error || errorResponse.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Registration Failed',
        description: errorMessage,
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
    <div className="w-full px-0 sm:px-4 py-4 sm:py-6">
      <div className="mb-4 sm:mb-6 px-4 sm:px-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Register new staff or admin users</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Register New User</CardTitle>
          <CardDescription>Fill in the details to create a new user account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Image Upload */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="profileImage"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem className="flex flex-col items-center">
                        <FormLabel className="text-sm font-medium mb-2">Profile Image (Optional)</FormLabel>
                        <FormControl>
                          <div className="flex flex-col items-center">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={(e) => {
                                // Store ref for file input
                                if (e) {
                                  (fileInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                                }
                                // Forward the ref to react-hook-form
                                field.ref && field.ref(e);
                              }}
                              onChange={(e) => {
                                onChange(e.target.files);
                              }}
                              disabled={isSubmitting}
                            />
                            <div 
                              className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer flex items-center justify-center overflow-hidden group"
                              onClick={handleImageClick}
                            >
                              {previewImage ? (
                                <img 
                                  src={previewImage} 
                                  alt="Profile preview" 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex flex-col items-center text-gray-400">
                                  <Upload className="h-6 w-6 mb-1" />
                                  <span className="text-xs text-center">Upload</span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                                <Upload className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="mt-2 text-xs text-muted-foreground"
                              onClick={handleImageClick}
                              disabled={isSubmitting}
                            >
                              {previewImage ? 'Change Image' : 'Upload Image'}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-center" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Username */}
                <FormField
                  control={form.control}
                  name="userName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                          <Input
                            placeholder="Enter username"
                            className="pl-10"
                            {...field}
                            disabled={isSubmitting}
                          />
                          {isCheckingUsername && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            </div>
                          )}
                          {!isCheckingUsername && usernameAvailable === true && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                              <Check className="h-4 w-4 text-green-500" />
                            </div>
                          )}
                          {!isCheckingUsername && usernameAvailable === false && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                              <X className="h-4 w-4 text-red-500" />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Full Name Field */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input placeholder="Enter full name" {...field} />
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="email" placeholder="Enter email" {...field} />
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone Number Field */}
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input placeholder="Enter phone number" {...field} />
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date of Birth Field */}
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Birth</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Role Field */}
                <FormField
                  control={form.control}
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
                          <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="STAFF">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Shop Selection (Conditional) */}
                {selectedRole !== 'SUPER_ADMIN' && (
                  <FormField
                    control={form.control}
                    name="shopId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a shop" />
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
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={isSubmitting}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !usernameAvailable}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
