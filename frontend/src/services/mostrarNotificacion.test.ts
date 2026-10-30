import { beforeEach, expect, it, vi } from 'vitest';
import { LocalNotifications } from '@capacitor/local-notifications';
import { esAvisoPropio, mostrarNotificacion } from './mostrarNotificacion';
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: { checkPermissions: vi.fn(), schedule: vi.fn() } }));
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(LocalNotifications.checkPermissions).mockResolvedValue({ display: 'granted' });
});
it('publica en Android una push recibida con la app abierta sin pedir alarmas', async () => {
  await mostrarNotificacion({ title: 'Prueba', body: 'Recibida', data: { usuarioId: 'propietario' } }, 'propietario');
  expect(LocalNotifications.schedule).toHaveBeenCalledWith({ notifications: [expect.objectContaining({
    title: 'Prueba', body: 'Recibida', channelId: 'despensa-alertas', isExactNotification: false,
    extra: { usuarioId: 'propietario', destino: 'alertas' },
  })] });
});
it('no publica avisos ni abre datos de otra cuenta', async () => {
  await mostrarNotificacion({ data: { usuarioId: 'otra' } }, 'propietario');
  expect(LocalNotifications.schedule).not.toHaveBeenCalled();
  expect(esAvisoPropio(null, 'propietario')).toBe(false);
  expect(esAvisoPropio({}, 'propietario')).toBe(false);
});
it('informa cuando el permiso está bloqueado', async () => {
  vi.mocked(LocalNotifications.checkPermissions).mockResolvedValue({ display: 'denied' });
  await expect(mostrarNotificacion({ data: { usuarioId: 'propietario' } }, 'propietario')).rejects.toThrow('bloqueadas');
  expect(LocalNotifications.schedule).not.toHaveBeenCalled();
});
