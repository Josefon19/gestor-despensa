jest.mock('../src/models/DispositivoPush', () => ({ findOneAndUpdate: jest.fn(), updateOne: jest.fn(), deleteOne: jest.fn() }));
jest.mock('../src/models/RegistroDespensa', () => ({ countDocuments: jest.fn() }));
jest.mock('firebase-admin/app', () => ({ getApps: () => [{ name: 'despensa-push' }] }));
jest.mock('firebase-admin/messaging', () => ({ getMessaging: () => ({ send: mockEnviar }) }));
const mockEnviar = jest.fn();
const Dispositivo = require('../src/models/DispositivoPush');
const Registro = require('../src/models/RegistroDespensa');
const { fechaLocal, sumarDias, revisarDispositivo } = require('../src/services/notificaciones');
const dispositivo = { _id: 'dispositivo', usuario: 'propietario', token: 'privado', anticipacion: 3, zonaHoraria: 'America/Mexico_City' };
const ahora = new Date('2026-12-31T14:00:00Z');
beforeEach(() => { jest.resetAllMocks(); Dispositivo.findOneAndUpdate.mockResolvedValue(dispositivo); });
test('usa días del calendario del dispositivo y cruza el año', () => {
  expect(fechaLocal(new Date('2027-01-01T02:00:00Z'), 'America/Mexico_City')).toBe('2026-12-31');
  expect(sumarDias('2026-12-31', 3)).toBe('2027-01-03');
});
test('envía solo por fechas del propietario y marca el día después de enviar', async () => {
  Registro.countDocuments.mockResolvedValue(2);
  await revisarDispositivo(dispositivo, ahora);
  expect(Registro.countDocuments).toHaveBeenCalledWith({ usuario: 'propietario', fechaLimite: { $gt: '', $lte: '2027-01-03' } });
  expect(mockEnviar).toHaveBeenCalledWith(expect.objectContaining({ token: 'privado', data: { usuarioId: 'propietario', destino: 'alertas' } }));
  expect(Dispositivo.updateOne).toHaveBeenCalledWith(expect.objectContaining({ usuario: 'propietario', token: 'privado' }), { $set: { ultimoDiaAvisado: '2026-12-31' } });
});
test('si ya se avisó o hay otro proceso enviando, no vuelve a enviar', async () => {
  Dispositivo.findOneAndUpdate.mockResolvedValue(null);
  await revisarDispositivo(dispositivo, ahora);
  expect(mockEnviar).not.toHaveBeenCalled();
  expect(Registro.countDocuments).not.toHaveBeenCalled();
});
test('sin fechas pendientes no envía', async () => {
  Registro.countDocuments.mockResolvedValue(0);
  await revisarDispositivo(dispositivo, ahora);
  expect(mockEnviar).not.toHaveBeenCalled();
});
test('un fallo de envío libera el bloqueo y permite reintentar', async () => {
  Registro.countDocuments.mockResolvedValue(1);
  mockEnviar.mockRejectedValue(new Error('sin conexión'));
  await expect(revisarDispositivo(dispositivo, ahora)).rejects.toThrow();
  expect(Dispositivo.updateOne).toHaveBeenCalledTimes(1);
  expect(Dispositivo.updateOne).toHaveBeenCalledWith(expect.anything(), { $unset: { bloqueoHasta: 1 } });
  expect(Dispositivo.deleteOne).not.toHaveBeenCalled();
});
test('un token vencido se elimina sin afectar el token renovado ni otra cuenta', async () => {
  Registro.countDocuments.mockResolvedValue(1);
  mockEnviar.mockRejectedValue(Object.assign(new Error(), { code: 'messaging/registration-token-not-registered' }));
  await expect(revisarDispositivo(dispositivo, ahora)).rejects.toThrow();
  expect(Dispositivo.deleteOne).toHaveBeenCalledWith({ _id: 'dispositivo', usuario: 'propietario', token: 'privado' });
});
