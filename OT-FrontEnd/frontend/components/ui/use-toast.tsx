'use client';

import React, { createContext, useContext, useState } from 'react';
import { X } from 'lucide-react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  variant?: 'default' | 'destructive';
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, duration = 5000, variant = 'default' }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, title, description, duration, variant };
    
    setToasts((prev) => [...prev, newToast]);
    
    if (duration !== Infinity) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      
      {/* Toast viewport */}
      <div className="fixed top-0 right-0 p-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`bg-white border shadow-lg rounded-lg p-4 animate-slide-in relative ${
              toast.variant === 'destructive' ? 'border-red-500' : 'border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`font-medium text-sm ${
                  toast.variant === 'destructive' ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {toast.title}
                </h3>
                {toast.description && (
                  <p className="text-sm text-gray-500 mt-1">{toast.description}</p>
                )}
              </div>
              <button 
                onClick={() => dismiss(toast.id)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
