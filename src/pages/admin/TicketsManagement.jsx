import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  Ticket,
  Plus,
  QrCode,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  User,
  Calendar,
  DollarSign,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { enhancedTicketService as ticketService, frequencyService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function TicketsManagement() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ tripId: '', seatNumber: '', passengerName: '', passengerCedula: '', passengerEmail: '', boardingStop: '', dropoffStop: '', paymentMethod: 'CASH' });
  const [frequencies, setFrequencies] = useState([]);
  const cedulaTimeout = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    loadTickets();
    // cargar frecuencias si tenemos cooperativaId
    const loadFreq = async () => {
      try {
        if (user?.cooperativaId) {
          const res = await frequencyService.getAll({ cooperativaId: user.cooperativaId });
          const data = res.data?.data || res.data || [];
          setFrequencies(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.warn('No se pudieron cargar frecuencias', err);
      }
    };
    loadFreq();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter, dateFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketService.getAll();
      console.log('Tickets API response:', response.data);
      
      if (response.data.success && response.data.data) {
        setTickets(response.data.data);
      } else {
        setTickets(response.data.data || response.data || []);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.log('Backend no disponible, usando datos de demostración');
        toast.error('Backend no disponible - Mostrando datos de demostración');
      } else {
        toast.error('Error al cargar los tickets');
      }
      
      // Datos de demostración
      setTickets([
        {
          id: '1',
          ticketNumber: 'TK001234567',
          passenger: {
            name: 'Ana María Rodríguez',
            email: 'ana.rodriguez@email.com',
            phone: '0987654321',
            cedula: '1234567890'
          },
          trip: {
            id: '1',
            route: {
              origin: 'Quito',
              destination: 'Guayaquil'
            },
            departureDate: '2024-12-20',
            departureTime: '06:00',
            bus: {
              placa: 'ABC-123',
              marca: 'Mercedes'
            },
            driver: {
              name: 'Juan Pérez'
            }
          },
          seatNumber: 15,
          seatType: 'NORMAL',
          price: 15.00,
          status: 'ACTIVE',
          purchaseDate: '2024-12-18T14:30:00Z',
          qrCode: 'QR_TK001234567_2024',
          validatedAt: null,
          validatedBy: null
        },
        {
          id: '2',
          ticketNumber: 'TK001234568',
          passenger: {
            name: 'Carlos Mendoza Silva',
            email: 'carlos.mendoza@email.com',
            phone: '0123456789',
            cedula: '0987654321'
          },
          trip: {
            id: '1',
            route: {
              origin: 'Quito',
              destination: 'Guayaquil'
            },
            departureDate: '2024-12-20',
            departureTime: '06:00',
            bus: {
              placa: 'ABC-123',
              marca: 'Mercedes'
            },
            driver: {
              name: 'Juan Pérez'
            }
          },
          seatNumber: 8,
          seatType: 'VIP',
          price: 19.5,
          status: 'USED',
          purchaseDate: '2024-12-17T10:15:00Z',
          qrCode: 'QR_TK001234568_2024',
          validatedAt: '2024-12-20T05:45:00Z',
          validatedBy: 'Juan Pérez'
        },
        {
          id: '3',
          ticketNumber: 'TK001234569',
          passenger: {
            name: 'María Elena González',
            email: 'maria.gonzalez@email.com',
            phone: '0555666777',
            cedula: '1122334455'
          },
          trip: {
            id: '2',
            route: {
              origin: 'Guayaquil',
              destination: 'Quito'
            },
            departureDate: '2024-12-19',
            departureTime: '15:00',
            bus: {
              placa: 'XYZ-789',
              marca: 'Volvo'
            },
            driver: {
              name: 'María González'
            }
          },
          seatNumber: 12,
          seatType: 'SEMI_CAMA',
          price: 22.5,
          status: 'CANCELLED',
          purchaseDate: '2024-12-16T16:20:00Z',
          qrCode: 'QR_TK001234569_2024',
          validatedAt: null,
          validatedBy: null,
          cancellationReason: 'Solicitud del cliente',
          cancelledAt: '2024-12-18T09:30:00Z'
        },
        {
          id: '4',
          ticketNumber: 'TK001234570',
          passenger: {
            name: 'Pedro Sánchez López',
            email: 'pedro.sanchez@email.com',
            phone: '0999888777',
            cedula: '5566778899'
          },
          trip: {
            id: '3',
            route: {
              origin: 'Quito',
              destination: 'Cuenca'
            },
            departureDate: '2024-12-21',
            departureTime: '08:30',
            bus: {
              placa: 'DEF-456',
              marca: 'Scania'
            },
            driver: {
              name: 'Roberto Díaz'
            }
          },
          seatNumber: 25,
          seatType: 'NORMAL',
          price: 20.00,
          status: 'ACTIVE',
          purchaseDate: '2024-12-19T11:45:00Z',
          qrCode: 'QR_TK001234570_2024',
          validatedAt: null,
          validatedBy: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    // Filtro por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.ticketNumber.toLowerCase().includes(search) ||
        ticket.passenger.name.toLowerCase().includes(search) ||
        ticket.passenger.email.toLowerCase().includes(search) ||
        ticket.passenger.cedula.includes(search) ||
        ticket.trip.route.origin.toLowerCase().includes(search) ||
        ticket.trip.route.destination.toLowerCase().includes(search)
      );
    }

    // Filtro por estado
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Filtro por fecha
    if (dateFilter) {
      filtered = filtered.filter(ticket => ticket.trip.departureDate === dateFilter);
    }

    setFilteredTickets(filtered);
  };

  const handleValidateTicket = async (ticketId) => {
    try {
      await ticketService.validate(ticketId);
      toast.success('Ticket validado correctamente');
      loadTickets();
    } catch (error) {
      console.error('Error validating ticket:', error);
      toast.error('Error al validar el ticket');
    }
  };

  const handleCancelTicket = async (ticketId) => {
    const reason = prompt('Motivo de cancelación:');
    if (!reason) return;

    try {
      await ticketService.cancel(ticketId, { reason });
      toast.success('Ticket cancelado correctamente');
      loadTickets();
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      toast.error('Error al cancelar el ticket');
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault && e.preventDefault();
    try {
      // Validaciones
      if (!createForm.tripId) return toast.error('Trip ID es requerido');
      if (!createForm.passengerName || createForm.passengerName.trim().length < 3) return toast.error('Nombre del pasajero (mín. 3 caracteres)');
      if (!createForm.passengerCedula || String(createForm.passengerCedula).trim().length < 10) return toast.error('Cédula del pasajero (mín. 10 caracteres)');
      const email = String(createForm.passengerEmail || '').trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) return toast.error('Email inválido');

      // Normalizar payload: seatNumber debe ser number
      const payload = {
        tripId: String(createForm.tripId),
        seatNumber: Number(createForm.seatNumber) || 0,
        passengerName: String(createForm.passengerName).trim(),
        passengerCedula: String(createForm.passengerCedula).trim(),
        passengerEmail: email,
        boardingStop: createForm.boardingStop || undefined,
        dropoffStop: createForm.dropoffStop || undefined,
      };
      if (createForm.passengerPhone) payload.passengerPhone = String(createForm.passengerPhone).trim();
      if (createForm.paymentMethod) payload.paymentMethod = String(createForm.paymentMethod).trim();

      // llamar al endpoint de creación (usa ticketService.create -> POST /api/tickets)
      await ticketService.create(payload);
      toast.success('Ticket creado correctamente');
      setShowCreate(false);
      setCreateForm({ tripId: '', seatNumber: '', passengerName: '', passengerCedula: '', passengerEmail: '', boardingStop: '', dropoffStop: '', paymentMethod: 'CASH' });
      loadTickets();
    } catch (err) {
      console.error('Error creating ticket', err);
      toast.error(err.response?.data?.message || 'Error al crear ticket');
    }
  };

  const handleSelectFrequency = (freqId) => {
    const f = frequencies.find(x => String(x.id) === String(freqId));
    if (!f) return;
    // Autocompletar campos relacionados si existen
    const tripId = f.tripId || f.nextTripId || f.defaultTripId || f.id;
    const boarding = f.boardingStop || f.defaultBoarding || '';
    const dropoff = f.dropoffStop || f.defaultDropoff || '';
    setCreateForm(cf => ({ ...cf, tripId: tripId || cf.tripId, boardingStop: boarding || cf.boardingStop, dropoffStop: dropoff || cf.dropoffStop }));
  };

  const lookupCedula = (cedula) => {
    if (cedulaTimeout.current) clearTimeout(cedulaTimeout.current);
    if (!cedula || String(cedula).trim().length < 10) return;
    cedulaTimeout.current = setTimeout(async () => {
      try {
        // intentar buscar usuario por cédula en endpoint /users?cedula=...
        const res = await api.get('/users', { params: { cedula: String(cedula).trim() } });
        const data = res.data?.data || res.data;
        // si devuelve array buscar primer elemento
        const userFound = Array.isArray(data) ? data[0] : data;
        if (userFound) {
          setCreateForm(cf => ({ ...cf, passengerName: userFound.name || cf.passengerName, passengerEmail: userFound.email || cf.passengerEmail, passengerPhone: userFound.phone || cf.passengerPhone }));
          toast.success('Datos del pasajero autocompletados');
        }
      } catch (err) {
        // no bloquear si no existe
        console.debug('Lookup cedula no encontrado o endpoint no disponible', err?.response?.status || err.message);
      }
    }, 600);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { variant: 'default', label: 'Activo', icon: CheckCircle },
      USED: { variant: 'secondary', label: 'Usado', icon: CheckCircle },
      CANCELLED: { variant: 'destructive', label: 'Cancelado', icon: XCircle },
      EXPIRED: { variant: 'secondary', label: 'Expirado', icon: Clock }
    };
    
    const config = statusConfig[status] || statusConfig.ACTIVE;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getSeatTypeBadge = (seatType) => {
    const typeConfig = {
      NORMAL: { variant: 'outline', label: 'Normal' },
      VIP: { variant: 'secondary', label: 'VIP' },
      SEMI_CAMA: { variant: 'default', label: 'Semi-cama' }
    };
    
    const config = typeConfig[seatType] || typeConfig.NORMAL;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('es-EC');
  };

  const formatDate = (dateString) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('es-EC', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportTickets = () => {
    // Implementar exportación a CSV/PDF
    toast.success('Exportando tickets...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Tickets</h1>
          <p className="text-muted-foreground">
            Administrar y validar tickets de los pasajeros
          </p>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Ticket
            </Button>
          <Button variant="outline" onClick={exportTickets}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={loadTickets}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                <p className="text-2xl font-bold">{tickets.length}</p>
              </div>
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'ACTIVE').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usados</p>
                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'USED').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cancelados</p>
                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'CANCELLED').length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Ticket, pasajero, cédula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="ACTIVE">Activos</SelectItem>
                  <SelectItem value="USED">Usados</SelectItem>
                  <SelectItem value="CANCELLED">Cancelados</SelectItem>
                  <SelectItem value="EXPIRED">Expirados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha de Viaje</Label>
              <Input
                id="date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2 flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setDateFilter('');
                }}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de tickets */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{ticket.ticketNumber}</h3>
                    {getStatusBadge(ticket.status)}
                    {getSeatTypeBadge(ticket.seatType)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Pasajero</p>
                        <p className="text-sm">{ticket.passenger.name}</p>
                        <p className="text-xs text-muted-foreground">{ticket.passenger.cedula}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Ruta</p>
                        <p className="text-sm">{ticket.trip.route.origin} → {ticket.trip.route.destination}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Fecha y Hora</p>
                        <p className="text-sm">{formatDate(ticket.trip.departureDate)} - {ticket.trip.departureTime}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Asiento</p>
                        <p className="text-sm">#{ticket.seatNumber}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Precio</p>
                        <p className="text-sm">{formatCurrency(ticket.price)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Código QR</p>
                        <p className="text-xs text-muted-foreground">{ticket.qrCode}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Comprado: {formatDateTime(ticket.purchaseDate)}
                      {ticket.validatedAt && (
                        <span className="ml-4">
                          Validado: {formatDateTime(ticket.validatedAt)} por {ticket.validatedBy}
                        </span>
                      )}
                      {ticket.cancelledAt && (
                        <span className="ml-4">
                          Cancelado: {formatDateTime(ticket.cancelledAt)}
                          {ticket.cancellationReason && ` - ${ticket.cancellationReason}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setShowDetails(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {ticket.status === 'ACTIVE' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleValidateTicket(ticket.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelTicket(ticket.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {/* Subir comprobante */}
                  <label className="ml-2 inline-flex items-center cursor-pointer">
                    <input type="file" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append('paymentProof', file);
                        formData.append('ticketId', ticket.id);
                        api.post('/tickets/payment/upload-proof', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
                          .then(() => {
                            toast.success('Comprobante subido');
                            loadTickets();
                          })
                          .catch((err) => {
                            console.error('Error subiendo comprobante', err);
                            toast.error('No se pudo subir comprobante');
                          });
                      }
                    }} />
                    <span className="text-sm text-blue-600">Subir comprobante</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTickets.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || statusFilter !== 'ALL' || dateFilter 
                ? 'No se encontraron tickets con los filtros aplicados'
                : 'No hay tickets registrados'
              }
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'ALL' || dateFilter
                ? 'Intenta ajustar los filtros de búsqueda.'
                : 'Los tickets aparecerán aquí cuando los clientes realicen reservas.'
              }
            </p>
            {(searchTerm || statusFilter !== 'ALL' || dateFilter) && (
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setDateFilter('');
                }}
              >
                Limpiar Filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de detalles */}
      {showDetails && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Detalles del Ticket</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedTicket(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Número de Ticket</Label>
                  <p className="text-sm">{selectedTicket.ticketNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Estado</Label>
                  <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Información del Pasajero</Label>
                <div className="bg-muted p-3 rounded">
                  <p><strong>Nombre:</strong> {selectedTicket.passenger.name}</p>
                  <p><strong>Email:</strong> {selectedTicket.passenger.email}</p>
                  <p><strong>Teléfono:</strong> {selectedTicket.passenger.phone}</p>
                  <p><strong>Cédula:</strong> {selectedTicket.passenger.cedula}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Información del Viaje</Label>
                <div className="bg-muted p-3 rounded">
                  <p><strong>Ruta:</strong> {selectedTicket.trip.route.origin} → {selectedTicket.trip.route.destination}</p>
                  <p><strong>Fecha:</strong> {formatDate(selectedTicket.trip.departureDate)}</p>
                  <p><strong>Hora de salida:</strong> {selectedTicket.trip.departureTime}</p>
                  <p><strong>Bus:</strong> {selectedTicket.trip.bus.placa} ({selectedTicket.trip.bus.marca})</p>
                  <p><strong>Conductor:</strong> {selectedTicket.trip.driver.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Asiento</Label>
                  <p className="text-sm">#{selectedTicket.seatNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tipo</Label>
                  <div className="mt-1">{getSeatTypeBadge(selectedTicket.seatType)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Precio</Label>
                  <p className="text-sm font-bold">{formatCurrency(selectedTicket.price)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Código QR</Label>
                <div className="bg-muted p-3 rounded font-mono text-sm">
                  {selectedTicket.qrCode}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div>
                  <Label className="text-sm font-medium">Fecha de Compra</Label>
                  <p className="text-sm">{formatDateTime(selectedTicket.purchaseDate)}</p>
                </div>
                {selectedTicket.validatedAt && (
                  <div>
                    <Label className="text-sm font-medium">Validado</Label>
                    <p className="text-sm">{formatDateTime(selectedTicket.validatedAt)} por {selectedTicket.validatedBy}</p>
                  </div>
                )}
                {selectedTicket.cancelledAt && (
                  <div>
                    <Label className="text-sm font-medium">Cancelado</Label>
                    <p className="text-sm">{formatDateTime(selectedTicket.cancelledAt)}</p>
                    {selectedTicket.cancellationReason && (
                      <p className="text-sm text-muted-foreground">Motivo: {selectedTicket.cancellationReason}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

        {/* Modal crear ticket */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle>Crear Ticket Manual</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTicket} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Frecuencia (opcional)</Label>
                      <select className="w-full p-2 rounded border" value={createForm.frequencyId || ''} onChange={(e) => { setCreateForm(f => ({ ...f, frequencyId: e.target.value })); handleSelectFrequency(e.target.value); }}>
                        <option value="">-- Seleccionar frecuencia --</option>
                        {frequencies.map(f => (
                          <option key={f.id} value={f.id}>{f.name || `${f.route?.origin || ''} → ${f.route?.destination || ''}`}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Trip ID</Label>
                      <Input value={createForm.tripId} onChange={(e) => setCreateForm(f => ({ ...f, tripId: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Asiento</Label>
                      <Input type="number" value={createForm.seatNumber} onChange={(e) => setCreateForm(f => ({ ...f, seatNumber: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Nombre pasajero</Label>
                      <Input value={createForm.passengerName} onChange={(e) => setCreateForm(f => ({ ...f, passengerName: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Cédula</Label>
                      <Input value={createForm.passengerCedula} onChange={(e) => { setCreateForm(f => ({ ...f, passengerCedula: e.target.value })); lookupCedula(e.target.value); }} />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={createForm.passengerEmail} onChange={(e) => setCreateForm(f => ({ ...f, passengerEmail: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Método</Label>
                      <Input value={createForm.paymentMethod} onChange={(e) => setCreateForm(f => ({ ...f, paymentMethod: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Cancelar</Button>
                    <Button type="submit">Crear</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
    </div>
  );
}