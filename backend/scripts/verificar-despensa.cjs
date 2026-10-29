// Verificación explícita con Atlas. Solo crea y borra registros de un propietario aleatorio de prueba.
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');
const Registro = require('../src/models/RegistroDespensa');

async function verificar() {
  assert(process.env.DB_URI && process.env.JWT_SECRET, 'Faltan DB_URI o JWT_SECRET');
  const propietario = new mongoose.Types.ObjectId();
  const otro = new mongoose.Types.ObjectId();
  const token = jwt.sign({ id: String(propietario) }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const otroToken = jwt.sign({ id: String(otro) }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const peticion = (metodo, ruta = '/api/despensa', credencial = token) => request(app)[metodo](ruta).set('Authorization', `Bearer ${credencial}`);
  let conectado = false;
  try {
    await mongoose.connect(process.env.DB_URI, { serverSelectionTimeoutMS: 15000 });
    conectado = true;
    const datos = { tipo: 'alimento', nombre: 'Verificación temporal de despensa', cantidad: 1, unidad: 'piezas', lugar: 'Alacena', fechaLimite: '', fechaElaboracion: '', notas: 'Registro automático temporal de verificación.' };
    const creado = await peticion('post').send(datos);
    assert.equal(creado.status, 201);
    const id = creado.body.registro.id;
    assert(id);
    const actualizado = await peticion('put', `/api/despensa/${id}`).send({ ...datos, cantidad: 2 });
    assert.equal(actualizado.status, 200);
    assert.equal(actualizado.body.registro.cantidad, 2);
    assert.equal((await peticion('put', `/api/despensa/${id}`, otroToken).send(datos)).status, 404);
    assert.equal((await peticion('delete', `/api/despensa/${id}`, otroToken)).status, 404);
    assert.equal((await peticion('get', '/api/despensa', otroToken)).body.registros.length, 0);
    // Reconectar verifica que el registro está en Atlas y no en memoria del servidor.
    await mongoose.disconnect();
    conectado = false;
    await mongoose.connect(process.env.DB_URI, { serverSelectionTimeoutMS: 15000 });
    conectado = true;
    const lista = await peticion('get');
    assert.equal(lista.status, 200);
    assert.equal(lista.body.registros.find((registro) => registro.id === id)?.cantidad, 2);
    assert.equal((await peticion('delete', `/api/despensa/${id}`)).status, 200);
    assert.equal((await peticion('get')).body.registros.length, 0);
    console.log('Atlas: alta, edición, persistencia tras reconectar, aislamiento por usuario y eliminación correctos.');
  } finally {
    // El filtro solo coincide con el identificador aleatorio creado en esta ejecución.
    if (conectado) await Registro.deleteMany({ usuario: propietario });
    await mongoose.disconnect();
  }
}
verificar().catch((error) => {
  console.error('Falló la verificación de Atlas:', error.name);
  process.exitCode = 1;
});
