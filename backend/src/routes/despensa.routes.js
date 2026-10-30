const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const controller = require('../controllers/despensa.controller');
const express = require('express');
const { limiteFotos } = require('../middleware/seguridad');

router.use(auth);
router.post('/foto', limiteFotos, express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb', inflate: false }), controller.subirFoto);
router.get('/', controller.listar);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.delete('/:id', controller.eliminar);
router.use((error, _req, res, next) => {
  if (error.type === 'entity.too.large') return res.status(413).json({ mensaje: 'La foto debe pesar como máximo 5 MB' });
  return next(error);
});

module.exports = router;
