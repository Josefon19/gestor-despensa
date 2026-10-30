const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const header = req.headers.authorization || '';
  const coincidencia = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(header);
  if (!coincidencia || header.length > 4096) {
    return res.status(401).json({ mensaje: 'Token requerido' });
  }
  try {
    const datos = jwt.verify(coincidencia[1], process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (!datos || typeof datos.id !== 'string' || !/^[a-f0-9]{24}$/i.test(datos.id) || !Number.isFinite(datos.exp)) throw new Error('Sesión inválida');
    req.userId = datos.id;
    next();
  } catch {
    return res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
};
