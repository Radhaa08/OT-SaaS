'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useRegisterMutation } from '../../apiSlice/userApiSlice';
import { useSendWelcomeEmailMutation } from '../../apiSlice/emailAuthApiSlice';
import { useUser } from './UserProvider';
import EmailVerification from './EmailVerification';
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

// Form validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  redirectTo?: string;
}

export default function RegisterForm({ redirectTo }: RegisterFormProps) {
  console.log("RegisterForm received redirectTo:", redirectTo);
  
  // For RegisterForm, always use /pricing or the provided redirectTo
  // This ensures that newly registered users always see the pricing page
  const finalRedirect = redirectTo || '/pricing';
  console.log("Register will use redirect path:", finalRedirect);
  
  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const [sendWelcomeEmail] = useSendWelcomeEmailMutation();
  const router = useRouter();
  const { setUser } = useUser();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isSubmitting = useRef(false);
  
  // Email verification states
  const [showVerification, setShowVerification] = useState(false);
  const [emailToVerify, setEmailToVerify] = useState('');
  const [formValues, setFormValues] = useState<RegisterFormValues | null>(null);
  
  // Initialize form
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
  });

  // Form submission handler
  const onSubmit = (values: RegisterFormValues) => {
    // Prevent duplicate submissions
    if (showVerification) return;
    
    setGeneralError(null);
    setApiError(null);
    setEmailToVerify(values.email);
    
    // Store form values but omit confirmPassword before sending to API
    const { confirmPassword, ...apiValues } = values;
    setFormValues(values);
    
    setShowVerification(true);
  };
  
  // This is called after successful email verification
  const handleVerificationSuccess = async () => {
    if (!formValues || isSubmitting.current) return;
    
    isSubmitting.current = true;
    setApiError(null);
    
    try {
      console.log("Registration complete, will redirect to:", finalRedirect);
      
      // Register the user (omit confirmPassword)
      const { confirmPassword, ...apiValues } = formValues;
      const userData = await register(apiValues).unwrap();
      
      // Set user in context
      setUser(userData);
      
      // Send welcome email in the background
      sendWelcomeEmail({ 
        email: formValues.email,
        name: formValues.name
      }).catch(err => {
        console.error("Failed to send welcome email:", err);
      });
      
      // After registration, always go to pricing page
      console.log("User registered, redirecting to pricing");
      window.location.href = '/pricing';
    } catch (err: any) {
      isSubmitting.current = false;
      
      // Show only the exact error message returned by the API
      // If we have a structured response, use the message field
      console.log(err);
      if (err.data?.message) {
        setApiError(err.data.message);
      } 
      // If we have a string error
      else if (typeof err.data === 'string') {
        setApiError(err.data);
      }
      // Fallback for when err.data doesn't have the expected structure
      else if (err.data.error) {
        setApiError(err.data.error);
      }
      // Last resort generic message
      else {
        setApiError('Registration failed. Please try again.');
      }
      
      setShowVerification(false);
    }
  };
  
  // Cancel verification
  const handleCancelVerification = () => {
    if (isSubmitting.current) return;
    setShowVerification(false);
  };

  return (
    <>
      {!showVerification ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your name" 
                      {...field} 
                      autoComplete="name"
                      className="w-full border border-gray-200 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
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
                    <Input 
                      placeholder="Enter your email" 
                      {...field} 
                      autoComplete="email"
                      className="w-full border border-gray-200 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
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
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password" 
                        {...field} 
                        autoComplete="new-password"
                        className="w-full border border-gray-200 rounded-md py-2 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1} // Prevent tab focus
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password" 
                        {...field} 
                        autoComplete="new-password"
                        className="w-full border border-gray-200 rounded-md py-2 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1} // Prevent tab focus
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {apiError && (
              <Alert variant="destructive" className="mt-5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}
            
            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-800 text-white py-2.5 rounded-md font-medium transition-colors mt-2"
              disabled={isRegistering || isSubmitting.current}
            >
              {isRegistering || isSubmitting.current ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </Form>
      ) : (
        <EmailVerification 
          email={emailToVerify} 
          onVerified={handleVerificationSuccess}
          onCancel={handleCancelVerification}
        />
      )}
    </>
  );
}