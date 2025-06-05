'use client';

import { Button, ButtonProps } from "../ui/button";
import { useLogoutMutation } from "../../apiSlice/userApiSlice";
import { useRouter } from "next/navigation";
import { useUser } from "./UserProvider";
import React from "react";
import { Loader2 } from "lucide-react";

interface LogoutButtonProps extends ButtonProps {
  redirectTo?: string;
}

export function LogoutButton({ 
  children, 
  className,
  redirectTo = '/sign-in', // Default to sign-in page
  ...props 
}: LogoutButtonProps) {
  const router = useRouter();
  const { clearUser } = useUser();
  const [logout, { isLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      clearUser();
      
      // After logout, redirect to the specified path
      router.push(redirectTo);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Button 
      onClick={handleLogout} 
      className={className}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Logging out...
        </>
      ) : (
        children || "Log out"
      )}
    </Button>
  );
}