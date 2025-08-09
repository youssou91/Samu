const express = require('express');
const router = express.Router();
const presenceController = require('../controllers/presenceController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

router.post('/', auth, roleAuth(['admin', 'medecin', 'secretaire']), presenceController.createPresence);
router.get('/', presenceController.getPresences);
router.get('/:id', presenceController.getPresenceById);
router.put('/:id', auth, roleAuth(['admin', 'medecin', 'secretaire']), presenceController.updatePresence);
router.delete('/:id', auth, roleAuth(['admin', 'medecin', 'secretaire']), presenceController.deletePresence);

module.exports = router;
