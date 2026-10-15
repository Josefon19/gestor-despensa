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
      match: [/^\S+@\S+\.\S+$/, 'Correo inválido'],
    },
    password: { type: String, required: true }, // siempre el hash, nunca texto plano
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);