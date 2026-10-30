import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IonReactRouter } from '@ionic/react-router';
import Recetas from './Recetas';
import { buscarRecetas, type ResultadoRecetas } from '../../services/recetas';
import type { RegistroDespensa } from '../../modules/despensa/types';
import { hoyLocal, sumarDias } from '../../modules/despensa/fechas';
const { inventario } = vi.hoisted(() => ({ inventario: [] as RegistroDespensa[] }));
vi.mock('../../services/recetas', () => ({ buscarRecetas: vi.fn() }));
vi.mock('../../modules/despensa/context', () => ({ useDespensa: () => ({ registros: inventario, anticipacion: 2, cargando: false, errorCarga: '' }) }));
beforeEach(() => { inventario.length = 0; });
afterEach(() => { cleanup(); vi.resetAllMocks(); });
const montar = () => render(<IonReactRouter><Recetas /></IonReactRouter>);
function escribir(vista: ReturnType<typeof render>) {
  fireEvent.change(vista.getByLabelText('Ingrediente o platillo'), { target: { value: 'chicken' } });
}
it('solo consulta al enviar el formulario y evita búsquedas duplicadas', async () => {
  let resolver!: (r: ResultadoRecetas) => void;
  vi.mocked(buscarRecetas).mockImplementation(() => new Promise((r) => { resolver = r; }));
  const vista = montar();
  expect(buscarRecetas).not.toHaveBeenCalled();
  escribir(vista);
  const formulario = vista.container.querySelector('form')!;
  fireEvent.submit(formulario); fireEvent.submit(formulario);
  expect(buscarRecetas).toHaveBeenCalledOnce();
  expect(buscarRecetas).toHaveBeenCalledWith('chicken');
  resolver({ recetas: [], consultaUsada: 'chicken' });
  expect(await screen.findByText('Sin recetas para esta búsqueda')).toBeDefined();
});
it('muestra resultados y el enlace de preparación de la fuente', async () => {
  vi.mocked(buscarRecetas).mockResolvedValue({ recetas: [{ id: 'r', nombre: 'Chicken with rice', fuente: 'Cocina original', imagen: '', url: 'https://cocina.example/receta', ingredientes: ['Rice'], minutos: null, porciones: 2 }], consultaUsada: 'chicken' });
  const vista = montar(); escribir(vista); fireEvent.submit(vista.container.querySelector('form')!);
  expect(await screen.findByText('Chicken with rice')).toBeDefined();
  expect(screen.getByText('Fuente: Cocina original')).toBeDefined();
  expect(vista.container.querySelector('ion-button[href="https://cocina.example/receta"]')).not.toBeNull();
});
it('muestra el error del servidor y permite volver a buscar', async () => {
  vi.mocked(buscarRecetas).mockRejectedValueOnce(new Error('Límite de búsquedas')).mockResolvedValueOnce({ recetas: [], consultaUsada: 'chicken' });
  const vista = montar(); escribir(vista); fireEvent.submit(vista.container.querySelector('form')!);
  expect(await screen.findByRole('alert')).toHaveTextContent('Límite de búsquedas');
  fireEvent.submit(vista.container.querySelector('form')!);
  await waitFor(() => expect(buscarRecetas).toHaveBeenCalledTimes(2));
});
const alimento = (id: string, nombre: string, dias?: number): RegistroDespensa => ({ id, nombre, tipo: 'alimento', cantidad: 1, unidad: 'kg', lugar: 'Alacena', fechaLimite: dias === undefined ? '' : sumarDias(hoyLocal(), dias), fechaElaboracion: '', notas: '' });
it('incluye recién registrados y alimentos sin fecha; excluye vencidos y preparaciones', async () => {
  inventario.push(alimento('1', 'Pollo', 3), alimento('2', 'Arroz'), alimento('3', 'Leche', -1), { ...alimento('4', 'Sopa', 1), tipo: 'preparacion' }, { ...alimento('5', 'Manzana', 3), cantidad: 0 });
  montar();
  expect(await screen.findByText('Pollo')).toBeDefined();
  expect(screen.getByText('Arroz')).toBeDefined();
  expect(screen.queryByText('Leche')).toBeNull();
  expect(screen.queryByText('Sopa')).toBeNull();
  expect(screen.queryByText('Manzana')).toBeNull();
});
it('permite filtrar próximos y conserva la fecha más cercana al deduplicar', async () => {
  inventario.push(alimento('1', 'Pollo', 1), alimento('2', 'Pollo', 4), alimento('3', 'Arroz'));
  const vista = montar();
  expect(vista.container.querySelectorAll('ion-chip')).toHaveLength(2);
  expect(await screen.findByText('Pollo · Próximo')).toBeDefined();
  fireEvent.change(screen.getByLabelText('Mostrar ingredientes'), { target: { value: 'proximos' } });
  expect(vista.container.querySelectorAll('ion-chip')).toHaveLength(1);
  expect(screen.queryByText('Arroz')).toBeNull();
  fireEvent.click(screen.getByText('Pollo · Próximo'));
  expect(screen.getByLabelText('Ingrediente o platillo')).toHaveValue('Pollo');
  expect(buscarRecetas).not.toHaveBeenCalled();
});
it('muestra qué traducción se utilizó al consultar', async () => {
  vi.mocked(buscarRecetas).mockResolvedValue({ recetas: [], consultaUsada: 'chicken with rice' });
  const vista = montar();
  fireEvent.change(screen.getByLabelText('Ingrediente o platillo'), { target: { value: 'pollo con arroz' } });
  fireEvent.submit(vista.container.querySelector('form')!);
  expect(await screen.findByText('Búsqueda enviada a Edamam: chicken with rice')).toBeDefined();
});
