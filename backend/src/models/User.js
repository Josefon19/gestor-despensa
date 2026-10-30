const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    correo: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [/^\S+@\S+\.\S+$/, 'Correo inválido'],
    },
    password: { type: String, required: function () { return !this.firebaseUid; }, select: false },
    firebaseUid: { type: String, unique: true, sparse: true, maxlength: 128 },
    consentimiento: {
      aceptado: { type: Boolean, required: true },
      fecha: { type: Date, required: true },
      versionAviso: { type: String, required: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
