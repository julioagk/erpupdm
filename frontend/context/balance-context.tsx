'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { dashboardSeed } from '@/lib/data';

interface BalanceContextType {
  bankBalance: number;
  setBankBalance: (balance: number) => void;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const [bankBalance, setBankBalance] = useState<number>(dashboardSeed.bankBalance);
  const [isLoaded, setIsLoaded] = useState(false);

  // Persistence in localStorage
  useEffect(() => {
    const savedBalance = localStorage.getItem('erp_bank_balance');
    if (savedBalance) {
      setBankBalance(parseFloat(savedBalance));
    }
    setIsLoaded(true);
  }, []);

  const updateBalance = (newBalance: number) => {
    setBankBalance(newBalance);
    localStorage.setItem('erp_bank_balance', String(newBalance));
  };

  return (
    <BalanceContext.Provider value={{ bankBalance, setBankBalance: updateBalance }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
}
