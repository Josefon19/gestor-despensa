const mongoose = require('mongoose');
const { TIPOS, LUGARES, UNIDADES, fechaValida } = require('../validation/despensa');

const schema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  tipo: { type: String, enum: TIPOS, required: true },
  nombre: { type: String, required: true, trim: true, maxlength: 100 },
  cantidad: { type: Number, required: true, min: Number.MIN_VALUE, max: 1_000_000 },
  unidad: { type: String, enum: UNIDADES, required: true },
  lugar: { type: String, enum: LUGARES, required: true },
  // Fechas de calendario, no instantes UTC: se muestran iguales en cualquier teléfono.
  fechaLimite: { type: String, default: '', validate: (valor) => valor === '' || fechaValida(valor) },
  fechaElaboracion: { type: String, default: '', validate: (valor) => valor === '' || fechaValida(valor) },
  notas: { type: String, default: '', maxlength: 500 },
  foto: { type: new mongoose.Schema({ url: { type: String, required: true }, publicId: { type: String, required: true } }, { _id: false }), default: undefined },
}, { timestamps: true });

schema.index({ usuario: 1, createdAt: -1 });
module.exports = mongoose.model('RegistroDespensa', schema);
