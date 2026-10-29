process.env.JWT_SECRET = 'secreto_de_pruebas';
jest.mock('../src/models/RegistroDespensa', () => ({
  find: jest.fn(), create: jest.fn(), findOneAndUpdate: jest.fn(), findOneAndDelete: jest.fn(),
}));
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const Registro = require('../src/models/RegistroDespensa');
const usuario = '507f1f77bcf86cd799439011';
const ajeno = '507f1f77bcf86cd799439012';
const id = '507f1f77bcf86cd799439013';
const token = jwt.sign({ id: usuario }, process.env.JWT_SECRET);
const otroToken = jwt.sign({ id: ajeno }, process.env.JWT_SECRET);
const valido = { tipo: 'alimento', nombre: 'Arroz', cantidad: 2, unidad: 'kg', lugar: 'Alacena', fechaLimite: '2027-01-30', fechaElaboracion: '', notas: '' };
const documento = { ...valido, _id: id, usuario };
const autorizada = (metodo, ruta = '/api/despensa', credencial = token) => request(app)[metodo](ruta).set('Authorization', `Bearer ${credencial}`);

beforeEach(() => jest.resetAllMocks());

describe('despensa privada', () => {
  test('rechaza preparaciones con más de cuatro días y acepta el límite exacto', async () => {
    const datos = { ...valido, tipo: 'preparacion', fechaElaboracion: '2026-10-27', fechaLimite: '2026-11-01' };
    expect((await autorizada('post').send(datos)).status).toBe(400);
    Registro.create.mockResolvedValue({ ...datos, fechaLimite: '2026-10-31', _id: id });
    expect((await autorizada('post').send({ ...datos, fechaLimite: '2026-10-31' })).status).toBe(201);
  });
  test('rechaza fotos sin comprobante de subida de la cuenta', async () => {
    const res = await autorizada('post').send({ ...valido, foto: { url: 'https://res.cloudinary.com/otro/image/upload/foto.jpg', publicId: 'ajeno' } });
    expect(res.status).toBe(400);
    expect(Registro.create).not.toHaveBeenCalled();
  });
  test('la subida de fotos exige autenticación', async () => {
    expect((await request(app).post('/api/despensa/foto').set('Content-Type', 'image/png').send(Buffer.from('foto'))).status).toBe(401);
  });
  test.each(['get', 'post', 'put', 'delete'])('%s exige sesión', async (metodo) => {
    const res = await request(app)[metodo](`/api/despensa${['put', 'delete'].includes(metodo) ? '/' + id : ''}`).send(valido);
    expect(res.status).toBe(401);
  });
  test('lista solo los registros de la cuenta autenticada', async () => {
    Registro.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([documento]) });
    const res = await autorizada('get');
    expect(res.status).toBe(200);
    expect(Registro.find).toHaveBeenCalledWith({ usuario });
    expect(res.body.registros[0]).toEqual({ ...valido, id });
    expect(res.body.registros[0].usuario).toBeUndefined();
  });
  test('crea con el propietario del token y descarta campos u operadores del cliente', async () => {
    Registro.create.mockResolvedValue(documento);
    const res = await autorizada('post').send({ ...valido, usuario: ajeno, $set: { usuario: ajeno }, _id: id });
    expect(res.status).toBe(201);
    expect(Registro.create).toHaveBeenCalledWith({ ...valido, usuario });
  });
  test('actualiza mediante filtro de propietario y valida el documento', async () => {
    Registro.findOneAndUpdate.mockResolvedValue({ ...documento, cantidad: 3 });
    const res = await autorizada('put', `/api/despensa/${id}`).send({ ...valido, cantidad: 3 });
    expect(res.status).toBe(200);
    expect(res.body.registro.cantidad).toBe(3);
    expect(Registro.findOneAndUpdate).toHaveBeenCalledWith({ _id: id, usuario }, { $set: { ...valido, cantidad: 3 } }, { returnDocument: 'after', runValidators: true });
  });
  test('no permite editar un registro de otra cuenta', async () => {
    Registro.findOneAndUpdate.mockResolvedValue(null);
    const res = await autorizada('put', `/api/despensa/${id}`, otroToken).send(valido);
    expect(res.status).toBe(404);
    expect(Registro.findOneAndUpdate.mock.calls[0][0]).toEqual({ _id: id, usuario: ajeno });
  });
  test('no permite borrar un registro de otra cuenta', async () => {
    Registro.findOneAndDelete.mockResolvedValue(null);
    const res = await autorizada('delete', `/api/despensa/${id}`, otroToken);
    expect(res.status).toBe(404);
    expect(Registro.findOneAndDelete).toHaveBeenCalledWith({ _id: id, usuario: ajeno });
  });
  test('borra solo el registro propio', async () => {
    Registro.findOneAndDelete.mockResolvedValue(documento);
    expect((await autorizada('delete', `/api/despensa/${id}`)).body.ok).toBe(true);
  });
  test.each([
    { nombre: { $ne: null } }, { cantidad: -1 }, { cantidad: '2' }, { cantidad: 0 },
    { unidad: 'desconocida' }, { lugar: 'Bodega' }, { tipo: 'otro' },
    { fechaLimite: '2026-02-30' }, { fechaLimite: { $gt: '' } }, { notas: {} },
    { tipo: 'preparacion', fechaElaboracion: '' },
    { tipo: 'preparacion', fechaElaboracion: '2027-02-01', fechaLimite: '2027-01-30' },
  ])('rechaza datos inválidos: %j', async (cambio) => {
    const res = await autorizada('post').send({ ...valido, ...cambio });
    expect(res.status).toBe(400);
    expect(Registro.create).not.toHaveBeenCalled();
  });
  test('acepta preparaciones y fechas vacías de caducidad', async () => {
    const datos = { ...valido, tipo: 'preparacion', fechaElaboracion: '2026-10-27', fechaLimite: '' };
    Registro.create.mockResolvedValue({ ...datos, _id: id, usuario });
    expect((await autorizada('post').send(datos)).status).toBe(201);
  });
  test.each(['put', 'delete'])('%s rechaza identificadores inválidos', async (metodo) => {
    expect((await autorizada(metodo, '/api/despensa/no-es-id').send(valido)).status).toBe(400);
  });
  test('devuelve un error recuperable si la base no responde', async () => {
    Registro.find.mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('interno')) });
    const res = await autorizada('get');
    expect(res.status).toBe(500);
    expect(res.body.mensaje).not.toContain('interno');
  });
});
