import { useEffect, useState } from 'react';
import { IonButton, IonSelect, IonSelectOption, useIonToast } from '@ionic/react';
import PaginaModulo from '../../components/PaginaModulo';
import { useDespensa } from '../../modules/despensa/context';
import { useNotificaciones } from '../../modules/despensa/NotificacionesProvider';

export default function Configuracion() {
  const { usuario, preferencias, guardarPreferencias, salir } = useDespensa();
  const push = useNotificaciones();
  const [saliendo, setSaliendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [borrador, setBorrador] = useState(preferencias);
  useEffect(() => { setBorrador(preferencias); }, [preferencias]);
  const [toast] = useIonToast();
  const guardar = async () => {
    setGuardando(true);
    try {
      await guardarPreferencias(borrador);
      void toast({ message: 'Preferencias guardadas en este dispositivo', duration: 2200, color: 'success' });
    } catch { void toast({ message: 'No se pudieron guardar las preferencias. Inténtalo de nuevo.', duration: 2500, color: 'danger' }); }
    finally { setGuardando(false); }
  };
  const cerrar = async () => {
    setSaliendo(true);
    try { await salir(); } catch { void toast({ message: 'No se pudo cerrar sesión. Inténtalo de nuevo.', duration: 2500, color: 'danger' }); setSaliendo(false); }
  };
  return <PaginaModulo titulo="Configuración">
    <div className="modulo-intro"><span className="sobretitulo">A TU MANERA</span><h1 className="titulo-serif">Tu cocina, tus preferencias</h1></div>
    <section className="tarjeta-modulo"><h2>Mi cuenta</h2><p><strong>{usuario.nombre}</strong></p><p className="texto-largo">{usuario.correo}</p><IonButton fill="clear" routerLink="/aviso-privacidad">Aviso de privacidad</IonButton></section>
    <section className="tarjeta-modulo formulario-registro"><h2>Fechas y avisos</h2>
      <IonSelect label="Plazo para alimentos nuevos" labelPlacement="stacked" fill="outline" disabled={guardando} value={borrador.diasAlimentos} onIonChange={(e) => setBorrador((p) => ({ ...p, diasAlimentos: Number(e.detail.value) }))}>
        {Array.from({length:30}, (_,i) => i+1).map((dias) => <IonSelectOption key={dias} value={dias}>{dias} {dias === 1 ? 'día' : 'días'}</IonSelectOption>)}
      </IonSelect>
      <IonSelect label="Plazo para preparaciones nuevas" labelPlacement="stacked" fill="outline" disabled={guardando} value={borrador.diasPreparaciones} onIonChange={(e) => setBorrador((p) => ({ ...p, diasPreparaciones: Number(e.detail.value) }))}>
        {[1,2,3,4].map((dias) => <IonSelectOption key={dias} value={dias}>{dias} {dias === 1 ? 'día' : 'días'}</IonSelectOption>)}
      </IonSelect>
      <p>Por defecto, 3 días; las preparaciones admiten hasta 4 días desde su elaboración. Se aplica a registros nuevos, sin cambiar las fechas ya guardadas.</p>
      <IonSelect label="Anticipación de avisos" labelPlacement="stacked" fill="outline" disabled={guardando} value={borrador.anticipacion} onIonChange={(e) => setBorrador((p) => ({ ...p, anticipacion: Number(e.detail.value) }))}>
        {[1,2,3,7].map((dias) => <IonSelectOption key={dias} value={dias}>{dias} {dias === 1 ? 'día' : 'días'} antes</IonSelectOption>)}
      </IonSelect>
      <IonButton expand="block" disabled={guardando} onClick={guardar}>{guardando ? 'Guardando…' : 'Guardar preferencias'}</IonButton>
      <p className="ayuda-campo">Estas preferencias se conservan en este dispositivo para tu cuenta. Los plazos son para organizarte; no certifican la seguridad de los alimentos.</p>
    </section>
    <section className="tarjeta-modulo"><h2>Notificaciones al teléfono</h2>
      <p>{push.disponible ? (push.activo ? 'Avisos activados para esta cuenta en este dispositivo.' : 'Activa los avisos para recibir recordatorios de fechas vencidas y próximas.') : 'Disponibles en la app de Android.'}</p>
      <p>Revisión diaria a las 8:00 a. m., hora de Ciudad de México. Se usa la anticipación guardada arriba. El servidor debe permanecer encendido.</p>
      {push.error && <p role="alert">{push.error}</p>}
      {push.disponible && <>
        <IonButton expand="block" disabled={push.ocupado} onClick={push.activar}>{push.ocupado ? 'Conectando…' : push.activo ? 'Actualizar conexión de avisos' : 'Activar avisos'}</IonButton>
        {push.activo && <><IonButton expand="block" fill="outline" disabled={push.ocupado} onClick={push.probar}>Enviar notificación de prueba</IonButton><IonButton fill="clear" disabled={push.ocupado} onClick={push.desactivar}>Desactivar avisos</IonButton></>}
      </>}
    </section>
    <section className="tarjeta-modulo"><h2>Guardado de tus datos</h2><p>Tus alimentos y preparaciones se guardan en tu cuenta. Las fotos opcionales se almacenan en Cloudinary. Los avisos se envían mediante Firebase y se desvinculan al cerrar sesión.</p></section>
    <IonButton expand="block" fill="outline" color="danger" disabled={saliendo} onClick={cerrar}>{saliendo ? 'Cerrando sesión…' : 'Cerrar sesión'}</IonButton>
  </PaginaModulo>;
}
