const mongoose = require('mongoose');

const PresenceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  heureDebut: { type: String },
  heureFin: { type: String },
  statut: { type: String, enum: ['present', 'en_retard', 'absent'], default: 'present' },
  consultations: { type: Number },
  garde: { type: String },
  motif: { type: String },
  notes: { type: String }
});

module.exports = mongoose.model('Presence', PresenceSchema);
