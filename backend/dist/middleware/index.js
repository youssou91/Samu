"use strict"; // Middleware d'authentification et d'autorisation
const {
  proteger,
  autoriser,
  verifierProprietaire,
  verifierProprietaireOuAdmin
} = require('./auth');

// Middleware de validation
const {
  validate,
  validateParamId,
  validateBody,
  validateQuery
} = require('./validate');

// Middleware de gestion des erreurs
const {
  errorHandler,
  notFoundHandler,
  joiErrorHandler,
  duplicateKeyErrorHandler,
  validationErrorHandler,
  jwtErrorHandler,
  rateLimitErrorHandler
} = require('./errorHandler');

// Middleware de sécurité
const {
  configureHelmet,
  configureRateLimit,
  configureCors,
  configureMongoSanitize,
  configureXss,
  configureHpp,
  configureSecurityHeaders,
  limitBodySize
} = require('./security');

// Middleware de journalisation
const {
  requestId,
  requestLogger,
  errorLogger,
  slowRequestLogger
} = require('./logger');

// Middleware de cache
const {
  cache,
  cacheMiddleware,
  cacheError,
  clearCache,
  clearCacheByRoute,
  clearCacheByPrefix,
  generateCacheKey
} = require('./cache');

// Middleware de gestion des fichiers
const {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  deleteFile,
  deleteFiles,
  requireFile,
  requireFiles,
  uploadDir
} = require('./upload');

// Exporter tous les middlewares
module.exports = {
  // Authentification et autorisation
  proteger,
  autoriser,
  verifierProprietaire,
  verifierProprietaireOuAdmin,

  // Validation
  validate,
  validateParamId,
  validateBody,
  validateQuery,

  // Gestion des erreurs
  errorHandler,
  notFoundHandler,
  joiErrorHandler,
  duplicateKeyErrorHandler,
  validationErrorHandler,
  jwtErrorHandler,
  rateLimitErrorHandler,

  // Sécurité
  configureHelmet,
  configureRateLimit,
  configureCors,
  configureMongoSanitize,
  configureXss,
  configureHpp,
  configureSecurityHeaders,
  limitBodySize,

  // Journalisation
  requestId,
  requestLogger,
  errorLogger,
  slowRequestLogger,

  // Cache
  cache,
  cacheMiddleware,
  cacheError,
  clearCache,
  clearCacheByRoute,
  clearCacheByPrefix,
  generateCacheKey,

  // Gestion des fichiers
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  deleteFile,
  deleteFiles,
  requireFile,
  requireFiles,
  uploadDir
};
//# sourceMappingURL=index.js.map