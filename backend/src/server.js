require('dotenv').config(); // Carga las variables de tu .env
const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3000;
// Ahora busca exactamente el nombre que pusiste en tu archivo .env
const DB_URI = process.env.DB_URI; 
if (!DB_URI || Buffer.byteLength(process.env.JWT_SECRET || '', 'utf8') < 32) {
  throw new Error('Configura DB_URI y un JWT_SECRET aleatorio de al menos 32 bytes antes de iniciar el servidor');
}

mongoose.connect(DB_URI)
  .then(() => {
    console.log('Base de datos conectada exitosamente');
    require('./services/notificaciones').iniciarAlertas();
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('No se pudo conectar a MongoDB:', err.codeName || err.name || 'Error de conexión');
    process.exit(1);
  });
