import { peticion, guardarToken, borrarToken, obtenerToken } from './api';
import { cerrarGoogle } from './google';
import { desactivarPush } from './notificaciones';

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
}

interface RespuestaAuth {
  token: string;
  usuario: Usuario;
}

export async function registrar(datos: {
  nombre: string;
  correo: string;
  password: string;
  aceptaAviso: boolean;
}): Promise<Usuario> {
  const res = await peticion<RespuestaAuth>('/auth/register', { metodo: 'POST', cuerpo: datos });
  await guardarToken(res.token);
  return res.usuario;
}

export async function iniciarSesion(correo: string, password: string): Promise<Usuario> {
  const res = await peticion<RespuestaAuth>('/auth/login', {
    metodo: 'POST',
    cuerpo: { correo, password },
  });
  await guardarToken(res.token);
  return res.usuario;
}

export async function obtenerPerfil(): Promise<Usuario> {
  const res = await peticion<{ usuario: Usuario }>('/auth/me', { conToken: true });
  return res.usuario;
}

export const cerrarSesion = async () => {
  await desactivarPush();
  await borrarToken();
  await cerrarGoogle();
};
export const haySesion = async () => (await obtenerToken()) !== null;
