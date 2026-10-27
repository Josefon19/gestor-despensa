import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { cerrarSesion, obtenerPerfil, type Usuario } from '../services/auth';

// Pantalla provisional: aquí se montarán después las pestañas (Inventario, Recetas, Configuración).
export default function Home() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

    useEffect(() => {
    let activo = true;

    obtenerPerfil()
      .then((u) => {
        if (activo) setUsuario(u);
      })
      .catch(async () => {
        if (!activo) return;
        // Token vencido o inválido: se cierra la sesión.
        await cerrarSesion();
        navigate('/login', { replace: true });
      });

    return () => {
      activo = false;
    };
    // Solo al abrir la pantalla; si dependiera de navigate, se repetiría al cambiar de ruta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const salir = async () => {
    await cerrarSesion();
    navigate('/login', { replace: true });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mi despensa</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={salir}>Salir</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h2>Hola, {usuario?.nombre ?? '…'}</h2>
        <p>Sesión iniciada. Aquí irá el inventario.</p>
      </IonContent>
    </IonPage>
  );
}