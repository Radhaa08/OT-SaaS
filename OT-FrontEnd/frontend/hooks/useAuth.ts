import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../components/auth/UserProvider';

export function useAuth() {
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { refetch } = useUser();
  
  const handleLogin = async (email: string, password: string, redirectUrl?: string) => {
    try {
      setIsLoading(true);
      setLoginError(null);
      
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      if (redirectUrl) {
        formData.append('redirect', redirectUrl);
      }
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      // If we reach here, the login was successful
      refetch();
      
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push('/dashboard');
      }
      
      return true;
    } catch (error: any) {
      setLoginError(error.message || 'Login failed. Please check your credentials.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegister = async (name: string, email: string, password: string, redirectUrl?: string) => {
    try {
      setIsLoading(true);
      setRegisterError(null);
      
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      if (redirectUrl) {
        formData.append('redirect', redirectUrl);
      }
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      // If we reach here, the registration was successful
      refetch();
      
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push('/dashboard');
      }
      
      return true;
    } catch (error: any) {
      setRegisterError(error.message || 'Registration failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      
      // Clear the cookie on the client-side
      document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      
      // Update the user context
      refetch();
      
      // Redirect to login page
      router.push('/sign-in');
      
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    handleLogin,
    handleRegister,
    handleLogout,
    loginError,
    registerError,
    isLoading,
  };
}