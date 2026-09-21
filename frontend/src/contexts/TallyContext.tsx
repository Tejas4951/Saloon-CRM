import React, { createContext, useContext, useState, useEffect } from 'react';
import { PaymentStatus, TallyItem } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import { createId, getActiveShopId, reportPersistenceError, toDatabaseTime, toDisplayTime } from '@/services/salonDataService';

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
    let active = true;
    void (async () => {
      try {
        const shopId = await getActiveShopId();
        const { data, error } = await supabase.from('tally_items').select('*').eq('shop_id', shopId).order('created_at', { ascending: false });
        if (error) throw error;
        if (!active) return;
        setTallyItems((data || []).map((row: any) => ({
          id: row.id, date: row.entry_date, time: toDisplayTime(row.entry_time), customerName: row.customer_name,
          customerPhone: row.customer_phone || '', staffName: row.staff_name || '', services: row.services || [],
          totalCost: Number(row.total_cost || 0), paymentMethod: row.payment_method, paymentStatus: row.payment_status,
          paymentDate: row.payment_date || '', upiTransactionId: row.upi_transaction_id || undefined,
        })));
      } catch (error) {
        reportPersistenceError('tally.load', error);
        if (active) setTallyItems([]);
      }
    })();
    return () => { active = false; };
  }, []);

  const addTallyItem = (item: Omit<TallyItem, 'id' | 'paymentDate'>): TallyItem => {
    const newItem: TallyItem = {
      id: createId(),
      paymentDate: new Date().toISOString(),
      ...item,
      paymentStatus: item.paymentStatus || 'pending',
    };
    
    setTallyItems(prev => [...prev, newItem]);
    void (async () => {
      try {
        const shopId = await getActiveShopId();
        const { error } = await supabase.from('tally_items').insert({
          id: newItem.id, shop_id: shopId, entry_date: newItem.date, entry_time: toDatabaseTime(newItem.time),
          customer_name: newItem.customerName, customer_phone: newItem.customerPhone || null, staff_name: newItem.staffName || null,
          services: newItem.services, total_cost: newItem.totalCost, payment_method: newItem.paymentMethod,
          payment_status: newItem.paymentStatus, payment_date: newItem.paymentDate || null,
          upi_transaction_id: newItem.upiTransactionId || null,
        });
        if (error) throw error;
      } catch (error) {
        reportPersistenceError('tally.add', error);
        setTallyItems(prev => prev.filter(entry => entry.id !== newItem.id));
      }
    })();
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
    void supabase.from('tally_items').update({
      payment_status: status, upi_transaction_id: upiTransactionId || null,
      payment_date: status === 'completed' ? new Date().toISOString().split('T')[0] : null,
      updated_at: new Date().toISOString(),
    }).eq('id', id).then(({ error }) => {
      if (error) reportPersistenceError('tally.update', error);
    });
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
