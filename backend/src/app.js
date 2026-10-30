const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { entradasSeguras, limiteApi } = require('./middleware/seguridad');
const authRoutes = require('./routes/auth.routes');
const despensaRoutes = require('./routes/despensa.routes');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', false);
app.set('query parser', 'simple');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const origenes = new Set([
  'http://localhost', 'https://localhost', 'capacitor://localhost', 'ionic://localhost',
  'http://localhost:8100', 'http://localhost:5173', 'http://127.0.0.1:8100', 'http://127.0.0.1:5173',
  ...(process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
]);
const corsOptions = { origin(origen, callback) {
  if (!origen || origenes.has(origen)) return callback(null, true);
  return callback(Object.assign(new Error('Origen no permitido'), { status: 403 }));
} };
app.use(cors(corsOptions));
app.use('/api', limiteApi, (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.use((req, res, next) => req.originalUrl.length > 2048 ? res.status(414).json({ mensaje: 'Dirección de solicitud demasiado larga' }) : next());
app.use(express.json({ limit: '32kb', strict: true, inflate: false }));
app.use(entradasSeguras);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/despensa', despensaRoutes);
app.use('/api/notificaciones', require('./routes/notificaciones.routes'));
app.use('/api/recetas', require('./routes/recetas.routes'));
app.use((_req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada' }));
app.use((error, _req, res, _next) => {
  const status = [400, 403, 413, 414, 415].includes(error.status) ? error.status : 500;
  const mensajes = { 400: 'Solicitud inválida', 403: 'Origen no permitido', 413: 'La solicitud supera el tamaño permitido', 414: 'Dirección de solicitud demasiado larga', 415: 'Formato o codificación no admitidos', 500: 'No se pudo completar la solicitud' };
  res.status(status).json({ mensaje: mensajes[status] });
});

module.exports = app;
