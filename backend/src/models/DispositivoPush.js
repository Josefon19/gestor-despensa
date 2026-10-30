const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  instalacionId: { type: String, required: true, match: /^[a-f0-9]{32}$/ },
  token: { type: String, required: true, unique: true, select: false },
  anticipacion: { type: Number, required: true, min: 1, max: 7 },
  zonaHoraria: { type: String, required: true },
  ultimaPrueba: Date, ultimoDiaAvisado: String, bloqueoHasta: Date,
}, { timestamps: true });
schema.index({ usuario: 1, instalacionId: 1 });
module.exports = mongoose.model('DispositivoPush', schema);
