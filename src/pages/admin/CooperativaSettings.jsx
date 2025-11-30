import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { Upload, Save, Loader2 } from 'lucide-react';

export default function CooperativaSettings() {
  const { user, refreshCooperativa } = useAuth();
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
    facebook: '',
    twitter: '',
    instagram: '',
    whatsapp: ''
  });

  useEffect(() => {
    loadCooperativa();
  }, []);

  const loadCooperativa = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/cooperativas/${user.cooperativaId}`);
      const coop = response.data.data;

      setCooperativa(coop);

      setFormData({
        name: coop.nombre || '',
        email: coop.email || '',
        // support both shapes and both languages: top-level phone/telefono or contacto.{telefono,direccion}
        phone: coop.phone || coop.telefono || coop.contacto?.telefono || '',
        address: coop.address || coop.direccion || coop.contacto?.direccion || '',
        logo: coop.config?.logo || '',
        primaryColor: coop.config?.primaryColor || '#1a56db',
        secondaryColor: coop.config?.secondaryColor || '#0e7490',
        facebook: coop.config?.facebook || '',
        twitter: coop.config?.twitter || '',
        instagram: coop.config?.instagram || '',
        whatsapp: coop.config?.whatsapp || ''
      });

      if (coop.config?.logo) {
        setLogoPreview(coop.config.logo);
      }
    } catch (error) {
      console.error('Error al cargar cooperativa:', error);
      alert('Error al cargar la configuración');
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
    if (file.size > 2 * 1024 * 1024) {
      alert('El logo no debe superar los 2MB');
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
        // keep top-level fields from existing cooperativa
        ...cooperativa,
        // apply editable top-level changes
        nombre: formData.name || cooperativa.nombre,
        email: cooperativa.email || formData.email || undefined,

        contacto: {
          ...(cooperativa.contacto || {}),
          telefono: formData.phone || cooperativa.contacto?.telefono || cooperativa.telefono,
          direccion: formData.address || cooperativa.contacto?.direccion || cooperativa.direccion
        },
        // also set top-level telefono/direccion and english keys so update works for APIs expecting either
        telefono: formData.phone || cooperativa.telefono,
        direccion: formData.address || cooperativa.direccion,
        phone: formData.phone || cooperativa.phone || cooperativa.telefono,
        address: formData.address || cooperativa.address || cooperativa.direccion,
        // merge config fully so we don't accidentally remove keys
        config: {
          ...(cooperativa.config || {}),
          logo: formData.logo || cooperativa.config?.logo,
          primaryColor: formData.primaryColor || cooperativa.config?.primaryColor,
          secondaryColor: formData.secondaryColor || cooperativa.config?.secondaryColor,
          facebook: formData.facebook !== undefined ? formData.facebook : cooperativa.config?.facebook,
          twitter: formData.twitter !== undefined ? formData.twitter : cooperativa.config?.twitter,
          instagram: formData.instagram !== undefined ? formData.instagram : cooperativa.config?.instagram,
          whatsapp: formData.whatsapp !== undefined ? formData.whatsapp : cooperativa.config?.whatsapp
        }
      };

      // Optionally remove fields that should not be sent (like audit fields)
      // Build final payload with only allowed fields for update
      const payload = {
        nombre: merged.nombre,
        email: merged.email,
        contacto: merged.contacto,
        // include both english and spanish top-level keys to match backend expectations
        phone: merged.phone,
        address: merged.address,
        telefono: merged.telefono,
        direccion: merged.direccion,
        config: merged.config
      };

      await api.put(`/cooperativas/${user.cooperativaId}`, payload);
      
      alert('Configuración actualizada exitosamente');
      // refrescar cooperativa en el contexto global
      if (typeof refreshCooperativa === 'function') {
        await refreshCooperativa();
      }
      loadCooperativa();
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      alert('Error al guardar la configuración');
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
                  <div className="text-xs text-gray-500 mt-2">PNG o JPG (máx. 2MB). Recomendado 400x400px</div>
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

        {/* Redes Sociales */}
        <Card>
          <CardHeader>
            <CardTitle>Redes Sociales</CardTitle>
            <CardDescription>
              Enlaces a las redes sociales de tu cooperativa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  type="url"
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                  placeholder="https://facebook.com/tu-cooperativa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  type="url"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="https://instagram.com/tu-cooperativa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter / X</Label>
                <Input
                  id="twitter"
                  type="url"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  placeholder="https://twitter.com/tu-cooperativa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="+593 99 999 9999"
                />
              </div>
            </div>
          </CardContent>
        </Card>

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
