import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ticketService } from '@/services';
import toast from 'react-hot-toast';
import { format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ticket, Calendar, MapPin, Download, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const response = await ticketService.getMyTickets();
      setTickets(response.data.data);
    } catch (error) {
      toast.error('Error al cargar los tickets');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTicket = async (ticketId) => {
    if (!confirm('¿Estás seguro de cancelar este ticket?')) return;

    try {
      await ticketService.cancel(ticketId);
      toast.success('Ticket cancelado');
      loadTickets();
    } catch (error) {
      toast.error('Error al cancelar el ticket');
      console.error(error);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      RESERVED: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      USED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      RESERVED: 'Reservado',
      CONFIRMED: 'Confirmado',
      USED: 'Usado',
      CANCELLED: 'Cancelado',
      EXPIRED: 'Expirado',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Cargando tickets...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mis Tickets</h1>
        <p className="text-gray-600">Gestiona tus boletos de viaje</p>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-4">No tienes tickets todavía</p>
            <Button onClick={() => window.location.href = '/'}>
              Buscar viajes
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-xl">
                        {ticket.trip?.route?.name}
                      </h3>
                      {getStatusBadge(ticket.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {(() => {
                            const raw = ticket.trip?.departureDate;
                            let d = null;
                            if (!raw) return 'Fecha no disponible';
                            try {
                              // try ISO parse first
                              d = typeof raw === 'string' ? parseISO(raw) : new Date(raw);
                            } catch (e) {
                              d = new Date(raw);
                            }
                            if (!isValid(d)) return 'Fecha no disponible';
                            return `${format(d, 'PPP', { locale: es })} • ${ticket.trip?.departureTime || ''}`;
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{ticket.boardingStop} → {ticket.dropoffStop}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Asiento: </span>
                        <span className="font-semibold">{ticket.seatNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Pasajero: </span>
                        <span className="font-semibold">{ticket.passengerName}</span>
                      </div>
                    </div>

                    <div className="mt-3 text-lg font-bold text-primary">
                      ${Number(ticket.price || 0).toFixed(2)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => setSelectedTicket(ticket)}
                      variant="outline"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Ver QR
                    </Button>
                    {ticket.status === 'RESERVED' && (
                      <Button
                        onClick={() => handleCancelTicket(ticket.id)}
                        variant="destructive"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal QR */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Código QR del Ticket</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="flex flex-col items-center gap-4 py-4">
              <QRCodeSVG
                value={selectedTicket.qrCode}
                size={256}
                level="H"
                includeMargin
              />
              <div className="text-center space-y-2">
                <p className="font-semibold text-lg">{selectedTicket.trip?.route?.name}</p>
                <p className="text-sm text-gray-600">
                  Asiento: {selectedTicket.seatNumber}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedTicket.passengerName}
                </p>
                <p className="text-xs text-gray-500 mt-4">
                  Presenta este código al abordar el bus
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
