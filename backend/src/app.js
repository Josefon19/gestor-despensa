const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const despensaRoutes = require('./routes/despensa.routes');

const app = express();

const corsOptions = {};
app.use(cors(corsOptions));

app.use(express.json()); 
// Eliminamos app.use(mongoSanitize()); para evitar el choque con Node 22

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/despensa', despensaRoutes);

module.exports = app;
