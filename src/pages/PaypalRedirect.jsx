import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function PaypalRedirect() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const url = sessionStorage.getItem('paypalApprovalUrl');
    if (!url) {
      toast.error('No se encontró la URL de PayPal.');
      setLoading(false);
      // volver atrás tras unos segundos
      setTimeout(() => navigate(-1), 2000);
      return;
    }

    // limpiar storage para seguridad
    sessionStorage.removeItem('paypalApprovalUrl');

    try {
      // redirigir a PayPal (salimos del dominio de la app)
      window.location.href = url;
    } catch (err) {
      console.error('Error redirigiendo a PayPal:', err);
      toast.error('No se pudo redirigir a PayPal');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Redirigiendo a PayPal...</h2>
      {loading && <p>Se abrirá la página de pago en breve. Si no ocurre, verifica tu bloqueador de popups.</p>}
    </div>
  );
}
