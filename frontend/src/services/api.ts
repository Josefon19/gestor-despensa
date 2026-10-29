import { Preferences } from '@capacitor/preferences';

//export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://10.0.2.2:3000/api';

const TOKEN_KEY = 'token';

export const guardarToken = (token: string) => Preferences.set({ key: TOKEN_KEY, value: token });
export const borrarToken = () => Preferences.remove({ key: TOKEN_KEY });
export const obtenerToken = async (): Promise<string | null> =>
  (await Preferences.get({ key: TOKEN_KEY })).value;

export async function peticion<T>(
  ruta: string,
  opciones: { metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE'; cuerpo?: unknown; archivo?: File; conToken?: boolean } = {}
): Promise<T> {
  const { metodo = 'GET', cuerpo, archivo, conToken = false } = opciones;
  const headers: Record<string, string> = { 'Content-Type': archivo ? archivo.type : 'application/json' };

  if (conToken) {
    const token = await obtenerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: archivo ?? (cuerpo ? JSON.stringify(cuerpo) : undefined),
      signal: AbortSignal.timeout(archivo ? 45000 : 15000),
    });
  } catch (error) {
    console.error('Error detallado de red:', error);
    throw new Error('No se pudo conectar con el servidor');
  }

  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(datos.mensaje ?? 'Ocurrió un error');
  return datos as T;
}
