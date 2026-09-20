import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext-Loginpage';

export const useAuthCheck = (redirectTo: string = '/login', requireAuth: boolean = true): boolean => {
  const { isAuthenticated, isLoading, checkAndRefreshToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      if (isLoading) return;
      
      if (requireAuth && !isAuthenticated) {
        const redirectPath = location.pathname !== '/login' ? location.pathname + location.search : undefined;
        navigate(redirectTo, { 
          state: { from: redirectPath },
          replace: true 
        });
        return;
      }

      if (!requireAuth && isAuthenticated) {
        navigate('/index', { replace: true });
        return;
      }

      if (requireAuth && isAuthenticated) {
        const isValid = await checkAndRefreshToken();
        if (!isValid) {
          navigate(redirectTo, { 
            state: { from: location.pathname },
            replace: true 
          });
        }
      }
    };

    checkAuth();
  }, [isAuthenticated, isLoading, navigate, location, requireAuth, redirectTo, checkAndRefreshToken]);

  return isAuthenticated;
};

export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: { redirectTo?: string } = {}
): React.FC<P> => {
  const { redirectTo = '/login' } = options;
  
  return function WithAuthWrapper(props: P) {
    const isAuthenticated = useAuthCheck(redirectTo, true);
    
    if (!isAuthenticated) {
      return null;
    }
    
    return React.createElement(WrappedComponent, props);
  };
};

export const withoutAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: { redirectTo?: string } = {}
): React.FC<P> => {
  const { redirectTo = '/index' } = options;
  
  return function WithoutAuthWrapper(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    
    useEffect(() => {
      if (!isLoading && isAuthenticated) {
        navigate(redirectTo, { replace: true });
      }
    }, [isAuthenticated, isLoading, navigate, redirectTo]);
    
    if (isLoading || isAuthenticated) {
      return null;
    }
    
    return React.createElement(WrappedComponent, props);
  };
};
