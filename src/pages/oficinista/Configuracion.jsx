import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { cooperativaService } from '@/services';
import { Upload, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Configuracion() {
  const { user, refreshCooperativa, cooperativa: activeCooperativa } = useAuth();
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
  }, [user, activeCooperativa]);

  const loadCooperativa = async () => {
    try {
      setLoading(true);
      const coopId = user?.cooperativaId || activeCooperativa?.id || activeCooperativa?._id;
      
      if (!coopId) {
        throw new Error('No se encontró cooperativa asociada');
      }

      const response = await cooperativaService.getById(coopId);
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
    const file = e.dataTransfer.files[0];
    uploadFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (!cooperativa) {
        throw new Error('Cooperativa no cargada');
      }

      const coopId = cooperativa?.id || cooperativa?._id;
      if (!coopId) {
        toast.error('No se encontró cooperativa para actualizar');
        setSaving(false);
        return;
      }

      // Usar EXACTAMENTE la misma estructura que admin
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

      console.log('💾 Guardando configuración:');
      console.log('  - config.logo:', payload.config.logo ? `${payload.config.logo.substring(0, 50)}... (${payload.config.logo.length} caracteres)` : 'null');
      console.log('  - config.primaryColor:', payload.config.primaryColor);
      console.log('  - config.secondaryColor:', payload.config.secondaryColor);

      const response = await cooperativaService.update(coopId, payload);
      console.log('✅ Respuesta del servidor:', response.data);
      console.log('📊 Status de respuesta:', response.status);
      
      toast.success('Configuración actualizada exitosamente');
      
      console.log('🔄 Refrescando cooperativa en contexto...');
      await refreshCooperativa();
      
      console.log('🔄 Recargando datos locales...');
      await loadCooperativa();
      
      console.log('✅ Actualización completa');
    } catch (error) {
      console.error('❌ Error completo:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      console.error('❌ Error message:', error.response?.data?.message || error.message);
      toast.error(error.response?.data?.message || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuración de Cooperativa</h1>
          <p className="text-gray-600 mt-2">Personaliza la identidad visual de {cooperativa?.nombre || 'tu cooperativa'}</p>
        </div>

        <div className="space-y-6">
          {/* Información de la Cooperativa */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Cooperativa</CardTitle>
              <CardDescription>Nombre, correo de contacto (no editable), teléfono y dirección</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Nombre</Label>
                  <Input value={formData.name} disabled className="bg-gray-100" />
                </div>
                <div>
                  <Label>Email (no editable)</Label>
                  <Input value={formData.email} disabled className="bg-gray-100" />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="0999999999"
                  />
                </div>
                <div>
                  <Label>Dirección</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Dirección de la cooperativa"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Identidad Visual */}
          <Card>
            <CardHeader>
              <CardTitle>Identidad Visual</CardTitle>
              <CardDescription>Define el logo y los colores principales de tu cooperativa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div>
                <Label className="mb-3 block">Logo de la Cooperativa</Label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer bg-white"
                >
                  {logoPreview ? (
                    <div className="space-y-4">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="max-h-40 mx-auto object-contain"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('logo-upload').click()}
                        type="button"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Cambiar Logo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="h-12 w-12 mx-auto text-gray-400" />
                      <div>
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('logo-upload').click()}
                          type="button"
                        >
                          Seleccionar Archivo
                        </Button>
                        <p className="text-sm text-gray-500 mt-2">o arrastra y suelta aquí</p>
                      </div>
                    </div>
                  )}
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-3">PNG o JPG (máx. 10MB). Recomendado 400x400px</p>
                </div>
              </div>

              {/* Colores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="mb-3 block">Color Primario</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      className="h-12 w-20 rounded border cursor-pointer"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                  <div className="mt-3 h-16 rounded-lg" style={{ backgroundColor: formData.primaryColor }}></div>
                </div>

                <div>
                  <Label className="mb-3 block">Color Secundario</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                      className="h-12 w-20 rounded border cursor-pointer"
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                  <div className="mt-3 h-16 rounded-lg" style={{ backgroundColor: formData.secondaryColor }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botón Guardar */}
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg" className="min-w-[200px]">
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Guardar Configuración
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
