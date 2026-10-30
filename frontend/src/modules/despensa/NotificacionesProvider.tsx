import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIonToast } from '@ionic/react';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { LocalNotifications } from '@capacitor/local-notifications';
import { esAvisoPropio, mostrarNotificacion } from '../../services/mostrarNotificacion';
import type { PluginListenerHandle } from '@capacitor/core';
import { desactivarPush, prepararPush, probarPush, pushDisponible, renovarPush } from '../../services/notificaciones';
import { useDespensa } from './context';

const Contexto = createContext({ activo: false, ocupado: false, error: '', disponible: false, activar: async () => {}, desactivar: async () => {}, probar: async () => {} });
export const useNotificaciones = () => useContext(Contexto);
export default function NotificacionesProvider({ children }: { children: ReactNode }) {
  const { usuario, anticipacion, cargando } = useDespensa();
  const [activo, setActivo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const ultimaAnticipacion = useRef(anticipacion);
  ultimaAnticipacion.current = anticipacion;
  const navegar = useNavigate();
  const [toast] = useIonToast();
  useEffect(() => {
    if (!pushDisponible()) return;
    let vigente = true;
    const handles: PluginListenerHandle[] = [];
    const guardar = (handle: PluginListenerHandle) => { if (vigente) handles.push(handle); else void handle.remove(); };
    void FirebaseMessaging.addListener('tokenReceived', ({ token }) => {
      if (vigente) void renovarPush(usuario.id, ultimaAnticipacion.current, token).catch(() => setError('No se pudo actualizar el dispositivo. Pulsa Activar avisos para reintentar.'));
    }).then(guardar).catch(() => setError('No se pudo preparar el servicio de avisos.'));
    void FirebaseMessaging.addListener('notificationReceived', ({ notification }) => {
      if (vigente && esAvisoPropio(notification.data, usuario.id)) {
        void mostrarNotificacion(notification, usuario.id).catch(() => setError('Se recibió el aviso, pero Android no pudo mostrarlo. Revisa los permisos de notificaciones.'));
      }
    }).then(guardar).catch(() => undefined);
    void FirebaseMessaging.addListener('notificationActionPerformed', ({ notification }) => {
      if (vigente && (notification.data as { usuarioId?: string } | undefined)?.usuarioId === usuario.id) navegar('/home/alertas');
    }).then(guardar).catch(() => undefined);
    void LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
      if (vigente && esAvisoPropio(notification.extra, usuario.id)) navegar('/home/alertas');
    }).then(guardar).catch(() => undefined);
    return () => { vigente = false; handles.forEach((handle) => { void handle.remove(); }); };
  }, [usuario.id, navegar, toast]);
  useEffect(() => {
    if (cargando) return;
    let vigente = true;
    void prepararPush(usuario.id, anticipacion).then((valor) => { if (vigente) { setActivo(valor); setError(''); } }).catch((e) => { if (vigente) setError(e instanceof Error ? e.message : 'No se pudieron conectar los avisos.'); });
    return () => { vigente = false; };
  }, [usuario.id, anticipacion, cargando]);
  const ejecutar = async (accion: () => Promise<void>) => {
    setOcupado(true); setError('');
    try { await accion(); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo completar la operación.'); }
    finally { setOcupado(false); }
  };
  return <Contexto.Provider value={{ activo, ocupado, error, disponible: pushDisponible(),
    activar: () => ejecutar(async () => { setActivo(await prepararPush(usuario.id, anticipacion, true)); }),
    desactivar: () => ejecutar(async () => { await desactivarPush(); setActivo(false); }),
    probar: () => ejecutar(async () => { await probarPush(); void toast({ message: 'Prueba enviada a Firebase. Espera unos segundos y revisa la bandeja de notificaciones de Android.', duration: 4500 }); }),
  }}>{children}</Contexto.Provider>;
}
