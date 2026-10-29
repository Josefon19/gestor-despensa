import { expect, it } from 'vitest';
import { normalizarPreferencias } from './preferencias';
it('preestablece tres días y limita las preparaciones a cuatro', () => {
  expect(normalizarPreferencias(null)).toEqual({ diasAlimentos: 3, diasPreparaciones: 3, anticipacion: 2 });
  expect(normalizarPreferencias({ diasPreparaciones: 4 }).diasPreparaciones).toBe(4);
  expect(normalizarPreferencias({ diasPreparaciones: 5 }).diasPreparaciones).toBe(3);
  expect(normalizarPreferencias({ diasAlimentos: -1 }).diasAlimentos).toBe(3);
});
