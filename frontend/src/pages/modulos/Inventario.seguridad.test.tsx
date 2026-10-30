import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { IonReactRouter } from '@ionic/react-router';
import Inventario from './Inventario';
const { nombre, notas } = vi.hoisted(() => ({ nombre: '<img src=x onerror="alert(1)">', notas: '<script>window.ataque = true</script>' }));
vi.mock('../../modules/despensa/context', () => ({ useDespensa: () => ({
  registros: [{ id: '507f1f77bcf86cd799439012', tipo: 'alimento', nombre, notas, cantidad: 1, unidad: 'kg', lugar: 'Alacena', fechaLimite: '', fechaElaboracion: '' }],
  anticipacion: 2, cargando: false, errorCarga: '', recargar: vi.fn(), guardar: vi.fn(), eliminar: vi.fn(), preferencias: { diasAlimentos: 3, diasPreparaciones: 3 },
}) }));
afterEach(cleanup);
it('presenta etiquetas maliciosas como texto sin crear scripts ni eventos HTML', async () => {
  const vista = render(<IonReactRouter><Inventario /></IonReactRouter>);
  expect(await screen.findByText(nombre)).toBeDefined();
  expect(screen.getByText(notas)).toBeDefined();
  expect(vista.container.querySelector('script')).toBeNull();
  expect(vista.container.querySelector('[onerror]')).toBeNull();
  expect(vista.container.querySelector('img[src="x"]')).toBeNull();
});
