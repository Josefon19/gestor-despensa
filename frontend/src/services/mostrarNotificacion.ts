import { LocalNotifications } from '@capacitor/local-notifications';

export function esAvisoPropio(datos: unknown, usuario: string): boolean {
  return !!datos && typeof datos === 'object' && 'usuarioId' in datos && datos.usuarioId === usuario;
}

// Firebase entrega al listener cuando la app está abierta; Android solo publica
// automáticamente la notificación FCM cuando la app está en segundo plano.
export async function mostrarNotificacion(notification: { title?: string; body?: string; data?: unknown }, usuario: string) {
  if (!esAvisoPropio(notification.data, usuario)) return;
  if ((await LocalNotifications.checkPermissions()).display !== 'granted') throw new Error('Las notificaciones están bloqueadas en Android.');
  await LocalNotifications.schedule({ notifications: [{
    id: 73101, title: notification.title || 'Alertas de despensa',
    body: notification.body || 'Revisa las fechas de tu despensa.',
    channelId: 'despensa-alertas', smallIcon: 'ic_notificacion',
    extra: { usuarioId: usuario, destino: 'alertas' },
    // Es un aviso inmediato, sin alarmas ni permisos de programación exacta.
    isExactNotification: false,
  }] });
}
