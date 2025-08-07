const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { 
  inscription, 
  connexion, 
  obtenirProfil 
} = require('../controllers/authController');
const { protegerRoute } = require('../middleware/authMiddleware');

// Routes publiques
router.post(
  '/inscription',
  [
    check('prenom', 'Le prénom est requis').not().isEmpty(),
    check('nom', 'Le nom est requis').not().isEmpty(),
    check('email', 'Veuillez inclure un email valide').isEmail(),
    check('motDePasse', 'Veuillez entrer un mot de passe avec 6 caractères ou plus').isLength({ min: 6 }),
    check('telephone', 'Le numéro de téléphone est requis').not().isEmpty()
  ],
  inscription
);

router.post(
  '/connexion',
  [
    check('email', 'Veuillez inclure un email valide').isEmail(),
    check('motDePasse', 'Le mot de passe est requis').exists()
  ],
  connexion
);

// Route protégée
router.get('/profil', protegerRoute, obtenirProfil);

module.exports = router;
