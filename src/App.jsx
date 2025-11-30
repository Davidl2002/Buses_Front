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
import AdminLayout from '@/components/admin/AdminLayout';
import MyTrips from '@/pages/driver/MyTrips';
import DriverManifest from '@/pages/driver/Manifest';

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
                      path="/driver/manifest/:tripId"
                      element={
                        <ProtectedRoute allowedRoles={['CHOFER']}>
                          <DriverManifest />
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
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}

export default App;
