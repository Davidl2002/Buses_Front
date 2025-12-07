import { useState, useEffect } from 'react';
import {
  BarChart3,
  Bus,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Route,
  Ticket,
  AlertCircle,
  Plus,
  Building2,
  CheckCircle2,
  Clock,
  Wrench,
  CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminDashboardService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import useActiveCooperativaId from '@/hooks/useActiveCooperativaId';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState({
    cooperativa: {},
    ventas: {
      ticketsVendidos: 0,
      ingresosTotal: "0.00",
      promedioVentaDiaria: "0.00"
    },
    flota: {
      busesActivos: 0,
      busesMantenimiento: 0,
      totalBuses: 0
    },
    operaciones: {
      viajesHoy: 0,
      viajesCompletados: 0,
      rutasActivas: 0
    },
    personal: []
  });
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const coopId = useActiveCooperativaId();
  const navigate = useNavigate();

  useEffect(() => {
    if (coopId || user?.cooperativaId) {
      loadDashboardData();
    }
  }, [coopId]);

  const loadDashboardData = async () => {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Construir params con cooperativaId
      const params = {
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0]
      };

      // Agregar cooperativaId: para SUPER_ADMIN usa la seleccionada, para ADMIN usa la asignada
      if (coopId) {
        params.cooperativaId = coopId;
      } else if (user?.cooperativaId) {
        params.cooperativaId = user.cooperativaId;
      }

      // Si es SUPER_ADMIN y no hay cooperativa seleccionada, no cargar datos
      if (user?.role === 'SUPER_ADMIN' && !params.cooperativaId) {
        setLoading(false);
        return;
      }

      const [dashboardResponse, paymentsResponse] = await Promise.all([
        adminDashboardService.getDashboard(params),
        adminDashboardService.getPendingPayments(params)
      ]);

      setDashboardData(dashboardResponse.data.data);
      setPendingPayments(paymentsResponse.data.data || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (ticketId) => {
    try {
      const params = {};
      if (coopId) {
        params.cooperativaId = coopId;
      } else if (user?.cooperativaId) {
        params.cooperativaId = user.cooperativaId;
      }
      
      await adminDashboardService.approvePayment(ticketId, params);
      toast.success('Pago aprobado exitosamente');
      loadDashboardData(); // Recargar datos
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error('Error al aprobar el pago');
    }
  };

  const handleRejectPayment = async (ticketId) => {
    const reason = window.prompt('Motivo del rechazo:');
    if (!reason) return;

    try {
      const params = {};
      if (coopId) {
        params.cooperativaId = coopId;
      } else if (user?.cooperativaId) {
        params.cooperativaId = user.cooperativaId;
      }
      
      await adminDashboardService.rejectPayment(ticketId, reason, params);
      toast.success('Pago rechazado');
      loadDashboardData(); // Recargar datos
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('Error al rechazar el pago');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si es superadmin y no ha seleccionado cooperativa, mostrar mensaje
  if (user?.role === 'SUPER_ADMIN' && !coopId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <BarChart3 className="h-16 w-16 text-gray-400" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Selecciona una cooperativa</h3>
          <p className="text-gray-500 mt-1">Para ver el dashboard, primero selecciona una cooperativa en el menú lateral.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard - {dashboardData.cooperativa.nombre}</h1>
        <p className="text-gray-600 mt-1">Panel de control de la cooperativa</p>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ingresos del Mes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${parseFloat(dashboardData.ventas.ingresosTotal).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.ventas.ticketsVendidos} boletos vendidos
            </p>
          </CardContent>
        </Card>

        {/* Flota Activa */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flota Activa</CardTitle>
            <Bus className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData.flota.busesActivos}
            </div>
            <p className="text-xs text-muted-foreground">
              de {dashboardData.flota.totalBuses} buses totales
            </p>
          </CardContent>
        </Card>

        {/* Viajes Hoy */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viajes Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {dashboardData.operaciones.viajesHoy}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.operaciones.viajesCompletados} completados
            </p>
          </CardContent>
        </Card>

        {/* Personal */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal Activo</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {dashboardData.personal.reduce((sum, p) => sum + p.total, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              colaboradores registrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estado de la Flota y Operaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado de Buses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5" />
              Estado de la Flota
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Buses Activos</span>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {dashboardData.flota.busesActivos}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">En Mantenimiento</span>
                </div>
                <Badge variant="secondary">
                  {dashboardData.flota.busesMantenimiento}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Rutas Activas</span>
                </div>
                <Badge variant="default">
                  {dashboardData.operaciones.rutasActivas}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Desglose del Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Personal por Rol
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.personal.map((role, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm capitalize">
                      {role.rol === 'CHOFER' ? 'Choferes' : 
                       role.rol === 'OFICINISTA' ? 'Oficinistas' : 
                       role.rol}
                    </span>
                  </div>
                  <Badge variant="outline">
                    {role.total}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pagos Pendientes de Aprobación */}
      {pendingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pagos Pendientes de Aprobación ({pendingPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPayments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{payment.passengerName}</div>
                    <div className="text-sm text-gray-600">
                      CI: {payment.passengerCedula} • ${payment.totalPrice}
                    </div>
                    <div className="text-xs text-gray-500">
                      {payment.trip?.frequency?.route?.name} • Bus {payment.trip?.bus?.placa}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {payment.paymentProof && (
                      <a 
                        href={payment.paymentProof} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 text-xs hover:underline"
                      >
                        Ver comprobante
                      </a>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleApprovePayment(payment.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectPayment(payment.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))}
              
              {pendingPayments.length > 5 && (
                <div className="text-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/admin/reports')}
                  >
                    Ver todos los pagos pendientes ({pendingPayments.length})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accesos Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Acciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/admin/buses')}
            >
              <Bus className="h-6 w-6" />
              <span>Gestionar Buses</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/admin/routes')}
            >
              <Route className="h-6 w-6" />
              <span>Gestionar Rutas</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/admin/staff')}
            >
              <Users className="h-6 w-6" />
              <span>Gestionar Personal</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/admin/reports')}
            >
              <BarChart3 className="h-6 w-6" />
              <span>Ver Reportes</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
