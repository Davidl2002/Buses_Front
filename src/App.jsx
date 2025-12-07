import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';

// Pages
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Profile from '@/pages/Profile';
import MyTickets from '@/pages/MyTickets';
import PaypalSuccess from '@/pages/PaypalSuccess';
import PaypalRedirect from '@/pages/PaypalRedirect';
import AdminLayout from '@/components/admin/AdminLayout';
import MyTrips from '@/pages/driver/MyTrips';
import DriverManifest from '@/pages/driver/Manifest';
import TripDetail from '@/pages/driver/TripDetail';
import MyExpenses from '@/pages/driver/MyExpenses';
import OficinistaDashboard from '@/pages/oficinista/Dashboard';
import MisVentas from '@/pages/oficinista/MisVentas';
import VenderTicket from '@/pages/oficinista/VenderTicket';
import OficinistaConfiguracion from '@/pages/oficinista/Configuracion';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Admin Routes - Full screen layout */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'OFICINISTA']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          />

          {/* All other routes with normal layout */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/payment/success" element={<PaypalSuccess />} />
                    <Route path="/payment/redirect" element={<PaypalRedirect />} />

                    {/* Profile Route (All authenticated users) */}
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'OFICINISTA', 'CHOFER', 'CLIENTE']}>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />

                    {/* Client Routes */}
                    <Route
                      path="/my-tickets"
                      element={
                        <ProtectedRoute allowedRoles={['CLIENTE']}>
                          <MyTickets />
                        </ProtectedRoute>
                      }
                    />

                    {/* Driver Routes */}
                    <Route
                      path="/driver"
                      element={
                        <ProtectedRoute allowedRoles={['CHOFER']}>
                          <MyTrips />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/driver/trips/:tripId"
                      element={
                        <ProtectedRoute allowedRoles={['CHOFER']}>
                          <TripDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/driver/manifest/:tripId"
                      element={
                        <ProtectedRoute allowedRoles={['CHOFER']}>
                          <DriverManifest />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/driver/expenses"
                      element={
                        <ProtectedRoute allowedRoles={['CHOFER']}>
                          <MyExpenses />
                        </ProtectedRoute>
                      }
                    />

                    {/* Oficinista Routes */}
                    <Route
                      path="/oficinista"
                      element={
                        <ProtectedRoute allowedRoles={['OFICINISTA']}>
                          <OficinistaDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/oficinista/vender-ticket"
                      element={
                        <ProtectedRoute allowedRoles={['OFICINISTA']}>
                          <VenderTicket />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/oficinista/mis-ventas"
                      element={
                        <ProtectedRoute allowedRoles={['OFICINISTA']}>
                          <MisVentas />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/oficinista/validar-qr"
                      element={
                        <ProtectedRoute allowedRoles={['OFICINISTA']}>
                          <DriverManifest />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/oficinista/manifest/:tripId"
                      element={
                        <ProtectedRoute allowedRoles={['OFICINISTA']}>
                          <DriverManifest />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/oficinista/configuracion"
                      element={
                        <ProtectedRoute allowedRoles={['OFICINISTA']}>
                          <OficinistaConfiguracion />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </main>
                <Footer />
              </div>
            }
          />
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#363636',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
