import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mockProducts } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import { createId, getActiveShopId, reportPersistenceError } from '@/services/salonDataService';

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
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [inUseRecords, setInUseRecords] = useState<InUseRecord[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const shopId = await getActiveShopId();
        const [{ data: itemRows, error: itemError }, { data: usageRows, error: usageError }] = await Promise.all([
          supabase.from('inventory_items').select('*').eq('shop_id', shopId).order('created_at', { ascending: false }),
          supabase.from('inventory_in_use').select('*, inventory_items!inner(name, image, shop_id)').eq('inventory_items.shop_id', shopId).order('created_at', { ascending: false }),
        ]);
        if (itemError) throw itemError;
        if (usageError) throw usageError;
        if (!active) return;
        setItems((itemRows || []).map((row: any) => ({
          id: row.id, name: row.name, category: row.category || '', brand: row.brand || '', stock: row.stock || 0,
          inUseStock: row.in_use_stock || 0, minThreshold: row.min_threshold || 0, price: Number(row.price || 0),
          image: row.image || '', description: row.description || '', lastUpdated: row.updated_at?.split('T')[0],
        })));
        setInUseRecords((usageRows || []).map((row: any) => ({
          id: row.id, itemId: row.item_id, itemName: row.inventory_items?.name || '', itemImage: row.inventory_items?.image || '',
          quantity: row.quantity, assignedStation: row.assigned_station || '', openedDate: row.opened_date, notes: row.notes || '',
        })));
      } catch (error) {
        reportPersistenceError('inventory.load', error);
        if (active) { setItems([]); setInUseRecords([]); }
      }
    })();
    return () => { active = false; };
  }, []);

  const addItem = (newItem: Omit<InventoryItem, 'id' | 'inUseStock' | 'lastUpdated'>) => {
    const createdItem: InventoryItem = {
      ...newItem,
      id: createId(),
      inUseStock: 0,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setItems(prev => [createdItem, ...prev]);
    void (async () => {
      try {
        const shopId = await getActiveShopId();
        const { error } = await supabase.from('inventory_items').insert({
          id: createdItem.id, shop_id: shopId, name: createdItem.name, category: createdItem.category,
          brand: createdItem.brand, stock: createdItem.stock, in_use_stock: 0, min_threshold: createdItem.minThreshold,
          price: createdItem.price, image: createdItem.image, description: createdItem.description || null,
        });
        if (error) throw error;
      } catch (error) {
        reportPersistenceError('inventory.add', error);
        setItems(prev => prev.filter(item => item.id !== createdItem.id));
      }
    })();
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
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const fields: Array<[keyof InventoryItem, string]> = [
      ['name', 'name'], ['category', 'category'], ['brand', 'brand'], ['stock', 'stock'], ['inUseStock', 'in_use_stock'],
      ['minThreshold', 'min_threshold'], ['price', 'price'], ['image', 'image'], ['description', 'description'],
    ];
    fields.forEach(([source, target]) => { if (updates[source] !== undefined) payload[target] = updates[source]; });
    void supabase.from('inventory_items').update(payload).eq('id', id).then(({ error }) => {
      if (error) reportPersistenceError('inventory.update', error);
    });
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setInUseRecords(prev => prev.filter(rec => rec.itemId !== id));
    void supabase.from('inventory_items').delete().eq('id', id).then(({ error }) => {
      if (error) reportPersistenceError('inventory.delete', error);
    });
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
    const stationName = station || 'General Station';
    const existingRec = inUseRecords.find(r => r.itemId === itemId && r.assignedStation === stationName);
    let recordToPersist: InUseRecord;
    setInUseRecords(prev => {
      if (existingRec) {
        recordToPersist = { ...existingRec, quantity: existingRec.quantity + actualQty, notes: notes || existingRec.notes };
        return prev.map(r => r.id === existingRec.id ? recordToPersist : r);
      }
      const newRecord: InUseRecord = {
        id: createId(),
        itemId,
        itemName: targetItem.name,
        itemImage: targetItem.image,
        quantity: actualQty,
        assignedStation: stationName,
        openedDate: new Date().toISOString().split('T')[0],
        notes: notes || 'Opened for salon workstation use'
      };
      recordToPersist = newRecord;
      return [newRecord, ...prev];
    });
    void (async () => {
      const itemUpdate = supabase.from('inventory_items').update({
        stock: Math.max(0, targetItem.stock - actualQty), in_use_stock: targetItem.inUseStock + actualQty, updated_at: new Date().toISOString(),
      }).eq('id', itemId);
      const usageUpdate = existingRec
        ? supabase.from('inventory_in_use').update({ quantity: existingRec.quantity + actualQty, notes: notes || existingRec.notes || null }).eq('id', existingRec.id)
        : supabase.from('inventory_in_use').insert({
            id: recordToPersist!.id, item_id: itemId, quantity: actualQty, assigned_station: stationName,
            opened_date: recordToPersist!.openedDate, notes: recordToPersist!.notes || null,
          });
      const [itemResult, usageResult] = await Promise.all([itemUpdate, usageUpdate]);
      if (itemResult.error) reportPersistenceError('inventory.move.item', itemResult.error);
      if (usageResult.error) reportPersistenceError('inventory.move.record', usageResult.error);
    })();
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
    const item = items.find(entry => entry.id === record.itemId);
    if (item) {
      void supabase.from('inventory_items').update({
        stock: item.stock + qty, in_use_stock: Math.max(0, item.inUseStock - qty), updated_at: new Date().toISOString(),
      }).eq('id', item.id).then(({ error }) => { if (error) reportPersistenceError('inventory.return.item', error); });
    }
    const usageRequest = qty >= record.quantity
      ? supabase.from('inventory_in_use').delete().eq('id', recordId)
      : supabase.from('inventory_in_use').update({ quantity: record.quantity - qty }).eq('id', recordId);
    void usageRequest.then(({ error }) => { if (error) reportPersistenceError('inventory.return.record', error); });
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
    const item = items.find(entry => entry.id === record.itemId);
    if (item) {
      void supabase.from('inventory_items').update({
        in_use_stock: Math.max(0, item.inUseStock - record.quantity), updated_at: new Date().toISOString(),
      }).eq('id', item.id).then(({ error }) => { if (error) reportPersistenceError('inventory.finish.item', error); });
    }
    void supabase.from('inventory_in_use').delete().eq('id', recordId).then(({ error }) => {
      if (error) reportPersistenceError('inventory.finish.record', error);
    });
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
