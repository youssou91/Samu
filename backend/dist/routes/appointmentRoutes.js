"use strict";const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const {
  createAppointment,
  getAppointments,
  updateAppointment,
  deleteAppointment,
  startAppointment,
  completeAppointment
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protéger toutes les routes avec l'authentification
router.use(protect);

// Routes pour les rendez-vous
router.
route('/').
get(getAppointments).
post(
  [
  check('patientId', 'ID du patient requis').not().isEmpty(),
  check('patientName', 'Nom du patient requis').not().isEmpty(),
  check('patientPhone', 'Téléphone du patient requis').not().isEmpty(),
  check('doctorId', 'ID du médecin requis').not().isEmpty(),
  check('doctorName', 'Nom du médecin requis').not().isEmpty(),
  check('startTime', 'Heure de début requise').isISO8601().toDate(),
  check('endTime', 'Heure de fin requise').isISO8601().toDate(),
  check('type', 'Type de consultation requis').isIn(['consultation', 'controle', 'urgence', 'autre'])],

  createAppointment
);

router.
route('/:id').
put(
  [
  check('status').optional().isIn(['en_attente', 'confirme', 'en_cours', 'termine', 'annule', 'rate']),
  check('startTime').optional().isISO8601().toDate(),
  check('endTime').optional().isISO8601().toDate()],

  updateAppointment
).
delete(deleteAppointment);

// Routes pour le suivi des rendez-vous
router.put('/:id/start', startAppointment);
router.put('/:id/complete', completeAppointment);

module.exports = router;
//# sourceMappingURL=appointmentRoutes.js.map