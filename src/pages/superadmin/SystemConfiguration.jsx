import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Building,
  Search,
  Filter,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { superAdminService } from '@/services';
import toast from 'react-hot-toast';

export default function SystemConfiguration() {
  const [cities, setCities] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cities');
  
  // Estados para ciudades
  const [showCityForm, setShowCityForm] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [cityFormData, setCityFormData] = useState({
    nombre: '',
    provincia: '',
    codigoPostal: '',
    latitud: '',
    longitud: ''
  });
  
  // Estados para terminales
  const [showTerminalForm, setShowTerminalForm] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState(null);
  const [terminalSearchTerm, setTerminalSearchTerm] = useState('');
  const [terminalFormData, setTerminalFormData] = useState({
    nombre: '',
    direccion: '',
    ciudadId: '',
    telefono: '',
    servicios: '',
    capacidadVehiculos: '',
    horaApertura: '',
    horaCierre: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [citiesResponse, terminalsResponse] = await Promise.all([
        superAdminService.getCities(),
        superAdminService.getTerminals()
      ]);
      
      setCities(citiesResponse.data.data);
      setTerminals(terminalsResponse.data.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar la configuración del sistema');
    } finally {
      setLoading(false);
    }
  };

  // Funciones para Ciudades
  const handleCitySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCity) {
        await superAdminService.updateCity(editingCity.id, cityFormData);
        toast.success('Ciudad actualizada exitosamente');
      } else {
        await superAdminService.createCity(cityFormData);
        toast.success('Ciudad creada exitosamente');
      }
      
      resetCityForm();
      loadData();
    } catch (error) {
      console.error('Error saving city:', error);
      toast.error('Error al guardar ciudad');
    }
  };

  const handleEditCity = (city) => {
    setEditingCity(city);
    setCityFormData({
      nombre: city.nombre,
      provincia: city.provincia,
      codigoPostal: city.codigoPostal || '',
      latitud: city.latitud?.toString() || '',
      longitud: city.longitud?.toString() || ''
    });
    setShowCityForm(true);
  };

  const handleDeleteCity = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta ciudad?')) {
      return;
    }

    try {
      await superAdminService.deleteCity(id);
      toast.success('Ciudad eliminada exitosamente');
      loadData();
    } catch (error) {
      console.error('Error deleting city:', error);
      toast.error('Error al eliminar ciudad');
    }
  };

  const resetCityForm = () => {
    setCityFormData({
      nombre: '',
      provincia: '',
      codigoPostal: '',
      latitud: '',
      longitud: ''
    });
    setEditingCity(null);
    setShowCityForm(false);
  };

  // Funciones para Terminales
  const handleTerminalSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...terminalFormData,
        capacidadVehiculos: parseInt(terminalFormData.capacidadVehiculos) || 0
      };

      if (editingTerminal) {
        await superAdminService.updateTerminal(editingTerminal.id, data);
        toast.success('Terminal actualizado exitosamente');
      } else {
        await superAdminService.createTerminal(data);
        toast.success('Terminal creado exitosamente');
      }
      
      resetTerminalForm();
      loadData();
    } catch (error) {
      console.error('Error saving terminal:', error);
      toast.error('Error al guardar terminal');
    }
  };

  const handleEditTerminal = (terminal) => {
    setEditingTerminal(terminal);
    setTerminalFormData({
      nombre: terminal.nombre,
      direccion: terminal.direccion,
      ciudadId: terminal.ciudadId,
      telefono: terminal.telefono || '',
      servicios: terminal.servicios || '',
      capacidadVehiculos: terminal.capacidadVehiculos?.toString() || '',
      horaApertura: terminal.horaApertura || '',
      horaCierre: terminal.horaCierre || ''
    });
    setShowTerminalForm(true);
  };

  const handleDeleteTerminal = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este terminal?')) {
      return;
    }

    try {
      await superAdminService.deleteTerminal(id);
      toast.success('Terminal eliminado exitosamente');
      loadData();
    } catch (error) {
      console.error('Error deleting terminal:', error);
      toast.error('Error al eliminar terminal');
    }
  };

  const resetTerminalForm = () => {
    setTerminalFormData({
      nombre: '',
      direccion: '',
      ciudadId: '',
      telefono: '',
      servicios: '',
      capacidadVehiculos: '',
      horaApertura: '',
      horaCierre: ''
    });
    setEditingTerminal(null);
    setShowTerminalForm(false);
  };

  const filteredCities = cities.filter(city =>
    city.nombre.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
    city.provincia.toLowerCase().includes(citySearchTerm.toLowerCase())
  );

  const filteredTerminals = terminals.filter(terminal =>
    terminal.nombre.toLowerCase().includes(terminalSearchTerm.toLowerCase())
  );

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
        <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
        <p className="text-gray-600 mt-1">Gestionar ciudades y terminales terrestres del Ecuador</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cities" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Ciudades
          </TabsTrigger>
          <TabsTrigger value="terminals" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Terminales
          </TabsTrigger>
        </TabsList>

        {/* CIUDADES */}
        <TabsContent value="cities" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar ciudades..."
                  value={citySearchTerm}
                  onChange={(e) => setCitySearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
            <Button onClick={() => setShowCityForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Ciudad
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Ciudades Registradas ({filteredCities.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Provincia</TableHead>
                    <TableHead>Código Postal</TableHead>
                    <TableHead>Coordenadas</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCities.map((city) => (
                    <TableRow key={city.id}>
                      <TableCell>
                        <div className="font-medium">{city.nombre}</div>
                      </TableCell>
                      <TableCell>{city.provincia}</TableCell>
                      <TableCell>{city.codigoPostal || '-'}</TableCell>
                      <TableCell>
                        {city.latitud && city.longitud ? (
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {city.latitud}, {city.longitud}
                          </code>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditCity(city)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCity(city.id)}
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

              {filteredCities.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Globe className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No se encontraron ciudades</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TERMINALES */}
        <TabsContent value="terminals" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar terminales..."
                  value={terminalSearchTerm}
                  onChange={(e) => setTerminalSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
            <Button onClick={() => setShowTerminalForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Terminal
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Terminales Registrados ({filteredTerminals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Terminal</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Capacidad</TableHead>
                    <TableHead>Horarios</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTerminals.map((terminal) => (
                    <TableRow key={terminal.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{terminal.nombre}</div>
                          {terminal.telefono && (
                            <div className="text-sm text-gray-500">{terminal.telefono}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {cities.find(c => c.id === terminal.ciudadId)?.nombre || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{terminal.direccion}</div>
                      </TableCell>
                      <TableCell>
                        {terminal.capacidadVehiculos ? `${terminal.capacidadVehiculos} vehículos` : '-'}
                      </TableCell>
                      <TableCell>
                        {terminal.horaApertura && terminal.horaCierre ? (
                          <div className="text-sm">
                            {terminal.horaApertura} - {terminal.horaCierre}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTerminal(terminal)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTerminal(terminal.id)}
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

              {filteredTerminals.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Building className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No se encontraron terminales</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Formulario Ciudades */}
      <Dialog open={showCityForm} onOpenChange={setShowCityForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCity ? 'Editar Ciudad' : 'Nueva Ciudad'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCitySubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre de la Ciudad *</Label>
                <Input
                  id="nombre"
                  value={cityFormData.nombre}
                  onChange={(e) => setCityFormData({...cityFormData, nombre: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="provincia">Provincia *</Label>
                <Input
                  id="provincia"
                  value={cityFormData.provincia}
                  onChange={(e) => setCityFormData({...cityFormData, provincia: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="codigoPostal">Código Postal</Label>
              <Input
                id="codigoPostal"
                value={cityFormData.codigoPostal}
                onChange={(e) => setCityFormData({...cityFormData, codigoPostal: e.target.value})}
                placeholder="EC180101"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitud">Latitud</Label>
                <Input
                  id="latitud"
                  type="number"
                  step="any"
                  value={cityFormData.latitud}
                  onChange={(e) => setCityFormData({...cityFormData, latitud: e.target.value})}
                  placeholder="-0.2298"
                />
              </div>
              <div>
                <Label htmlFor="longitud">Longitud</Label>
                <Input
                  id="longitud"
                  type="number"
                  step="any"
                  value={cityFormData.longitud}
                  onChange={(e) => setCityFormData({...cityFormData, longitud: e.target.value})}
                  placeholder="-78.5249"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetCityForm}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingCity ? 'Actualizar' : 'Crear'} Ciudad
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Formulario Terminales */}
      <Dialog open={showTerminalForm} onOpenChange={setShowTerminalForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTerminal ? 'Editar Terminal' : 'Nuevo Terminal'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleTerminalSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="terminalNombre">Nombre del Terminal *</Label>
                <Input
                  id="terminalNombre"
                  value={terminalFormData.nombre}
                  onChange={(e) => setTerminalFormData({...terminalFormData, nombre: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ciudadId">Ciudad *</Label>
                <select
                  id="ciudadId"
                  value={terminalFormData.ciudadId}
                  onChange={(e) => setTerminalFormData({...terminalFormData, ciudadId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar ciudad</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.nombre}, {city.provincia}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="terminalDireccion">Dirección *</Label>
              <Input
                id="terminalDireccion"
                value={terminalFormData.direccion}
                onChange={(e) => setTerminalFormData({...terminalFormData, direccion: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="terminalTelefono">Teléfono</Label>
                <Input
                  id="terminalTelefono"
                  value={terminalFormData.telefono}
                  onChange={(e) => setTerminalFormData({...terminalFormData, telefono: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="horaApertura">Hora Apertura</Label>
                <Input
                  id="horaApertura"
                  type="time"
                  value={terminalFormData.horaApertura}
                  onChange={(e) => setTerminalFormData({...terminalFormData, horaApertura: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="horaCierre">Hora Cierre</Label>
                <Input
                  id="horaCierre"
                  type="time"
                  value={terminalFormData.horaCierre}
                  onChange={(e) => setTerminalFormData({...terminalFormData, horaCierre: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacidadVehiculos">Capacidad de Vehículos</Label>
                <Input
                  id="capacidadVehiculos"
                  type="number"
                  value={terminalFormData.capacidadVehiculos}
                  onChange={(e) => setTerminalFormData({...terminalFormData, capacidadVehiculos: e.target.value})}
                  placeholder="50"
                />
              </div>
              <div>
                <Label htmlFor="servicios">Servicios Disponibles</Label>
                <Input
                  id="servicios"
                  value={terminalFormData.servicios}
                  onChange={(e) => setTerminalFormData({...terminalFormData, servicios: e.target.value})}
                  placeholder="Cafetería, Baños, WiFi, etc."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetTerminalForm}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingTerminal ? 'Actualizar' : 'Crear'} Terminal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}