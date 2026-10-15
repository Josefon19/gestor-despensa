process.env.JWT_SECRET = 'secreto_de_pruebas';

// Modelo simulado en memoria: las pruebas no necesitan MongoDB.
jest.mock('../src/models/User', () => {
  const usuarios = [];
  return {
    __usuarios: usuarios,
    findOne: jest.fn(async ({ correo }) => usuarios.find((u) => u.correo === correo) || null),
    create: jest.fn(async (datos) => {
      const user = { _id: String(usuarios.length + 1), ...datos, correo: datos.correo.toLowerCase().trim() };
      usuarios.push(user);
      return user;
    }),
  };
});

const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

const valido = {
  nombre: 'José Ortega',
  correo: 'jose@correo.com',
  password: 'Clave1234',
};

beforeEach(() => {
  User.__usuarios.length = 0;
});

describe('Registro', () => {
  test('registra a un usuario nuevo', async () => {
    const res = await request(app).post('/api/auth/register').send(valido);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.usuario.password).toBeUndefined();

    // la contraseña se guardó cifrada, no en texto plano
    expect(User.__usuarios[0].password).not.toBe(valido.password);
  });

  test('rechaza si faltan datos', async () => {
    const res = await request(app).post('/api/auth/register').send({ correo: valido.correo });
    expect(res.status).toBe(400);
  });

  test('rechaza contraseñas cortas', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...valido, password: '123' });
    expect(res.status).toBe(400);
  });

  test('rechaza correos duplicados', async () => {
    await request(app).post('/api/auth/register').send(valido);
    const res = await request(app).post('/api/auth/register').send(valido);
    expect(res.status).toBe(409);
  });
});