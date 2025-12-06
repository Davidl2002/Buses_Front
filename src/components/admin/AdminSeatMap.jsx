import { useState, useEffect } from 'react';
import { ticketService } from '@/services';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';

export default function AdminSeatMap({ trip, onSeatSelect, selectedSeat }) {
  const [seatMap, setSeatMap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (trip?.id) {
      loadSeatMap();
    }
  }, [trip?.id]);

  const loadSeatMap = async () => {
    try {
      setLoading(true);
      console.log('Loading seat map for trip:', trip.id);
      const response = await ticketService.getSeatMap(trip.id);
      console.log('Seat map full response:', response);
      console.log('Seat map response.data:', response.data);
      
      // Manejar diferentes estructuras de respuesta
      const data = response.data?.data || response.data || {};
      console.log('Parsed data:', data);
      
      // Normalizar estructura - el backend devuelve rows, columns, seats directamente
      const normalizedData = {
        seatLayout: {
          rows: data.rows || data.rowCount,
          cols: data.columns || data.cols,
          seats: data.seats || []
        },
        occupiedSeats: data.occupiedSeats || []
      };
      
      console.log('Normalized data:', normalizedData);
      setSeatMap(normalizedData);
    } catch (error) {
      console.error('Error loading seat map:', error);
      toast.error('Error al cargar el mapa de asientos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Cargando asientos...</div>;
  }

  if (!seatMap || !seatMap.seatLayout) {
    return <div className="text-center py-8 text-gray-500">No se pudo cargar el mapa de asientos</div>;
  }

  const layout = seatMap.seatLayout;
  const rows = layout.rows || layout.rowCount || 0;
  const columns = layout.cols || layout.columns || layout.colCount || 4;
  let seats = layout.seats || [];
  const occupied = seatMap.occupiedSeats || [];

  console.log('Parsed seat map:', { rows, columns, seatsCount: seats.length, occupied });

  // Si no hay asientos, mostrar mensaje
  if (seats.length === 0) {
    return <div className="text-center py-8 text-gray-500">Este bus no tiene asientos configurados</div>;
  }

  // Normalizar asientos
  seats = seats.map(s => ({
    ...s,
    number: s.number ?? s.n ?? s.seatNumber ?? s.id,
    row: s.row ?? s.r ?? s.rowIndex ?? 0,
    col: s.col ?? s.c ?? s.colIndex ?? 0,
    floor: s.floor ?? 0,
    type: s.type || s.seatType || 'NORMAL'
  }));

  // Si faltan posiciones, inferirlas
  const missingPosition = seats.some(s => s.row === undefined || s.col === undefined);
  if (columns > 0 && missingPosition) {
    seats = seats.map((s, idx) => ({
      ...s,
      row: s.row ?? Math.floor(idx / columns),
      col: s.col ?? (idx % columns)
    }));
  }

  // Detección automática de dos pisos
  if (seats.length > 0 && !seats.some(s => s.floor === 1)) {
    const positionMap = new Map();
    seats.forEach(seat => {
      const key = `${seat.row}-${seat.col}`;
      if (!positionMap.has(key)) {
        positionMap.set(key, []);
      }
      positionMap.get(key).push(seat);
    });
    
    const hasDuplicates = Array.from(positionMap.values()).some(seatList => seatList.length > 1);
    
    if (hasDuplicates) {
      const floorAssigned = new Map();
      seats = seats.map(seat => {
        const key = `${seat.row}-${seat.col}`;
        const currentCount = floorAssigned.get(key) || 0;
        floorAssigned.set(key, currentCount + 1);
        return { ...seat, floor: currentCount };
      });
    }
  }

  // Normalizar tipos
  const normalizeType = (raw) => {
    if (!raw) return 'NORMAL';
    const t = String(raw).toUpperCase().replace(/[-\s]/g, '_');
    if (t.includes('VIP')) return 'VIP';
    if (t.includes('SEMI') || t.includes('CAMA')) return 'SEMI_CAMA';
    return 'NORMAL';
  };

  const effectiveRows = rows || (seats.length > 0 ? Math.max(...seats.map(s => s.row || 0)) + 1 : 0);

  seats = seats.map(s => {
    const type = normalizeType(s.type);
    // Si no tiene tipo, asignar por fila
    if (!s.type && typeof s.row === 'number' && effectiveRows > 0) {
      if (s.row === 0) return { ...s, type: 'VIP' };
      if (s.row >= effectiveRows - 1) return { ...s, type: 'SEMI_CAMA' };
    }
    return { ...s, type };
  });

  // Marcar ocupados
  const occupiedSet = new Set(occupied.map(x => String(x)));
  seats = seats.map(s => ({
    ...s,
    isOccupied: occupiedSet.has(String(s.number))
  }));

  const floor0Seats = seats.filter(s => (s.floor ?? 0) === 0);
  const floor1Seats = seats.filter(s => s.floor === 1);
  const hasTwoFloors = floor1Seats.length > 0;

  console.log('Floor detection:', { 
    totalSeats: seats.length, 
    floor0Count: floor0Seats.length, 
    floor1Count: floor1Seats.length, 
    hasTwoFloors,
    sampleSeats: seats.slice(0, 5).map(s => ({ number: s.number, floor: s.floor, row: s.row, col: s.col }))
  });

  const getSeatColor = (seat, isSelected) => {
    if (seat.isOccupied) return 'bg-gray-400 text-gray-700 cursor-not-allowed';
    if (isSelected) return 'bg-blue-500 text-white border-2 border-blue-700';
    if (seat.type === 'VIP') return 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500';
    if (seat.type === 'SEMI_CAMA') return 'bg-purple-400 text-purple-900 hover:bg-purple-500';
    return 'bg-green-400 text-green-900 hover:bg-green-500';
  };

  const getSeatIcon = (seat) => {
    if (seat.isOccupied) return '✕';
    if (seat.type === 'VIP') return '👑';
    if (seat.type === 'SEMI_CAMA') return '🛏️';
    return '💺';
  };

  const renderFloor = (floorSeats, floorLabel, bgColor, floorIndex) => {
    const maxRow = floorSeats.length > 0 ? Math.max(...floorSeats.map(s => s.row || 0)) + 1 : effectiveRows;
    const effectiveCols = columns || 4;

    return (
      <div>
        <div className="mb-2 text-center">
          <div className={`inline-block ${bgColor} text-white px-4 py-1 rounded text-sm font-semibold`}>
            🚗 {floorLabel}
          </div>
        </div>
        <div className="space-y-1">
          {Array.from({ length: maxRow }).map((_, row) => (
            <div key={`floor${floorIndex}-row${row}`} className="flex gap-1 justify-center">
              {Array.from({ length: effectiveCols }).map((__, col) => {
                // Pasillo en columna 2
                if (col === 2) {
                  return <div key={`floor${floorIndex}-row${row}-col${col}-aisle`} className="w-10 h-10 flex items-center justify-center text-gray-400 text-xs">||</div>;
                }
                const seat = floorSeats.find(s => s.row === row && s.col === col);
                if (!seat) return <div key={`floor${floorIndex}-row${row}-col${col}-empty`} className="w-10 h-10" />;
                const isSelected = String(selectedSeat) === String(seat.number);
                return (
                  <button
                    key={`floor${floorIndex}-seat${seat.number}`}
                    type="button"
                    onClick={() => !seat.isOccupied && onSeatSelect(seat.number)}
                    disabled={seat.isOccupied}
                    className={`w-10 h-10 rounded text-xs font-medium flex flex-col items-center justify-center transition ${getSeatColor(seat, isSelected)}`}
                    title={`Asiento ${seat.number} - ${seat.type}${seat.isOccupied ? ' (Ocupado)' : ''}`}
                  >
                    <span className="text-lg">{getSeatIcon(seat)}</span>
                    <span className="text-[9px]">{seat.number}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {hasTwoFloors ? (
        <div className="grid grid-cols-2 gap-4">
          {renderFloor(floor0Seats, 'Piso 1', 'bg-blue-600', 0)}
          {renderFloor(floor1Seats, 'Piso 2', 'bg-purple-600', 1)}
        </div>
      ) : (
        renderFloor(floor0Seats, 'Bus', 'bg-blue-600', 0)
      )}

      {/* Leyenda */}
      <div className="mt-4 pt-3 border-t flex flex-wrap gap-3 justify-center text-xs">
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 bg-green-400 rounded flex items-center justify-center">💺</div>
          <span>Normal</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 bg-yellow-400 rounded flex items-center justify-center">👑</div>
          <span>VIP</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 bg-purple-400 rounded flex items-center justify-center">🛏️</div>
          <span>Semi Cama</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 bg-gray-400 rounded flex items-center justify-center">✕</div>
          <span>Ocupado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 bg-blue-500 border-2 border-blue-700 rounded flex items-center justify-center text-white">✓</div>
          <span>Seleccionado</span>
        </div>
      </div>
    </div>
  );
}
