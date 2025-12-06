import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Filter, Bus, Clock, Wifi, Wind, Users, Monitor } from 'lucide-react';
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
    hasTV: false,
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
      // intentar cargar desde sessionStorage (ignorar arrays vacíos o contenido inválido)
      const cached = sessionStorage.getItem('originCities');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOriginCities(parsed);
            return;
          }
        } catch (e) {
          console.warn('Cached originCities inválido, se ignorará', e);
        }
      }
      let response;
      try {
        response = await tripService.getOriginCities();
      } catch (err) {
        console.warn('getOriginCities failed, will fallback to extracting from trips', err);
        response = null;
      }
      let data = response?.data?.data || [];
      // If API returned nothing, fallback to deriving origins from all trips
      if (!data || (Array.isArray(data) && data.length === 0)) {
        try {
          const allRes = await tripService.getAll();
          const allTrips = allRes.data?.data || allRes.data || [];
          const originsSet = new Set();
          const now = new Date();
          (allTrips || []).forEach(t => {
            try {
              const dateStr = t.date || t.frequency?.date || t.startDate || t.dateOfTravel || null;
              const tripDate = dateStr ? new Date(dateStr) : null;
              // only future or today
              if (tripDate && tripDate >= new Date(now.setHours(0,0,0,0))) {
                const origin = (t.origin || t.route?.origin || t.from || t.departureCity || t.startCity || '').toString().trim();
                if (origin) originsSet.add(origin);
              }
            } catch (e) {}
          });
          data = Array.from(originsSet);
        } catch (err) {
          console.warn('Fallback extracting origins failed', err);
          data = [];
        }
      }
      // Normalizar a objetos { id, name }
      const normalized = (data || []).map(d => {
        if (typeof d === 'string') return { id: d, name: d };
        return { id: d.id || d._id || d.name || JSON.stringify(d), name: d.name || d.label || d.city || String(d) };
      });
      setOriginCities(normalized || []);
      try {
        if (Array.isArray(normalized) && normalized.length > 0) {
          sessionStorage.setItem('originCities', JSON.stringify(normalized));
        }
      } catch (e) {}
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
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDestinationCities(parsed);
            return;
          }
        } catch (e) {
          console.warn(`Cached ${cacheKey} inválido, se ignorará`, e);
        }
      }
      // Use the public destinations endpoint for the selected origin
      const response = await tripService.getDestinationCities(origin);
      let apiDestinations = response.data.data || [];
      // normalize to objects
      apiDestinations = (apiDestinations || []).map(d => (typeof d === 'string' ? { id: d, name: d } : { id: d.id || d._id || d.name || JSON.stringify(d), name: d.name || d.label || d.city || String(d) }));

      // Fallback/augment: incluir paradas intermedias encontradas en los viajes si existen
      try {
        const allRes = await tripService.getAll();
        const allTrips = allRes.data?.data || allRes.data || [];
        // Filtrar solo trips cuyo origen coincida con el origen seleccionado
        const relevantTrips = (allTrips || []).filter(t => {
          const tripOrigin = (t.origin || t.route?.origin || t.from || t.departureCity || t.startCity || '').toString().trim();
          return tripOrigin && tripOrigin.toLowerCase() === String(origin).toLowerCase();
        });

        // start with an empty set and only add stops from trips that match the origin
        const stops = new Set();
        relevantTrips.forEach(t => {
          try {
            const routeStops = t.route?.stops || t.stops || t.route?.paradas || [];
            if (Array.isArray(routeStops)) {
              routeStops.forEach(s => {
                const stopName = s && (s.name || s.city || s) ;
                if (stopName && String(stopName).trim().length > 0 && String(stopName).toLowerCase() !== String(origin).toLowerCase()) {
                  stops.add(String(stopName));
                }
              });
            }
            const dest = t.route?.destination || t.destination;
            const destName = dest && (dest.name || dest.city || dest);
            if (destName && String(destName).trim().length > 0 && String(destName).toLowerCase() !== String(origin).toLowerCase()) {
              stops.add(String(destName));
            }
          } catch (e) {}
        });
        let final = [];
        if (stops.size > 0) {
          final = Array.from(stops).map(s => ({ id: s, name: s }));
        } else {
          // fallback to the API-provided list if we couldn't infer from trips
          final = apiDestinations || [];
        }
        setDestinationCities(final);
        try {
          if (Array.isArray(final) && final.length > 0) sessionStorage.setItem(cacheKey, JSON.stringify(final));
        } catch (e) {}
        return;
      } catch (err) {
        // si falla el fallback, usar lo que devolvió el endpoint
      }

      setDestinationCities(apiDestinations || []);
      try {
        if (Array.isArray(apiDestinations) && apiDestinations.length > 0) sessionStorage.setItem(cacheKey, JSON.stringify(apiDestinations));
      } catch (e) {}
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
      if (formData.hasTV) amenities.push('tv');

      const searchParams = {
        origin: formData.origin,
        destination: formData.destination,
        date: formData.date,
        passengers: 1,
        isDirect: false
      };

      // Hint to backend to include bus details in search results when supported
      searchParams.include = 'bus';

      if (amenities.length) searchParams.amenities = amenities.join(',');
      if (amenities.length) searchParams.amenities = amenities.join(',');

      const response = await tripService.search(searchParams);
      const tripsData = response.data?.data || response.data || [];

      // Helper para comprobar amenities en variantes de propiedades del objeto `bus`
      const hasAmenity = (bus = {}, names = []) => {
        if (!bus) return false;
        for (const n of names) {
          if (Object.prototype.hasOwnProperty.call(bus, n) && !!bus[n]) return true;
        }
        return false;
      };

      const matchesAmenities = (tripObj) => {
        const bus = tripObj.bus || {};
        if (formData.hasAC) {
          if (!hasAmenity(bus, ['hasAC', 'hasAc', 'has_ac', 'ac', 'has_air', 'air'])) return false;
        }
        if (formData.hasWifi) {
          if (!hasAmenity(bus, ['hasWifi', 'has_wifi', 'wifi', 'hasWiFi'])) return false;
        }
        if (formData.hasBathroom) {
          if (!hasAmenity(bus, ['hasBathroom', 'has_bathroom', 'hasToilet', 'has_toilet', 'toilet', 'hasWC'])) return false;
        }
        if (formData.hasTV) {
          if (!hasAmenity(bus, ['hasTV', 'has_tv', 'tv', 'hasTelevision', 'television'])) return false;
        }
        return true;
      };

      // Normalizar campos para que la UI muestre la información real cuando venga del backend
      const normalized = (tripsData || []).map(t => {
        const bus = t.bus || t.vehicle || t.coach || {};
        const placa = bus.placa || bus.plate || bus.plateNumber || bus.licensePlate || bus.registration || bus.name || '';
        const model = bus.modelo || bus.model || bus.marca || bus.brand || bus.make || bus.manufacturer || '';

        // Price fallbacks: frequency.price, trip.price, route.basePrice, trip.basePrice
        const rawPrice = t.frequency?.price ?? t.price ?? t.fare ?? t.cost ?? t.route?.basePrice ?? t.basePrice ?? 0;
        const price = typeof rawPrice === 'string' ? parseFloat(rawPrice) || 0 : (rawPrice || 0);

        const capacity = bus.totalSeats || bus.capacity || t.busCapacity || t.capacity || t.totalSeats || 40;
        const soldSeats = t.soldSeats ?? t.occupiedSeats ?? t.seatsSold ?? t.ticketsSold ?? 0;
        const departureTime = t.departureTime || t.frequency?.departureTime || t.startTime || t.time || null;
        const date = t.date || t.frequency?.date || t.startDate || t.dateOfTravel || null;
        const status = t.status || t.state || t.tripStatus || null;

        return {
          ...t,
          bus: { ...bus, placa, model },
          price,
          capacity,
          soldSeats,
          departureTime,
          date,
          status
        };
      });

      setTrips(normalized);

      // Si el backend de búsqueda no incluye route/bus completos, intentar obtener detalles públicos completos
      try {
        const needsFetch = normalized.filter(t => !t.route || !t.bus || !t.route?.stops || (Array.isArray(t.route?.stops) && t.route.stops.length === 0));
        if (needsFetch.length) {
          const details = await Promise.all(needsFetch.map(async (t) => {
            try {
              const res = await tripService.getPublicById(t.id);
              return res.data?.data || res.data || null;
            } catch (err) {
              return null;
            }
          }));

          const detailsMap = new Map();
          details.forEach(d => { if (d && d.id) detailsMap.set(d.id, d); });

          const merged = normalized.map(t => {
            const d = detailsMap.get(t.id);
            if (!d) return t;
            const mergedBus = d.bus || t.bus || {};
            const placa = mergedBus.placa || mergedBus.plate || mergedBus.plateNumber || mergedBus.licensePlate || mergedBus.registration || mergedBus.name || '';
            const model = mergedBus.modelo || mergedBus.model || mergedBus.marca || mergedBus.brand || mergedBus.make || '';

            const rawPrice = d.frequency?.price ?? d.price ?? d.route?.basePrice ?? d.basePrice ?? t.price ?? 0;
            const price = typeof rawPrice === 'string' ? parseFloat(rawPrice) || 0 : (rawPrice || 0);

            const capacity = mergedBus.totalSeats || mergedBus.capacity || d.bus?.capacity || t.capacity || 40;
            const soldSeats = d.soldSeats ?? t.soldSeats ?? 0;

            return {
              ...t,
              ...d,
              frequency: d.frequency || t.frequency,
              route: d.route || t.route,
              bus: { ...mergedBus, placa, model },
              price,
              departureTime: d.departureTime || t.departureTime || d.frequency?.departureTime,
              date: d.date || t.date || d.frequency?.date,
              capacity,
              soldSeats
            };
          });

          setTrips(merged);
        }
      } catch (err) {
        // no bloquear si falla la llamada adicional
        console.warn('No se pudieron obtener detalles públicos adicionales:', err);
      }

      // Aplicar filtrado en cliente según amenities seleccionadas (por si el backend no lo filtró)
      try {
        const current = (Array.isArray(tripsData) && tripsData.length > 0) ? (trips.length ? trips : (await Promise.resolve([]))) : [];
        // `trips` state already contains merged or normalized set via setTrips above; usarlo
        const sourceList = (trips && trips.length) ? trips : (normalized || []);
        const finalFiltered = sourceList.filter(matchesAmenities);
        setTrips(finalFiltered);
        if (finalFiltered.length === 0) {
          toast.error('No se encontraron viajes con los filtros seleccionados');
        } else {
          toast.success(`${finalFiltered.length} viajes encontrados`);
        }
      } catch (err) {
        // si algo falla en el filtrado, mantener la lista original
        if (tripsData.length === 0) {
          toast.error('No se encontraron viajes');
        } else {
          toast.success(`${tripsData.length} viajes encontrados`);
        }
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

              <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.hasTV}
                    onChange={(e) => setFormData(prev => ({ ...prev, hasTV: e.target.checked }))}
                  />
                  <Monitor className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">TV</span>
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
                          {formatPrice(trip.price || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Salida</p>
                          <p className="text-sm">{trip.departureTime || trip.frequency?.departureTime || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Bus className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Bus</p>
                          <p className="text-sm">{(trip.bus?.placa ? trip.bus.placa : 'N/A')}{trip.bus?.model ? ` - ${trip.bus.model}` : ''}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Disponibles</p>
                          <p className="text-sm">{Math.max((trip.capacity || (trip.bus?.capacity || 40)) - (trip.soldSeats || 0), 0)} asientos</p>
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
                      {trip.bus?.hasTV && (
                        <Badge variant="secondary">
                          <Monitor className="h-3 w-3 mr-1" />TV
                        </Badge>
                      )}
                    </div>

                    {/* Mostrar paradas si existen */}
                    {trip.route?.stops && Array.isArray(trip.route.stops) && trip.route.stops.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Paradas:</p>
                        <div className="flex flex-wrap gap-2">
                          {trip.route.stops.map((s, idx) => (
                            <div key={idx} className="px-3 py-1 bg-gray-100 rounded text-sm">
                              <strong>{s.name || s}</strong>
                              {s.priceFromOrigin !== undefined && s.priceFromOrigin !== null && (
                                <span className="ml-2 text-xs text-muted-foreground">(+{formatPrice(Number(s.priceFromOrigin))})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
