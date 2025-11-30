import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { staffService } from '@/services';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Bus,
  Users,
  Ticket,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  FileText,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CooperativaDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [financialReport, setFinancialReport] = useState(null);
  const [balanceByBus, setBalanceByBus] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // carga inicial y re-carga cuando cambia el rango
    loadAllData();

    // polling cada 30s para KPIs (limpieza en unmount)
    const interval = setInterval(() => {
      loadAllData();
    }, 30000);

    return () => clearInterval(interval);
  }, [dateRange]);

  const navigate = useNavigate();

  // Derived metrics helpers
  const calcOccupancyRate = (data) => {
    // tries to compute tickets sold / (viajes * seats) if available
    try {
      const tickets = data.ventas?.ticketsVendidos || 0;
      const viajes = data.viajes?.completados || 0;
      const seatsPerTrip = data.flota?.asientosPromedio || data.flota?.buses?.promedioAsientos || 0;
      if (viajes <= 0 || seatsPerTrip <= 0) return null;
      const capacity = viajes * seatsPerTrip;
      return capacity > 0 ? tickets / capacity : null;
    } catch (e) {
      return null;
    }
  };

  const calcAvgTicketPrice = (data) => {
    try {
      const ventas = data.ventas?.mes || 0;
      const tickets = data.ventas?.ticketsVendidos || 0;
      if (tickets === 0) return null;
      return ventas / tickets;
    } catch (e) {
      return null;
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      // Incluir cooperativaId del usuario para filtrar la información
      const qs = { ...dateRange };
      if (user?.cooperativaId) qs.cooperativaId = user.cooperativaId;
      const params = new URLSearchParams(qs).toString();
      // Cache corto en sessionStorage para reducir llamadas repetidas
      const cacheKey = `dashboardCache:${params}`;
      const ttl = 45000; // 45 segundos
      const now = Date.now();
      const cachedRaw = sessionStorage.getItem(cacheKey);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw);
          if (now - (cached.fetchedAt || 0) < ttl) {
            setDashboardData(cached.dashboard || null);
            setFinancialReport(cached.financial || null);
            setBalanceByBus(cached.balance || []);
            setPendingPayments(cached.pending || []);
            setLoading(false);
            return;
          }
        } catch (e) {
          // ignore parse errors and continue
        }
      }

      const [dashRes, finRes, busRes, pendRes] = await Promise.all([
        api.get(`/dashboard/cooperativa?${params}`),
        api.get(`/dashboard/financial-report?${params}`),
        api.get(`/dashboard/balance-by-bus?${params}`),
        api.get(`/dashboard/pending-payments?${params}`)
      ]);

      const dashData = dashRes.data.data;
      // Normalizar respuestas y garantizar arrays por defecto
      let finData = finRes.data.data || {};
      // intentar deducir array de registros para uso en export/tabla
      finData.records = Array.isArray(finData.records)
        ? finData.records
        : (Array.isArray(finData.tickets) ? finData.tickets : (Array.isArray(finData.list) ? finData.list : (Array.isArray(finData.items) ? finData.items : [])));

      const busData = Array.isArray(busRes.data?.data) ? busRes.data.data : (busRes.data?.data || []);
      const pendData = Array.isArray(pendRes.data?.data) ? pendRes.data.data : (pendRes.data?.data || []);

      setDashboardData(dashData);
      setFinancialReport(finData);
      setBalanceByBus(busData);
      setPendingPayments(pendData);

      // Logs para verificación rápida en consola durante desarrollo
      console.debug('Dashboard data:', {
        cooperativa: !!dashData.cooperativa,
        ventas: dashData.ventas || null,
        personal: dashData.personal || null
      });
      console.debug('Financial report records count:', (finData.records || []).length, 'sample:', (finData.records || []).slice(0,3));
      console.debug('Balance by bus count:', (busData || []).length, 'sample:', (busData || []).slice(0,3));
      console.debug('Pending payments count:', (pendData || []).length, 'sample:', (pendData || []).slice(0,3));

      // Si el backend no devolvió contadores de personal, obtener fallback desde staffService
      try {
        let personalCounts = dashData.personal || {};
        const needsFallback = !personalCounts || personalCounts.total === undefined || personalCounts.total === 0;
        if (needsFallback) {
          try {
            const staffRes = await staffService.getAll({ cooperativaId: user?.cooperativaId });
            const staffList = staffRes.data?.data || staffRes.data || [];
            const normalized = Array.isArray(staffList) ? staffList : [];
            const choferes = normalized.filter(s => (s.role === 'DRIVER' || s.role === 'CHOFER')).length;
            const oficinistas = normalized.filter(s => (s.role === 'OFICINISTA' || s.role === 'CLERK')).length;
            const admins = normalized.filter(s => (s.role === 'ADMIN' || s.role === 'SUPER_ADMIN')).length;
            personalCounts = {
              total: normalized.length,
              choferes,
              oficinistas,
              admins
            };
            // actualizar dashboardData con conteos calculados
            setDashboardData(prev => ({ ...prev, personal: personalCounts }));
            dashData.personal = personalCounts;
          } catch (err) {
            // si falla fallback, no bloqueamos la UI
            console.warn('Fallback staffService failed:', err);
          }
        }

        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            fetchedAt: now,
            dashboard: dashData,
            financial: finData,
            balance: busData,
            pending: pendData
          }));
        } catch (e) {
          // ignore storage errors (e.g., quota)
        }
      } catch (err) {
        // seguridad: ignorar cualquier error aquí
        console.warn('Error processing personal fallback/cache:', err);
      }
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
      alert('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAction = async (ticketId, action, reason = '') => {
    try {
      // API espera { action: 'approve'|'reject', reason?: string }
      await api.put(`/dashboard/payment/${ticketId}`, {
        action: action === 'APPROVE' || action === 'APPROVED' || action === 'approve' ? 'approve' : 'reject',
        reason: reason || undefined
      });

      alert(`Pago ${action === 'APPROVE' || action === 'APPROVED' ? 'aprobado' : 'rechazado'} exitosamente`);
      // invalidar cache para forzar recarga
      const qs = { ...dateRange };
      if (user?.cooperativaId) qs.cooperativaId = user.cooperativaId;
      const params = new URLSearchParams(qs).toString();
      sessionStorage.removeItem(`dashboardCache:${params}`);
      loadAllData();
    } catch (error) {
      console.error('Error al procesar pago:', error);
      alert('Error al procesar el pago');
    }
  };

  // Exportar reporte financiero a CSV
  const handleExportCSV = () => {
    const data = financialReport || {};
    // Intentar obtener array de registros en distintos nombres comunes
    const rows = data.records || data.tickets || data.list || data.items || [];
    if (!Array.isArray(rows) || rows.length === 0) {
      alert('No hay datos de reporte financiero para exportar');
      return;
    }

    // Generar cabeceras a partir de las keys del primer elemento
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => {
      const val = r[h] == null ? '' : String(r[h]).replace(/"/g, '""');
      return `"${val}"`;
    }).join(','))).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = `reporte_financiero_${dateRange.startDate}_${dateRange.endDate}.csv`;
    a.setAttribute('download', fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const dashboard = dashboardData || {};
  const financial = financialReport || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard - {dashboard.cooperativa?.nombre}
          </h1>
          <p className="text-gray-600 mt-1">
            Resumen financiero y operativo de tu cooperativa
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Exportar Reporte
        </Button>
      </div>

      {/* Filtro de Fecha */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
            <Button onClick={loadAllData}>
              <Calendar className="w-4 h-4 mr-2" />
              Aplicar Filtro
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card onClick={() => navigate(`/admin/reports?start=${dateRange.startDate}&end=${dateRange.endDate}`)} className="cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Ventas</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(dashboard.ventas?.mes || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {dashboard.ventas?.ticketsVendidos || 0} tickets vendidos
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ganancia Neta</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(financial.ganancia || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Margen: {formatPercentage(financial.margenGanancia || 0)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Buses Activos</p>
                <p className="text-2xl font-bold">
                  {dashboard.flota?.buses?.activos || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Total: {dashboard.flota?.buses?.total || 0}
                </p>
              </div>
              <Bus className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Viajes Completados</p>
                <p className="text-2xl font-bold">
                  {dashboard.viajes?.completados || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  En curso: {dashboard.viajes?.enCurso || 0}
                </p>
              </div>
              <Ticket className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mt-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ocupación Estimada</p>
                <p className="text-2xl font-bold">
                  {(() => {
                    const occ = calcOccupancyRate(dashboard);
                    return occ === null ? '-' : `${(occ * 100).toFixed(1)}%`;
                  })()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Basado en tickets vendidos y capacidad</p>
              </div>
              <TrendingDown className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Precio Promedio Ticket</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {(() => {
                    const avg = calcAvgTicketPrice(dashboard);
                    return avg === null ? '-' : formatCurrency(avg);
                  })()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Promedio de ventas por ticket</p>
              </div>
              <FileText className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tickets Pendientes</p>
                <p className="text-2xl font-bold text-red-600">{pendingPayments.length}</p>
                <p className="text-xs text-gray-500 mt-1">Requieren verificación</p>
              </div>
              <Clock className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Personal Total</p>
                <p className="text-2xl font-bold">{dashboard.personal?.total || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Choferes: {dashboard.personal?.choferes || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList>
          <TabsTrigger value="financial">Reporte Financiero</TabsTrigger>
          <TabsTrigger value="buses">Balance por Bus</TabsTrigger>
          <TabsTrigger value="payments">
            Pagos Pendientes
            {pendingPayments.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingPayments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="staff">Personal</TabsTrigger>
        </TabsList>

        {/* Financial Report */}
        <TabsContent value="financial">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="font-medium">Total Ingresos</span>
                  <span className="text-lg font-bold text-green-700">
                    {formatCurrency(financial.ingresos?.total || 0)}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Efectivo</span>
                    <span className="font-medium">{formatCurrency(financial.ingresos?.efectivo || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">PayPal</span>
                    <span className="font-medium">{formatCurrency(financial.ingresos?.paypal || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transferencias</span>
                    <span className="font-medium">{formatCurrency(financial.ingresos?.transferencia || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  Gastos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                  <span className="font-medium">Total Gastos</span>
                  <span className="text-lg font-bold text-red-700">
                    {formatCurrency(financial.gastos?.total || 0)}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  {financial.gastos?.porCategoria && Object.entries(financial.gastos.porCategoria).map(([categoria, monto]) => (
                    <div key={categoria} className="flex justify-between">
                      <span className="text-gray-600">{categoria}</span>
                      <span className="font-medium">{formatCurrency(monto)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Resumen de Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const ticketsObj = financial.ticketsPorEstado || {};
                const ticketsFromObj = Object.values(ticketsObj).reduce((s, n) => s + (Number(n) || 0), 0);
                const recordsCount = Array.isArray(financial.records) ? financial.records.length : 0;
                const totalTickets = ticketsFromObj || recordsCount || (dashboard.ventas?.ticketsVendidos || 0);

                if (!totalTickets || totalTickets === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <div className="text-lg font-medium">No se han vendido tickets</div>
                      <div className="text-sm">No hay registros de venta para el rango seleccionado.</div>
                    </div>
                  );
                }

                return (
                  <div className="grid md:grid-cols-3 gap-4">
                    {Object.entries(ticketsObj).map(([estado, cantidad]) => (
                      <div key={estado} className="p-4 border rounded-lg">
                        <p className="text-sm text-gray-600">{estado}</p>
                        <p className="text-2xl font-bold">{cantidad}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance por Bus */}
        <TabsContent value="buses">
          <Card>
            <CardHeader>
              <CardTitle>Balance por Bus</CardTitle>
              <CardDescription>
                Rendimiento financiero de cada unidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bus</TableHead>
                    <TableHead className="text-right">Viajes</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Gastos</TableHead>
                    <TableHead className="text-right">Ganancia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balanceByBus.map((item) => (
                    <TableRow key={item.bus.id}>
                      <TableCell>
                        <div className="font-medium">{item.bus.placa}</div>
                        <div className="text-sm text-gray-500">{item.bus.modelo}</div>
                      </TableCell>
                      <TableCell className="text-right">{item.viajes}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(item.ingresos)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(item.gastos)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold ${item.ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(item.ganancia)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pagos Pendientes */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pagos Pendientes de Verificación
              </CardTitle>
              <CardDescription>
                Transferencias bancarias que requieren aprobación manual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingPayments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  No hay pagos pendientes de verificación
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Pasajero</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.ticketNumber}
                        </TableCell>
                        <TableCell>
                          <div>{payment.passenger?.name}</div>
                          <div className="text-sm text-gray-500">
                            {payment.passenger?.email}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(payment.totalPrice)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {payment.paymentMethod === 'BANK_TRANSFER' ? 'Transferencia' : payment.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handlePaymentAction(payment.id, 'APPROVED')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const notes = prompt('Razón del rechazo (opcional):');
                                handlePaymentAction(payment.id, 'REJECTED', notes || '');
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-1 text-red-600" />
                              Rechazar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personal */}
        <TabsContent value="staff">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Oficinistas</p>
                    <p className="text-3xl font-bold">
                      {dashboard.personal?.oficinistas || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Choferes</p>
                    <p className="text-3xl font-bold">
                      {dashboard.personal?.choferes || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Personal</p>
                    <p className="text-3xl font-bold">
                      {dashboard.personal?.total || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Gestión de Personal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button onClick={() => window.location.href = '/admin/staff'}>
                  <Users className="w-4 h-4 mr-2" />
                  Ver Todo el Personal
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/admin/staff?role=OFICINISTA'}>
                  Ver Oficinistas
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/admin/staff?role=CHOFER'}>
                  Ver Choferes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
