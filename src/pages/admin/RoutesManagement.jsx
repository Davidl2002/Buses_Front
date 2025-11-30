import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Route,
  MapPin,
  Clock,
  DollarSign,
  Bus,
  Calendar,
  Search,
  Filter,
  Settings,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { routeService, frequencyService, busGroupService, tripService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import api from '@/services/api';

const OPERATING_DAYS = [
  { value: 'MONDAY', label: 'Lunes' },
  { value: 'TUESDAY', label: 'Martes' },
  { value: 'WEDNESDAY', label: 'Miércoles' },
  { value: 'THURSDAY', label: 'Jueves' },
  { value: 'FRIDAY', label: 'Viernes' },
  { value: 'SATURDAY', label: 'Sábado' },
  { value: 'SUNDAY', label: 'Domingo' }
];

const STATUS_LABELS = {
  SCHEDULED: 'Programado',
  IN_PROGRESS: 'En Curso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  
};

const getStatusLabel = (status) => STATUS_LABELS[status] || status || '-';

export default function RoutesManagement() {
  const [routes, setRoutes] = useState([]);
  const [frequencies, setFrequencies] = useState([]);
  const [busGroups, setBusGroups] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('routes');
  
  // Estados para rutas
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [routeSearchTerm, setRouteSearchTerm] = useState('');
  const [routeFormData, setRouteFormData] = useState({
    name: '',
    origin: '',
    destination: '',
    basePrice: '',
    estimatedDuration: '',
    distanceKm: '',
    stops: []
  });
  
  // Estados para frecuencias
  const [showFrequencyForm, setShowFrequencyForm] = useState(false);
  const [editingFrequency, setEditingFrequency] = useState(null);
  const [frequencySearchTerm, setFrequencySearchTerm] = useState('');
  const [frequencyFormData, setFrequencyFormData] = useState({
    routeId: '',
    departureTime: '',
    operatingDays: [],
    antPermitNumber: '',
    busGroupId: ''
  });

  // Generación y detalles de frecuencias
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateParams, setGenerateParams] = useState({ startDate: '', endDate: '', frequencyIds: [] });
  const [genBusGroupId, setGenBusGroupId] = useState('');
  const [genGroupMax, setGenGroupMax] = useState(null);
  const [generateResult, setGenerateResult] = useState(null);
  const [showFrequencyDetails, setShowFrequencyDetails] = useState(false);
  const [frequencyDetails, setFrequencyDetails] = useState(null);
  const [freqDetailsLoading, setFreqDetailsLoading] = useState(false);
  
  const [newStop, setNewStop] = useState({ name: '', priceFromOrigin: '' });
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Use allSettled so one failing endpoint doesn't block others (e.g., missing /buses/groups)
      const results = await Promise.allSettled([
        routeService.getAll(),
        frequencyService.getAll(),
        busGroupService.getAll(),
        api.get('/cities')
      ]);

      // routes
      if (results[0].status === 'fulfilled') {
        setRoutes(results[0].value.data.data);
      } else {
        console.error('Error loading routes:', results[0].reason);
        toast.error('Error al cargar rutas');
        setRoutes([]);
      }

      // frequencies
      if (results[1].status === 'fulfilled') {
        setFrequencies(results[1].value.data.data);
      } else {
        console.error('Error loading frequencies:', results[1].reason);
        toast.error('Error al cargar frecuencias');
        setFrequencies([]);
      }

      // bus groups (optional)
      if (results[2].status === 'fulfilled') {
        setBusGroups(results[2].value.data.data);
      } else {
        console.warn('Bus groups endpoint failed, continuing without groups:', results[2].reason);
        setBusGroups([]);
      }

      // cities (optional)
      if (results[3] && results[3].status === 'fulfilled') {
        const data = results[3].value.data?.data || results[3].value.data || [];
        // normalize to array of strings or objects with 'name'
        setCities(Array.isArray(data) ? data : []);
      } else {
        setCities([]);
      }
    } catch (error) {
      console.error('Unexpected error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const isValidCity = (name) => {
    if (!name || !cities || cities.length === 0) return false;
    const needle = String(name).trim().toLowerCase();
    return cities.some(c => {
      const v = (typeof c === 'string') ? c : (c.name || c.city || c.cityName || c.label || '');
      return String(v || '').trim().toLowerCase() === needle;
    });
  };

  // FUNCIONES PARA RUTAS
  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    
    // validate cities list loaded
    if (!cities || cities.length === 0) {
      toast.error('No se pudieron cargar las ciudades. Recarga la página e intenta de nuevo.');
      return;
    }

    // validate origin/destination are in cities
    if (!isValidCity(routeFormData.origin)) {
      toast.error('Ciudad de origen inválida. Selecciona una ciudad de la lista.');
      return;
    }
    if (!isValidCity(routeFormData.destination)) {
      toast.error('Ciudad de destino inválida. Selecciona una ciudad de la lista.');
      return;
    }

    // validate stops
    for (let i = 0; i < (routeFormData.stops || []).length; i++) {
      const s = routeFormData.stops[i];
      if (!isValidCity(s.name)) {
        toast.error(`Parada inválida: "${s.name}". Selecciona una ciudad de la lista.`);
        return;
      }
    }

    try {
      const routeData = {
        ...routeFormData,
        cooperativaId: user.cooperativaId,
        basePrice: parseFloat(routeFormData.basePrice),
        estimatedDuration: parseInt(routeFormData.estimatedDuration),
        distanceKm: parseFloat(routeFormData.distanceKm),
        stops: routeFormData.stops.map((stop, index) => ({
          ...stop,
          order: index + 1,
          priceFromOrigin: parseFloat(stop.priceFromOrigin)
        }))
      };

      if (editingRoute) {
        await routeService.update(editingRoute.id, routeData);
        toast.success('Ruta actualizada exitosamente');
      } else {
        await routeService.create(routeData);
        toast.success('Ruta creada exitosamente');
      }
      
      resetRouteForm();
      loadData();
    } catch (error) {
      console.error('Error saving route:', error);
      toast.error(error.response?.data?.message || 'Error al guardar la ruta');
    }
  };

  const handleEditRoute = (route) => {
    setEditingRoute(route);
    setRouteFormData({
      name: route.name,
      origin: route.origin,
      destination: route.destination,
      basePrice: route.basePrice.toString(),
      estimatedDuration: route.estimatedDuration?.toString() || '',
      distanceKm: route.distanceKm?.toString() || '',
      stops: route.stops || []
    });
    setShowRouteForm(true);
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta ruta?')) {
      return;
    }

    try {
      await routeService.delete(id);
      toast.success('Ruta eliminada exitosamente');
      loadData();
    } catch (error) {
      console.error('Error deleting route:', error);
      toast.error('Error al eliminar la ruta');
    }
  };

  const resetRouteForm = () => {
    setRouteFormData({
      name: '',
      origin: '',
      destination: '',
      basePrice: '',
      estimatedDuration: '',
      distanceKm: '',
      stops: []
    });
    setNewStop({ name: '', priceFromOrigin: '' });
    setEditingRoute(null);
    setShowRouteForm(false);
  };

  const addStop = () => {
    if (!newStop.name) {
      toast.error('Ingrese el nombre de la parada');
      return;
    }
    if (!newStop.priceFromOrigin) {
      toast.error('Ingrese el precio desde origen para la parada');
      return;
    }
    if (!cities || cities.length === 0) {
      toast.error('No se pudieron cargar las ciudades. Recarga la página e intenta de nuevo.');
      return;
    }
    if (!isValidCity(newStop.name)) {
      toast.error('La parada debe ser una ciudad válida seleccionada de la lista');
      return;
    }

    setRouteFormData(prev => ({
      ...prev,
      stops: [...prev.stops, { ...newStop }]
    }));
    setNewStop({ name: '', priceFromOrigin: '' });
  };

  const removeStop = (index) => {
    setRouteFormData(prev => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index)
    }));
  };

  // FUNCIONES PARA FRECUENCIAS
  const handleFrequencySubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate departureTime format HH:mm
      const timeRe = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRe.test(frequencyFormData.departureTime)) {
        toast.error('Hora de salida inválida. Use formato HH:mm');
        return;
      }

      const frequencyData = {
        ...frequencyFormData,
        cooperativaId: user.cooperativaId
      };

      // Make bus group required
      if (!frequencyData.busGroupId) {
        toast.error('Debe seleccionar un Grupo de Buses (obligatorio)');
        return;
      }

      // If busGroupId is 'none' or empty, remove it so backend treats as unassigned
      if (!frequencyData.busGroupId || frequencyData.busGroupId === 'none') {
        delete frequencyData.busGroupId;
      }

      if (editingFrequency) {
        await frequencyService.update(editingFrequency.id, frequencyData);
        toast.success('Frecuencia actualizada exitosamente');
      } else {
        await frequencyService.create(frequencyData);
        toast.success('Frecuencia creada exitosamente');
      }
      
      resetFrequencyForm();
      loadData();
    } catch (error) {
      console.error('Error saving frequency:', error);
      toast.error(error.response?.data?.message || 'Error al guardar la frecuencia');
    }
  };

  // GENERAR VIAJES EN BLOQUE
  const handleGenerateTrips = async (e) => {
    e.preventDefault();

    if (!generateParams.startDate || !generateParams.endDate) {
      toast.error('Debes especificar rango de fechas');
      return;
    }

    try {
      const payload = {
        startDate: generateParams.startDate,
        endDate: generateParams.endDate
      };

      if (generateParams.frequencyIds && generateParams.frequencyIds.length > 0) {
        payload.frequencyIds = generateParams.frequencyIds;
      }
      if (genBusGroupId) payload.busGroupId = genBusGroupId;

      const res = await frequencyService.generateTrips(payload);
      setGenerateResult(res.data);
      toast.success(`Viajes generados: ${res.data.count || res.data.created?.length || 0}`);
      setShowGenerateModal(false);
      loadData();
    } catch (error) {
      console.error('Error generating trips:', error);
      toast.error(error.response?.data?.message || 'Error al generar viajes');
    }
  };

  const computeGroupSize = (group) => {
    if (!group) return 1;
    return (group.buses?.length || group.busCount || group.size || group.totalBuses || group.count || 1);
  };

  const openFrequencyDetails = async (id) => {
    setFreqDetailsLoading(true);
    try {
      const res = await frequencyService.getById(id);
      // backend may return res.data or res.data.data depending on wrapper
      setFrequencyDetails(res.data.data || res.data);
      setShowFrequencyDetails(true);
    } catch (error) {
      console.error('Error loading frequency details:', error);
      toast.error('Error al cargar detalles de la frecuencia');
    } finally {
      setFreqDetailsLoading(false);
    }
  };

  const handleEditFrequency = (frequency) => {
    setEditingFrequency(frequency);
    setFrequencyFormData({
      routeId: frequency.routeId,
      departureTime: frequency.departureTime,
      operatingDays: frequency.operatingDays || [],
      antPermitNumber: frequency.antPermitNumber || '',
      busGroupId: frequency.busGroupId || ''
    });
    setShowFrequencyForm(true);
  };

  const handleDeleteFrequency = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta frecuencia?')) {
      return;
    }

    try {
      await frequencyService.delete(id);
      toast.success('Frecuencia eliminada exitosamente');
      loadData();
    } catch (error) {
      console.error('Error deleting frequency:', error);
      toast.error('Error al eliminar la frecuencia');
    }
  };

  const resetFrequencyForm = () => {
    setFrequencyFormData({
      routeId: '',
      departureTime: '',
      operatingDays: [],
      antPermitNumber: '',
      busGroupId: ''
    });
    setEditingFrequency(null);
    setShowFrequencyForm(false);
  };

  const toggleOperatingDay = (day) => {
    setFrequencyFormData(prev => ({
      ...prev,
      operatingDays: prev.operatingDays.includes(day)
        ? prev.operatingDays.filter(d => d !== day)
        : [...prev.operatingDays, day]
    }));
  };

  const filteredRoutes = routes.filter(route =>
    route.name.toLowerCase().includes(routeSearchTerm.toLowerCase()) ||
    route.origin.toLowerCase().includes(routeSearchTerm.toLowerCase()) ||
    route.destination.toLowerCase().includes(routeSearchTerm.toLowerCase())
  );

  const filteredFrequencies = frequencies.filter(freq => {
    const route = routes.find(r => r.id === freq.routeId);
    return route && (
      route.name.toLowerCase().includes(frequencySearchTerm.toLowerCase()) ||
      freq.departureTime.includes(frequencySearchTerm)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Rutas y Frecuencias</h1>
        <p className="text-gray-600 mt-1">Administrar rutas y horarios de la cooperativa</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            Rutas
          </TabsTrigger>
          <TabsTrigger value="frequencies" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Frecuencias
          </TabsTrigger>
        </TabsList>

        {/* TAB RUTAS */}
        <TabsContent value="routes" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar rutas..."
                  value={routeSearchTerm}
                  onChange={(e) => setRouteSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
            <Button onClick={() => setShowRouteForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Ruta
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Rutas Registradas ({filteredRoutes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ruta</TableHead>
                    <TableHead>Origen - Destino</TableHead>
                    <TableHead>Precio Base</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Paradas</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoutes.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell>
                        <div className="font-medium">{route.name}</div>
                        {route.distanceKm && (
                          <div className="text-xs text-gray-500">{route.distanceKm} km</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{route.origin}</span>
                          <span className="text-gray-400">→</span>
                          <MapPin className="h-4 w-4 text-red-600" />
                          <span className="font-medium">{route.destination}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-green-600">
                          ${parseFloat(route.basePrice).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {route.estimatedDuration ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span>{Math.floor(route.estimatedDuration / 60)}h {route.estimatedDuration % 60}m</span>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {route.stops?.length || 0} paradas
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditRoute(route)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteRoute(route.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredRoutes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Route className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No se encontraron rutas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB FRECUENCIAS */}
        <TabsContent value="frequencies" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar frecuencias..."
                  value={frequencySearchTerm}
                  onChange={(e) => setFrequencySearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowGenerateModal(true)}
                className="flex items-center gap-2"
                disabled={frequencies.length === 0 && routes.length === 0}
              >
                <Calendar className="h-4 w-4" />
                Generar Viajes
              </Button>

              <Button 
                onClick={() => setShowFrequencyForm(true)} 
                className="flex items-center gap-2"
                disabled={routes.length === 0}
              >
                <Plus className="h-4 w-4" />
                Nueva Frecuencia
              </Button>
            </div>
          </div>

          {routes.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Route className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <h3 className="font-medium mb-2">No hay rutas disponibles</h3>
                <p className="text-gray-600 mb-4">Primero debes crear al menos una ruta para poder asignar frecuencias.</p>
                <Button onClick={() => setActiveTab('routes')}>
                  Ir a Rutas
                </Button>
              </CardContent>
            </Card>
          )}

          {routes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Frecuencias Programadas ({filteredFrequencies.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ruta</TableHead>
                      <TableHead>Hora Salida</TableHead>
                      <TableHead>Días de Operación</TableHead>
                      <TableHead>Permiso ANT</TableHead>
                      <TableHead>Grupo de Buses</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFrequencies.map((frequency) => {
                      const route = routes.find(r => r.id === frequency.routeId);
                      const busGroup = busGroups.find(g => g.id === frequency.busGroupId);
                      
                      return (
                        <TableRow key={frequency.id}>
                          <TableCell>
                            {route && (
                              <div>
                                <div className="font-medium">{route.name}</div>
                                <div className="text-sm text-gray-600">
                                  {route.origin} → {route.destination}
                                </div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span className="font-mono font-medium">{frequency.departureTime}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {frequency.operatingDays?.map((day) => {
                                const dayConfig = OPERATING_DAYS.find(d => d.value === day);
                                return (
                                  <Badge key={day} variant="secondary" className="text-xs">
                                    {dayConfig?.label.substring(0, 3).toUpperCase()}
                                  </Badge>
                                );
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            {frequency.antPermitNumber ? (
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {frequency.antPermitNumber}
                              </code>
                            ) : (
                              <span className="text-gray-400 text-sm">No especificado</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {busGroup ? (
                              <Badge variant="outline">
                                {busGroup.name}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-sm">Sin asignar</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openFrequencyDetails(frequency.id)}
                                title="Ver detalles"
                              >
                                <Calendar className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditFrequency(frequency)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteFrequency(frequency.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {filteredFrequencies.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>No se encontraron frecuencias</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Formulario Rutas */}
      <Dialog open={showRouteForm} onOpenChange={setShowRouteForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRoute ? 'Editar Ruta' : 'Nueva Ruta'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleRouteSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="routeName">Nombre de la Ruta *</Label>
                <Input
                  id="routeName"
                  value={routeFormData.name}
                  onChange={(e) => setRouteFormData({...routeFormData, name: e.target.value})}
                  placeholder="Ambato - Quito Directo"
                  required
                />
              </div>
              <div>
                <Label htmlFor="basePrice">Precio Base (USD) *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={routeFormData.basePrice}
                  onChange={(e) => setRouteFormData({...routeFormData, basePrice: e.target.value})}
                  placeholder="4.50"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="origin">Ciudad de Origen *</Label>
                <Input
                  id="origin"
                  list="cities-list"
                  value={routeFormData.origin}
                  onChange={(e) => setRouteFormData({...routeFormData, origin: e.target.value})}
                  placeholder="Ambato"
                  required
                />
              </div>
              <div>
                <Label htmlFor="destination">Ciudad de Destino *</Label>
                <Input
                  id="destination"
                  list="cities-list"
                  value={routeFormData.destination}
                  onChange={(e) => setRouteFormData({...routeFormData, destination: e.target.value})}
                  placeholder="Quito"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimatedDuration">Duración Estimada (minutos)</Label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  min="30"
                  value={routeFormData.estimatedDuration}
                  onChange={(e) => setRouteFormData({...routeFormData, estimatedDuration: e.target.value})}
                  placeholder="180"
                />
              </div>
              <div>
                <Label htmlFor="distanceKm">Distancia (km)</Label>
                <Input
                  id="distanceKm"
                  type="number"
                  step="0.1"
                  min="1"
                  value={routeFormData.distanceKm}
                  onChange={(e) => setRouteFormData({...routeFormData, distanceKm: e.target.value})}
                  placeholder="135.5"
                />
              </div>
            </div>

            {/* Paradas Intermedias */}
            <div>
              <Label className="text-base font-medium">Paradas Intermedias</Label>
              <div className="mt-2 space-y-4">
                {/* Agregar nueva parada */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Nombre de la parada"
                    list="cities-list"
                    value={newStop.name}
                    onChange={(e) => setNewStop({...newStop, name: e.target.value})}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Precio desde origen"
                    value={newStop.priceFromOrigin}
                    onChange={(e) => setNewStop({...newStop, priceFromOrigin: e.target.value})}
                  />
                  <Button type="button" onClick={addStop}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Lista de paradas */}
                {routeFormData.stops.length > 0 && (
                  <div className="border rounded-lg p-4 space-y-2">
                    {routeFormData.stops.map((stop, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{stop.name}</span>
                          <span className="ml-2 text-sm text-gray-600">
                            ${parseFloat(stop.priceFromOrigin).toFixed(2)}
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeStop(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={resetRouteForm}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingRoute ? 'Actualizar' : 'Crear'} Ruta
              </Button>
            </div>
          </form>
          {/* datalist shared for cities */}
          <datalist id="cities-list">
            {cities.map((c, idx) => (
              <option key={c.id || idx} value={c.name || c} />
            ))}
          </datalist>
        </DialogContent>
      </Dialog>

      {/* Modal Formulario Frecuencias */}
      <Dialog open={showFrequencyForm} onOpenChange={setShowFrequencyForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFrequency ? 'Editar Frecuencia' : 'Nueva Frecuencia'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleFrequencySubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frequencyRoute">Ruta *</Label>
                <Select 
                  value={frequencyFormData.routeId} 
                  onValueChange={(value) => setFrequencyFormData({...frequencyFormData, routeId: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ruta" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.name} ({route.origin} → {route.destination})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="departureTime">Hora de Salida *</Label>
                <Input
                  id="departureTime"
                  type="time"
                  value={frequencyFormData.departureTime}
                  onChange={(e) => setFrequencyFormData({...frequencyFormData, departureTime: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Días de Operación *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {OPERATING_DAYS.map((day) => (
                  <label key={day.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={frequencyFormData.operatingDays.includes(day.value)}
                      onChange={() => toggleOperatingDay(day.value)}
                      className="rounded"
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="antPermitNumber">Número de Permiso ANT</Label>
                <Input
                  id="antPermitNumber"
                  value={frequencyFormData.antPermitNumber}
                  onChange={(e) => setFrequencyFormData({...frequencyFormData, antPermitNumber: e.target.value})}
                  placeholder="ANT-2025-001234"
                />
              </div>
              <div>
                <Label htmlFor="frequencyBusGroup">Grupo de Buses *</Label>
                <Select 
                  value={frequencyFormData.busGroupId} 
                  onValueChange={(value) => setFrequencyFormData({...frequencyFormData, busGroupId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar grupo (obligatorio)" />
                  </SelectTrigger>
                  <SelectContent>
                    {busGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={resetFrequencyForm}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={frequencyFormData.operatingDays.length === 0}
              >
                {editingFrequency ? 'Actualizar' : 'Crear'} Frecuencia
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Generar Viajes */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generar Viajes desde Frecuencias</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleGenerateTrips} className="space-y-4">
            <div>
              <Label>Fecha Inicio</Label>
              <Input
                type="date"
                value={generateParams.startDate}
                onChange={(e) => setGenerateParams(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label>Fecha Fin</Label>
              <Input
                type="date"
                value={generateParams.endDate}
                onChange={(e) => setGenerateParams(prev => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label>Frecuencias (opcional)</Label>
              <div className="mt-2 mb-2">
                <label className="block text-sm text-gray-700 mb-1">Grupo de Buses (filtra frecuencias)</label>
                <select
                  value={genBusGroupId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGenBusGroupId(val);
                    setGenerateParams(prev => ({ ...prev, frequencyIds: [] }));
                    const group = busGroups.find(g => String(g.id) === String(val));
                    setGenGroupMax(computeGroupSize(group));
                  }}
                  className="w-full h-10 rounded-md border border-gray-300 px-3"
                >
                  <option value="">-- Todas las frecuencias --</option>
                  {busGroups.map(group => (
                    <option key={group.id} value={group.id}>{group.name} {computeGroupSize(group) ? `— ${computeGroupSize(group)} buses` : ''}</option>
                  ))}
                </select>
                {genGroupMax ? (
                  <div className="text-xs text-gray-500 mt-1">Puedes seleccionar hasta <strong>{genGroupMax}</strong> frecuencias (cantidad de buses en el grupo).</div>
                ) : null}
              </div>

              <div className="max-h-40 overflow-auto border rounded p-2 mt-2">
                {(genBusGroupId ? frequencies.filter(f => String(f.busGroupId) === String(genBusGroupId)) : frequencies).map(f => {
                  const alreadySelected = generateParams.frequencyIds.includes(f.id);
                  const limitReached = genGroupMax && generateParams.frequencyIds.length >= genGroupMax;
                  const disabled = limitReached && !alreadySelected;

                  return (
                    <label key={f.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={alreadySelected}
                        disabled={disabled}
                        onChange={() => {
                          setGenerateParams(prev => {
                            const has = prev.frequencyIds.includes(f.id);
                            if (!has) {
                              if (genGroupMax && prev.frequencyIds.length >= genGroupMax) {
                                toast.error(`Solo puedes seleccionar hasta ${genGroupMax} frecuencias (buses en el grupo)`);
                                return prev;
                              }
                              return { ...prev, frequencyIds: [...prev.frequencyIds, f.id] };
                            }
                            return { ...prev, frequencyIds: prev.frequencyIds.filter(id => id !== f.id) };
                          });
                        }}
                      />
                      <span className="text-sm">{routes.find(r => r.id === f.routeId)?.name || f.routeId} — {f.departureTime}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowGenerateModal(false)}>Cancelar</Button>
              <Button type="submit">Generar Viajes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Detalles de Frecuencia */}
      <Dialog open={showFrequencyDetails} onOpenChange={setShowFrequencyDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Frecuencia</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {freqDetailsLoading && (
              <div className="flex items-center justify-center p-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            {frequencyDetails && (
              <div>
                <h3 className="font-medium">Ruta: {frequencyDetails.route?.origin || frequencyDetails.route?.name || frequencyDetails.routeId} — {frequencyDetails.route?.destination || ''}</h3>
                <p>Hora: <span className="font-mono">{frequencyDetails.departureTime}</span></p>
                <p>Días: {Array.isArray(frequencyDetails.operatingDays) ? frequencyDetails.operatingDays.map(d => (OPERATING_DAYS.find(x => x.value === String(d).toUpperCase())?.label || d)).join(', ') : (frequencyDetails.operatingDays || '')}</p>
                <p>Grupo: {frequencyDetails.busGroup?.name || frequencyDetails.busGroupId || 'Sin asignar'}</p>

                {/** Paradas (stops) si existen en el objeto route o frequency */}
                {((frequencyDetails.route && (frequencyDetails.route.stops || frequencyDetails.route.paradas)) || frequencyDetails.stops) && (
                  <div className="mt-2">
                    <Label className="text-sm">Paradas</Label>
                    <ul className="list-disc ml-5 mt-1 text-sm text-gray-700">
                      {(frequencyDetails.route?.stops || frequencyDetails.route?.paradas || frequencyDetails.stops || []).map((s, idx) => (
                        <li key={idx}>{typeof s === 'string' ? s : (s.name || s.location || JSON.stringify(s))}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4">
                  <h4 className="font-medium">Próximos viajes</h4>
                  {(
                    frequencyDetails.nextTrips &&
                    frequencyDetails.nextTrips.filter(t => String(t?.status || '').toUpperCase() === 'SCHEDULED').length > 0
                  ) ? (
                    <ul className="mt-2 space-y-2">
                      {frequencyDetails.nextTrips
                        .filter(t => String(t?.status || '').toUpperCase() === 'SCHEDULED')
                        .map(t => (
                          <li key={t.id} className="p-2 border rounded flex justify-between items-center">
                            <div>
                              <div className="font-medium">{(function displayDate(d){
                                if (!d) return '-';
                                const s = String(d);
                                const ymd = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(s);
                                let dt;
                                if (ymd) {
                                  dt = new Date(Date.UTC(parseInt(ymd[1],10), parseInt(ymd[2],10)-1, parseInt(ymd[3],10)));
                                  return dt.toLocaleDateString('es-EC', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' });
                                }
                                dt = new Date(s);
                                if (isNaN(dt.getTime())) return s;
                                return dt.toLocaleDateString('es-EC', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' });
                              })(t.date)}</div>
                              <div className="text-sm text-gray-600">Bus: {t.bus?.plate || t.bus?.placa || t.busId || '—'}</div>
                            </div>
                            <div className="text-sm text-gray-500">Estado: {getStatusLabel(t.status)}</div>
                          </li>
                      ))}
                    </ul>
                  ) : (
                    frequencyDetails.nextTrips ? (
                      <p className="text-gray-600 mt-2">No hay viajes programados para esta frecuencia</p>
                    ) : (
                      // Try to load upcoming trips if backend didn't provide them
                      <FrequencyNextTripsLoader frequencyId={frequencyDetails.id} />
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FrequencyNextTripsLoader({ frequencyId }) {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const today = new Date();
        const isoToday = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        const res = await tripService.getAll({ frequencyId, startDate: isoToday });
        const data = res.data?.data || res.data || [];
        if (!mounted) return;
        const arr = Array.isArray(data) ? data : [];
        setTrips(arr.filter(t => String(t?.status || '').toUpperCase() === 'SCHEDULED'));
      } catch (e) {
        console.error('Error loading next trips for frequency', e);
        setTrips([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [frequencyId]);

  if (loading) return <p className="text-gray-600 mt-2">Cargando próximos viajes...</p>;
  if (!trips || trips.length === 0) return <p className="text-gray-600 mt-2">No hay viajes programados para esta frecuencia</p>;

  return (
    <ul className="mt-2 space-y-2">
      {trips.map(t => (
        <li key={t.id} className="p-2 border rounded flex justify-between items-center">
          <div>
            <div className="font-medium">{(function displayDate(d){
              if (!d) return '-';
              const s = String(d);
              const ymd = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(s);
              let dt;
              if (ymd) {
                dt = new Date(Date.UTC(parseInt(ymd[1],10), parseInt(ymd[2],10)-1, parseInt(ymd[3],10)));
                return dt.toLocaleDateString('es-EC', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' });
              }
              dt = new Date(s);
              if (isNaN(dt.getTime())) return s;
              return dt.toLocaleDateString('es-EC', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' });
            })(t.date)}</div>
            <div className="text-sm text-gray-600">Bus: {t.bus?.plate || t.bus?.placa || t.busId || '—'}</div>
          </div>
          <div className="text-sm text-gray-500">Estado: {getStatusLabel(t.status)}</div>
        </li>
      ))}
    </ul>
  );
}