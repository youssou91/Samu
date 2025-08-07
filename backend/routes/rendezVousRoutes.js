const express = require('express');
const router = express.Router();
const rendezVousController = require('../controllers/rendezVousController');

// Routes pour les rendez-vous
router.route('/')
  .post(rendezVousController.createRendezVous)
  .get(rendezVousController.getAllRendezVous);

router.route('/:id')
  .get(rendezVousController.getRendezVous)
  .patch(rendezVousController.updateRendezVous)
  .delete(rendezVousController.deleteRendezVous);

// Routes pour les rendez-vous par patient/médecin
router.get('/patient/:patientId', rendezVousController.getRendezVousByPatient);
router.get('/medecin/:medecinId', rendezVousController.getRendezVousByMedecin);

module.exports = router;
