const express = require('express');
const router = express.Router();
const rendezVousController = require('../controllers/rendezVousController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

router.post('/', auth, roleAuth(['admin', 'medecin', 'secretaire']), rendezVousController.createRendezVous);
router.get('/', rendezVousController.getRendezVous);
router.get('/:id', rendezVousController.getRendezVousById);
router.put('/:id', auth, roleAuth(['admin', 'medecin', 'secretaire']), rendezVousController.updateRendezVous);
router.delete('/:id', auth, roleAuth(['admin', 'medecin', 'secretaire']), rendezVousController.deleteRendezVous);

module.exports = router;
