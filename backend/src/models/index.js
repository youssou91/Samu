const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

// Schéma pour l'adresse
const adresseSchema = new mongoose.Schema({
  rue: {
    type: String,
    required: [true, 'La rue est requise'],
    trim: true,
  },
  complement: {
    type: String,
    trim: true,
  },
  codePostal: {
    type: String,
    required: [true, 'Le code postal est requis'],
    trim: true,
  },
  ville: {
    type: String,
    required: [true, 'La ville est requise'],
    trim: true,
  },
  pays: {
    type: String,
    default: 'France',
    trim: true,
  },
}, { _id: false });

// Schéma de base pour l'utilisateur
const utilisateurSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
      minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
      maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
    },
    prenom: {
      type: String,
      required: [true, 'Le prénom est requis'],
      trim: true,
      minlength: [2, 'Le prénom doit contenir au moins 2 caractères'],
      maxlength: [100, 'Le prénom ne peut pas dépasser 100 caractères'],
    },
    email: {
      type: String,
      required: [true, 'L\'email est requis'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Veuillez fournir un email valide'],
    },
    motDePasse: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
      select: false, // Ne pas renvoyer le mot de passe par défaut
    },
    telephone: {
      type: String,
      required: [true, 'Le numéro de téléphone est requis'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Veuillez fournir un numéro de téléphone valide'],
    },
    dateNaissance: {
      type: Date,
      required: [true, 'La date de naissance est requise'],
    },
    adresse: {
      type: adresseSchema,
      required: [true, 'L\'adresse est requise'],
    },
    role: {
      type: String,
      enum: ['patient', 'medecin', 'secretaire', 'admin'],
      default: 'patient',
    },
    specialite: {
      type: String,
      required: [
        function() {
          return this.role === 'medecin';
        },
        'La spécialité est requise pour un médecin',
      ],
      trim: true,
    },
    numeroSecuriteSociale: {
      type: String,
      required: [
        function() {
          return this.role === 'patient';
        },
        'Le numéro de sécurité sociale est requis pour un patient',
      ],
      unique: true,
      sparse: true,
      trim: true,
      match: [/^[12][0-9]{2}(0[1-9]|1[0-2])(2[AB]|[0-9]{2})[0-9]{3}[0-9]{3}[0-9]{2}$/, 'Numéro de sécurité sociale invalide'],
    },
    emailVerifie: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    actif: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index pour les recherches fréquentes
utilisateurSchema.index({ email: 1 }, { unique: true });
utilisateurSchema.index({ role: 1 });
utilisateurSchema.index({ 'adresse.ville': 1 });
utilisateurSchema.index({ 'adresse.codePostal': 1 });

// Méthodes d'instance
utilisateurSchema.methods.verifierMotDePasse = async function (motDePasseSaisi) {
  return await bcrypt.compare(motDePasseSaisi, this.motDePasse);
};

// Hacher le mot de passe avant de sauvegarder
utilisateurSchema.pre('save', async function (next) {
  if (!this.isModified('motDePasse')) return next();
  
  try {
    const salt = await bcrypt.genSalt(config.security.passwordSaltRounds);
    this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Schéma pour les rendez-vous
const rendezVousSchema = new mongoose.Schema(
  {
    numeroDossier: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Utilisateur',
      required: [true, 'L\'ID du patient est requis'],
    },
    patientNom: {
      type: String,
      required: [true, 'Le nom du patient est requis'],
      trim: true,
    },
    patientTelephone: {
      type: String,
      required: [true, 'Le numéro de téléphone du patient est requis'],
      trim: true,
    },
    medecinId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Utilisateur',
      required: [true, 'L\'ID du médecin est requis'],
    },
    medecinNom: {
      type: String,
      required: [true, 'Le nom du médecin est requis'],
      trim: true,
    },
    dateDebut: {
      type: Date,
      required: [true, 'La date de début est requise'],
    },
    dateFin: {
      type: Date,
      required: [true, 'La date de fin est requise'],
      validate: {
        validator: function (value) {
          return value > this.dateDebut;
        },
        message: 'La date de fin doit être postérieure à la date de début',
      },
    },
    duree: {
      type: Number, // en minutes
      required: [true, 'La durée est requise'],
      min: [5, 'La durée minimale est de 5 minutes'],
      max: [240, 'La durée maximale est de 4 heures'],
    },
    type: {
      type: String,
      enum: ['consultation', 'controle', 'urgence', 'autre'],
      default: 'consultation',
    },
    motif: {
      type: String,
      required: [true, 'Le motif est requis'],
      trim: true,
      maxlength: [1000, 'Le motif ne peut pas dépasser 1000 caractères'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Les notes ne peuvent pas dépasser 2000 caractères'],
    },
    statut: {
      type: String,
      enum: [
        'en_attente',
        'confirme',
        'en_cours',
        'termine',
        'annule',
        'rate',
        'en_retard',
      ],
      default: 'en_attente',
    },
    presenceConfirmee: {
      type: Boolean,
      default: false,
    },
    heureArrivee: {
      type: Date,
    },
    dureeReelle: {
      type: Number, // en minutes
    },
    factureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Facture',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index pour les recherches fréquentes
rendezVousSchema.index({ patientId: 1 });
rendezVousSchema.index({ medecinId: 1 });
rendezVousSchema.index({ dateDebut: 1 });
rendezVousSchema.index({ dateFin: 1 });
rendezVousSchema.index({ statut: 1 });

// Méthodes d'instance
rendezVousSchema.methods.estDisponible = function () {
  // TODO: Implémenter la logique de disponibilité
  return true;
};

// Modèles
const Utilisateur = mongoose.model('Utilisateur', utilisateurSchema);
const RendezVous = mongoose.model('RendezVous', rendezVousSchema);

module.exports = {
  Utilisateur,
  RendezVous,
};
