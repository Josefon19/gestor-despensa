const mongoose = require('mongoose');
const Registro = require('../models/RegistroDespensa');
const { validarRegistro } = require('../validation/despensa');
const { subirFoto, fotoAutorizada } = require('../services/cloudinary');

const publico = (registro) => ({
  id: String(registro._id), tipo: registro.tipo, nombre: registro.nombre,
  cantidad: registro.cantidad, unidad: registro.unidad, lugar: registro.lugar,
  fechaLimite: registro.fechaLimite, fechaElaboracion: registro.fechaElaboracion, notas: registro.notas,
  ...(registro.foto ? { foto: { url: registro.foto.url, publicId: registro.foto.publicId } } : {}),
});
const fallo = (res, error) => res.status(error.name === 'ValidationError' ? 400 : 500)
  .json({ mensaje: error.name === 'ValidationError' ? 'Datos del registro inválidos' : 'No se pudo completar la operación de despensa' });

exports.listar = async (req, res) => {
  try {
    const registros = await Registro.find({ usuario: req.userId }).sort({ createdAt: -1 });
    return res.json({ registros: registros.map(publico) });
  } catch (error) { return fallo(res, error); }
};
exports.crear = async (req, res) => {
  const { datos, error } = validarRegistro(req.body);
  if (error) return res.status(400).json({ mensaje: error });
  if (req.body.foto !== undefined) {
    if (!fotoAutorizada(req.body.foto, req.userId)) return res.status(400).json({ mensaje: 'La foto no pertenece a esta cuenta o no se subió correctamente' });
    datos.foto = { url: req.body.foto.url, publicId: req.body.foto.publicId };
  }
  try {
    const registro = await Registro.create({ ...datos, usuario: req.userId });
    return res.status(201).json({ registro: publico(registro) });
  } catch (error) { return fallo(res, error); }
};
exports.actualizar = async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ mensaje: 'Identificador inválido' });
  const { datos, error } = validarRegistro(req.body);
  if (error) return res.status(400).json({ mensaje: error });
  if (req.body.foto !== undefined) {
    if (!fotoAutorizada(req.body.foto, req.userId)) return res.status(400).json({ mensaje: 'La foto no pertenece a esta cuenta o no se subió correctamente' });
    datos.foto = { url: req.body.foto.url, publicId: req.body.foto.publicId };
  }
  try {
    const registro = await Registro.findOneAndUpdate(
      { _id: req.params.id, usuario: req.userId }, { $set: datos }, { returnDocument: 'after', runValidators: true }
    );
    if (!registro) return res.status(404).json({ mensaje: 'Registro no encontrado' });
    return res.json({ registro: publico(registro) });
  } catch (error) { return fallo(res, error); }
};
exports.eliminar = async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ mensaje: 'Identificador inválido' });
  try {
    const registro = await Registro.findOneAndDelete({ _id: req.params.id, usuario: req.userId });
    if (!registro) return res.status(404).json({ mensaje: 'Registro no encontrado' });
    return res.json({ ok: true });
  } catch (error) { return fallo(res, error); }
};
exports.subirFoto = async (req, res) => {
  try { return res.status(201).json({ foto: await subirFoto(req.body, req.get('content-type')?.split(';')[0], req.userId) }); }
  catch (error) { return res.status(error.status || 500).json({ mensaje: error.status ? error.message : 'No se pudo guardar la foto' }); }
};
