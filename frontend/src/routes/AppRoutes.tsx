import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { withAuth, withoutAuth } from '../hooks/useAuthCheck';
import LoadingSpinner from '../components/common/LoadingSpinner';

const LoginPage = lazy(() => import('../components/LoginPage'));
const SuperAdminDashboard = lazy(() => import('../pages/admin/SuperAdminDashboard'));
const StaffDashboard = lazy(() => import('../pages/StaffDashboard'));
const ChangePassword = lazy(() => import('../components/ChangePassword').then(m => ({ default: m.ChangePassword })));
const NotFound = lazy(() => import('../pages/NotFound'));

const ProtectedSuperAdminDashboard = withAuth(SuperAdminDashboard);
const ProtectedStaffDashboard = withAuth(StaffDashboard);
const ProtectedChangePassword = withAuth(ChangePassword as any);

const PublicLoginPage = withoutAuth(LoginPage);

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        <Route path="/login" element={<PublicLoginPage />} />
        <Route path="/admin/dashboard" element={<ProtectedSuperAdminDashboard />} />
        <Route path="/staff/dashboard" element={<ProtectedStaffDashboard />} />
        <Route path="/change-password" element={<ProtectedChangePassword />} />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
