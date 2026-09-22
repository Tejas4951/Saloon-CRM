import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface StyleItem {
  id: string;
  title: string;
  stylist?: string;
  category: string;
  price: number;
  likes: number;
  serviceId: string;
  imageMode?: 'single' | 'before_after';
  beforeImage: string;
  afterImage: string;
  description: string;
}

interface StylesContextValue {
  styles: StyleItem[];
  addStyle: (style: Omit<StyleItem, 'id' | 'likes'> & { likes?: number }) => void;
  updateStyle: (id: string, updates: Partial<StyleItem>) => void;
  deleteStyle: (id: string) => void;
}

const initialStyles: StyleItem[] = [
  {
    id: 'style-1',
    title: 'Textured Mid Fade',
    stylist: 'Aarav',
    category: 'Haircuts',
    price: 399,
    likes: 245,
    serviceId: '1',
    beforeImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=400&fit=crop',
    description: 'Clean mid fade with textured volume on top and crisp outline.'
  },
  {
    id: 'style-2',
    title: 'Caramel Balayage',
    stylist: 'Meera',
    category: 'Colour',
    price: 1299,
    likes: 389,
    serviceId: '2',
    beforeImage: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=400&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=400&h=400&fit=crop',
    description: 'Seamless hand-painted caramel highlights for natural sun-kissed dimension.'
  },
  {
    id: 'style-3',
    title: 'Sculpted Beard & Pompadour',
    stylist: 'Rohan',
    category: 'Beard',
    price: 648,
    likes: 156,
    serviceId: '6',
    beforeImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop',
    description: 'Sharp razor edge beard sculpt paired with a classic slick pompadour.'
  },
  {
    id: 'style-4',
    title: 'HydraFacial Glow',
    stylist: 'Ananya',
    category: 'Skin',
    price: 899,
    likes: 412,
    serviceId: '3',
    beforeImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1512290900673-70020016a2a2?w=400&h=400&fit=crop',
    description: 'Deep pore cleansing and serum infusion for instant glass-skin radiance.'
  }
];

const StylesContext = createContext<StylesContextValue | undefined>(undefined);

export function StylesProvider({ children }: { children: ReactNode }) {
  const [styles, setStyles] = useState<StyleItem[]>(() => {
    const saved = localStorage.getItem('saloniq_styles_showcase');
    return saved ? JSON.parse(saved) : initialStyles;
  });

  useEffect(() => {
    localStorage.setItem('saloniq_styles_showcase', JSON.stringify(styles));
  }, [styles]);

  const addStyle = (styleData: Omit<StyleItem, 'id' | 'likes'> & { likes?: number }) => {
    const newStyle: StyleItem = {
      ...styleData,
      id: `style-${Date.now()}`,
      likes: styleData.likes || Math.floor(Math.random() * 100) + 50
    };
    setStyles(prev => [newStyle, ...prev]);
  };

  const updateStyle = (id: string, updates: Partial<StyleItem>) => {
    setStyles(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteStyle = (id: string) => {
    setStyles(prev => prev.filter(s => s.id !== id));
  };

  return (
    <StylesContext.Provider value={{ styles, addStyle, updateStyle, deleteStyle }}>
      {children}
    </StylesContext.Provider>
  );
}

export function useStyles() {
  const context = useContext(StylesContext);
  if (!context) {
    throw new Error('useStyles must be used within a StylesProvider');
  }
  return context;
}
