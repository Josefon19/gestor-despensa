process.env.JWT_SECRET = 'prueba-recetas';
jest.mock('../src/services/edamam', () => ({ buscarRecetas: jest.fn() }));
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { buscarRecetas } = require('../src/services/edamam');
const propietario = '507f1f77bcf86cd799439011';
const sesion = jwt.sign({ id: propietario }, process.env.JWT_SECRET, { expiresIn: '1h' });
const buscar = (q) => request(app).get('/api/recetas').set('Authorization', `Bearer ${sesion}`).query(q);
let tiempo = Date.now();
beforeEach(() => { jest.clearAllMocks(); tiempo += 61000; jest.spyOn(Date, 'now').mockReturnValue(tiempo); });
afterEach(() => jest.restoreAllMocks());
test('exige sesión', async () => { expect((await request(app).get('/api/recetas?q=chicken')).status).toBe(401); });
test.each([{}, { q: '' }, { q: 'a' }, { q: 'a'.repeat(121) }, { q: ['a', 'b'] }])('valida la consulta %j', async (consulta) => {
  expect((await buscar(consulta)).status).toBe(400);
  expect(buscarRecetas).not.toHaveBeenCalled();
});
test('usa la cuenta del JWT, sin almacenar respuestas en caché', async () => {
  buscarRecetas.mockResolvedValue([{ nombre: 'Chicken' }]);
  const res = await buscar({ q: ' chicken ', usuario: 'ajeno' });
  expect(res.status).toBe(200);
  expect(res.headers['cache-control']).toBe('no-store');
  expect(buscarRecetas).toHaveBeenCalledWith('chicken', propietario);
});
test('limita búsquedas repetidas antes de llamar al proveedor', async () => {
  buscarRecetas.mockResolvedValue([]);
  expect((await buscar({ q: 'chicken' })).status).toBe(200);
  expect((await buscar({ q: 'rice' })).status).toBe(429);
  expect(buscarRecetas).toHaveBeenCalledTimes(1);
});
test('comunica el límite del proveedor', async () => {
  buscarRecetas.mockRejectedValue(Object.assign(new Error('Espera un momento'), { status: 429 }));
  expect((await buscar({ q: 'chicken' })).status).toBe(429);
});
test('traduce ingredientes en español antes de consultar y comunica la consulta usada', async () => {
  buscarRecetas.mockResolvedValue([]);
  const res = await buscar({ q: 'pollo con arroz' });
  expect(buscarRecetas).toHaveBeenCalledWith('chicken with rice', propietario);
  expect(res.body.consultaUsada).toBe('chicken with rice');
});
