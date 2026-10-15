import { peticion, guardarToken } from './api';

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