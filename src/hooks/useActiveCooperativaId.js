import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

export default function useActiveCooperativaId() {
  const { cooperativa: activeCooperativa, user } = useAuth();
  const location = useLocation();

  return useMemo(() => {
    let coopId = activeCooperativa?.id || activeCooperativa?._id || null;
    if (!coopId) {
      try {
        const params = new URLSearchParams(location.search);
        coopId = params.get('cooperativaId') || null;
      } catch (e) {
        coopId = null;
      }
    }
    if (!coopId && user?.cooperativaId) coopId = user.cooperativaId;
    if (!coopId) coopId = localStorage.getItem('activeCooperativaId') || null;
    return coopId;
  }, [activeCooperativa, user, location.search]);
}
