'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Shield, AlertTriangle, Home } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Navbar } from '../../components/navbar';
import Link from 'next/link';

export default function UnauthorizedPage() {
  const router = useRouter();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full px-4 py-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Shield className="h-20 w-20 text-gray-200" />
              <AlertTriangle className="h-8 w-8 text-red-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized Access</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. This area is restricted to administrators only.
          </p>
          
          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={() => router.back()}
            >
              Go Back
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              asChild
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Return to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
