import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  TrendingUp,
  BarChart3,
  Globe,
  AlertCircle,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { superAdminService } from '@/services';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState({
    cooperativasActivas: 0,
    cooperativasInactivas: 0,
    totalAdmins: 0,
    totalTicketsVendidos: 0,
    ingresosTotalesPlataforma: 0,
    ciudadesRegistradas: 0,
    terminalesRegistrados: 0,
    cooperativasPorEstado: []
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [metricsResponse, cooperativasResponse] = await Promise.all([
        superAdminService.getGlobalMetrics(),
        superAdminService.getActiveCooperativas()
      ]);

      setMetrics(metricsResponse.data.data);
      setRecentActivity(cooperativasResponse.data.data.recent || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard SuperAdmin</h1>
        <p className="text-gray-600 mt-1">Monitoreo global de la plataforma MovPass</p>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cooperativas Activas</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.cooperativasActivas}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics.cooperativasInactivas} inactivas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAdmins}</div>
            <p className="text-xs text-muted-foreground">
              Administradores registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boletos Vendidos</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTicketsVendidos?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              Total en la plataforma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Infraestructura</CardTitle>
            <Globe className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.ciudadesRegistradas}</div>
            <p className="text-xs text-muted-foreground">
              ciudades, {metrics.terminalesRegistrados} terminales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos y Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estado de Cooperativas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Estado de Cooperativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.cooperativasPorEstado?.map((estado, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {estado.status === 'ACTIVE' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : estado.status === 'INACTIVE' ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Activity className="h-5 w-5 text-yellow-600" />
                    )}
                    <div>
                      <p className="font-medium">{estado.nombre}</p>
                      <p className="text-sm text-gray-600">RUC: {estado.ruc}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      estado.status === 'ACTIVE' ? 'default' : 
                      estado.status === 'INACTIVE' ? 'destructive' : 'secondary'
                    }
                  >
                    {estado.status === 'ACTIVE' ? 'Activa' : 
                     estado.status === 'INACTIVE' ? 'Inactiva' : 'Pendiente'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actividad Reciente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-gray-600">{activity.cooperativa}</p>
                      <p className="text-xs text-gray-400">{activity.timestamp}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay actividad reciente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas Adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen de Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Plataforma:</span>
                <span className="font-bold text-green-600">
                  ${metrics.ingresosTotalesPlataforma?.toLocaleString() || '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Promedio por Cooperativa:</span>
                <span className="font-medium">
                  ${((metrics.ingresosTotalesPlataforma || 0) / (metrics.cooperativasActivas || 1)).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cobertura Geográfica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Ciudades:</span>
                <span className="font-bold">{metrics.ciudadesRegistradas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Terminales:</span>
                <span className="font-bold">{metrics.terminalesRegistrados}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cobertura:</span>
                <span className="font-medium text-green-600">Nacional</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estado del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sistema:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Operativo
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Base de Datos:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Saludable
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Disponible
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}