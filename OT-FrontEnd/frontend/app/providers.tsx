'use client';

import { UserProvider } from '@/components/auth/UserProvider';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        enableSystem
      >
        <UserProvider>{children}</UserProvider>
      </ThemeProvider>
    </Provider>
  );
}