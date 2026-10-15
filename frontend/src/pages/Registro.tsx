import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonInput, IonModal,
  IonPage, IonTitle, IonToolbar, useIonToast,
} from '@ionic/react';
import TextoAviso from '../components/TextoAviso';
import { registrar } from '../services/auth';

export default function Registro() {
  const navigate = useNavigate();
  const [mostrarToast] = useIonToast();

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [aceptaAviso, setAceptaAviso] = useState(false);
  const [verAviso, setVerAviso] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const aviso = (message: string, color: 'success' | 'danger' | 'warning') =>
    mostrarToast({ message, duration: 2500, color, position: 'top' });

  const validar = (): string | null => {
    if (nombre.trim().length < 2) return 'Escribe tu nombre';
    if (!/^\S+@\S+\.\S+$/.test(correo.trim())) return 'Correo inválido';
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (password !== confirmar) return 'Las contraseñas no coinciden';
    if (!aceptaAviso) return 'Debes aceptar el Aviso de Privacidad';
    return null;
  };

  const enviar = async () => {
    const error = validar();
    if (error) return aviso(error, 'warning');

    setEnviando(true);
    try {
      await registrar({ nombre: nombre.trim(), correo: correo.trim(), password, aceptaAviso });
      aviso('Cuenta creada con éxito', 'success');
      navigate('/home', { replace: true });
    } catch (e) {
      aviso(e instanceof Error ? e.message : 'Error al registrarse', 'danger');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Crear cuenta</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonInput
          label="Nombre" labelPlacement="floating" fill="outline" className="ion-margin-bottom"
          value={nombre} onIonInput={(e) => setNombre(e.detail.value ?? '')}
        />
        <IonInput
          label="Correo electrónico" labelPlacement="floating" fill="outline" type="email"
          autocomplete="email" className="ion-margin-bottom"
          value={correo} onIonInput={(e) => setCorreo(e.detail.value ?? '')}
        />
        <IonInput
          label="Contraseña (mínimo 8 caracteres)" labelPlacement="floating" fill="outline"
          type="password" className="ion-margin-bottom"
          value={password} onIonInput={(e) => setPassword(e.detail.value ?? '')}
        />
        <IonInput
          label="Confirmar contraseña" labelPlacement="floating" fill="outline" type="password"
          className="ion-margin-bottom"
          value={confirmar} onIonInput={(e) => setConfirmar(e.detail.value ?? '')}
        />

        <IonCheckbox
          labelPlacement="end" justify="start"
          checked={aceptaAviso} onIonChange={(e) => setAceptaAviso(e.detail.checked)}
        >
          He leído y acepto el Aviso de Privacidad
        </IonCheckbox>
        <IonButton fill="clear" size="small" onClick={() => setVerAviso(true)}>
          Leer Aviso de Privacidad
        </IonButton>

        <IonButton expand="block" className="ion-margin-top" disabled={!aceptaAviso || enviando} onClick={enviar}>
          {enviando ? 'Creando cuenta…' : 'Registrarme'}
        </IonButton>

        <IonButton expand="block" fill="clear" routerLink="/login">
          Ya tengo cuenta
        </IonButton>

        {/* El aviso se abre en un modal para no perder lo que ya escribiste en el formulario */}
        <IonModal isOpen={verAviso} onDidDismiss={() => setVerAviso(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Aviso de Privacidad</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setVerAviso(false)}>Cerrar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <TextoAviso />
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}