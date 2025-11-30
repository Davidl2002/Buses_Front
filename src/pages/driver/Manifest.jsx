import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { operationService } from '@/services';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Users, CheckCircle, Clock } from 'lucide-react';
import { useParams } from 'react-router-dom';

export default function DriverManifest() {
  const { tripId } = useParams();
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadManifest();
  }, [tripId]);

  const loadManifest = async () => {
    try {
      const response = await operationService.getManifest(tripId);
      setManifest(response.data.data);
    } catch (error) {
      toast.error('Error al cargar el manifiesto');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando manifiesto...</div>;
  }

  if (!manifest) {
    return <div className="text-center py-8">No se encontró el manifiesto</div>;
  }

  const usedTickets = manifest.tickets?.filter(t => t.status === 'USED').length || 0;
  const confirmedTickets = manifest.tickets?.filter(t => t.status === 'CONFIRMED').length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Manifiesto de Pasajeros</h1>
        <p className="text-gray-600">
          {manifest.trip?.frequency?.route?.name || 
           `${manifest.trip?.frequency?.route?.origin || ''} - ${manifest.trip?.frequency?.route?.destination || ''}`}
        </p>
      </div>

      {/* Información del viaje */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Pasajeros</p>
                <p className="text-3xl font-bold">{manifest.tickets?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Abordados</p>
                <p className="text-3xl font-bold">{usedTickets}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pendientes</p>
                <p className="text-3xl font-bold">{confirmedTickets}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de pasajeros */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pasajeros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Asiento</th>
                  <th className="text-left p-3">Pasajero</th>
                  <th className="text-left p-3">Cédula</th>
                  <th className="text-left p-3">Aborda</th>
                  <th className="text-left p-3">Desciende</th>
                  <th className="text-left p-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {manifest.tickets?.map((ticket) => (
                  <tr key={ticket.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold">{ticket.seatNumber}</td>
                    <td className="p-3">{ticket.passengerName}</td>
                    <td className="p-3">{ticket.passengerCedula}</td>
                    <td className="p-3">{ticket.boardingStop}</td>
                    <td className="p-3">{ticket.dropoffStop}</td>
                    <td className="p-3">
                      {ticket.status === 'USED' ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          Abordado
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                          Pendiente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Viaje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Fecha</p>
              <p className="font-semibold">
                {manifest.trip?.date 
                  ? format(new Date(manifest.trip.date), 'PPP', { locale: es })
                  : 'Fecha no disponible'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Hora de salida</p>
              <p className="font-semibold">{manifest.trip?.departureTime || manifest.trip?.frequency?.departureTime || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bus</p>
              <p className="font-semibold">
                {manifest.trip?.bus?.placa || manifest.trip?.bus?.plate || 'N/A'}
                {manifest.trip?.bus?.numeroInterno && ` (${manifest.trip.bus.numeroInterno})`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Chofer</p>
              <p className="font-semibold">
                {manifest.trip?.driver?.firstName || manifest.trip?.driver?.nombre || ''} {manifest.trip?.driver?.lastName || manifest.trip?.driver?.apellido || ''}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
