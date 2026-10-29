import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import FormularioRegistro from './FormularioRegistro';
import type { RegistroDespensa } from '../modules/despensa/types';
import { StackContext } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { hoyLocal, sumarDias } from '../modules/despensa/fechas';
import { subirFoto } from '../services/despensa';

vi.mock('../services/despensa', () => ({ subirFoto: vi.fn() }));

const registro: RegistroDespensa = { id: 'id-atlas', tipo: 'alimento', nombre: 'Arroz', cantidad: 1, unidad: 'kg', lugar: 'Alacena', fechaLimite: '', fechaElaboracion: '', notas: '' };
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); });
describe('guardado del formulario', () => {
  it('preestablece tres días y alinea las etiquetas fuera de los campos de fecha', () => {
    render(<FormularioRegistro tipo="preparacion" guardar={async () => {}} cerrar={vi.fn()} enviando={false} setEnviando={vi.fn()} />);
    const fecha = screen.getByLabelText('Fecha límite planificada') as HTMLInputElement;
    expect(fecha.value).toBe(sumarDias(hoyLocal(), 3));
    expect(fecha.max).toBe(sumarDias(hoyLocal(), 4));
    const anterior = sumarDias(hoyLocal(), -1);
    fireEvent.change(screen.getByLabelText('Fecha de preparación'), { target: { value: anterior } });
    expect(fecha.value).toBe(sumarDias(anterior, 3));
  });
  it('conserva la foto ya subida al reintentar un guardado fallido', async () => {
    const UrlOriginal = URL;
    vi.stubGlobal('URL', class extends UrlOriginal {
      static createObjectURL = vi.fn(() => 'blob:prueba-local');
      static revokeObjectURL = vi.fn();
    });
    const foto = { url: 'https://res.cloudinary.com/prueba/image/upload/foto.png', publicId: 'foto', firma: 'comprobante' };
    vi.mocked(subirFoto).mockResolvedValue(foto);
    const guardar = vi.fn().mockRejectedValueOnce(new Error('Error al guardar registro')).mockResolvedValueOnce(undefined);
    const cerrar = vi.fn();
    const vista = render(<FormularioRegistro tipo="alimento" registro={registro} guardar={guardar} cerrar={cerrar} enviando={false} setEnviando={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Foto opcional'), { target: { files: [new File(['png'], 'foto.png', { type: 'image/png' })] } });
    fireEvent.submit(vista.container.querySelector('form')!);
    await screen.findByText('Error al guardar registro');
    fireEvent.submit(vista.container.querySelector('form')!);
    await waitFor(() => expect(cerrar).toHaveBeenCalledOnce());
    expect(subirFoto).toHaveBeenCalledTimes(1);
    expect(guardar.mock.calls[1][0].foto).toEqual(foto);
  });
  it('rechaza fotos de formatos no permitidos antes de subirlas', () => {
    render(<FormularioRegistro tipo="alimento" registro={registro} guardar={vi.fn()} cerrar={vi.fn()} enviando={false} setEnviando={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Foto opcional'), { target: { files: [new File(['svg'], 'foto.svg', { type: 'image/svg+xml' })] } });
    expect(screen.getByRole('alert').textContent).toContain('JPG, PNG o WebP');
    expect(subirFoto).not.toHaveBeenCalled();
  });
  it.each(['alimento', 'preparacion'] as const)('muestra %s sin registrar el modal como una pantalla de la pestaña', (tipo) => {
    const registrarPagina = vi.fn();
    const vista = render(<IonReactRouter><StackContext.Provider value={{ isInOutlet: () => true, registerIonPage: registrarPagina }}>
      <FormularioRegistro tipo={tipo} guardar={async () => {}} cerrar={vi.fn()} enviando={false} setEnviando={vi.fn()} />
    </StackContext.Provider></IonReactRouter>);
    expect(registrarPagina).not.toHaveBeenCalled();
    expect(vista.container.querySelector('.ion-page-invisible')).toBeNull();
    expect(vista.container.querySelector('form')).not.toBeNull();
  });
  it('espera la confirmación del servidor antes de cerrar y evita envíos repetidos', async () => {
    let confirmar!: () => void;
    const guardar = vi.fn(() => new Promise<void>((resolver) => { confirmar = resolver; }));
    const cerrar = vi.fn();
    const vista = render(<FormularioRegistro tipo="alimento" registro={registro} guardar={guardar} cerrar={cerrar} enviando={false} setEnviando={vi.fn()} />);
    fireEvent.submit(vista.container.querySelector('form')!);
    fireEvent.submit(vista.container.querySelector('form')!);
    expect(guardar).toHaveBeenCalledTimes(1);
    expect(cerrar).not.toHaveBeenCalled();
    confirmar();
    await waitFor(() => expect(cerrar).toHaveBeenCalledOnce());
  });
  it('mantiene el formulario abierto y permite reintentar tras un fallo de red', async () => {
    const guardar = vi.fn().mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValueOnce(undefined);
    const cerrar = vi.fn();
    const vista = render(<FormularioRegistro tipo="alimento" registro={registro} guardar={guardar} cerrar={cerrar} enviando={false} setEnviando={vi.fn()} />);
    fireEvent.submit(vista.container.querySelector('form')!);
    expect(await screen.findByText('Sin conexión')).toBeDefined();
    expect(cerrar).not.toHaveBeenCalled();
    fireEvent.submit(vista.container.querySelector('form')!);
    await waitFor(() => expect(cerrar).toHaveBeenCalledOnce());
    expect(guardar).toHaveBeenCalledTimes(2);
  });
});
