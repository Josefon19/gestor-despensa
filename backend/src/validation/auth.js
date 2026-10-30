const correoValido = (valor) => typeof valor === 'string' && valor.length <= 254 && /^[^\s@\u0000-\u001f\u007f]+@[^\s@\u0000-\u001f\u007f]+\.[^\s@\u0000-\u001f\u007f]+$/.test(valor.trim());
// bcrypt solo distingue los primeros 72 bytes. Rechazar en vez de truncar.
const passwordValido = (valor) => typeof valor === 'string' && valor.length > 0 && !valor.includes('\0') && Buffer.byteLength(valor, 'utf8') <= 72;
module.exports = { correoValido, passwordValido };
