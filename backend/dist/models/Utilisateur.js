"use strict";const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const utilisateurSchema = new mongoose.Schema({
  prenom: {
    type: String,
    required: [true, 'Veuillez ajouter un prénom'],
    trim: true,
    maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères']
  },
  nom: {
    type: String,
    required: [true, 'Veuillez ajouter un nom'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'Veuillez ajouter un email'],
    unique: true,
    match: [
    /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
    'Veuillez ajouter un email valide']

  },
  telephone: {
    type: String,
    maxlength: [20, 'Le numéro de téléphone ne peut pas dépasser 20 caractères'],
    required: [true, 'Veuillez ajouter un numéro de téléphone']
  },
  role: {
    type: String,
    enum: ['patient', 'medecin', 'infirmier', 'secretaire', 'admin'],
    default: 'patient'
  },
  motDePasse: {
    type: String,
    required: [true, 'Veuillez ajouter un mot de passe'],
    minlength: 6,
    select: false // Ne pas renvoyer le mot de passe dans les requêtes
  },
  specialite: {
    type: String,
    required: [
    function () {
      return this.role === 'medecin' || this.role === 'infirmier';
    },
    'Veuillez ajouter une spécialité pour les professionnels de santé'],

    enum: [
    'medecin_generaliste',
    'cardiologue',
    'dermatologue',
    'pediatre',
    'gynecologue',
    'autre']

  },
  actif: {
    type: Boolean,
    default: true
  },
  derniereConnexion: {
    type: Date
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

// Crypter le mot de passe avant de sauvegarder
utilisateurSchema.pre('save', async function (next) {
  if (!this.isModified('motDePasse')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
});

// Mettre à jour la date de mise à jour avant de sauvegarder
utilisateurSchema.pre('save', function (next) {
  this.dateMiseAJour = Date.now();
  next();
});

// Sign JWT and return
utilisateurSchema.methods.genererJeton = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Match user entered password to hashed password in database
utilisateurSchema.methods.verifierMotDePasse = async function (motDePasseSaisi) {
  return await bcrypt.compare(motDePasseSaisi, this.motDePasse);
};

// Cascade delete rendez-vous when a user is deleted
utilisateurSchema.pre('remove', async function (next) {
  await this.model('RendezVous').deleteMany({ patient: this._id });
  next();
});

// Reverse populate with virtuals
utilisateurSchema.virtual('rendezVous', {
  ref: 'RendezVous',
  localField: '_id',
  foreignField: 'patient',
  justOne: false
});

// Create a compound index for faster queries
utilisateurSchema.index({ nom: 'text', prenom: 'text', email: 'text' });

module.exports = mongoose.model('Utilisateur', utilisateurSchema);
//# sourceMappingURL=Utilisateur.js.map