const { createHash } = require('node:crypto');
const { subirFoto, fotoAutorizada, tipoImagen } = require('../src/services/cloudinary');
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const usuario = '507f1f77bcf86cd799439011';
const originalFetch = global.fetch;
const ambiente = { cloud: process.env.CLOUDINARY_CLOUD_NAME, key: process.env.CLOUDINARY_API_KEY, secret: process.env.CLOUDINARY_API_SECRET };
beforeEach(() => {
  process.env.CLOUDINARY_CLOUD_NAME = 'prueba-local'; process.env.CLOUDINARY_API_KEY = 'clave-de-prueba'; process.env.CLOUDINARY_API_SECRET = 'secreto-de-prueba';
  global.fetch = jest.fn(async (_url, opciones) => {
    const id = opciones.body.get('public_id');
    return { ok: true, json: async () => ({ public_id: id, secure_url: `https://res.cloudinary.com/prueba-local/image/upload/v1/${id}.png` }) };
  });
});
afterEach(() => {
  global.fetch = originalFetch;
  for (const [clave, valor] of [['CLOUDINARY_CLOUD_NAME', ambiente.cloud], ['CLOUDINARY_API_KEY', ambiente.key], ['CLOUDINARY_API_SECRET', ambiente.secret]]) {
    if (valor === undefined) delete process.env[clave]; else process.env[clave] = valor;
  }
});
test('sube una imagen con firma sin enviar el secreto como campo', async () => {
  const foto = await subirFoto(png, 'image/png', usuario);
  const formulario = global.fetch.mock.calls[0][1].body;
  const cadena = ['overwrite', 'public_id', 'timestamp', 'transformation'].map((clave) => `${clave}=${formulario.get(clave)}`).join('&');
  expect(formulario.get('signature')).toBe(createHash('sha256').update(cadena + 'secreto-de-prueba').digest('hex'));
  expect(formulario.has('api_secret')).toBe(false);
  expect(fotoAutorizada(foto, usuario)).toBe(true);
  expect(fotoAutorizada(foto, 'otra-cuenta')).toBe(false);
  expect(fotoAutorizada({ ...foto, url: 'https://otro.example/foto.png' }, usuario)).toBe(false);
});
test('rechaza archivos falseados, vacíos y de más de 5 MB antes de subir', async () => {
  for (const buffer of [Buffer.from('<svg></svg>'), Buffer.alloc(0), Buffer.alloc(5 * 1024 * 1024 + 1)]) {
    await expect(subirFoto(buffer, 'image/png', usuario)).rejects.toMatchObject({ status: 400 });
  }
  await expect(subirFoto(png, 'image/jpeg', usuario)).rejects.toMatchObject({ status: 400 });
  expect(global.fetch).not.toHaveBeenCalled();
  expect(tipoImagen(png)).toBe('image/png');
});
test('presenta un error recuperable si Cloudinary no responde', async () => {
  global.fetch.mockRejectedValue(new Error('red'));
  await expect(subirFoto(png, 'image/png', usuario)).rejects.toMatchObject({ status: 502 });
});
