import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripService } from '@/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { MapPin, Calendar, Clock, Users, FileText, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MyTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, in_progress, completed
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyTrips();
  }, [filter]);

  const fetchMyTrips = async () => {
    try {
      setLoading(true);
      
      // Obtener todos los viajes del chofer
      const response = await tripService.getMyTrips();
      
      // Extraer el array de datos de la respuesta
      // El backend puede devolver: { data: [...] } o directamente [...]
      let data = [];
      if (response?.data?.data) {
        data = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        data = response.data;
      } else if (Array.isArray(response)) {
        data = response;
      }
      
      // Filtrar según el estado seleccionado
      let filtered = data;
      if (filter === 'upcoming') {
        filtered = data.filter(trip => trip.status === 'SCHEDULED');
      } else if (filter === 'in_progress') {
        filtered = data.filter(trip => trip.status === 'IN_PROGRESS');
      } else if (filter === 'completed') {
        filtered = data.filter(trip => trip.status === 'COMPLETED');
      }
      // Si filter === 'all', no filtramos
      
      setTrips(filtered);
    } catch (error) {
      console.error('Error al cargar viajes:', error);
      toast.error('Error al cargar tus viajes');
      setTrips([]); // Asegurar que trips sea un array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      SCHEDULED: 'default',
      IN_PROGRESS: 'secondary',
      COMPLETED: 'outline',
      CANCELLED: 'destructive'
    };

    const labels = {
      SCHEDULED: 'Programado',
      IN_PROGRESS: 'En Curso',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado'
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const handleViewManifest = (tripId) => {
    navigate(`/driver/manifest/${tripId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando viajes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mis Viajes</h1>
        <p className="text-muted-foreground">
          Gestiona tus viajes asignados y accede a los manifiestos
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Todos
        </Button>
        <Button
          variant={filter === 'upcoming' ? 'default' : 'outline'}
          onClick={() => setFilter('upcoming')}
        >
          Próximos
        </Button>
        <Button
          variant={filter === 'in_progress' ? 'default' : 'outline'}
          onClick={() => setFilter('in_progress')}
        >
          En Curso
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
        >
          Completados
        </Button>
      </div>

      {/* Lista de Viajes */}
      {!trips || trips.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No hay viajes</h3>
            <p className="text-muted-foreground">
              {filter === 'upcoming'
                ? 'No tienes viajes próximos programados'
                : filter === 'in_progress'
                ? 'No tienes viajes en curso'
                : filter === 'completed'
                ? 'No tienes viajes completados'
                : 'No tienes viajes asignados'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <Card key={trip.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {trip.frequency?.route?.origin || trip.route?.origin || 'Origen'} - {trip.frequency?.route?.destination || trip.route?.destination || 'Destino'}
                    </CardTitle>
                    <CardDescription>
                      {trip.bus?.placa || trip.bus?.plate || 'N/A'} • {trip.bus?.numeroInterno || trip.bus?.model || ''}
                    </CardDescription>
                  </div>
                  {getStatusBadge(trip.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Fecha */}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {trip.date 
                        ? format(new Date(trip.date), "dd 'de' MMMM, yyyy", { locale: es })
                        : trip.departureDate 
                        ? format(new Date(trip.departureDate), "dd 'de' MMMM, yyyy", { locale: es })
                        : 'Fecha no disponible'
                      }
                    </span>
                  </div>

                  {/* Hora */}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{trip.departureTime || trip.frequency?.departureTime || 'N/A'}</span>
                  </div>

                  {/* Pasajeros */}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {trip._count?.tickets || trip.soldSeats || 0} / {trip.bus?.capacity || 0} pasajeros
                    </span>
                  </div>

                  {/* Cooperativa */}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">
                      {trip.cooperativa?.name || trip.cooperativa?.nombre || 'N/A'}
                    </span>
                  </div>

                  {/* Botón de acción */}
                  <Button
                    className="w-full mt-4"
                    onClick={() => handleViewManifest(trip.id)}
                    disabled={trip.status === 'CANCELLED'}
                  >
                    {trip.status === 'COMPLETED' ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Ver Resumen
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Ver Manifiesto
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
