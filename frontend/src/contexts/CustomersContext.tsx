import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { mockCustomers } from '@/data/mockData';

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
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('salon_customers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved customers from localStorage:', e);
      }
    }
    return mockCustomers;
  });

  useEffect(() => {
    localStorage.setItem('salon_customers', JSON.stringify(customers));
  }, [customers]);

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
          id: uuidv4(),
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
    return resultCustomer!;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === id ? { ...customer, ...updates } : customer
      )
    );
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(customer => customer.id !== id));
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
