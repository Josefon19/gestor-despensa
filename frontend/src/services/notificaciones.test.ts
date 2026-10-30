import { beforeEach, expect, it, vi } from 'vitest';
import { Preferences } from '@capacitor/preferences';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { peticion } from './api';
import { desactivarPush, prepararPush, renovarPush } from './notificaciones';
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => 'android' } }));
vi.mock('@capacitor/preferences', () => ({ Preferences: { get: vi.fn(), set: vi.fn(), remove: vi.fn() } }));
vi.mock('@capacitor-firebase/messaging', () => ({ FirebaseMessaging: { getToken: vi.fn(), deleteToken: vi.fn(), requestPermissions: vi.fn(), checkPermissions: vi.fn(), createChannel: vi.fn(), removeAllDeliveredNotifications: vi.fn() } }));
vi.mock('./api', () => ({ peticion: vi.fn() }));
const valores = new Map<string, string>();
beforeEach(() => {
  vi.resetAllMocks(); valores.clear();
  valores.set('despensa-instalacion', 'a'.repeat(32));
  vi.mocked(Preferences.get).mockImplementation(async ({ key }) => ({ value: valores.get(key) ?? null }));
  vi.mocked(Preferences.set).mockImplementation(async ({ key, value }) => { valores.set(key, value); });
  vi.mocked(Preferences.remove).mockImplementation(async ({ key }) => { valores.delete(key); });
  vi.mocked(FirebaseMessaging.checkPermissions).mockResolvedValue({ receive: 'granted' });
  vi.mocked(FirebaseMessaging.requestPermissions).mockResolvedValue({ receive: 'granted' });
  vi.mocked(FirebaseMessaging.getToken).mockResolvedValue({ token: 'token-nativo' });
  vi.mocked(FirebaseMessaging.removeAllDeliveredNotifications).mockResolvedValue();
});
it('no solicita permisos ni registra el teléfono sin activación voluntaria', async () => {
  expect(await prepararPush('cuenta', 2)).toBe(false);
  expect(FirebaseMessaging.requestPermissions).not.toHaveBeenCalled();
  expect(FirebaseMessaging.getToken).not.toHaveBeenCalled();
  expect(peticion).not.toHaveBeenCalled();
});
it('al activar rota el token anterior y registra con la anticipación guardada', async () => {
  valores.set('despensa-push-usuario', 'cuenta-anterior');
  expect(await prepararPush('cuenta', 3, true)).toBe(true);
  expect(FirebaseMessaging.deleteToken).toHaveBeenCalledOnce();
  expect(peticion).toHaveBeenCalledWith('/notificaciones/dispositivos', expect.objectContaining({ conToken: true, cuerpo: expect.objectContaining({ anticipacion: 3, token: 'token-nativo', instalacionId: 'a'.repeat(32) }) }));
  expect(valores.get('despensa-push-usuario')).toBe('cuenta');
});
it('un permiso denegado no activa ni registra avisos', async () => {
  vi.mocked(FirebaseMessaging.requestPermissions).mockResolvedValue({ receive: 'denied' });
  await expect(prepararPush('cuenta', 2, true)).rejects.toThrow('Permite');
  expect(peticion).not.toHaveBeenCalled();
});
it('restaura avisos existentes sin preguntar permisos de nuevo', async () => {
  valores.set('despensa-push-usuario', 'cuenta');
  expect(await prepararPush('cuenta', 7)).toBe(true);
  expect(FirebaseMessaging.requestPermissions).not.toHaveBeenCalled();
  expect(FirebaseMessaging.deleteToken).not.toHaveBeenCalled();
});
it('si el servidor está desconectado, invalida el token nativo al salir y evita renovaciones tardías', async () => {
  await prepararPush('cuenta', 2, true);
  vi.mocked(peticion).mockRejectedValue(new Error('sin conexión'));
  await desactivarPush();
  expect(valores.get('despensa-push-usuario')).toBeUndefined();
  expect(FirebaseMessaging.removeAllDeliveredNotifications).toHaveBeenCalled();
  vi.mocked(peticion).mockClear();
  await renovarPush('cuenta', 2, 'renovacion-tardia');
  expect(peticion).not.toHaveBeenCalled();
});
it('no da por desactivados los avisos si falla tanto el servidor como Firebase', async () => {
  valores.set('despensa-push-usuario', 'cuenta');
  vi.mocked(peticion).mockRejectedValue(new Error('sin conexión'));
  vi.mocked(FirebaseMessaging.deleteToken).mockRejectedValue(new Error('sin conexión'));
  await expect(desactivarPush()).rejects.toThrow('Conéctate');
  expect(valores.get('despensa-push-usuario')).toBe('cuenta');
});
