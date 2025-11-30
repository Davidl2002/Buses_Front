import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Users,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { superAdminService } from '@/services';
import toast from 'react-hot-toast';

export default function CooperativasManagement() {
  const [cooperativas, setCooperativas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCooperativa, setEditingCooperativa] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [formData, setFormData] = useState({
    nombre: '',
    ruc: '',
    direccion: '',
    telefono: '',
    email: '',
    representanteLegal: '',
    cedulaRepresentante: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    loadCooperativas();
  }, []);

  const loadCooperativas = async () => {
    try {
      const response = await superAdminService.getAllCooperativas();
      setCooperativas(response.data.data);
    } catch (error) {
      console.error('Error loading cooperativas:', error);
      toast.error('Error al cargar cooperativas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCooperativa) {
        await superAdminService.updateCooperativa(editingCooperativa.id, formData);
        toast.success('Cooperativa actualizada exitosamente');
      } else {
        await superAdminService.createCooperativa(formData);
        toast.success('Cooperativa creada exitosamente');
      }
      
      resetForm();
      loadCooperativas();
    } catch (error) {
      console.error('Error saving cooperativa:', error);
      toast.error(error.response?.data?.message || 'Error al guardar cooperativa');
    }
  };

  const handleEdit = (cooperativa) => {
    setEditingCooperativa(cooperativa);
    setFormData({
      nombre: cooperativa.nombre,
      ruc: cooperativa.ruc,
      direccion: cooperativa.direccion || '',
      telefono: cooperativa.telefono || '',
      email: cooperativa.email || '',
      representanteLegal: cooperativa.representanteLegal || '',
      cedulaRepresentante: cooperativa.cedulaRepresentante || '',
      status: cooperativa.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta cooperativa?')) {
      return;
    }

    try {
      await superAdminService.deleteCooperativa(id);
      toast.success('Cooperativa eliminada exitosamente');
      loadCooperativas();
    } catch (error) {
      console.error('Error deleting cooperativa:', error);
      toast.error('Error al eliminar cooperativa');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      ruc: '',
      direccion: '',
      telefono: '',
      email: '',
      representanteLegal: '',
      cedulaRepresentante: '',
      status: 'ACTIVE'
    });
    setEditingCooperativa(null);
    setShowForm(false);
  };

  const filteredCooperativas = cooperativas.filter(coop => {
    const matchesSearch = coop.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coop.ruc.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || coop.status === statusFilter;
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Cooperativas</h1>
          <p className="text-gray-600 mt-1">Administrar cooperativas de transporte en la plataforma</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nueva Cooperativa
        </Button>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nombre o RUC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los Estados</SelectItem>
            <SelectItem value="ACTIVE">Activas</SelectItem>
            <SelectItem value="INACTIVE">Inactivas</SelectItem>
            <SelectItem value="SUSPENDED">Suspendidas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla de Cooperativas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Cooperativas Registradas ({filteredCooperativas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cooperativa</TableHead>
                  <TableHead>RUC</TableHead>
                  <TableHead>Representante Legal</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCooperativas.map((cooperativa) => (
                  <TableRow key={cooperativa.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{cooperativa.nombre}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {cooperativa.direccion || 'Dirección no especificada'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {cooperativa.ruc}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{cooperativa.representanteLegal || 'No especificado'}</div>
                        <div className="text-sm text-gray-500">
                          CI: {cooperativa.cedulaRepresentante || 'No especificada'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {cooperativa.telefono && (
                          <div className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {cooperativa.telefono}
                          </div>
                        )}
                        {cooperativa.email && (
                          <div className="text-sm flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {cooperativa.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          cooperativa.status === 'ACTIVE' ? 'default' : 
                          cooperativa.status === 'INACTIVE' ? 'destructive' : 'secondary'
                        }
                      >
                        {cooperativa.status === 'ACTIVE' ? 'Activa' : 
                         cooperativa.status === 'INACTIVE' ? 'Inactiva' : 'Suspendida'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(cooperativa)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(cooperativa.id)}
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
            
            {filteredCooperativas.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No se encontraron cooperativas</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Formulario */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCooperativa ? 'Editar Cooperativa' : 'Nueva Cooperativa'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre de la Cooperativa *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ruc">RUC *</Label>
                <Input
                  id="ruc"
                  value={formData.ruc}
                  onChange={(e) => setFormData({...formData, ruc: e.target.value})}
                  placeholder="1234567890001"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                placeholder="Dirección completa de la cooperativa"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  placeholder="02-1234567"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="contacto@cooperativa.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="representanteLegal">Representante Legal</Label>
                <Input
                  id="representanteLegal"
                  value={formData.representanteLegal}
                  onChange={(e) => setFormData({...formData, representanteLegal: e.target.value})}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <Label htmlFor="cedulaRepresentante">Cédula del Representante</Label>
                <Input
                  id="cedulaRepresentante"
                  value={formData.cedulaRepresentante}
                  onChange={(e) => setFormData({...formData, cedulaRepresentante: e.target.value})}
                  placeholder="1234567890"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activa</SelectItem>
                  <SelectItem value="INACTIVE">Inactiva</SelectItem>
                  <SelectItem value="SUSPENDED">Suspendida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingCooperativa ? 'Actualizar' : 'Crear'} Cooperativa
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}