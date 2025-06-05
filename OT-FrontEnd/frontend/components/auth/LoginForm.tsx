'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2, AlertCircle, Eye, EyeOff, Info } from 'lucide-react';
import { useUser } from './UserProvider';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '../ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription } from '../ui/alert';
import { useLoginMutation } from '../../apiSlice/userApiSlice';

// Form validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  redirectTo?: string;
}

// Example credentials - separated from form state
const EXAMPLE_CREDENTIALS = {
  email: 'test@example.com',
  password: 'password123',
};

export default function LoginForm({ redirectTo }: LoginFormProps) {
  console.log("LoginForm received redirectTo:", redirectTo);
  
  // Use the redirectTo prop as is, don't override it
  const [login, { isLoading }] = useLoginMutation();
  const router = useRouter();
  const { setUser } = useUser();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const isSubmitting = useRef(false);
  
  // Initialize form with empty values
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    // Prevent multiple submissions
    if (isLoading || isSubmitting.current) return;
    
    isSubmitting.current = true;
    setGeneralError(null);
    
    try {
      console.log("Logging in, will redirect to:", redirectTo);
      // Log in and get user data
      const userData = await login(values).unwrap();
      
      // Set user in context
      setUser(userData);
      
      // Use a small timeout to ensure user context is updated before navigation
      setTimeout(() => {
        console.log("User logged in, redirecting to:", redirectTo);
        
        // Use the provided redirectTo prop - should be dashboard unless specified
        window.location.href = redirectTo || '/dashboard';
      }, 100);
    } catch (err: any) {
      isSubmitting.current = false;
      setGeneralError(err.data?.message || 'Invalid email or password');
    }
  };

  return (
    <div className="space-y-6">   
    
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Email Address</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="name@example.com" 
                    {...field} 
                    autoComplete="email"
                    className="w-full border border-gray-200 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </FormControl>
                <FormMessage className="text-xs text-red-600" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••" 
                      {...field} 
                      autoComplete="current-password"
                      className="w-full border border-gray-200 rounded-md py-2 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1} // Prevent tab focus
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-red-600" />
              </FormItem>
            )}
          />
          
          {generalError && (
            <Alert variant="destructive" className="mt-4 bg-red-50 border border-red-100 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}
          
          <Button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white py-2.5 rounded-md font-medium transition-colors mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}