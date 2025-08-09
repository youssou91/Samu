const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// CRUD routes
router.post('/', auth, roleAuth('admin'), userController.createUser);
router.get('/', auth, roleAuth(['admin', 'medecin', 'secretaire']), userController.getUsers);
router.get('/:id', auth, roleAuth(['admin', 'medecin', 'secretaire']), userController.getUserById);
router.put('/:id', auth, roleAuth(['admin', 'secretaire']), userController.updateUser);
router.delete('/:id', auth, roleAuth('admin'), userController.deleteUser);

module.exports = router;
