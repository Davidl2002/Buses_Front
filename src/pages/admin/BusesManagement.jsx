import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Bus,
  Settings,
  Eye,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Grid3X3,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { busService, busGroupService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import SeatDesigner from '@/components/admin/SeatDesigner';
import toast from 'react-hot-toast';

const SEAT_TYPES = {
  NORMAL: { label: 'Normal', color: 'bg-blue-100 text-blue-800', premium: 0 },
  VIP: { label: 'VIP', color: 'bg-purple-100 text-purple-800', premium: 0.30 },
  SEMI_CAMA: { label: 'Semi-Cama', color: 'bg-green-100 text-green-800', premium: 0.50 }
};

export default function BusesManagement() {
  const [buses, setBuses] = useState([]);
  const [allBuses, setAllBuses] = useState([]);
  const [busGroups, setBusGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeCard, setActiveCard] = useState('ALL');
  const [showSeatDesigner, setShowSeatDesigner] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    placa: '',
    marca: '',
    modelo: '',
    year: new Date().getFullYear(),
    chasis: '',
    numeroInterno: '',
    totalSeats: 40,
    hasAC: false,
    hasWifi: false,
    hasBathroom: false,
    hasTV: false,
    status: 'ACTIVE',
    busGroupId: ''
  });

  const [seatLayout, setSeatLayout] = useState({
    rows: 10,
    columns: 4,
    seats: []
  });

  useEffect(() => {
    loadAllBuses();
    loadData();
    // Inicializar layout de asientos por defecto
    if (seatLayout.seats.length === 0) {
      const defaultSeats = generateSeatsMatrix(10, 4, 40);
      setSeatLayout({
        rows: 10,
        columns: 4,
        seats: defaultSeats
      });
    }
  }, []);

  // Cargar lista completa para contadores independientes
  const loadAllBuses = async () => {
    try {
      const params = {};
      if (user?.cooperativaId) params.cooperativaId = user.cooperativaId;
      const res = await busService.getAll(params);
      const data = res.data?.data || res.data || [];
      setAllBuses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading all buses:', err);
      setAllBuses([]);
    }
  };

  const loadData = async () => {
    try {
      // Si el usuario tiene cooperativaId, solicitar solo los buses de esa cooperativa
      const params = {};
      if (user?.cooperativaId) params.cooperativaId = user.cooperativaId;
      const busesResponse = await busService.getAll(params);
      setBuses(busesResponse.data.data);
      
      // Intentar cargar grupos de buses (opcional)
      try {
        const groupsResponse = await busGroupService.getAll();
        setBusGroups(groupsResponse.data.data || []);
      } catch (groupError) {
        console.log('Bus groups not available, continuing without them');
        setBusGroups([]);
      }
    } catch (error) {
      console.error('Error loading buses:', error);
      toast.error('Error al cargar los buses');
    } finally {
      setLoading(false);
    }
  };

  const generateSeatsMatrix = (rows, columns, totalSeats) => {
    const seats = [];
    for (let i = 0; i < totalSeats; i++) {
      const row = Math.floor(i / columns);
      const col = i % columns;
      
      // Lógica por defecto: primera fila VIP, últimas filas Semi-cama, resto Normal
      let type = 'NORMAL';
      if (row === 0) {
        type = 'VIP';
      } else if (row >= rows - 1) {
        type = 'SEMI_CAMA';
      }

      seats.push({
        number: i + 1,
        row,
        col,
        type,
        isAvailable: true
      });
    }
    return seats;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validar que seatLayout tenga asientos (puede venir como seats o como piso1/piso2)
      const layout = formData.seatLayout || seatLayout || {};
      let layoutCount = 0;
      if (layout.piso1 || layout.piso2) {
        layoutCount = (layout.piso1?.length || 0) + (layout.piso2?.length || 0);
      } else if (layout.seats) {
        layoutCount = layout.seats.length;
      }
      if (layoutCount === 0) {
        toast.error('Debe configurar el diseño de asientos');
        return;
      }
      // Validar que coincida con totalSeats y mínimo 20
      const expected = parseInt(formData.totalSeats);
      if (isNaN(expected) || expected < 20) {
        toast.error('El total de asientos debe ser al menos 20');
        return;
      }
      if (layoutCount !== expected) {
        toast.error(`El número de asientos en el diseño (${layoutCount}) debe coincidir con Total de Asientos (${expected})`);
        return;
      }

      let seatLayoutData;
      if (seatLayout.piso1 || seatLayout.piso2) {
        seatLayoutData = {
          rows: seatLayout.rows,
          columns: seatLayout.columns,
          piso1: seatLayout.piso1 || [],
          piso2: seatLayout.piso2 || [],
        };
      } else {
        seatLayoutData = {
          rows: seatLayout.rows,
          columns: seatLayout.columns,
          seats: seatLayout.seats
        };
      }
      const busData = {
        placa: formData.placa.trim(),
        marca: formData.marca.trim(),
        modelo: formData.modelo.trim(),
        year: parseInt(formData.year),
        chasis: formData.chasis.trim(),
        numeroInterno: formData.numeroInterno.trim(),
        totalSeats: seatLayoutData.piso1 ? (seatLayoutData.piso1.length + seatLayoutData.piso2.length) : seatLayoutData.seats.length,
        cooperativaId: user.cooperativaId,
        hasAC: formData.hasAC,
        hasWifi: formData.hasWifi,
        hasBathroom: formData.hasBathroom,
        hasTV: formData.hasTV,
        status: formData.status,
        seatLayout: seatLayoutData
      };

      // Solo agregar busGroupId si no es 'none'
      if (formData.busGroupId && formData.busGroupId !== 'none') {
        busData.busGroupId = formData.busGroupId;
      }

      console.log('Sending bus data:', busData);

      if (editingBus) {
        await busService.update(editingBus.id, busData);
        toast.success('Bus actualizado exitosamente');
      } else {
        await busService.create(busData);
        toast.success('Bus creado exitosamente');
      }
      
      resetForm();
      await loadAllBuses();
      await loadData();
    } catch (error) {
      console.error('Error saving bus:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Error al guardar el bus');
    }
  };

  const handleEdit = async (bus) => {
    try {
      // Obtener datos completos del bus desde el backend (puede que la lista no incluya seatLayout)
      const res = await busService.getById(bus.id);
      const full = res.data?.data || res.data || bus;

      setEditingBus(full);
      setFormData({
        placa: full.placa,
        marca: full.marca,
        modelo: full.modelo,
        year: full.year,
        chasis: full.chasis || '',
        numeroInterno: full.numeroInterno,
        totalSeats: full.totalSeats,
        hasAC: full.hasAC || false,
        hasWifi: full.hasWifi || false,
        hasBathroom: full.hasBathroom || false,
        hasTV: full.hasTV || false,
        status: full.status,
        busGroupId: full.busGroupId || 'none'
      });

      if (full.seatLayout) {
        // Normalizar distintos formatos recibidos desde backend
        const sl = full.seatLayout;
        const columns = sl.columns || 5;
        let rows = sl.rows;
        let seats = [];

        if (sl.piso1 || sl.piso2) {
          const piso1 = (sl.piso1 || []).map(s => ({ ...s, floor: 0 }));
          const piso2 = (sl.piso2 || []).map(s => ({ ...s, floor: 1 }));
          seats = [...piso1, ...piso2];
          rows = rows || Math.ceil((seats.length / (columns - 1)));
        } else if (sl.seats) {
          seats = sl.seats.map(s => ({ ...s, floor: s.floor || 0 }));
          rows = rows || Math.ceil((seats.length / (columns - 1)));
        }

        // Asegurar numeración y propiedades mínimas
        seats = seats.map((s, i) => ({ number: s.number || i + 1, row: s.row ?? Math.floor(i / (columns - 1)), col: s.col ?? (i % (columns - 1)), floor: s.floor ?? 0, type: s.type || 'NORMAL', isAvailable: s.isAvailable ?? true }));

        setSeatLayout({ rows: rows || 10, columns, seats, totalSeats: full.totalSeats });
        // guardar también en formData para persistencia en modal
        setFormData(prev => ({ ...prev, seatLayout: { rows: rows || 10, columns, seats, totalSeats: full.totalSeats } }));
      } else {
        // Generar layout por defecto
        const seats = generateSeatsMatrix(10, 4, full.totalSeats);
        setSeatLayout({
          rows: 10,
          columns: 4,
          seats
        });
      }

      setShowForm(true);
    } catch (error) {
      console.error('Error loading bus full data:', error);
      // Fallback: abrir con los datos que ya teníamos
      setEditingBus(bus);
      setFormData({
        placa: bus.placa,
        marca: bus.marca,
        modelo: bus.modelo,
        year: bus.year,
        chasis: bus.chasis || '',
        numeroInterno: bus.numeroInterno,
        totalSeats: bus.totalSeats,
        hasAC: bus.hasAC || false,
        hasWifi: bus.hasWifi || false,
        hasBathroom: bus.hasBathroom || false,
        hasTV: bus.hasTV || false,
        status: bus.status,
        busGroupId: bus.busGroupId || 'none'
      });
      setShowForm(true);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este bus?')) {
      return;
    }

    try {
      await busService.delete(id);
      toast.success('Bus eliminado exitosamente');
      await loadAllBuses();
      await loadData();
    } catch (error) {
      console.error('Error deleting bus:', error);
      toast.error('Error al eliminar el bus');
    }
  };

  const resetForm = () => {
    setFormData({
      placa: '',
      marca: '',
      modelo: '',
      year: new Date().getFullYear(),
      chasis: '',
      numeroInterno: '',
      totalSeats: 40,
      hasAC: false,
      hasWifi: false,
      hasBathroom: false,
      hasTV: false,
      status: 'ACTIVE',
      busGroupId: 'none'
    });
    
    // Regenerar layout de asientos por defecto
    const defaultSeats = generateSeatsMatrix(10, 4, 40);
    setSeatLayout({
      rows: 10,
      columns: 4,
      seats: defaultSeats
    });
    
    setEditingBus(null);
    setShowForm(false);
    setShowSeatDesigner(false);
  };

  const openSeatDesigner = () => {
    const cols = 5; // diseñador usa 5 columnas (la del medio es pasillo)
    const rows = Math.ceil((formData.totalSeats || 40) / (cols - 1));
    if (editingBus) {
      // edición: si el bus tiene layout, ya estará en seatLayout; si no, generar
      if (!seatLayout.seats || seatLayout.seats.length === 0) {
        const seats = generateSeatsMatrix(rows, cols, formData.totalSeats);
        setSeatLayout(prev => ({ ...prev, rows, columns: cols, seats }));
      } else {
        setSeatLayout(prev => ({ ...prev, rows, columns: cols }));
      }
    } else {
      // creación: si ya existe seatLayout en formData (guardado previamente), cargarlo; si no, iniciar vacío
      if (formData.seatLayout && (formData.seatLayout.seats?.length > 0 || formData.seatLayout.piso1 || formData.seatLayout.piso2)) {
        setSeatLayout({ ...formData.seatLayout, rows, columns: cols });
      } else {
        setSeatLayout(prev => ({ ...prev, rows, columns: cols, seats: [], totalSeats: formData.totalSeats }));
      }
    }
    setShowSeatDesigner(true);
  };

  const openSeatViewer = async (bus) => {
    try {
      const res = await busService.getById(bus.id);
      const full = res.data?.data || res.data || bus;

      if (full.seatLayout) {
        const sl = full.seatLayout;
        const columns = sl.columns || 5;
        let rows = sl.rows;
        let seats = [];

        if (sl.piso1 || sl.piso2) {
          const piso1 = (sl.piso1 || []).map(s => ({ ...s, floor: 0 }));
          const piso2 = (sl.piso2 || []).map(s => ({ ...s, floor: 1 }));
          seats = [...piso1, ...piso2];
          rows = rows || Math.ceil((seats.length / (columns - 1)));
        } else if (sl.seats) {
          seats = sl.seats.map(s => ({ ...s, floor: s.floor || 0 }));
          rows = rows || Math.ceil((seats.length / (columns - 1)));
        }

        seats = seats.map((s, i) => ({ number: s.number || i + 1, row: s.row ?? Math.floor(i / (columns - 1)), col: s.col ?? (i % (columns - 1)), floor: s.floor ?? 0, type: s.type || 'NORMAL', isAvailable: s.isAvailable ?? true }));

        setSeatLayout({ rows: rows || 10, columns, seats, totalSeats: full.totalSeats });
      } else {
        const cols = 5;
        const rowsCalc = Math.ceil((full.totalSeats || 40) / (cols - 1));
        const seats = generateSeatsMatrix(rowsCalc, cols, full.totalSeats);
        setSeatLayout({ rows: rowsCalc, columns: cols, seats });
      }

      setEditingBus(null);
      setShowSeatDesigner(true);
    } catch (error) {
      console.error('Error loading seat layout for viewer:', error);
      // Fallback: use what we have in bus object
      if (bus.seatLayout) {
        setSeatLayout(bus.seatLayout);
      } else {
        const cols = 5;
        const rowsCalc = Math.ceil((bus.totalSeats || 40) / (cols - 1));
        const seats = generateSeatsMatrix(rowsCalc, cols, bus.totalSeats);
        setSeatLayout({ rows: rowsCalc, columns: cols, seats });
      }
      setEditingBus(null);
      setShowSeatDesigner(true);
    }
  };

  const updateSeatType = (seatNumber, newType) => {
    setSeatLayout(prev => ({
      ...prev,
      seats: prev.seats.map(seat => 
        seat.number === seatNumber 
          ? { ...seat, type: newType }
          : seat
      )
    }));
  };

  const reconfigureSeats = () => {
    const seats = generateSeatsMatrix(seatLayout.rows, seatLayout.columns, formData.totalSeats);
    setSeatLayout(prev => ({ ...prev, seats }));
  };

  const filteredBuses = buses.filter(bus => {
    const matchesSearch = bus.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bus.numeroInterno.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bus.marca.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || bus.status === statusFilter;
    return matchesSearch && matchesStatus;
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
      <div className="flex justify-between items-start border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Buses</h1>
          <p className="text-gray-600 mt-1">Administrar la flota de buses de la cooperativa</p>
        </div>

        <div className="flex-1 mx-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por placa, número interno o marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSearchTerm('')} className="whitespace-nowrap">
            Limpiar
          </Button>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Bus
          </Button>
        </div>
      </div>

      {/* Filtros (estado) removed: use the quick stat cards to filter */}

      {/* Estadísticas Rápidas (clickeables, contadores independientes) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`${statusFilter === 'ALL' ? 'ring-2 ring-primary' : ''}`}>
          <CardContent
            className="p-4 cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => { setStatusFilter('ALL'); setSearchTerm(''); setActiveCard('ALL'); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { setStatusFilter('ALL'); setSearchTerm(''); setActiveCard('ALL'); } }}
          >
            <div className="flex items-center gap-3">
              <Bus className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{allBuses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${statusFilter === 'ACTIVE' ? 'ring-2 ring-primary' : ''}`}>
          <CardContent
            className="p-4 cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => { const newStatus = statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE'; setStatusFilter(newStatus); setSearchTerm(''); setActiveCard(newStatus); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { const newStatus = statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE'; setStatusFilter(newStatus); setSearchTerm(''); setActiveCard(newStatus); } }}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Activos</p>
                <p className="text-2xl font-bold">{allBuses.filter(b => b.status === 'ACTIVE').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${statusFilter === 'MAINTENANCE' ? 'ring-2 ring-primary' : ''}`}>
          <CardContent
            className="p-4 cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => { const newStatus = statusFilter === 'MAINTENANCE' ? 'ALL' : 'MAINTENANCE'; setStatusFilter(newStatus); setSearchTerm(''); setActiveCard(newStatus); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { const newStatus = statusFilter === 'MAINTENANCE' ? 'ALL' : 'MAINTENANCE'; setStatusFilter(newStatus); setSearchTerm(''); setActiveCard(newStatus); } }}
          >
            <div className="flex items-center gap-3">
              <Wrench className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Mantenimiento</p>
                <p className="text-2xl font-bold">{allBuses.filter(b => b.status === 'MAINTENANCE').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${statusFilter === 'INACTIVE' ? 'ring-2 ring-primary' : ''}`}>
          <CardContent
            className="p-4 cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => { const newStatus = statusFilter === 'INACTIVE' ? 'ALL' : 'INACTIVE'; setStatusFilter(newStatus); setSearchTerm(''); setActiveCard(newStatus); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { const newStatus = statusFilter === 'INACTIVE' ? 'ALL' : 'INACTIVE'; setStatusFilter(newStatus); setSearchTerm(''); setActiveCard(newStatus); } }}
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Inactivos</p>
                <p className="text-2xl font-bold">{allBuses.filter(b => b.status === 'INACTIVE').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Buses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bus className="h-5 w-5" />
            Flota de Buses ({filteredBuses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bus</TableHead>
                  <TableHead>Detalles</TableHead>
                  <TableHead>Asientos</TableHead>
                  <TableHead>Servicios</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuses.map((bus) => (
                  <TableRow key={bus.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-lg">{bus.placa}</div>
                        <div className="text-sm text-gray-600">#{bus.numeroInterno}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{bus.marca} {bus.modelo}</div>
                        <div className="text-sm text-gray-600">Año {bus.year}</div>
                        {bus.chasis && (
                          <div className="text-xs text-gray-500">Chasis: {bus.chasis}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600">{bus.totalSeats}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openSeatViewer(bus)}
                          title="Ver diseño"
                        >
                          <Grid3X3 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {bus.hasAC && <Badge variant="secondary" className="text-xs">A/C</Badge>}
                        {bus.hasWifi && <Badge variant="secondary" className="text-xs">WiFi</Badge>}
                        {bus.hasBathroom && <Badge variant="secondary" className="text-xs">Baño</Badge>}
                        {bus.hasTV && <Badge variant="secondary" className="text-xs">TV</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          bus.status === 'ACTIVE' ? 'default' : 
                          bus.status === 'MAINTENANCE' ? 'secondary' : 'destructive'
                        }
                      >
                        {bus.status === 'ACTIVE' ? 'Activo' : 
                         bus.status === 'MAINTENANCE' ? 'Mantenimiento' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(bus)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(bus.id)}
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
            
            {filteredBuses.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Bus className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No se encontraron buses</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Formulario */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBus ? 'Editar Bus' : 'Nuevo Bus'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="placa">Placa *</Label>
                <Input
                  id="placa"
                  value={formData.placa}
                  onChange={(e) => setFormData({...formData, placa: e.target.value.toUpperCase()})}
                  placeholder="PBA-1234"
                  required
                />
              </div>
              <div>
                <Label htmlFor="numeroInterno">Número Interno *</Label>
                <Input
                  id="numeroInterno"
                  value={formData.numeroInterno}
                  onChange={(e) => setFormData({...formData, numeroInterno: e.target.value})}
                  placeholder="001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="totalSeats">Total de Asientos *</Label>
                <Input
                  id="totalSeats"
                  type="number"
                  min="20"
                  max="60"
                  value={formData.totalSeats}
                  onChange={(e) => {
                    const seats = parseInt(e.target.value);
                    setFormData({...formData, totalSeats: seats});
                      // Si estamos editando un bus existente, regenerar a partir del layout
                      // Si estamos creando (editingBus == null), no generar asientos automáticamente:
                      const cols = seatLayout.columns || 5;
                      const rows = Math.ceil((seats || 40) / (cols - 1));
                      if (editingBus) {
                        const newSeats = generateSeatsMatrix(rows, cols, seats);
                        setSeatLayout(prev => ({ ...prev, rows, columns: cols, seats: newSeats, totalSeats: seats }));
                      } else {
                        // creación: preparar layout vacío y permitir agregar manualmente en el diseñador
                        setSeatLayout(prev => ({ ...prev, rows, columns: cols, seats: [], totalSeats: seats }));
                      }
                  }}
                  required
                />
              </div>
            </div>

            {/* Detalles del Vehículo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="marca">Marca *</Label>
                <Input
                  id="marca"
                  value={formData.marca}
                  onChange={(e) => setFormData({...formData, marca: e.target.value})}
                  placeholder="Mercedes Benz"
                  required
                />
              </div>
              <div>
                <Label htmlFor="modelo">Modelo *</Label>
                <Input
                  id="modelo"
                  value={formData.modelo}
                  onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                  placeholder="OF-1721"
                  required
                />
              </div>
              <div>
                <Label htmlFor="year">Año *</Label>
                <Input
                  id="year"
                  type="number"
                  min="2000"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="chasis">Número de Chasis</Label>
                <Input
                  id="chasis"
                  value={formData.chasis}
                  onChange={(e) => setFormData({...formData, chasis: e.target.value.toUpperCase()})}
                  placeholder="9BM3841421B123456"
                />
              </div>
              <div>
                <Label htmlFor="busGroupId">Grupo de Buses</Label>
                <Select value={formData.busGroupId} onValueChange={(value) => setFormData({...formData, busGroupId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar grupo (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin grupo</SelectItem>
                    {busGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Servicios del Bus */}
            <div>
              <Label className="text-base font-medium">Servicios Disponibles</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hasAC"
                    checked={formData.hasAC}
                    onCheckedChange={(checked) => setFormData({...formData, hasAC: checked})}
                  />
                  <Label htmlFor="hasAC">Aire Acondicionado</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hasWifi"
                    checked={formData.hasWifi}
                    onCheckedChange={(checked) => setFormData({...formData, hasWifi: checked})}
                  />
                  <Label htmlFor="hasWifi">WiFi</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hasBathroom"
                    checked={formData.hasBathroom}
                    onCheckedChange={(checked) => setFormData({...formData, hasBathroom: checked})}
                  />
                  <Label htmlFor="hasBathroom">Baño</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hasTV"
                    checked={formData.hasTV}
                    onCheckedChange={(checked) => setFormData({...formData, hasTV: checked})}
                  />
                  <Label htmlFor="hasTV">Televisión</Label>
                </div>
              </div>
            </div>

            {/* Estado y Configuración de Asientos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Estado del Bus</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                    <SelectItem value="INACTIVE">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={openSeatDesigner}
                  className="w-full flex items-center gap-2"
                >
                  <Grid3X3 className="h-4 w-4" />
                  Configurar Asientos ({formData.totalSeats})
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingBus ? 'Actualizar' : 'Crear'} Bus
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal del Diseñador de Asientos */}
      <Dialog open={showSeatDesigner} onOpenChange={setShowSeatDesigner}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5" />
              Diseñador de Asientos
            </DialogTitle>
          </DialogHeader>

          <SeatDesigner
            initialLayout={seatLayout}
            onLayoutChange={(newLayout) => {
              // mergear cambios de layout pero mantener totalSeats como el límite definido en el formulario
              setSeatLayout(prev => ({ ...prev, ...newLayout, totalSeats: formData.totalSeats }));
              // guardar también en formData para que persista durante la creación
              setFormData(prev => ({ ...prev, seatLayout: { ...newLayout, totalSeats: formData.totalSeats } }));
            }}
            readOnly={showForm === false && editingBus === null}
            maxSeats={formData.totalSeats}
          />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowSeatDesigner(false)}
            >
              Cerrar
            </Button>
            {editingBus && (
              <Button 
                type="button" 
                onClick={() => {
                  setShowSeatDesigner(false);
                  toast.success('Configuración de asientos guardada');
                }}
              >
                Guardar Configuración
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}