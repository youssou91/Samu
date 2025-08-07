const Joi = require('joi');
const { objectId } = require('./custom.validation');

// Schéma pour la création d'un utilisateur
const createUser = {
  body: Joi.object().keys({
    nom: Joi.string().required().min(2).max(100).trim(),
    prenom: Joi.string().required().min(2).max(100).trim(),
    email: Joi.string().required().email().trim().lowercase(),
    telephone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    role: Joi.string().valid('patient', 'medecin', 'secretaire', 'admin').default('patient'),
    motDePasse: Joi.string().required().min(8).max(100),
    confirmMotDePasse: Joi.string().valid(Joi.ref('motDePasse')).required(),
    dateNaissance: Joi.date().max('now'),
    adresse: Joi.object({
      rue: Joi.string().required(),
      codePostal: Joi.string().required(),
      ville: Joi.string().required(),
      pays: Joi.string().default('France'),
    }),
  }),
};

// Schéma pour la connexion
const login = {
  body: Joi.object().keys({
    email: Joi.string().required().email().trim().lowercase(),
    motDePasse: Joi.string().required(),
  }),
};

// Schéma pour la création d'un rendez-vous
const createRendezVous = {
  body: Joi.object().keys({
    patientId: Joi.string().custom(objectId).required(),
    patientNom: Joi.string().required().trim(),
    patientTelephone: Joi.string().required().trim(),
    medecinId: Joi.string().custom(objectId).required(),
    medecinNom: Joi.string().required().trim(),
    dateDebut: Joi.date().iso().required(),
    dateFin: Joi.date().iso().greater(Joi.ref('dateDebut')).required(),
    type: Joi.string().valid('consultation', 'controle', 'urgence', 'autre').required(),
    motif: Joi.string().max(1000).trim(),
    notes: Joi.string().max(2000).trim(),
  }),
};

// Schéma pour la mise à jour d'un rendez-vous
const updateRendezVous = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      statut: Joi.string().valid(
        'en_attente',
        'confirme',
        'en_cours',
        'termine',
        'annule',
        'rate',
        'en_retard'
      ),
      dateDebut: Joi.date().iso(),
      dateFin: Joi.date().iso().greater(Joi.ref('dateDebut')),
      type: Joi.string().valid('consultation', 'controle', 'urgence', 'autre'),
      motif: Joi.string().max(1000).trim(),
      notes: Joi.string().max(2000).trim(),
      presenceConfirmee: Joi.boolean(),
      heureArrivee: Joi.date().iso(),
    })
    .min(1), // Au moins un champ doit être fourni pour la mise à jour
};

// Schéma pour la réinitialisation du mot de passe
const resetPassword = {
  params: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    motDePasse: Joi.string().required().min(8).max(100),
    confirmMotDePasse: Joi.string().valid(Joi.ref('motDePasse')).required(),
  }),
};

// Schéma pour la demande de réinitialisation du mot de passe
const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().required().email().trim().lowercase(),
  }),
};

// Schéma pour la validation des IDs MongoDB
const objectIdParam = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

// Schéma pour la pagination et le filtrage
const pagination = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
    search: Joi.string(),
    statut: Joi.string(),
    dateDebut: Joi.date().iso(),
    dateFin: Joi.date().iso(),
    medecinId: Joi.string().custom(objectId),
    patientId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createUser,
  login,
  createRendezVous,
  updateRendezVous,
  resetPassword,
  forgotPassword,
  objectIdParam,
  pagination,
};
