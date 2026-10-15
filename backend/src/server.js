require('dotenv').config();
const app = require('./app');
const Database = require('./config/db');

const PORT = process.env.PORT || 3000;

Database.getInstance()
  .connect()
  .then(() => app.listen(PORT, () => console.log(`API en http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('No se pudo conectar a MongoDB:', err.message);
    process.exit(1);
  });