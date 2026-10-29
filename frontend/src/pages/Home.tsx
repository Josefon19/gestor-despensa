import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonButton, IonSpinner } from '@ionic/react';
import { cerrarSesion, obtenerPerfil, type Usuario } from '../services/auth';
import PaginaModulo from '../components/PaginaModulo';
import ModulosDespensa from '../modules/despensa/ModulosDespensa';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    let activo = true;
    obtenerPerfil().then((perfil) => { if (activo) setUsuario(perfil); })
      .catch(() => { if (activo) setError(true); });
    return () => { activo = false; };
  }, [intento]);
  const salir = async () => {
    await cerrarSesion();
    navigate('/login', { replace: true });
  };
  if (!usuario) return <PaginaModulo titulo="Mi despensa">
    {error ? <section className="estado-vacio"><h1 className="titulo-serif">No pudimos cargar tu cuenta</h1><p>Revisa tu conexión o vuelve a iniciar sesión.</p><IonButton onClick={() => { setError(false); setIntento((v) => v + 1); }}>Reintentar</IonButton><IonButton fill="clear" onClick={salir}>Volver al inicio de sesión</IonButton></section> : <div className="estado-vacio" role="status"><IonSpinner /><p>Cargando tu despensa…</p></div>}
  </PaginaModulo>;
  return <ModulosDespensa key={usuario.id} usuario={usuario} salir={salir} />;
}
