"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface VisibilityContextType {
  showAmounts: boolean;
  toggleAmountsVisibility: () => void;
}

const VisibilityContext = createContext<VisibilityContextType | undefined>(undefined);

export const VisibilityProvider = ({ children }: { children: ReactNode }) => {
  const [showAmounts, setShowAmounts] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const storedPreference = localStorage.getItem('showAmounts');
      return storedPreference ? JSON.parse(storedPreference) : true;
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem('showAmounts', JSON.stringify(showAmounts));
  }, [showAmounts]);

  const toggleAmountsVisibility = () => {
    setShowAmounts(prev => !prev);
  };

  return (
    <VisibilityContext.Provider value={{ showAmounts, toggleAmountsVisibility }}>
      {children}
    </VisibilityContext.Provider>
  );
};

export const useVisibility = () => {
  const context = useContext(VisibilityContext);
  if (context === undefined) {
    throw new Error('useVisibility must be used within a VisibilityProvider');
  }
  return context;
};