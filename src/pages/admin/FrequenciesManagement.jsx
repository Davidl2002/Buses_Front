import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { frequencyService } from '@/services';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Lunes' },
  { value: 'TUESDAY', label: 'Martes' },
  { value: 'WEDNESDAY', label: 'Miércoles' },
  { value: 'THURSDAY', label: 'Jueves' },
  { value: 'FRIDAY', label: 'Viernes' },
  { value: 'SATURDAY', label: 'Sábado' },
  { value: 'SUNDAY', label: 'Domingo' }
];

export default function FrequenciesManagement() {
  const { user } = useAuth();
  const [frequencies, setFrequencies] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [busGroups, setBusGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFrequency, setEditingFrequency] = useState(null);
  const [generatingTrips, setGeneratingTrips] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [genStartDate, setGenStartDate] = useState('');
  const [genEndDate, setGenEndDate] = useState('');
  const [selectedFrequencyIds, setSelectedFrequencyIds] = useState([]);
  const [genBusGroupId, setGenBusGroupId] = useState('');
  const [genGroupMax, setGenGroupMax] = useState(null);
  const [formData, setFormData] = useState({
    routeId: '',
    busGroupId: '',
    departureTime: '08:00',
    operatingDays: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [freqRes, routesRes, groupsRes] = await Promise.all([
        api.get('/frequencies'),
        api.get('/routes'),
        api.get('/bus-groups')
      ]);

      setFrequencies(freqRes.data.data || []);
      setRoutes(routesRes.data.data || []);
      setBusGroups(groupsRes.data.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar las frecuencias');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.operatingDays.length === 0) {
      alert('Debe seleccionar al menos un día de operación');
      return;
    }
    if (!formData.busGroupId) {
      alert('Debe seleccionar un Grupo de Buses (obligatorio)');
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        cooperativaId: user.cooperativaId
      };

      if (editingFrequency) {
        await api.put(`/frequencies/${editingFrequency.id}`, dataToSend);
        alert('Frecuencia actualizada exitosamente');
      } else {
        await api.post('/frequencies', dataToSend);
        alert('Frecuencia creada exitosamente');
      }

      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar frecuencia:', error);
      alert(error.response?.data?.message || 'Error al guardar la frecuencia');
    }
  };

  const handleEdit = (frequency) => {
    setEditingFrequency(frequency);
    setFormData({
      routeId: frequency.routeId,
      busGroupId: frequency.busGroupId,
      departureTime: frequency.departureTime,
      operatingDays: frequency.operatingDays || []
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta frecuencia? Se eliminarán todos los viajes futuros asociados.')) {
      return;
    }

    try {
      await api.delete(`/frequencies/${id}`);
      alert('Frecuencia eliminada exitosamente');
      loadData();
    } catch (error) {
      console.error('Error al eliminar frecuencia:', error);
      alert('Error al eliminar la frecuencia');
    }
  };

  const resetForm = () => {
    setFormData({
      routeId: '',
      busGroupId: '',
      departureTime: '08:00',
      operatingDays: []
    });
    setEditingFrequency(null);
    setShowForm(false);
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      operatingDays: prev.operatingDays.includes(day)
        ? prev.operatingDays.filter(d => d !== day)
        : [...prev.operatingDays, day]
    }));
  };

  const handleGenerateTrips = () => {
    // Open dialog to ask for dates and optional frequencies
    setGenStartDate('');
    setGenEndDate('');
    setSelectedFrequencyIds([]);
    setGenBusGroupId('');
    setGenGroupMax(null);
    setShowGenerateDialog(true);
  };

  const submitGenerateTrips = async (e) => {
    e?.preventDefault?.();

    if (!genStartDate || !genEndDate) {
      alert('Debe ingresar startDate y endDate en formato YYYY-MM-DD');
      return;
    }

    try {
      setGeneratingTrips(true);
      const payload = { startDate: genStartDate, endDate: genEndDate };
      if (selectedFrequencyIds.length > 0) payload.frequencyIds = selectedFrequencyIds;
      if (genBusGroupId) payload.busGroupId = genBusGroupId;

      console.log('[Frequencies] Generar viajes - payload:', payload);
      const response = await frequencyService.generateTrips(payload);
      const result = response.data?.data || response.data || {};
      console.log('[Frequencies] Generar viajes - resultado:', result);

      alert(`✅ Se generaron ${result.generated || result.createdCount || 0} viajes exitosamente.\n\n${
        (result.conflicts?.length || 0) > 0 
          ? `⚠️ Se encontraron ${result.conflicts.length} conflictos que requieren atención.` 
          : ''
      }`);

      if (result.conflicts?.length > 0) console.log('Conflictos encontrados:', result.conflicts);
      setShowGenerateDialog(false);
      loadData();
    } catch (error) {
      console.error('Error al generar viajes:', error);
      alert(error.response?.data?.message || 'Error al generar los viajes');
    } finally {
      setGeneratingTrips(false);
    }
  };

  const computeGroupSize = (group) => {
    if (!group) return 1;
    return (
      group.buses?.length || group.busCount || group.size || group.totalBuses || group.count || group.quantity || 1
    );
  };

  const displayedFrequencies = genBusGroupId
    ? frequencies.filter(f => String(f.busGroupId) === String(genBusGroupId))
    : frequencies;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Frecuencias ANT</h1>
          <p className="text-gray-600 mt-1">
            Administra las frecuencias autorizadas y genera viajes automáticamente
          </p>
        </div>
        <div className="flex gap-2">
            <Button onClick={handleGenerateTrips} variant="outline" disabled={generatingTrips}>
            {generatingTrips ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Generar Viajes
              </>
            )}
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Frecuencia
          </Button>
        </div>
      </div>

        {/* Dialog para generar viajes */}
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generar Viajes desde Frecuencias</DialogTitle>
            </DialogHeader>

            <form onSubmit={submitGenerateTrips} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Fecha inicio</Label>
                  <Input type="date" value={genStartDate} onChange={(e) => setGenStartDate(e.target.value)} />
                </div>
                <div>
                  <Label>Fecha fin</Label>
                  <Input type="date" value={genEndDate} onChange={(e) => setGenEndDate(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label>Frecuencias (opcional)</Label>
                  <div className="mt-2 mb-2">
                    <label className="block text-sm text-gray-700 mb-1">Grupo de Buses (filtra frecuencias)</label>
                    <select
                      value={genBusGroupId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGenBusGroupId(val);
                        setSelectedFrequencyIds([]);
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
                  <div className="max-h-40 overflow-y-auto border rounded p-2">
                    {displayedFrequencies.map(f => {
                      const alreadySelected = selectedFrequencyIds.includes(f.id);
                      const limitReached = genGroupMax && selectedFrequencyIds.length >= genGroupMax;
                      const disabled = limitReached && !alreadySelected;

                      return (
                        <div key={f.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`freq-${f.id}`}
                            checked={alreadySelected}
                            disabled={disabled}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (genGroupMax && selectedFrequencyIds.length >= genGroupMax) {
                                  alert(`Solo puedes seleccionar hasta ${genGroupMax} frecuencias (buses en el grupo)`);
                                  return;
                                }
                                setSelectedFrequencyIds(prev => [...prev, f.id]);
                              } else {
                                setSelectedFrequencyIds(prev => prev.filter(id => id !== f.id));
                              }
                            }}
                          />
                          <label htmlFor={`freq-${f.id}`} className="text-sm">{f.routeName || f.route?.name || `Frecuencia ${f.id}`} - {f.departureTime}</label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowGenerateDialog(false)}>Cancelar</Button>
                <Button type="submit" disabled={generatingTrips}>{generatingTrips ? 'Generando...' : 'Generar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Frecuencias</p>
                <p className="text-2xl font-bold">{frequencies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Rutas Activas</p>
                <p className="text-2xl font-bold">{routes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Frecuencias Diarias</p>
                <p className="text-2xl font-bold">
                  {frequencies.filter(f => f.operatingDays?.length === 7).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Grupos de Buses</p>
                <p className="text-2xl font-bold">{busGroups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Frecuencias */}
      <Card>
        <CardHeader>
          <CardTitle>Frecuencias Registradas</CardTitle>
          <CardDescription>
            Frecuencias autorizadas por la ANT para tu cooperativa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ruta</TableHead>
                <TableHead>Hora de Salida</TableHead>
                <TableHead>Días de Operación</TableHead>
                <TableHead>Grupo de Buses</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {frequencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    No hay frecuencias registradas
                  </TableCell>
                </TableRow>
              ) : (
                frequencies.map((freq) => {
                  const route = routes.find(r => r.id === freq.routeId);
                  const busGroup = busGroups.find(g => g.id === freq.busGroupId);

                  return (
                    <TableRow key={freq.id}>
                      <TableCell>
                        <div className="font-medium">{route?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">
                          {route?.origin} → {route?.destination}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {freq.departureTime}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {freq.operatingDays?.map(day => (
                            <Badge key={day} variant="secondary" className="text-xs">
                              {DAYS_OF_WEEK.find(d => d.value === day)?.label}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge>{busGroup?.name || 'Sin grupo'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(freq)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(freq.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Formulario */}
      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFrequency ? 'Editar Frecuencia' : 'Nueva Frecuencia ANT'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="routeId">Ruta *</Label>
                <select
                  id="routeId"
                  required
                  value={formData.routeId}
                  onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                  className="w-full h-10 rounded-md border border-gray-300 px-3"
                >
                  <option value="">Seleccionar ruta</option>
                  {routes.map(route => (
                    <option key={route.id} value={route.id}>
                      {route.name} ({route.origin} → {route.destination})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="busGroupId">Grupo de Buses *</Label>
                <select
                  id="busGroupId"
                  required
                  value={formData.busGroupId}
                  onChange={(e) => setFormData({ ...formData, busGroupId: e.target.value })}
                  className="w-full h-10 rounded-md border border-gray-300 px-3"
                >
                  <option value="">Seleccionar grupo</option>
                  {busGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="departureTime">Hora de Salida *</Label>
                <Input
                  id="departureTime"
                  type="time"
                  required
                  value={formData.departureTime}
                  onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Días de Operación *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day.value} className="flex items-center gap-2">
                    <Checkbox
                      id={day.value}
                      checked={formData.operatingDays.includes(day.value)}
                      onCheckedChange={() => toggleDay(day.value)}
                    />
                    <Label htmlFor={day.value} className="cursor-pointer">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingFrequency ? 'Actualizar' : 'Crear'} Frecuencia
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
