import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { enhancedTicketService as ticketService, frequencyService, tripService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import useActiveCooperativaId from '@/hooks/useActiveCooperativaId';
import AdminSeatMap from '@/components/admin/AdminSeatMap';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Ticket, Plus, MapPin, Calendar, User, 
  RefreshCw, CheckCircle, ArrowRight 
} from 'lucide-react';

export default function VenderTicket() {
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ 
    frequencyId: '', 
    tripId: '', 
    selectedDate: '', 
    busId: '', 
    seatNumber: '', 
    passengerName: '', 
    passengerCedula: '', 
    passengerEmail: '', 
    passengerPhone: '', 
    paymentMethod: 'CASH', 
    boardingStop: '', 
    dropoffStop: '' 
  });
  const [availableDates, setAvailableDates] = useState([]);
  const [availableBuses, setAvailableBuses] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedBusSeats, setSelectedBusSeats] = useState([]);
  const [seatMapData, setSeatMapData] = useState({ rows: 0, columns: 0, seats: [] });
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [frequencies, setFrequencies] = useState([]);
  const cedulaTimeout = useRef(null);
  const { user } = useAuth();
  const coopId = useActiveCooperativaId();

  useEffect(() => {
    if (coopId || user?.cooperativaId) {
      const loadFreq = async () => {
        try {
          if (coopId) {
            const res = await frequencyService.getAll({ cooperativaId: coopId });
            const data = res.data?.data || res.data || [];
            setFrequencies(Array.isArray(data) ? data : []);
          }
        } catch (err) {
          console.warn('No se pudieron cargar frecuencias', err);
        }
      };
      loadFreq();
    }
  }, [coopId]);

  // Comentado: Auto-buscar pasajero por cédula
  /*
  useEffect(() => {
    if (createForm.passengerCedula?.length >= 10) {
      if (cedulaTimeout.current) clearTimeout(cedulaTimeout.current);
      cedulaTimeout.current = setTimeout(async () => {
        try {
          const res = await ticketService.getAll({ search: createForm.passengerCedula });
          const tickets = res.data?.data || res.data?.tickets || res.data || [];
          if (tickets.length > 0) {
            const lastTicket = tickets[0];
            if (lastTicket.passengerName) {
              setCreateForm(prev => ({
                ...prev,
                passengerName: lastTicket.passengerName || prev.passengerName,
                passengerEmail: lastTicket.passengerEmail || prev.passengerEmail,
                passengerPhone: lastTicket.passengerPhone || prev.passengerPhone
              }));
              toast.success('Datos del pasajero cargados automáticamente');
            }
          }
        } catch (err) {
          console.log('No se encontró historial del pasajero');
        }
      }, 800);
    }
  }, [createForm.passengerCedula]);
  */

  const handleFrequencyChange = async (frequencyId) => {
    setCreateForm(prev => ({ ...prev, frequencyId, tripId: '', busId: '', selectedDate: '', seatNumber: '' }));
    setAvailableDates([]);
    setAvailableBuses([]);
    setSelectedBusSeats([]);

    if (!frequencyId) {
      // Limpiar paradas si no hay frecuencia
      setCreateForm(prev => ({ ...prev, boardingStop: '', dropoffStop: '' }));
      return;
    }

    // Obtener la frecuencia seleccionada y llenar las paradas automáticamente
    const selectedFrequency = frequencies.find(f => f.id === frequencyId);
    if (selectedFrequency) {
      setCreateForm(prev => ({ 
        ...prev, 
        boardingStop: selectedFrequency.route?.origin || '', 
        dropoffStop: selectedFrequency.route?.destination || ''
      }));
    }

    try {
      const cooperativaId = coopId || user?.cooperativaId;
      const params = { frequencyId };
      if (cooperativaId) params.cooperativaId = cooperativaId;

      const res = await tripService.getAll(params);
      const tripsData = res.data?.data || res.data?.trips || res.data || [];
      const trips = Array.isArray(tripsData) ? tripsData : [];

      const uniqueDates = [...new Set(trips.map(t => {
        if (!t.date) return null;
        try {
          return parseISO(t.date.split('T')[0]).toISOString().split('T')[0];
        } catch {
          return null;
        }
      }).filter(Boolean))].sort();

      setAvailableDates(uniqueDates);
    } catch (err) {
      console.error('Error cargando fechas:', err);
      toast.error('Error al cargar fechas disponibles');
    }
  };

  const handleDateChange = async (selectedDate) => {
    setCreateForm(prev => ({ ...prev, selectedDate, busId: '', tripId: '', seatNumber: '' }));
    setAvailableBuses([]);
    setSelectedBusSeats([]);

    if (!selectedDate || !createForm.frequencyId) return;

    try {
      const cooperativaId = coopId || user?.cooperativaId;
      const params = { frequencyId: createForm.frequencyId };
      if (cooperativaId) params.cooperativaId = cooperativaId;

      const res = await tripService.getAll(params);
      const tripsData = res.data?.data || res.data?.trips || res.data || [];
      const trips = Array.isArray(tripsData) ? tripsData : [];

      const tripsForDate = trips.filter(t => {
        if (!t.date) return false;
        try {
          return parseISO(t.date.split('T')[0]).toISOString().split('T')[0] === selectedDate;
        } catch {
          return false;
        }
      });

      const buses = tripsForDate.map(t => ({
        tripId: t.id,
        busId: t.busId || t.bus?.id,
        busPlaca: t.bus?.placa || 'N/A',
        busMarca: t.bus?.marca || '',
        busModel: t.bus?.model || '',
        departureTime: t.departureTime || t.frequency?.departureTime || '00:00'
      }));

      setAvailableBuses(buses);
    } catch (err) {
      console.error('Error cargando buses:', err);
      toast.error('Error al cargar buses disponibles');
    }
  };

  const handleBusChange = async (busId) => {
    const selectedBus = availableBuses.find(b => b.busId === busId);
    if (!selectedBus) return;

    setCreateForm(prev => ({ ...prev, busId, tripId: selectedBus.tripId, seatNumber: '' }));
    setSelectedBusSeats([]);

    try {
      console.log('🚌 Cargando asientos para tripId:', selectedBus.tripId);
      
      const tripRes = await tripService.getById(selectedBus.tripId);
      const tripData = tripRes.data?.data || tripRes.data || tripRes.data?.trip || {};
      setSelectedTrip(tripData);
      console.log('📊 Trip data:', tripData);

      const seatRes = await ticketService.getSeatMap(selectedBus.tripId);
      console.log('🪑 Seat map response:', seatRes.data);
      const seatData = seatRes.data?.data || seatRes.data || {};
      
      const rows = seatData.rows || seatData.busGroup?.rows || 0;
      const columns = seatData.columns || seatData.busGroup?.columns || 0;
      const seats = seatData.seats || [];
      
      console.log('📐 Mapa configurado - Rows:', rows, 'Columns:', columns, 'Seats:', seats.length);
      
      setSeatMapData({
        rows,
        columns,
        seats
      });
      
      const occupied = (seatData.occupiedSeats || []).map(s => 
        typeof s === 'object' ? s.seatNumber : s
      );
      console.log('🔴 Asientos ocupados:', occupied);
      setOccupiedSeats(occupied);
    } catch (err) {
      console.error('❌ Error cargando mapa de asientos:', err);
      toast.error('Error al cargar asientos disponibles');
    }
  };

  const handleSeatSelect = (seatNumber) => {
    setCreateForm(prev => ({ ...prev, seatNumber: seatNumber.toString() }));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      if (!createForm.tripId) {
        toast.error('Debe seleccionar frecuencia, fecha y bus');
        setCreating(false);
        return;
      }
      if (!createForm.seatNumber) {
        toast.error('Debe seleccionar un asiento');
        setCreating(false);
        return;
      }
      if (!createForm.passengerName || !createForm.passengerCedula) {
        toast.error('Debe ingresar nombre y cédula del pasajero');
        setCreating(false);
        return;
      }

      // Usar paradas de la ruta por defecto si no se especifican
      const boardingStop = createForm.boardingStop || selectedFreq?.route?.origin || '';
      const dropoffStop = createForm.dropoffStop || selectedFreq?.route?.destination || '';
      const calculatedPrice = getSeatPrice();

      console.log('🎫 CREANDO TICKET CON PRECIO:', {
        boarding: boardingStop,
        dropoff: dropoffStop,
        price: calculatedPrice,
        seatNumber: createForm.seatNumber
      });

      const payload = {
        tripId: createForm.tripId,
        seatNumber: parseInt(createForm.seatNumber),
        passengerName: createForm.passengerName,
        passengerCedula: createForm.passengerCedula,
        passengerEmail: createForm.passengerEmail || undefined,
        passengerPhone: createForm.passengerPhone || undefined,
        paymentMethod: createForm.paymentMethod,
        boardingStop: boardingStop || undefined,
        dropoffStop: dropoffStop || undefined,
        price: calculatedPrice,
        amount: calculatedPrice
      };

      await ticketService.create(payload);
      toast.success('¡Ticket creado exitosamente!');
      
      // Resetear formulario
      setCreateForm({ 
        frequencyId: '', 
        tripId: '', 
        selectedDate: '', 
        busId: '', 
        seatNumber: '', 
        passengerName: '', 
        passengerCedula: '', 
        passengerEmail: '', 
        passengerPhone: '', 
        paymentMethod: 'CASH', 
        boardingStop: '', 
        dropoffStop: '' 
      });
      setAvailableDates([]);
      setAvailableBuses([]);
      setSelectedBusSeats([]);
      setSeatMapData({ rows: 0, columns: 0, seats: [] });
      setOccupiedSeats([]);
      setSelectedTrip(null);
    } catch (error) {
      console.error('Error creando ticket:', error);
      const msg = error.response?.data?.message || 'Error al crear el ticket';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const selectedFreq = frequencies.find(f => f.id === createForm.frequencyId);

  // Calcular precio del ticket según paradas seleccionadas
  const getSeatPrice = () => {
    if (!selectedTrip || !createForm.seatNumber) return 0;

    // Determinar precio base
    const rawBase = selectedTrip.frequency?.price ?? selectedTrip.price ?? selectedTrip.route?.basePrice ?? selectedTrip.basePrice ?? 0;
    const parsedBase = typeof rawBase === 'string' ? parseFloat(rawBase) || 0 : (rawBase || 0);

    // Obtener tipo de asiento del mapa
    const seat = seatMapData.seats?.find(s => String(s.number) === String(createForm.seatNumber));
    const seatType = seat?.type || 'NORMAL';

    let calculatedPrice = parsedBase;

    try {
      const boarding = createForm.boardingStop || selectedTrip.origin;
      const dropoff = createForm.dropoffStop || selectedTrip.destination;
      const routeStops = selectedTrip.route?.stops || selectedTrip.route?.paradas || [];

      if (Array.isArray(routeStops) && routeStops.length) {
        const boardingStop = routeStops.find(s => String(s.name || s).toLowerCase() === String(boarding).toLowerCase());
        const dropoffStop = routeStops.find(s => String(s.name || s).toLowerCase() === String(dropoff).toLowerCase());

        // CASO 1: Origen → Parada intermedia
        if (boarding.toLowerCase() === selectedTrip.origin.toLowerCase() && dropoffStop?.priceFromOrigin !== undefined) {
          calculatedPrice = Number(dropoffStop.priceFromOrigin) || 0;
        }
        // CASO 2: Parada intermedia → Destino final
        else if (boardingStop?.priceFromOrigin !== undefined && dropoff.toLowerCase() === selectedTrip.destination.toLowerCase()) {
          const boardingPrice = Number(boardingStop.priceFromOrigin) || 0;
          calculatedPrice = Math.max(parsedBase - boardingPrice, 0);
        }
        // CASO 3: Parada intermedia → Parada intermedia
        else if (boardingStop?.priceFromOrigin !== undefined && dropoffStop?.priceFromOrigin !== undefined) {
          const boardingPrice = Number(boardingStop.priceFromOrigin) || 0;
          const dropoffPrice = Number(dropoffStop.priceFromOrigin) || 0;
          calculatedPrice = Math.abs(dropoffPrice - boardingPrice);
        }
        // CASO 4: Origen → Destino (ruta completa)
        else {
          calculatedPrice = parsedBase;
        }
      }
    } catch (e) {
      calculatedPrice = parsedBase;
    }

    // Aplicar multiplicador según tipo de asiento
    switch (String(seatType).toUpperCase()) {
      case 'VIP':
        return +(calculatedPrice * 1.3);
      case 'SEMI_CAMA':
      case 'SEMI-CAMA':
        return +(calculatedPrice * 1.5);
      default:
        return +calculatedPrice;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Ticket className="h-8 w-8 text-blue-600" />
            Vender Ticket
          </h1>
          <p className="text-gray-600 mt-2">Complete los datos para crear un nuevo ticket</p>
        </div>

        <form onSubmit={handleCreateTicket}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna 1: Selección de Viaje */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  1. Seleccionar Viaje
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Ruta *</Label>
                  <Select value={createForm.frequencyId} onValueChange={handleFrequencyChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una ruta" />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencies.map(f => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.route?.origin} → {f.route?.destination}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {availableDates.length > 0 && (
                  <div>
                    <Label>Fecha *</Label>
                    <Select value={createForm.selectedDate} onValueChange={handleDateChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione fecha" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDates.map(date => (
                          <SelectItem key={date} value={date}>
                            {format(parseISO(date), "dd 'de' MMMM yyyy", { locale: es })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {availableBuses.length > 0 && (
                  <div>
                    <Label>Bus / Hora *</Label>
                    <Select value={createForm.busId} onValueChange={handleBusChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione bus" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBuses.map(bus => (
                          <SelectItem key={bus.busId} value={bus.busId}>
                            {bus.busPlaca} - {bus.departureTime}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedFreq && (
                  <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Origen:</span>
                      <span className="font-semibold">{selectedFreq.route?.origin}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Destino:</span>
                      <span className="font-semibold">{selectedFreq.route?.destination}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Precio:</span>
                      <span className="font-bold text-green-600">${selectedFreq.price?.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Columna 2: Datos del Pasajero */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  2. Datos del Pasajero
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Cédula *</Label>
                  <Input 
                    value={createForm.passengerCedula} 
                    onChange={(e) => setCreateForm(f => ({ ...f, passengerCedula: e.target.value }))}
                    placeholder="1234567890"
                    maxLength={10}
                    required
                  />
                </div>

                <div>
                  <Label>Nombre Completo *</Label>
                  <Input 
                    value={createForm.passengerName} 
                    onChange={(e) => setCreateForm(f => ({ ...f, passengerName: e.target.value }))}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={createForm.passengerEmail} 
                    onChange={(e) => setCreateForm(f => ({ ...f, passengerEmail: e.target.value }))}
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div>
                  <Label>Teléfono</Label>
                  <Input 
                    value={createForm.passengerPhone} 
                    onChange={(e) => setCreateForm(f => ({ ...f, passengerPhone: e.target.value }))}
                    placeholder="0999999999"
                  />
                </div>

                <div>
                  <Label>Parada de Abordaje</Label>
                  <Input 
                    value={createForm.boardingStop} 
                    onChange={(e) => setCreateForm(f => ({ ...f, boardingStop: e.target.value }))}
                    placeholder="Parada de origen"
                    disabled
                  />
                </div>

                <div>
                  <Label>Parada de Bajada *</Label>
                  <Select 
                    value={createForm.dropoffStop} 
                    onValueChange={(val) => setCreateForm(f => ({ ...f, dropoffStop: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona parada de bajada" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Destino final */}
                      {selectedTrip?.destination && (
                        <SelectItem value={selectedTrip.destination}>
                          {selectedTrip.destination} (Destino final)
                        </SelectItem>
                      )}
                      
                      {/* Paradas intermedias */}
                      {(selectedTrip?.route?.stops || selectedTrip?.route?.paradas || [])
                        .filter(s => {
                          const stopName = s.name || s;
                          return stopName !== selectedTrip?.origin && stopName !== selectedTrip?.destination;
                        })
                        .map((stop, i) => {
                          const stopName = stop.name || stop;
                          return (
                            <SelectItem key={i} value={stopName}>
                              {stopName}
                            </SelectItem>
                          );
                        })
                      }
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    El precio se ajustará según la parada seleccionada
                  </p>
                </div>

                <div>
                  <Label>Método de Pago *</Label>
                  <Select value={createForm.paymentMethod} onValueChange={(val) => setCreateForm(f => ({ ...f, paymentMethod: val }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Efectivo</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Mostrar precio calculado */}
                {createForm.seatNumber && createForm.dropoffStop && (
                  <div className="col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Precio del ticket</p>
                        <p className="text-xs text-blue-700">
                          Asiento {createForm.seatNumber} • {createForm.boardingStop} → {createForm.dropoffStop}
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatPrice(getSeatPrice())}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Columna 3: Selección de Asiento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  3. Seleccionar Asiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {createForm.tripId && selectedTrip ? (
                  <div>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <AdminSeatMap
                        trip={selectedTrip}
                        selectedSeat={createForm.seatNumber}
                        onSeatSelect={(seatNumber) => {
                          console.log('✅ Asiento seleccionado:', seatNumber);
                          setCreateForm(prev => ({ ...prev, seatNumber: seatNumber.toString() }));
                        }}
                      />
                    </div>
                    {createForm.seatNumber && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800 font-semibold text-center">
                          Asiento seleccionado: #{createForm.seatNumber}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Seleccione ruta, fecha y bus para ver asientos disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Botón de Crear */}
          <div className="mt-6 flex justify-end">
            <Button 
              type="submit" 
              size="lg"
              disabled={creating || !createForm.tripId || !createForm.seatNumber || !createForm.passengerName || !createForm.passengerCedula}
              className="min-w-[200px]"
            >
              {creating ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Creando Ticket...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Crear Ticket
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
