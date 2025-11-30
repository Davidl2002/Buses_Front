import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { 
  Armchair, 
  CircleDot, 
  X, 
  RotateCcw,
  Crown,
  Users
} from 'lucide-react';

const SEAT_TYPES = {
  NORMAL: { label: 'Normal', color: 'bg-blue-500', icon: Armchair, price: 1.0 },
  VIP: { label: 'VIP', color: 'bg-purple-500', icon: Crown, price: 1.5 },
  SEMI_CAMA: { label: 'Semi Cama', color: 'bg-green-500', icon: Users, price: 1.3 }
};

export default function SeatDesigner({ initialLayout, onLayoutChange, readOnly = false, maxSeats }) {
  const columns = 5; // columnas fijas, la del medio es pasillo
  const [rows, setRows] = useState(initialLayout?.rows || Math.ceil((initialLayout?.totalSeats || 40) / (columns - 1)));
  const [seats, setSeats] = useState(initialLayout?.seats || []);
  const [selectedType, setSelectedType] = useState('NORMAL');
  const [hasSecondFloor, setHasSecondFloor] = useState(false);

  useEffect(() => {
    if (initialLayout && (initialLayout.seats?.length > 0 || initialLayout.piso1 || initialLayout.piso2)) {
        if (initialLayout.piso1 || initialLayout.piso2) {
        // 2 pisos
        const allSeats = [...(initialLayout.piso1 || []), ...(initialLayout.piso2 || [])];
        setSeats(allSeats);
        setRows(initialLayout.rows || Math.ceil(initialLayout.totalSeats / (columns - 1)));
        setHasSecondFloor(true);
      } else {
        setSeats(initialLayout.seats);
        setRows(initialLayout.rows || Math.ceil(initialLayout.totalSeats / (columns - 1)));
        setHasSecondFloor(false);
      }
    } else if (initialLayout?.totalSeats) {
      // Si no hay asientos, inicia vacío y deja agregar hasta el total
      setSeats([]);
      setRows(Math.ceil(initialLayout.totalSeats / (columns - 1)));
      setHasSecondFloor(false);
    } else {
      setSeats([]);
      setRows(Math.ceil(40 / (columns - 1)));
      setHasSecondFloor(false);
    }
  }, [initialLayout]);

  const generateDefaultLayout = (seatCount) => {
    const newSeats = [];
    let seatNumber = 1;
    const floors = hasSecondFloor ? 2 : 1;
    const seatsPerFloor = Math.ceil(seatCount / floors);
    const rowsPerFloor = Math.ceil(seatsPerFloor / (columns - 1));
    setRows(rowsPerFloor);
    for (let floor = 0; floor < floors; floor++) {
      let seatsAdded = 0;
      for (let row = 0; row < rowsPerFloor; row++) {
        for (let col = 0; col < columns; col++) {
          if (col === 2) continue; // pasillo
          if (seatsAdded >= seatsPerFloor) break;
          newSeats.push({
            number: seatNumber++,
            row,
            col,
            floor,
            type: 'NORMAL',
            isAvailable: true
          });
          seatsAdded++;
        }
      }
    }
    setSeats(newSeats);
    notifyChange(newSeats, rowsPerFloor);
  };

  const notifyChange = (updatedSeats, newRows = rows) => {
    if (onLayoutChange) {
      if (hasSecondFloor) {
        // Agrupar por piso
        const piso1 = updatedSeats.filter(s => s.floor === 0);
        const piso2 = updatedSeats.filter(s => s.floor === 1);
        onLayoutChange({
          rows: newRows,
          columns,
          piso1,
          piso2,
          totalSeats: updatedSeats.length
        });
      } else {
        onLayoutChange({
          rows: newRows,
          columns,
          seats: updatedSeats,
          totalSeats: updatedSeats.length
        });
      }
    }
  };

  // Eliminar handleTotalSeatsChange, ya no se usa

  const toggleSeat = (row, col, floor) => {
    const existingSeatIndex = seats.findIndex(
      s => s.row === row && s.col === col && s.floor === floor
    );

    let updatedSeats;
    const maxSeatsUsed = maxSeats || initialLayout?.totalSeats || 40;

    if (existingSeatIndex >= 0) {
      // Remover asiento
      updatedSeats = seats.filter((_, index) => index !== existingSeatIndex);
    } else {
      // Solo agregar si no se ha alcanzado el máximo
      if (seats.length >= maxSeatsUsed) return;
      updatedSeats = [
        ...seats,
        {
          number: 0, // temporal, se renumera abajo
          row,
          col,
          floor,
          type: selectedType,
          isAvailable: true
        }
      ];
    }
    // Renumerar siempre desde 1
    updatedSeats = updatedSeats.map((seat, index) => ({
      ...seat,
      number: index + 1
    }));
    setSeats(updatedSeats);
    notifyChange(updatedSeats);
  };

  const changeSeatType = (seatNumber, newType) => {
    const updatedSeats = seats.map(seat =>
      seat.number === seatNumber ? { ...seat, type: newType } : seat
    );
    setSeats(updatedSeats);
    notifyChange(updatedSeats);
  };

  const resetLayout = () => {
    if (confirm('¿Estás seguro de resetear todo el diseño?')) {
      generateDefaultLayout(seats.length);
    }
  };

  const getSeat = (row, col, floor) => {
    return seats.find(s => s.row === row && s.col === col && s.floor === floor);
  };

  // Permitir click en espacios vacíos si no se ha alcanzado el máximo de asientos
  const canAddSeat = () => {
    const limit = maxSeats || initialLayout?.totalSeats || 40;
    return seats.length < limit;
  };

  const renderSeat = (row, col, floor) => {
    const seat = getSeat(row, col, floor);
    if (!seat) {
      // Espacio vacío, permite agregar asiento del tipo seleccionado
      if (readOnly) {
        return <div className="w-12 h-12 border-2 border-dashed border-gray-200 rounded flex items-center justify-center" />;
      }
      return canAddSeat() ? (
        <button
          onClick={() => toggleSeat(row, col, floor)}
          className={`w-12 h-12 border-2 border-dashed border-gray-300 rounded hover:border-blue-400 hover:bg-blue-50 transition flex items-center justify-center`}
          title={`Agregar asiento tipo ${SEAT_TYPES[selectedType].label}`}
          disabled={readOnly}
        >
          <CircleDot className="w-4 h-4 text-gray-400" />
        </button>
      ) : (
        <div className="w-12 h-12 border-2 border-dashed border-gray-200 rounded flex items-center justify-center opacity-50 cursor-not-allowed" />
      );
    }
    const typeInfo = SEAT_TYPES[seat.type];
    const Icon = typeInfo.icon;
    return (
      <div className="relative group">
        <button
          className={`w-12 h-12 rounded ${typeInfo.color} text-white font-bold flex flex-col items-center justify-center transition shadow-md ${readOnly ? 'opacity-80 cursor-default' : 'hover:opacity-80'}`}
          title={`${seat.number} - ${typeInfo.label}`}
          disabled={readOnly}
          onClick={() => {
            if (readOnly) return;
            // Ciclar tipos al hacer click sobre un asiento existente
            const types = Object.keys(SEAT_TYPES);
            const currentIndex = types.indexOf(seat.type);
            const nextIndex = (currentIndex + 1) % types.length;
            changeSeatType(seat.number, types[nextIndex]);
          }}
        >
          <Icon className="w-5 h-5" />
          <span className="text-xs">{seat.number}</span>
        </button>
        {!readOnly && (
          <button
            onClick={() => toggleSeat(row, col, floor)}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
            title="Eliminar asiento"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  const renderFloor = (floorNumber) => (
    <div key={floorNumber} className="space-y-2">
      {hasSecondFloor && (
        <div className="text-center font-semibold text-gray-700 mb-3">
          {floorNumber === 0 ? '🚌 Planta Baja' : '🚌 Planta Alta'}
        </div>
      )}
      
      <div className="bg-gray-100 rounded-lg p-4 inline-block">
        <div className="mb-4 text-center">
          <div className="inline-block bg-gray-800 text-white px-6 py-2 rounded-t-lg font-semibold">
            🚗 CONDUCTOR
          </div>
        </div>

        <div className="space-y-2">
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className="flex gap-2 items-center">
              <span className="text-xs text-gray-500 w-4">{row + 1}</span>
              {Array.from({ length: columns }, (_, col) => (
                <div key={col}>
                  {col === 2 ? (
                    <div className="w-12 h-12 flex items-center justify-center text-gray-400 text-xs">
                      | |
                    </div>
                  ) : (
                    renderSeat(row, col, floorNumber)
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <div className="inline-block bg-gray-300 px-6 py-2 rounded-b-lg text-xs text-gray-600">
            Puerta trasera
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="columns">Columnas</Label>
              <Input
                id="columns"
                type="number"
                value={columns}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <Label htmlFor="seatType">Tipo de Asiento</Label>
              <select
                id="seatType"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 px-3"
                disabled={readOnly}
              >
                {Object.entries(SEAT_TYPES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="secondFloor"
                checked={hasSecondFloor}
                onChange={(e) => setHasSecondFloor(e.target.checked)}
                className="w-4 h-4"
                disabled={readOnly}
              />
              <Label htmlFor="secondFloor">Bus de 2 pisos</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={resetLayout} variant="outline" className="flex-1" disabled={readOnly}>
                Resetear
              </Button>
            </div>
          </div>

          {/* Leyenda */}
          <div className="mt-6 flex flex-wrap gap-4 items-center justify-center">
            {Object.entries(SEAT_TYPES).map(([key, value]) => {
              const Icon = value.icon;
              return (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-8 h-8 ${value.color} rounded flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium">
                    {value.label} (×{value.price})
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Diseño de Asientos */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-8">
            {Array.from({ length: hasSecondFloor ? 2 : 1 }, (_, floor) => 
              renderFloor(floor)
            )}
          </div>

          <div className="mt-6 text-center">
            <div className="inline-block bg-blue-50 border border-blue-200 rounded-lg px-6 py-3">
              <p className="text-sm font-semibold text-blue-900">
                Total de Asientos: {seats.length}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Normal: {seats.filter(s => s.type === 'NORMAL').length} | 
                VIP: {seats.filter(s => s.type === 'VIP').length} | 
                Semi Cama: {seats.filter(s => s.type === 'SEMI_CAMA').length}
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            💡 Haz clic en un asiento para cambiar su tipo. Haz clic en la X para eliminarlo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
