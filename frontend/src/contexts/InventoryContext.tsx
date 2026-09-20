import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mockProducts } from '@/data/mockData';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  stock: number;          // Unopened / Available stock
  inUseStock: number;     // Currently opened & in-use at workstation
  minThreshold: number;   // Low stock threshold limit
  price: number;          // Unit price / cost
  image: string;          // Image URL or Base64 data URL
  description?: string;
  lastUpdated?: string;
}

export interface InUseRecord {
  id: string;
  itemId: string;
  itemName: string;
  itemImage: string;
  quantity: number;
  assignedStation?: string;
  openedDate: string;
  notes?: string;
}

interface InventoryContextType {
  items: InventoryItem[];
  inUseRecords: InUseRecord[];
  addItem: (item: Omit<InventoryItem, 'id' | 'inUseStock' | 'lastUpdated'>) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  moveToInUse: (itemId: string, qty: number, station?: string, notes?: string) => void;
  returnToStock: (recordId: string, qtyToReturn?: number) => void;
  markFinishedInUse: (recordId: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const initialInventoryData: InventoryItem[] = [
  {
    id: '1',
    name: 'Professional Shampoo',
    category: 'Hair Care',
    brand: 'SalonPro',
    stock: 25,
    inUseStock: 3,
    minThreshold: 5,
    price: 450,
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop',
    description: 'Sulfate-free professional shampoo for all hair types',
    lastUpdated: new Date().toISOString().split('T')[0]
  },
  {
    id: '2',
    name: 'Hydrating Hair Mask',
    category: 'Hair Care',
    brand: 'SalonPro',
    stock: 18,
    inUseStock: 2,
    minThreshold: 5,
    price: 650,
    image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&h=300&fit=crop',
    description: 'Deep conditioning mask for dry and damaged hair',
    lastUpdated: new Date().toISOString().split('T')[0]
  },
  {
    id: '3',
    name: 'Anti-Aging Serum',
    category: 'Skin Care',
    brand: 'BeautyLux',
    stock: 12,
    inUseStock: 1,
    minThreshold: 4,
    price: 1250,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&h=300&fit=crop',
    description: 'Premium anti-aging serum with vitamin C and retinol',
    lastUpdated: new Date().toISOString().split('T')[0]
  },
  {
    id: '4',
    name: 'Nail Polish Set',
    category: 'Nails',
    brand: 'ColorPop',
    stock: 30,
    inUseStock: 4,
    minThreshold: 8,
    price: 350,
    image: 'https://images.unsplash.com/photo-1586706040906-c5250b9241e3?w=300&h=300&fit=crop',
    description: 'Set of 5 trending nail polish colors',
    lastUpdated: new Date().toISOString().split('T')[0]
  },
  {
    id: '5',
    name: 'Organic Facial Cleanser',
    category: 'Skin Care',
    brand: 'GlowNat',
    stock: 3,
    inUseStock: 1,
    minThreshold: 5,
    price: 890,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&h=300&fit=crop',
    description: 'Gentle organic face wash suitable for sensitive skin',
    lastUpdated: new Date().toISOString().split('T')[0]
  },
  {
    id: '6',
    name: 'Argan Hair Oil',
    category: 'Hair Care',
    brand: 'MorocCare',
    stock: 4,
    inUseStock: 2,
    minThreshold: 6,
    price: 950,
    image: 'https://images.unsplash.com/photo-1608248597261-833258657640?w=300&h=300&fit=crop',
    description: 'Pure argan oil serum for frizz control and shine',
    lastUpdated: new Date().toISOString().split('T')[0]
  }
];

const initialInUseRecordsData: InUseRecord[] = [
  {
    id: 'rec-1',
    itemId: '1',
    itemName: 'Professional Shampoo',
    itemImage: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop',
    quantity: 3,
    assignedStation: 'Wash Station 1 & 2',
    openedDate: new Date().toISOString().split('T')[0],
    notes: 'In active use by hair stylists'
  },
  {
    id: 'rec-2',
    itemId: '2',
    itemName: 'Hydrating Hair Mask',
    itemImage: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&h=300&fit=crop',
    quantity: 2,
    assignedStation: 'Spa Section',
    openedDate: new Date().toISOString().split('T')[0],
    notes: 'Opened for deep hair treatment appointments'
  }
];

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('salon_inventory_items');
    return saved ? JSON.parse(saved) : initialInventoryData;
  });

  const [inUseRecords, setInUseRecords] = useState<InUseRecord[]>(() => {
    const saved = localStorage.getItem('salon_inventory_in_use');
    return saved ? JSON.parse(saved) : initialInUseRecordsData;
  });

  useEffect(() => {
    localStorage.setItem('salon_inventory_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('salon_inventory_in_use', JSON.stringify(inUseRecords));
  }, [inUseRecords]);

  const addItem = (newItem: Omit<InventoryItem, 'id' | 'inUseStock' | 'lastUpdated'>) => {
    const createdItem: InventoryItem = {
      ...newItem,
      id: Date.now().toString(),
      inUseStock: 0,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setItems(prev => [createdItem, ...prev]);
  };

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates, lastUpdated: new Date().toISOString().split('T')[0] } : item));
    // Also sync image & name updates to in-use records if name or image changed
    if (updates.name || updates.image) {
      setInUseRecords(prev => prev.map(rec => rec.itemId === id ? {
        ...rec,
        itemName: updates.name || rec.itemName,
        itemImage: updates.image || rec.itemImage
      } : rec));
    }
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setInUseRecords(prev => prev.filter(rec => rec.itemId !== id));
  };

  // Move product quantity to "In Used" section (automatically updates available stock)
  const moveToInUse = (itemId: string, qty: number, station?: string, notes?: string) => {
    const targetItem = items.find(i => i.id === itemId);
    if (!targetItem || qty <= 0) return;

    const actualQty = Math.min(qty, targetItem.stock);

    // 1. Automatically update stock quantity in main inventory
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          stock: Math.max(0, item.stock - actualQty),
          inUseStock: item.inUseStock + actualQty,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return item;
    }));

    // 2. Add or merge into In-Use Records
    setInUseRecords(prev => {
      const existingRec = prev.find(r => r.itemId === itemId && r.assignedStation === (station || 'General Station'));
      if (existingRec) {
        return prev.map(r => r.id === existingRec.id ? { ...r, quantity: r.quantity + actualQty, notes: notes || r.notes } : r);
      }
      const newRecord: InUseRecord = {
        id: `inuse-${Date.now()}`,
        itemId,
        itemName: targetItem.name,
        itemImage: targetItem.image,
        quantity: actualQty,
        assignedStation: station || 'General Station',
        openedDate: new Date().toISOString().split('T')[0],
        notes: notes || 'Opened for salon workstation use'
      };
      return [newRecord, ...prev];
    });
  };

  // Return unused product back to main stock
  const returnToStock = (recordId: string, qtyToReturn?: number) => {
    const record = inUseRecords.find(r => r.id === recordId);
    if (!record) return;

    const qty = qtyToReturn && qtyToReturn > 0 ? Math.min(qtyToReturn, record.quantity) : record.quantity;

    // Increment main stock and decrease in-use stock
    setItems(prev => prev.map(item => {
      if (item.id === record.itemId) {
        return {
          ...item,
          stock: item.stock + qty,
          inUseStock: Math.max(0, item.inUseStock - qty),
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return item;
    }));

    // Update or remove in-use record
    if (qty >= record.quantity) {
      setInUseRecords(prev => prev.filter(r => r.id !== recordId));
    } else {
      setInUseRecords(prev => prev.map(r => r.id === recordId ? { ...r, quantity: r.quantity - qty } : r));
    }
  };

  // Mark in-use item as completely consumed / empty
  const markFinishedInUse = (recordId: string) => {
    const record = inUseRecords.find(r => r.id === recordId);
    if (!record) return;

    // Decrease inUseStock on the item, stock remains unchanged as it was already deducted when opened
    setItems(prev => prev.map(item => {
      if (item.id === record.itemId) {
        return {
          ...item,
          inUseStock: Math.max(0, item.inUseStock - record.quantity),
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return item;
    }));

    setInUseRecords(prev => prev.filter(r => r.id !== recordId));
  };

  return (
    <InventoryContext.Provider 
      value={{
        items,
        inUseRecords,
        addItem,
        updateItem,
        deleteItem,
        moveToInUse,
        returnToStock,
        markFinishedInUse
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
