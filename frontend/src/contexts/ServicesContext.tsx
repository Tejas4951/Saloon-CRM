import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getActiveShopId, reportPersistenceError } from '@/services/salonDataService';

export interface SalonService {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: string;
  description: string;
}

interface ServicesContextValue {
  services: SalonService[];
  addService: (service: Omit<SalonService, 'id'>) => void;
  updateService: (id: string, updates: Partial<SalonService>) => void;
  deleteService: (id: string) => void;
}

const ServicesContext = createContext<ServicesContextValue | undefined>(undefined);

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<SalonService[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const shopId = await getActiveShopId();
        const { data, error } = await supabase.from('services').select('*').eq('shop_id', shopId).eq('is_active', true).order('id');
        if (error) throw error;
        if (!active) return;
        setServices((data || []).map((row: any) => ({
          id: String(row.id), name: row.service_name, duration: row.duration_minutes,
          price: Number(row.total_price || 0), category: row.category, description: row.description || '',
        })));
      } catch (error) {
        reportPersistenceError('services.load', error);
        if (active) setServices([]);
      }
    })();
    return () => { active = false; };
  }, []);

  const addService = (service: Omit<SalonService, 'id'>) => {
    void (async () => {
      try {
        const shopId = await getActiveShopId();
        const { data, error } = await supabase.from('services').insert({
          shop_id: shopId, service_name: service.name, duration_minutes: service.duration,
          total_price: service.price, category: service.category, description: service.description,
          gender_applicable: 'UNISEX', is_active: true,
        }).select('id').single();
        if (error) throw error;
        setServices(prev => [...prev, { ...service, id: String(data.id) }]);
      } catch (error) {
        reportPersistenceError('services.add', error);
      }
    })();
  };

  const updateService = (id: string, updates: Partial<SalonService>) => {
    setServices(prev => prev.map(service => service.id === id ? { ...service, ...updates } : service));
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const fields: Array<[keyof SalonService, string]> = [
      ['name', 'service_name'], ['duration', 'duration_minutes'], ['price', 'total_price'],
      ['category', 'category'], ['description', 'description'],
    ];
    fields.forEach(([source, target]) => { if (updates[source] !== undefined) payload[target] = updates[source]; });
    void supabase.from('services').update(payload).eq('id', Number(id)).then(({ error }) => {
      if (error) reportPersistenceError('services.update', error);
    });
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(service => service.id !== id));
    void supabase.from('services').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', Number(id)).then(({ error }) => {
      if (error) reportPersistenceError('services.delete', error);
    });
  };

  return <ServicesContext.Provider value={{ services, addService, updateService, deleteService }}>{children}</ServicesContext.Provider>;
}

export function useServices() {
  const context = useContext(ServicesContext);
  if (!context) throw new Error('useServices must be used within a ServicesProvider');
  return context;
}
