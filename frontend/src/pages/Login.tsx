import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonButton, IonContent, IonHeader, IonInput, IonPage, IonTitle, IonToolbar, useIonToast } from '@ionic/react';
import { iniciarSesion } from '../services/auth';

export default function Login() {
  const navigate = useNavigate();
  const [mostrarToast] = useIonToast();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);

  const entrar = async () => {
    if (!correo.trim() || !password) {
      mostrarToast({ message: 'Escribe tu correo y contraseña', duration: 2500, color: 'warning', position: 'top' });
      return;
    }
    setEnviando(true);
    try {
      await iniciarSesion(correo.trim(), password);
      navigate('/home', { replace: true });
    } catch (e) {
      mostrarToast({
        message: e instanceof Error ? e.message : 'Error al iniciar sesión',
        duration: 2500, color: 'danger', position: 'top',
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Iniciar sesión</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonInput
          label="Correo electrónico" labelPlacement="floating" fill="outline" type="email"
          autocomplete="email" className="ion-margin-bottom"
          value={correo} onIonInput={(e) => setCorreo(e.detail.value ?? '')}
        />
        <IonInput
          label="Contraseña" labelPlacement="floating" fill="outline" type="password"
          className="ion-margin-bottom"
          value={password} onIonInput={(e) => setPassword(e.detail.value ?? '')}
          onKeyUp={(e) => e.key === 'Enter' && entrar()}
        />

        <IonButton expand="block" disabled={enviando} onClick={entrar}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </IonButton>
        <IonButton expand="block" fill="clear" routerLink="/registro">
          Crear una cuenta
        </IonButton>
        <IonButton expand="block" fill="clear" size="small" routerLink="/aviso-privacidad">
          Aviso de Privacidad
        </IonButton>
      </IonContent>
    </IonPage>
  );
}