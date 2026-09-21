import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppointmentsProvider } from "./contexts/AppointmentsContext";
import { TallyProvider } from "./contexts/TallyContext";
import { CustomersProvider } from "./contexts/CustomersContext";
import { StaffProvider } from "./contexts/StaffContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext-Loginpage";
import ForgotPasswordPage from "@/components/ForgotPasswordPage";
import { ChangePassword } from "@/components/ChangePassword";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Index";
import Booking from "@/pages/Booking";
import Store from "@/pages/Store";
import Customers from "@/pages/Customers";
import Schedule from "@/pages/Schedule";
import Tally from "@/pages/Tally";
import Inventory from "@/pages/Inventory";
import Login from "@/components/LoginPage";
import Profile from "@/pages/profile";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";
import StaffDashboard from "./pages/StaffDashboard";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import InventoryManagementSuper from "./pages/admin/InventoryManagementSuper";
import { InventoryProvider } from "./contexts/InventoryContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { StoreProvider } from "./contexts/StoreContext";
import PublicPortal from "./pages/PublicPortal";
import Reports from "./pages/Reports";
import { ServicesProvider } from "./contexts/ServicesContext";

const queryClient = new QueryClient();

// Protected route component with role-based access control
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('SUPER_ADMIN' | 'ADMIN' | 'STAFF')[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === 'STAFF') {
      return <Navigate to="/staff-dashboard" replace />;
    } else if (user.role === 'ADMIN') {
      return <Navigate to="/index" replace />;
    } else if (user.role === 'SUPER_ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Public only route component
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    const role = user.role as 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
    
    switch (role) {
      case 'SUPER_ADMIN':
        return <Navigate to="/admin/dashboard" replace />;
      case 'STAFF':
        return <Navigate to="/staff-dashboard" replace />;
      case 'ADMIN':
      default:
        return <Navigate to="/index" replace />;
    }
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ServicesProvider>
            <CustomersProvider>
              <AppointmentsProvider>
                <TallyProvider>
                  <StaffProvider>
                    <InventoryProvider>
                      <NotificationsProvider>
                        <StoreProvider>
                          <Routes>
                            {/* Public Customer Portal (No Auth Required) */}
                            <Route path="/public" element={<PublicPortal />} />
                            <Route path="/shop" element={<PublicPortal />} />

                            <Route path="/" element={
                              <PublicOnlyRoute>
                                <Login />
                              </PublicOnlyRoute>
                            } />
                            <Route path="/login" element={
                              <PublicOnlyRoute>
                                <Login />
                              </PublicOnlyRoute>
                            } />
                            <Route path="/forgot-password" element={
                              <PublicOnlyRoute>
                                <ForgotPasswordPage />
                              </PublicOnlyRoute>
                            } />
                            <Route path="/admin/register" element={
                              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                                <SuperAdminDashboard />
                              </ProtectedRoute>
                            } />
                            <Route path="/change-password" element={
                              <ProtectedRoute>
                                <ChangePassword />
                              </ProtectedRoute>
                            } />
                            {/* Super Admin Routes */}
                            <Route path="/admin/dashboard" element={
                              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                                <SuperAdminDashboard />
                              </ProtectedRoute>
                            } />
                            <Route path="/admin/inventory" element={
                              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                                <InventoryManagementSuper />
                              </ProtectedRoute>
                            } />
                            {/* Regular Admin Routes */}
                            <Route path="/index" element={
                              <ProtectedRoute allowedRoles={['ADMIN']}>
                                <Layout><Dashboard /></Layout>
                              </ProtectedRoute>
                            } />
                            <Route path="/booking" element={
                              <ProtectedRoute allowedRoles={['ADMIN']}>
                                <Layout><Booking /></Layout>
                              </ProtectedRoute>
                            } />
                            <Route path="/index/booking" element={
                              <Navigate to="/booking" replace />
                            } />
                            <Route path="/inventory" element={
                              <ProtectedRoute allowedRoles={['ADMIN']}>
                                <Layout><Inventory /></Layout>
                              </ProtectedRoute>
                            } />
                            <Route path="/index/inventory" element={
                              <Navigate to="/inventory" replace />
                            } />
                            <Route path="/store" element={
                              <ProtectedRoute allowedRoles={['ADMIN']}>
                                <Layout><Store /></Layout>
                              </ProtectedRoute>
                            } />
                            <Route path="/index/store" element={
                              <Navigate to="/store" replace />
                            } />
                            <Route path="/customers" element={
                              <ProtectedRoute allowedRoles={['ADMIN']}>
                                <Layout><Customers /></Layout>
                              </ProtectedRoute>
                            } />
                            <Route path="/index/customers" element={
                              <Navigate to="/customers" replace />
                            } />               
                            <Route path="/schedule" element={
                              <ProtectedRoute allowedRoles={['ADMIN']}>
                                <Layout><Schedule /></Layout>
                              </ProtectedRoute>
                            } />
                            <Route path="/index/schedule" element={
                              <Navigate to="/schedule" replace />
                            } />
                            <Route path="/tally" element={
                              <ProtectedRoute allowedRoles={['ADMIN']}>
                                <Layout><Tally /></Layout>
                              </ProtectedRoute>
                            } />
                            <Route path="/index/tally" element={
                              <Navigate to="/tally" replace />
                            } />
                            <Route path="/reports" element={
                              <ProtectedRoute allowedRoles={['ADMIN']}>
                                <Layout><Reports /></Layout>
                              </ProtectedRoute>
                            } />
                            <Route path="/settings" element={
                              <ProtectedRoute allowedRoles={['ADMIN']}>
                                <Layout><Profile /></Layout>
                              </ProtectedRoute>
                            } />
                            <Route path="/profile" element={
                              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'STAFF']}>
                                <Layout><Profile /></Layout>
                              </ProtectedRoute>
                            } />
                            {/* Staff Routes */}
                            <Route path="/staff-dashboard" element={
                              <ProtectedRoute allowedRoles={['STAFF']}>
                                <StaffDashboard />
                              </ProtectedRoute>
                            } />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </StoreProvider>
                      </NotificationsProvider>
                    </InventoryProvider>
                  </StaffProvider>
                </TallyProvider>
              </AppointmentsProvider>
            </CustomersProvider>
            </ServicesProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
