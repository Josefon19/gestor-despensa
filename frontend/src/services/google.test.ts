import { afterEach, describe, expect, it, vi } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { guardarToken, peticion } from './api';
import { cerrarGoogle, completarAccesoGoogle, obtenerTokenGoogle } from './google';
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: vi.fn(() => 'android') } }));
vi.mock('@capacitor-firebase/authentication', () => ({ FirebaseAuthentication: { signInWithGoogle: vi.fn(), getIdToken: vi.fn(), signOut: vi.fn() } }));
vi.mock('./api', () => ({ peticion: vi.fn(), guardarToken: vi.fn() }));
afterEach(() => vi.clearAllMocks());
describe('acceso con Google', () => {
  it('obtiene el token Firebase nativo, no el token OAuth de Google', async () => {
    vi.mocked(FirebaseAuthentication.getIdToken).mockResolvedValue({ token: 'firebase-id-token' });
    expect(await obtenerTokenGoogle()).toBe('firebase-id-token');
    expect(FirebaseAuthentication.signInWithGoogle).toHaveBeenCalledOnce();
    expect(FirebaseAuthentication.getIdToken).toHaveBeenCalledWith({ forceRefresh: true });
  });
  it('guarda únicamente la sesión emitida por nuestro servidor', async () => {
    const usuario = { id: 'mongo-id', nombre: 'Prueba', correo: 'prueba@gmail.com' };
    vi.mocked(peticion).mockResolvedValue({ token: 'jwt-de-la-app', usuario });
    expect(await completarAccesoGoogle('firebase-id-token', { aceptaAviso: true })).toEqual(usuario);
    expect(peticion).toHaveBeenCalledWith('/auth/google', { metodo: 'POST', cuerpo: { idToken: 'firebase-id-token', aceptaAviso: true } });
    expect(guardarToken).toHaveBeenCalledWith('jwt-de-la-app');
  });
  it('no crea sesión si el servidor rechaza el token', async () => {
    vi.mocked(peticion).mockRejectedValueOnce(new Error('No válido'));
    await expect(completarAccesoGoogle('rechazado')).rejects.toThrow();
    expect(guardarToken).not.toHaveBeenCalled();
  });
  it('limpia la sesión nativa al salir', async () => {
    await cerrarGoogle();
    expect(FirebaseAuthentication.signOut).toHaveBeenCalledOnce();
    expect(Capacitor.getPlatform).toHaveBeenCalled();
  });
});
