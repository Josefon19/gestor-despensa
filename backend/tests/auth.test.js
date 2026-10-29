process.env.JWT_SECRET = 'secreto_de_pruebas';

// Modelo simulado en memoria: las pruebas no necesitan MongoDB.
jest.mock('../src/models/User', () => {
  const usuarios = [];
  return {
    __usuarios: usuarios,
    findOne: jest.fn(({ correo }) => {
      const obtener = async () => usuarios.find((u) => u.correo === correo) || null;
      // Las consultas de Mongoose son esperables y permiten select('+password').
      return { select: jest.fn(obtener), then: (resolver, rechazar) => obtener().then(resolver, rechazar) };
    }),
    findById: jest.fn(async (id) => usuarios.find((u) => u._id === id) || null),
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
  aceptaAviso: true,
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

describe('Aviso de privacidad y consentimiento', () => {
  test('guarda fecha y versión del aviso aceptado', async () => {
    await request(app).post('/api/auth/register').send(valido);

    const guardado = User.__usuarios[0];
    expect(guardado.consentimiento.aceptado).toBe(true);
    expect(guardado.consentimiento.versionAviso).toBe('1.0');
    expect(guardado.consentimiento.fecha).toBeInstanceOf(Date);
  });

  test('rechaza el registro si no se acepta el aviso', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...valido, aceptaAviso: false });
    expect(res.status).toBe(400);
    expect(User.__usuarios).toHaveLength(0);
  });

  test('rechaza el registro si no se manda el campo aceptaAviso', async () => {
    const { aceptaAviso, ...sinAviso } = valido;
    const res = await request(app).post('/api/auth/register').send(sinAviso);
    expect(res.status).toBe(400);
    expect(User.__usuarios).toHaveLength(0);
  });
});

describe('Login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(valido);
  });

  test('entra con credenciales correctas y devuelve token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: valido.correo, password: valido.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.usuario.password).toBeUndefined();
  });

  test('rechaza contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: valido.correo, password: 'incorrecta1' });
    expect(res.status).toBe(401);
  });

  test('rechaza correo inexistente con el mismo mensaje', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'nadie@correo.com', password: 'Clave1234' });
    expect(res.status).toBe(401);
    expect(res.body.mensaje).toBe('Correo o contraseña incorrectos');
  });

  test('rechaza si faltan datos', async () => {
    const res = await request(app).post('/api/auth/login').send({ correo: valido.correo });
    expect(res.status).toBe(400);
  });

  test('/me exige token y responde con token válido', async () => {
    const sinToken = await request(app).get('/api/auth/me');
    expect(sinToken.status).toBe(401);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ correo: valido.correo, password: valido.password });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.usuario.correo).toBe(valido.correo);
  });
});
