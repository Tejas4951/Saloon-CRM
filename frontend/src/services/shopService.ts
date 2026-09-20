import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface Shop {
  [key: string]: string; // Map of shopId to shopName
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T | null;
  timestamp: string;
  error: string | null;
}

interface ShopStatusResponse {
  isAvailable: boolean;
  shopId: number;
}

export interface RegisterShopRequest {
  shopName?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  ownerName?: string;
}

export const shopService = {
  getAllShops: async (token?: string): Promise<Shop> => {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('shops').select('id, shop_name');
        if (!error && data) {
          const shopMap: Shop = {};
          data.forEach((shop: any) => {
            shopMap[shop.id.toString()] = shop.shop_name;
          });
          return shopMap;
        }
      }

      return {
        '1': 'Glow & Style Salon',
        '2': 'Urban Cut & Care',
        '3': 'Luxury Spa & Beauty',
      };
    } catch (error) {
      console.error('Error fetching shops:', error);
      return {
        '1': 'Glow & Style Salon',
      };
    }
  },

  toggleShopStatus: async (shopId: number, token?: string): Promise<ShopStatusResponse> => {
    try {
      if (isSupabaseConfigured) {
        const { data: shop } = await supabase
          .from('shops')
          .select('is_available')
          .eq('id', shopId)
          .single();

        const newStatus = !shop?.is_available;
        await supabase.from('shops').update({ is_available: newStatus }).eq('id', shopId);

        return { isAvailable: newStatus, shopId };
      }

      return { isAvailable: true, shopId };
    } catch (error: any) {
      console.error('Error toggling shop status:', error);
      return { isAvailable: true, shopId };
    }
  },

  registerShop: async (shopData: RegisterShopRequest, token?: string) => {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('shops').insert([
          {
            shop_name: shopData.shopName || 'New Salon',
            address: shopData.address || '',
            phone_number: shopData.phoneNumber || '',
            email: shopData.email || '',
            owner_name: shopData.ownerName || '',
            is_available: true,
          },
        ]).select().single();

        if (error) throw error;

        return {
          success: true,
          message: 'Shop registered successfully',
          data,
        };
      }

      return {
        success: true,
        message: 'Shop registered successfully (Mock Mode)',
        data: { id: Date.now(), ...shopData },
      };
    } catch (error: any) {
      console.error('Error registering shop:', error);
      throw new Error(error.message || 'Failed to register shop');
    }
  },
};
