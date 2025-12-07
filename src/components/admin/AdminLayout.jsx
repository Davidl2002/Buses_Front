import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import Header from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';

// Lazy load admin pages
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const RoutesManagement = lazy(() => import('@/pages/admin/RoutesManagement'));
const BusesManagement = lazy(() => import('@/pages/admin/BusesManagement'));
const BusGroupsManagement = lazy(() => import('@/pages/admin/BusGroupsManagement'));
const TripsManagement = lazy(() => import('@/pages/admin/TripsManagement'));
const StaffManagement = lazy(() => import('@/pages/admin/StaffManagement'));
const TicketsManagement = lazy(() => import('@/pages/admin/TicketsManagement'));
const ReportsManagement = lazy(() => import('@/pages/admin/ReportsManagement'));
const CitiesManagement = lazy(() => import('@/pages/admin/CitiesManagement'));
const BalanceManagement = lazy(() => import('@/pages/admin/BalanceManagement'));

// Admin de Cooperativa pages
const CooperativaDashboard = lazy(() => import('@/pages/admin/CooperativaDashboard'));
const CooperativaSettings = lazy(() => import('@/pages/admin/CooperativaSettings'));
const FrequenciesManagement = lazy(() => import('@/pages/admin/FrequenciesManagement'));
const RouteSheet = lazy(() => import('@/pages/admin/RouteSheet'));
const CooperativasManagement = lazy(() => import('@/pages/superadmin/CooperativasManagement'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

export default function AdminLayout() {
  const { user } = useAuth();
  const isOficinista = user?.role === 'OFICINISTA';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        {!isOficinista && <AdminSidebar />}
        <div className="flex-1 overflow-auto p-6">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="cooperativa-dashboard" element={<CooperativaDashboard />} />
              <Route path="cooperativa-settings" element={<CooperativaSettings />} />
              <Route path="routes" element={<RoutesManagement />} />
              <Route path="buses" element={<BusesManagement />} />
              <Route path="bus-groups" element={<BusGroupsManagement />} />
              <Route path="route-sheet" element={<RouteSheet />} />
              <Route path="frequencies" element={<FrequenciesManagement />} />
              <Route path="cooperatives" element={<CooperativasManagement />} />
              <Route path="trips" element={<TripsManagement />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="tickets" element={<TicketsManagement />} />
              <Route path="cities" element={<CitiesManagement />} />
              <Route path="balance" element={<BalanceManagement />} />
              <Route path="reports" element={<ReportsManagement />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </div>
  );
}