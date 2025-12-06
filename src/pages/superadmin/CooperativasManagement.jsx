import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Building2,
  Phone,
  Mail,
  MapPin,
  Search,
  Settings,
  AlertCircle,
  CheckCircle2,
  Palette
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cooperativaService } from '@/services';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

/**
 * CooperativasManagement - Gestión completa de cooperativas para SUPER_ADMIN
 * 
 * ENDPOINTS DISPONIBLES (todos bajo /api/cooperativas):
 * =====================================================
 * 
 * GET /api/cooperativas
 * - Autenticación: Requerida (Bearer token)
 * - Roles: SUPER_ADMIN lista todas; otros roles solo su cooperativa
 * - Respuesta: { success: true, data: Cooperativa[] }
 * 
 * GET /api/cooperativas/:id
 * - Autenticación: Requerida
 * - Roles: SUPER_ADMIN puede ver cualquiera; otros solo la suya
 * - Respuesta: { success: true, data: Cooperativa }
 * 
 * POST /api/cooperativas
 * - Autenticación: Requerida
 * - Roles: Solo SUPER_ADMIN
 * - Body: { nombre, ruc, email, phone?, address?, config? }
 * - Respuesta: { success: true, data: Cooperativa }
 * 
 * PUT /api/cooperativas/:id
 * - Autenticación: Requerida
 * - Roles: ADMIN (solo su cooperativa) o SUPER_ADMIN (cualquiera)
 * - Body: Mismo que POST
 * - Respuesta: { success: true, data: Cooperativa }
 * 
 * DELETE /api/cooperativas/:id
 * - Autenticación: Requerida
 * - Roles: Solo SUPER_ADMIN
 * - Respuesta: { success: true, message: "..." }
 * 
 * VALIDACIONES (Zod Schema - cooperativaSchema):
 * ==============================================
 * - nombre: string, mínimo 3 caracteres (REQUERIDO)
 * - ruc: string, exactamente 13 caracteres (REQUERIDO)
 * - email: email válido formato RFC (REQUERIDO)
 * - phone: string opcional
 * - address: string opcional
 * - config: objeto opcional { logo?: string, primaryColor?: string, secondaryColor?: string }
 * 
 * RESPUESTAS DE ERROR:
 * ===================
 * - 400: Validación fallida (Zod) - { success: false, error: "...", errors: [...] }
 * - 401: No autenticado - { success: false, error: "Token inválido" }
 * - 403: Sin permisos - { success: false, error: "No autorizado" }
 * - 404: Cooperativa no encontrada - { success: false, error: "..." }
 * - 500: Error interno - { success: false, error: "..." }
 * 
 * EJEMPLO PAYLOAD (crear/actualizar):
 * ===================================
 * {
 *   "nombre": "Cooperativa Trans Esmeraldas",
 *   "ruc": "1234567890001",
 *   "email": "contacto@transesmeraldas.com",
 *   "phone": "02-2345678",
 *   "address": "Av. Principal #123, Quito",
 *   "config": {
 *     "logo": "https://ejemplo.com/logo.png",
 *     "primaryColor": "#3B82F6",
 *     "secondaryColor": "#10B981"
 *   }
 * }
 * 
 * EJEMPLO CURL:
 * =============
 * # Listar todas las cooperativas (SUPER_ADMIN)
 * curl -X GET http://localhost:3000/api/cooperativas \
 *   -H "Authorization: Bearer <TOKEN>"
 * 
 * # Crear cooperativa
 * curl -X POST http://localhost:3000/api/cooperativas \
 *   -H "Authorization: Bearer <TOKEN>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"nombre":"Cooperativa Test","ruc":"1234567890001","email":"test@test.com"}'
 * 
 * SEGURIDAD Y MEJORES PRÁCTICAS:
 * ==============================
 * - Siempre validar permisos antes de operaciones críticas (DELETE)
 * - Eliminar una cooperativa es cascada: borra buses, rutas, viajes, etc.
 * - Confirmar con el usuario antes de eliminar (dialog de confirmación)
 * - Logs de auditoría recomendados en backend para CREATE/UPDATE/DELETE
 * - Sanitizar inputs (XSS) aunque Zod ya valida formato
 * - Rate limiting recomendado para operaciones masivas
 */

/**
 * CooperativasManagement - Gestión completa de cooperativas para SUPER_ADMIN
 * 
 * Endpoints utilizados (todos bajo /api/cooperativas):
 * - GET /api/cooperativas - Lista todas (SUPER_ADMIN) o solo la propia (otros roles)
 * - GET /api/cooperativas/:id - Obtiene detalles de una cooperativa
 * - POST /api/cooperativas - Crea cooperativa (solo SUPER_ADMIN)
 * - PUT /api/cooperativas/:id - Actualiza cooperativa (ADMIN o SUPER_ADMIN)
 * - DELETE /api/cooperativas/:id - Elimina cooperativa (solo SUPER_ADMIN)
 * 
 * Validaciones del backend (cooperativaSchema):
 * - nombre: string, min 3 caracteres (requerido)
 * - ruc: string, exactamente 13 caracteres (requerido)
 * - email: email válido (requerido)
 * - phone: string opcional
 * - address: string opcional
 * - config: objeto opcional { logo, primaryColor, secondaryColor }
 */
export default function CooperativasManagement() {
  const { selectCooperativa, cooperativa: activeCooperativa, user } = useAuth();
  const [cooperativas, setCooperativas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCooperativa, setEditingCooperativa] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    nombre: '',
    ruc: '',
    address: '',
    phone: '',
    email: '',
    isActive: true,
    config: {
      logo: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981'
    }
  });
  const [logoPreview, setLogoPreview] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Estadísticas calculadas
  const stats = {
    total: cooperativas.length,
    activas: cooperativas.filter(c => c.isActive !== false).length,
    inactivas: cooperativas.filter(c => c.isActive === false).length,
    suspendidas: 0 // No hay estado suspendido en el modelo actual
  };

  useEffect(() => {
    loadCooperativas();
  }, []);

  /**
   * Carga todas las cooperativas desde el backend
   * GET /api/cooperativas - SUPER_ADMIN lista todas
   */
  const loadCooperativas = async () => {
    try {
      setLoading(true);
      const response = await cooperativaService.getAll();
      const data = response.data?.data || response.data || [];
      setCooperativas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading cooperativas:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Error al cargar cooperativas';
      toast.error(message);
      setCooperativas([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el envío del formulario (crear o actualizar)
   * POST /api/cooperativas - Crear (SUPER_ADMIN)
   * PUT /api/cooperativas/:id - Actualizar (ADMIN o SUPER_ADMIN)
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors([]);
    
    // Validación local antes de enviar al backend
    const errors = cooperativaService.validatePayload(formData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      errors.forEach(err => toast.error(err));
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Normalizar payload según schema del backend
      const payload = {
        nombre: formData.nombre.trim(),
        ruc: formData.ruc.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        isActive: formData.isActive !== false,
        config: {
          logo: formData.config?.logo || '',
          primaryColor: formData.config?.primaryColor || '#3B82F6',
          secondaryColor: formData.config?.secondaryColor || '#10B981'
        }
      };
      
      if (editingCooperativa) {
        // PUT /api/cooperativas/:id
        await cooperativaService.update(editingCooperativa.id, payload);
        toast.success('Cooperativa actualizada exitosamente');
      } else {
        // POST /api/cooperativas
        await cooperativaService.create(payload);
        toast.success('Cooperativa creada exitosamente');
      }
      
      resetForm();
      loadCooperativas();
    } catch (error) {
      console.error('Error saving cooperativa:', error);
      const message = error.response?.data?.message || 
                     error.response?.data?.error ||
                     error.response?.data?.errors?.[0]?.message ||
                     'Error al guardar cooperativa';
      
      // Mostrar errores de validación del backend (Zod)
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const backendErrors = error.response.data.errors.map(e => e.message);
        setValidationErrors(backendErrors);
        backendErrors.forEach(err => toast.error(err));
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cooperativa) => {
    setEditingCooperativa(cooperativa);
    setFormData({
      nombre: cooperativa.nombre || '',
      ruc: cooperativa.ruc || '',
      email: cooperativa.email || '',
      phone: cooperativa.phone || '',
      address: cooperativa.address || '',
      isActive: cooperativa.isActive !== false,
      config: {
        logo: cooperativa.config?.logo || '',
        primaryColor: cooperativa.config?.primaryColor || '#3B82F6',
        secondaryColor: cooperativa.config?.secondaryColor || '#10B981'
      }
    });
    setLogoPreview(cooperativa.config?.logo || '');
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('⚠️ ¿Estás seguro de eliminar esta cooperativa?\n\nEsta acción eliminará todos los datos relacionados (buses, rutas, viajes, etc.) y NO se puede deshacer.')) {
      return;
    }

    try {
      await cooperativaService.delete(id);
      toast.success('Cooperativa eliminada exitosamente');
      loadCooperativas();
    } catch (error) {
      console.error('Error deleting cooperativa:', error);
      const msg = error.response?.data?.message || error.response?.data?.error || 'Error al eliminar cooperativa';
      toast.error(msg);
    }
  };

  const handleActivate = async (id) => {
    if (!window.confirm('¿Estás seguro de activar esta cooperativa?')) {
      return;
    }

    try {
      await cooperativaService.activate(id);
      toast.success('Cooperativa activada exitosamente');
      loadCooperativas();
    } catch (error) {
      console.error('Error activating cooperativa:', error);
      const msg = error.response?.data?.message || error.response?.data?.error || 'Error al activar cooperativa';
      toast.error(msg);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      ruc: '',
      email: '',
      phone: '',
      address: '',
      isActive: true,
      config: {
        logo: '',
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981'
      }
    });
    setLogoPreview('');
    setEditingCooperativa(null);
    setShowForm(false);
  };

  const filteredCooperativas = cooperativas.filter(coop => {
    const matchesSearch = (coop.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (coop.ruc || '').includes(searchTerm) ||
                         (coop.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
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
      {/* Banner de cooperativa activa */}
      {activeCooperativa && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Trabajando como: <span className="font-bold">{activeCooperativa.nombre}</span>
                  </p>
                  <p className="text-xs text-blue-700">
                    Las páginas de gestión (buses, rutas, etc.) mostrarán datos de esta cooperativa
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = `/admin/cooperativa-settings?cooperativaId=${activeCooperativa.id}`}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Configurar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex justify-between items-start border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Gestión de Cooperativas
          </h1>
          <p className="text-gray-600 mt-1">Administración completa de cooperativas de transporte</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2" size="lg">
          <Plus className="h-5 w-5" />
          Nueva Cooperativa
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Activas</p>
                <p className="text-2xl font-bold text-green-600">{stats.activas}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactivas</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inactivas}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-gray-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Suspendidas</p>
                <p className="text-2xl font-bold text-red-600">{stats.suspendidas}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nombre, RUC o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
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
                          {cooperativa.address || 'Dirección no especificada'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {cooperativa.ruc}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {cooperativa.email}
                        </div>
                        {cooperativa.phone && (
                          <div className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {cooperativa.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={cooperativa.isActive !== false ? 'default' : 'destructive'}
                      >
                        {cooperativa.isActive !== false ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(cooperativa)}
                          title="Editar cooperativa"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = `/admin/cooperativa-settings?cooperativaId=${cooperativa.id}`}
                          title="Configurar colores y logo"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        {user?.role === 'SUPER_ADMIN' && (
                          <Button
                            size="sm"
                            variant={activeCooperativa?.id === cooperativa.id ? 'default' : 'ghost'}
                            onClick={async () => {
                              try {
                                await selectCooperativa(cooperativa.id || cooperativa._id);
                                toast.success(`✓ Ahora trabajando como: ${cooperativa.nombre}`);
                              } catch (e) {
                                console.error('Error seleccionando cooperativa:', e);
                                toast.error('No se pudo seleccionar la cooperativa');
                              }
                            }}
                            title="Trabajar en contexto de esta cooperativa"
                          >
                            {activeCooperativa?.id === cooperativa.id ? '✓ Activa' : 'Trabajar como'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(cooperativa.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Eliminar cooperativa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {cooperativa.isActive === false && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleActivate(cooperativa.id)}
                            className="text-green-600 hover:text-green-700"
                            title="Activar cooperativa"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
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
            {validationErrors.length > 0 && (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900 text-sm">Errores de validación:</p>
                      <ul className="list-disc list-inside text-sm text-red-700 mt-1">
                        {validationErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre de la Cooperativa *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej: Cooperativa Trans Esmeraldas"
                  required
                  minLength={3}
                />
                <p className="text-xs text-gray-500 mt-1">Mínimo 3 caracteres</p>
              </div>

              <div>
                <Label htmlFor="ruc">RUC * (13 dígitos)</Label>
                <Input
                  id="ruc"
                  value={formData.ruc}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 13);
                    setFormData({...formData, ruc: val});
                  }}
                  placeholder="1234567890001"
                  required
                  maxLength={13}
                />
                <p className="text-xs text-gray-500 mt-1">Exactamente 13 dígitos</p>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="contacto@cooperativa.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="02-1234567 o 0991234567"
                />
              </div>

              <div>
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Dirección completa de la cooperativa"
                />
              </div>

              <div className="border-t pt-4 space-y-3">
                <h3 className="font-medium text-sm">Personalización (Opcional)</h3>
                
                {/* Upload de Logo */}
                <div>
                  <Label htmlFor="logoUpload">Logo de la Cooperativa</Label>
                  <div className="space-y-2">
                    <Input
                      id="logoUpload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error('El logo no debe superar los 10MB');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64String = reader.result;
                            setFormData({...formData, config: {...formData.config, logo: base64String}});
                            setLogoPreview(base64String);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="cursor-pointer"
                    />
                    {logoPreview && (
                      <div className="flex items-center gap-3 p-3 border rounded bg-gray-50">
                        <img 
                          src={logoPreview} 
                          alt="Preview" 
                          className="h-16 w-16 object-contain rounded"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setLogoPreview('');
                            setFormData({...formData, config: {...formData.config, logo: ''}});
                          }}
                        >
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="primaryColor">Color Primario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.config.primaryColor}
                      onChange={(e) => setFormData({...formData, config: {...formData.config, primaryColor: e.target.value}})}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.config.primaryColor}
                      onChange={(e) => setFormData({...formData, config: {...formData.config, primaryColor: e.target.value}})}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondaryColor">Color Secundario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.config.secondaryColor}
                      onChange={(e) => setFormData({...formData, config: {...formData.config, secondaryColor: e.target.value}})}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.config.secondaryColor}
                      onChange={(e) => setFormData({...formData, config: {...formData.config, secondaryColor: e.target.value}})}
                      placeholder="#10B981"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Toggle para activar/desactivar cooperativa */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isActive">Estado de la Cooperativa</Label>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.isActive ? 'La cooperativa está activa y puede operar' : 'La cooperativa está desactivada'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ms-3 text-sm font-medium text-gray-900">
                      {formData.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>{editingCooperativa ? 'Actualizar' : 'Crear'} Cooperativa</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}