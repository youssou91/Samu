"use strict";const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  obtenirPerformanceMedecins,
  obtenirSatisfactionPatients
} = require('../controllers/rapportsController2');
const {
  genererRapportPersonnalise,
  exporterRapport
} = require('../controllers/rapportsController3');

// Importer les contrôleurs de la partie 4
const {
  buildRapportMedecins
} = require('../controllers/rapportsController4');

// Middleware pour vérifier les rôles autorisés
const adminOnly = authorize('admin');

/**
 * @route   GET /api/rapports/performance-medecins
 * @desc    Obtenir les statistiques de performance des médecins
 * @access  Admin
 */
router.get(
  '/performance-medecins',
  [
  auth,
  adminOnly,
  check('dateDebut', 'Format de date de début invalide (YYYY-MM-DD)').
  optional().
  isISO8601(),
  check('dateFin', 'Format de date de fin invalide (YYYY-MM-DD)').
  optional().
  isISO8601()],

  obtenirPerformanceMedecins
);

/**
 * @route   GET /api/rapports/satisfaction
 * @desc    Obtenir les statistiques de satisfaction des patients
 * @access  Admin
 */
router.get(
  '/satisfaction',
  [
  auth,
  adminOnly,
  check('dateDebut', 'Format de date de début invalide (YYYY-MM-DD)').
  optional().
  isISO8601(),
  check('dateFin', 'Format de date de fin invalide (YYYY-MM-DD)').
  optional().
  isISO8601(),
  check('medecinId', 'ID de médecin invalide').
  optional().
  isMongoId()],

  obtenirSatisfactionPatients
);

/**
 * @route   POST /api/rapports/personnalise
 * @desc    Générer un rapport personnalisé
 * @access  Admin
 */
router.post(
  '/personnalise',
  [
  auth,
  adminOnly,
  check('typeRapport', 'Le type de rapport est requis').
  isIn(['rendez-vous', 'patients', 'medecins', 'financier', 'satisfaction', 'performance']),
  check('dateDebut', 'Format de date de début invalide (YYYY-MM-DD)').
  optional().
  isISO8601(),
  check('dateFin', 'Format de date de fin invalide (YYYY-MM-DD)').
  optional().
  isISO8601(),
  check('groupBy', 'Le type de regroupement est invalide').
  optional().
  isIn(['day', 'week', 'month', 'year', 'medecin', 'patient', 'type']),
  check('filtres', 'Les filtres doivent être un objet').
  optional().
  isObject(),
  check('colonnes', 'Les colonnes doivent être un tableau').
  optional().
  isArray()],

  genererRapportPersonnalise
);

/**
 * @route   POST /api/rapports/export
 * @desc    Exporter un rapport au format CSV ou Excel
 * @access  Admin
 */
router.post(
  '/export',
  [
  auth,
  adminOnly,
  check('format', 'Le format d\'export est invalide').
  optional().
  isIn(['csv', 'excel', 'json']),
  check('typeRapport', 'Le type de rapport est requis pour l\'export').
  isIn(['rendez-vous', 'patients', 'medecins', 'financier', 'satisfaction', 'performance']),
  check('dateDebut', 'Format de date de début invalide (YYYY-MM-DD)').
  optional().
  isISO8601(),
  check('dateFin', 'Format de date de fin invalide (YYYY-MM-DD)').
  optional().
  isISO8601()],

  exporterRapport
);

module.exports = router;
//# sourceMappingURL=rapports.js.map