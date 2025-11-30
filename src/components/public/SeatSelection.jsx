import { useState, useEffect, useCallback } from 'react';
import { busService, tripService } from '@/services';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, MapPin, Clock, CreditCard, User, Mail, FileText, Armchair, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ticketService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SeatSelection({ trip, onBack, onBookingComplete }) {
  const { user } = useAuth();
  const [seatMap, setSeatMap] = useState({ rows: 0, columns: 0, seats: [] });
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [reservationSession, setReservationSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingStep, setBookingStep] = useState('seats'); // 'seats', 'passenger', 'payment'
  const [countdown, setCountdown] = useState(0);
  const [passengerData, setPassengerData] = useState({
    name: user?.firstName ? `${user.firstName} ${user.lastName}` : '',
    cedula: user?.cedula || '',
    email: user?.email || '',
    boardingStop: trip.origin || '',
    dropoffStop: trip.destination || '',
    paymentMethod: 'PAYPAL'
  });

  // Cargar mapa de asientos
  useEffect(() => {
    if (trip?.id) {
      loadSeatMap();
    }
  }, [trip?.id]);

  // Si no tenemos info de bus en el trip, intentar cargarla (para usar capacity en fallback)
  useEffect(() => {
    const fetchBusIfNeeded = async () => {
      if (trip?.bus) return;
      if (trip?.busId) {
        try {
          const res = await busService.getById(trip.busId);
          const b = res.data?.data || res.data;
          // no mutamos props; guardamos en estado local para usar en capacidad/fallback
          setSeatMap(prev => ({ ...prev })); // trigger render if needed
          // attach local bus info to trip object reference safely
          try { trip.bus = b; } catch (e) { /* ignore */ }
        } catch (err) {
          console.warn('No se pudo cargar bus asociado al trip:', err);
        }
      }
    };
    fetchBusIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.busId]);

  // Si existe pendingPurchase en sessionStorage y el usuario está autenticado,
  // intentar reservar automáticamente el asiento al montar
  useEffect(() => {
    const tryResume = async () => {
      const pending = sessionStorage.getItem('pendingPurchase');
      if (!pending) return;
      if (!user) return; // esperar hasta haber iniciado sesión
      try {
        const parsed = JSON.parse(pending);
        if (parsed.tripId !== trip.id) return;
        // esperar que el mapa de asientos haya cargado
        if (!seatMap.seats || seatMap.seats.length === 0) return;
        const seatObj = seatMap.seats.find(s => s.number === parsed.seatNumber);
        if (!seatObj) return;
        // reservar
        await handleSeatSelect(seatObj);
        // limpiar pendingPurchase si se reservó exitosamente
        sessionStorage.removeItem('pendingPurchase');
      } catch (err) {
        console.error('Error resuming pendingPurchase:', err);
      }
    };

    tryResume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, seatMap, trip?.id]);

  // Countdown para reserva temporal
  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            toast.error('La reserva ha expirado. Selecciona otro asiento.');
            setSelectedSeat(null);
            setReservationSession(null);
            setBookingStep('seats');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const loadSeatMap = async () => {
    try {
      setLoading(true);
      // Si la respuesta del search ya incluye seatLayout (trip o trip.bus), usarla inmediatamente para renderizar igual que admin
      const localLayout = trip?.seatLayout || trip?.layout || trip?.bus?.seatLayout || trip?.bus?.layout || null;
      if (localLayout) {
        try {
          const lRows = localLayout.rows || localLayout.rowCount || localLayout.rowsCount || 0;
          const lCols = localLayout.cols || localLayout.columns || localLayout.colCount || 5;
          const lSeatsRaw = localLayout.seats || localLayout.map || [];
          const initialSeats = (lSeatsRaw || []).map(s => ({
            ...s,
            number: s.number ?? s.n ?? s.seatNumber ?? s.id,
            row: s.row ?? s.r ?? s.rowIndex,
            col: s.col ?? s.c ?? s.colIndex,
            floor: s.floor ?? 0,
            type: s.type || s.seatType || null,
            isOccupied: !!s.isOccupied
          }));
          setSeatMap({ rows: lRows || (initialSeats.length ? (Math.max(...initialSeats.map(x=>x.row||0))+1) : 0), columns: lCols, seats: initialSeats });
        } catch (er) {
          // ignore
        }
      }
      // Llamar al backend para obtener layout y ocupados
      console.log('🎯 CARGANDO ASIENTOS PARA TRIP ID:', trip.id);
      const response = await ticketService.getSeatMap(trip.id);
      const data = response.data?.data || {};
      const layout = data.seatLayout || {};
      const rows = layout.rows || layout.rowCount || 0;
      const columns = layout.cols || layout.columns || layout.colCount || 0;
      const seatsRaw = layout.seats || [];
      const occupied = data.occupiedSeats || [];
      console.log('Seat map raw response:', { rows, columns, seatsRaw, occupied });

      let seats = (seatsRaw || []).map(s => ({
        ...s,
        number: s.number ?? s.n ?? s.seatNumber ?? s.id,
        row: s.row ?? s.r ?? s.rowIndex,
        col: s.col ?? s.c ?? s.colIndex,
        floor: s.floor ?? 0,
        type: s.type || s.seatType || null
      }));

      // If seat numbers/types present but no row/col, try to infer positions using rows/columns
      const missingPosition = seats.some(s => s.row === undefined || s.row === null || s.col === undefined || s.col === null);
      if ((rows > 0 && columns > 0) && missingPosition) {
        seats = seats.map((s, idx) => ({
          ...s,
          row: (s.row !== undefined && s.row !== null) ? s.row : Math.floor(idx / columns),
          col: (s.col !== undefined && s.col !== null) ? s.col : (idx % columns)
        }));
      }

      // Determinar filas efectivas (si backend no provee rows)
      const effectiveRows = (rows && rows > 0) ? rows : (seats.length ? (Math.max(...seats.map(s => (s.row || 0))) + 1) : 0);

      const normalizeType = (raw) => {
        if (!raw && raw !== 0) return null;
        const t = String(raw).toUpperCase().replace(/[-\s]/g, '_');
        if (t.includes('VIP')) return 'VIP';
        if (t.includes('SEMI') || t.includes('SEMI_CAMA') || t.includes('SEMICAMA') || t.includes('SEMI-CAMA')) return 'SEMI_CAMA';
        if (t.includes('CAMA')) return 'SEMI_CAMA';
        if (t.includes('NORMAL') || t.includes('STD') || t.includes('STANDARD')) return 'NORMAL';
        return t; // devuelve lo que venga si no coincide
      };

      // Asignar tipo basado en fila si backend no especificó tipo
      seats = seats.map(s => {
        const existing = normalizeType(s.type || s.seatType);
        if (existing) return { ...s, type: existing };
        // Si no hay tipo, asignar por posición: primera fila VIP, última fila SEMI_CAMA
        if (typeof s.row === 'number' && effectiveRows > 0) {
          if (s.row === 0) return { ...s, type: 'VIP' };
          if (s.row >= effectiveRows - 1) return { ...s, type: 'SEMI_CAMA' };
        }
        return { ...s, type: 'NORMAL' };
      });

      // Normalize occupied list and seat numbers to strings for robust comparison
      const occupiedSet = new Set((occupied || []).map(x => String(x)));
      seats = seats.map(s => ({
        ...s,
        number: s.number !== undefined && s.number !== null ? s.number : (s.id ?? ''),
        isOccupied: occupiedSet.has(String(s.number)),
        floor: s.floor ?? 0,
        type: normalizeType(s.type) || s.type
      }));

      // Si el backend no devuelve asientos, intentar obtener layout desde trip o bus (admin) antes de generar fallback
      if ((!seats || seats.length === 0)) {
        let fetchedLayout = null;
        try {
          const tripRes = await tripService.getById(trip.id);
          const tripData = tripRes.data?.data || tripRes.data;
          fetchedLayout = tripData?.seatLayout || tripData?.layout || null;
          // si el trip tiene bus con layout
          if (!fetchedLayout && tripData?.bus) {
            fetchedLayout = tripData.bus.seatLayout || tripData.bus.layout || null;
          }
        } catch (err) {
          // ignore
        }

        if (!fetchedLayout && trip.busId) {
          try {
            const busRes = await busService.getById(trip.busId);
            const busData = busRes.data?.data || busRes.data;
            fetchedLayout = busData?.seatLayout || busData?.layout || null;
          } catch (err) {
            // ignore
          }
        }

        if (fetchedLayout) {
          // Normalizar fetchedLayout similar a layout procesado arriba
          const fRows = fetchedLayout.rows || fetchedLayout.rowCount || fetchedLayout.rowsCount || 0;
          const fCols = fetchedLayout.cols || fetchedLayout.columns || fetchedLayout.colCount || 5;
          const fSeatsRaw = fetchedLayout.seats || fetchedLayout.map || [];
          let fetchedSeats = (fSeatsRaw || []).map(s => ({
            ...s,
            number: s.number ?? s.n ?? s.seatNumber ?? s.id,
            row: s.row ?? s.r ?? s.rowIndex,
            col: s.col ?? s.c ?? s.colIndex,
            floor: s.floor ?? 0,
            type: s.type || s.seatType || null
          }));
          // aplicar normalización de tipos
          const maxRow = fRows && fRows > 0 ? fRows : (fetchedSeats.length ? (Math.max(...fetchedSeats.map(x => x.row || 0)) + 1) : 0);
          fetchedSeats = fetchedSeats.map(s => ({ ...s, type: s.type ? s.type : (s.row === 0 ? 'VIP' : (s.row >= maxRow - 1 ? 'SEMI_CAMA' : 'NORMAL')), isOccupied: occupiedSet.has(String(s.number)) }));
          setSeatMap({ rows: fRows || maxRow, columns: fCols, seats: fetchedSeats });
        } else {
          const capacity = trip.bus?.capacity || trip.totalSeats || trip.bus?.totalSeats || 40;
          // Usar layout con pasillo central (5 columnas físicas), 4 asientos por fila
          const physicalCols = 5;
          const seatsPerRow = physicalCols === 5 ? 4 : physicalCols;
          const defaultRows = Math.ceil(capacity / seatsPerRow);
          const generated = generateSeatsMatrix(defaultRows, physicalCols, capacity);
          const seatsWithOccupied = generated.map(s => ({ ...s, isOccupied: occupiedSet.has(String(s.number)), floor: s.floor ?? 0 }));
          setSeatMap({ rows: defaultRows, columns: physicalCols, seats: seatsWithOccupied });
        }
      } else {
        setSeatMap({ rows, columns, seats });
      }
    } catch (error) {
      console.error('ERROR AL CARGAR MAPA DE ASIENTOS:', error);
      console.error('TRIP ID QUE FALLÓ:', trip.id);
      console.error('DETALLES DEL ERROR:', error.response?.data || error.message);
      toast.error('Error al cargar el mapa de asientos');
      setSeatMap({ rows: 0, columns: 0, seats: [] });
    } finally {
      setLoading(false);
    }
  };



  const handleSeatSelect = async (seat) => {
    if (seat.isOccupied || selectedSeat?.number === seat.number) return;

    // Si no está autenticado, guardar en sessionStorage y redirigir a login
    if (!user) {
      const pending = {
        tripId: trip.id,
        seatNumber: seat.number,
        timestamp: Date.now(),
        origin: trip.origin,
        destination: trip.destination
      };
      try { sessionStorage.setItem('pendingPurchase', JSON.stringify(pending)); } catch (e) {}
      navigate('/login');
      toast('Debes iniciar sesión para completar la reserva');
      return;
    }

    try {
      setLoading(true);
      const response = await ticketService.reserveSeat({
        tripId: trip.id,
        seatNumber: seat.number
      });

      setSelectedSeat(seat);
      setReservationSession(response.data.data);
      
      // Calcular tiempo restante para el countdown
      const lockedUntil = new Date(response.data.data.lockedUntil);
      const now = new Date();
      const timeLeft = Math.floor((lockedUntil - now) / 1000);
      setCountdown(Math.max(timeLeft, 0));
      
      setBookingStep('passenger');
      toast.success(`Asiento ${seat.number} reservado por unos minutos`);
    } catch (error) {
      console.error('Error reserving seat:', error);
      if (error.response?.status === 409) {
        toast.error('Este asiento ya está ocupado');
        loadSeatMap(); // Recargar mapa actualizado
      } else {
        toast.error('Error al reservar asiento');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async () => {
    if (!selectedSeat || !reservationSession) {
      toast.error('Selecciona un asiento primero');
      return;
    }

    if (!passengerData.name || !passengerData.cedula || !passengerData.email) {
      toast.error('Completa todos los campos del pasajero');
      return;
    }

    try {
      setLoading(true);
      
      const bookingData = {
        tripId: trip.id,
        seatNumber: selectedSeat.number,
        passengerName: passengerData.name,
        passengerCedula: passengerData.cedula,
        passengerEmail: passengerData.email,
        boardingStop: passengerData.boardingStop,
        dropoffStop: passengerData.dropoffStop,
        paymentMethod: passengerData.paymentMethod
      };

      const response = await ticketService.create(bookingData);
      
      toast.success('¡Reserva completada exitosamente!');
      
      if (onBookingComplete) {
        onBookingComplete(response.data.data);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Error al completar la reserva');
    } finally {
      setLoading(false);
    }
  };

  const getSeatPrice = (seatType) => {
    const basePrice = trip.frequency?.price || trip.price || 0;
    switch (seatType) {
      case 'VIP':
        return basePrice * 1.3;
      case 'SEMI_CAMA':
        return basePrice * 1.5;
      default:
        return basePrice;
    }
  };

  // rows: number of rows; physicalCols: number of physical columns (e.g. 5 with center aisle)
  const generateSeatsMatrix = (rows, physicalCols, totalSeats) => {
    const seats = [];
    const usableCols = physicalCols === 5 ? [0, 1, 3, 4] : Array.from({ length: physicalCols }, (_, i) => i);
    const seatsPerRow = usableCols.length;
    for (let i = 0; i < totalSeats; i++) {
      const row = Math.floor(i / seatsPerRow);
      const col = usableCols[i % seatsPerRow];
      let type = 'NORMAL';
      if (row === 0) type = 'VIP';
      else if (row >= rows - 1) type = 'SEMI_CAMA';
      seats.push({ number: i + 1, row, col, type, isOccupied: false, floor: 0 });
    }
    return seats;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getSeatIcon = (seat, isSelected) => {
    if (seat.isOccupied) return <span>🚫</span>;
    if (isSelected) return <span>✅</span>;
    const t = String((seat.type || '')).toUpperCase().replace(/[-\s]/g, '_');
    switch (true) {
      case t.includes('VIP'):
        return <Crown className="h-4 w-4" />;
      case t.includes('SEMI') || t.includes('CAMA'):
        return <Armchair className="h-4 w-4" />;
      default:
        return <Armchair className="h-4 w-4" />;
    }
  };

  const getSeatColor = (seat, isSelected) => {
    if (seat.isOccupied) return 'bg-red-200 text-red-800 cursor-not-allowed';
    if (isSelected) return 'bg-green-500 text-white';
    const t = String((seat.type || '')).toUpperCase().replace(/[-\s]/g, '_');
    if (t.includes('VIP')) return 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300 cursor-pointer';
    if (t.includes('SEMI') || t.includes('CAMA')) return 'bg-purple-200 text-purple-800 hover:bg-purple-300 cursor-pointer';
    return 'bg-blue-200 text-blue-800 hover:bg-blue-300 cursor-pointer';
  };

  if (loading && !seatMap.seats.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando mapa de asientos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del viaje */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver a búsqueda
            </Button>
            {countdown > 0 && (
              <Badge variant="destructive">
                Reserva expira en: {formatTime(countdown)}
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Ruta</p>
                <p className="text-sm">{trip.origin} → {trip.destination}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Salida</p>
                <p className="text-sm">{trip.frequency?.departureTime || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Bus</p>
                <p className="text-sm">{trip.bus?.placa || trip.bus?.plate || trip.bus?.licensePlate || trip.bus?.plateNumber || 'N/A'}</p>
              </div>
            </div>
            
            {selectedSeat && (
              <div className="flex items-center gap-2">
                <div className="text-2xl">{getSeatIcon(selectedSeat, true)}</div>
                <div>
                  <p className="text-sm font-medium">Asiento Seleccionado</p>
                  <p className="text-sm">#{selectedSeat.number} - {formatPrice(getSeatPrice(selectedSeat.type))}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pasos de reserva */}
      {bookingStep === 'seats' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Selecciona tu asiento
            </CardTitle>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-200 rounded"></div>
                <span>Normal ({formatPrice(getSeatPrice('NORMAL'))})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-200 rounded"></div>
                <span>VIP ({formatPrice(getSeatPrice('VIP'))})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-200 rounded"></div>
                <span>Semi-cama ({formatPrice(getSeatPrice('SEMI_CAMA'))})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-200 rounded"></div>
                <span>Ocupado</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-w-md mx-auto">
              {/* Indicador del frente del bus */}
              <div className="text-center mb-4 text-sm text-muted-foreground">
                🚗 Frente del bus
              </div>
              
              {/* Mapa de asientos (estilo admin: 5 columnas físicas con pasillo central) */}
              <div className="flex justify-center">
                <div className="bg-gray-100 rounded-lg p-4 inline-block">
                  <div className="mb-4 text-center">
                    <div className="inline-block bg-gray-800 text-white px-6 py-2 rounded-t-lg font-semibold">
                      🚗 Frente del bus
                    </div>
                  </div>

                  <div className="space-y-2">
                    {Array.from({ length: seatMap.rows }).map((_, row) => (
                      <div key={row} className="flex gap-2 items-center justify-center">
                        <span className="text-xs text-gray-500 w-4">{row + 1}</span>
                        {Array.from({ length: seatMap.columns }).map((__, col) => (
                          <div key={col}>
                            {col === 2 ? (
                              <div className="w-12 h-12 flex items-center justify-center text-gray-400 text-xs">| |</div>
                            ) : (
                              (() => {
                                const seat = seatMap.seats.find(s => s.row === row && s.col === col);
                                if (!seat) return <div className="w-12 h-12" />;
                                const isSelected = selectedSeat?.number === seat.number;
                                return (
                                  <button
                                    key={seat.number}
                                    onClick={() => handleSeatSelect(seat)}
                                    disabled={seat.isOccupied || loading}
                                    className={`w-12 h-12 rounded ${getSeatColor(seat, isSelected)} text-xs font-medium flex flex-col items-center justify-center transition shadow-md`}
                                    title={`Asiento ${seat.number}`}
                                  >
                                    {getSeatIcon(seat, isSelected)}
                                    <span className="text-[10px] mt-1">{seat.number}</span>
                                  </button>
                                );
                              })()
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 text-center">
                    <div className="inline-block bg-gray-300 px-6 py-2 rounded-b-lg text-xs text-gray-600">Puerta trasera</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Datos del pasajero */}
      {bookingStep === 'passenger' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Datos del pasajero
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <User className="inline h-4 w-4 mr-1" />
                  Nombre completo *
                </Label>
                <Input
                  id="name"
                  value={passengerData.name}
                  onChange={(e) => setPassengerData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ingresa tu nombre completo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cedula">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Cédula/Documento *
                </Label>
                <Input
                  id="cedula"
                  value={passengerData.cedula}
                  onChange={(e) => setPassengerData(prev => ({ ...prev, cedula: e.target.value }))}
                  placeholder="1234567890"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={passengerData.email}
                  onChange={(e) => setPassengerData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="tu@email.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment">
                  <CreditCard className="inline h-4 w-4 mr-1" />
                  Método de pago
                </Label>
                <Select value={passengerData.paymentMethod} onValueChange={(value) => setPassengerData(prev => ({ ...prev, paymentMethod: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAYPAL">PayPal</SelectItem>
                    <SelectItem value="CASH">Efectivo en terminal</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Transferencia bancaria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Punto de subida</Label>
                <Input
                  value={passengerData.boardingStop}
                  onChange={(e) => setPassengerData(prev => ({ ...prev, boardingStop: e.target.value }))}
                  placeholder="Terminal de origen"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Punto de bajada</Label>
                <Input
                  value={passengerData.dropoffStop}
                  onChange={(e) => setPassengerData(prev => ({ ...prev, dropoffStop: e.target.value }))}
                  placeholder="Terminal de destino"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setBookingStep('seats')} disabled={loading}>
                Cambiar asiento
              </Button>
              <Button onClick={handleBookingSubmit} disabled={loading} className="flex-1">
                {loading ? 'Procesando...' : `Confirmar reserva - ${formatPrice(getSeatPrice(selectedSeat?.type))}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}