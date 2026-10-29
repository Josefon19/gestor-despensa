import { peticion } from './api';
import type { FotoRegistro, NuevoRegistro, RegistroDespensa } from '../modules/despensa/types';

export async function subirFoto(archivo: File): Promise<FotoRegistro> {
  const respuesta = await peticion<{ foto: FotoRegistro }>('/despensa/foto', { metodo: 'POST', archivo, conToken: true });
  return respuesta.foto;
}

export async function listarRegistros(): Promise<RegistroDespensa[]> {
  const respuesta = await peticion<{ registros: RegistroDespensa[] }>('/despensa', { conToken: true });
  return respuesta.registros;
}
export async function guardarRegistro(datos: NuevoRegistro, id?: string): Promise<RegistroDespensa> {
  const respuesta = await peticion<{ registro: RegistroDespensa }>(id ? `/despensa/${encodeURIComponent(id)}` : '/despensa', {
    metodo: id ? 'PUT' : 'POST', cuerpo: datos, conToken: true,
  });
  return respuesta.registro;
}
export async function eliminarRegistro(id: string): Promise<void> {
  await peticion(`/despensa/${encodeURIComponent(id)}`, { metodo: 'DELETE', conToken: true });
}
