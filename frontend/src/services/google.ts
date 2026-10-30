import { Capacitor } from '@capacitor/core';
import { peticion, guardarToken } from './api';
import type { Usuario } from './auth';

export const googleDisponible = () => Capacitor.getPlatform() === 'android';

export async function obtenerTokenGoogle(): Promise<string> {
  if (!googleDisponible()) throw new Error('El acceso con Google está disponible en la app Android');
  const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
  await FirebaseAuthentication.signInWithGoogle();
  const resultado = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
  if (!resultado.token) throw new Error('Google no devolvió una sesión válida. Inténtalo de nuevo.');
  return resultado.token;
}
export async function completarAccesoGoogle(idToken: string, opciones: { aceptaAviso?: boolean; passwordActual?: string } = {}): Promise<Usuario> {
  const resultado = await peticion<{ token: string; usuario: Usuario }>('/auth/google', {
    metodo: 'POST', cuerpo: { idToken, ...opciones },
  });
  await guardarToken(resultado.token);
  return resultado.usuario;
}
export async function cerrarGoogle(): Promise<void> {
  if (!googleDisponible()) return;
  try {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
    await FirebaseAuthentication.signOut();
  } catch { /* La sesión de la app se controla con el JWT del servidor. */ }
}
export function accesoGoogleCancelado(error: unknown): boolean {
  const texto = error instanceof Error ? error.message : String(error);
  return /cancel(?:led|ed|ación|ado)?|user.dismiss/i.test(texto);
}
