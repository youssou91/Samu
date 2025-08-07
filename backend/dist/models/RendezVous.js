"use strict";const mongoose = require('mongoose');

const rendezVousSchema = new mongoose.Schema({
  // Référence au patient (peut être un utilisateur ou un patient externe)
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  patientNom: {
    type: String,
    required: true,
    trim: true
  },
  patientTelephone: {
    type: String,
    required: true,
    trim: true
  },

  // Référence au médecin
  medecin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  medecinNom: {
    type: String,
    required: true,
    trim: true
  },

  // Détails du rendez-vous
  dateDebut: {
    type: Date,
    required: true
  },
  dateFin: {
    type: Date,
    required: true
  },

  // Type de consultation
  type: {
    type: String,
    enum: ['consultation', 'controle', 'urgence', 'autre'],
    default: 'consultation',
    required: true
  },

  // Statut du rendez-vous
  statut: {
    type: String,
    enum: ['en_attente', 'confirme', 'en_cours', 'termine', 'annule', 'rate'],
    default: 'en_attente',
    required: true
  },

  // Informations supplémentaires
  motif: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },

  // Suivi
  presenceConfirmee: {
    type: Boolean,
    default: false
  },
  heureArrivee: {
    type: Date
  },

  // Métadonnées
  creePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  modifiePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateMiseAJour: {
    type: Date
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les requêtes fréquentes
rendezVousSchema.index({ medecin: 1, dateDebut: 1, dateFin: 1 });
rendezVousSchema.index({ patient: 1, dateDebut: 1 });
rendezVousSchema.index({ statut: 1, dateDebut: 1 });

// Vérifier les conflits de rendez-vous
rendezVousSchema.pre('save', async function (next) {
  if (this.isModified('dateDebut') || this.isModified('dateFin') || this.isModified('medecin')) {
    const conflit = await this.constructor.findOne({
      _id: { $ne: this._id },
      medecin: this.medecin,
      statut: { $ne: 'annule' },
      $or: [
      { dateDebut: { $lt: this.dateFin }, dateFin: { $gt: this.dateDebut } }]

    });

    if (conflit) {
      throw new Error('Conflit de rendez-vous avec un autre créneau du médecin');
    }
  }
  next();
});

// Méthode pour vérifier la disponibilité d'un créneau
rendezVousSchema.statics.verifierDisponibilite = async function (medecinId, dateDebut, dateFin, rendezVousId = null) {
  const filtre = {
    medecin: medecinId,
    statut: { $ne: 'annule' },
    $or: [
    { dateDebut: { $lt: dateFin }, dateFin: { $gt: dateDebut } }]

  };

  if (rendezVousId) {
    filtre._id = { $ne: rendezVousId };
  }

  const conflit = await this.findOne(filtre);
  return !conflit;
};

// Middleware pour mettre à jour la date de mise à jour
rendezVousSchema.pre('save', function (next) {
  this.dateMiseAJour = Date.now();
  next();
});

const RendezVous = mongoose.model('RendezVous', rendezVousSchema);

module.exports = RendezVous;
//# sourceMappingURL=RendezVous.js.map