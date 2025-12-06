import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cityService } from '@/services';
import useActiveCooperativaId from '@/hooks/useActiveCooperativaId';

export default function CitiesManagement() {
  const { user } = useAuth();
  const coopId = useActiveCooperativaId();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', state: '', country: '', isActive: true });
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (coopId || user?.cooperativaId) {
      loadCities();
    }
  }, [coopId]);

  const loadCities = async () => {
    try {
      setLoading(true);
      const params = {};
      if (coopId) params.cooperativaId = coopId;
      const res = await cityService.getAll(params);
      const data = res.data?.data || res.data || [];
      setCities(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading cities', e);
      toast.error('No se pudieron cargar las ciudades');
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', state: '', country: '', isActive: true });
    setShowForm(true);
  };

  const openEdit = (city) => {
    setEditing(city);
    setForm({ name: city.name || '', state: city.state || '', country: city.country || '', isActive: city.isActive !== false });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!form.name) return toast.error('Nombre es obligatorio');

    try {
      if (editing) {
        await cityService.update(editing.id, form);
        toast.success('Ciudad actualizada');
      } else {
        await cityService.create(form);
        toast.success('Ciudad creada');
      }
      setShowForm(false);
      loadCities();
    } catch (err) {
      console.error('Error saving city', err);
      toast.error(err.response?.data?.message || 'Error al guardar la ciudad');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar ciudad? (se marcará como inactiva)')) return;
    try {
      await cityService.delete(id);
      toast.success('Ciudad eliminada');
      loadCities();
    } catch (err) {
      console.error('Error deleting city', err);
      toast.error(err.response?.data?.message || 'Error al eliminar la ciudad');
    }
  };

  const filtered = cities.filter(c => {
    if (!search) return true;
    const q = search.trim().toLowerCase();
    const v = (typeof c === 'string') ? c : (c.name || c.cityName || c.label || '');
    return String(v).toLowerCase().includes(q) || String(c.state || '').toLowerCase().includes(q);
  });

  // Si es superadmin y no ha seleccionado cooperativa, mostrar mensaje
  if (user?.role === 'SUPER_ADMIN' && !coopId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Plus className="h-16 w-16 text-gray-400" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Selecciona una cooperativa</h3>
          <p className="text-gray-500 mt-1">Para gestionar ciudades, primero selecciona una cooperativa en el menú lateral.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Ciudades</h1>
          <p className="text-gray-600 mt-1">Administra las ciudades disponibles para seleccionar en rutas y paradas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Nueva Ciudad
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ciudades</CardTitle>
          <CardDescription>Lista de ciudades activas e inactivas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Input placeholder="Buscar ciudad o provincia" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-6"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Provincia/Estado</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(city => (
                  <TableRow key={city.id}>
                    <TableCell>{city.name || city}</TableCell>
                    <TableCell>{city.state || '-'}</TableCell>
                    <TableCell>{city.country || '-'}</TableCell>
                    <TableCell>{city.isActive ? 'Sí' : 'No'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(city)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(city.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">No hay ciudades</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Ciudad' : 'Nueva Ciudad'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} required />
            </div>
            <div>
              <Label>Provincia / Estado</Label>
              <Input value={form.state} onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value }))} />
            </div>
            <div>
              <Label>País</Label>
              <Input value={form.country} onChange={(e) => setForm(prev => ({ ...prev, country: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.isActive} onCheckedChange={(v) => setForm(prev => ({ ...prev, isActive: !!v }))} />
              <Label>Activo</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit">{editing ? 'Actualizar' : 'Crear'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
