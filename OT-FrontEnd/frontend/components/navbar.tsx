'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import React from 'react';
import { usePathname } from "next/navigation";
import { Code, Home, LifeBuoy, LogOut, Menu, Search, Shield, User, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useUser } from './auth/UserProvider';
import { LogoutButton } from './auth/LogoutButton';

function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { user, isLoading } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Routes for authenticated users
  const authenticatedRoutes = [
    {
      name: "Home",
      path: "/",
      icon: <Home className="h-4 w-4 mr-2" />,
      showForAdmin: false,
    },
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <Code className="h-4 w-4 mr-2" />,
      showForAdmin: false, 
    },
    {
      name: "Jobs",
      path: "/jobs",
      icon: <Search className="h-4 w-4 mr-2" />,
      showForAdmin: false, 
    },
    {
      name: "Job Seekers",
      path: "/job-seekers",
      icon: <Users className="h-4 w-4 mr-2" />,
      showForAdmin: false,
    },
    {
      name: "Support",
      path: "/support",
      icon: <LifeBuoy className="h-4 w-4 mr-2" />,
      showForAdmin: false,
    },
  ];

  // Admin-only route
  const adminRoute = {
    name: "Admin",
    path: "/admin",
    icon: <Shield className="h-4 w-4 mr-2" />,
    showForAdmin: true, // Always show for admin users
  };

  // Routes for unauthenticated users
  const unauthenticatedRoutes = [
    {
      name: "Pricing",
      path: "/pricing",
      icon: null,
      showForAdmin: false,
    }
  ];

  // Choose routes based on authentication state
  let routes = user ? authenticatedRoutes : unauthenticatedRoutes;
  
  // Filter routes based on user role
  if (user) {
    if (user.role === "admin") {
      // For admin users, only show routes marked as showForAdmin
      routes = routes.filter(route => route.showForAdmin);
      // Add admin route for admin users
      routes = [...routes, adminRoute];
    }
    // For non-admin users, show all authenticated routes (no filtering needed)
  }

  const { theme } = useTheme();

  return (
    <div className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "app-header" // Add app-header class for dark mode styling
    )}>
      <header>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center font-bold text-xl">
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
              <span className="ml-3 text-xl font-semibold tracking-tight">OpenTheory</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 mx-6 flex-1">
              {routes.map((route) => (
                <Link
                  key={route.path}
                  href={route.path}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary flex items-center",
                    pathname === route.path ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {route.icon}
                  {route.name}
                </Link>
              ))}
            </nav>

            {/* Right Side Elements - always aligned to the right */}
            <div className="flex items-center">
              {/* Theme Toggle and Auth Buttons (Desktop Only) */}
              <div className="hidden md:flex items-center space-x-4">
                <ThemeToggle />

                {isLoading ? (
                  <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
                ) : user ? (
                  <>
                    <Button variant="ghost" asChild>
                      <Link href={user.role === 'admin' ? '/admin' : '/profile'}>
                        <User className="mr-2 h-4 w-4" />
                        {user.name || 'My Account'}
                      </Link>
                    </Button>
                    <LogoutButton className="inline-flex items-center justify-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </LogoutButton>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" asChild>
                      <Link href="/sign-in">Sign In</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/sign-up">Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile Menu Toggle - Only visible on mobile */}
              <Button 
                variant="ghost" 
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Simple Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background">
            <div className="container py-4">
              <nav className="flex flex-col gap-4">
                {routes.map((route) => (
                  <Link
                    key={route.path}
                    href={route.path}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary flex items-center py-2",
                      pathname === route.path ? "text-primary" : "text-muted-foreground",
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {route.icon}
                    {route.name}
                  </Link>
                ))}
                
                <div className="h-px w-full bg-border/60 my-2" />
                
                {isLoading ? (
                  <div className="h-9 w-full bg-gray-200 rounded animate-pulse"></div>
                ) : user ? (
                  <>
                    <Link
                      href={user.role === 'admin' ? '/admin' : '/profile'}
                      className="text-sm font-medium flex items-center py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      {user.name || 'My Account'}
                    </Link>
                    <div onClick={() => setMobileMenuOpen(false)}>
                      <LogoutButton className="text-sm font-medium text-destructive flex w-full items-center py-2">
                        <LogOut className="h-4 w-4 mr-2" />
                        Log out
                      </LogoutButton>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      href="/sign-in"
                      className="text-sm font-medium transition-colors hover:text-primary flex items-center py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/sign-up"
                      className="text-sm font-medium transition-colors hover:text-primary flex items-center py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                    <Link
                      href="/pricing"
                      className="text-sm font-medium transition-colors hover:text-primary flex items-center py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Pricing
                    </Link>
                  </>
                )}
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/60">
                  <span className="text-sm font-medium">Theme</span>
                  <ThemeToggle />
                </div>
              </nav>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default Navbar;