const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Utilisateur = require('../models/Utilisateur');

// Middleware pour protéger les routes
exports.protegerRoute = asyncHandler(async (req, res, next) => {
  let token;

  // Vérifier si le token est présent dans les en-têtes
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extraire le token du header
      token = req.headers.authorization.split(' ')[1];

      // Vérifier le token
      const decode = jwt.verify(token, process.env.JWT_SECRET);

      // Récupérer l'utilisateur à partir du token et vérifier s'il est actif
      req.user = await Utilisateur.findOne({ 
        _id: decode.id, 
        actif: true 
      }).select('-motDePasse -__v -dateCreation -dateMiseAJour');
      
      if (!req.user) {
        const error = new Error('Utilisateur non trouvé ou compte désactivé');
        error.statusCode = 401;
        error.erreurs = [
          { champ: 'authentification', message: 'Votre compte a été désactivé ou n\'existe plus' }
        ];
        throw error;
      }
      
      next();
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
      
      let message = 'Session expirée ou invalide';
      let statusCode = 401;
      
      if (error.name === 'JsonWebTokenError') {
        message = 'Token invalide';
      } else if (error.name === 'TokenExpiredError') {
        message = 'Session expirée, veuillez vous reconnecter';
      }
      
      res.status(statusCode).json({
        succes: false,
        message,
        erreurs: [
          { champ: 'authentification', message }
        ]
      });
    }
  } else {
    res.status(401).json({ 
      succes: false,
      message: 'Accès non autorisé',
      erreurs: [
        { champ: 'authentification', message: 'Aucun token d\'authentification fourni' }
      ]
    });
  }
});

// Middleware pour vérifier les rôles
exports.autoriser = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        succes: false,
        message: 'Non authentifié',
        erreurs: [
          { champ: 'autorisation', message: 'Vous devez être connecté pour accéder à cette ressource' }
        ]
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        succes: false,
        message: 'Accès refusé',
        erreurs: [
          { 
            champ: 'autorisation', 
            message: `Votre rôle (${req.user.role}) ne vous permet pas d'accéder à cette ressource`
          }
        ]
      });
    }
    
    next();
  };
};

// Middleware pour vérifier la propriété ou les droits d'administration
exports.proprietaireOuAdmin = (modele, champId = 'utilisateur') => {
  return async (req, res, next) => {
    try {
      // Vérifier si l'utilisateur est authentifié
      if (!req.user) {
        return res.status(401).json({
          succes: false,
          message: 'Non authentifié',
          erreurs: [
            { champ: 'authentification', message: 'Vous devez être connecté pour effectuer cette action' }
          ]
        });
      }

      // Récupérer le document
      const document = await modele.findById(req.params.id);
      
      if (!document) {
        return res.status(404).json({
          succes: false,
          message: 'Ressource non trouvée',
          erreurs: [
            { champ: 'id', message: `${modele.modelName} non trouvé avec l'ID fourni` }
          ]
        });
      }
      
      // Vérifier si l'utilisateur est le propriétaire ou un administrateur
      const estProprietaire = document[champId] && document[champId].toString() === req.user.id;
      const estAdmin = req.user.role === 'admin';
      
      if (!estProprietaire && !estAdmin) {
        return res.status(403).json({
          succes: false,
          message: 'Accès refusé',
          erreurs: [
            { 
              champ: 'autorisation', 
              message: 'Vous n\'êtes pas autorisé à effectuer cette action sur cette ressource' 
            }
          ]
        });
      }
      
      // Stocker le document dans la requête pour une utilisation ultérieure
      req.document = document;
      next();
    } catch (error) {
      console.error(`Erreur lors de la vérification des droits sur ${modele.modelName}:`, error);
      
      let message = 'Une erreur est survenue lors de la vérification des droits';
      let statusCode = 500;
      
      if (error.name === 'CastError') {
        message = 'ID de ressource invalide';
        statusCode = 400;
      }
      
      res.status(statusCode).json({
        succes: false,
        message,
        erreur: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};
