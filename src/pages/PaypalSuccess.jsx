import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ticketService, tripService } from '@/services';
import toast from 'react-hot-toast';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function PaypalSuccess() {
  const query = useQuery();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const paymentId = query.get('paymentId') || query.get('paymentID') || query.get('payment_id');
    const payerId = query.get('PayerID') || query.get('payerID') || query.get('PayerId');
    const ticketId = query.get('ticketId');

    const exec = async () => {
      if (!paymentId || !payerId || !ticketId) {
        setError('Parámetros de PayPal faltantes en la URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const resp = await ticketService.executePayPal({ paymentId, payerId, ticketId });
        const ticket = resp.data?.data || resp.data;
        toast.success('Pago aprobado. Revisa tu correo, te enviamos el ticket con PDF.');
        // Intentar obtener info del viaje para mostrar la tarjeta de confirmación
        let trip = null;
        try {
          if (ticket?.tripId) {
            const r = await tripService.getPublicById(ticket.tripId);
            trip = r.data?.data || r.data || null;
          }
        } catch (e) {
          console.warn('No se pudo cargar trip para mostrar confirmación:', e);
        }

        // Navegar a Home pasando el ticket y trip en location.state para mostrar la tarjeta
        navigate('/', { state: { bookingComplete: true, completedBooking: ticket, trip } });
      } catch (err) {
        console.error('Error ejecutando pago PayPal:', err);
        setError(err.response?.data?.message || err.message || 'Error al completar el pago');
        toast.error('Error al completar el pago');
      } finally {
        setLoading(false);
      }
    };

    exec();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Procesando pago PayPal</h2>
      {loading && <p>Espere mientras verificamos la transacción...</p>}
      {!loading && error && (
        <div>
          <p className="text-red-600">{error}</p>
          <button className="mt-4 btn" onClick={() => navigate(-1)}>Volver</button>
        </div>
      )}
    </div>
  );
}
