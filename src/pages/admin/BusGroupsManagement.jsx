import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building2, Bus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { busGroupService } from '@/services';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function BusGroupsManagement() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await busGroupService.getAll();
      const data = res.data?.data || res.data || [];
      setGroups(data);
    } catch (error) {
      console.error('Error loading bus groups:', error);
      toast.error('Error al cargar los grupos de buses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
      };
      // If admin, ensure cooperativaId is set
      if (user?.role === 'ADMIN' && user?.cooperativaId) {
        payload.cooperativaId = user.cooperativaId;
      }

      if (editingGroup) {
        await busGroupService.update(editingGroup.id, payload);
        toast.success('Grupo actualizado');
      } else {
        await busGroupService.create(payload);
        toast.success('Grupo creado');
      }

      setShowForm(false);
      setEditingGroup(null);
      setFormData({ name: '', description: '' });
      loadData();
    } catch (error) {
      console.error('Error saving group:', error);
      toast.error(error.response?.data?.message || 'Error al guardar el grupo');
    }
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setFormData({ name: group.name || '', description: group.description || '' });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar grupo de buses? Asegúrate de que no tenga buses activos o frecuencias asignadas.')) return;
    try {
      await busGroupService.delete(id);
      toast.success('Grupo eliminado');
      loadData();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('No se pudo eliminar el grupo');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Grupos de Buses</h1>
        <p className="text-gray-600 mt-1">Crear y administrar grupos de buses de la cooperativa</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Grupo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Grupos ({groups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Buses</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map(g => (
                <TableRow key={g.id}>
                  <TableCell>
                    <div className="font-medium">{g.name}</div>
                    <div className="text-xs text-gray-500">{g.cooperativa?.name || ''}</div>
                  </TableCell>
                  <TableCell>{g.description || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Bus className="h-4 w-4 text-gray-500" />
                      <span>{g._count?.buses ?? (g.buses ? g.buses.length : 0)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(g)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(g.id)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {groups.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No se encontraron grupos</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Editar Grupo' : 'Nuevo Grupo'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingGroup(null); setFormData({ name: '', description: '' }); }}>Cancelar</Button>
              <Button type="submit">{editingGroup ? 'Actualizar' : 'Crear'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
