const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  prenom: { type: String, required: true },
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  telephone: { type: String },
  role: { type: String, enum: ['admin', 'medecin', 'infirmier', 'patient', 'secretaire'], default: 'patient' },
  actif: { type: Boolean, default: true },
  password: { type: String, required: true },
  specialite: { type: String },
  status: { type: String, default: 'active' }
});

module.exports = mongoose.model('User', UserSchema);
