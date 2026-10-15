import type { NavigateFunction } from 'react-router-dom';

export type FaseCortina = 'oculta' | 'cubriendo' | 'revelando';

// Debe coincidir con la duración de la animación en estilos.css (480ms)
const DURACION_MS = 5000;

let fase: FaseCortina = 'oculta';
const oyentes = new Set<() => void>();

const poner = (nueva: FaseCortina) => {
  fase = nueva;
  oyentes.forEach((avisar) => avisar());
};

export const faseActual = () => fase;
export const suscribirse = (oyente: () => void) => {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
};

const esperar = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

// Cubre la pantalla con la cortina, cambia de ruta y la retira.
export async function irConCortina(navigate: NavigateFunction, ruta: string) {
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (sinMovimiento || fase !== 'oculta') {
    navigate(ruta, { replace: true });
    return;
  }
  poner('cubriendo');
  await esperar(DURACION_MS);
  navigate(ruta, { replace: true });
  await esperar(200); // deja que la pantalla nueva termine de cargar bajo la cortina
  poner('revelando');
  await esperar(DURACION_MS);
  poner('oculta');
}