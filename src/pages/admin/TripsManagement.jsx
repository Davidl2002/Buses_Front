import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Clock,
  Bus,
  User,
  Calendar,
  DollarSign,
  Save,
  X,
  Play,
  Pause,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { tripManagementService as tripService, routeService, busService, driverService, staffService, frequencyService, cooperativaService, enhancedTicketService as ticketService } from '@/services';
import toast from 'react-hot-toast';
import useActiveCooperativaId from '@/hooks/useActiveCooperativaId';
import { useAuth } from '@/contexts/AuthContext';

export default function TripsManagement() {
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [frequencies, setFrequencies] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [cooperativas, setCooperativas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  
  const [formData, setFormData] = useState({
    cooperativaId: '',
    routeId: '',
    busId: '',
    driverId: '',
    assistantId: '',
    departureDate: '',
    departureTime: '',
    price: '',
    status: 'SCHEDULED'
  });
  const coopId = useActiveCooperativaId();
  const { user } = useAuth();

  useEffect(() => {
    if (coopId || user?.cooperativaId) {
      loadData();
    }
  }, [coopId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar cooperativas si es SUPER_ADMIN
      if (user?.role === 'SUPER_ADMIN') {
        try {
          const coopRes = await cooperativaService.getAll();
          const coopData = coopRes.data?.data || coopRes.data || [];
          setCooperativas(Array.isArray(coopData) ? coopData : []);
        } catch (err) {
          console.warn('No se pudieron cargar cooperativas', err);
        }
      }
      
      await Promise.all([
        loadFrequencies(),
        loadRoutes(),
        loadBuses(),
        loadDrivers(),
        loadAssistants(),
        loadTrips()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrips = async () => {
    try {
      const params = {};
      if (coopId) params.cooperativaId = coopId;
      const response = await tripService.getAll(params);
      console.log('Trips API response:', response.data);
      
      if (response.data.success && response.data.data) {
        let tripsData = response.data.data;
        
        // Filtrado frontend si es SUPER_ADMIN y hay cooperativa seleccionada
        if (user?.role === 'SUPER_ADMIN' && coopId) {
          console.log('🔍 TripsManagement - Filtrando viajes para cooperativa:', coopId);
          tripsData = tripsData.filter(t => {
            const tripCoopId = t.cooperativaId || t.cooperativa?._id || t.cooperativa?.id;
            return tripCoopId === coopId;
          });
          console.log('Viajes filtrados:', tripsData.length, 'registros');
        }
        
        // Cargar todos los tickets para calcular ocupación real
        let ticketsData = [];
        try {
          const ticketsResponse = await ticketService.getAll();
          ticketsData = ticketsResponse.data?.data || [];
          console.log('Tickets cargados para calcular ocupación:', ticketsData.length);
        } catch (err) {
          console.warn('Error cargando tickets para ocupación:', err);
        }
        
        // Crear un mapa de tripId -> cantidad de tickets activos
        const occupancyMap = {};
        ticketsData.forEach(ticket => {
          const tripId = ticket.tripId || ticket.trip?.id || ticket.trip?._id;
          // Solo contar tickets activos (no cancelados ni expirados)
          if (tripId && ticket.status && !['CANCELLED', 'EXPIRED'].includes(ticket.status)) {
            occupancyMap[tripId] = (occupancyMap[tripId] || 0) + 1;
          }
        });
        
        console.log('Mapa de ocupación calculado:', occupancyMap);
        
        // Transformar datos del backend al formato esperado por el frontend
        const transformedTrips = tripsData.map(trip => {
          const tripId = trip.id || trip._id;
          
          // normalize route info
          const routeObj = trip.route || trip.frequency?.route || {};
          const route = {
            origin: trip.origin || routeObj.origin || '',
            destination: trip.destination || routeObj.destination || '',
            estimatedDuration: routeObj.estimatedDuration || trip.estimatedDuration || ''
          };

          // normalize driver: backend may return driver object, or driverName/driverFirst/Last or only driverId
          let driver = null;
          if (trip.driver) {
            driver = {
              ...trip.driver,
              id: trip.driver.id != null ? String(trip.driver.id) : (trip.driverId != null ? String(trip.driverId) : null)
            };
            if (!driver.name && (driver.firstName || driver.lastName)) {
              driver.name = `${driver.firstName || ''} ${driver.lastName || ''}`.trim();
            }
            // do not force a placeholder name here; prefer resolving from drivers list
            if (driver.name === 'Por asignar') delete driver.name;
          } else if (trip.driverName) {
            driver = { id: trip.driverId != null ? String(trip.driverId) : null, name: trip.driverName };
          } else if (trip.driverFirstName || trip.driverLastName) {
            driver = { id: trip.driverId != null ? String(trip.driverId) : null, name: `${trip.driverFirstName || ''} ${trip.driverLastName || ''}`.trim() };
          } else if (trip.driverId) {
            driver = { id: String(trip.driverId) };
          }

          // normalize assistant: similar rules as driver
          let assistant = null;
          if (trip.assistant) {
            assistant = {
              ...trip.assistant,
              id: trip.assistant.id != null ? String(trip.assistant.id) : (trip.assistantId != null ? String(trip.assistantId) : null)
            };
            if (!assistant.name && (assistant.firstName || assistant.lastName)) {
              assistant.name = `${assistant.firstName || ''} ${assistant.lastName || ''}`.trim();
            }
            if (assistant.name === 'Por asignar') delete assistant.name;
          } else if (trip.assistantName) {
            assistant = { id: trip.assistantId != null ? String(trip.assistantId) : null, name: trip.assistantName };
          } else if (trip.assistantFirstName || trip.assistantLastName) {
            assistant = { id: trip.assistantId != null ? String(trip.assistantId) : null, name: `${trip.assistantFirstName || ''} ${trip.assistantLastName || ''}`.trim() };
          } else if (trip.assistantId) {
            assistant = { id: String(trip.assistantId) };
          }

          // compute arrivalTime if backend doesn't provide it
          let departureTime = trip.departureTime || '';
          let arrivalTime = trip.arrivalTime || '';
          if (!arrivalTime && departureTime && (route.estimatedDuration || '')) {
            try {
              arrivalTime = calculateArrivalTime(departureTime, route.estimatedDuration);
            } catch (e) {
              arrivalTime = '';
            }
          }

          // Calcular ocupación real desde los tickets
          const occupiedSeats = occupancyMap[tripId] || 0;

          return {
            id: trip.id,
            frequencyId: trip.frequency?.id != null ? String(trip.frequency.id) : (trip.frequencyId != null ? String(trip.frequencyId) : null),
            route,
            departureDate: trip.date || trip.departureDate || '',
            departureTime,
            arrivalTime,
            price: trip.basePrice || trip.price || 0,
            status: trip.status,
            bus: trip.bus || { placa: 'N/A', marca: 'N/A', totalSeats: 40, id: trip.busId },
            busId: trip.bus?.id != null ? String(trip.bus.id) : (trip.busId != null ? String(trip.busId) : null),
            driver: driver || (trip.driverId ? { id: String(trip.driverId) } : null),
            assistant: assistant || (trip.assistantId ? { id: String(trip.assistantId) } : null),
            occupiedSeats, // Usar la ocupación calculada desde tickets
            cooperativaId: trip.cooperativaId
          };
        });
        
        setTrips(transformedTrips);
        return;
      }
      
      throw new Error('Invalid API response structure');
    } catch (error) {
      console.error('Error loading trips:', error);
      // Datos de demostración
      setTrips([
        {
          id: '1',
          route: {
            id: '1',
            origin: 'Quito',
            destination: 'Guayaquil',
            basePrice: 15.00,
            estimatedDuration: '8h 30m'
          },
          bus: {
            id: '1',
            placa: 'ABC-123',
            marca: 'Mercedes',
            totalSeats: 40
          },
          driver: {
            id: '1',
            name: 'Juan Pérez',
            license: 'D1234567'
          },
          departureDate: '2024-12-20',
          departureTime: '06:00',
          arrivalTime: '14:30',
          price: 15.00,
          status: 'SCHEDULED',
          occupiedSeats: 12,
          createdAt: '2024-12-19T10:00:00Z'
        },
        {
          id: '2',
          route: {
            id: '2',
            origin: 'Guayaquil',
            destination: 'Quito',
            basePrice: 15.00,
            estimatedDuration: '8h 30m'
          },
          bus: {
            id: '2',
            placa: 'XYZ-789',
            marca: 'Volvo',
            totalSeats: 35
          },
          driver: {
            id: '2',
            name: 'María González',
            license: 'D7654321'
          },
          departureDate: '2024-12-20',
          departureTime: '15:00',
          arrivalTime: '23:30',
          price: 15.00,
          status: 'IN_PROGRESS',
          occupiedSeats: 25,
          createdAt: '2024-12-19T11:00:00Z'
        }
      ]);
    }
  };

  const loadRoutes = async () => {
    try {
      const params = {};
      if (coopId) params.cooperativaId = coopId;
      const response = await routeService.getAll(params);
      setRoutes(response.data.data || []);
    } catch (error) {
      console.error('Error loading routes:', error);
      setRoutes([
        { id: '1', origin: 'Quito', destination: 'Guayaquil', basePrice: 15.00, estimatedDuration: '8h 30m' },
        { id: '2', origin: 'Guayaquil', destination: 'Quito', basePrice: 15.00, estimatedDuration: '8h 30m' }
      ]);
    }
  };

  const loadFrequencies = async (specificCoopId = null) => {
    try {
      const params = {};
      const cooperativaId = specificCoopId || coopId || user?.cooperativaId;
      if (cooperativaId) params.cooperativaId = cooperativaId;
      const response = await frequencyService.getAll(params);
      let frequenciesData = response.data.data || [];
      
      
      // Filtrado adicional en frontend si es necesario
      if (cooperativaId) {
        frequenciesData = frequenciesData.filter(freq => {
          const freqCoopId = freq.cooperativaId || freq.cooperativa?._id || freq.cooperativa?.id;
          return freqCoopId === cooperativaId;
        });
        console.log('✅ Frecuencias después de filtrar:', frequenciesData.length);
      }
      
      setFrequencies(frequenciesData);
    } catch (error) {
      console.error('Error loading frequencies:', error);
      setFrequencies([]);
    }
  };

  const loadBuses = async (specificCoopId = null) => {
    try {
      const params = {};
      const cooperativaId = specificCoopId || coopId || user?.cooperativaId;
      if (cooperativaId) params.cooperativaId = cooperativaId;
      const response = await busService.getAll(params);
      let busesData = response.data.data?.filter(bus => bus.status === 'ACTIVE') || [];
      
      // Filtrado frontend si es SUPER_ADMIN y hay cooperativa seleccionada
      if (user?.role === 'SUPER_ADMIN' && coopId) {
        console.log('🔍 TripsManagement - Filtrando buses para cooperativa:', coopId);
        busesData = busesData.filter(b => {
          const busCoopId = b.cooperativaId || b.cooperativa?._id || b.cooperativa?.id;
          return busCoopId === coopId;
        });
        console.log('✅ Buses filtrados:', busesData.length, 'registros');
      }
      
      setBuses(busesData);
    } catch (error) {
      console.error('Error loading buses:', error);
      setBuses([
        { id: '1', placa: 'ABC-123', marca: 'Mercedes', totalSeats: 40, status: 'ACTIVE' },
        { id: '2', placa: 'XYZ-789', marca: 'Volvo', totalSeats: 35, status: 'ACTIVE' }
      ]);
    }
  };

  const loadDrivers = async (specificCoopId = null) => {
    try {
      const params = { role: 'CHOFER' };
      const cooperativaId = specificCoopId || coopId || user?.cooperativaId;
      if (cooperativaId) params.cooperativaId = cooperativaId;
      
      const response = await staffService.getAll(params);
      const raw = response.data?.data ?? response.data ?? [];
      
      // normalize and be liberal with status field names
      let normalized = (Array.isArray(raw) ? raw : []).filter(d => d).map(d => ({
        id: d.id != null ? String(d.id) : null,
        name: d.name || (d.firstName ? `${d.firstName} ${d.lastName || ''}`.trim() : undefined) || d.fullName || d.driverName || null,
        license: d.license || d.licencia || null,
        status: d.status || d.state || (d.active === true ? 'ACTIVE' : d.active === false ? 'INACTIVE' : null),
        cooperativaId: d.cooperativaId || d.cooperativa?._id || d.cooperativa?.id
      }));
      
      // Filtrado adicional en frontend si es necesario
      if (cooperativaId) {
        normalized = normalized.filter(d => {
          console.log('  - Conductor:', d.name, 'cooperativaId:', d.cooperativaId, 'match:', d.cooperativaId === cooperativaId);
          return d.cooperativaId === cooperativaId;
        });
        console.log('✅ Conductores después de filtrar:', normalized.length);
      }

      // keep only active if status explicitly indicates inactivity; otherwise include all
      const filtered = normalized.filter(d => d.status === null || d.status === undefined || d.status === 'ACTIVE' || d.status === 'active' || d.status === true);
      setDrivers(filtered.map(d => ({ ...d, name: d.name || 'Sin nombre' })));
    } catch (error) {
      console.error('Error loading drivers:', error);
      setDrivers([]);
    }
  };

  const loadAssistants = async (specificCoopId = null) => {
    try {
      const params = { role: 'CHOFER' };
      const cooperativaId = specificCoopId || coopId || user?.cooperativaId;
      if (cooperativaId) params.cooperativaId = cooperativaId;
      
      const response = await staffService.getAll(params);
      const raw = response.data?.data ?? response.data ?? [];
      
      let normalized = (Array.isArray(raw) ? raw : []).filter(a => a).map(a => ({
        id: a.id != null ? String(a.id) : null,
        name: a.name || (a.firstName ? `${a.firstName} ${a.lastName || ''}`.trim() : undefined) || a.fullName || null,
        status: a.status || a.state || (a.active === true ? 'ACTIVE' : a.active === false ? 'INACTIVE' : null),
        cooperativaId: a.cooperativaId || a.cooperativa?._id || a.cooperativa?.id
      }));
      
      // Filtrado adicional en frontend si es necesario
      if (cooperativaId) {
        normalized = normalized.filter(a => {
          return a.cooperativaId === cooperativaId;
        });
        console.log('✅ Ayudantes después de filtrar:', normalized.length);
      }

      const filtered = normalized.filter(a => a.status === null || a.status === undefined || a.status === 'ACTIVE' || a.status === 'active' || a.status === true);
      setAssistants(filtered.map(a => ({ ...a, name: a.name || 'Sin nombre' })));
    } catch (error) {
      console.error('Error loading assistants:', error);
      setAssistants([]);
    }
  };

  // Helpers to display driver name and compute arrival time when missing
  const getDriverDisplayName = (trip) => {
    if (!trip) return 'Por asignar';
    // If driver id exists, prefer resolving name from drivers list
    const driverId = trip.driver?.id || trip.driverId || null;
    if (driverId) {
      const found = drivers.find(x => String(x.id) === String(driverId));
      if (found && found.name) return found.name;
    }

    // If driver object contains a name (and wasn't the placeholder), use it
    if (trip.driver && trip.driver.name) return trip.driver.name;

    // fallbacks for scattered fields
    if (trip.driverName) return trip.driverName;
    if (trip.driverFirstName || trip.driverLastName) return `${trip.driverFirstName || ''} ${trip.driverLastName || ''}`.trim() || 'Por asignar';

    return 'Por asignar';
  };

  const getArrivalDisplay = (trip) => {
    if (!trip) return '-';
    if (trip.arrivalTime) return trip.arrivalTime;
    if (trip.departureTime && trip.route?.estimatedDuration) {
      try {
        return calculateArrivalTime(trip.departureTime, trip.route.estimatedDuration);
      } catch (e) {
        return '-';
      }
    }
    return '-';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!editingTrip && !formData.frequencyId) || !formData.busId || !formData.driverId || !formData.departureDate || !formData.departureTime) {
      toast.error('Completa todos los campos obligatorios (frecuencia, bus, conductor, fecha, hora)');
      return;
    }

    // validate date against frequency operating days when frequency is present
    const selectedFrequency = frequencies.find(f => String(f.id) === String(formData.frequencyId));
    if (selectedFrequency) {
      const allowed = normalizeOperatingDays(selectedFrequency.operatingDays || selectedFrequency.days || selectedFrequency.operating_days || selectedFrequency.daysOfWeek);
      if (allowed && allowed.length > 0 && !isDateAllowedByFrequency(formData.departureDate, selectedFrequency)) {
        toast.error('La fecha seleccionada no corresponde con los días de operación de la frecuencia. Elige otra fecha.');
        return;
      }
    }

    const makeIsoAtNoon = (ymd) => {
      const m = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(String(ymd));
      if (!m) return ymd;
      const year = parseInt(m[1], 10);
      const month = parseInt(m[2], 10) - 1;
      const day = parseInt(m[3], 10);
      // create local date at midday to avoid timezone shifts when converted to ISO
      const d = new Date(year, month, day, 12, 0, 0);
      return d.toISOString();
    };

    try {
      setLoading(true);
      const selectedFrequency = frequencies.find(f => f.id === formData.frequencyId);
      const selectedRoute = selectedFrequency?.route || routes.find(r => r.id === formData.routeId);

      const dateToSend = makeIsoAtNoon(formData.departureDate);

      const tripData = {
        frequencyId: formData.frequencyId,
        busId: formData.busId,
        driverId: formData.driverId,
        assistantId: formData.assistantId || null,
        date: dateToSend,
        departureTime: formData.departureTime,
        basePrice: parseFloat(formData.price) || selectedRoute?.basePrice || selectedFrequency?.basePrice || 0,
        status: formData.status
      };

      if (editingTrip) {
        await tripService.update(editingTrip.id, tripData);
        toast.success('Viaje actualizado correctamente');
      } else {
        await tripService.create(tripData);
        toast.success('Viaje creado correctamente');
      }

      setShowForm(false);
      setEditingTrip(null);
      resetForm();
      loadTrips();
    } catch (error) {
      console.error('Error saving trip:', error);
      toast.error('Error al guardar el viaje');
    } finally {
      setLoading(false);
    }
  };

  const calculateArrivalTime = (departureTime, duration) => {
    if (!departureTime || !duration) return '';
    
    const [hours, minutes] = departureTime.split(':').map(Number);
    const durationMatch = duration.match(/(\d+)h\s*(\d+)?m?/);
    
    if (!durationMatch) return '';
    
    const durationHours = parseInt(durationMatch[1]) || 0;
    const durationMinutes = parseInt(durationMatch[2]) || 0;
    
    let totalMinutes = hours * 60 + minutes + durationHours * 60 + durationMinutes;
    const arrivalHours = Math.floor(totalMinutes / 60) % 24;
    const arrivalMinutes = totalMinutes % 60;
    
    return `${arrivalHours.toString().padStart(2, '0')}:${arrivalMinutes.toString().padStart(2, '0')}`;
  };

  const handleEdit = (trip) => {
    setEditingTrip(trip);
    setFormData({
      cooperativaId: trip.cooperativaId || coopId || user?.cooperativaId || '',
      frequencyId: trip.frequency?.id != null ? String(trip.frequency?.id) : (trip.frequencyId != null ? String(trip.frequencyId) : ''),
      busId: trip.bus?.id != null ? String(trip.bus?.id) : (trip.busId != null ? String(trip.busId) : ''),
      driverId: trip.driver?.id != null ? String(trip.driver?.id) : (trip.driverId != null ? String(trip.driverId) : ''),
      assistantId: trip.assistant?.id != null ? String(trip.assistant?.id) : (trip.assistantId != null ? String(trip.assistantId) : ''),
      departureDate: formatDateForInput(trip.departureDate || trip.date),
      departureTime: formatTimeForInput(trip.departureTime),
      price: (trip.price || trip.basePrice || 0).toString(),
      status: trip.status || 'SCHEDULED'
    });
    setShowForm(true);
  };

  const handleDelete = async (tripId) => {
    if (!confirm('¿Estás seguro de eliminar este viaje?')) return;

    try {
      await tripService.delete(tripId);
      toast.success('Viaje eliminado correctamente');
      loadTrips();
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast.error('Error al eliminar el viaje');
    }
  };

  const handleStatusChange = async (tripId, newStatus) => {
    try {
      await tripService.updateStatus(tripId, newStatus);
      toast.success('Estado actualizado correctamente');
      loadTrips();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const resetForm = () => {
    const defaultCoopId = coopId || user?.cooperativaId || '';
    setFormData({
      cooperativaId: defaultCoopId,
      frequencyId: '',
      busId: '',
      driverId: '',
      assistantId: '',
      departureDate: '',
      departureTime: '',
      price: '',
      status: 'SCHEDULED'
    });
  };

  const handleCooperativaChange = async (newCoopId) => {
    // Actualizar el formulario y limpiar campos dependientes
    setFormData(prev => ({ 
      ...prev, 
      cooperativaId: newCoopId,
      frequencyId: '',
      busId: '',
      driverId: '',
      assistantId: ''
    }));
    
    // Recargar todos los datos filtrados por la nueva cooperativa
    try {
      await Promise.all([
        loadFrequencies(newCoopId),
        loadBuses(newCoopId),
        loadDrivers(newCoopId),
        loadAssistants(newCoopId)
      ]);
    } catch (error) {
      console.error('Error recargando datos para la cooperativa:', error);
      toast.error('Error al cargar datos de la cooperativa');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      SCHEDULED: { variant: 'secondary', label: 'Programado', icon: Calendar },
      IN_PROGRESS: { variant: 'default', label: 'En Curso', icon: Play },
      COMPLETED: { variant: 'default', label: 'Completado', icon: CheckCircle },
      CANCELLED: { variant: 'destructive', label: 'Cancelado', icon: X },
      
    };
    
    const config = statusConfig[status] || statusConfig.SCHEDULED;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Filtros para la lista de viajes
  const [statusFilter, setStatusFilter] = useState('');
  // Use a sentinel for "all frequencies" to avoid empty-string SelectItem errors from Radix
  const [frequencyFilter, setFrequencyFilter] = useState('__all');
  // Búsqueda por frecuencias (live search)
  const [frequencyQuery, setFrequencyQuery] = useState('');

  const toggleStatusFilter = (s) => setStatusFilter(prev => prev === s ? '' : s);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    // If already YYYY-MM-DD, construct date using local timezone to avoid UTC parsing issues
    const ymdMatch = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(String(dateString));
    let d;
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      // Interpret plain YYYY-MM-DD as a UTC calendar date for display consistency
      d = new Date(Date.UTC(year, month, day));
    } else {
      // If the string looks like an ISO datetime, parse and format using UTC
      // to reflect the server-stored calendar date (avoid local timezone shift)
      const asStr = String(dateString);
      const isoLike = /T|Z|[+-]\d{2}:?\d{2}/.test(asStr);
      d = new Date(dateString);
      if (isNaN(d.getTime())) {
        // Try appending time to help parsers that need it
        d = new Date(asStr + 'T00:00:00');
        if (isNaN(d.getTime())) return dateString;
      }
      if (isoLike) {
        return d.toLocaleDateString('es-EC', {
          timeZone: 'UTC',
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    }

    return d.toLocaleDateString('es-EC', {
      timeZone: 'UTC',
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Normalizadores para inputs HTML
  const formatDateForInput = (value) => {
    if (!value) return '';
    // If already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    // If ISO datetime, extract date part
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return '';
      // use local date components to avoid timezone shifts
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch (e) {
      return '';
    }
  };

  const formatTimeForInput = (value) => {
    if (!value) return '';
    // Already HH:mm
    if (/^\d{2}:\d{2}$/.test(value)) return value;
    // If ISO datetime like 2025-11-26T08:00:00.000Z
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return '';
      // use local time components
      const hh = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      return `${hh}:${mm}`;
    } catch (e) {
      return '';
    }
  };

  const formatDurationRaw = (raw) => {
    if (raw == null) return '';
    // if numeric (minutes)
    if (typeof raw === 'number' || /^[0-9]+$/.test(String(raw).trim())) {
      const minutes = parseInt(raw, 10);
      if (isNaN(minutes)) return '';
      if (minutes < 60) return `${minutes}m`;
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${h}h${m > 0 ? ' ' + m + 'm' : ''}`;
    }

    // if already in '8h 30m' or '8:30' format, try to normalize
    const hhmm = String(raw).trim();
    const match = hhmm.match(/(\d+)\s*h(?:ours?)?\s*(\d+)?\s*m?/i) || hhmm.match(/^(\d+):(\d{2})$/);
    if (match) {
      if (match[1] && match[2]) return `${parseInt(match[1], 10)}h ${parseInt(match[2], 10)}m`;
      if (match[1]) return `${parseInt(match[1], 10)}h`;
    }

    return hhmm;
  };

  // Normalize various representations of operating days to numbers 0..6 (0=Sunday)
  const normalizeOperatingDays = (rawDays) => {
    if (!rawDays) return [];
    const mapNames = {
      'SUN':0,'SUNDAY':0,'DOMINGO':0,'DOM':0,
      'MON':1,'MONDAY':1,'LUNES':1,'LUN':1,
      'TUE':2,'TUESDAY':2,'MARTES':2,'MAR':2,
      'WED':3,'WEDNESDAY':3,'MIERCOLES':3,'MIE':3,
      'THU':4,'THURSDAY':4,'JUEVES':4,'JUE':4,
      'FRI':5,'FRIDAY':5,'VIERNES':5,'VIE':5,
      'SAT':6,'SATURDAY':6,'SABADO':6,'SAB':6
    };

    // Accept arrays of primitives or objects
    let arr = [];
    if (Array.isArray(rawDays)) arr = rawDays;
    else if (typeof rawDays === 'object' && rawDays !== null) {
      // if it's an object with numeric keys or a map, try to extract values
      // e.g. { days: [1,2,3] }
      const possible = rawDays.days || rawDays.operatingDays || rawDays.weekdays || rawDays.daysOfWeek || rawDays.workDays;
      if (Array.isArray(possible)) arr = possible;
      else arr = [rawDays];
    } else {
      arr = String(rawDays).split(/[,;|\s]+/);
    }
    const result = new Set();
    arr.forEach(d => {
      if (d == null) return;
      // handle objects like { day: 1 } or { weekday: 'MON' }
      if (typeof d === 'object') {
        const obj = d;
        const cand = obj.day ?? obj.weekday ?? obj.weekDay ?? obj.wday ?? obj.value ?? obj.index;
        if (cand != null) d = cand;
        else return;
      }
      const v = String(d).trim();
      if (v === '') return;
      // numeric values
      if (/^\d+$/.test(v)) {
        const n = parseInt(v, 10);
        // accept 0-6 or 1-7 (convert 7->0)
        if (n >= 0 && n <= 6) result.add(n);
        else if (n >= 1 && n <= 7) result.add(n % 7);
        return;
      }
      const key = v.toUpperCase();
      if (mapNames[key] != null) result.add(mapNames[key]);
    });
    return Array.from(result).sort((a,b)=>a-b);
  };

  // Return array of next N dates (YYYY-MM-DD) that fall on allowedDays (0=Sun)
  const getNextAllowedDates = (allowedDays, daysRange = 60, limit = 30) => {
    const out = [];
    if (!allowedDays || allowedDays.length === 0) return out;
    const today = new Date();
    for (let i=0;i<daysRange && out.length<limit;i++){
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const wd = d.getDay();
      if (allowedDays.includes(wd)) {
        // Use local date components to avoid timezone shifts
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        out.push(`${y}-${m}-${day}`);
      }
    }
    return out;
  };

  const isDateAllowedByFrequency = (dateStr, frequency) => {
    if (!dateStr || !frequency) return true;
    const raw = frequency.operatingDays || frequency.days || frequency.operating_days || frequency.daysOfWeek;
    const allowed = normalizeOperatingDays(raw);
    if (!allowed || allowed.length===0) return true;
    // parse YYYY-MM-DD into local date to get correct weekday
    const m = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(String(dateStr));
    if (!m) return true;
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    const day = parseInt(m[3], 10);
    const d = new Date(year, month, day);
    if (isNaN(d.getTime())) return true;
    return allowed.includes(d.getDay());
  };

  if (loading && trips.length === 0) {
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
        <Calendar className="h-16 w-16 text-gray-400" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Selecciona una cooperativa</h3>
          <p className="text-gray-500 mt-1">Para gestionar viajes, primero selecciona una cooperativa en el menú lateral.</p>
        </div>
      </div>
    );
  }

  // Aplicar filtros seleccionados (estado y frecuencia)
  const visibleTrips = trips.filter(trip => {
    if (!trip || typeof trip !== 'object') return false;
    if (statusFilter && trip.status !== statusFilter) return false;
    if (!(frequencyFilter === '__all' || !frequencyFilter || String(trip.frequencyId) === String(frequencyFilter))) return false;
    // apply live search query: if empty, accept all; otherwise match frequency id or route origin/destination
    const q = String(frequencyQuery || '').trim().toLowerCase();
    if (!q) return true;
    const freqId = String(trip.frequencyId || '').toLowerCase();
    const origin = String(trip.route?.origin || '').toLowerCase();
    const destination = String(trip.route?.destination || '').toLowerCase();
    // Also check against loaded frequencies' metadata
    const freqObj = frequencies.find(f => String(f.id) === String(trip.frequencyId));
    const freqLabel = freqObj ? (`${String(freqObj.id)} ${String(freqObj.route?.origin||'')} ${String(freqObj.route?.destination||'')}`).toLowerCase() : '';
    return freqId.includes(q) || origin.includes(q) || destination.includes(q) || freqLabel.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Viajes</h1>
          <p className="text-muted-foreground">
            Programar y administrar los viajes de la cooperativa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar frecuencia (id, origen, destino)"
            value={frequencyQuery}
            onChange={(e) => setFrequencyQuery(e.target.value)}
            className="w-64"
          />

          {/* Select de frecuencias eliminado: se usa la búsqueda en vivo `frequencyQuery` */}

          <Button variant="outline" onClick={() => { setStatusFilter(''); setFrequencyFilter('__all'); setFrequencyQuery(''); }}>
            Limpiar
          </Button>

          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Viaje
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          onClick={() => toggleStatusFilter('SCHEDULED')}
          className={`cursor-pointer ${statusFilter === 'SCHEDULED' ? 'ring-2 ring-primary' : ''}`}
          role="button"
          tabIndex={0}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Programados</p>
                <p className="text-2xl font-bold">{trips.filter(t => t.status === 'SCHEDULED').length}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => toggleStatusFilter('IN_PROGRESS')}
          className={`cursor-pointer ${statusFilter === 'IN_PROGRESS' ? 'ring-2 ring-primary' : ''}`}
          role="button"
          tabIndex={0}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En Curso</p>
                <p className="text-2xl font-bold">{trips.filter(t => t.status === 'IN_PROGRESS').length}</p>
              </div>
              <Play className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => toggleStatusFilter('COMPLETED')}
          className={`cursor-pointer ${statusFilter === 'COMPLETED' ? 'ring-2 ring-primary' : ''}`}
          role="button"
          tabIndex={0}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completados</p>
                <p className="text-2xl font-bold">{trips.filter(t => t.status === 'COMPLETED').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ocupación Promedio</p>
                <p className="text-2xl font-bold">
                  {trips.length > 0 
                    ? Math.round((trips.reduce((acc, trip) => acc + (trip.occupiedSeats || 0), 0) / trips.reduce((acc, trip) => acc + trip.bus.totalSeats, 0)) * 100)
                    : 0}%
                </p>
              </div>
              <Bus className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulario en Modal */}
      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) {
          setEditingTrip(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTrip ? 'Editar Viaje' : 'Nuevo Viaje'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Selector de Cooperativa (solo SUPER_ADMIN) */}
              {user?.role === 'SUPER_ADMIN' && (
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="cooperativaId">Cooperativa *</Label>
                  <Select 
                    value={formData.cooperativaId} 
                    onValueChange={handleCooperativaChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cooperativa" />
                    </SelectTrigger>
                    <SelectContent>
                      {cooperativas.filter(c => c.isActive !== false).map((coop) => (
                        <SelectItem key={coop.id} value={coop.id}>
                          {coop.nombre || coop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="frequencyId">Frecuencia *</Label>
                {!editingTrip ? (
                  <Select value={formData.frequencyId} onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, frequencyId: value }));
                    const freq = frequencies.find(f => f.id === value);
                    const route = freq?.route || routes.find(r => r.id === freq?.routeId);
                    if (freq && !formData.price) {
                      setFormData(prev => ({ ...prev, price: (freq.basePrice || route?.basePrice || 0).toString() }));
                    }
                    // If freq defines operating days, prefill departureDate with first allowed date
                    try {
                      const rawDays = freq ? (freq.operatingDays || freq.days || freq.operating_days || freq.daysOfWeek) : null;
                      const allowed = normalizeOperatingDays(rawDays);
                      if (allowed && allowed.length > 0) {
                        const opts = getNextAllowedDates(allowed, 90, 30);
                        if (opts && opts.length > 0) {
                          setFormData(prev => ({ ...prev, departureDate: prev.departureDate && isDateAllowedByFrequency(prev.departureDate, freq) ? prev.departureDate : opts[0] }));
                        }
                      }
                    } catch (e) {
                      // ignore
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencies.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.id} — {f.route?.origin || 'Origen'} → {f.route?.destination || 'Destino'} ({f.route?.estimatedDuration || ''})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <input type="text" className="w-full input-disabled p-2 bg-gray-100 rounded" value={(() => {
                    const f = frequencies.find(x => x.id === formData.frequencyId) || {};
                    return `${f.id || formData.frequencyId} — ${f.route?.origin || ''} → ${f.route?.destination || ''}`;
                  })()} disabled />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="busId">Bus *</Label>
                {!editingTrip ? (
                  <Select value={formData.busId} onValueChange={(value) => setFormData(prev => ({ ...prev, busId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar bus" />
                    </SelectTrigger>
                    <SelectContent>
                      {buses.map((bus) => (
                        <SelectItem key={bus.id} value={bus.id}>
                          {bus.placa} - {bus.marca} ({bus.totalSeats} asientos)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <input type="text" className="w-full input-disabled p-2 bg-gray-100 rounded" value={(() => {
                    const b = buses.find(x => String(x.id) === String(formData.busId)) || {};
                    return `${b.placa || ''}${b.marca ? ' - ' + b.marca : ''}`.trim() || (formData.busId || '');
                  })()} disabled />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverId">Conductor *</Label>
                <Select value={formData.driverId} onValueChange={(value) => setFormData(prev => ({ ...prev, driverId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar conductor" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name} - {driver.license}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assistantId">Ayudante (opcional)</Label>
                <Select value={formData.assistantId || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, assistantId: value === '__none' ? '' : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ayudante (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">-- Ninguno --</SelectItem>
                    {assistants
                      .filter(assistant => assistant.id !== formData.driverId)
                      .map((assistant) => (
                        <SelectItem key={assistant.id} value={assistant.id}>
                          {assistant.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="departureDate">Fecha de Salida *</Label>
                {(() => {
                  const freq = frequencies.find(f => String(f.id) === String(formData.frequencyId)) || (editingTrip ? frequencies.find(f => String(f.id) === String(editingTrip.frequencyId)) : null);
                  const rawDays = freq ? (freq.operatingDays || freq.days || freq.operating_days || freq.daysOfWeek) : null;
                  const allowed = normalizeOperatingDays(rawDays);

                  if (allowed && allowed.length > 0) {
                    const options = getNextAllowedDates(allowed, 90, 30);
                    return (
                      <>
                        <Select value={formData.departureDate} onValueChange={(value) => setFormData(prev => ({ ...prev, departureDate: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar fecha" />
                          </SelectTrigger>
                          <SelectContent>
                                  {options.length === 0 && <SelectItem value="__none" disabled>No hay fechas disponibles</SelectItem>}
                                  {options.map(d => (
                                    <SelectItem key={d} value={d}>{formatDate(d)}</SelectItem>
                                  ))}
                                </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">Días de operación: {allowed.map(n => ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][n]).join(', ')}</p>
                      </>
                    );
                  }

                  // If we're creating a trip and no frequency selected, disable manual date input
                  if (!editingTrip && !formData.frequencyId) {
                    return (
                      <Input
                        id="departureDate"
                        type="date"
                        placeholder="Selecciona primero una frecuencia"
                        value={formData.departureDate || ''}
                        onChange={() => {}}
                        disabled
                      />
                    );
                  }

                  return (
                    <Input
                      id="departureDate"
                      type="date"
                      placeholder="dd/mm/aaaa"
                      value={formData.departureDate || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, departureDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  );
                })()}
              </div>

              <div className="space-y-2">
                <Label htmlFor="departureTime">Hora de Salida *</Label>
                <Input
                  id="departureTime"
                  type="time"
                  value={formData.departureTime}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({ ...prev, departureTime: value }));
                    }}
                />
              </div>

              <div className="space-y-2">
                <Label>Duración estimada</Label>
                <input
                  type="text"
                  className="w-full p-2 bg-gray-50 rounded"
                  readOnly
                  value={(() => {
                    const selectedFrequency = frequencies.find(f => f.id === formData.frequencyId);
                    const selectedRoute = selectedFrequency?.route || routes.find(r => r.id === selectedFrequency?.routeId || formData.routeId);
                    const raw = selectedRoute?.estimatedDuration || selectedRoute?.estimatedDurationMinutes || selectedFrequency?.estimatedDuration || selectedFrequency?.estimatedDurationMinutes;
                    return formatDurationRaw(raw) || '-';
                  })()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Precio (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="15.00"
                />
              </div>

              {editingTrip && (
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCHEDULED">Programado</SelectItem>
                      <SelectItem value="IN_PROGRESS">En Curso</SelectItem>
                      <SelectItem value="COMPLETED">Completado</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                      
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {editingTrip ? 'Actualizar' : 'Crear'} Viaje
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingTrip(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lista de viajes */}
      <div className="grid grid-cols-1 gap-4">
        {visibleTrips.map((trip) => (
          <Card key={trip.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">
                      {trip.route?.origin || 'Origen'} → {trip.route?.destination || 'Destino'}
                    </h3>
                    {getStatusBadge(trip.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Fecha</p>
                        <p className="text-sm">{formatDate(trip.departureDate)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Horarios</p>
                        <p className="text-sm">{formatTimeForInput(trip.departureTime) || trip.departureTime || '-'} - {getArrivalDisplay(trip)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Bus className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Bus</p>
                        <p className="text-sm">{trip.bus?.placa || 'N/A'} - {trip.bus?.marca || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Conductor</p>
                        <p className="text-sm">{getDriverDisplayName(trip)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{formatCurrency(trip.price || 0)}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Ocupación: {trip.occupiedSeats || 0}/{trip.bus?.totalSeats || 0} 
                        ({trip.bus?.totalSeats ? Math.round(((trip.occupiedSeats || 0) / trip.bus.totalSeats) * 100) : 0}%)
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {trip.status === 'SCHEDULED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(trip.id, 'IN_PROGRESS')}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  {trip.status === 'IN_PROGRESS' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(trip.id, 'COMPLETED')}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(trip)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(trip.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {trips.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Bus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay viajes programados</h3>
            <p className="text-muted-foreground mb-4">
              Comienza programando tu primer viaje.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Programar Primer Viaje
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}