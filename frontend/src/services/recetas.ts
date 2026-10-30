import { peticion } from './api';
export interface Receta {
  id: string; nombre: string; imagen: string; url: string; fuente: string;
  ingredientes: string[]; porciones: number | null; minutos: number | null;
}
export interface ResultadoRecetas { recetas: Receta[]; consultaUsada: string }
export async function buscarRecetas(consulta: string): Promise<ResultadoRecetas> {
  return peticion<ResultadoRecetas>(`/recetas?q=${encodeURIComponent(consulta.trim())}`, { conToken: true });
}
