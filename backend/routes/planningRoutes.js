const express = require('express');
const router = express.Router();
const planningController = require('../controllers/planningController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

router.post('/', auth, roleAuth(['admin', 'medecin', 'secretaire']), planningController.createPlanning);
router.get('/', planningController.getPlannings);
router.get('/:id', planningController.getPlanningById);
router.put('/:id', auth, roleAuth(['admin', 'medecin', 'secretaire']), planningController.updatePlanning);
router.delete('/:id', auth, roleAuth('admin'), planningController.deletePlanning);

module.exports = router;
