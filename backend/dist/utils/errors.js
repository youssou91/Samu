"use strict"; /**
 * Classe de base pour les erreurs personnalisées
 * @extends Error
 */
class BaseError extends Error {
  /**
   * Crée une nouvelle instance de BaseError
   * @param {string} name - Le nom de l'erreur
   * @param {string} message - Le message d'erreur
   * @param {number} statusCode - Le code de statut HTTP
   * @param {boolean} isOperational - Si l'erreur est opérationnelle
   * @param {Object} details - Détails supplémentaires sur l'erreur
   */
  constructor(name, message, statusCode, isOperational = true, details = {}) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    // Capture la pile d'appels pour le débogage
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convertit l'erreur en objet JSON pour la réponse API
   * @returns {Object} L'erreur sous forme d'objet
   */
  toJSON() {
    return {
      success: false,
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
      ...(Object.keys(this.details).length > 0 && { details: this.details })
    };
  }
}

/**
 * Erreur 400 - Requête incorrecte
 * @extends BaseError
 */
class BadRequestError extends BaseError {
  /**
   * Crée une nouvelle instance de BadRequestError
   * @param {string} message - Le message d'erreur
   * @param {Object} details - Détails supplémentaires sur l'erreur
   */
  constructor(message = 'Requête incorrecte', details = {}) {
    super('BadRequestError', message, 400, true, details);
  }
}

/**
 * Erreur 401 - Non autorisé
 * @extends BaseError
 */
class UnauthorizedError extends BaseError {
  /**
   * Crée une nouvelle instance de UnauthorizedError
   * @param {string} message - Le message d'erreur
   * @param {Object} details - Détails supplémentaires sur l'erreur
   */
  constructor(message = 'Non autorisé', details = {}) {
    super('UnauthorizedError', message, 401, true, details);
  }
}

/**
 * Erreur 403 - Accès refusé
 * @extends BaseError
 */
class ForbiddenError extends BaseError {
  /**
   * Crée une nouvelle instance de ForbiddenError
   * @param {string} message - Le message d'erreur
   * @param {Object} details - Détails supplémentaires sur l'erreur
   */
  constructor(message = 'Accès refusé', details = {}) {
    super('ForbiddenError', message, 403, true, details);
  }
}

/**
 * Erreur 404 - Ressource non trouvée
 * @extends BaseError
 */
class NotFoundError extends BaseError {
  /**
   * Crée une nouvelle instance de NotFoundError
   * @param {string} resource - Le nom de la ressource non trouvée
   * @param {Object} details - Détails supplémentaires sur l'erreur
   */
  constructor(resource = 'Ressource', details = {}) {
    super('NotFoundError', `${resource} non trouvé(e)`, 404, true, details);
  }
}

/**
 * Erreur 409 - Conflit
 * @extends BaseError
 */
class ConflictError extends BaseError {
  /**
   * Crée une nouvelle instance de ConflictError
   * @param {string} message - Le message d'erreur
   * @param {Object} details - Détails supplémentaires sur l'erreur
   */
  constructor(message = 'Conflit détecté', details = {}) {
    super('ConflictError', message, 409, true, details);
  }
}

/**
 * Erreur 422 - Entité non traitable
 * @extends BaseError
 */
class ValidationError extends BaseError {
  /**
   * Crée une nouvelle instance de ValidationError
   * @param {Array} errors - Les erreurs de validation
   * @param {Object} details - Détails supplémentaires sur l'erreur
   */
  constructor(errors = [], details = {}) {
    super('ValidationError', 'Erreur de validation', 422, true, {
      ...details,
      errors
    });
  }
}

/**
 * Erreur 429 - Trop de requêtes
 * @extends BaseError
 */
class TooManyRequestsError extends BaseError {
  /**
   * Crée une nouvelle instance de TooManyRequestsError
   * @param {string} message - Le message d'erreur
   * @param {Object} details - Détails supplémentaires sur l'erreur
   */
  constructor(message = 'Trop de requêtes', details = {}) {
    super('TooManyRequestsError', message, 429, true, details);
  }
}

/**
 * Erreur 500 - Erreur serveur
 * @extends BaseError
 */
class InternalServerError extends BaseError {
  /**
   * Crée une nouvelle instance de InternalServerError
   * @param {string} message - Le message d'erreur
   * @param {Object} details - Détails supplémentaires sur l'erreur
   */
  constructor(message = 'Erreur interne du serveur', details = {}) {
    super('InternalServerError', message, 500, false, details);
  }
}

/**
 * Middleware pour gérer les erreurs
 * @param {Error} err - L'erreur
 * @param {Object} req - La requête Express
 * @param {Object} res - La réponse Express
 * @param {Function} next - La fonction next
 */
const errorHandler = (err, req, res, next) => {
  // Définit les valeurs par défaut pour les erreurs non gérées
  if (!err.statusCode) {
    err.statusCode = 500;
    err.message = err.message || 'Erreur interne du serveur';
  }

  // Log l'erreur en production pour les erreurs non opérationnelles
  if (process.env.NODE_ENV === 'production' && !err.isOperational) {
    console.error('Erreur non gérée:', err);
  }

  // Envoie la réponse d'erreur
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    ...(err.details && { details: err.details })
  });
};

module.exports = {
  BaseError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
  InternalServerError,
  errorHandler
};
//# sourceMappingURL=errors.js.map