import type { EstadoFecha } from './types';

// Días de calendario locales: evita desfases por UTC y horario de verano.
export function hoyLocal(ahora = new Date()): string {
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
}
export function sumarDias(fecha: string, dias: number): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const resultado = new Date(Date.UTC(anio, mes - 1, dia + dias));
  return resultado.toISOString().slice(0, 10);
}
export function diasRestantes(fecha: string, hoy = hoyLocal()): number | null {
  if (!fecha) return null;
  const dia = (valor: string) => {
    const [anio, mes, numero] = valor.split('-').map(Number);
    return Date.UTC(anio, mes - 1, numero);
  };
  return Math.round((dia(fecha) - dia(hoy)) / 86_400_000);
}
export function estadoFecha(fecha: string, anticipacion: number, hoy = hoyLocal()): EstadoFecha {
  const dias = diasRestantes(fecha, hoy);
  if (dias === null) return 'sinFecha';
  if (dias < 0) return 'vencido';
  return dias <= anticipacion ? 'pronto' : 'enFecha';
}
export function textoFecha(fecha: string, hoy = hoyLocal()): string {
  const dias = diasRestantes(fecha, hoy);
  if (dias === null) return 'Sin fecha registrada';
  if (dias < 0) return `Fecha vencida hace ${Math.abs(dias)} ${dias === -1 ? 'día' : 'días'}`;
  if (dias === 0) return 'La fecha límite es hoy';
  return `${dias === 1 ? 'Falta' : 'Faltan'} ${dias} ${dias === 1 ? 'día' : 'días'}`;
}
