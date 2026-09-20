import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface RegisterServiceRequest {
  serviceName?: string;
  shopId?: number;
  description?: string;
  totalPrice?: number;
  durationMinutes?: number;
  category?: string;
  genderApplicable?: 'MALE' | 'FEMALE' | 'UNISEX';
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T | null;
  timestamp: string;
  error: string | null;
}

export const serviceService = {
  registerService: async (serviceData: RegisterServiceRequest, photoFile: File | null, token?: string) => {
    try {
      if (isSupabaseConfigured) {
        let photoUrl = '';
        if (photoFile) {
          const fileName = `${Date.now()}-${photoFile.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('services')
            .upload(fileName, photoFile);
          
          if (!uploadError && uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from('services')
              .getPublicUrl(fileName);
            photoUrl = publicUrlData.publicUrl;
          }
        }

        const { data, error } = await supabase.from('services').insert([
          {
            shop_id: serviceData.shopId || 1,
            service_name: serviceData.serviceName || 'Service',
            category: serviceData.category || 'General',
            description: serviceData.description || '',
            total_price: serviceData.totalPrice || 0,
            duration_minutes: serviceData.durationMinutes || 30,
            gender_applicable: serviceData.genderApplicable || 'UNISEX',
            photo_url: photoUrl,
          },
        ]).select().single();

        if (error) throw error;

        return {
          success: true,
          message: 'Service registered successfully',
          data,
        };
      }

      return {
        success: true,
        message: 'Service registered successfully (Mock Mode)',
        data: { id: Date.now(), ...serviceData },
      };
    } catch (error: any) {
      console.error('Error registering service:', error);
      throw new Error(error.message || 'Failed to register service');
    }
  },

  getAllShops: async (token?: string): Promise<Record<number, string>> => {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('shops').select('id, shop_name');
        if (!error && data) {
          const shopMap: Record<number, string> = {};
          data.forEach((s: any) => {
            shopMap[s.id] = s.shop_name;
          });
          return shopMap;
        }
      }

      return {
        1: 'Glow & Style Salon',
        2: 'Urban Cut & Care',
      };
    } catch (error) {
      console.error('Error fetching shops:', error);
      return { 1: 'Glow & Style Salon' };
    }
  },
};
