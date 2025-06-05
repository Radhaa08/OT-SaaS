'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import LoginForm from '../../components/auth/LoginForm';
import RegisterForm from '../../components/auth/RegisterForm';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  
  // For sign-in, use the redirect query param or default to dashboard
  // For sign-up, always redirect to pricing page
  const redirectPath = mode === 'signin' 
    ? (searchParams.get('redirect') || '/dashboard')
    : '/pricing';
  
  console.log(`Login component (${mode}) rendering with redirect:`, redirectPath);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-100 py-5 px-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center">
          <div className="bg-black w-10 h-10 flex items-center justify-center rounded-full">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white" />
            </svg>
          </div>
          <span className="ml-3 text-xl font-semibold tracking-tight">
            <Link href="/" className="hover:text-black transition-colors">
              OpenTheory
            </Link>
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 bg-gray-50">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border border-gray-100">
          <h1 className="text-2xl font-medium text-center mb-6 text-gray-800">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>

          {mode === 'signin' ? (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 flex items-start mb-6">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 text-center">
                    Demo credentials: test@example.com / password123
                  </p>
                </div>
              </div>
              <LoginForm redirectTo={redirectPath} />
            </>
          ) : (
            <RegisterForm redirectTo={redirectPath} />
          )}

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="px-4 text-gray-400 text-sm">
              {mode === 'signin' ? 'New to OpenTheory?' : 'Already have an account?'}
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <div>
            <Link
              href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${
                redirectPath ? `?redirect=${redirectPath}` : ''
              }`}
              className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
            >
              {mode === 'signin' ? 'Create an account' : 'Sign in to existing account'}
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-gray-100 bg-white">
        <div className="flex flex-wrap justify-center gap-x-8 text-sm text-gray-500">
          <Link href="#" className="hover:text-black transition-colors">
            Privacy Policy
          </Link>
          <Link href="#" className="hover:text-black transition-colors">
            Terms of Service
          </Link>
          <Link href="/support" className="hover:text-black transition-colors">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default Login;