const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AVISO_VERSION } = require('../config/aviso');

const firmarToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

const datosPublicos = (user) => ({
  id: user._id,
  nombre: user.nombre,
  correo: user.correo,
});


// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { nombre, correo, password, aceptaAviso } = req.body;
    
    if (typeof nombre !== 'string' || typeof correo !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ mensaje: 'Formato de datos inválido' });
    }

    if (!nombre || !correo || !password) {
      return res.status(400).json({ mensaje: 'Nombre, correo y contraseña son obligatorios' });
    }
    if (password.length < 8) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres' });
    }
    // Sin consentimiento expreso no se crea la cuenta.
    if (aceptaAviso !== true) {
      return res.status(400).json({ mensaje: 'Debes aceptar el Aviso de Privacidad para registrarte' });
    }

    const existe = await User.findOne({ correo: correo.toLowerCase().trim() });
    if (existe) {
      return res.status(409).json({ mensaje: 'Ese correo ya está registrado' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      nombre,
      correo,
      password: hash,
      consentimiento: { aceptado: true, fecha: new Date(), versionAviso: AVISO_VERSION },
    });

    return res.status(201).json({ token: firmarToken(user), usuario: datosPublicos(user) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ mensaje: 'Ese correo ya está registrado' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ mensaje: 'Datos inválidos' });
    }
    console.error(err);
    return res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    // BLOQUEO ANTI-INYECCIÓN: Rechazar si no son cadenas de texto
    if (typeof correo !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ mensaje: 'Formato de datos inválido' });
    }

    if (!correo.trim() || !password) {
      return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios' });
    }

    const user = await User.findOne({ correo: correo.toLowerCase().trim() }).select('+password');
    const ok = user && (await bcrypt.compare(password, user.password));
    
    if (!ok) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    return res.json({ token: firmarToken(user), usuario: datosPublicos(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// GET /api/auth/me (ruta protegida)
exports.me = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  return res.json({ usuario: datosPublicos(user) });
};