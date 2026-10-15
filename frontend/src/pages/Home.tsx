import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { cerrarSesion, obtenerPerfil, type Usuario } from '../services/auth';

// Pantalla provisional: aquí se montarán después las pestañas (Inventario, Recetas, Configuración).
export default function Home() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    obtenerPerfil()
      .then(setUsuario)
      .catch(async () => {
        // Token vencido o inválido: se cierra la sesión.
        await cerrarSesion();
        navigate('/login', { replace: true });
      });
  }, [navigate]);

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