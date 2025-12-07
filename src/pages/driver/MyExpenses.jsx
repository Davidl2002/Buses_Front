import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { operationService, API_BASE_URL } from '@/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { 
  DollarSign, Calendar, Clock, FileText, Edit2, Trash2, 
  Upload, X, Search, Filter, TrendingUp, Receipt
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MyExpenses() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Estados para edición
  const [editingExpense, setEditingExpense] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    type: '',
    description: '',
    amount: '',
    receipt: null
  });
  const [editLoading, setEditLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const expenseTypes = [
    { value: 'FUEL', label: 'Combustible', color: 'bg-red-100 text-red-800' },
    { value: 'TOLL', label: 'Peaje', color: 'bg-blue-100 text-blue-800' },
    { value: 'MAINTENANCE', label: 'Mantenimiento', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'FOOD', label: 'Alimentación', color: 'bg-green-100 text-green-800' },
    { value: 'OTHER', label: 'Otro', color: 'bg-gray-100 text-gray-800' }
  ];

  useEffect(() => {
    loadMyExpenses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [expenses, searchTerm, filterType]);

  const loadMyExpenses = async () => {
    try {
      setLoading(true);
      const response = await operationService.getMyExpenses();
      const data = response.data.data || response.data;
      
      setExpenses(data.expenses || []);
      setTotalAmount(data.total || 0);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast.error('Error al cargar los gastos');
      setExpenses([]);
      setTotalAmount(0);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...expenses];

    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(exp => exp.type === filterType);
    }

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(exp => 
        exp.description?.toLowerCase().includes(search) ||
        exp.type?.toLowerCase().includes(search) ||
        exp.trip?.route?.toLowerCase().includes(search) ||
        exp.trip?.bus?.toLowerCase().includes(search)
      );
    }

    setFilteredExpenses(filtered);
  };

  const getTypeConfig = (type) => {
    return expenseTypes.find(t => t.value === type) || expenseTypes[4];
  };

  const handleEditClick = (expense) => {
    setEditingExpense(expense);
    setEditFormData({
      type: expense.type,
      description: expense.description,
      amount: expense.amount.toString(),
      receipt: null
    });
    setPreviewUrl(null);
    setShowEditDialog(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo debe ser menor a 5MB');
        return;
      }

      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error('Solo se permiten imágenes o PDF');
        return;
      }

      setEditFormData(prev => ({ ...prev, receipt: file }));
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setEditFormData(prev => ({ ...prev, receipt: null }));
    setPreviewUrl(null);
  };

  const handleUpdateExpense = async () => {
    if (!editFormData.description || !editFormData.amount || !editFormData.type) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (parseFloat(editFormData.amount) <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    setEditLoading(true);
    try {
      await operationService.updateExpense(editingExpense.id, {
        type: editFormData.type,
        description: editFormData.description,
        amount: parseFloat(editFormData.amount),
        receipt: editFormData.receipt
      });

      toast.success('Gasto actualizado exitosamente');
      setShowEditDialog(false);
      setEditingExpense(null);
      loadMyExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar el gasto');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    const confirmation = confirm('¿Estás seguro de eliminar este gasto? Esta acción no se puede deshacer.');
    
    if (!confirmation) return;

    try {
      await operationService.deleteExpense(expenseId);
      toast.success('Gasto eliminado exitosamente');
      loadMyExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar el gasto');
    }
  };

  const handleViewTrip = (tripId) => {
    navigate(`/driver/trips/${tripId}`);
  };

  const handleViewReceipt = async (expenseId) => {
    try {
      const response = await operationService.getExpenseReceipt(expenseId);
      const receiptPath = response.data.data.receipt;
      
      if (receiptPath) {
        const imageUrl = `${API_BASE_URL}${receiptPath}`;
        window.open(imageUrl, '_blank');
      } else {
        toast.error('No hay comprobante disponible');
      }
    } catch (error) {
      console.error('Error loading receipt:', error);
      toast.error(error.response?.data?.message || 'Error al cargar el comprobante');
    }
  };

  const calculateFilteredTotal = () => {
    return filteredExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando gastos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Mis Gastos</h1>
        <p className="text-muted-foreground">
          Gestiona todos los gastos registrados en tus viajes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total General</p>
                <p className="text-3xl font-bold">${totalAmount.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Gastos Totales</p>
                <p className="text-3xl font-bold">{expenses.length}</p>
              </div>
              <Receipt className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Filtrados</p>
                <p className="text-3xl font-bold">${calculateFilteredTotal().toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por descripción, tipo, ruta, bus..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por tipo */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {expenseTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No hay gastos</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterType !== 'all'
                ? 'No se encontraron gastos con los filtros aplicados'
                : 'Aún no has registrado gastos en tus viajes'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredExpenses.map((expense) => {
            const typeConfig = getTypeConfig(expense.type);
            return (
              <Card key={expense.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={typeConfig.color}>
                          {typeConfig.label}
                        </Badge>
                        <span className="text-2xl font-bold">${parseFloat(expense.amount).toFixed(2)}</span>
                      </div>
                      
                      <p className="text-lg font-medium mb-3">{expense.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                        {expense.trip && (
                          <>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <button
                                onClick={() => handleViewTrip(expense.trip.id)}
                                className="text-blue-600 hover:underline"
                              >
                                {expense.trip.route || 'Ver viaje'}
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {expense.trip.date 
                                ? format(new Date(expense.trip.date), "dd 'de' MMM, yyyy", { locale: es })
                                : 'N/A'}
                            </div>
                            
                            {expense.trip.departureTime && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {expense.trip.departureTime}
                              </div>
                            )}
                            
                            {expense.trip.bus && (
                              <div className="flex items-center gap-2">
                                <Receipt className="h-4 w-4" />
                                Bus: {expense.trip.bus}
                              </div>
                            )}
                          </>
                        )}
                        
                        <div className="flex items-center gap-2 col-span-2">
                          <Calendar className="h-4 w-4" />
                          Registrado: {format(new Date(expense.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                        </div>
                      </div>

                      {expense.receipt && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto mt-2"
                          onClick={() => handleViewReceipt(expense.id)}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Ver comprobante
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(expense)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Gasto</DialogTitle>
            <DialogDescription>
              Modifica la información del gasto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-type">Tipo de Gasto</Label>
              <Select
                value={editFormData.type}
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
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

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción</Label>
              <Input
                id="edit-description"
                type="text"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-amount">Monto (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editFormData.amount}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-receipt">Nuevo Comprobante (Opcional)</Label>
              {!editFormData.receipt ? (
                <div>
                  <input
                    id="edit-receipt"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('edit-receipt').click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Cambiar Comprobante
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg p-3">
                  {previewUrl ? (
                    <div className="space-y-2">
                      <img src={previewUrl} alt="Preview" className="w-full h-32 object-contain rounded" />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 truncate">{editFormData.receipt.name}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={handleRemoveFile}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 truncate">{editFormData.receipt.name}</span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={handleRemoveFile}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={editLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateExpense}
              disabled={editLoading}
            >
              {editLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
