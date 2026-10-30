import { useRef, useState } from 'react';
import { IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonIcon, IonInput, IonModal, IonTitle, IonToolbar } from '@ionic/react';
import { logoGoogle } from 'ionicons/icons';
import { ErrorAPI } from '../services/api';
import { accesoGoogleCancelado, cerrarGoogle, completarAccesoGoogle, googleDisponible, obtenerTokenGoogle } from '../services/google';
import TextoAviso from './TextoAviso';

export default function AccesoGoogle({ disabled, onBusyChange, onSuccess }: {
  disabled: boolean; onBusyChange: (ocupado: boolean) => void; onSuccess: () => void;
}) {
  const [ocupado, setOcupado] = useState(false);
  const [paso, setPaso] = useState<'aviso' | 'vincular' | null>(null);
  const [error, setError] = useState('');
  const [aceptaAviso, setAceptaAviso] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const tokenGoogle = useRef('');
  const enCurso = useRef(false);

  const procesarError = (error: unknown) => {
    if (error instanceof ErrorAPI && error.codigo === 'AVISO_REQUERIDO') { setPaso('aviso'); setError(''); return; }
    if (error instanceof ErrorAPI && error.codigo === 'VINCULAR_PASSWORD') { setPaso('vincular'); setError(error.message); return; }
    if (!accesoGoogleCancelado(error)) setError('No se pudo completar el acceso con Google. Revisa tu conexión e inténtalo de nuevo.');
    if (error instanceof ErrorAPI && !error.codigo) setError(error.message);
  };
  const ejecutar = async (nuevo: boolean) => {
    if (enCurso.current) return;
    if (!nuevo && paso === 'aviso' && !aceptaAviso) return;
    if (!nuevo && paso === 'vincular' && !passwordActual) { setError('Escribe la contraseña de tu cuenta'); return; }
    enCurso.current = true; setOcupado(true); onBusyChange(true); setError('');
    try {
      if (nuevo) { tokenGoogle.current = await obtenerTokenGoogle(); setAceptaAviso(false); setPasswordActual(''); }
      await completarAccesoGoogle(tokenGoogle.current, nuevo ? {} : { aceptaAviso, ...(paso === 'vincular' ? { passwordActual } : {}) });
      tokenGoogle.current = ''; setPasswordActual(''); setPaso(null); onSuccess();
    } catch (error) { procesarError(error); }
    finally { enCurso.current = false; setOcupado(false); onBusyChange(false); }
  };
  const cancelar = () => {
    tokenGoogle.current = ''; setPasswordActual(''); setAceptaAviso(false); setPaso(null); setError('');
    void cerrarGoogle();
  };
  if (!googleDisponible()) return null;
  return <>
    <div className="separador-acceso"><span>o continúa con</span></div>
    <IonButton expand="block" fill="outline" disabled={disabled || ocupado} onClick={() => void ejecutar(true)}>
      <IonIcon slot="start" icon={logoGoogle} />{ocupado ? 'Conectando…' : 'Continuar con Google'}
    </IonButton>
    {error && !paso && <p className="error-formulario" role="alert">{error}</p>}
    <IonModal isOpen={paso !== null} canDismiss={!ocupado} onDidDismiss={cancelar}>
      <div className="ion-page">
        <IonHeader><IonToolbar><IonTitle>{paso === 'aviso' ? 'Crear cuenta con Google' : 'Vincular mi cuenta'}</IonTitle><IonButtons slot="end"><IonButton disabled={ocupado} onClick={() => setPaso(null)}>Cancelar</IonButton></IonButtons></IonToolbar></IonHeader>
        <IonContent><div className="modulo-contenido">
          {paso === 'aviso' ? <>
            <TextoAviso />
            <IonCheckbox checked={aceptaAviso} disabled={ocupado} onIonChange={(e) => setAceptaAviso(e.detail.checked)}>He leído y acepto el Aviso de Privacidad</IonCheckbox>
          </> : <>
            <h1 className="titulo-serif">Conserva tu despensa</h1><p>Ya hay una cuenta con este correo. Introduce la contraseña que usas en esta app para vincular Google y conservar tus alimentos y preparaciones.</p>
            <IonInput label="Contraseña actual de la app" labelPlacement="stacked" type="password" fill="outline" autocomplete="current-password" disabled={ocupado} value={passwordActual} onIonInput={(e) => setPasswordActual(e.detail.value ?? '')} />
          </>}
          {error && <p className="error-formulario" role="alert">{error}</p>}
          <IonButton expand="block" disabled={ocupado || (paso === 'aviso' && !aceptaAviso) || (paso === 'vincular' && !passwordActual)} onClick={() => void ejecutar(false)}>{ocupado ? 'Entrando…' : paso === 'aviso' ? 'Aceptar y crear cuenta' : 'Vincular y entrar'}</IonButton>
        </div></IonContent>
      </div>
    </IonModal>
  </>;
}
