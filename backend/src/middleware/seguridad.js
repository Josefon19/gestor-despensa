const { rateLimit, MemoryStore } = require('express-rate-limit');

// Validar y rechazar: no modificar silenciosamente los datos recibidos.
function estructuraSegura(valor, profundidad = 0) {
  if (profundidad > 10) return false;
  if (!valor || typeof valor !== 'object' || Buffer.isBuffer(valor)) return true;
  return Object.entries(valor).every(([clave, dato]) =>
    clave.length <= 100 && !/[.$\[\]]/.test(clave) &&
    !['__proto__', 'prototype', 'constructor'].includes(clave) &&
    estructuraSegura(dato, profundidad + 1));
}
function entradasSeguras(req, res, next) {
  if ((req.body !== undefined && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) ||
    !estructuraSegura(req.body) || !estructuraSegura(req.query)) {
    return res.status(400).json({ mensaje: 'La solicitud contiene una estructura o campos no permitidos' });
  }
  next();
}
const almacenApi = new MemoryStore();
const almacenAcceso = new MemoryStore();
const almacenRegistro = new MemoryStore();
const almacenFotos = new MemoryStore();
const crearLimite = (store, limit, windowMs) => rateLimit({
  store, limit, windowMs, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { mensaje: 'Demasiadas solicitudes. Espera unos minutos antes de reintentar.' },
});
module.exports = {
  entradasSeguras, estructuraSegura,
  limiteApi: crearLimite(almacenApi, 300, 60000),
  limiteAcceso: crearLimite(almacenAcceso, 40, 15 * 60000),
  limiteRegistro: crearLimite(almacenRegistro, 20, 60 * 60000),
  limiteFotos: crearLimite(almacenFotos, 20, 15 * 60000),
  // Permite aislar las pruebas sin desactivar la protección en NODE_ENV=test.
  almacenes: [almacenApi, almacenAcceso, almacenRegistro, almacenFotos],
};
