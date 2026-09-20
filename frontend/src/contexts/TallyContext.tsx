import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockTallyItems, PaymentStatus, TallyItem } from '@/data/mockData';

export type PaymentMethod = 'cash' | 'card' | 'upi';

interface TallyContextType {
  tallyItems: TallyItem[];
  addTallyItem: (item: Omit<TallyItem, 'id' | 'paymentDate'>) => TallyItem;
  updatePaymentStatus: (id: string, status: PaymentStatus, upiTransactionId?: string) => void;
}

const TallyContext = createContext<TallyContextType | undefined>(undefined);

export const TallyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tallyItems, setTallyItems] = useState<TallyItem[]>([]);

  useEffect(() => {
    setTallyItems(mockTallyItems);
  }, []);

  const addTallyItem = (item: Omit<TallyItem, 'id' | 'paymentDate'>): TallyItem => {
    const newItem: TallyItem = {
      id: Date.now().toString(),
      paymentDate: new Date().toISOString(),
      ...item,
      paymentStatus: item.paymentStatus || 'pending',
    };
    
    setTallyItems(prev => [...prev, newItem]);
    return newItem;
  };

  const updatePaymentStatus = (id: string, status: PaymentStatus, upiTransactionId?: string) => {
    setTallyItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, paymentStatus: status, upiTransactionId: upiTransactionId || item.upiTransactionId }
          : item
      )
    );
  };

  return (
    <TallyContext.Provider value={{ tallyItems, addTallyItem, updatePaymentStatus }}>
      {children}
    </TallyContext.Provider>
  );
};

export const useTally = () => {
  const context = useContext(TallyContext);
  if (context === undefined) {
    throw new Error('useTally must be used within a TallyProvider');
  }
  return context;
};
