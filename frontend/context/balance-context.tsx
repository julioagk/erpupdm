'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchFromApi, updateBankBalance as syncBalanceToApi, updateBankAliases } from '@/lib/api';

interface BalanceContextType {
  bankBalance: number;
  bbvaBalance: number;
  banorteAlias: string;
  bbvaAlias: string;
  setBankBalance: (balance: number) => void;
  setBbvaBalance: (balance: number) => void;
  setAliases: (banorteAlias: string, bbvaAlias: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const [bankBalance, setBankBalanceState] = useState<number>(0);
  const [bbvaBalance, setBbvaBalanceState] = useState<number>(0);
  const [banorteAlias, setBanorteAlias] = useState('Banorte');
  const [bbvaAlias, setBbvaAlias] = useState('BBVA');

  const refreshBalance = async () => {
    try {
      const data = await fetchFromApi('/api/bank');
      setBankBalanceState(data.balance ?? 0);
      setBbvaBalanceState(data.bbvaBalance ?? 0);
      setBanorteAlias(data.banorteAlias || 'Banorte');
      setBbvaAlias(data.bbvaAlias || 'BBVA');
    } catch (error) {
      console.error('Error al sincronizar saldo:', error);
    }
  };

  useEffect(() => {
    refreshBalance();
  }, []);

  const setBankBalance = async (newBalance: number) => {
    setBankBalanceState(newBalance);
    try {
      await syncBalanceToApi(newBalance, bbvaBalance);
    } catch (error) {
      console.error('Error al persistir saldo Banorte:', error);
    }
  };

  const setBbvaBalance = async (newBalance: number) => {
    setBbvaBalanceState(newBalance);
    try {
      await syncBalanceToApi(bankBalance, newBalance);
    } catch (error) {
      console.error('Error al persistir saldo BBVA:', error);
    }
  };

  const setAliases = async (newBanorteAlias: string, newBbvaAlias: string) => {
    try {
      await updateBankAliases(newBanorteAlias, newBbvaAlias);
      setBanorteAlias(newBanorteAlias);
      setBbvaAlias(newBbvaAlias);
    } catch (error) {
      console.error('Error al actualizar alias:', error);
    }
  };

  return (
    <BalanceContext.Provider value={{
      bankBalance,
      bbvaBalance,
      banorteAlias,
      bbvaAlias,
      setBankBalance,
      setBbvaBalance,
      setAliases,
      refreshBalance
    }}>
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
