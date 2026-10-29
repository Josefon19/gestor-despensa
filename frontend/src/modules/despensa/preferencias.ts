import type { PreferenciasDespensa } from './types';
export const PREFERENCIAS_INICIALES: PreferenciasDespensa = { diasAlimentos: 3, diasPreparaciones: 3, anticipacion: 2 };
export function normalizarPreferencias(datos: Partial<PreferenciasDespensa> | null): PreferenciasDespensa {
  const entero = (valor: unknown, max: number, defecto: number) => Number.isInteger(valor) && Number(valor) >= 1 && Number(valor) <= max ? Number(valor) : defecto;
  return {
    diasAlimentos: entero(datos?.diasAlimentos, 30, 3),
    diasPreparaciones: entero(datos?.diasPreparaciones, 4, 3),
    anticipacion: entero(datos?.anticipacion, 7, 2),
  };
}
