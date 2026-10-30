const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const Dispositivo = require('../models/DispositivoPush');
const { enviar, mensajeria } = require('../services/notificaciones');
const instalacionValida = (id) => typeof id === 'string' && /^[a-f0-9]{32}$/.test(id);
const fallo = (res, error) => res.status(error.status === 410 ? 410 : error.status === 503 ? 503 : 502).json({ mensaje: error.status === 410 ? 'Activa otra vez los avisos para registrar este dispositivo.' : 'No se pudo conectar con el servicio de notificaciones. Inténtalo de nuevo.' });
router.use(auth);
router.post('/dispositivos', async (req, res) => {
  const { instalacionId, token, anticipacion, zonaHoraria } = req.body || {};
  let zonaValida = false;
  try { if (typeof zonaHoraria === 'string' && zonaHoraria.length < 100) { new Intl.DateTimeFormat('es', { timeZone: zonaHoraria }); zonaValida = true; } } catch { /* Zona inválida */ }
  if (!instalacionValida(instalacionId) || typeof token !== 'string' || token.length < 20 || token.length > 4096 || /\s/.test(token) || !Number.isInteger(anticipacion) || anticipacion < 1 || anticipacion > 7 || !zonaValida) return res.status(400).json({ mensaje: 'Configuración de notificaciones inválida' });
  try {
    mensajeria();
    await Dispositivo.findOneAndUpdate({ token }, { $set: { usuario: req.userId, instalacionId, anticipacion, zonaHoraria } }, { upsert: true, runValidators: true, returnDocument: 'after' });
    await Dispositivo.deleteMany({ usuario: req.userId, instalacionId, token: { $ne: token } });
    res.json({ ok: true });
  } catch (error) { fallo(res, error); }
});
router.delete('/dispositivos/:instalacionId', async (req, res) => {
  if (!instalacionValida(req.params.instalacionId)) return res.status(400).json({ mensaje: 'Dispositivo inválido' });
  try { await Dispositivo.deleteMany({ usuario: req.userId, instalacionId: req.params.instalacionId }); res.json({ ok: true }); }
  catch (error) { fallo(res, error); }
});
router.post('/prueba', async (req, res) => {
  if (!instalacionValida(req.body?.instalacionId)) return res.status(400).json({ mensaje: 'Dispositivo inválido' });
  try {
    const filtro = { usuario: req.userId, instalacionId: req.body.instalacionId };
    const dispositivo = await Dispositivo.findOneAndUpdate({ ...filtro, $or: [{ ultimaPrueba: { $exists: false } }, { ultimaPrueba: { $lte: new Date(Date.now() - 60000) } }] }, { $set: { ultimaPrueba: new Date() } }, { returnDocument: 'after' }).select('+token');
    if (!dispositivo) return res.status(429).json({ mensaje: 'Activa los avisos y espera un minuto entre pruebas.' });
    await enviar(dispositivo, true);
    res.json({ ok: true });
  } catch (error) { fallo(res, error); }
});
module.exports = router;
