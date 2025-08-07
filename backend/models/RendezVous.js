const mongoose = require('mongoose');

const rendezVousSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le patient est requis']
  },
  medecin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le médecin est requis']
  },
  dateHeureDebut: {
    type: Date,
    required: [true, 'La date et l\'heure de début sont requises']
  },
  dateHeureFin: {
    type: Date,
    required: [true, 'La date et l\'heure de fin sont requises']
  },
  statut: {
    type: String,
    enum: ['planifie', 'confirme', 'annule', 'termine', 'absent'],
    default: 'planifie'
  },
  motif: {
    type: String,
    trim: true,
    required: [true, 'Le motif de la consultation est requis']
  },
  notes: {
    type: String,
    trim: true
  },
  diagnostic: {
    type: String,
    trim: true
  },
  traitement: {
    type: String,
    trim: true
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateModification: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour mettre à jour la date de modification avant la sauvegarde
rendezVousSchema.pre('save', function(next) {
  this.dateModification = Date.now();
  next();
});

// Index pour les recherches fréquentes
rendezVousSchema.index({ patient: 1, dateHeureDebut: 1 });
rendezVousSchema.index({ medecin: 1, dateHeureDebut: 1 });

const RendezVous = mongoose.model('RendezVous', rendezVousSchema);

module.exports = RendezVous;
