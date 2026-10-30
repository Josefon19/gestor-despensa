import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { peticion } from './api';

const CLAVE = 'despensa-push-usuario';
let propietario = '';
let cola: Promise<unknown> = Promise.resolve();
function exclusivo<T>(accion: () => Promise<T>): Promise<T> {
  const siguiente = cola.then(accion, accion);
  cola = siguiente.catch(() => undefined);
  return siguiente;
}
export const pushDisponible = () => Capacitor.getPlatform() === 'android';
export async function instalacionId() {
  const anterior = (await Preferences.get({ key: 'despensa-instalacion' })).value;
  if (anterior && /^[a-f0-9]{32}$/.test(anterior)) return anterior;
  const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (n) => n.toString(16).padStart(2, '0')).join('');
  await Preferences.set({ key: 'despensa-instalacion', value: id });
  return id;
}
async function registrar(usuario: string, anticipacion: number, token?: string) {
  if (propietario !== usuario) return;
  const credencial = token ?? (await FirebaseMessaging.getToken()).token;
  await peticion('/notificaciones/dispositivos', { metodo: 'POST', conToken: true, cuerpo: {
    instalacionId: await instalacionId(), token: credencial, anticipacion,
    zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Mexico_City',
  } });
}
export function prepararPush(usuario: string, anticipacion: number, solicitar = false) {
  return exclusivo(async () => {
    if (!pushDisponible()) return false;
    propietario = usuario;
    const anterior = (await Preferences.get({ key: CLAVE })).value;
    if (!solicitar && anterior !== usuario) return false;
    const permiso = solicitar ? await FirebaseMessaging.requestPermissions() : await FirebaseMessaging.checkPermissions();
    if (permiso.receive !== 'granted') {
      if (solicitar) throw new Error('Permite las notificaciones en los ajustes de Android para recibir avisos.');
      return false;
    }
    if (anterior !== usuario) await FirebaseMessaging.deleteToken();
    await FirebaseMessaging.createChannel({ id: 'despensa-alertas', name: 'Fechas de despensa', description: 'Avisos de fechas vencidas y próximas', importance: 4, visibility: 0 });
    await registrar(usuario, anticipacion);
    await Preferences.set({ key: CLAVE, value: usuario });
    return true;
  });
}
export function renovarPush(usuario: string, anticipacion: number, token: string) {
  return exclusivo(async () => {
    if (propietario === usuario && (await Preferences.get({ key: CLAVE })).value === usuario) await registrar(usuario, anticipacion, token);
  });
}
export function desactivarPush() {
  propietario = '';
  return exclusivo(async () => {
    if (!pushDisponible()) return;
    propietario = '';
    // Se intenta desvincular antes de borrar el JWT; borrar el token nativo protege también sin conexión al servidor.
    let servidor = false;
    try {
      await peticion(`/notificaciones/dispositivos/${await instalacionId()}`, { metodo: 'DELETE', conToken: true });
      servidor = true;
    } catch { /* El borrado nativo invalida el destino aunque el servidor esté desconectado. */ }
    let nativo = false;
    try { await FirebaseMessaging.deleteToken(); nativo = true; } catch { /* Se comprueba junto al servidor. */ }
    if (!servidor && !nativo) throw new Error('Conéctate a internet para desactivar los avisos antes de cerrar sesión.');
    await Preferences.remove({ key: CLAVE });
    await FirebaseMessaging.removeAllDeliveredNotifications().catch(() => undefined);
  });
}
export async function probarPush() {
  await peticion('/notificaciones/prueba', { metodo: 'POST', conToken: true, cuerpo: { instalacionId: await instalacionId() } });
}
