const router = require('express').Router();
const { register, login, me } = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');
const { google } = require('../controllers/google.controller');
const { limiteAcceso, limiteRegistro } = require('../middleware/seguridad');

router.post('/register', limiteRegistro, register);
router.post('/login', limiteAcceso, login);
router.post('/google', limiteAcceso, google);
router.get('/me', auth, me);

module.exports = router;
