
import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { FormProvider as RHFProvider } from "react-hook-form";
import { useAuth } from '@/contexts/AuthContext-Loginpage';
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";

interface LoginFormData {
  userName: string;
  password: string;
}

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<LoginFormData>({
    defaultValues: {
      userName: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      const response = await login(data.userName, data.password);
      
      if (response && response.success && response.data) {
        // Show success toast
        toast({
          title: "Login Successful",
          description: response.message,
        });
        
        // Redirect based on role and firstLogin flag
        if (response.data.firstLogin) {
          toast({
            title: "Welcome!",
            description: "Please update your password to continue.",
            variant: "default",
          });
          navigate('/change-password');
        } else {
          // Route based on user role
          if (response.data.role === 'ADMIN') {
            navigate('/index');
          } else if (response.data.role === 'STAFF') {
            navigate('/staff-dashboard');
          } else {
            // Fallback for any other roles
            navigate('/index');
          }
        }
      } else {
        // Show error toast with backend error message
        toast({
          title: response?.message || "Login Failed",
          description: response?.error || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Show error toast for unexpected errors
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Salon Management
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RHFProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="userName"
                rules={{
                  required: "Username is required",
                  minLength: {
                    value: 3,
                    message: "Username must be at least 3 characters"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <Label>Username</Label>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Enter your username"
                          {...field}
                          disabled={isLoading}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          {isLoading && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                rules={{
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <Label>Password</Label>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          {...field}
                          disabled={isLoading}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          {isLoading && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Logging in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Login
                  </div>
                )}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <NavLink to="/forgot-password" className={({ isActive }) => 
                `text-sm text-muted-foreground hover:text-primary ${isActive ? 'text-primary' : ''}`
              }>
                Forgot Password?
              </NavLink>
            </div>
          </RHFProvider>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
