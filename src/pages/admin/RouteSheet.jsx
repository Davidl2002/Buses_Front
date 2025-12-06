import { useEffect, useState } from 'react';
import { Calendar, Search, Truck, FileDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { busGroupService, tripService } from '@/services';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import useActiveCooperativaId from '@/hooks/useActiveCooperativaId';

export default function RouteSheet() {
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupId, setGroupId] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [sheet, setSheet] = useState(null);
  const { user } = useAuth();
  const coopId = useActiveCooperativaId();

  useEffect(() => {
    if (coopId || user?.cooperativaId) {
      loadGroups();
    }
  }, [coopId]);

  const loadGroups = async () => {
    try {
      const params = {};
      const targetCoop = coopId || user?.cooperativaId;
      if (targetCoop) params.cooperativaId = targetCoop;
      
      const res = await busGroupService.getAll(params);
      let data = res.data?.data || res.data || [];
      
      // Filtrado frontend si es SUPER_ADMIN y hay cooperativa seleccionada
      if (user?.role === 'SUPER_ADMIN' && coopId) {
        console.log('🔍 RouteSheet - Filtrando grupos para cooperativa:', coopId);
        data = data.filter(bg => {
          const bgCoopId = bg.cooperativaId || bg.cooperativa?._id || bg.cooperativa?.id;
          return bgCoopId === coopId;
        });
        console.log('✅ Grupos filtrados:', data.length, 'registros');
      }
      
      setGroups(data);
    } catch (error) {
      console.error('Error loading groups', error);
      toast.error('No se pudieron cargar los grupos de buses');
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'SCHEDULED': 'Programado',
      'IN_PROGRESS': 'En Progreso',
      'COMPLETED': 'Completado',
      'CANCELLED': 'Cancelado'
    };
    return statusMap[status] || status;
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

  const handleGeneratePdf = async () => {
    if (!groupId) {
      toast.error('Seleccione un grupo (obligatorio)');
      return;
    }

    if (!date && !(startDate && endDate)) {
      toast.error('Ingrese una fecha o un rango (startDate y endDate)');
      return;
    }

    setGeneratingPdf(true);
    try {
      const params = new URLSearchParams({ groupId });
      if (date) params.append('date', date);
      else {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/trips/route-sheet/pdf?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al generar el PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Nombre del archivo con fecha
      const fileName = date 
        ? `hoja-ruta-${date}.pdf` 
        : `hoja-ruta-${startDate}-${endDate}.pdf`;
      a.download = fileName;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(error.message || 'Error al generar el PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Si es superadmin y no ha seleccionado cooperativa, mostrar mensaje
  if (user?.role === 'SUPER_ADMIN' && !coopId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Truck className="h-16 w-16 text-gray-400" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Selecciona una cooperativa</h3>
          <p className="text-gray-500 mt-1">Para ver la hoja de ruta, primero selecciona una cooperativa en el menú lateral.</p>
        </div>
      </div>
    );
  }

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

            <div className="flex gap-2">
              <Button type="submit" className="flex items-center gap-2" disabled={loading}>
                <Search className="h-4 w-4" />
                Buscar
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex items-center gap-2" 
                disabled={generatingPdf || !groupId || (!date && !(startDate && endDate))}
                onClick={handleGeneratePdf}
              >
                {generatingPdf ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4" />
                    Generar PDF
                  </>
                )}
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
                          <TableCell>{getStatusLabel(t.status) || '-'}</TableCell>
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
