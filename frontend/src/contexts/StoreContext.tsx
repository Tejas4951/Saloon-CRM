import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mockProducts } from '@/data/mockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { createId, getActiveShopId, reportPersistenceError } from '@/services/salonDataService';

export interface StoreProduct {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  image: string;
  description: string;
  status: 'active' | 'out_of_stock' | 'draft';
  createdDate: string;
}

export interface StoreOrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
}

export interface StoreOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryType: 'pickup' | 'delivery';
  address?: string;
  items: StoreOrderItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'upi';
  paymentStatus: 'pending' | 'completed';
  orderStatus: 'pending' | 'processing' | 'completed' | 'cancelled';
  orderDate: string;
  notes?: string;
}

interface StoreContextType {
  products: StoreProduct[];
  orders: StoreOrder[];
  addProduct: (product: Omit<StoreProduct, 'id' | 'createdDate'>) => void;
  updateProduct: (id: string, updates: Partial<StoreProduct>) => void;
  deleteProduct: (id: string) => void;
  placeOrder: (orderData: Omit<StoreOrder, 'id' | 'orderNumber' | 'orderDate'>) => StoreOrder;
  updateOrderStatus: (orderId: string, status: StoreOrder['orderStatus']) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const initialStoreProducts: StoreProduct[] = [
  {
    id: 'sp-1',
    name: 'Professional Shampoo & Haircare Kit',
    category: 'Hair Care',
    brand: 'SalonPro',
    price: 850,
    stock: 20,
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop',
    description: 'Sulfate-free professional shampoo and repair serum set for glossy hair.',
    status: 'active',
    createdDate: new Date().toISOString().split('T')[0]
  },
  {
    id: 'sp-2',
    name: 'Hydrating Keratin Hair Mask',
    category: 'Hair Care',
    brand: 'SalonPro',
    price: 1200,
    stock: 15,
    image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&h=300&fit=crop',
    description: 'Deep nourishing conditioning hair mask for damaged hair treatment.',
    status: 'active',
    createdDate: new Date().toISOString().split('T')[0]
  },
  {
    id: 'sp-3',
    name: 'Vitamin C Radiance Glow Serum',
    category: 'Skin Care',
    brand: 'BeautyLux',
    price: 1850,
    stock: 10,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&h=300&fit=crop',
    description: 'Premium anti-aging antioxidant face serum for glowing skin.',
    status: 'active',
    createdDate: new Date().toISOString().split('T')[0]
  },
  {
    id: 'sp-4',
    name: 'Luxury Gel Nail Polish Collection',
    category: 'Nails',
    brand: 'ColorPop',
    price: 650,
    stock: 25,
    image: 'https://images.unsplash.com/photo-1586706040906-c5250b9241e3?w=300&h=300&fit=crop',
    description: 'Set of 5 trending long-lasting salon gel nail shades.',
    status: 'active',
    createdDate: new Date().toISOString().split('T')[0]
  },
  {
    id: 'sp-5',
    name: 'Organic Face Cleanser & Scrub',
    category: 'Skin Care',
    brand: 'GlowNat',
    price: 950,
    stock: 8,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&h=300&fit=crop',
    description: 'Natural organic cleanser for gentle facial exfoliation.',
    status: 'active',
    createdDate: new Date().toISOString().split('T')[0]
  }
];

const initialOrdersData: StoreOrder[] = [
  {
    id: 'ord-101',
    orderNumber: 'ORD-8921',
    customerName: 'Ananya Gupta',
    customerPhone: '+91 99887 76655',
    deliveryType: 'delivery',
    address: 'Flat 402, Koregaon Park, Pune',
    items: [
      {
        productId: 'sp-1',
        productName: 'Professional Shampoo & Haircare Kit',
        productImage: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop',
        price: 850,
        quantity: 1
      },
      {
        productId: 'sp-3',
        productName: 'Vitamin C Radiance Glow Serum',
        productImage: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&h=300&fit=crop',
        price: 1850,
        quantity: 1
      }
    ],
    totalAmount: 2700,
    paymentMethod: 'upi',
    paymentStatus: 'completed',
    orderStatus: 'processing',
    orderDate: new Date().toISOString().split('T')[0],
    notes: 'Please call before delivery'
  },
  {
    id: 'ord-102',
    orderNumber: 'ORD-8922',
    customerName: 'Rahul Deshpande',
    customerPhone: '+91 98765 43210',
    deliveryType: 'pickup',
    items: [
      {
        productId: 'sp-2',
        productName: 'Hydrating Keratin Hair Mask',
        productImage: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&h=300&fit=crop',
        price: 1200,
        quantity: 1
      }
    ],
    totalAmount: 1200,
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    orderStatus: 'pending',
    orderDate: new Date().toISOString().split('T')[0],
    notes: 'Will pick up during appointment'
  }
];

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<StoreProduct[]>(() => {
    const saved = localStorage.getItem('saloniq_products');
    return saved ? JSON.parse(saved) : initialStoreProducts;
  });
  const [orders, setOrders] = useState<StoreOrder[]>(() => {
    const saved = localStorage.getItem('saloniq_orders');
    return saved ? JSON.parse(saved) : initialOrdersData;
  });

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    let active = true;
    void (async () => {
      try {
        const shopId = await getActiveShopId();
        const [{ data: productRows, error: productError }, { data: orderRows, error: orderError }] = await Promise.all([
          supabase.from('store_products').select('*').eq('shop_id', shopId).order('created_at', { ascending: false }),
          supabase.from('store_orders').select('*, store_order_items(*)').eq('shop_id', shopId).order('created_at', { ascending: false }),
        ]);
        if (productError) throw productError;
        if (orderError) throw orderError;
        if (!active) return;
        const fetchedProducts = (productRows || []).map((row: any) => ({
          id: row.id, name: row.name, category: row.category || '', brand: row.brand || '', price: Number(row.price || 0),
          stock: row.stock || 0, image: row.image || '', description: row.description || '', status: row.status,
          createdDate: row.created_at?.split('T')[0],
        }));
        const fetchedOrders = (orderRows || []).map((row: any) => ({
          id: row.id, orderNumber: row.order_number, customerName: row.customer_name, customerPhone: row.customer_phone,
          deliveryType: row.delivery_type, address: row.address || undefined,
          items: (row.store_order_items || []).map((item: any) => ({
            productId: item.product_id || '', productName: item.product_name, productImage: item.product_image || '',
            price: Number(item.price || 0), quantity: item.quantity,
          })),
          totalAmount: Number(row.total_amount || 0), paymentMethod: row.payment_method, paymentStatus: row.payment_status,
          orderStatus: row.order_status, orderDate: row.created_at?.split('T')[0], notes: row.notes || undefined,
        }));
        setProducts(fetchedProducts);
        setOrders(fetchedOrders);
        localStorage.setItem('saloniq_products', JSON.stringify(fetchedProducts));
        localStorage.setItem('saloniq_orders', JSON.stringify(fetchedOrders));
      } catch (error) {
        reportPersistenceError('store.load', error);
      }
    })();
    return () => { active = false; };
  }, []);

  const addProduct = (product: Omit<StoreProduct, 'id' | 'createdDate'>) => {
    const newProduct: StoreProduct = {
      ...product,
      id: createId(),
      createdDate: new Date().toISOString().split('T')[0]
    };
    setProducts(prev => {
      const updated = [newProduct, ...prev];
      localStorage.setItem('saloniq_products', JSON.stringify(updated));
      return updated;
    });

    if (!isSupabaseConfigured || !supabase) return;

    void (async () => {
      try {
        const shopId = await getActiveShopId();
        const { error } = await supabase.from('store_products').insert({
          id: newProduct.id, shop_id: shopId, name: newProduct.name, category: newProduct.category,
          brand: newProduct.brand, price: newProduct.price, stock: newProduct.stock, image: newProduct.image,
          description: newProduct.description, status: newProduct.status,
        });
        if (error) throw error;
      } catch (error) {
        reportPersistenceError('store.product.add', error);
      }
    })();
  };

  const updateProduct = (id: string, updates: Partial<StoreProduct>) => {
    setProducts(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      localStorage.setItem('saloniq_products', JSON.stringify(updated));
      return updated;
    });

    if (!isSupabaseConfigured || !supabase) return;

    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const fields: Array<[keyof StoreProduct, string]> = [
      ['name', 'name'], ['category', 'category'], ['brand', 'brand'], ['price', 'price'], ['stock', 'stock'],
      ['image', 'image'], ['description', 'description'], ['status', 'status'],
    ];
    fields.forEach(([source, target]) => { if (updates[source] !== undefined) payload[target] = updates[source]; });
    void supabase.from('store_products').update(payload).eq('id', id).then(({ error }) => {
      if (error) reportPersistenceError('store.product.update', error);
    });
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem('saloniq_products', JSON.stringify(updated));
      return updated;
    });

    if (!isSupabaseConfigured || !supabase) return;

    void supabase.from('store_products').delete().eq('id', id).then(({ error }) => {
      if (error) reportPersistenceError('store.product.delete', error);
    });
  };

  // Public customer places order -> deducts stock & creates order in Admin Panel
  const placeOrder = (orderData: Omit<StoreOrder, 'id' | 'orderNumber' | 'orderDate'>): StoreOrder => {
    const newOrder: StoreOrder = {
      ...orderData,
      id: createId(),
      orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      orderDate: new Date().toISOString().split('T')[0]
    };

    // Deduct stock for each purchased item
    setProducts(prev => {
      const updated = prev.map(prod => {
        const purchasedItem = orderData.items.find(i => i.productId === prod.id);
        if (purchasedItem) {
          const remainingStock = Math.max(0, prod.stock - purchasedItem.quantity);
          return {
            ...prod,
            stock: remainingStock,
            status: remainingStock === 0 ? 'out_of_stock' : prod.status
          };
        }
        return prod;
      });
      localStorage.setItem('saloniq_products', JSON.stringify(updated));
      return updated;
    });

    setOrders(prev => {
      const updated = [newOrder, ...prev];
      localStorage.setItem('saloniq_orders', JSON.stringify(updated));
      return updated;
    });

    if (!isSupabaseConfigured || !supabase) return newOrder;

    void (async () => {
      try {
        const shopId = await getActiveShopId();
        const { error: orderError } = await supabase.from('store_orders').insert({
          id: newOrder.id, shop_id: shopId, order_number: newOrder.orderNumber, customer_name: newOrder.customerName,
          customer_phone: newOrder.customerPhone, delivery_type: newOrder.deliveryType, address: newOrder.address || null,
          total_amount: newOrder.totalAmount, payment_method: newOrder.paymentMethod, payment_status: newOrder.paymentStatus,
          order_status: newOrder.orderStatus, notes: newOrder.notes || null,
        });
        if (orderError) throw orderError;
        const { error: itemsError } = await supabase.from('store_order_items').insert(newOrder.items.map(item => ({
          id: createId(), order_id: newOrder.id, product_id: item.productId || null, product_name: item.productName,
          product_image: item.productImage || null, price: item.price, quantity: item.quantity,
        })));
        if (itemsError) throw itemsError;
        await Promise.all(newOrder.items.map(item => {
          const product = products.find(entry => entry.id === item.productId);
          if (!product) return Promise.resolve();
          const stock = Math.max(0, product.stock - item.quantity);
          return supabase.from('store_products').update({ stock, status: stock === 0 ? 'out_of_stock' : product.status, updated_at: new Date().toISOString() }).eq('id', product.id);
        }));
      } catch (error) {
        reportPersistenceError('store.order.add', error);
      }
    })();
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: StoreOrder['orderStatus']) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        return {
          ...ord,
          orderStatus: status,
          paymentStatus: status === 'completed' ? 'completed' : ord.paymentStatus
        };
      }
      return ord;
    }));
    void supabase.from('store_orders').update({
      order_status: status, payment_status: status === 'completed' ? 'completed' : undefined, updated_at: new Date().toISOString(),
    }).eq('id', orderId).then(({ error }) => {
      if (error) reportPersistenceError('store.order.update', error);
    });
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        orders,
        addProduct,
        updateProduct,
        deleteProduct,
        placeOrder,
        updateOrderStatus
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
