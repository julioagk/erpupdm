'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { dashboardSeed } from '@/lib/data';
import { fetchFromApi, updateBankBalance as syncBalanceToApi } from '@/lib/api';

interface BalanceContextType {
  bankBalance: number;
  setBankBalance: (balance: number) => void;
  refreshBalance: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const [bankBalance, setBankBalance] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshBalance = async () => {
    try {
      const data = await fetchFromApi('/api/bank');
      setBankBalance(data.balance);
    } catch (error) {
      console.error('Error al sincronizar saldo:', error);
    }
  };

  // Sincronización inicial
  useEffect(() => {
    refreshBalance().then(() => setIsLoaded(true));
  }, []);

  const updateBalance = async (newBalance: number) => {
    setBankBalance(newBalance);
    try {
      await syncBalanceToApi(newBalance);
    } catch (error) {
      console.error('Error al persistir saldo en API:', error);
    }
  };

  return (
    <BalanceContext.Provider value={{ bankBalance, setBankBalance: updateBalance, refreshBalance }}>
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
