import { describe, expect, it } from 'vitest';
import { diasRestantes, estadoFecha, hoyLocal, sumarDias, textoFecha } from './fechas';

describe('semáforo de fechas registradas', () => {
  it('calcula el plazo de tres días al cruzar meses y años', () => {
    expect(sumarDias('2026-10-30', 3)).toBe('2026-11-02');
    expect(sumarDias('2026-12-30', 4)).toBe('2027-01-03');
  });
  const hoy = '2026-10-27';
  it('no clasifica los registros sin fecha como frescos', () => {
    expect(diasRestantes('', hoy)).toBeNull();
    expect(estadoFecha('', 2, hoy)).toBe('sinFecha');
  });
  it('distingue ayer, hoy y el límite exacto de anticipación', () => {
    expect(estadoFecha('2026-10-26', 2, hoy)).toBe('vencido');
    expect(estadoFecha(hoy, 2, hoy)).toBe('pronto');
    expect(estadoFecha('2026-10-29', 2, hoy)).toBe('pronto');
    expect(estadoFecha('2026-10-30', 2, hoy)).toBe('enFecha');
  });
  it('respeta los cambios de mes, año y años bisiestos', () => {
    expect(diasRestantes('2027-01-01', '2026-12-31')).toBe(1);
    expect(diasRestantes('2028-03-01', '2028-02-28')).toBe(2);
  });
  it('usa el día local aunque su equivalente UTC sea el siguiente día', () => {
    expect(hoyLocal(new Date(2026, 9, 27, 23, 59))).toBe(hoy);
  });
  it('actualiza la clasificación con la preferencia del usuario', () => {
    expect(estadoFecha('2026-10-30', 2, hoy)).toBe('enFecha');
    expect(estadoFecha('2026-10-30', 3, hoy)).toBe('pronto');
  });
  it('describe fechas vencidas y del día sin recomendar su consumo', () => {
    expect(textoFecha(hoy, hoy)).toBe('La fecha límite es hoy');
    expect(textoFecha('2026-10-26', hoy)).toBe('Fecha vencida hace 1 día');
  });
});
