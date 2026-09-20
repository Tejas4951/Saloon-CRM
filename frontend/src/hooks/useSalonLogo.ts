import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const SALON_LOGO_STORAGE_KEY = 'saloniq_brand_logo';
const SALON_LOGO_EVENT = 'saloniq-logo-updated';

const readStoredLogo = () => {
  try {
    return localStorage.getItem(SALON_LOGO_STORAGE_KEY);
  } catch {
    return null;
  }
};

export function useSalonLogo() {
  const [logo, setLogo] = useState<string | null>(() => readStoredLogo());

  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase
        .from('shops')
        .select('logo_url')
        .eq('id', 1)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!error && data?.logo_url) {
            localStorage.setItem(SALON_LOGO_STORAGE_KEY, data.logo_url);
            setLogo(data.logo_url);
          }
        });
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SALON_LOGO_STORAGE_KEY) {
        setLogo(event.newValue);
      }
    };

    const handleLogoUpdate = (event: Event) => {
      setLogo((event as CustomEvent<string>).detail);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(SALON_LOGO_EVENT, handleLogoUpdate);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(SALON_LOGO_EVENT, handleLogoUpdate);
    };
  }, []);

  const saveLogo = useCallback(async (dataUrl: string) => {
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('shops')
          .update({ logo_url: dataUrl, updated_at: new Date().toISOString() })
          .eq('id', 1);
        if (error) throw error;
      }

      localStorage.setItem(SALON_LOGO_STORAGE_KEY, dataUrl);
      setLogo(dataUrl);
      window.dispatchEvent(new CustomEvent(SALON_LOGO_EVENT, { detail: dataUrl }));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { logo, saveLogo };
}
