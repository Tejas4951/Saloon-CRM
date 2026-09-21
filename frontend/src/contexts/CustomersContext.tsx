import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { createId, getActiveShopId, reportPersistenceError } from '@/services/salonDataService';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  gender: 'male' | 'female';
  visitCount: number;
  totalSpent: number;
  pendingAmount?: number;
  lastVisit: string;
  preferredServices: string[];
  notes?: string;
  photo: string;
  createdAt?: string;
}

interface CustomersContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'visitCount' | 'totalSpent' | 'lastVisit'> & { visitCount?: number; totalSpent?: number }) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addPendingAmount: (idOrPhone: string, amount: number) => void;
}

const CustomersContext = createContext<CustomersContextType | undefined>(undefined);

export function CustomersProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    let active = true;
    const loadCustomers = async () => {
      try {
        const shopId = await getActiveShopId();
        const { data, error } = await supabase.from('customers').select('*').eq('shop_id', shopId).order('created_at', { ascending: false });
        if (error) throw error;
        if (!active) return;
        setCustomers((data || []).map((row: any) => ({
          id: row.id, name: row.name, phone: row.phone, email: row.email || '', gender: row.gender || 'female',
          visitCount: row.visit_count || 0, totalSpent: Number(row.total_spent || 0), pendingAmount: Number(row.pending_amount || 0),
          lastVisit: row.last_visit || row.created_at, preferredServices: row.preferred_services || [], notes: row.notes || '', photo: row.photo || '',
          createdAt: row.created_at,
        })));
      } catch (error) {
        reportPersistenceError('customers.load', error);
        if (active) setCustomers([]);
      }
    };
    void loadCustomers();
    return () => { active = false; };
  }, []);

  const addCustomer = (customerData: Omit<Customer, 'id' | 'visitCount' | 'totalSpent' | 'lastVisit'> & { visitCount?: number; totalSpent?: number }) => {
    let resultCustomer: Customer;
    setCustomers(prev => {
      const cleanPhone = (customerData.phone || '').replace(/\D/g, '');
      const existingIdx = prev.findIndex(c => {
        if (!c.phone || !customerData.phone) return false;
        const cClean = c.phone.replace(/\D/g, '');
        return cClean === cleanPhone || c.phone === customerData.phone;
      });

      if (existingIdx !== -1) {
        const existing = prev[existingIdx];
        const updated: Customer = {
          ...existing,
          name: customerData.name || existing.name,
          email: customerData.email || existing.email,
          gender: customerData.gender || existing.gender,
          photo: customerData.photo || existing.photo,
          preferredServices: customerData.preferredServices?.length ? Array.from(new Set([...existing.preferredServices, ...customerData.preferredServices])) : existing.preferredServices,
          notes: customerData.notes ? (existing.notes && !existing.notes.includes(customerData.notes) ? `${existing.notes} | ${customerData.notes}` : customerData.notes) : existing.notes,
          totalSpent: existing.totalSpent + (customerData.totalSpent || 0),
          visitCount: existing.visitCount + (customerData.visitCount !== undefined ? customerData.visitCount : 1),
          lastVisit: new Date().toISOString()
        };
        resultCustomer = updated;
        const copy = [...prev];
        copy[existingIdx] = updated;
        return copy;
      } else {
        const newCustomer: Customer = {
          id: createId(),
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email || '',
          gender: customerData.gender || 'female',
          visitCount: customerData.visitCount !== undefined ? customerData.visitCount : 1,
          totalSpent: customerData.totalSpent || 0,
          pendingAmount: 0,
          lastVisit: new Date().toISOString(),
          preferredServices: customerData.preferredServices || [],
          notes: customerData.notes || '',
          photo: customerData.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop'
        };
        resultCustomer = newCustomer;
        return [newCustomer, ...prev];
      }
    });
    const persistedCustomer = resultCustomer!;
    void (async () => {
      try {
        const shopId = await getActiveShopId();
        const payload = {
          id: persistedCustomer.id, shop_id: shopId, name: persistedCustomer.name, phone: persistedCustomer.phone,
          email: persistedCustomer.email || null, gender: persistedCustomer.gender, visit_count: persistedCustomer.visitCount,
          total_spent: persistedCustomer.totalSpent, pending_amount: persistedCustomer.pendingAmount || 0,
          last_visit: persistedCustomer.lastVisit, preferred_services: persistedCustomer.preferredServices,
          notes: persistedCustomer.notes || null, photo: persistedCustomer.photo || null, updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from('customers').upsert(payload, { onConflict: 'shop_id,phone' });
        if (error) throw error;
      } catch (error) {
        reportPersistenceError('customers.save', error);
      }
    })();
    return resultCustomer!;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === id ? { ...customer, ...updates } : customer
      )
    );
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const fields: Array<[keyof Customer, string]> = [
      ['name', 'name'], ['phone', 'phone'], ['email', 'email'], ['gender', 'gender'], ['visitCount', 'visit_count'],
      ['totalSpent', 'total_spent'], ['pendingAmount', 'pending_amount'], ['lastVisit', 'last_visit'],
      ['preferredServices', 'preferred_services'], ['notes', 'notes'], ['photo', 'photo'],
    ];
    fields.forEach(([source, target]) => { if (updates[source] !== undefined) payload[target] = updates[source]; });
    void supabase.from('customers').update(payload).eq('id', id).then(({ error }) => {
      if (error) reportPersistenceError('customers.update', error);
    });
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(customer => customer.id !== id));
    void supabase.from('customers').delete().eq('id', id).then(({ error }) => {
      if (error) reportPersistenceError('customers.delete', error);
    });
  };

  const addPendingAmount = (idOrPhone: string, amount: number) => {
    setCustomers(prev =>
      prev.map(customer => {
        if (customer.id === idOrPhone || customer.phone === idOrPhone) {
          const currentPending = customer.pendingAmount || 0;
          return { ...customer, pendingAmount: currentPending + amount };
        }
        return customer;
      })
    );
    const customer = customers.find(item => item.id === idOrPhone || item.phone === idOrPhone);
    if (customer) {
      void supabase.from('customers').update({ pending_amount: (customer.pendingAmount || 0) + amount, updated_at: new Date().toISOString() }).eq('id', customer.id).then(({ error }) => {
        if (error) reportPersistenceError('customers.pending', error);
      });
    }
  };

  return (
    <CustomersContext.Provider value={{ customers, addCustomer, updateCustomer, deleteCustomer, addPendingAmount }}>
      {children}
    </CustomersContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomersContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomersProvider');
  }
  return context;
}
