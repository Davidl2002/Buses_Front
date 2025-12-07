import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ticketService, tripService } from '@/services';
import toast from 'react-hot-toast';
import { Ticket, QrCode, FileText, TrendingUp, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function OficinistaDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    ventasHoy: 0,
    ticketsHoy: 0,
    proximosViajes: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');

      // Obtener tickets vendidos hoy
      const ticketsResponse = await ticketService.getAll({ date: today });
      const ticketsData = ticketsResponse.data?.data || ticketsResponse.data || [];
      const tickets = Array.isArray(ticketsData) ? ticketsData : [];

      // Calcular estadísticas
      const ventasHoy = tickets.reduce((sum, ticket) => sum + (parseFloat(ticket.price) || 0), 0);

      // Obtener próximos viajes
      const tripsResponse = await tripService.getAll();
      const tripsData = tripsResponse.data?.data || tripsResponse.data || [];
      const trips = Array.isArray(tripsData) ? tripsData : [];
      
      // Filtrar viajes de hoy y futuros
      const proximosViajes = trips
        .filter(trip => {
          const tripDate = new Date(trip.date);
          const now = new Date();
          return tripDate >= now;
        })
        .slice(0, 5);

      setStats({
        ventasHoy,
        ticketsHoy: tickets.length,
        proximosViajes
      });
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Panel de Oficina</h1>
        <p className="text-muted-foreground">Gestión de ventas y atención al cliente</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ventas Hoy</p>
                <p className="text-3xl font-bold">${stats.ventasHoy.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tickets Vendidos</p>
                <p className="text-3xl font-bold">{stats.ticketsHoy}</p>
              </div>
              <Ticket className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Próximos Viajes</p>
                <p className="text-3xl font-bold">{stats.proximosViajes.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => navigate('/oficinista/vender-ticket')}
              size="lg"
              className="h-24 flex-col gap-2"
            >
              <Ticket className="h-8 w-8" />
              <span>Vender Ticket</span>
            </Button>

            <Button
              onClick={() => navigate('/oficinista/mis-ventas')}
              variant="outline"
              size="lg"
              className="h-24 flex-col gap-2"
            >
              <FileText className="h-8 w-8" />
              <span>Mis Ventas</span>
            </Button>

            <Button
              onClick={() => navigate('/oficinista/validar-qr')}
              variant="outline"
              size="lg"
              className="h-24 flex-col gap-2"
            >
              <QrCode className="h-8 w-8" />
              <span>Validar QR</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Próximos Viajes */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Viajes Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.proximosViajes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay viajes próximos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.proximosViajes.map((trip) => (
                <div
                  key={trip.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {trip.frequency?.route?.origin} → {trip.frequency?.route?.destination}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(trip.date), "dd 'de' MMMM", { locale: es })}
                        </span>
                        <span>{trip.departureTime}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate(`/oficinista/vender-ticket?tripId=${trip.id}`)}
                      size="sm"
                    >
                      Vender Ticket
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
