import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { operationService } from '@/services';
import toast from 'react-hot-toast';
import { DollarSign, Upload, X, Camera } from 'lucide-react';

export default function ExpenseForm({ tripId, onSuccess }) {
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    amount: '',
    receipt: null
  });
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const expenseTypes = [
    { value: 'FUEL', label: 'Combustible' },
    { value: 'TOLL', label: 'Peaje' },
    { value: 'MAINTENANCE', label: 'Mantenimiento' },
    { value: 'FOOD', label: 'Alimentación' },
    { value: 'OTHER', label: 'Otro' }
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo debe ser menor a 5MB');
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error('Solo se permiten imágenes o PDF');
        return;
      }

      setFormData(prev => ({ ...prev, receipt: file }));
      
      // Crear preview para imágenes
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, receipt: null }));
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.type || !formData.description || !formData.amount) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      await operationService.createExpense({
        tripId,
        type: formData.type,
        description: formData.description,
        amount: parseFloat(formData.amount),
        receipt: formData.receipt
      });

      toast.success('Gasto registrado exitosamente');
      
      // Reset form
      setFormData({
        type: '',
        description: '',
        amount: '',
        receipt: null
      });
      setPreviewUrl(null);

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error al registrar gasto:', error);
      toast.error(
        error.response?.data?.message || 
        'Error al registrar el gasto'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Registrar Gasto
        </CardTitle>
        <CardDescription>
          Registra los gastos del viaje con su comprobante
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de gasto */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Gasto *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de gasto" />
              </SelectTrigger>
              <SelectContent>
                {expenseTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Input
              id="description"
              type="text"
              placeholder="Ej: Gasolina Super - Estación XYZ"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              maxLength={200}
            />
            <p className="text-xs text-gray-500">
              {formData.description.length}/200 caracteres
            </p>
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto (USD) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          {/* Comprobante */}
          <div className="space-y-2">
            <Label htmlFor="receipt">Comprobante (Opcional)</Label>
            {!formData.receipt ? (
              <div>
                <input
                  id="receipt"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById('receipt').click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Comprobante
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  Formatos: JPG, PNG, PDF. Máximo 5MB
                </p>
              </div>
            ) : (
              <div className="border rounded-lg p-4">
                {previewUrl ? (
                  <div className="space-y-2">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-48 object-contain rounded"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 truncate">
                        {formData.receipt.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Upload className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600 truncate">
                        {formData.receipt.name}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botón Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrar Gasto'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
