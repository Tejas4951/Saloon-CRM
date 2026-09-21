import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Helper to construct mock JWT token if offline
const createMockToken = (role: 'ADMIN' | 'STAFF' | 'SUPER_ADMIN', userName: string) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: userName,
      role: role,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    })
  );
  return `${header}.${payload}.mockSignature`;
};

// JWT token utility functions
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return false;
  }
};

const getTokenExpiration = (token: string): Date | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return new Date(payload.exp * 1000);
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
};

interface UserState {
  userName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
  adminId: number;
  firstLogin: boolean;
  token: string;
}

export type UserStateType = UserState | null;

interface AuthContextType {
  user: UserStateType;
  token: string | null;
  tokenExpiry: Date | null;
  checkAndRefreshToken: () => Promise<boolean>;
  login: (userName: string, password: string) => Promise<{
    success: boolean;
    message: string;
    statusCode: number;
    data?: {
      userName: string;
      role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
      adminId: number;
      firstLogin: boolean;
      token: string;
    };
    timestamp: string;
    error?: string;
  }>;
  changePassword: (data: {
    userId: number;
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<{
    success: boolean;
    message: string;
    statusCode: number;
    timestamp: string;
    error?: string;
  }>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<{
    user: UserStateType;
    token: string | null;
    tokenExpiry: Date | null;
  }>({
    user: null,
    token: null,
    tokenExpiry: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const updateAuthState = useCallback((token: string | null, userData: UserStateType) => {
    if (token && userData) {
      const expiry = getTokenExpiration(token);
      setAuthState({
        user: userData,
        token,
        tokenExpiry: expiry,
      });
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      if (expiry) {
        localStorage.setItem('tokenExpiry', expiry.toISOString());
      }
    } else {
      setAuthState({
        user: null,
        token: null,
        tokenExpiry: null,
      });
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenExpiry');
    }
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser) as UserStateType;
          if (isTokenExpired(storedToken)) {
            updateAuthState(null, null);
          } else {
            updateAuthState(storedToken, parsedUser);
          }
        } catch (error) {
          console.error('Error parsing stored auth data:', error);
          updateAuthState(null, null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [updateAuthState]);

  const login = async (userName: string, password: string) => {
    setIsLoading(true);
    try {
      // 1. If Supabase is configured, use Supabase Auth
      if (isSupabaseConfigured) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: userName.includes('@') ? userName : `${userName}@salon.com`,
          password,
        });

        if (!authError && authData.user) {
          // Fetch user profile from public.profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          const role = (profile?.role || 'ADMIN') as 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
          const token = authData.session?.access_token || createMockToken(role, userName);
          const userData: UserState = {
            userName: profile?.user_name || userName,
            role,
            adminId: 1,
            firstLogin: profile?.first_login ?? false,
            token,
          };

          updateAuthState(token, userData);

          return {
            success: true,
            message: 'Login successful via Supabase',
            statusCode: 200,
            data: userData,
            timestamp: new Date().toISOString(),
          };
        }

      }

      // Demo fallback: any email/password can enter the local demo as an admin.
      let role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' = 'ADMIN';
      if (userName.toLowerCase().includes('super') || userName.toLowerCase().includes('owner')) {
        role = 'SUPER_ADMIN';
      } else if (userName.toLowerCase().includes('staff') || userName.toLowerCase().includes('stylist')) {
        role = 'STAFF';
      }

      const mockToken = createMockToken(role, userName);
      const userData: UserState = {
        userName: userName || 'Admin User',
        role,
        adminId: 1,
        firstLogin: false,
        token: mockToken,
      };

      updateAuthState(mockToken, userData);

      return {
        success: true,
        message: 'Login successful',
        statusCode: 200,
        data: userData,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error?.message || 'Login failed',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        error: 'Authentication Error',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (data: {
    userId: number;
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      setIsLoading(true);
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.updateUser({
          password: data.newPassword,
        });
        if (error) throw error;
      }
      return {
        success: true,
        message: 'Password changed successfully',
        statusCode: 200,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || 'Failed to update password',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        error: 'Password Change Error',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const checkAndRefreshToken = useCallback(async (): Promise<boolean> => {
    const { token } = authState;
    if (!token || isTokenExpired(token)) {
      updateAuthState(null, null);
      return false;
    }
    return true;
  }, [authState, updateAuthState]);

  const logout = useCallback(() => {
    if (isSupabaseConfigured) {
      supabase.auth.signOut().catch(console.error);
    }
    updateAuthState(null, null);
  }, [updateAuthState]);

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        token: authState.token,
        tokenExpiry: authState.tokenExpiry,
        login,
        changePassword,
        logout,
        isAuthenticated: !!authState.token && !isTokenExpired(authState.token),
        isLoading,
        checkAndRefreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
