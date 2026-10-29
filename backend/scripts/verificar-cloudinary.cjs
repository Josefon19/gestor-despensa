// Subida de prueba con una imagen generada. No utiliza fotos ni registros personales.
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const Registro = require('../src/models/RegistroDespensa');

async function verificar() {
  const usuario = new mongoose.Types.ObjectId();
  const token = jwt.sign({ id: String(usuario) }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const autenticar = (metodo, ruta) => request(app)[metodo](ruta).set('Authorization', `Bearer ${token}`);
  let foto;
  let conectado = false;
  try {
    const imagen = fs.readFileSync(path.resolve(__dirname, '../../tmp/cloudinary-prueba.png'));
    const subida = await autenticar('post', '/api/despensa/foto').set('Content-Type', 'image/png').send(imagen);
    assert.equal(subida.status, 201, `La subida respondió ${subida.status}: ${subida.body.mensaje || ''}`);
    foto = subida.body.foto;
    await mongoose.connect(process.env.DB_URI, { serverSelectionTimeoutMS: 15000 });
    conectado = true;
    const datos = { tipo: 'preparacion', nombre: 'Prueba temporal de foto', cantidad: 1, unidad: 'porciones', lugar: 'Refrigerador', fechaElaboracion: '2026-10-27', fechaLimite: '2026-10-30', notas: 'Registro automático temporal', foto };
    const creado = await autenticar('post', '/api/despensa').send(datos);
    assert.equal(creado.status, 201);
    assert.equal(creado.body.registro.foto.url, foto.url);
    assert.equal(creado.body.registro.foto.firma, undefined);
    const lectura = await autenticar('get', '/api/despensa');
    assert.equal(lectura.body.registros[0].foto.publicId, foto.publicId);
    const sinFotoNueva = { ...datos }; delete sinFotoNueva.foto;
    const editado = await autenticar('put', `/api/despensa/${creado.body.registro.id}`).send(sinFotoNueva);
    assert.equal(editado.body.registro.foto.url, foto.url);
    console.log('Cloudinary y Atlas: subida firmada, guardado de foto y conservación al editar correctos.');
  } finally {
    if (conectado) await Registro.deleteMany({ usuario });
    await mongoose.disconnect();
    if (foto) {
      const parametros = { invalidate: 'true', public_id: foto.publicId, timestamp: String(Math.floor(Date.now() / 1000)) };
      const cadena = Object.keys(parametros).sort().map((clave) => `${clave}=${parametros[clave]}`).join('&');
      const formulario = new FormData();
      for (const [clave, valor] of Object.entries(parametros)) formulario.set(clave, valor);
      formulario.set('api_key', process.env.CLOUDINARY_API_KEY);
      formulario.set('signature', createHash('sha256').update(cadena + process.env.CLOUDINARY_API_SECRET).digest('hex'));
      const borrado = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/destroy`, { method: 'POST', body: formulario, signal: AbortSignal.timeout(30000) });
      const respuesta = await borrado.json();
      assert(borrado.ok && ['ok', 'not found'].includes(respuesta.result), 'No se pudo limpiar la imagen de prueba');
      console.log('Limpieza completada: imagen y registro temporales eliminados.');
    }
  }
}
verificar().catch((error) => { console.error('Verificación de foto:', error.message); process.exitCode = 1; });
