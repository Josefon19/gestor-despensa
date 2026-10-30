const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verificarTokenGoogle } = require('../services/firebase');
const { AVISO_VERSION } = require('../config/aviso');
const { passwordValido } = require('../validation/auth');

const responderSesion = (res, user, status = 200) => res.status(status).json({
  token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }),
  usuario: { id: user._id, nombre: user.nombre, correo: user.correo },
});

exports.google = async (req, res) => {
  const { idToken, aceptaAviso, passwordActual } = req.body || {};
  if (typeof idToken !== 'string' || !idToken.trim() || idToken.length > 16000 || (passwordActual !== undefined && !passwordValido(passwordActual))) {
    return res.status(400).json({ mensaje: 'Datos del acceso con Google inválidos' });
  }
  let identidad;
  try { identidad = await verificarTokenGoogle(idToken); }
  catch (error) {
    if (error.status === 503) return res.status(503).json({ mensaje: error.message });
    if (['app/network-error', 'auth/internal-error', 'auth/certificate-fetch-failed'].includes(error.code)) {
      return res.status(503).json({ mensaje: 'No se pudo verificar Google. Inténtalo de nuevo.' });
    }
    return res.status(401).json({ mensaje: 'No se pudo validar tu sesión de Google. Vuelve a intentarlo.' });
  }
  try {
    const vinculada = await User.findOne({ firebaseUid: identidad.uid });
    if (vinculada) return responderSesion(res, vinculada);
    const correo = identidad.email.toLowerCase().trim();
    const existente = await User.findOne({ correo }).select('+password');
    if (existente) {
      if (existente.firebaseUid && existente.firebaseUid !== identidad.uid) return res.status(409).json({ mensaje: 'Ese correo ya está vinculado a otra identidad de Google' });
      if (!passwordActual) return res.status(409).json({ codigo: 'VINCULAR_PASSWORD', mensaje: 'Ya tienes una cuenta con este correo. Confirma su contraseña para vincular Google y conservar tus registros.' });
      if (!existente.password || !(await bcrypt.compare(passwordActual, existente.password))) {
        return res.status(401).json({ codigo: 'VINCULAR_PASSWORD', mensaje: 'La contraseña de tu cuenta no es correcta' });
      }
      const user = await User.findOneAndUpdate(
        { _id: existente._id, firebaseUid: { $exists: false } },
        { $set: { firebaseUid: identidad.uid } }, { returnDocument: 'after', runValidators: true }
      );
      if (!user) return res.status(409).json({ mensaje: 'La cuenta cambió mientras se vinculaba. Inténtalo de nuevo.' });
      return responderSesion(res, user);
    }
    if (aceptaAviso !== true) return res.status(428).json({ codigo: 'AVISO_REQUERIDO', mensaje: 'Para crear tu cuenta, lee y acepta el Aviso de Privacidad' });
    const nombre = typeof identidad.name === 'string' && identidad.name.trim().length >= 2 ? identidad.name.trim().slice(0, 80) : 'Usuario de Google';
    const user = await User.create({ nombre, correo, firebaseUid: identidad.uid,
      consentimiento: { aceptado: true, fecha: new Date(), versionAviso: AVISO_VERSION } });
    return responderSesion(res, user, 201);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ mensaje: 'La cuenta ya se creó o vinculó. Vuelve a iniciar sesión.' });
    console.error('Error al completar el acceso con Google:', error.code || error.codeName || error.name || 'Error');
    return res.status(500).json({ mensaje: 'No se pudo completar el acceso con Google' });
  }
};
