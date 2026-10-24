require('dotenv').config(); // Carga las variables de tu .env
const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3000;
// Ahora busca exactamente el nombre que pusiste en tu archivo .env
const DB_URI = process.env.DB_URI; 

mongoose.connect(DB_URI)
  .then(() => {
    console.log('Base de datos conectada exitosamente');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error al conectar a MongoDB:', err);
    process.exit(1);
  });