import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  Ticket,
  Plus,
  QrCode,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  User,
  Calendar,
  DollarSign,
  RefreshCw,
  Eye,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { enhancedTicketService as ticketService, frequencyService, tripService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import useActiveCooperativaId from '@/hooks/useActiveCooperativaId';
import AdminSeatMap from '@/components/admin/AdminSeatMap';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TicketsManagement() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ frequencyId: '', tripId: '', selectedDate: '', busId: '', seatNumber: '', passengerName: '', passengerCedula: '', passengerEmail: '', passengerPhone: '', paymentMethod: 'CASH', boardingStop: '', dropoffStop: '' });
  const [availableDates, setAvailableDates] = useState([]);
  const [availableBuses, setAvailableBuses] = useState([]);
  const [availableTripsForDate, setAvailableTripsForDate] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedBusSeats, setSelectedBusSeats] = useState([]);
  const [seatMapData, setSeatMapData] = useState({ rows: 0, columns: 0, seats: [] });
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [frequencies, setFrequencies] = useState([]);
  const [cooperativaTrips, setCooperativaTrips] = useState([]); // Viajes de la cooperativa
  const cedulaTimeout = useRef(null);
  const { user } = useAuth();
  const coopId = useActiveCooperativaId();

  useEffect(() => {
    if (coopId || user?.cooperativaId) {
      loadTickets();
      // cargar frecuencias si tenemos cooperativaId (resuelto por hook)
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

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter, dateFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      
      // Paso 1: Cargar viajes de la cooperativa
      let cooperativaId = coopId || user?.cooperativaId;
      if (!cooperativaId) {
        console.warn('No hay cooperativaId disponible');
        setTickets([]);
        setLoading(false);
        return;
      }
      
      const tripsParams = {};
      if (cooperativaId) tripsParams.cooperativaId = cooperativaId;
      
      const tripsResponse = await tripService.getAll(tripsParams);
      
      let trips = tripsResponse.data?.data || tripsResponse.data || [];
      
      // Filtrado frontend adicional para SUPER_ADMIN
      if (user?.role === 'SUPER_ADMIN' && cooperativaId) {
        trips = trips.filter(t => {
          const tripCoopId = t.cooperativaId || t.cooperativa?._id || t.cooperativa?.id;
          return tripCoopId === cooperativaId;
        });
      }
      
      setCooperativaTrips(trips);
      const tripIds = trips.map(t => t.id || t._id).filter(Boolean);
      console.log('Trip IDs de la cooperativa:', tripIds);
      
      if (tripIds.length === 0) {
        console.warn('No hay viajes para esta cooperativa');
        setTickets([]);
        setLoading(false);
        return;
      }
      
      // Paso 2: Cargar todos los tickets
      const response = await ticketService.getAll();
      console.log('Tickets API response:', response.data);
      
      if (response.data.success && response.data.data) {
        let ticketsData = response.data.data;
        
        // Paso 3: Filtrar tickets por tripIds de la cooperativa y enriquecer con datos del trip
        ticketsData = ticketsData
          .filter(ticket => {
            const ticketTripId = ticket.tripId || ticket.trip?.id || ticket.trip?._id;
            return tripIds.includes(ticketTripId);
          })
          .map(ticket => {
            // Enriquecer ticket con información completa del trip
            const ticketTripId = ticket.tripId || ticket.trip?.id || ticket.trip?._id;
            const fullTrip = trips.find(t => (t.id || t._id) === ticketTripId);
            
            if (fullTrip) {
              return {
                ...ticket,
                trip: {
                  ...fullTrip,
                  // Asegurar que departureDate y departureTime estén disponibles
                  departureDate: fullTrip.date || fullTrip.departureDate || 'N/A',
                  departureTime: fullTrip.departureTime || fullTrip.time || 'N/A'
                },
                // Asegurar que passenger tenga la estructura correcta
                passenger: {
                  name: ticket.passengerName || ticket.passenger?.name || 'N/A',
                  cedula: ticket.passengerCedula || ticket.passenger?.cedula || 'N/A',
                  email: ticket.passengerEmail || ticket.passenger?.email || 'N/A',
                  phone: ticket.passengerPhone || ticket.passenger?.phone || 'N/A'
                },
                // Usar totalPrice del ticket, si no existe usar basePrice, price o del trip
                price: ticket.totalPrice || ticket.basePrice || ticket.price || fullTrip.price || fullTrip.route?.price || 0,
                // Asegurar seatNumber
                seatNumber: ticket.seatNumber || ticket.seat || 'N/A'
              };
            }
            return ticket;
          });
        
        console.log('Tickets enriquecidos con datos de trips:', ticketsData.length, 'registros');
        console.log('Ejemplo de ticket enriquecido:', ticketsData[0]);
        setTickets(ticketsData);
      } else {
        setTickets(response.data.data || response.data || []);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.log('Backend no disponible, usando datos de demostración');
        toast.error('Backend no disponible - Mostrando datos de demostración');
      } else {
        toast.error('Error al cargar los tickets');
      }
      
      // Datos de demostración
      setTickets([
        {
          id: '1',
          ticketNumber: 'TK001234567',
          passenger: {
            name: 'Ana María Rodríguez',
            email: 'ana.rodriguez@email.com',
            phone: '0987654321',
            cedula: '1234567890'
          },
          trip: {
            id: '1',
            route: {
              origin: 'Quito',
              destination: 'Guayaquil'
            },
            departureDate: '2024-12-20',
            departureTime: '06:00',
            bus: {
              placa: 'ABC-123',
              marca: 'Mercedes'
            },
            driver: {
              name: 'Juan Pérez'
            }
          },
          seatNumber: 15,
          seatType: 'NORMAL',
          price: 15.00,
          status: 'ACTIVE',
          purchaseDate: '2024-12-18T14:30:00Z',
          qrCode: 'QR_TK001234567_2024',
          validatedAt: null,
          validatedBy: null
        },
        {
          id: '2',
          ticketNumber: 'TK001234568',
          passenger: {
            name: 'Carlos Mendoza Silva',
            email: 'carlos.mendoza@email.com',
            phone: '0123456789',
            cedula: '0987654321'
          },
          trip: {
            id: '1',
            route: {
              origin: 'Quito',
              destination: 'Guayaquil'
            },
            departureDate: '2024-12-20',
            departureTime: '06:00',
            bus: {
              placa: 'ABC-123',
              marca: 'Mercedes'
            },
            driver: {
              name: 'Juan Pérez'
            }
          },
          seatNumber: 8,
          seatType: 'VIP',
          price: 19.5,
          status: 'USED',
          purchaseDate: '2024-12-17T10:15:00Z',
          qrCode: 'QR_TK001234568_2024',
          validatedAt: '2024-12-20T05:45:00Z',
          validatedBy: 'Juan Pérez'
        },
        {
          id: '3',
          ticketNumber: 'TK001234569',
          passenger: {
            name: 'María Elena González',
            email: 'maria.gonzalez@email.com',
            phone: '0555666777',
            cedula: '1122334455'
          },
          trip: {
            id: '2',
            route: {
              origin: 'Guayaquil',
              destination: 'Quito'
            },
            departureDate: '2024-12-19',
            departureTime: '15:00',
            bus: {
              placa: 'XYZ-789',
              marca: 'Volvo'
            },
            driver: {
              name: 'María González'
            }
          },
          seatNumber: 12,
          seatType: 'SEMI_CAMA',
          price: 22.5,
          status: 'CANCELLED',
          purchaseDate: '2024-12-16T16:20:00Z',
          qrCode: 'QR_TK001234569_2024',
          validatedAt: null,
          validatedBy: null,
          cancellationReason: 'Solicitud del cliente',
          cancelledAt: '2024-12-18T09:30:00Z'
        },
        {
          id: '4',
          ticketNumber: 'TK001234570',
          passenger: {
            name: 'Pedro Sánchez López',
            email: 'pedro.sanchez@email.com',
            phone: '0999888777',
            cedula: '5566778899'
          },
          trip: {
            id: '3',
            route: {
              origin: 'Quito',
              destination: 'Cuenca'
            },
            departureDate: '2024-12-21',
            departureTime: '08:30',
            bus: {
              placa: 'DEF-456',
              marca: 'Scania'
            },
            driver: {
              name: 'Roberto Díaz'
            }
          },
          seatNumber: 25,
          seatType: 'NORMAL',
          price: 20.00,
          status: 'ACTIVE',
          purchaseDate: '2024-12-19T11:45:00Z',
          qrCode: 'QR_TK001234570_2024',
          validatedAt: null,
          validatedBy: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTripById = async (tripId) => {
    if (!tripId) {
      setAvailableBuses([]);
      setSelectedTrip(null);
      setCreateForm(cf => ({ ...cf, tripId: '', busId: '', seatNumber: '' }));
      return;
    }
    try {
      const res = await tripService.getById(tripId);
      const tripDetail = res.data?.data || res.data || null;
      if (!tripDetail) {
        toast.error('No se pudo obtener información del viaje seleccionado');
        return;
      }
      setSelectedTrip(tripDetail);
      setCreateForm(cf => ({ ...cf, tripId: tripDetail.id || tripDetail._id, busId: '', seatNumber: '', boardingStop: tripDetail.route?.origin || tripDetail.origin || '', dropoffStop: tripDetail.route?.destination || tripDetail.destination || '' }));

      const busId = tripDetail.busId || tripDetail.bus?.id || tripDetail.bus?._id;
      const busObj = tripDetail.bus || tripDetail.vehicle || {};
      const departureTime = tripDetail.departureTime || tripDetail.time || tripDetail.frequency?.departureTime || '';
      const buses = [];
      if (busId) buses.push({ id: busId, tripId: tripDetail.id || tripDetail._id, tripData: tripDetail, bus: busObj, departureTime });
      else if (Object.keys(busObj || {}).length) buses.push({ id: busObj.id || busObj._id || JSON.stringify(busObj), tripId: tripDetail.id || tripDetail._id, tripData: tripDetail, bus: busObj, departureTime });
      setAvailableBuses(buses);
    } catch (err) {
      console.error('Error loading trip by id:', err);
      toast.error('Error al cargar el viaje seleccionado');
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    // Filtro por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.ticketNumber?.toLowerCase().includes(search) ||
        ticket.passenger?.name?.toLowerCase().includes(search) ||
        ticket.passenger?.email?.toLowerCase().includes(search) ||
        ticket.passenger?.cedula?.includes(search) ||
        ticket.trip?.route?.origin?.toLowerCase().includes(search) ||
        ticket.trip?.route?.destination?.toLowerCase().includes(search)
      );
    }

    // Filtro por estado
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Filtro por fecha - comparar usando zona horaria de Ecuador
    if (dateFilter) {
      filtered = filtered.filter(ticket => {
        if (!ticket.trip?.departureDate) return false;
        try {
          // Convertir la fecha a zona horaria de Ecuador y extraer solo la parte de fecha
          const tripDate = new Date(ticket.trip.departureDate);
          const ecuadorDateString = tripDate.toLocaleDateString('en-CA', {
            timeZone: 'America/Guayaquil'
          }); // formato YYYY-MM-DD
          return ecuadorDateString === dateFilter;
        } catch (e) {
          return false;
        }
      });
    }

    setFilteredTickets(filtered);
  };

  const handleValidateTicket = async (ticketId) => {
    try {
      await ticketService.validate(ticketId);
      toast.success('Ticket validado correctamente');
      loadTickets();
    } catch (error) {
      console.error('Error validating ticket:', error);
      toast.error('Error al validar el ticket');
    }
  };

  const handleCancelTicket = async (ticketId) => {
    const reason = prompt('Motivo de cancelación:');
    if (!reason) return;

    try {
      await ticketService.cancel(ticketId, { reason });
      toast.success('Ticket cancelado correctamente');
      loadTickets();
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      toast.error('Error al cancelar el ticket');
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault && e.preventDefault();
    setCreating(true);
    try {
      // Validaciones
      if (!createForm.tripId) {
        setCreating(false);
        return toast.error('Debe seleccionar frecuencia, fecha y bus');
      }
      if (!createForm.seatNumber) {
        setCreating(false);
        return toast.error('Debe seleccionar un asiento');
      }
      if (!createForm.passengerName || createForm.passengerName.trim().length < 3) {
        setCreating(false);
        return toast.error('Nombre del pasajero (mín. 3 caracteres)');
      }
      if (!createForm.passengerCedula || String(createForm.passengerCedula).trim().length < 10) {
        setCreating(false);
        return toast.error('Cédula del pasajero (mín. 10 caracteres)');
      }
      const email = String(createForm.passengerEmail || '').trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        setCreating(false);
        return toast.error('Email inválido');
      }

      // Validar paradas
      if (!createForm.boardingStop || createForm.boardingStop.trim().length < 1) {
        setCreating(false);
        return toast.error('Parada de subida es requerida');
      }
      if (!createForm.dropoffStop || createForm.dropoffStop.trim().length < 1) {
        setCreating(false);
        return toast.error('Parada de bajada es requerida');
      }

      // Calcular precio del ticket
      const calculatedPrice = getSeatPrice();
      
      console.log('🎫 CREANDO TICKET CON PRECIO:', {
        boarding: createForm.boardingStop,
        dropoff: createForm.dropoffStop,
        price: calculatedPrice,
        seatNumber: createForm.seatNumber
      });

      // Normalizar payload
      const payload = {
        tripId: String(createForm.tripId),
        seatNumber: Number(createForm.seatNumber),
        passengerName: String(createForm.passengerName).trim(),
        passengerCedula: String(createForm.passengerCedula).trim(),
        passengerEmail: email,
        boardingStop: String(createForm.boardingStop).trim(),
        dropoffStop: String(createForm.dropoffStop).trim(),
        paymentMethod: createForm.paymentMethod || 'CASH',
        price: calculatedPrice,
        amount: calculatedPrice
      };
      if (createForm.passengerPhone) payload.passengerPhone = String(createForm.passengerPhone).trim();

      console.log('Payload a enviar:', payload);
      await ticketService.create(payload);
      toast.success('Ticket creado correctamente');
      await loadTickets();
      setCreating(false);
      setShowCreate(false);
      setCreateForm({ frequencyId: '', tripId: '', selectedDate: '', busId: '', seatNumber: '', passengerName: '', passengerCedula: '', passengerEmail: '', passengerPhone: '', paymentMethod: 'CASH', boardingStop: '', dropoffStop: '' });
      setAvailableDates([]);
      setAvailableBuses([]);
      setSelectedBusSeats([]);
    } catch (err) {
      console.error('Error creating ticket', err);
      console.error('Error details:', err.response?.data);
      setCreating(false);
      toast.error(err.response?.data?.message || 'Error al crear ticket');
    }
  };

  const handleSelectFrequency = async (freqId) => {
    if (!freqId) {
      setAvailableDates([]);
      setAvailableBuses([]);
      setSelectedBusSeats([]);
      return;
    }
    
    const f = frequencies.find(x => String(x.id) === String(freqId));
    if (!f) return;
    
    // Cargar trips de esta frecuencia para obtener fechas disponibles
    try {
      const cooperativaId = coopId || user?.cooperativaId;
      const tripsResponse = await tripService.getAll({ 
        cooperativaId,
        frequencyId: freqId 
      });
      
      const tripsData = tripsResponse.data?.data || tripsResponse.data || [];
      const trips = Array.isArray(tripsData) ? tripsData : [];

      // Aplicar filtrado cliente por frecuencia (por si el backend no respeta params)
      const tripsFilteredByFreq = trips.filter(t => {
        const tf = String(t.frequencyId || t.frequency?.id || t.frequency?._id || '').trim();
        return tf && tf === String(freqId);
      });
      const effectiveTrips = tripsFilteredByFreq.length ? tripsFilteredByFreq : trips;

      // Limpiar estados relacionados a la selección previa
      setAvailableTripsForDate([]);
      setAvailableBuses([]);
      setSelectedTrip(null);

      // Obtener fecha/hora actual en Ecuador
      const now = new Date();
      const ecuadorNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
      const today = ecuadorNow.toISOString().split('T')[0];

      // Helper: calcular timestamp UTC del trip asumiendo que la hora está en zona America/Guayaquil
      const toTripTimestamp = (t) => {
        try {
          const dateStr = String(t.date || t.departureDate || '').split('T')[0];
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
          const [y, m, d] = dateStr.split('-').map(Number);
          const timeStr = String(t.departureTime || t.time || '').trim();
          let hh = 0, mm = 0;
          if (timeStr) {
            const parts = timeStr.split(':').map(p => parseInt(p, 10));
            hh = isNaN(parts[0]) ? 0 : parts[0];
            mm = isNaN(parts[1]) ? 0 : parts[1];
          }
          // Construir timestamp UTC equivalente a la hora local de Ecuador: UTC = Date.UTC(...) + offsetHours*3600000
          // Ecuador (America/Guayaquil) está en UTC-5 sin DST
          const offsetHours = 5;
          return Date.UTC(y, m - 1, d, hh, mm) + offsetHours * 60 * 60 * 1000;
        } catch (e) {
          return null;
        }
      };

      // Filtrar trips que están programados (SCHEDULED) y cuya fecha/hora esté en el futuro relativo a Ecuador
      const futureTrips = trips.filter(t => {
        const statusOk = (t.status || '').toUpperCase() === 'SCHEDULED';
        if (!statusOk) return false;
        const ts = toTripTimestamp(t);
        if (!ts) return false;
        return ts > ecuadorNow.getTime();
      });

      // Obtener fechas únicas de los futureTrips
      // Use only future trips that belong to the frequency (effectiveTrips)
      const dates = Array.from(new Set(futureTrips
        .filter(t => (effectiveTrips || []).some(et => (et.id || et._id) === (t.id || t._id)))
        .map(t => String(t.date || t.departureDate).split('T')[0])
      )).filter(Boolean).sort();

      setAvailableDates(dates);
      setCreateForm(cf => ({ ...cf, frequencyId: freqId, selectedDate: '', busId: '', tripId: '', seatNumber: '' }));
    } catch (err) {
      console.error('Error loading dates:', err);
      toast.error('Error al cargar fechas disponibles');
    }
  };

  const handleSelectDate = async (date) => {
    if (!date || !createForm.frequencyId) return;
    
    setCreateForm(cf => ({ ...cf, selectedDate: date, busId: '', tripId: '', seatNumber: '' }));
    
    try {
      const cooperativaId = coopId || user?.cooperativaId;
      const tripsResponse = await tripService.getAll({ 
        cooperativaId,
        frequencyId: createForm.frequencyId
      });
      
      const tripsData = tripsResponse.data?.data || tripsResponse.data || [];
      const trips = Array.isArray(tripsData) ? tripsData : [];

      // Asegurar que trabajamos solo con trips de la frecuencia seleccionada (cliente)
      const freqIdStr = String(createForm.frequencyId || '').trim();
      const tripsOfFreq = trips.filter(t => {
        const tf = String(t.frequencyId || t.frequency?.id || t.frequency?._id || '').trim();
        return tf && tf === freqIdStr;
      });
      const effectiveTripsList = tripsOfFreq.length ? tripsOfFreq : trips;
      
      // Filtrar trips por fecha seleccionada, estado SCHEDULED y que estén en el futuro
      const ecuadorNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
      const tripsForDate = effectiveTripsList.filter(t => {
        const tripDate = String(t.date || t.departureDate || '').split('T')[0];
        if (tripDate !== date) return false;
        if ((t.status || '').toUpperCase() !== 'SCHEDULED') return false;
        // calcular timestamp similar a handleSelectFrequency
        try {
          const [y, m, d] = tripDate.split('-').map(Number);
          const timeStr = String(t.departureTime || t.time || '').trim();
          let hh = 0, mm = 0;
          if (timeStr) {
            const parts = timeStr.split(':').map(p => parseInt(p, 10));
            hh = isNaN(parts[0]) ? 0 : parts[0];
            mm = isNaN(parts[1]) ? 0 : parts[1];
          }
          const offsetHours = 5; // America/Guayaquil UTC-5
          const tripTs = Date.UTC(y, m - 1, d, hh, mm) + offsetHours * 60 * 60 * 1000;
          if (tripTs <= ecuadorNow.getTime()) return false;
        } catch (e) {
          return false;
        }
        return true;
      });
      
      // Guardar trips disponibles para la fecha y limpiar buses/selecciones previas
      setAvailableTripsForDate(tripsForDate);
      setAvailableBuses([]);
      setSelectedTrip(null);

      // Si solo hay un viaje en esa fecha, cargar automáticamente sus buses (habitualmente 1)
      if (tripsForDate.length === 1) {
        const trip = tripsForDate[0];
        // Usar el endpoint /trips/:id para obtener detalles del viaje
        try {
          const res = await tripService.getById(trip.id || trip._id);
          const tripDetail = res.data?.data || res.data || trip;
          setSelectedTrip(tripDetail);
          setCreateForm(cf => ({ ...cf, tripId: tripDetail.id || tripDetail._id, busId: '', seatNumber: '', boardingStop: tripDetail.route?.origin || tripDetail.origin || '', dropoffStop: tripDetail.route?.destination || tripDetail.destination || '' }));
          const busId = tripDetail.busId || tripDetail.bus?.id || tripDetail.bus?._id;
          const busObj = tripDetail.bus || tripDetail.vehicle || {};
          const departureTime = tripDetail.departureTime || tripDetail.time || tripDetail.frequency?.departureTime || '';
          const buses = [];
          if (busId) buses.push({ id: busId, tripId: tripDetail.id || tripDetail._id, tripData: tripDetail, bus: busObj, departureTime });
          else if (Object.keys(busObj || {}).length) buses.push({ id: busObj.id || busObj._id || JSON.stringify(busObj), tripId: tripDetail.id || tripDetail._id, tripData: tripDetail, bus: busObj, departureTime });
          setAvailableBuses(buses);
        } catch (err) {
          console.error('Error loading trip details for single trip date:', err);
          // Fallback: construir buses desde tripsForDate
          const busesMap = new Map();
          for (const trip of tripsForDate) {
            const busId = trip.busId || trip.bus?.id || trip.bus?._id;
            const tripId = trip.id || trip._id;
            if (busId && tripId) {
              if (!busesMap.has(busId)) {
                busesMap.set(busId, {
                  id: busId,
                  tripId: tripId,
                  tripData: trip,
                  bus: trip.bus,
                  departureTime: trip.departureTime || trip.time
                });
              }
            }
          }
          setAvailableBuses(Array.from(busesMap.values()));
        }
      }
    } catch (err) {
      console.error('Error loading buses:', err);
      toast.error('Error al cargar buses disponibles');
    }
  };

  const handleSelectBus = (busData) => {
    if (!busData) {
      setCreateForm(cf => ({ ...cf, busId: '', tripId: '', seatNumber: '', boardingStop: '', dropoffStop: '' }));
      setSelectedTrip(null);
      return;
    }
    
    const { id, tripId, tripData } = busData;
    const origin = tripData?.route?.origin || tripData?.frequency?.route?.origin || '';
    const destination = tripData?.route?.destination || tripData?.frequency?.route?.destination || '';
    setCreateForm(cf => ({ ...cf, busId: id, tripId: tripId, seatNumber: '', boardingStop: origin, dropoffStop: destination }));
    setSelectedTrip(tripData);
  };

  const lookupCedula = (cedula) => {
    if (cedulaTimeout.current) clearTimeout(cedulaTimeout.current);
    if (!cedula || String(cedula).trim().length < 10) return;
    cedulaTimeout.current = setTimeout(async () => {
      try {
        // intentar buscar usuario por cédula en endpoint /users?cedula=...
        const res = await api.get('/users', { params: { cedula: String(cedula).trim() } });
        const data = res.data?.data || res.data;
        // si devuelve array buscar primer elemento
        const userFound = Array.isArray(data) ? data[0] : data;
        if (userFound) {
          setCreateForm(cf => ({ ...cf, passengerName: userFound.name || cf.passengerName, passengerEmail: userFound.email || cf.passengerEmail, passengerPhone: userFound.phone || cf.passengerPhone }));
          toast.success('Datos del pasajero autocompletados');
        }
      } catch (err) {
        // no bloquear si no existe
        console.debug('Lookup cedula no encontrado o endpoint no disponible', err?.response?.status || err.message);
      }
    }, 600);
  };

  // Calcular precio del ticket según paradas seleccionadas
  const getSeatPrice = () => {
    if (!selectedTrip || !createForm.seatNumber) return 0;

    const rawBase = selectedTrip.frequency?.price ?? selectedTrip.price ?? selectedTrip.route?.basePrice ?? selectedTrip.basePrice ?? 0;
    const parsedBase = typeof rawBase === 'string' ? parseFloat(rawBase) || 0 : (rawBase || 0);

    // Obtener tipo de asiento desde el trip (AdminSeatMap carga esta info)
    let seatType = 'NORMAL';
    try {
      // Intentar obtener del bus o del layout del trip
      const busLayout = selectedTrip.bus?.seatLayout || selectedTrip.seatLayout || selectedTrip.layout || {};
      const seats = busLayout.seats || busLayout.map || [];
      const seat = seats.find(s => {
        const sNum = s.number ?? s.n ?? s.seatNumber ?? s.id;
        return String(sNum) === String(createForm.seatNumber);
      });
      seatType = seat?.type || seat?.seatType || 'NORMAL';
    } catch (e) {
      // Si no se puede obtener, usar NORMAL por defecto
      seatType = 'NORMAL';
    }

    let calculatedPrice = parsedBase;

    try {
      const boarding = createForm.boardingStop || selectedTrip.origin;
      const dropoff = createForm.dropoffStop || selectedTrip.destination;
      const routeStops = selectedTrip.route?.stops || selectedTrip.route?.paradas || [];

      if (Array.isArray(routeStops) && routeStops.length) {
        const boardingStop = routeStops.find(s => String(s.name || s).toLowerCase() === String(boarding).toLowerCase());
        const dropoffStop = routeStops.find(s => String(s.name || s).toLowerCase() === String(dropoff).toLowerCase());

        if (boarding.toLowerCase() === selectedTrip.origin.toLowerCase() && dropoffStop?.priceFromOrigin !== undefined) {
          calculatedPrice = Number(dropoffStop.priceFromOrigin) || 0;
        } else if (boardingStop?.priceFromOrigin !== undefined && dropoff.toLowerCase() === selectedTrip.destination.toLowerCase()) {
          const boardingPrice = Number(boardingStop.priceFromOrigin) || 0;
          calculatedPrice = Math.max(parsedBase - boardingPrice, 0);
        } else if (boardingStop?.priceFromOrigin !== undefined && dropoffStop?.priceFromOrigin !== undefined) {
          const boardingPrice = Number(boardingStop.priceFromOrigin) || 0;
          const dropoffPrice = Number(dropoffStop.priceFromOrigin) || 0;
          calculatedPrice = Math.abs(dropoffPrice - boardingPrice);
        } else {
          calculatedPrice = parsedBase;
        }
      }
    } catch (e) {
      calculatedPrice = parsedBase;
    }

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

  // Funciones para renderizar el mapa de asientos
  const getSeatColor = (seat, isSelected) => {
    if (seat.isOccupied) return 'bg-gray-400 text-gray-700 cursor-not-allowed';
    if (isSelected) return 'bg-green-500 text-white border-2 border-green-700';
    if (seat.type === 'VIP') return 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500';
    if (seat.type === 'SEMI_CAMA') return 'bg-purple-400 text-purple-900 hover:bg-purple-500';
    return 'bg-blue-400 text-blue-900 hover:bg-blue-500';
  };

  const getSeatIcon = (seat) => {
    if (seat.isOccupied) return '✕';
    if (seat.type === 'VIP') return '👑';
    if (seat.type === 'SEMI_CAMA') return '🛏️';
    return '💺';
  };

  const handleSeatSelect = (seat) => {
    if (seat.isOccupied) return;
    setCreateForm(cf => ({ ...cf, seatNumber: seat.number }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PAID: { variant: 'default', label: 'Pagado', icon: CheckCircle },
      RESERVED: { variant: 'secondary', label: 'Reservado', icon: Clock },
      PENDING_PAYMENT: { variant: 'outline', label: 'Pago Pendiente', icon: Clock },
      USED: { variant: 'secondary', label: 'Usado', icon: CheckCircle },
      CANCELLED: { variant: 'destructive', label: 'Cancelado', icon: XCircle },
      EXPIRED: { variant: 'secondary', label: 'Expirado', icon: Clock },
      // Mantener ACTIVE por compatibilidad
      ACTIVE: { variant: 'default', label: 'Activo', icon: CheckCircle }
    };
    
    const config = statusConfig[status] || statusConfig.ACTIVE;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getSeatTypeBadge = (seatType) => {
    const typeConfig = {
      NORMAL: { variant: 'outline', label: 'Normal' },
      VIP: { variant: 'secondary', label: 'VIP' },
      SEMI_CAMA: { variant: 'default', label: 'Semi-cama' }
    };
    
    const config = typeConfig[seatType] || typeConfig.NORMAL;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy HH:mm", { locale: es });
    } catch (e) {
      return 'N/A';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Extraer solo la parte de la fecha (YYYY-MM-DD) y parsear sin zona horaria
      const dateOnly = dateString.split('T')[0];
      const date = parseISO(dateOnly);
      
      return format(date, "EEE, dd 'de' MMM yyyy", { locale: es });
    } catch (e) {
      return 'N/A';
    }
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const dateOnly = dateString.split('T')[0];
      const date = parseISO(dateOnly);
      return format(date, "dd/MM/yyyy", { locale: es });
    } catch (e) {
      return 'N/A';
    }
  };

  // Función específica para formatear fechas de trips (YYYY-MM-DD) sin problemas de timezone
  const formatTripDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Asegurar que es un string y tiene el formato correcto
      const dateStr = String(dateString).split('T')[0]; // Por si viene con hora
      
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr; // Retornar tal cual si no es el formato esperado
      }
      
      // Parsear como fecha local sin conversión de timezone
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      if (isNaN(date.getTime())) return dateStr;
      
      const dayNames = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
      const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      
      return `${dayNames[date.getDay()]}, ${day} ${monthNames[month - 1]} ${year}`;
    } catch (e) {
      console.error('Error formateando fecha:', dateString, e);
      return String(dateString);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si es superadmin y no ha seleccionado cooperativa, mostrar mensaje
  if (user?.role === 'SUPER_ADMIN' && !coopId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Ticket className="h-16 w-16 text-gray-400" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Selecciona una cooperativa</h3>
          <p className="text-gray-500 mt-1">Para gestionar tickets, primero selecciona una cooperativa en el menú lateral.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Tickets</h1>
          <p className="text-muted-foreground">
            Administrar y validar tickets de los pasajeros
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Ticket
          </Button>
          <Button variant="outline" onClick={loadTickets}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                <p className="text-2xl font-bold">{tickets.length}</p>
              </div>
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pagados</p>
                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'PAID').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reservados</p>
                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'RESERVED').length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cancelados</p>
                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'CANCELLED').length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Ticket, pasajero, cédula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="PAID">Pagado</SelectItem>
                  <SelectItem value="RESERVED">Reservado</SelectItem>
                  <SelectItem value="PENDING_PAYMENT">Pago Pendiente</SelectItem>
                  <SelectItem value="USED">Usado</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  <SelectItem value="EXPIRED">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha de Viaje</Label>
              <Input
                id="date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2 flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setDateFilter('');
                }}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de tickets */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{ticket.ticketNumber}</h3>
                    {getStatusBadge(ticket.status)}
                    {getSeatTypeBadge(ticket.seatType)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Pasajero</p>
                        <p className="text-sm">{ticket.passenger?.name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{ticket.passenger?.cedula || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Ruta</p>
                        <p className="text-sm">
                          {ticket.trip?.route?.origin || 'N/A'} → {ticket.trip?.route?.destination || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Fecha y Hora</p>
                        <p className="text-sm">
                          {ticket.trip?.departureDate ? formatDate(ticket.trip.departureDate) : 'N/A'} - {ticket.trip?.departureTime || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Asiento</p>
                        <p className="text-sm">#{ticket.seatNumber}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Precio</p>
                        <p className="text-sm">{formatCurrency(ticket.price)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Código QR</p>
                        <p className="text-xs text-muted-foreground">{ticket.qrCode}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Comprado: {formatDateTime(ticket.createdAt)}
                      {ticket.validatedAt && (
                        <span className="ml-4">
                          Validado: {formatDateTime(ticket.validatedAt)} por {ticket.validatedBy}
                        </span>
                      )}
                      {ticket.cancelledAt && (
                        <span className="ml-4">
                          Cancelado: {formatDateTime(ticket.cancelledAt)}
                          {ticket.cancellationReason && ` - ${ticket.cancellationReason}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setShowDetails(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {ticket.status === 'ACTIVE' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleValidateTicket(ticket.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelTicket(ticket.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {/* Subir comprobante */}
                  <label className="ml-2 inline-flex items-center cursor-pointer">
                    <input type="file" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append('paymentProof', file);
                        formData.append('ticketId', ticket.id);
                        api.post('/tickets/payment/upload-proof', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
                          .then(() => {
                            toast.success('Comprobante subido');
                            loadTickets();
                          })
                          .catch((err) => {
                            console.error('Error subiendo comprobante', err);
                            toast.error('No se pudo subir comprobante');
                          });
                      }
                    }} />
                    <span className="text-sm text-blue-600">Subir comprobante</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTickets.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || statusFilter !== 'ALL' || dateFilter 
                ? 'No se encontraron tickets con los filtros aplicados'
                : 'No hay tickets registrados'
              }
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'ALL' || dateFilter
                ? 'Intenta ajustar los filtros de búsqueda.'
                : 'Los tickets aparecerán aquí cuando los clientes realicen reservas.'
              }
            </p>
            {(searchTerm || statusFilter !== 'ALL' || dateFilter) && (
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setDateFilter('');
                }}
              >
                Limpiar Filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de detalles */}
      {showDetails && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Detalles del Ticket</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedTicket(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Número de Ticket</Label>
                  <p className="text-sm">{selectedTicket.ticketNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Estado</Label>
                  <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Información del Pasajero</Label>
                <div className="bg-muted p-3 rounded">
                  <p><strong>Nombre:</strong> {selectedTicket.passenger?.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedTicket.passenger?.email || 'N/A'}</p>
                  <p><strong>Teléfono:</strong> {selectedTicket.passenger?.phone || 'N/A'}</p>
                  <p><strong>Cédula:</strong> {selectedTicket.passenger?.cedula || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Información del Viaje</Label>
                <div className="bg-muted p-3 rounded">
                  <p><strong>Ruta:</strong> {selectedTicket.trip?.route?.origin || 'N/A'} → {selectedTicket.trip?.route?.destination || 'N/A'}</p>
                  <p><strong>Fecha:</strong> {selectedTicket.trip?.departureDate ? formatDate(selectedTicket.trip.departureDate) : 'N/A'}</p>
                  <p><strong>Hora de salida:</strong> {selectedTicket.trip?.departureTime || 'N/A'}</p>
                  <p><strong>Bus:</strong> {selectedTicket.trip?.bus?.placa || 'N/A'} ({selectedTicket.trip?.bus?.marca || 'N/A'})</p>
                  <p><strong>Conductor:</strong> {selectedTicket.trip?.driver?.name || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Asiento</Label>
                  <p className="text-sm">#{selectedTicket.seatNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tipo</Label>
                  <div className="mt-1">{getSeatTypeBadge(selectedTicket.seatType)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Precio</Label>
                  <p className="text-sm font-bold">{formatCurrency(selectedTicket.price)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Código QR</Label>
                <Button
                  variant="outline"
                  onClick={() => setShowQr(true)}
                  className="w-full"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Ver Código QR
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div>
                  <Label className="text-sm font-medium">Fecha de Compra</Label>
                  <p className="text-sm">{formatDateTime(selectedTicket.createdAt)}</p>
                </div>
                {selectedTicket.validatedAt && (
                  <div>
                    <Label className="text-sm font-medium">Validado</Label>
                    <p className="text-sm">{formatDateTime(selectedTicket.validatedAt)} por {selectedTicket.validatedBy}</p>
                  </div>
                )}
                {selectedTicket.cancelledAt && (
                  <div>
                    <Label className="text-sm font-medium">Cancelado</Label>
                    <p className="text-sm">{formatDateTime(selectedTicket.cancelledAt)}</p>
                    {selectedTicket.cancellationReason && (
                      <p className="text-sm text-muted-foreground">Motivo: {selectedTicket.cancellationReason}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal para mostrar QR */}
      {showQr && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Código QR</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQr(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center bg-white p-6 rounded">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(selectedTicket.qrCode)}`}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Ticket: {selectedTicket.ticketNumber}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

        {/* Modal crear ticket */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Crear Ticket Manual</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTicket} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Frecuencia */}
                    <div className="col-span-2">
                      <Label>Frecuencia *</Label>
                      <select 
                        className="w-full p-2 rounded border" 
                        value={createForm.frequencyId || ''} 
                        onChange={(e) => handleSelectFrequency(e.target.value)}
                        required
                      >
                        <option value="">-- Seleccionar frecuencia --</option>
                        {frequencies.map(f => (
                          <option key={f.id || f._id} value={f.id || f._id}>
                            {f.name || `${f.route?.origin || ''} → ${f.route?.destination || ''}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Fecha */}
                    {createForm.frequencyId && (
                      <div className="col-span-2">
                        <Label>Fecha de Viaje *</Label>
                        <select 
                          className="w-full p-2 rounded border" 
                          value={createForm.selectedDate || ''} 
                          onChange={(e) => handleSelectDate(e.target.value)}
                          required
                        >
                          <option value="">-- Seleccionar fecha --</option>
                          {availableDates.map(date => (
                            <option key={date} value={date}>
                              {formatTripDate(date)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Selección de viaje (si hay más de uno en la fecha) */}
                    {createForm.selectedDate && availableTripsForDate && availableTripsForDate.length > 0 && (
                      <div className="col-span-2">
                        <Label>Viaje *</Label>
                        <select
                          className="w-full p-2 rounded border"
                          value={createForm.tripId || ''}
                          onChange={(e) => handleSelectTripById(e.target.value)}
                          required
                        >
                          <option value="">-- Seleccionar viaje --</option>
                          {availableTripsForDate.map(t => (
                            <option key={t.id || t._id} value={t.id || t._id}>
                              {(t.departureTime || t.time || t.frequency?.departureTime || '').toString()} - {t.bus?.placa || t.busId || 'Bus'} • {t.route?.origin || t.origin || ''} → {t.route?.destination || t.destination || ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Bus */}
                    {availableBuses && availableBuses.length > 0 && (
                      <div className="col-span-2">
                        <Label>Bus *</Label>
                        <select 
                          className="w-full p-2 rounded border" 
                          value={createForm.busId || ''} 
                          onChange={(e) => {
                            const busData = availableBuses.find(b => (b.id || b._id) === e.target.value);
                            handleSelectBus(busData);
                          }}
                          required
                        >
                          <option value="">-- Seleccionar bus --</option>
                          {availableBuses.map(busData => (
                            <option key={busData.id || busData._id} value={busData.id || busData._id}>
                              {busData.bus?.placa || 'Bus'} - {busData.bus?.marca || ''} ({busData.departureTime || 'Sin hora'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Mapa de Asientos usando componente AdminSeatMap */}
                    {createForm.tripId && selectedTrip && (
                      <div className="col-span-2">
                        <Label className="mb-2 block">Seleccione un Asiento *</Label>
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <AdminSeatMap
                            trip={selectedTrip}
                            selectedSeat={createForm.seatNumber}
                            onSeatSelect={(seatNumber) => {
                              console.log('Seat selected:', seatNumber);
                              setCreateForm(cf => ({ ...cf, seatNumber }));
                            }}
                          />
                          {createForm.seatNumber && (
                            <div className="mt-3 text-center">
                              <Badge variant="default" className="text-sm">
                                Asiento seleccionado: #{createForm.seatNumber}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Paradas de subida y bajada */}
                    {createForm.tripId && (
                      <>
                        <div>
                          <Label>Parada de Subida *</Label>
                          <Input 
                            value={createForm.boardingStop} 
                            onChange={(e) => setCreateForm(f => ({ ...f, boardingStop: e.target.value }))}
                            placeholder="Parada de origen"
                            disabled
                            required
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
                              {selectedTrip?.destination && (
                                <SelectItem value={selectedTrip.destination}>
                                  {selectedTrip.destination} (Destino final)
                                </SelectItem>
                              )}
                              
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

                        {/* Mostrar precio calculado */}
                        {createForm.seatNumber && createForm.dropoffStop && (
                          <div key={`price-${createForm.seatNumber}-${createForm.dropoffStop}`} className="col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
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
                      </>
                    )}

                    {/* Información del pasajero */}
                    <div className="col-span-2">
                      <Label className="text-sm font-bold">Información del Pasajero</Label>
                    </div>

                    <div>
                      <Label>Nombre Completo *</Label>
                      <Input 
                        value={createForm.passengerName} 
                        onChange={(e) => setCreateForm(f => ({ ...f, passengerName: e.target.value }))}
                        placeholder="Ej: Juan Pérez"
                        required
                        minLength={3}
                      />
                    </div>

                    <div>
                      <Label>Cédula *</Label>
                      <Input 
                        value={createForm.passengerCedula} 
                        onChange={(e) => { 
                          setCreateForm(f => ({ ...f, passengerCedula: e.target.value })); 
                          lookupCedula(e.target.value); 
                        }}
                        placeholder="1234567890"
                        required
                        minLength={10}
                      />
                    </div>

                    <div>
                      <Label>Email *</Label>
                      <Input 
                        type="email"
                        value={createForm.passengerEmail} 
                        onChange={(e) => setCreateForm(f => ({ ...f, passengerEmail: e.target.value }))}
                        placeholder="ejemplo@email.com"
                        required
                      />
                    </div>

                    <div>
                      <Label>Teléfono</Label>
                      <Input 
                        value={createForm.passengerPhone || ''} 
                        onChange={(e) => setCreateForm(f => ({ ...f, passengerPhone: e.target.value }))}
                        placeholder="0999999999"
                      />
                    </div>

                    {/* Método de pago */}
                    <div className="col-span-2">
                      <Label>Método de Pago *</Label>
                      <select 
                        className="w-full p-2 rounded border" 
                        value={createForm.paymentMethod} 
                        onChange={(e) => setCreateForm(f => ({ ...f, paymentMethod: e.target.value }))}
                        required
                      >
                        <option value="CASH">Efectivo</option>
                        <option value="BANK_TRANSFER">Transferencia Bancaria</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <Button 
                      variant="outline" 
                      type="button"
                      disabled={creating}
                      onClick={() => {
                        setShowCreate(false);
                        setCreateForm({ frequencyId: '', tripId: '', selectedDate: '', busId: '', seatNumber: '', passengerName: '', passengerCedula: '', passengerEmail: '', passengerPhone: '', paymentMethod: 'CASH', boardingStop: '', dropoffStop: '' });
                        setAvailableDates([]);
                        setAvailableBuses([]);
                        setSelectedBusSeats([]);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        'Crear Ticket'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
    </div>
  );
}