import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { operationService } from '@/services';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Users, CheckCircle, Clock, QrCode, Search, Phone, MapPin, Camera, Keyboard } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function DriverManifest() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scanMode, setScanMode] = useState('camera'); // 'camera' o 'manual'
  const [cameraError, setCameraError] = useState(null);
  const scannerRef = useRef(null);
  const qrScannerInstanceRef = useRef(null);

  useEffect(() => {
    loadManifest();
  }, [tripId]);

  useEffect(() => {
    // Inicializar escáner cuando el modo es cámara y el diálogo está abierto
    if (showQRScanner && scanMode === 'camera' && scannerRef.current && !qrScannerInstanceRef.current) {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7] // Todos los formatos QR
      };

      const scanner = new Html5QrcodeScanner('qr-reader', config, false);
      
      scanner.render(
        (decodedText) => {
          // Éxito al escanear
          handleValidateQRWithCode(decodedText);
          // Limpiar el escáner después de escanear
          if (qrScannerInstanceRef.current) {
            qrScannerInstanceRef.current.clear().catch(console.error);
            qrScannerInstanceRef.current = null;
          }
        },
        (error) => {
          // Error al escanear (se ejecuta constantemente, no es un error real)
          // Solo logueamos errores críticos
          if (error && !error.includes('NotFoundException')) {
            console.warn('QR Scanner:', error);
          }
        }
      );

      qrScannerInstanceRef.current = scanner;
    }

    // Limpiar el escáner cuando se cambia de modo o se cierra el diálogo
    return () => {
      if (qrScannerInstanceRef.current) {
        qrScannerInstanceRef.current.clear().catch(console.error);
        qrScannerInstanceRef.current = null;
      }
    };
  }, [showQRScanner, scanMode]);

  const loadManifest = async () => {
    try {
      const response = await operationService.getManifest(tripId);
      setManifest(response.data.data);
    } catch (error) {
      toast.error('Error al cargar el manifiesto');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateQR = async () => {
    if (!qrCode.trim()) {
      toast.error('Por favor ingresa un código QR');
      return;
    }

    setValidating(true);
    try {
      const response = await operationService.validateQR({
        qrCode: qrCode.trim(),
        tripId
      });

      // Mostrar mensaje de éxito con detalles
      if (response.data.success) {
        const ticketData = response.data.data;
        
        // Mensaje de éxito detallado
        toast.success(
          `Ticket validado correctamente\n` +
          `Pasajero: ${ticketData.passenger || 'N/A'}\n` +
          `Asiento: ${ticketData.seatNumber || 'N/A'}`,
          { duration: 5000 }
        );
        
        // Opcional: mostrar info adicional en consola
        console.log('TICKET VÁLIDO:', {
          pasajero: ticketData.passenger,
          cedula: ticketData.cedula,
          asiento: ticketData.seatNumber,
          origen: ticketData.boardingStop,
          destino: ticketData.dropoffStop
        });
      } else {
        toast.success(response.data.message || 'Ticket validado exitosamente');
      }

      setQrCode('');
      setShowQRScanner(false);
      loadManifest(); // Recargar el manifiesto
    } catch (error) {
      console.error('❌ Error validando QR:', error);
      
      if (error.response) {
        // El servidor respondió con un error
        const errorMessage = error.response.data?.error || 
                            error.response.data?.message || 
                            'Error al validar el ticket';
        
        // Mostrar mensaje según el tipo de error HTTP
        switch (error.response.status) {
          case 404:
            toast.error(`🔍 ${errorMessage}`, { 
              duration: 4000,
              icon: '❌' 
            });
            break;
          case 400:
            toast.error(`⚠️ ${errorMessage}`, { 
              duration: 4000,
            });
            break;
          case 403:
            toast.error(`🔒 ${errorMessage}`, { 
              duration: 4000 
            });
            break;
          default:
            toast.error(errorMessage, { duration: 4000 });
        }
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        toast.error('❌ No hay respuesta del servidor. Verifica tu conexión.', {
          duration: 4000
        });
      } else {
        // Error al configurar la petición
        toast.error('❌ Error al enviar la solicitud', {
          duration: 4000
        });
      }
    } finally {
      setValidating(false);
    }
  };

  const handleValidateQRWithCode = async (code) => {
    if (!code || !code.trim()) {
      toast.error('❌ Código QR inválido o vacío');
      return;
    }

    setValidating(true);
    try {
      const response = await operationService.validateQR({
        qrCode: code.trim(),
        tripId
      });

      // Mostrar mensaje de éxito con detalles
      if (response.data.success) {
        const ticketData = response.data.data;
        
        // Mensaje de éxito detallado
        toast.success(
          `Ticket validado correctamente\n` +
          `Pasajero: ${ticketData.passenger || 'N/A'}\n` +
          `Asiento: ${ticketData.seatNumber || 'N/A'}`,
          { duration: 5000 }
        );
        
      } else {
        toast.success(response.data.message || 'Ticket validado exitosamente');
      }

      setQrCode('');
      setShowQRScanner(false);
      setScanMode('camera');
      setCameraError(null);
      loadManifest(); // Recargar el manifiesto
    } catch (error) {
      
      if (error.response) {
        const errorMessage = error.response.data?.error || 
                            error.response.data?.message || 
                            'Error al validar el ticket';
        
        switch (error.response.status) {
          case 404:
            toast.error(`🔍 ${errorMessage}`, { 
              duration: 4000,
              icon: '❌' 
            });
            break;
          case 400:
            toast.error(`⚠️ ${errorMessage}`, { 
              duration: 4000,
              icon: '⏰' 
            });
            break;
          case 403:
            toast.error(`🔒 ${errorMessage}`, { 
              duration: 4000 
            });
            break;
          default:
            toast.error(errorMessage, { duration: 4000 });
        }
      } else if (error.request) {
        toast.error('❌ No hay respuesta del servidor. Verifica tu conexión.', {
          duration: 4000
        });
      } else {
        toast.error('❌ Error al enviar la solicitud', {
          duration: 4000
        });
      }
      // No cerrar el diálogo en caso de error para permitir reintentar
    } finally {
      setValidating(false);
    }
  };

  // Filtrar tickets según búsqueda
  const filteredTickets = manifest?.tickets?.filter(ticket => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      ticket.passengerName?.toLowerCase().includes(search) ||
      ticket.passengerCedula?.toLowerCase().includes(search) ||
      ticket.seatNumber?.toString().includes(search)
    );
  }) || [];

  if (loading) {
    return <div className="text-center py-8">Cargando manifiesto...</div>;
  }

  if (!manifest) {
    return <div className="text-center py-8">No se encontró el manifiesto</div>;
  }

  const usedTickets = manifest.tickets?.filter(t => t.status === 'USED').length || 0;
  const confirmedTickets = manifest.tickets?.filter(t => 
    t.status === 'CONFIRMED' || t.status === 'PAID'
  ).length || 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manifiesto de Pasajeros</h1>
          <p className="text-gray-600">
            {manifest.trip?.frequency?.route?.name || 
             `${manifest.trip?.frequency?.route?.origin || ''} - ${manifest.trip?.frequency?.route?.destination || ''}`}
          </p>
        </div>
        <Button onClick={() => setShowQRScanner(true)} size="lg">
          <QrCode className="h-5 w-5 mr-2" />
          Escanear QR
        </Button>
      </div>

      {/* Información del viaje */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Pasajeros</p>
                <p className="text-3xl font-bold">{manifest.tickets?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Abordados</p>
                <p className="text-3xl font-bold">{usedTickets}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pendientes</p>
                <p className="text-3xl font-bold">{confirmedTickets}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buscador */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre, cédula o asiento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de pasajeros */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pasajeros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Asiento</th>
                  <th className="text-left p-3">Pasajero</th>
                  <th className="text-left p-3">Cédula</th>
                  <th className="text-left p-3">Teléfono</th>
                  <th className="text-left p-3">Aborda</th>
                  <th className="text-left p-3">Desciende</th>
                  <th className="text-left p-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center p-8 text-gray-500">
                      {searchTerm ? 'No se encontraron pasajeros' : 'No hay pasajeros registrados'}
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-semibold">{ticket.seatNumber}</td>
                      <td className="p-3">{ticket.passengerName || 'N/A'}</td>
                      <td className="p-3">{ticket.passengerCedula || 'N/A'}</td>
                      <td className="p-3">
                        {ticket.passengerPhone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {ticket.passengerPhone}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {ticket.boardingStop || 'N/A'}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {ticket.dropoffStop || 'N/A'}
                        </div>
                      </td>
                      <td className="p-3">
                        {ticket.status === 'USED' ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            ✓ Abordado
                          </span>
                        ) : ticket.status === 'CONFIRMED' || ticket.status === 'PAID' ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                            ⏱ Pendiente
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                            {ticket.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Viaje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Fecha</p>
              <p className="font-semibold">
                {manifest.trip?.date 
                  ? format(new Date(manifest.trip.date), 'PPP', { locale: es })
                  : 'Fecha no disponible'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Hora de salida</p>
              <p className="font-semibold">{manifest.trip?.departureTime || manifest.trip?.frequency?.departureTime || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bus</p>
              <p className="font-semibold">
                {manifest.trip?.bus?.placa || manifest.trip?.bus?.plate || 'N/A'}
                {manifest.trip?.bus?.numeroInterno && ` (${manifest.trip.bus.numeroInterno})`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Chofer</p>
              <p className="font-semibold">
                {manifest.trip?.driver?.firstName || manifest.trip?.driver?.nombre || ''} {manifest.trip?.driver?.lastName || manifest.trip?.driver?.apellido || ''}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para escanear QR */}
      <Dialog open={showQRScanner} onOpenChange={(open) => {
        setShowQRScanner(open);
        if (!open) {
          setQrCode('');
          setScanMode('camera');
          setCameraError(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Validar Ticket QR</DialogTitle>
            <DialogDescription>
              Escanea el código QR del ticket con la cámara o ingrésalo manualmente
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={scanMode} onValueChange={setScanMode} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera">
                <Camera className="h-4 w-4 mr-2" />
                Cámara
              </TabsTrigger>
              <TabsTrigger value="manual">
                <Keyboard className="h-4 w-4 mr-2" />
                Manual
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="camera" className="space-y-4">
              <div id="qr-reader" ref={scannerRef} className="w-full"></div>
              
              {validating && (
                <div className="text-center">
                  <p className="text-sm text-gray-600">Validando ticket...</p>
                </div>
              )}
              
              <p className="text-xs text-gray-500 text-center">
                Enfoca el código QR del ticket en el recuadro de la cámara
              </p>
            </TabsContent>
            
            <TabsContent value="manual" className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Código QR del ticket..."
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleValidateQR();
                  }}
                  autoFocus
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleValidateQR}
                  disabled={validating || !qrCode.trim()}
                  className="flex-1"
                >
                  {validating ? 'Validando...' : 'Validar Ticket'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowQRScanner(false);
                    setQrCode('');
                    setScanMode('camera');
                  }}
                  disabled={validating}
                >
                  Cancelar
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
