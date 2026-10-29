const { createHash, createHmac, randomUUID, timingSafeEqual } = require('node:crypto');

const MAX_FOTO = 5 * 1024 * 1024;
function configuracion() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    require('dotenv').config({ path: require('node:path').resolve(__dirname, '../../.env'), quiet: true });
  }
  const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = process.env;
  if (!cloud || !key || !secret || !/^[a-zA-Z0-9_-]+$/.test(cloud)) {
    const error = new Error('La subida de fotos aún no está configurada en el servidor. Puedes guardar el registro sin foto.');
    error.status = 503;
    throw error;
  }
  return { cloud, key, secret };
}
function tipoImagen(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return 'image/jpeg';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}
function firmaFoto(foto, usuario) {
  return createHmac('sha256', configuracion().secret).update(JSON.stringify([String(usuario), foto.publicId, foto.url])).digest('hex');
}
function fotoAutorizada(foto, usuario) {
  if (!foto || typeof foto.url !== 'string' || typeof foto.publicId !== 'string' || typeof foto.firma !== 'string' || !/^[a-f0-9]{64}$/.test(foto.firma)) return false;
  if (!foto.publicId.startsWith(`gestor-despensa/${usuario}/`)) return false;
  try { return timingSafeEqual(Buffer.from(foto.firma, 'hex'), Buffer.from(firmaFoto(foto, usuario), 'hex')); }
  catch { return false; }
}
async function subirFoto(buffer, mime, usuario) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0 || buffer.length > MAX_FOTO || tipoImagen(buffer) !== mime) {
    const error = new Error('Selecciona una imagen JPG, PNG o WebP válida de hasta 5 MB.');
    error.status = 400;
    throw error;
  }
  const { cloud, key, secret } = configuracion();
  const parametros = { overwrite: 'false', public_id: `gestor-despensa/${usuario}/${randomUUID()}`, timestamp: String(Math.floor(Date.now() / 1000)), transformation: 'c_limit,w_1600,h_1600,q_auto' };
  const cadena = Object.keys(parametros).sort().map((nombre) => `${nombre}=${parametros[nombre]}`).join('&');
  const firma = createHash('sha256').update(cadena + secret).digest('hex');
  const formulario = new FormData();
  for (const [nombre, valor] of Object.entries(parametros)) formulario.set(nombre, valor);
  formulario.set('api_key', key);
  formulario.set('signature', firma);
  formulario.set('file', new Blob([buffer], { type: mime }), 'foto');
  let respuesta;
  try {
    respuesta = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body: formulario, signal: AbortSignal.timeout(30000) });
  } catch {
    const error = new Error('No se pudo conectar con Cloudinary. Reintenta o guarda sin foto.');
    error.status = 502;
    throw error;
  }
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || datos.public_id !== parametros.public_id || !datos.secure_url?.startsWith(`https://res.cloudinary.com/${cloud}/image/upload/`)) {
    const error = new Error('Cloudinary no pudo guardar la imagen. Revisa su configuración o intenta otra foto.');
    error.status = 502;
    throw error;
  }
  const foto = { url: datos.secure_url, publicId: datos.public_id };
  return { ...foto, firma: firmaFoto(foto, usuario) };
}
module.exports = { subirFoto, fotoAutorizada, tipoImagen, MAX_FOTO };
