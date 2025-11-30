import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  User,
  Search,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  UserCog,
  Shield,
  Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// Tabs removed: we show a single filtered table below instead of tabbed views
import { staffService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const STAFF_ROLES = [
  { value: 'CHOFER', label: 'Chofer', icon: Users, color: 'blue' },
  { value: 'OFICINISTA', label: 'Oficinista', icon: Briefcase, color: 'green' }
];

const LICENSE_TYPES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    cedula: '',
    role: '',
    licenseNumber: '',
    licenseType: '',
    licenseExpiryDate: '',
    terminalAssignment: '',
    emergencyContact: '',
    emergencyPhone: '',
    address: '',
    salary: '',
    hireDate: ''
  });
  
  const { user } = useAuth();

  // Helper para normalizar fechas para input[type=date] (tomar primeros 10 chars si viene ISO)
  const toDateInputValue = (d) => {
    if (!d) return '';
    if (typeof d !== 'string') return '';
    return d.includes('T') ? d.slice(0, 10) : d;
  };

  // Crear ISO pero anclado al mediodía local para evitar shifts UTC
  const makeIsoAtNoon = (dateStr) => {
    if (!dateStr) return undefined;
    const [y, m, day] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, day, 12, 0, 0);
    return dt.toISOString();
  };

  useEffect(() => {
    // Cargar staff con filtro inicial (si existe) y lista completa para contadores
    const paramRole = filterRole === 'ALL' ? undefined : (filterRole === 'CHOFER' ? 'DRIVER' : filterRole);
    loadAllStaff();
    loadStaff({ role: paramRole });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar lista completa para obtener contadores independientes del filtro
  const loadAllStaff = async () => {
    try {
      const res = await staffService.getAll();
      const staffData = res.data?.data || res.data || [];
      const normalized = (Array.isArray(staffData) ? staffData : []).map(s => ({
        ...s,
        role: s.role === 'DRIVER' ? 'CHOFER' : s.role,
        licenseExpiryDate: s.licenseExpiryDate || s.licenseExpiry || undefined
      }));
      setAllStaff(normalized);
    } catch (err) {
      console.error('Error loading all staff:', err);
    }
  };

  // Recargar cuando cambie el filtro de rol
  useEffect(() => {
    const paramRole = filterRole === 'ALL' ? undefined : (filterRole === 'CHOFER' ? 'DRIVER' : filterRole);
    loadStaff({ role: paramRole });
    // Mantener la pestaña sincronizada con el filtro
    setActiveTab(filterRole === 'ALL' ? 'all' : filterRole);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRole]);

  // Construir opciones de rol, incluyendo ADMIN solo si el usuario actual es SUPER_ADMIN
  const roleOptions = [...STAFF_ROLES];
  if (user?.role === 'SUPER_ADMIN') {
    roleOptions.unshift({ value: 'ADMIN', label: 'Administrador', icon: UserCog, color: 'purple' });
  }

  const loadStaff = async (params = {}) => {
    try {
      setLoading(true);
      console.log('Loading staff data...');
      const response = await staffService.getAll(params);
      console.log('Staff response:', response);
      
      // Manejar diferentes estructuras de respuesta
      const staffData = response.data?.data || response.data || [];
      // Normalizar roles que vengan como DRIVER desde el backend
      const normalized = (Array.isArray(staffData) ? staffData : []).map(s => ({
        ...s,
        role: s.role === 'DRIVER' ? 'CHOFER' : s.role,
        // map backend date field to UI-friendly name if present
        licenseExpiryDate: s.licenseExpiryDate || s.licenseExpiry || undefined,
        hireDate: s.hireDate || s.hireDate
      }));
      console.log('Staff data:', staffData);
      
      setStaff(normalized);
    } catch (error) {
      console.error('Error loading staff:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || 'Error al cargar el personal');
      setStaff([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const staffData = {
        ...formData,
        cooperativaId: user.cooperativaId
      };

      // Convertir tipos numéricos para CHOFER
      if (staffData.role === 'CHOFER') {
        if (staffData.salary) {
          staffData.salary = parseFloat(staffData.salary);
        }
      }
      // Enviar fechas en formato YYYY-MM-DD (el backend espera date-only)
      if (staffData.licenseExpiryDate) {
        staffData.licenseExpiryDate = staffData.licenseExpiryDate.slice(0, 10);
      }
      if (staffData.hireDate) {
        staffData.hireDate = staffData.hireDate.slice(0, 10);
      }

      // Validaciones cliente rápidas
      if (staffData.cedula) {
        const c = String(staffData.cedula).trim();
        if (c.length < 10 || c.length > 13) {
          toast.error('La cédula debe tener entre 10 y 13 caracteres');
          return;
        }
      }

      if (staffData.phone) {
        const phone = String(staffData.phone).trim();
        // Permitir + y dígitos, entre 7 y 15 dígitos
        if (!/^\+?\d{7,15}$/.test(phone)) {
          toast.error('Formato de teléfono inválido. Usa formato internacional (p. ej. +5939xxxxxxx)');
          return;
        }
      }

      if (staffData.salary !== undefined && staffData.salary !== null && staffData.salary !== '') {
        const cleanedSalary = String(staffData.salary).replace(/[,\s]/g, '');
        const parsed = parseFloat(cleanedSalary);
        if (Number.isNaN(parsed)) {
          toast.error('Salario inválido');
          return;
        }
        staffData.salary = parsed;
      }

      // Validar rol
      const allowedRoles = ['CHOFER', 'OFICINISTA', 'ADMIN'];
      if (staffData.role && !allowedRoles.includes(staffData.role)) {
        toast.error('Rol inválido');
        return;
      }

      // Eliminar campos vacíos para no enviarlos al backend (evitar validaciones innecesarias)
      Object.keys(staffData).forEach((k) => {
        const v = staffData[k];
        if (v === '' || v === null || v === undefined) {
          delete staffData[k];
        }
      });

      // Log payload para depuración en caso de 400
      console.log('Submitting staff payload:', staffData);

      // Limpiar campos específicos según el rol
      if (staffData.role === 'OFICINISTA') {
        delete staffData.licenseNumber;
        delete staffData.licenseType;
        delete staffData.licenseExpiry;
        delete staffData.salary;
        delete staffData.hireDate;
      }

      // Al editar, solo enviar password si se cambió
      if (editingStaff && !staffData.password) {
        delete staffData.password;
      }

      if (editingStaff) {
        await staffService.update(editingStaff.id, staffData);
        toast.success('Personal actualizado exitosamente');
      } else {
        await staffService.create(staffData);
        toast.success('Personal creado exitosamente');
      }
      
      resetForm();
      // refrescar vista actual y contadores
      const paramRole = filterRole === 'ALL' ? undefined : (filterRole === 'CHOFER' ? 'DRIVER' : filterRole);
      await loadAllStaff();
      await loadStaff({ role: paramRole });
    } catch (error) {
      console.error('Error saving staff:', error);
      console.error('Server response:', error.response?.data);
      // Mostrar errores de validación devueltos por el servidor si existen
      const serverData = error.response?.data;
      if (serverData) {
        if (Array.isArray(serverData.errors) && serverData.errors.length > 0) {
          // errores del validador: mostrar cada uno
          serverData.errors.forEach(err => {
            const msg = err.msg || err.message || `${err.param}: inválido`;
            toast.error(msg);
          });
        } else if (serverData.message) {
          toast.error(serverData.message);
        } else if (typeof serverData === 'string') {
          toast.error(serverData);
        } else {
          toast.error('Error al guardar el personal');
        }
      } else {
        toast.error('Error al guardar el personal');
      }
    }
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      firstName: staffMember.firstName || '',
      lastName: staffMember.lastName || '',
      email: staffMember.email || '',
      password: '', // No mostrar password en edición
      phone: staffMember.phone || '',
      cedula: staffMember.cedula || '',
      role: staffMember.role || '',
      licenseNumber: staffMember.licenseNumber || '',
      licenseType: staffMember.licenseType || '',
      licenseExpiryDate: toDateInputValue(staffMember.licenseExpiryDate || staffMember.licenseExpiry || ''),
      terminalAssignment: staffMember.terminalAssignment || '',
      emergencyContact: staffMember.emergencyContact || '',
      emergencyPhone: staffMember.emergencyPhone || '',
      address: staffMember.address || '',
      salary: staffMember.salary || '',
      hireDate: toDateInputValue(staffMember.hireDate || '')
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres desactivar este miembro del personal?')) {
      return;
    }

    try {
      await staffService.delete(id);
      toast.success('Personal desactivado exitosamente');
      const paramRole = filterRole === 'ALL' ? undefined : (filterRole === 'CHOFER' ? 'DRIVER' : filterRole);
      await loadAllStaff();
      await loadStaff({ role: paramRole });
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error('Error al desactivar el personal');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      cedula: '',
      role: '',
      licenseNumber: '',
      licenseType: '',
      licenseExpiryDate: '',
      terminalAssignment: '',
      emergencyContact: '',
      emergencyPhone: '',
      address: '',
      salary: '',
      hireDate: ''
    });
    setEditingStaff(null);
    setShowForm(false);
  };

  const getRoleBadgeColor = (role) => {
    const roleConfig = STAFF_ROLES.find(r => r.value === role);
    return roleConfig ? roleConfig.color : 'gray';
  };

  const getRoleLabel = (role) => {
    const roleConfig = STAFF_ROLES.find(r => r.value === role);
    return roleConfig ? roleConfig.label : role;
  };

  const isLicenseExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isLicenseExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.cedula?.includes(searchTerm);
    
    const matchesRole = filterRole === 'ALL' || member.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const staffByRole = {
    CHOFER: filteredStaff.filter(s => s.role === 'CHOFER'),
    OFICINISTA: filteredStaff.filter(s => s.role === 'OFICINISTA')
  };

  console.log('StaffManagement rendering, loading:', loading, 'staff count:', staff.length);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-4">Cargando personal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Personal</h1>
            <p className="text-gray-600 mt-1">Administrar choferes y oficinistas de la cooperativa</p>
          </div>

          <div className="flex items-center gap-4 w-full max-w-3xl justify-end">
            <div className="flex items-center gap-2 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, email o cédula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Button variant="outline" onClick={() => setSearchTerm('')} className="whitespace-nowrap">
                Limpiar
              </Button>
            </div>

            <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Agregar Personal
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`${filterRole === 'ALL' ? 'ring-2 ring-primary' : ''}`}>
          <CardContent
            className="p-6 cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => {
              const newRole = filterRole === 'ALL' ? 'ALL' : 'ALL';
              // toggle: if already ALL, reset to ALL (no-op), otherwise set ALL
              setFilterRole('ALL');
              setSearchTerm('');
              setActiveTab('all');
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') { setFilterRole('ALL'); setSearchTerm(''); setActiveTab('all'); } }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Personal</p>
                <p className="text-3xl font-bold">{allStaff.length}</p>
              </div>
              <Users className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={`${filterRole === 'CHOFER' ? 'ring-2 ring-primary' : ''}`}>
          <CardContent
            className="p-6 cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => {
              const newRole = filterRole === 'CHOFER' ? 'ALL' : 'CHOFER';
              setFilterRole(newRole);
              setSearchTerm('');
              setActiveTab(newRole === 'ALL' ? 'all' : 'CHOFER');
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') { const newRole = filterRole === 'CHOFER' ? 'ALL' : 'CHOFER'; setFilterRole(newRole); setSearchTerm(''); setActiveTab(newRole === 'ALL' ? 'all' : 'CHOFER'); } }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Choferes</p>
                <p className="text-3xl font-bold text-blue-600">
                  {allStaff.filter(s => s.role === 'CHOFER').length}
                </p>
              </div>
              <Users className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        { (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
          <Card className={`${filterRole === 'ADMIN' ? 'ring-2 ring-primary' : ''}`}>
            <CardContent
              className="p-6 cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() => {
                const newRole = filterRole === 'ADMIN' ? 'ALL' : 'ADMIN';
                setFilterRole(newRole);
                setSearchTerm('');
                setActiveTab(newRole === 'ALL' ? 'all' : 'ADMIN');
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') { const newRole = filterRole === 'ADMIN' ? 'ALL' : 'ADMIN'; setFilterRole(newRole); setSearchTerm(''); setActiveTab(newRole === 'ALL' ? 'all' : 'ADMIN'); } }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Admins</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {allStaff.filter(s => s.role === 'ADMIN').length}
                  </p>
                </div>
                <UserCog className="h-12 w-12 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        )}

        <Card className={`${filterRole === 'OFICINISTA' ? 'ring-2 ring-primary' : ''}`}>
          <CardContent
            className="p-6 cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => {
              const newRole = filterRole === 'OFICINISTA' ? 'ALL' : 'OFICINISTA';
              setFilterRole(newRole);
              setSearchTerm('');
              setActiveTab(newRole === 'ALL' ? 'all' : 'OFICINISTA');
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') { const newRole = filterRole === 'OFICINISTA' ? 'ALL' : 'OFICINISTA'; setFilterRole(newRole); setSearchTerm(''); setActiveTab(newRole === 'ALL' ? 'all' : 'OFICINISTA'); } }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Oficinistas</p>
                <p className="text-3xl font-bold text-green-600">
                  {allStaff.filter(s => s.role === 'OFICINISTA').length}
                </p>
              </div>
              <Briefcase className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* (Búsqueda y botón movidos al header) */}

      {/* Tabla única filtrada por tarjeta (sin pestañas) */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filterRole === 'ALL' ? 'Todo el Personal' : filterRole === 'CHOFER' ? 'Choferes' : 'Oficinistas'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Licencia</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {member.firstName} {member.lastName}
                      </div>
                      {member.email && (
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeColor(member.role)}>
                      {getRoleLabel(member.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.phone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {member.phone}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {member.cedula}
                    </code>
                  </TableCell>
                  <TableCell>
                    {member.role === 'CHOFER' && member.licenseNumber ? (
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          <span>{member.licenseType}</span>
                        </div>
                        {isLicenseExpired(member.licenseExpiryDate) && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Vencida
                          </Badge>
                        )}
                        {isLicenseExpiringSoon(member.licenseExpiryDate) && !isLicenseExpired(member.licenseExpiryDate) && (
                          <Badge variant="warning" className="text-xs mt-1">
                            Por vencer
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(member)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(member.id)}
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

          {filteredStaff.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No se encontró personal</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Formulario */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? 'Editar Personal' : 'Agregar Personal'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Información Personal</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nombres *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="Juan Carlos"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Apellidos *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Pérez García"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cedula">Cédula *</Label>
                  <Input
                    id="cedula"
                    value={formData.cedula}
                    onChange={(e) => setFormData({...formData, cedula: e.target.value})}
                    placeholder="1234567890"
                    maxLength={10}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Rol *</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => setFormData({...formData, role: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Contacto</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="juan.perez@ejemplo.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">
                    {editingStaff ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="********"
                    required={!editingStaff}
                    minLength={6}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="0987654321"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Calle Principal 123"
                  />
                </div>
              </div>
            </div>

            {/* Información Específica de Chofer */}
            {formData.role === 'CHOFER' && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900">Información de Licencia y Contrato (Chofer)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="licenseType">Tipo de Licencia *</Label>
                    <Select 
                      value={formData.licenseType} 
                      onValueChange={(value) => setFormData({...formData, licenseType: value})}
                      required={formData.role === 'CHOFER'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {LICENSE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            Tipo {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="licenseNumber">Número de Licencia *</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                      placeholder="EC-0012345678"
                      required={formData.role === 'CHOFER'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="licenseExpiryDate">Fecha de Vencimiento *</Label>
                    <Input
                      id="licenseExpiryDate"
                      type="date"
                      value={formData.licenseExpiryDate}
                      onChange={(e) => setFormData({...formData, licenseExpiryDate: e.target.value})}
                      required={formData.role === 'CHOFER'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="salary">Salario Mensual (USD) *</Label>
                    <Input
                      id="salary"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.salary}
                      onChange={(e) => setFormData({...formData, salary: e.target.value})}
                      placeholder="800.00"
                      required={formData.role === 'CHOFER'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hireDate">Fecha de Contratación *</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={formData.hireDate}
                      onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                      required={formData.role === 'CHOFER'}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Información Específica de Oficinista */}
            {formData.role === 'OFICINISTA' && (
              <div className="space-y-4 p-4 bg-green-50 rounded-lg">
                <h3 className="text-sm font-medium text-green-900">Información Adicional (Oficinista)</h3>
                
                <div>
                  <Label htmlFor="terminalAssignment">Terminal Asignado</Label>
                  <Input
                    id="terminalAssignment"
                    value={formData.terminalAssignment}
                    onChange={(e) => setFormData({...formData, terminalAssignment: e.target.value})}
                    placeholder="Terminal Quitumbe"
                  />
                </div>
              </div>
            )}

            {/* Contacto de Emergencia */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Contacto de Emergencia</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContact">Nombre del Contacto</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                    placeholder="María Pérez"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Teléfono de Emergencia</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                    placeholder="0987654321"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingStaff ? 'Actualizar' : 'Crear'} Personal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}