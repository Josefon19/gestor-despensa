import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import DespensaProvider from './DespensaProvider';
import { useDespensa } from './context';
import { listarRegistros, guardarRegistro, eliminarRegistro } from '../../services/despensa';
import type { NuevoRegistro } from './types';
import { Preferences } from '@capacitor/preferences';

vi.mock('../../services/despensa', () => ({ listarRegistros: vi.fn(), guardarRegistro: vi.fn(), eliminarRegistro: vi.fn() }));
const datos: NuevoRegistro = { tipo: 'alimento', nombre: 'Arroz', cantidad: 1, unidad: 'kg', lugar: 'Alacena', fechaLimite: '', fechaElaboracion: '', notas: '' };
const registro = { ...datos, id: 'id-atlas' };
function Escenario() {
  const { registros, cargando, errorCarga, recargar, guardar, eliminar, preferencias, guardarPreferencias } = useDespensa();
  return <><p>{cargando ? 'Cargando' : 'Listo'}</p><p>{errorCarga}</p><p>Registros: {registros.length}</p>
    {registros.map((r) => <p key={r.id}>{r.nombre}</p>)}
    <button onClick={() => void recargar()}>Reintentar</button>
    <button onClick={() => void guardar(datos).catch(() => {})}>Guardar</button>
    <button onClick={() => void eliminar(registro.id).catch(() => {})}>Eliminar</button>
    <p>Plazos: {preferencias.diasAlimentos}/{preferencias.diasPreparaciones}</p>
    <button onClick={() => void guardarPreferencias({ diasAlimentos: 5, diasPreparaciones: 4, anticipacion: 3 })}>Guardar preferencias</button></>;
}
function abrir() {
  return render(<DespensaProvider usuario={{ id: 'cuenta-a', nombre: 'Prueba', correo: 'prueba@example.test' }} salir={async () => {}}><Escenario /></DespensaProvider>);
}
afterEach(() => { cleanup(); vi.resetAllMocks(); });
describe('despensa persistente', () => {
  it('conserva los plazos configurados al volver a abrir la cuenta', async () => {
    vi.mocked(listarRegistros).mockResolvedValue([]);
    const vista = abrir(); await screen.findByText('Listo');
    fireEvent.click(screen.getByText('Guardar preferencias'));
    await screen.findByText('Plazos: 5/4');
    vista.unmount(); abrir();
    expect(await screen.findByText('Plazos: 5/4')).toBeDefined();
    await Preferences.remove({ key: 'despensa-preferencias:cuenta-a' });
  });
  it('recupera los registros al volver a abrir la app', async () => {
    vi.mocked(listarRegistros).mockResolvedValue([registro]);
    const vista = abrir();
    expect(await screen.findByText('Arroz')).toBeDefined();
    vista.unmount();
    abrir();
    expect(await screen.findByText('Arroz')).toBeDefined();
    expect(listarRegistros).toHaveBeenCalledTimes(2);
  });
  it('permite reintentar una carga fallida', async () => {
    vi.mocked(listarRegistros).mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValueOnce([registro]);
    abrir();
    expect(await screen.findByText('Sin conexión')).toBeDefined();
    fireEvent.click(screen.getByText('Reintentar'));
    expect(await screen.findByText('Arroz')).toBeDefined();
    expect(screen.queryByText('Sin conexión')).toBeNull();
  });
  it('no agrega registros si falla el guardado en el servidor', async () => {
    vi.mocked(listarRegistros).mockResolvedValue([]);
    vi.mocked(guardarRegistro).mockRejectedValue(new Error('Sin conexión'));
    abrir(); await screen.findByText('Listo');
    fireEvent.click(screen.getByText('Guardar'));
    await waitFor(() => expect(guardarRegistro).toHaveBeenCalled());
    expect(screen.getByText('Registros: 0')).toBeDefined();
  });
  it('usa el identificador del servidor sin depender de crypto.randomUUID', async () => {
    vi.mocked(listarRegistros).mockResolvedValue([]);
    vi.mocked(guardarRegistro).mockResolvedValue(registro);
    abrir(); await screen.findByText('Listo');
    fireEvent.click(screen.getByText('Guardar'));
    expect(await screen.findByText('Arroz')).toBeDefined();
  });
  it('conserva el registro si el servidor rechaza la eliminación', async () => {
    vi.mocked(listarRegistros).mockResolvedValue([registro]);
    vi.mocked(eliminarRegistro).mockRejectedValue(new Error('Sin conexión'));
    abrir(); await screen.findByText('Arroz');
    fireEvent.click(screen.getByText('Eliminar'));
    await waitFor(() => expect(eliminarRegistro).toHaveBeenCalledWith(registro.id));
    expect(screen.getByText('Arroz')).toBeDefined();
  });
});
