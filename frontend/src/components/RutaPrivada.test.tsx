import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import RutaPrivada from './RutaPrivada';
import { obtenerToken } from '../services/api';

vi.mock('../services/api', () => ({ obtenerToken: vi.fn() }));
afterEach(cleanup);

function Borrador() {
  const [cantidad, setCantidad] = useState(0);
  return <button onClick={() => setCantidad((n) => n + 1)}>Borradores: {cantidad}</button>;
}
function Escenario() {
  const navigate = useNavigate();
  return <><button onClick={() => navigate('/home/alertas')}>Abrir alertas</button>
    <button onClick={() => navigate('/home/inventario')}>Abrir inventario</button>
    <RutaPrivada><Borrador /></RutaPrivada></>;
}
describe('protección de los módulos y aislamiento de sesión', () => {
  it('conserva los borradores entre rutas de una misma sesión', async () => {
    vi.mocked(obtenerToken).mockResolvedValue('sesion-a');
    render(<MemoryRouter initialEntries={['/home/inventario']}><Escenario /></MemoryRouter>);
    fireEvent.click(await screen.findByText('Borradores: 0'));
    fireEvent.click(screen.getByText('Abrir alertas'));
    await waitFor(() => expect(screen.getByText('Borradores: 1')).toBeDefined());
  });
  it('desmonta el contenido al cerrar sesión y lo reinicia para otra cuenta', async () => {
    vi.mocked(obtenerToken).mockResolvedValue('sesion-a');
    render(<MemoryRouter initialEntries={['/home/inventario']}><Escenario /></MemoryRouter>);
    fireEvent.click(await screen.findByText('Borradores: 0'));
    vi.mocked(obtenerToken).mockResolvedValue(null);
    fireEvent.click(screen.getByText('Abrir alertas'));
    await waitFor(() => expect(screen.queryByText('Borradores: 1')).toBeNull());
    vi.mocked(obtenerToken).mockResolvedValue('sesion-b');
    fireEvent.click(screen.getByText('Abrir inventario'));
    expect(await screen.findByText('Borradores: 0')).toBeDefined();
  });
});
