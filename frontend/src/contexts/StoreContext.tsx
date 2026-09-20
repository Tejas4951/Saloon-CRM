import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mockProducts } from '@/data/mockData';

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
    const saved = localStorage.getItem('salon_store_products');
    return saved ? JSON.parse(saved) : initialStoreProducts;
  });

  const [orders, setOrders] = useState<StoreOrder[]>(() => {
    const saved = localStorage.getItem('salon_store_orders');
    return saved ? JSON.parse(saved) : initialOrdersData;
  });

  useEffect(() => {
    localStorage.setItem('salon_store_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('salon_store_orders', JSON.stringify(orders));
  }, [orders]);

  const addProduct = (product: Omit<StoreProduct, 'id' | 'createdDate'>) => {
    const newProduct: StoreProduct = {
      ...product,
      id: `sp-${Date.now()}`,
      createdDate: new Date().toISOString().split('T')[0]
    };
    setProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = (id: string, updates: Partial<StoreProduct>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Public customer places order -> deducts stock & creates order in Admin Panel
  const placeOrder = (orderData: Omit<StoreOrder, 'id' | 'orderNumber' | 'orderDate'>): StoreOrder => {
    const newOrder: StoreOrder = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      orderDate: new Date().toISOString().split('T')[0]
    };

    // Deduct stock for each purchased item
    setProducts(prev => prev.map(prod => {
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
    }));

    setOrders(prev => [newOrder, ...prev]);
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
