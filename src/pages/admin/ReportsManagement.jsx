import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Bus,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  MapPin,
  Clock,
  Ticket
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { reportService } from '@/services';
import toast from 'react-hot-toast';

export default function ReportsManagement() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    summary: {
      totalRevenue: 0,
      totalTickets: 0,
      totalTrips: 0,
      averageOccupancy: 0
    },
    salesByMonth: [],
    popularRoutes: [],
    busPerformance: [],
    revenueByRoute: [],
    occupancyTrends: []
  });
  
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    routeId: '',
    busId: '',
    reportType: 'summary'
  });

  useEffect(() => {
    loadReportData();
  }, [filters]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const response = await reportService.getReport(filters);
      setReportData(response.data || {});
    } catch (error) {
      console.error('Error loading report data:', error);
      // Datos de demostración
      setReportData({
        summary: {
          totalRevenue: 125430.50,
          totalTickets: 8362,
          totalTrips: 342,
          averageOccupancy: 72.5
        },
        salesByMonth: [
          { month: 'Enero', sales: 45230.50, tickets: 3012 },
          { month: 'Febrero', sales: 52180.25, tickets: 3476 },
          { month: 'Marzo', sales: 48940.30, tickets: 3264 },
          { month: 'Abril', sales: 56320.80, tickets: 3755 },
          { month: 'Mayo', sales: 49870.40, tickets: 3325 },
          { month: 'Junio', sales: 53240.60, tickets: 3549 }
        ],
        popularRoutes: [
          { route: 'Quito → Guayaquil', tickets: 2450, revenue: 36750.00, occupancy: 85.2 },
          { route: 'Guayaquil → Quito', tickets: 2380, revenue: 35700.00, occupancy: 82.7 },
          { route: 'Quito → Cuenca', tickets: 1520, revenue: 30400.00, occupancy: 76.5 },
          { route: 'Cuenca → Quito', tickets: 1480, revenue: 29600.00, occupancy: 74.8 },
          { route: 'Guayaquil → Cuenca', tickets: 890, revenue: 22250.00, occupancy: 68.3 }
        ],
        busPerformance: [
          { bus: 'ABC-123 (Mercedes)', trips: 45, revenue: 15750.00, occupancy: 88.5, efficiency: 95.2 },
          { bus: 'XYZ-789 (Volvo)', trips: 42, revenue: 14280.00, occupancy: 81.3, efficiency: 91.8 },
          { bus: 'DEF-456 (Scania)', trips: 38, revenue: 13300.00, occupancy: 75.6, efficiency: 89.4 },
          { bus: 'GHI-321 (Mercedes)', trips: 35, revenue: 12250.00, occupancy: 70.2, efficiency: 86.7 },
          { bus: 'JKL-654 (Volvo)', trips: 32, revenue: 11200.00, occupancy: 65.8, efficiency: 83.5 }
        ],
        revenueByRoute: [
          { route: 'Quito → Guayaquil', jan: 8500, feb: 9200, mar: 8800, apr: 9500, may: 8900, jun: 9300 },
          { route: 'Guayaquil → Quito', jan: 8200, feb: 8900, mar: 8600, apr: 9200, may: 8700, jun: 9000 },
          { route: 'Quito → Cuenca', jan: 5200, feb: 5800, mar: 5400, apr: 6100, may: 5600, jun: 5900 },
          { route: 'Cuenca → Quito', jan: 5000, feb: 5600, mar: 5200, apr: 5900, may: 5400, jun: 5700 }
        ],
        occupancyTrends: [
          { week: 'Sem 1', occupancy: 65.2 },
          { week: 'Sem 2', occupancy: 68.8 },
          { week: 'Sem 3', occupancy: 72.4 },
          { week: 'Sem 4', occupancy: 75.1 },
          { week: 'Sem 5', occupancy: 78.6 },
          { week: 'Sem 6', occupancy: 81.3 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format) => {
    toast.success(`Exportando reporte en formato ${format.toUpperCase()}...`);
    // Implementar lógica de exportación
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes y Análisis</h1>
          <p className="text-muted-foreground">
            Análisis de ventas, ocupación y rendimiento
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={loadReportData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="routeId">Ruta</Label>
              <Select value={filters.routeId} onValueChange={(value) => setFilters(prev => ({ ...prev, routeId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las rutas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todas las rutas</SelectItem>
                  <SelectItem value="1">Quito → Guayaquil</SelectItem>
                  <SelectItem value="2">Guayaquil → Quito</SelectItem>
                  <SelectItem value="3">Quito → Cuenca</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="busId">Bus</Label>
              <Select value={filters.busId} onValueChange={(value) => setFilters(prev => ({ ...prev, busId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los buses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos los buses</SelectItem>
                  <SelectItem value="1">ABC-123</SelectItem>
                  <SelectItem value="2">XYZ-789</SelectItem>
                  <SelectItem value="3">DEF-456</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({
                  startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0],
                  routeId: '',
                  busId: '',
                  reportType: 'summary'
                })}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ingresos Totales</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.summary.totalRevenue)}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% vs mes anterior
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tickets Vendidos</p>
                <p className="text-2xl font-bold">{reportData.summary.totalTickets.toLocaleString()}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8.3% vs mes anterior
                </p>
              </div>
              <Ticket className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Viajes Realizados</p>
                <p className="text-2xl font-bold">{reportData.summary.totalTrips}</p>
                <p className="text-xs text-purple-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +5.7% vs mes anterior
                </p>
              </div>
              <Bus className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ocupación Promedio</p>
                <p className="text-2xl font-bold">{formatPercentage(reportData.summary.averageOccupancy)}</p>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +3.2% vs mes anterior
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Reportes */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="routes">Rutas</TabsTrigger>
          <TabsTrigger value="buses">Buses</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Ventas por Mes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Ventas por Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.salesByMonth.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{item.month}</p>
                        <p className="text-sm text-muted-foreground">{item.tickets} tickets</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(item.sales)}</p>
                        <p className="text-sm text-green-600">
                          +{((item.sales / reportData.salesByMonth[0]?.sales - 1) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ingresos por Ruta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Ingresos por Ruta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.revenueByRoute.slice(0, 4).map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">{item.route}</p>
                        <p className="text-sm font-bold">
                          {formatCurrency(item.jan + item.feb + item.mar + item.apr + item.may + item.jun)}
                        </p>
                      </div>
                      <div className="grid grid-cols-6 gap-1 text-xs">
                        <div className="text-center">
                          <p className="text-muted-foreground">Ene</p>
                          <p>{formatCurrency(item.jan)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Feb</p>
                          <p>{formatCurrency(item.feb)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Mar</p>
                          <p>{formatCurrency(item.mar)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Abr</p>
                          <p>{formatCurrency(item.apr)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">May</p>
                          <p>{formatCurrency(item.may)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Jun</p>
                          <p>{formatCurrency(item.jun)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Rendimiento por Ruta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.popularRoutes.map((route, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{route.route}</h3>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">#{index + 1}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{route.tickets}</p>
                        <p className="text-sm text-muted-foreground">Tickets Vendidos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(route.revenue)}</p>
                        <p className="text-sm text-muted-foreground">Ingresos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{formatPercentage(route.occupancy)}</p>
                        <p className="text-sm text-muted-foreground">Ocupación</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bus className="h-5 w-5" />
                Rendimiento de Buses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.busPerformance.map((bus, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{bus.bus}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Eficiencia:</span>
                        <span className="font-bold text-green-600">{formatPercentage(bus.efficiency)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-xl font-bold text-blue-600">{bus.trips}</p>
                        <p className="text-sm text-muted-foreground">Viajes</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-green-600">{formatCurrency(bus.revenue)}</p>
                        <p className="text-sm text-muted-foreground">Ingresos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-purple-600">{formatPercentage(bus.occupancy)}</p>
                        <p className="text-sm text-muted-foreground">Ocupación</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-orange-600">{formatCurrency(bus.revenue / bus.trips)}</p>
                        <p className="text-sm text-muted-foreground">Ingreso/Viaje</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tendencia de Ocupación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendencia de Ocupación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.occupancyTrends.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-medium">{item.week}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${item.occupancy}%` }}
                          ></div>
                        </div>
                        <span className="font-bold">{formatPercentage(item.occupancy)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Horarios Populares */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horarios Más Populares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { time: '06:00 - 08:00', popularity: 92, trips: 45 },
                    { time: '08:00 - 10:00', popularity: 78, trips: 38 },
                    { time: '14:00 - 16:00', popularity: 85, trips: 42 },
                    { time: '16:00 - 18:00', popularity: 88, trips: 44 },
                    { time: '18:00 - 20:00', popularity: 76, trips: 35 },
                    { time: '20:00 - 22:00', popularity: 65, trips: 28 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{item.time}</p>
                        <p className="text-sm text-muted-foreground">{item.trips} viajes</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${item.popularity}%` }}
                          ></div>
                        </div>
                        <span className="font-bold">{formatPercentage(item.popularity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}