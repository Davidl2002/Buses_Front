import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripService, operationService, API_BASE_URL } from '@/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExpenseForm from '@/components/driver/ExpenseForm';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, MapPin, Calendar, Clock, Users, Bus, 
  DollarSign, FileText, Play, Flag, AlertCircle,
  CheckCircle, Phone, Navigation, Upload
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [manifest, setManifest] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const expenseTypes = {
    FUEL: 'Combustible',
    TOLL: 'Peaje',
    MAINTENANCE: 'Mantenimiento',
    FOOD: 'Alimentación',
    OTHER: 'Otro'
  };

  useEffect(() => {
    loadTripData();
  }, [tripId]);

  const loadTripData = async () => {
    setLoading(true);
    try {
      
      const [tripRes, manifestRes, expensesRes] = await Promise.all([
        tripService.getById(tripId),
        operationService.getManifest(tripId).catch(() => ({ data: { data: null } })),
        operationService.getExpenses(tripId).catch((err) => {
          console.warn('⚠️ Error loading expenses:', err);
          console.warn('⚠️ Error response:', err.response?.data);
          return { data: { data: [] } };
        })
      ]);

      setTrip(tripRes.data.data || tripRes.data);
      setManifest(manifestRes.data.data);
      
      // Asegurar que expenses sea siempre un array
      let expensesData = expensesRes.data.data || expensesRes.data;
      
      // Si aún es un objeto con propiedad expenses
      if (expensesData && typeof expensesData === 'object' && !Array.isArray(expensesData)) {
        expensesData = expensesData.expenses || [];
      }
      
      const expensesArray = Array.isArray(expensesData) ? expensesData : [];
      
      setExpenses(expensesArray);
    } catch (error) {
      toast.error('Error al cargar los datos del viaje');
      // Asegurar estados por defecto en caso de error
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (newStatus) => {
    try {
      const statusLabels = {
        IN_PROGRESS: 'en curso',
        COMPLETED: 'completado'
      };

      const confirmation = confirm(
        `¿Estás seguro de marcar este viaje como ${statusLabels[newStatus]}?`
      );

      if (!confirmation) return;

      await tripService.updateStatus(tripId, { status: newStatus });
      toast.success(`Viaje marcado como ${statusLabels[newStatus]}`);
      loadTripData();
    } catch (error) {
      console.error('Error changing trip status:', error);
      toast.error(error.response?.data?.message || 'Error al cambiar el estado');
    }
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

  const getStatusBadge = (status) => {
    const variants = {
      SCHEDULED: { variant: 'default', label: 'Programado', icon: Clock },
      IN_PROGRESS: { variant: 'secondary', label: 'En Curso', icon: Play },
      COMPLETED: { variant: 'outline', label: 'Completado', icon: CheckCircle },
      CANCELLED: { variant: 'destructive', label: 'Cancelado', icon: AlertCircle }
    };

    const config = variants[status] || variants.SCHEDULED;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando información del viaje...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Viaje no encontrado</h3>
            <Button onClick={() => navigate('/driver/trips')}>
              Volver a Mis Viajes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const usedTickets = manifest?.tickets?.filter(t => t.status === 'USED').length || 0;
  const totalTickets = manifest?.tickets?.length || 0;
  const totalExpenses = Array.isArray(expenses) 
    ? expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/driver/trips')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">
            {trip.frequency?.route?.origin || trip.route?.origin} - {trip.frequency?.route?.destination || trip.route?.destination}
          </h1>
          <p className="text-muted-foreground">
            {trip.bus?.placa || 'N/A'} • {trip.bus?.numeroInterno || ''}
          </p>
        </div>
        {getStatusBadge(trip.status)}
      </div>

      {/* Quick Actions */}
      {trip.status !== 'CANCELLED' && trip.status !== 'COMPLETED' && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              {trip.status === 'SCHEDULED' && (
                <Button
                  onClick={() => handleChangeStatus('IN_PROGRESS')}
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Viaje
                </Button>
              )}
              {trip.status === 'IN_PROGRESS' && (
                <Button
                  onClick={() => handleChangeStatus('COMPLETED')}
                  className="flex-1"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Finalizar Viaje
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate(`/driver/manifest/${tripId}`)}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Ver Manifiesto Completo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pasajeros</p>
                <p className="text-2xl font-bold">{usedTickets}/{totalTickets}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Gastos</p>
                <p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Fecha</p>
                <p className="text-lg font-bold">
                  {trip.date ? format(new Date(trip.date), 'dd/MM', { locale: es }) : 'N/A'}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Salida</p>
                <p className="text-lg font-bold">
                  {trip.departureTime || trip.frequency?.departureTime || 'N/A'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
          <TabsTrigger value="manifest">Pasajeros</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Viaje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Ruta</p>
                    <p className="font-medium">
                      {trip.frequency?.route?.origin || trip.route?.origin} → {trip.frequency?.route?.destination || trip.route?.destination}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Bus className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Bus</p>
                    <p className="font-medium">
                      {trip.bus?.placa} - {trip.bus?.model || trip.bus?.marca}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Fecha</p>
                    <p className="font-medium">
                      {trip.date ? format(new Date(trip.date), "dd 'de' MMMM, yyyy", { locale: es }) : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Hora de salida</p>
                    <p className="font-medium">{trip.departureTime || trip.frequency?.departureTime}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Paradas Intermedias */}
          {trip.frequency?.route?.stops && trip.frequency.route.stops.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Paradas Intermedias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {trip.frequency.route.stops.map((stop, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                      <Navigation className="h-4 w-4 text-gray-400" />
                      <span>{stop.name || stop.city || stop}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          {/* Mostrar estado actual para debug */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
              Estado del viaje: {trip.status}
            </div>
          )}
          
          <div className={`grid gap-4 ${trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Formulario de gastos - Mostrar si NO está completado o cancelado */}
            {trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED' && (
              <ExpenseForm tripId={tripId} onSuccess={loadTripData} />
            )}

            {/* Si está completado o cancelado, mostrar mensaje informativo */}
            {(trip.status === 'COMPLETED' || trip.status === 'CANCELLED') && (
              <Card>
                <CardHeader>
                  <CardTitle>Registro de Gastos</CardTitle>
                  <CardDescription>
                    {trip.status === 'COMPLETED' 
                      ? 'El viaje ha finalizado. No se pueden agregar más gastos.'
                      : 'El viaje ha sido cancelado. No se pueden agregar gastos.'}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Lista de gastos */}
            <Card>
              <CardHeader>
                <CardTitle>Gastos Registrados</CardTitle>
                <CardDescription>
                  Total: ${totalExpenses.toFixed(2)} • {expenses.length} {expenses.length === 1 ? 'gasto' : 'gastos'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No hay gastos registrados</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expenses.map((expense) => (
                      <div key={expense.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="font-medium">
                                {expenseTypes[expense.type] || expense.type}
                              </Badge>
                            </div>
                            <p className="font-medium text-base">{expense.description}</p>
                          </div>
                          <p className="text-2xl font-bold text-green-600">${parseFloat(expense.amount).toFixed(2)}</p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {expense.reportedBy && (
                              <span>
                                Por: {expense.reportedBy.firstName} {expense.reportedBy.lastName}
                              </span>
                            )}
                            {expense.createdAt && (
                              <span>
                                {format(new Date(expense.createdAt), "dd/MM/yyyy HH:mm")}
                              </span>
                            )}
                          </div>
                          {(expense.receiptUrl || expense.receipt) && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto text-blue-600"
                              onClick={() => handleViewReceipt(expense.id)}
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              Ver comprobante
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Manifest Tab */}
        <TabsContent value="manifest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Listado de Pasajeros</CardTitle>
              <CardDescription>
                {usedTickets} de {totalTickets} pasajeros abordados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!manifest || !manifest.tickets || manifest.tickets.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No hay pasajeros registrados
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Asiento</th>
                        <th className="text-left p-3">Pasajero</th>
                        <th className="text-left p-3">Contacto</th>
                        <th className="text-left p-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manifest.tickets.map((ticket) => (
                        <tr key={ticket.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-semibold">{ticket.seatNumber}</td>
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{ticket.passengerName}</p>
                              <p className="text-sm text-gray-500">{ticket.passengerCedula}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            {ticket.passengerPhone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {ticket.passengerPhone}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            {ticket.status === 'USED' ? (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Abordado
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                Pendiente
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
