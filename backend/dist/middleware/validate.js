"use strict";const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * Middleware pour valider les résultats de la validation
 * @param {Object} req - La requête Express
 * @param {Object} res - La réponse Express
 * @param {Function} next - La fonction next
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  // Formater les erreurs pour une meilleure lisibilité
  const formattedErrors = errors.array().map((err) => ({
    field: err.param,
    message: err.msg,
    value: err.value,
    location: err.location
  }));

  next(new ValidationError(formattedErrors));
};

/**
 * Middleware pour valider les paramètres d'URL (comme les IDs)
 * @param {string} paramName - Le nom du paramètre à valider
 * @param {string} entityName - Le nom de l'entité pour le message d'erreur
 */
const validateParamId = (paramName, entityName = 'Ressource') => (req, res, next) => {
  const id = req.params[paramName];

  if (!id) {
    return next(new ValidationError([{
      field: paramName,
      message: `L'ID est requis`
    }]));
  }

  // Vérifier si l'ID est un ObjectId valide
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return next(new ValidationError([{
      field: paramName,
      message: `ID ${entityName} invalide`,
      value: id
    }]));
  }

  next();
};

/**
 * Middleware pour valider le corps de la requête par rapport à un schéma
 * @param {Object} schema - Le schéma Joi à valider
 */
const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true
  });

  if (error) {
    const formattedErrors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type,
      context: detail.context
    }));

    return next(new ValidationError(formattedErrors));
  }

  // Remplacer le corps de la requête par les données validées
  req.body = value;
  next();
};

/**
 * Middleware pour valider les paramètres de requête (query params)
 * @param {Object} schema - Le schéma Joi à valider
 */
const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true
  });

  if (error) {
    const formattedErrors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type,
      context: detail.context
    }));

    return next(new ValidationError(formattedErrors));
  }

  // Remplacer les paramètres de requête par les données validées
  req.query = value;
  next();
};

module.exports = {
  validate,
  validateParamId,
  validateBody,
  validateQuery
};
//# sourceMappingURL=validate.js.map