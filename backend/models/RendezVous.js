const mongoose = require('mongoose');

const RendezVousSchema = new mongoose.Schema({
  patient: { type: String, required: true },
  medecin: { type: String, required: true },
  date: { type: String, required: true },
  heure: { type: String, required: true },
  motif: { type: String },
  status: { type: String, enum: ['confirmé', 'en_attente', 'annulé'], default: 'en_attente' },
  telephone: { type: String },
  email: { type: String }
});

module.exports = mongoose.model('RendezVous', RendezVousSchema);
