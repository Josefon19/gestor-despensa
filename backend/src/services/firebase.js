function autenticacionFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  if (!projectId) {
    const error = new Error('El acceso con Google todavía no está configurado en el servidor');
    error.status = 503;
    throw error;
  }
  // Cargar el SDK solo para Google mantiene el acceso local independiente de Firebase.
  const { initializeApp, getApps } = require('firebase-admin/app');
  const { getAuth } = require('firebase-admin/auth');
  // Verificación de firma/issuer/audience con los certificados públicos de Firebase.
  // No se usan operaciones administrativas ni credenciales privadas de usuario.
  const nombre = `despensa-auth-${projectId}`;
  const app = getApps().find((actual) => actual.name === nombre) || initializeApp({ projectId }, nombre);
  return getAuth(app);
}

async function verificarTokenGoogle(idToken) {
  const token = await autenticacionFirebase().verifyIdToken(idToken);
  if (token.firebase?.sign_in_provider !== 'google.com' || token.email_verified !== true || typeof token.email !== 'string' || typeof token.uid !== 'string' || !token.uid || token.uid.length > 128) {
    const error = new Error('Se requiere una cuenta de Google con correo verificado');
    error.status = 401;
    throw error;
  }
  return token;
}
module.exports = { verificarTokenGoogle, autenticacionFirebase };
