import React, { createContext, useContext, useState, useEffect } from 'react';

export type AdminTheme = 'classic-gold' | 'hr-management';

interface AdminThemeContextType {
  adminTheme: AdminTheme;
  setAdminTheme: (theme: AdminTheme) => void;
  toggleAdminTheme: () => void;
}

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

export const AdminThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminTheme, setAdminThemeState] = useState<AdminTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('saloniq_admin_theme') as AdminTheme;
      if (saved === 'classic-gold' || saved === 'hr-management') {
        return saved;
      }
    }
    return 'classic-gold';
  });

  const setAdminTheme = (theme: AdminTheme) => {
    setAdminThemeState(theme);
    localStorage.setItem('saloniq_admin_theme', theme);
  };

  const toggleAdminTheme = () => {
    const nextTheme = adminTheme === 'classic-gold' ? 'hr-management' : 'classic-gold';
    setAdminTheme(nextTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (adminTheme === 'hr-management') {
      root.setAttribute('data-admin-theme', 'hr-management');
      body.setAttribute('data-admin-theme', 'hr-management');
      root.classList.add('admin-theme-hr');
      body.classList.add('admin-theme-hr');
    } else {
      root.removeAttribute('data-admin-theme');
      body.removeAttribute('data-admin-theme');
      root.classList.remove('admin-theme-hr');
      body.classList.remove('admin-theme-hr');
    }
  }, [adminTheme]);

  return (
    <AdminThemeContext.Provider value={{ adminTheme, setAdminTheme, toggleAdminTheme }}>
      {children}
    </AdminThemeContext.Provider>
  );
};

export const useAdminTheme = () => {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error('useAdminTheme must be used within an AdminThemeProvider');
  }
  return context;
};
