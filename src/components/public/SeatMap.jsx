import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ticketService } from '@/services';
import toast from 'react-hot-toast';
import { Armchair, X } from 'lucide-react';

export default function SeatMap({ trip, onSeatSelect, selectedSeat }) {
  const [seatMap, setSeatMap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeatMap();
  }, [trip.id]);

  const loadSeatMap = async () => {
    try {
      const response = await ticketService.getSeatMap(trip.id);
      setSeatMap(response.data.data);
    } catch (error) {
      toast.error('Error al cargar el mapa de asientos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando asientos...</div>;
  }

  if (!seatMap) {
    return <div className="text-center py-8">No se pudo cargar el mapa de asientos</div>;
  }

  const getSeatColor = (seat) => {
    if (!seat.isAvailable) return 'bg-gray-300 cursor-not-allowed';
    if (selectedSeat === seat.number) return 'bg-blue-500 text-white';
    if (seat.type === 'VIP') return 'bg-purple-100 hover:bg-purple-200';
    return 'bg-green-100 hover:bg-green-200';
  };

  const getSeatIcon = (seat) => {
    return <Armchair className="h-5 w-5" />;
  };

  // Organizar asientos por fila
  const rows = seatMap.seatLayout?.rows || 10;
  const columns = seatMap.seatLayout?.columns || 4;
  const seats = seatMap.seatLayout?.seats || [];

  const seatGrid = Array.from({ length: rows }, (_, rowIndex) => {
    return seats.filter(seat => seat.row === rowIndex);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Seleccione su asiento</span>
          <span className="text-sm font-normal text-gray-600">
            Bus: {trip.bus?.placa}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
              <Armchair className="h-4 w-4" />
            </div>
            <span className="text-sm">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
              <Armchair className="h-4 w-4" />
            </div>
            <span className="text-sm">VIP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 text-white rounded flex items-center justify-center">
              <Armchair className="h-4 w-4" />
            </div>
            <span className="text-sm">Seleccionado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
              <X className="h-4 w-4" />
            </div>
            <span className="text-sm">Ocupado</span>
          </div>
        </div>

        {/* Mapa de asientos */}
        <div className="bg-white p-6 rounded-lg border">
          {/* Conductor */}
          <div className="mb-6 flex justify-end">
            <div className="w-12 h-12 bg-gray-700 rounded-t-full flex items-center justify-center text-white text-xs">
              🚗
            </div>
          </div>

          {/* Grid de asientos */}
          <div className="space-y-3">
            {seatGrid.map((rowSeats, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-2">
                {/* Primera mitad (izquierda) */}
                <div className="flex gap-2">
                  {rowSeats
                    .filter(seat => seat.col < columns / 2)
                    .sort((a, b) => a.col - b.col)
                    .map(seat => (
                      <button
                        key={seat.number}
                        onClick={() => seat.isAvailable && onSeatSelect(seat.number)}
                        disabled={!seat.isAvailable}
                        className={`w-12 h-12 rounded flex flex-col items-center justify-center text-xs font-semibold transition-all ${getSeatColor(seat)}`}
                        title={`Asiento ${seat.number} ${seat.type === 'VIP' ? '(VIP)' : ''}`}
                      >
                        {getSeatIcon(seat)}
                        <span className="text-[10px] mt-1">{seat.number}</span>
                      </button>
                    ))}
                </div>

                {/* Pasillo */}
                <div className="w-8"></div>

                {/* Segunda mitad (derecha) */}
                <div className="flex gap-2">
                  {rowSeats
                    .filter(seat => seat.col >= columns / 2)
                    .sort((a, b) => a.col - b.col)
                    .map(seat => (
                      <button
                        key={seat.number}
                        onClick={() => seat.isAvailable && onSeatSelect(seat.number)}
                        disabled={!seat.isAvailable}
                        className={`w-12 h-12 rounded flex flex-col items-center justify-center text-xs font-semibold transition-all ${getSeatColor(seat)}`}
                        title={`Asiento ${seat.number} ${seat.type === 'VIP' ? '(VIP)' : ''}`}
                      >
                        {getSeatIcon(seat)}
                        <span className="text-[10px] mt-1">{seat.number}</span>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedSeat && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-center font-semibold text-blue-900">
              Asiento seleccionado: <span className="text-2xl">{selectedSeat}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
