const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const logger = require('../config/logger');
const { Utilisateur } = require('../models');

/**
 * Middleware pour protéger les routes nécessitant une authentification
 * Vérifie la présence et la validité du token JWT
 */
const proteger = async (req, res, next) => {
  try {
    let token;
    
    // 1) Vérifier si le token est présent dans les en-têtes
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Format: Bearer <token>
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Vérifier dans les cookies
      token = req.cookies.token;
    }

    if (!token) {
      return next(
        new UnauthorizedError(
          'Vous n\'êtes pas connecté. Veuillez vous connecter pour accéder à cette ressource.'
        )
      );
    }

    // 2) Vérifier et décoder le token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Vérifier si l'utilisateur existe toujours
    const utilisateurActuel = await Utilisateur.findById(decoded.id);
    if (!utilisateurActuel) {
      return next(
        new UnauthorizedError(
          'Le compte associé à ce token n\'existe plus.'
        )
      );
    }

    // 4) Vérifier si le mot de passe a été modifié après l'émission du token
    if (utilisateurActuel.changedPasswordAfter(decoded.iat)) {
      return next(
        new UnauthorizedError(
          'Le mot de passe a été modifié récemment. Veuillez vous reconnecter.'
        )
      );
    }

    // 5) Ajouter l'utilisateur à la requête pour les middlewares suivants
    req.utilisateur = utilisateurActuel;
    res.locals.utilisateur = utilisateurActuel;
    
    next();
  } catch (error) {
    logger.error('Erreur d\'authentification:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Token invalide. Veuillez vous reconnecter.'));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Votre session a expiré. Veuillez vous reconnecter.'));
    }
    
    next(error);
  }
};

/**
 * Middleware pour restreindre l'accès à des rôles spécifiques
 * @param {...String} roles - Les rôles autorisés
 */
const autoriser = (...roles) => {
  return (req, res, next) => {
    // Vérifier si l'utilisateur est connecté
    if (!req.utilisateur) {
      return next(
        new UnauthorizedError(
          'Vous devez être connecté pour accéder à cette ressource.'
        )
      );
    }

    // Vérifier si le rôle de l'utilisateur est autorisé
    if (!roles.includes(req.utilisateur.role)) {
      return next(
        new ForbiddenError(
          `Vous n'avez pas les droits pour effectuer cette action. Rôles autorisés: ${roles.join(
            ', '
          )}`
        )
      );
    }

    next();
  };
};

/**
 * Middleware pour vérifier la propriété d'une ressource
 * @param {String} modelName - Le nom du modèle (ex: 'RendezVous')
 * @param {String} paramName - Le nom du paramètre dans la requête (ex: 'id')
 * @param {String} userIdField - Le champ de l'ID utilisateur dans le modèle (ex: 'patientId')
 */
const verifierProprietaire = (modelName, paramName = 'id', userIdField = 'utilisateurId') => {
  return async (req, res, next) => {
    try {
      const Model = require(`../models/${modelName}`);
      const doc = await Model.findOne({
        _id: req.params[paramName],
        [userIdField]: req.utilisateur._id,
      });

      if (!doc) {
        return next(
          new ForbiddenError(
            `Vous n'êtes pas autorisé à accéder à cette ressource.`
          )
        );
      }

      // Ajouter le document à la requête pour les middlewares suivants
      req[modelName.toLowerCase()] = doc;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware pour vérifier si l'utilisateur est propriétaire ou admin
 * @param {String} modelName - Le nom du modèle
 * @param {String} paramName - Le nom du paramètre dans la requête
 * @param {String} userIdField - Le champ de l'ID utilisateur dans le modèle
 */
const verifierProprietaireOuAdmin = (modelName, paramName = 'id', userIdField = 'utilisateurId') => {
  return async (req, res, next) => {
    try {
      // Les administrateurs ont accès à tout
      if (req.utilisateur.role === 'admin') {
        return next();
      }

      // Vérifier si l'utilisateur est propriétaire
      const Model = require(`../models/${modelName}`);
      const doc = await Model.findOne({
        _id: req.params[paramName],
        [userIdField]: req.utilisateur._id,
      });

      if (!doc) {
        return next(
          new ForbiddenError(
            `Vous n'êtes pas autorisé à accéder à cette ressource.`
          )
        );
      }

      // Ajouter le document à la requête pour les middlewares suivants
      req[modelName.toLowerCase()] = doc;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  proteger,
  autoriser,
  verifierProprietaire,
  verifierProprietaireOuAdmin,
};
