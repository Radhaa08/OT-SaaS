'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useGetCurrentUserQuery, User } from '../../apiSlice/userApiSlice';

// Define context type
interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  const { data: apiUser, isLoading: isApiLoading } = useGetCurrentUserQuery();

  // Enhanced setUser function with synchronous updates to prevent race conditions
  const setUser = useCallback((newUser: User | null) => {
    console.log("Setting user in UserProvider:", newUser?.email);
    setUserState(newUser);
    setIsLoading(false);
  }, []);

  // Clear user and reset loading state
  const clearUser = useCallback(() => {
    console.log("Clearing user in UserProvider");
    setUserState(null);
    setIsLoading(false);
  }, []);

  // Initial load of user data from API
  useEffect(() => {
    // Only update if this is the first load or if API loading has completed
    if (isFirstLoad && !isApiLoading) {
      if (apiUser) {
        console.log("Initial user load from API:", apiUser.email);
        setUserState(apiUser);
      }
      setIsLoading(false);
      setIsFirstLoad(false);
    }
  }, [apiUser, isApiLoading, isFirstLoad]);

  // Check if authenticated
  const isAuthenticated = user !== null;

  return (
    <UserContext.Provider value={{ 
      user, 
      setUser, 
      clearUser, 
      isLoading: isLoading || isApiLoading,
      isAuthenticated
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}