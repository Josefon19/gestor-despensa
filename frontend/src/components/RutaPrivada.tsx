import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { haySesion } from '../services/auth';

export default function RutaPrivada({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<'cargando' | 'si' | 'no'>('cargando');

  useEffect(() => {
    haySesion().then((ok) => setEstado(ok ? 'si' : 'no'));
  }, []);

  if (estado === 'cargando') return null;
  return estado === 'si' ? <>{children}</> : <Navigate to="/login" replace />;
}