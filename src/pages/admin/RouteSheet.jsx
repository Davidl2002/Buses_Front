import { useEffect, useState } from 'react';
import { Calendar, Search, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { busGroupService, tripService } from '@/services';
import toast from 'react-hot-toast';

export default function RouteSheet() {
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupId, setGroupId] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sheet, setSheet] = useState(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const res = await busGroupService.getAll();
      const data = res.data?.data || res.data || [];
      setGroups(data);
    } catch (error) {
      console.error('Error loading groups', error);
      toast.error('No se pudieron cargar los grupos de buses');
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault?.();
    if (!groupId) {
      toast.error('Seleccione un grupo (obligatorio)');
      return;
    }

    // require either single date or a start+end range
    if (!date && !(startDate && endDate)) {
      toast.error('Ingrese una fecha o un rango (startDate y endDate)');
      return;
    }

    setLoading(true);
    try {
      const params = { groupId };
      if (date) params.date = date;
      else {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      const res = await tripService.getRouteSheet(params);
      const data = res.data?.data || res.data || null;
      setSheet(data);
      if (!data || (Array.isArray(data.dates) && data.dates.length === 0)) toast('No se encontraron viajes para el criterio indicado');
    } catch (error) {
      console.error('Error fetching route sheet', error);
      toast.error('Error al obtener la hoja de ruta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Hoja de Ruta</h1>
        <p className="text-gray-600 mt-1">Consulta los viajes programados por fecha y grupo de buses</p>
      </div>

      <Card>
        <CardContent>
          <form className="flex flex-wrap gap-4 items-end" onSubmit={handleSearch}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Grupo de Buses (obligatorio)</label>
              <Select value={groupId} onValueChange={(v) => setGroupId(v)}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Seleccionar grupo" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha (para un día)</label>
              <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setStartDate(''); setEndDate(''); }} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">O rango: Desde</label>
              <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setDate(''); }} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Hasta</label>
              <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setDate(''); }} />
            </div>

            <div>
              <Button type="submit" className="flex items-center gap-2" disabled={loading}>
                <Search className="h-4 w-4" />
                Buscar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" /> Hoja de Ruta</CardTitle>
        </CardHeader>
        <CardContent>
          {!sheet && (
            <div className="text-center py-8 text-gray-500">Realice una búsqueda para ver la hoja de ruta</div>
          )}

          {sheet?.groupName && (
            <div className="mb-4 text-sm text-gray-700">Grupo: <strong>{sheet.groupName}</strong> (ID: {sheet.groupId})</div>
          )}

          {Array.isArray(sheet?.dates) && sheet.dates.map(d => (
            <div key={d.date} className="mb-6">
              <h3 className="text-lg font-semibold mb-2">{d.date}</h3>

              {Array.isArray(d.buses) && d.buses.map(b => (
                <div key={b.bus?.id || Math.random()} className="mb-4">
                  <div className="mb-2 text-sm text-gray-600">Bus: <strong>{b.bus?.numeroInterno || b.bus?.id}</strong> — {b.bus?.placa || ''}</div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hora</TableHead>
                        <TableHead>Ruta</TableHead>
                        <TableHead>Pasaj.</TableHead>
                        <TableHead>Chofer</TableHead>
                        <TableHead>Ayudante</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(b.trips) ? b.trips : []).map(t => (
                        <TableRow key={t.id}>
                          <TableCell>{t.departureTime || '-'}</TableCell>
                          <TableCell>{t.route?.name || '-'}</TableCell>
                          <TableCell>{t.passengersCount ?? t.passengers_count ?? '-'}</TableCell>
                          <TableCell>{t.driver?.name || t.driverName || '-'}</TableCell>
                          <TableCell>{t.assistant?.name || t.assistantName || '-'}</TableCell>
                          <TableCell>{t.status || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
