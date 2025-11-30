import { useState, useEffect } from 'react';
import TripSearch from '@/components/public/TripSearch';
import SeatSelection from '@/components/public/SeatSelection';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { tripService } from '@/services';

export default function Home() {
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [completedBooking, setCompletedBooking] = useState(null);

  const handleSelectTrip = (trip) => {
    // Obtener detalles completos del viaje (incluye bus, route, paradas, etc.)
    const fetchFull = async () => {
      try {
        const res = await tripService.getPublicById(trip.id);
        const full = res.data?.data || res.data || trip;
        setSelectedTrip(full);
        setBookingComplete(false);
        setCompletedBooking(null);
      } catch (err) {
        console.error('Error loading full trip details:', err);
        // fallback al objeto recibido
        setSelectedTrip(trip);
        setBookingComplete(false);
        setCompletedBooking(null);
      }
    };
    fetchFull();
    setBookingComplete(false);
    setCompletedBooking(null);
  };

  // Si existe pendingPurchase en sessionStorage, intentar recuperar el viaje y abrir selección
  useEffect(() => {
    const resume = async () => {
      try {
        const pending = sessionStorage.getItem('pendingPurchase');
        if (!pending) return;
        const parsed = JSON.parse(pending);
        if (!parsed?.tripId) return;
        const res = await tripService.getPublicById(parsed.tripId);
        const tripData = res.data?.data || res.data;
        if (tripData) {
          setSelectedTrip(tripData);
        }
      } catch (err) {
        console.error('Error resuming pendingPurchase in Home:', err);
      }
    };

    resume();
  }, []);

  const handleBack = () => {
    setSelectedTrip(null);
    setBookingComplete(false);
    setCompletedBooking(null);
  };

  const handleBookingComplete = (booking) => {
    setCompletedBooking(booking);
    setBookingComplete(true);
  };

  const handleNewSearch = () => {
    setSelectedTrip(null);
    setBookingComplete(false);
    setCompletedBooking(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            MoviPass
          </h1>
          <p className="text-xl md:text-2xl opacity-90">
            Tu boleto a cualquier destino del Ecuador
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!selectedTrip && !bookingComplete && (
          <TripSearch onSelectTrip={handleSelectTrip} />
        )}
        
        {selectedTrip && !bookingComplete && (
          <SeatSelection
            trip={selectedTrip}
            onBack={handleBack}
            onBookingComplete={handleBookingComplete}
          />
        )}

        {bookingComplete && completedBooking && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                ¡Reserva Completada!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Número de Ticket</p>
                  <p className="font-mono text-lg">{completedBooking.ticketNumber || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Asiento</p>
                  <p className="text-lg">#{completedBooking.seatNumber}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ruta</p>
                  <p className="text-lg">{selectedTrip.origin} → {selectedTrip.destination}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Horario</p>
                  <p className="text-lg">{selectedTrip.frequency?.departureTime || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pasajero</p>
                  <p className="text-lg">{completedBooking.passengerName}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <p className="text-lg text-green-600 font-medium">CONFIRMADO</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Se ha enviado un email de confirmación con todos los detalles de tu viaje.
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleNewSearch} className="flex-1">
                    Nueva búsqueda
                  </Button>
                  <Button variant="outline">
                    Descargar ticket
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
