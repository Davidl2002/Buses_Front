import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import api from '@/services/api';
import { Upload, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CooperativaSettings() {
  const { user, refreshCooperativa, cooperativa: activeCooperativa } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cooperativa, setCooperativa] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [formData, setFormData] = useState({
    logo: '',
    primaryColor: '#1a56db',
    secondaryColor: '#0e7490',
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    loadCooperativa();
  }, [user, activeCooperativa, location.search]);

  const resolveCooperativaId = () => {
    let coopId = activeCooperativa?.id || activeCooperativa?._id || null;
    if (!coopId) {
      const params = new URLSearchParams(location.search);
      coopId = params.get('cooperativaId') || null;
    }
    if (!coopId && user?.cooperativaId) coopId = user.cooperativaId;
    if (!coopId) coopId = localStorage.getItem('activeCooperativaId') || null;
    return coopId;
  };

  const loadCooperativa = async () => {
    try {
      setLoading(true);
      const coopId = resolveCooperativaId();
      if (!coopId) {
        throw new Error('No se encontró cooperativa seleccionada');
      }

      const response = await api.get(`/cooperativas/${coopId}`);
      const coop = response.data.data;

      setCooperativa(coop);

      setFormData({
        name: coop.nombre || '',
        email: coop.email || '',
        phone: coop.phone || coop.telefono || coop.contacto?.telefono || '',
        address: coop.address || coop.direccion || coop.contacto?.direccion || '',
        logo: coop.config?.logo || '',
        primaryColor: coop.config?.primaryColor || '#1a56db',
        secondaryColor: coop.config?.secondaryColor || '#0e7490',
      });

      if (coop.config?.logo) {
        setLogoPreview(coop.config.logo);
      }
    } catch (error) {
      console.error('Error al cargar cooperativa:', error);
      toast.error(error.response?.data?.message || error.message || 'Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e?.target?.files?.[0];
    uploadFile(file);
  };

  const uploadFile = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El logo no debe superar los 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setFormData((prev) => ({ ...prev, logo: base64String }));
      setLogoPreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    uploadFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      if (!cooperativa) {
        throw new Error('Cooperativa no cargada');
      }

      const merged = {
        ...cooperativa,
        nombre: formData.name || cooperativa.nombre,
        email: cooperativa.email || formData.email || undefined,

        contacto: {
          ...(cooperativa.contacto || {}),
          telefono: formData.phone || cooperativa.contacto?.telefono || cooperativa.telefono,
          direccion: formData.address || cooperativa.contacto?.direccion || cooperativa.direccion
        },
        telefono: formData.phone || cooperativa.telefono,
        direccion: formData.address || cooperativa.direccion,
        phone: formData.phone || cooperativa.phone || cooperativa.telefono,
        address: formData.address || cooperativa.address || cooperativa.direccion,

        config: {
          ...(cooperativa.config || {}),
          logo: formData.logo || cooperativa.config?.logo,
          primaryColor: formData.primaryColor || cooperativa.config?.primaryColor,
          secondaryColor: formData.secondaryColor || cooperativa.config?.secondaryColor,
        }
      };

      const payload = {
        nombre: merged.nombre,
        email: merged.email,
        contacto: merged.contacto,
        phone: merged.phone,
        address: merged.address,
        telefono: merged.telefono,
        direccion: merged.direccion,
        config: merged.config
      };

      const coopId = resolveCooperativaId();
      if (!coopId) throw new Error('No se encontró cooperativa seleccionada');
      await api.put(`/cooperativas/${coopId}`, payload);
      
      // refrescar cooperativa en el contexto global para aplicar cambios inmediatamente
      if (typeof refreshCooperativa === 'function') {
        await refreshCooperativa();
      }
      
      toast.success('Configuración actualizada exitosamente. Los cambios se aplicarán en toda la plataforma.', {
        duration: 4000,
      });
      
      loadCooperativa();
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast.error(error.response?.data?.message || error.message || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración de Cooperativa</h1>
        <p className="text-gray-600 mt-1">
          Personaliza la identidad visual de {cooperativa?.nombre}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos básicos de la cooperativa */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Cooperativa</CardTitle>
            <CardDescription>Nombre, correo de contacto (no editable), teléfono y dirección</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (no editable)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Logo y Colores */}
        <Card>
          <CardHeader>
            <CardTitle>Identidad Visual</CardTitle>
            <CardDescription>
              Define el logo y los colores principales de tu cooperativa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-4">
              <Label htmlFor="logo">Logo de la Cooperativa</Label>
              
              <div className="flex flex-col items-center gap-4">
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="w-40 h-40 rounded-md overflow-hidden bg-white shadow flex items-center justify-center"
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                      <Upload className="w-8 h-8 mb-1" />
                      <span className="text-sm text-gray-500">Sin logo</span>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <input
                    type="file"
                    id="logo"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="logo"
                    className="inline-flex items-center gap-2 px-3 py-2 border border-dashed rounded-md text-sm text-gray-600 cursor-pointer hover:border-primary"
                  >
                    <Upload className="w-4 h-4 text-gray-500" />
                    Arrastra o sube
                  </label>
                  <div className="text-xs text-gray-500 mt-2">PNG o JPG (máx. 10MB). Recomendado 400x400px</div>
                </div>
              </div>
            </div>

            {/* Colores */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Color Primario</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="primaryColor"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-20 h-10 rounded cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    placeholder="#1a56db"
                    className="flex-1"
                  />
                </div>
                <div 
                  className="w-full h-12 rounded border"
                  style={{ backgroundColor: formData.primaryColor }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Color Secundario</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="w-20 h-10 rounded cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    placeholder="#0e7490"
                    className="flex-1"
                  />
                </div>
                <div 
                  className="w-full h-12 rounded border"
                  style={{ backgroundColor: formData.secondaryColor }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Redes Sociales removidas en configuración */}

        {/* Botón Guardar */}
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Configuración
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
