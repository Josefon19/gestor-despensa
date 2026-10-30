process.env.JWT_SECRET = 'secreto-google-pruebas';
jest.mock('../src/services/firebase', () => ({ verificarTokenGoogle: jest.fn() }));
jest.mock('../src/models/User', () => ({ findOne: jest.fn(), findOneAndUpdate: jest.fn(), create: jest.fn() }));
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const { verificarTokenGoogle } = require('../src/services/firebase');
const identidad = { uid: 'firebase-uid-prueba', email: 'prueba@gmail.com', email_verified: true, name: 'Persona Prueba', firebase: { sign_in_provider: 'google.com' } };
const post = (datos = {}) => request(app).post('/api/auth/google').send({ idToken: 'token-firebase-prueba', ...datos });
let usuarios;
beforeEach(() => {
  jest.resetAllMocks(); usuarios = [];
  verificarTokenGoogle.mockResolvedValue(identidad);
  User.findOne.mockImplementation((consulta) => {
    const encontrar = async () => usuarios.find((u) => consulta.firebaseUid ? u.firebaseUid === consulta.firebaseUid : u.correo === consulta.correo) || null;
    return { select: encontrar, then: (resolver, rechazar) => encontrar().then(resolver, rechazar) };
  });
  User.create.mockImplementation(async (datos) => { const user = { _id: 'mongo-nuevo', ...datos }; usuarios.push(user); return user; });
  User.findOneAndUpdate.mockImplementation(async (filtro, cambio) => {
    const user = usuarios.find((u) => u._id === filtro._id && !u.firebaseUid);
    if (user) Object.assign(user, cambio.$set);
    return user || null;
  });
});
test('verifica el token antes de consultar cuentas', async () => {
  verificarTokenGoogle.mockRejectedValue(new Error('token inválido'));
  expect((await post()).status).toBe(401);
  expect(User.findOne).not.toHaveBeenCalled();
  expect(User.create).not.toHaveBeenCalled();
});
test.each([null, {}, '', ' '.repeat(3)])('rechaza un token con formato inválido: %j', async (idToken) => {
  expect((await post({ idToken })).status).toBe(400);
  expect(verificarTokenGoogle).not.toHaveBeenCalled();
});
test('exige consentimiento expreso antes de crear una cuenta', async () => {
  const res = await post();
  expect(res.status).toBe(428); expect(res.body.codigo).toBe('AVISO_REQUERIDO');
  expect(User.create).not.toHaveBeenCalled();
});
test('crea una cuenta Google sin contraseña y entrega el JWT de la app', async () => {
  const res = await post({ aceptaAviso: true });
  expect(res.status).toBe(201);
  expect(usuarios[0].firebaseUid).toBe(identidad.uid);
  expect(usuarios[0].password).toBeUndefined();
  expect(usuarios[0].consentimiento.aceptado).toBe(true);
  expect(jwt.verify(res.body.token, process.env.JWT_SECRET).id).toBe('mongo-nuevo');
  expect(res.body.usuario.firebaseUid).toBeUndefined();
});
test('reutiliza la identidad vinculada y no crea otra cuenta', async () => {
  usuarios.push({ _id: 'original', nombre: 'Original', correo: identidad.email, firebaseUid: identidad.uid });
  const res = await post();
  expect(res.status).toBe(200); expect(res.body.usuario.id).toBe('original');
  expect(User.create).not.toHaveBeenCalled();
});
test('no vincula automáticamente una cuenta existente solo por el correo', async () => {
  usuarios.push({ _id: 'original', nombre: 'Original', correo: identidad.email, password: 'hash' });
  const res = await post({ aceptaAviso: true });
  expect(res.status).toBe(409); expect(res.body.codigo).toBe('VINCULAR_PASSWORD');
  expect(User.findOneAndUpdate).not.toHaveBeenCalled();
});
test('una contraseña incorrecta no permite vincular ni cambiar datos', async () => {
  usuarios.push({ _id: 'original', nombre: 'Original', correo: identidad.email, password: await bcrypt.hash('Correcta123', 4) });
  const res = await post({ passwordActual: 'Incorrecta123' });
  expect(res.status).toBe(401); expect(res.body.codigo).toBe('VINCULAR_PASSWORD');
  expect(User.findOneAndUpdate).not.toHaveBeenCalled();
});
test('vincula tras comprobar la contraseña y conserva el identificador y el hash', async () => {
  const hash = await bcrypt.hash('Correcta123', 4);
  usuarios.push({ _id: 'original', nombre: 'Original', correo: identidad.email, password: hash });
  const res = await post({ passwordActual: 'Correcta123' });
  expect(res.status).toBe(200); expect(res.body.usuario.id).toBe('original');
  expect(usuarios[0].password).toBe(hash); expect(usuarios[0].firebaseUid).toBe(identidad.uid);
  expect(User.create).not.toHaveBeenCalled();
  expect(res.body.usuario.password).toBeUndefined();
});
test('impide reemplazar una identidad Google ya vinculada', async () => {
  usuarios.push({ _id: 'original', nombre: 'Original', correo: identidad.email, firebaseUid: 'otro-uid', password: 'hash' });
  expect((await post({ passwordActual: 'cualquiera' })).status).toBe(409);
  expect(User.findOneAndUpdate).not.toHaveBeenCalled();
});
test('muestra un error recuperable si Firebase está sin configurar', async () => {
  verificarTokenGoogle.mockRejectedValue(Object.assign(new Error('Google no está configurado'), { status: 503 }));
  expect((await post()).status).toBe(503);
});
test('el acceso por contraseña devuelve 401 para una cuenta exclusivamente Google', async () => {
  usuarios.push({ _id: 'original', nombre: 'Original', correo: identidad.email, firebaseUid: identidad.uid });
  const res = await request(app).post('/api/auth/login').send({ correo: identidad.email, password: 'Cualquiera123' });
  expect(res.status).toBe(401);
});
