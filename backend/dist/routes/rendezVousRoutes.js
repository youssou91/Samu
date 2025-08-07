"use strict";const express = require('express');
const router = express.Router();
const { check, query } = require('express-validator');
const {
  creerRendezVous,
  obtenirRendezVous,
  mettreAJourRendezVous,
  supprimerRendezVous,
  commencerRendezVous,
  terminerRendezVous
} = require('../controllers/rendezVousController');
const { protegerRoute, autoriser } = require('../middleware/authMiddleware');

// Protéger toutes les routes avec l'authentification
router.use(protegerRoute);

/**
 * @route   GET /api/rendez-vous
 * @desc    Récupérer tous les rendez-vous avec filtrage
 * @access  Privé (Médecin, Secrétaire, Admin)
 */
router.get(
  '/',
  [
  query('statut').
  optional().
  isIn(['en_attente', 'confirme', 'en_cours', 'termine', 'annule', 'rate', 'en_retard']).
  withMessage('Statut de rendez-vous invalide'),
  query('date').
  optional().
  isISO8601().
  withMessage('Format de date invalide. Utilisez le format ISO8601 (YYYY-MM-DD)'),
  query('medecinId').
  optional().
  isMongoId().
  withMessage('ID médecin invalide'),
  query('patientId').
  optional().
  isMongoId().
  withMessage('ID patient invalide'),
  query('type').
  optional().
  isIn(['consultation', 'controle', 'urgence', 'autre']).
  withMessage('Type de consultation invalide'),
  query('page').
  optional().
  isInt({ min: 1 }).
  withMessage('Le numéro de page doit être un entier positif'),
  query('limit').
  optional().
  isInt({ min: 1, max: 100 }).
  withMessage('La limite doit être un entier entre 1 et 100')],

  obtenirRendezVous
);

/**
 * @route   POST /api/rendez-vous
 * @desc    Créer un nouveau rendez-vous
 * @access  Privé (Médecin, Secrétaire, Admin)
 */
router.post(
  '/',
  [
  check('patientId', 'ID du patient requis').
  notEmpty().
  isMongoId().
  withMessage('ID patient invalide'),
  check('patientNom', 'Nom du patient requis').
  notEmpty().
  trim().
  isLength({ min: 2, max: 100 }).
  withMessage('Le nom du patient doit contenir entre 2 et 100 caractères'),
  check('patientTelephone', 'Téléphone du patient requis').
  notEmpty().
  trim().
  isMobilePhone('fr-FR').
  withMessage('Numéro de téléphone invalide'),
  check('medecinId', 'ID du médecin requis').
  notEmpty().
  isMongoId().
  withMessage('ID médecin invalide'),
  check('medecinNom', 'Nom du médecin requis').
  notEmpty().
  trim().
  isLength({ min: 2, max: 100 }).
  withMessage('Le nom du médecin doit contenir entre 2 et 100 caractères'),
  check('dateDebut', 'Date de début requise').
  notEmpty().
  isISO8601().
  withMessage('Format de date de début invalide. Utilisez le format ISO8601 (ex: 2023-01-01T09:00:00.000Z)').
  toDate(),
  check('dateFin', 'Date de fin requise').
  notEmpty().
  isISO8601().
  withMessage('Format de date de fin invalide. Utilisez le format ISO8601 (ex: 2023-01-01T09:30:00.000Z)').
  toDate().
  custom((value, { req }) => {
    if (new Date(value) <= new Date(req.body.dateDebut)) {
      throw new Error('La date de fin doit être postérieure à la date de début');
    }
    return true;
  }),
  check('type', 'Type de consultation requis').
  notEmpty().
  isIn(['consultation', 'controle', 'urgence', 'autre']).
  withMessage('Type de consultation invalide'),
  check('motif', 'Motif de la consultation').
  optional().
  trim().
  isLength({ max: 1000 }).
  withMessage('Le motif ne doit pas dépasser 1000 caractères'),
  check('notes', 'Notes supplémentaires').
  optional().
  trim().
  isLength({ max: 2000 }).
  withMessage('Les notes ne doivent pas dépasser 2000 caractères')],

  autoriser('medecin', 'secretaire', 'admin'),
  creerRendezVous
);

/**
 * @route   PUT /api/rendez-vous/:id
 * @desc    Mettre à jour un rendez-vous
 * @access  Privé (Médecin, Secrétaire, Admin)
 */
router.put(
  '/:id',
  [
  check('statut').
  optional().
  isIn(['en_attente', 'confirme', 'en_cours', 'termine', 'annule', 'rate', 'en_retard']).
  withMessage('Statut de rendez-vous invalide'),
  check('dateDebut').
  optional().
  isISO8601().
  withMessage('Format de date de début invalide').
  toDate(),
  check('dateFin').
  optional().
  isISO8601().
  withMessage('Format de date de fin invalide').
  toDate().
  custom((value, { req }) => {
    if (req.body.dateDebut && new Date(value) <= new Date(req.body.dateDebut)) {
      throw new Error('La date de fin doit être postérieure à la date de début');
    }
    return true;
  }),
  check('type').
  optional().
  isIn(['consultation', 'controle', 'urgence', 'autre']).
  withMessage('Type de consultation invalide'),
  check('motif').
  optional().
  trim().
  isLength({ max: 1000 }).
  withMessage('Le motif ne doit pas dépasser 1000 caractères'),
  check('notes').
  optional().
  trim().
  isLength({ max: 2000 }).
  withMessage('Les notes ne doivent pas dépasser 2000 caractères'),
  check('presenceConfirmee').
  optional().
  isBoolean().
  withMessage('La confirmation de présence doit être un booléen'),
  check('heureArrivee').
  optional().
  isISO8601().
  withMessage('Format d\'heure d\'arrivée invalide')],

  autoriser('medecin', 'secretaire', 'admin'),
  mettreAJourRendezVous
);

/**
 * @route   DELETE /api/rendez-vous/:id
 * @desc    Supprimer un rendez-vous (soft delete)
 * @access  Privé (Médecin, Secrétaire, Admin)
 */
router.delete(
  '/:id',
  autoriser('medecin', 'secretaire', 'admin'),
  supprimerRendezVous
);

/**
 * @route   PUT /api/rendez-vous/:id/commencer
 * @desc    Marquer un rendez-vous comme commencé
 * @access  Privé (Médecin)
 */
router.put(
  '/:id/commencer',
  autoriser('medecin'),
  commencerRendezVous
);

/**
 * @route   PUT /api/rendez-vous/:id/terminer
 * @desc    Marquer un rendez-vous comme terminé
 * @access  Privé (Médecin)
 */
router.put(
  '/:id/terminer',
  autoriser('medecin'),
  terminerRendezVous
);

module.exports = router;
//# sourceMappingURL=rendezVousRoutes.js.map