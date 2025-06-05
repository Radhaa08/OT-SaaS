'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function SelectTrigger({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string 
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
}

export function SelectItem({ 
  value, 
  children, 
  className 
}: SelectItemProps) {
  // Use SelectContext to access onValueChange
  const context = useSelectContext();

  if (!context) {
    throw new Error('SelectItem must be used within a Select');
  }

  const { onValueChange, currentValue } = context;
  const isSelected = currentValue === value;

  return (
    <div
      onClick={() => onValueChange(value)}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer hover:bg-accent",
        className
      )}
      role="option"
      aria-selected={isSelected}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <Check className="h-4 w-4" />
        </span>
      )}
      <span>{children}</span>
    </div>
  );
}

export function SelectContent({ children, className }: SelectContentProps) {
  return (
    <div 
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white text-slate-950 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
    >
      <div className="w-full p-1">
        {children}
      </div>
    </div>
  );
}

// Create a Select context to share state between components
const SelectContext = React.createContext<{
  onValueChange: (value: string) => void;
  currentValue: string;
} | undefined>(undefined);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  return context;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const context = useSelectContext();
  
  if (!context) {
    throw new Error('SelectValue must be used within a Select');
  }
  
  const { currentValue } = context;
  
  return (
    <span className="text-sm">
      {currentValue || placeholder || "Select an option"}
    </span>
  );
}

export function Select({ 
  value, 
  onValueChange, 
  children, 
  className 
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Provide context value to children
  const contextValue = {
    onValueChange: (newValue: string) => {
      onValueChange(newValue);
      setIsOpen(false);
    },
    currentValue: value
  };

  return (
    <SelectContext.Provider value={contextValue}>
      <div 
        ref={selectRef}
        className={cn("relative inline-block w-full", className)}
      >
        <div onClick={() => setIsOpen(!isOpen)}>
          {React.Children.map(children, child => {
            if (React.isValidElement(child) && child.type === SelectTrigger) {
              return child;
            }
            return null;
          })}
        </div>
        
        {isOpen && (
          <div className="absolute w-full mt-1 z-50">
            {React.Children.map(children, child => {
              if (React.isValidElement(child) && child.type === SelectContent) {
                return child;
              }
              return null;
            })}
          </div>
        )}
      </div>
    </SelectContext.Provider>
  );
}
