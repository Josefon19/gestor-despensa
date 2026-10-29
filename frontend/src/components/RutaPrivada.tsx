import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { obtenerToken } from '../services/api';

export default function RutaPrivada({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>();
  const { pathname } = useLocation();

  useEffect(() => {
    let activo = true;
    obtenerToken().then((actual) => { if (activo) setToken(actual); })
      .catch(() => { if (activo) setToken(null); });
    return () => { activo = false; };
  }, [pathname]);

  if (token === undefined) return null;
  // Ionic conserva páginas: una nueva sesión debe reconstruir sus borradores y perfil.
  return token ? <Fragment key={token}>{children}</Fragment>
    : pathname.startsWith('/home') ? <Navigate to="/login" replace /> : null;
}
