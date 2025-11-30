import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Filter, Bus, Clock, Wifi, Wind, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { tripService } from '@/services';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TripSearch({ onSelectTrip }) {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    date: '',
    hasAC: false,
    hasWifi: false,
    hasBathroom: false,
  });
  
  const [originCities, setOriginCities] = useState([]);
  const [destinationCities, setDestinationCities] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    loadOriginCities();
  }, []);

  useEffect(() => {
    if (formData.origin) {
      loadDestinationCities(formData.origin);
      setFormData(prev => ({ ...prev, destination: '', date: '' }));
    }
  }, [formData.origin]);

  useEffect(() => {
    if (formData.origin && formData.destination) {
      loadAvailableDates(formData.origin, formData.destination);
      setFormData(prev => ({ ...prev, date: '' }));
    }
  }, [formData.origin, formData.destination]);

  const loadOriginCities = async () => {
    try {
      // intentar cargar desde sessionStorage
      const cached = sessionStorage.getItem('originCities');
      if (cached) {
        setOriginCities(JSON.parse(cached));
        return;
      }
      const response = await tripService.getOriginCities();
      let data = response.data.data || [];
      // Normalizar a objetos { id, name }
      const normalized = (data || []).map(d => {
        if (typeof d === 'string') return { id: d, name: d };
        return { id: d.id || d._id || d.name || JSON.stringify(d), name: d.name || d.label || d.city || String(d) };
      });
      setOriginCities(normalized || []);
      try { sessionStorage.setItem('originCities', JSON.stringify(normalized || [])); } catch (e) {}
    } catch (error) {
      console.error('Error loading origin cities:', error);
      setOriginCities([]);
    }
  };

  const loadDestinationCities = async (origin) => {
    try {
      const cacheKey = `destinationCities_${origin}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setDestinationCities(JSON.parse(cached));
        return;
      }

      const response = await tripService.getDestinationCities(origin);
      let apiDestinations = response.data.data || [];
      // normalize to objects
      apiDestinations = (apiDestinations || []).map(d => (typeof d === 'string' ? { id: d, name: d } : { id: d.id || d._id || d.name || JSON.stringify(d), name: d.name || d.label || d.city || String(d) }));

      // Fallback/augment: incluir paradas intermedias encontradas en los viajes si existen
      try {
        const allRes = await tripService.getAll();
        const allTrips = allRes.data?.data || allRes.data || [];
        const stops = new Set(apiDestinations.map(d => String(d)));
        allTrips.forEach(t => {
          try {
            const routeStops = t.route?.stops || t.stops || t.route?.paradas || [];
            if (Array.isArray(routeStops)) {
              routeStops.forEach(s => {
                if (s && String(s).trim().length > 0 && String(s).toLowerCase() !== String(origin).toLowerCase()) {
                  stops.add(String(s));
                }
              });
            }
            const dest = t.route?.destination || t.destination;
            if (dest && String(dest).trim().length > 0 && String(dest).toLowerCase() !== String(origin).toLowerCase()) {
              stops.add(String(dest));
            }
          } catch (e) {}
        });

        const final = Array.from(stops).map(s => ({ id: s, name: s }));
        setDestinationCities(final);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(final)); } catch (e) {}
        return;
      } catch (err) {
        // si falla el fallback, usar lo que devolvió el endpoint
      }

      setDestinationCities(apiDestinations || []);
      try { sessionStorage.setItem(cacheKey, JSON.stringify(apiDestinations || [])); } catch (e) {}
    } catch (error) {
      setDestinationCities([]);
    }
  };

  const loadAvailableDates = async (origin, destination) => {
    try {
      const response = await tripService.getAvailableDates(origin, destination);
      setAvailableDates(response.data.data || []);
    } catch (error) {
      console.error('Error loading available dates:', error);
      // Fallback: generar fechas de los próximos 14 días
      const dates = [];
      const today = new Date();
      for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
      setAvailableDates(dates);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!formData.origin || !formData.destination || !formData.date) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const amenities = [];
      if (formData.hasWifi) amenities.push('wifi');
      if (formData.hasBathroom) amenities.push('toilet');
      if (formData.hasAC) amenities.push('ac');

      const searchParams = {
        origin: formData.origin,
        destination: formData.destination,
        date: formData.date,
        passengers: 1,
        isDirect: false
      };

      if (amenities.length) searchParams.amenities = amenities.join(',');

      const response = await tripService.search(searchParams);
      const tripsData = response.data?.data || response.data || [];
      setTrips(tripsData);
      
      if (tripsData.length === 0) {
        toast.error('No se encontraron viajes');
      } else {
        toast.success(`${tripsData.length} viajes encontrados`);
      }
    } catch (error) {
      toast.error('Error al buscar viajes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Viajes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Ciudad de Origen
                </Label>
                <Select 
                  value={formData.origin} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, origin: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {originCities.map((city) => (
                      <SelectItem key={city.id || city.name} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Ciudad de Destino
                </Label>
                <Select 
                  value={formData.destination} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, destination: value }))}
                  disabled={!formData.origin}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!formData.origin ? "Primero selecciona origen" : "Selecciona destino"} />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationCities.map((city) => (
                      <SelectItem key={city.id || city.name} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Fecha de Viaje
                </Label>
                <Select 
                  value={formData.date} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, date: value }))}
                  disabled={!formData.destination}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!formData.destination ? "Selecciona origen y destino" : "Selecciona fecha"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDates.map((date) => (
                      <SelectItem key={date} value={date}>
                        {format(new Date(date), 'PPP', { locale: es })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.hasAC}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasAC: e.target.checked }))}
                />
                <Wind className="h-4 w-4 text-blue-500" />
                <span className="text-sm">A/C</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.hasWifi}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasWifi: e.target.checked }))}
                />
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm">WiFi</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.hasBathroom}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasBathroom: e.target.checked }))}
                />
                <Users className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Baño</span>
              </label>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !formData.origin || !formData.destination || !formData.date}
            >
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Buscando...' : 'Buscar Viajes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {trips.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{trips.length} viajes encontrados</h3>
          {trips.map((trip) => (
            <Card key={trip.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold">
                        {formData.origin} → {formData.destination}
                      </h4>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {formatPrice(trip.frequency?.price || trip.price || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Salida</p>
                          <p className="text-sm">{trip.frequency?.departureTime || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Bus className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Bus</p>
                          <p className="text-sm">{trip.bus?.placa || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Disponibles</p>
                          <p className="text-sm">{Math.max((trip.bus?.capacity || 40) - (trip.soldSeats || 0), 1)} asientos</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {trip.bus?.hasAC && (
                        <Badge variant="secondary">
                          <Wind className="h-3 w-3 mr-1" />A/C
                        </Badge>
                      )}
                      {trip.bus?.hasWifi && (
                        <Badge variant="secondary">
                          <Wifi className="h-3 w-3 mr-1" />WiFi
                        </Badge>
                      )}
                      {trip.bus?.hasBathroom && (
                        <Badge variant="secondary">
                          <Users className="h-3 w-3 mr-1" />Baño
                        </Badge>
                      )}
                    </div>

                    <Button 
                      onClick={() => onSelectTrip && onSelectTrip(trip)} 
                      className="w-full"
                      disabled={false}
                    >
                      Seleccionar asientos
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
