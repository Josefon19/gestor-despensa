process.env.JWT_SECRET = 'prueba-notificaciones';
jest.mock('../src/models/DispositivoPush', () => ({ findOneAndUpdate: jest.fn(), deleteMany: jest.fn(), deleteOne: jest.fn(), updateOne: jest.fn() }));
jest.mock('../src/services/notificaciones', () => ({ enviar: jest.fn(), mensajeria: jest.fn() }));
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');
const Dispositivo = require('../src/models/DispositivoPush');
const { enviar } = require('../src/services/notificaciones');
const usuario = '507f1f77bcf86cd799439011';
const sesion = jwt.sign({ id: usuario }, process.env.JWT_SECRET, { expiresIn: '1h' });
const instalacionId = 'a'.repeat(32);
const datos = { instalacionId, token: 'token-fcm-prueba'.repeat(3), anticipacion: 2, zonaHoraria: 'America/Mexico_City' };
const consulta = (metodo, ruta) => request(app)[metodo]('/api/notificaciones' + ruta).set('Authorization', `Bearer ${sesion}`);
beforeEach(() => jest.resetAllMocks());
test('las notificaciones requieren sesión', async () => {
  expect((await request(app).post('/api/notificaciones/dispositivos').send(datos)).status).toBe(401);
});
test('registra solo para el propietario del JWT y no devuelve el token', async () => {
  const res = await consulta('post', '/dispositivos').send({ ...datos, usuario: 'otro' });
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ ok: true });
  expect(Dispositivo.findOneAndUpdate).toHaveBeenCalledWith({ token: datos.token }, { $set: { usuario, instalacionId, anticipacion: 2, zonaHoraria: datos.zonaHoraria } }, expect.objectContaining({ upsert: true }));
  expect(Dispositivo.deleteMany).toHaveBeenCalledWith({ usuario, instalacionId, token: { $ne: datos.token } });
});
test.each([{ token: {} }, { anticipacion: 8 }, { anticipacion: 1.5 }, { zonaHoraria: 'ninguna' }, { instalacionId: { $ne: '' } }])('rechaza configuración inválida %j', async (cambio) => {
  expect((await consulta('post', '/dispositivos').send({ ...datos, ...cambio })).status).toBe(400);
  expect(Dispositivo.findOneAndUpdate).not.toHaveBeenCalled();
});
test('desvincula solo dispositivos propios', async () => {
  expect((await consulta('delete', '/dispositivos/' + instalacionId)).status).toBe(200);
  expect(Dispositivo.deleteMany).toHaveBeenCalledWith({ usuario, instalacionId });
});
test('la prueba tiene límite de frecuencia y no permite un destinatario arbitrario', async () => {
  Dispositivo.findOneAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
  expect((await consulta('post', '/prueba').send(datos)).status).toBe(429);
  expect(enviar).not.toHaveBeenCalled();
  expect(Dispositivo.findOneAndUpdate.mock.calls[0][0]).toEqual(expect.objectContaining({ usuario, instalacionId }));
});
test('la prueba utiliza el dispositivo propio almacenado', async () => {
  const propio = { usuario, instalacionId, token: 'guardado' };
  Dispositivo.findOneAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(propio) });
  expect((await consulta('post', '/prueba').send({ ...datos, token: 'ajeno' })).status).toBe(200);
  expect(enviar).toHaveBeenCalledWith(propio, true);
});
