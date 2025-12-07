import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ticketService } from '@/services';
import toast from 'react-hot-toast';
import { 
  Calendar, Clock, User, MapPin, DollarSign, 
  Download, Search, Filter, Ticket, CheckCircle, XCircle 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MisVentas() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [stats, setStats] = useState({
    total: 0,
    totalVentas: 0,
    pagados: 0,
    usados: 0
  });

  useEffect(() => {
    loadTickets();
  }, [dateFilter]);

  useEffect(() => {
    applyFilters();
  }, [tickets, searchTerm, statusFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      
      // Construir parámetros de filtro
      const params = {};
      
      if (dateFilter) {
        params.startDate = dateFilter;
        params.endDate = dateFilter;
      }

      const response = await ticketService.getAll(params);
      const data = response.data?.data || response.data || [];
      const ticketsArray = Array.isArray(data) ? data : (data.tickets || []);
      
      setTickets(ticketsArray);
      calculateStats(ticketsArray);
    } catch (error) {
      console.error('Error cargando tickets:', error);
      toast.error('Error al cargar las ventas');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ticketsData) => {
    const total = ticketsData.length;
    
    // Calcular total de ventas manejando diferentes estructuras de precio
    const totalVentas = ticketsData.reduce((sum, ticket) => {
      const price = parseFloat(ticket.price || ticket.amount || ticket.totalPrice || 0);
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
    
    const pagados = ticketsData.filter(t => t.status === 'PAID').length;
    const usados = ticketsData.filter(t => t.status === 'USED').length;

    setStats({ total, totalVentas, pagados, usados });
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    // Filtro por estado
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.passengerName?.toLowerCase().includes(search) ||
        ticket.passengerCedula?.toLowerCase().includes(search) ||
        ticket.qrCode?.toLowerCase().includes(search) ||
        ticket.trip?.frequency?.route?.origin?.toLowerCase().includes(search) ||
        ticket.trip?.frequency?.route?.destination?.toLowerCase().includes(search)
      );
    }

    setFilteredTickets(filtered);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PAID: { label: 'Pagado', variant: 'default', icon: CheckCircle, color: 'text-green-600' },
      USED: { label: 'Usado', variant: 'secondary', icon: CheckCircle, color: 'text-blue-600' },
      CONFIRMED: { label: 'Confirmado', variant: 'outline', icon: Clock, color: 'text-orange-600' },
      CANCELLED: { label: 'Cancelado', variant: 'destructive', icon: XCircle, color: 'text-red-600' }
    };

    const config = statusConfig[status] || statusConfig.CONFIRMED;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleDownloadPdf = async (ticketId) => {
    try {
      const response = await ticketService.downloadPdf(ticketId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket-${ticketId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Ticket descargado correctamente');
    } catch (error) {
      console.error('Error descargando PDF:', error);
      toast.error('Error al descargar el ticket');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando ventas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Mis Ventas</h1>
        <p className="text-muted-foreground">
          Gestión de tickets vendidos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Ventas</p>
                <p className="text-3xl font-bold">${stats.totalVentas.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Tickets</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Ticket className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pagados</p>
                <p className="text-3xl font-bold">{stats.pagados}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Usados</p>
                <p className="text-3xl font-bold">{stats.usados}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date-filter">Fecha</Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="status-filter">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="PAID">Pagado</SelectItem>
                  <SelectItem value="USED">Usado</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Pasajero, cédula, ruta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets Vendidos ({filteredTickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Ticket className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No se encontraron tickets</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{ticket.passengerName}</h3>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Cédula: {ticket.passengerCedula}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          Asiento: {ticket.seatNumber}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        ${parseFloat(ticket.price || ticket.amount || ticket.totalPrice || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-3 mt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600 mb-1">Ruta</p>
                        <p className="font-medium">
                          {ticket.trip?.frequency?.route?.origin} → {ticket.trip?.frequency?.route?.destination}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Fecha y Hora</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {ticket.trip?.date && format(parseISO(ticket.trip.date.split('T')[0]), 'dd/MM/yyyy', { locale: es })}
                          <Clock className="h-4 w-4 ml-2" />
                          {ticket.trip?.departureTime || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Aborda en</p>
                        <p className="font-medium">{ticket.boardingStop}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Desciende en</p>
                        <p className="font-medium">{ticket.dropoffStop}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-3">
                      <Button
                        onClick={() => handleDownloadPdf(ticket.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar PDF
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
