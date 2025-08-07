const logger = require('../config/logger');
const {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
  InternalServerError,
} = require('../utils/errors');

/**
 * Gestionnaire d'erreurs global pour Express
 * @param {Error} err - L'erreur
 * @param {Object} req - La requête Express
 * @param {Object} res - La réponse Express
 * @param {Function} next - La fonction next
 */
const errorHandler = (err, req, res, next) => {
  // Définir les valeurs par défaut pour les erreurs non gérées
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Journalisation des erreurs en développement
  if (process.env.NODE_ENV === 'development') {
    logger.error('Erreur:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
  } else if (process.env.NODE_ENV === 'production') {
    // En production, ne pas envoyer les détails des erreurs inattendues
    if (!err.isOperational) {
      logger.error('Erreur non gérée:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      
      // Remplacer l'erreur par un message générique
      err = new InternalServerError('Une erreur est survenue');
    }
  }

  // Répondre au client
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && {
      error: err,
      stack: err.stack,
    }),
    ...(err.errors && { errors: err.errors }),
    ...(err.details && { details: err.details }),
  });
};

/**
 * Gestionnaire pour les routes non trouvées (404)
 * @param {Object} req - La requête Express
 * @param {Object} res - La réponse Express
 * @param {Function} next - La fonction next
 */
const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Impossible de trouver ${req.originalUrl} sur ce serveur`));
};

/**
 * Gestionnaire pour les erreurs de validation Joi
 * @param {Error} err - L'erreur de validation
 * @param {Object} req - La requête Express
 * @param {Object} res - La réponse Express
 * @param {Function} next - La fonction next
 */
const joiErrorHandler = (err, req, res, next) => {
  if (err && err.error && err.error.isJoi) {
    const errors = err.error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type,
      context: detail.context,
    }));
    
    return next(new ValidationError(errors));
  }
  
  next(err);
};

/**
 * Gestionnaire pour les erreurs de duplication de clé MongoDB
 * @param {Error} err - L'erreur
 * @param {Object} req - La requête Express
 * @param {Object} res - La réponse Express
 * @param {Function} next - La fonction next
 */
const duplicateKeyErrorHandler = (err, req, res, next) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `La valeur '${value}' pour le champ '${field}' est déjà utilisée.`;
    
    return next(new ConflictError(message, { field, value }));
  }
  
  next(err);
};

/**
 * Gestionnaire pour les erreurs de validation MongoDB
 * @param {Error} err - L'erreur
 * @param {Object} req - La requête Express
 * @param {Object} res - La réponse Express
 * @param {Function} next - La fonction next
 */
const validationErrorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => ({
      field: el.path,
      message: el.message,
      value: el.value,
    }));
    
    return next(new ValidationError(errors));
  }
  
  next(err);
};

/**
 * Gestionnaire pour les erreurs de token JWT invalide
 * @param {Error} err - L'erreur
 * @param {Object} req - La requête Express
 * @param {Object} res - La réponse Express
 * @param {Function} next - La fonction next
 */
const jwtErrorHandler = (err, req, res, next) => {
  if (err.name === 'JsonWebTokenError') {
    return next(new UnauthorizedError('Token invalide. Veuillez vous reconnecter.'));
  }
  
  if (err.name === 'TokenExpiredError') {
    return next(new UnauthorizedError('Votre session a expiré. Veuillez vous reconnecter.'));
  }
  
  next(err);
};

/**
 * Gestionnaire pour les erreurs de limite de taux
 * @param {Error} err - L'erreur
 * @param {Object} req - La requête Express
 * @param {Object} res - La réponse Express
 * @param {Function} next - La fonction next
 */
const rateLimitErrorHandler = (err, req, res, next) => {
  if (err.name === 'RateLimitError') {
    return next(new TooManyRequestsError('Trop de requêtes. Veuillez réessayer plus tard.'));
  }
  
  next(err);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  joiErrorHandler,
  duplicateKeyErrorHandler,
  validationErrorHandler,
  jwtErrorHandler,
  rateLimitErrorHandler,
};
