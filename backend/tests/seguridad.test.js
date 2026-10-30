process.env.JWT_SECRET = 'secreto-largo-exclusivo-de-las-pruebas';
jest.mock('../src/models/User', () => ({ findOne: jest.fn(), findById: jest.fn(), create: jest.fn() }));
jest.mock('../src/models/RegistroDespensa', () => ({ find: jest.fn(), create: jest.fn(), findOneAndUpdate: jest.fn(), findOneAndDelete: jest.fn() }));
jest.mock('../src/models/DispositivoPush', () => ({ findOneAndUpdate: jest.fn(), deleteMany: jest.fn() }));
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const Registro = require('../src/models/RegistroDespensa');
const Dispositivo = require('../src/models/DispositivoPush');
const { almacenes } = require('../src/middleware/seguridad');
const usuario = '507f1f77bcf86cd799439011';
const id = '507f1f77bcf86cd799439012';
const sesion = jwt.sign({ id: usuario }, process.env.JWT_SECRET, { expiresIn: '1h' });
const autorizado = (metodo, ruta, token = sesion) => request(app)[metodo](ruta).set('Authorization', `Bearer ${token}`);
const valido = { tipo: 'alimento', nombre: 'Arroz', cantidad: 1, unidad: 'kg', lugar: 'Alacena', fechaLimite: '', fechaElaboracion: '', notas: '' };
beforeEach(async () => { jest.resetAllMocks(); await Promise.all(almacenes.map((a) => a.resetAll())); });
function sinBase() {
  for (const modelo of [User, Registro, Dispositivo]) for (const metodo of Object.values(modelo)) expect(metodo).not.toHaveBeenCalled();
}
describe('intentos de inyección sin base real', () => {
  test.each([
    ['/api/auth/login', { correo: { $ne: null }, password: { $ne: null } }],
    ['/api/auth/login', { correo: { $regex: '.*' }, password: '12345678' }],
    ['/api/auth/register', { nombre: 'Usuario', correo: { $gt: '' }, password: '12345678', aceptaAviso: true }],
    ['/api/auth/google', { idToken: { $where: 'db.dropDatabase()' } }],
    ['/api/despensa', { ...valido, $set: { usuario: id } }],
    ['/api/despensa', { ...valido, nombre: { $ne: null } }],
    ['/api/despensa', { ...valido, foto: { metadatos: { $where: 'db.dropDatabase()' } } }],
    ['/api/notificaciones/dispositivos', { token: { $ne: null } }],
    ['/api/notificaciones/prueba', { instalacionId: { $regex: '.*' } }],
  ])('bloquea operadores en %s antes de consultar modelos', async (ruta, cuerpo) => {
    expect((await autorizado('post', ruta).send(cuerpo)).status).toBe(400);
    sinBase();
  });
  test.each(['__proto__', 'constructor', 'prototype', 'usuario.id', '$nor'])('rechaza claves reservadas %s incluso anidadas', async (clave) => {
    const cuerpo = JSON.parse(`{"nombre":"Arroz","extra":{"${clave}":{"polluted":true}}}`);
    expect((await autorizado('post', '/api/despensa').send(cuerpo)).status).toBe(400);
    expect({}.polluted).toBeUndefined(); sinBase();
  });
  test.each(['q[$ne]=x', '$where=db.dropDatabase()', 'usuario.id=123', '__proto__[polluted]=true', 'q=pollo&q=arroz'])('rechaza consultas manipuladas %s', async (consulta) => {
    expect((await autorizado('get', '/api/recetas?' + consulta)).status).toBe(400); sinBase();
  });
  test.each(['%7B%22%24ne%22:null%7D', '123', '$where', 'dropDatabase'])('no usa un identificador manipulado para borrar: %s', async (valor) => {
    expect((await autorizado('delete', '/api/despensa/' + valor)).status).toBe(400); sinBase();
  });
  test('el texto SQL se almacena como texto, sin convertirse en una instrucción', async () => {
    const texto = "Arroz'; DROP DATABASE despensa; --";
    Registro.create.mockImplementation(async (datos) => ({ ...datos, _id: id }));
    const res = await autorizado('post', '/api/despensa').send({ ...valido, nombre: texto, notas: 'db.dropDatabase()' });
    expect(res.status).toBe(201);
    expect(res.body.registro.nombre).toBe(texto);
    expect(Registro.create).toHaveBeenCalledWith({ ...valido, nombre: texto, notas: 'db.dropDatabase()', usuario });
    expect(Registro.findOneAndDelete).not.toHaveBeenCalled();
  });
  test('un intento SQL en login no evita comprobar la contraseña', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    const res = await request(app).post('/api/auth/login').send({ correo: 'atacante@ejemplo.com', password: "' OR 1=1 --" });
    expect(res.status).toBe(401);
    expect(User.findOne).toHaveBeenCalledWith({ correo: 'atacante@ejemplo.com' });
    expect(res.body.token).toBeUndefined();
  });
  test('filtros adicionales del atacante no amplían la lista del propietario', async () => {
    Registro.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
    expect((await autorizado('get', '/api/despensa?usuario=' + id)).status).toBe(200);
    expect(Registro.find).toHaveBeenCalledWith({ usuario });
  });
});
describe('sesiones y límites de entrada', () => {
  test.each([
    [{ id: { $ne: null } }, { expiresIn: '1h' }],
    [{ id: [] }, { expiresIn: '1h' }], [{}, { expiresIn: '1h' }],
    [{ id: 'no-es-objectid' }, { expiresIn: '1h' }],
    [{ id: usuario }, {}], [{ id: usuario }, { expiresIn: -1 }],
    [{ id: usuario }, { expiresIn: '1h', algorithm: 'HS384' }],
  ])('rechaza claims o algoritmo inválidos %j', async (payload, opciones) => {
    const token = jwt.sign(payload, process.env.JWT_SECRET, opciones);
    expect((await autorizado('get', '/api/auth/me', token)).status).toBe(401); sinBase();
  });
  test('rechaza una firma falsificada', async () => {
    const token = jwt.sign({ id: usuario }, 'otro-secreto', { expiresIn: '1h' });
    expect((await autorizado('delete', '/api/despensa/' + id, token)).status).toBe(401); sinBase();
  });
  test.each(['a'.repeat(73), 'á'.repeat(37), '12345678\0resto'])('rechaza contraseñas que bcrypt truncaría o con NUL', async (password) => {
    const res = await request(app).post('/api/auth/register').send({ nombre: 'Usuario', correo: 'persona@ejemplo.com', password, aceptaAviso: true });
    expect(res.status).toBe(400); sinBase();
  });
  test('rechaza un JSON mal formado sin stack ni contenido reflejado', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"secreto-que-no-se-debe-reflejar":');
    expect(res.status).toBe(400); expect(JSON.stringify(res.body)).not.toContain('secreto-que-no'); sinBase();
  });
  test('rechaza un JSON demasiado grande', async () => {
    expect((await request(app).post('/api/auth/login').send({ correo: 'x'.repeat(34000) })).status).toBe(413); sinBase();
  });
  test('rechaza objetos excesivamente anidados', async () => {
    let dato = {}; for (let i = 0; i < 12; i++) dato = { siguiente: dato };
    expect((await autorizado('post', '/api/despensa').send(dato)).status).toBe(400); sinBase();
  });
  test('bloquea ráfagas de login y no confía en X-Forwarded-For para evadirlas', async () => {
    for (let i = 0; i < 40; i++) await request(app).post('/api/auth/login').set('X-Forwarded-For', `192.0.2.${i}`).send({});
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(429); expect(res.headers['retry-after']).toBeDefined(); sinBase();
  });
  test('no existe una ruta para borrar la base o todas las cuentas', async () => {
    for (const ruta of ['/api/dropDatabase', '/api/admin', '/api/users', '/api/despensa']) expect((await autorizado('delete', ruta)).status).toBe(404);
    sinBase();
  });
  test('solo admite imágenes y verifica sus bytes', async () => {
    const res = await autorizado('post', '/api/despensa/foto').set('Content-Type', 'image/png').send(Buffer.from('<svg onload="alert(1)"></svg>'));
    expect(res.status).toBe(400); sinBase();
  });
  test('añade cabeceras y restringe orígenes de navegador', async () => {
    const ok = await request(app).get('/api/health').set('Origin', 'http://localhost');
    expect(ok.status).toBe(200); expect(ok.headers['x-powered-by']).toBeUndefined();
    expect(ok.headers['x-content-type-options']).toBe('nosniff');
    expect(ok.headers['cache-control']).toBe('no-store');
    expect((await request(app).get('/api/health').set('Origin', 'https://sitio-ajeno.example')).status).toBe(403);
  });
});
