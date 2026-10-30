const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const { buscarRecetas } = require('../services/edamam');
const { traducirIngredientes } = require('../services/ingredientes');
const consultas = new Map();
let ventana = 0;
let total = 0;
router.use(auth);
router.get('/', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const q = req.query.q;
  if (typeof q !== 'string' || q.trim().length < 2 || q.length > 120 || /[\u0000-\u001f\u007f]/.test(q)) return res.status(400).json({ mensaje: 'Escribe entre 2 y 120 caracteres para buscar recetas.' });
  const ahora = Date.now();
  if (ahora - ventana >= 60000) { ventana = ahora; total = 0; consultas.clear(); }
  if (total >= 8 || ahora - (consultas.get(req.userId) || 0) < 7000) return res.status(429).set('Retry-After', '60').json({ mensaje: 'Espera un momento antes de realizar otra búsqueda.' });
  consultas.set(req.userId, ahora); total += 1;
  const consultaUsada = traducirIngredientes(q.trim());
  try { return res.json({ recetas: await buscarRecetas(consultaUsada, req.userId), consultaUsada }); }
  catch (error) { return res.status([429, 502, 503].includes(error.status) ? error.status : 502).json({ mensaje: error.status ? error.message : 'No se pudo consultar Edamam.' }); }
});
module.exports = router;
