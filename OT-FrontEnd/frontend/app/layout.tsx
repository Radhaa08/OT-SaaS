import { Inter } from 'next/font/google';

import './globals.css';
import type { Metadata } from 'next';
import React from 'react';
import { Providers } from './providers';
import { ToastProvider } from '../components/ui/use-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'OpenTheory - Find your next opportunity',
  description: 'Connect with employers and find your perfect job',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body>
        <Providers>
          <ToastProvider>
            {children}
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}