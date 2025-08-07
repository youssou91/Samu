"use strict";const NodeCache = require('node-cache');
const logger = require('../config/logger');

// Configuration du cache par défaut (TTL: 10 minutes, vérification des éléments expirés toutes les 5 minutes)
const defaultCache = new NodeCache({
  stdTTL: 600, // Temps de vie par défaut en secondes (10 minutes)
  checkperiod: 300, // Vérification des éléments expirés toutes les 5 minutes
  useClones: false, // Pour les performances
  deleteOnExpire: true // Supprimer automatiquement les éléments expirés
});

// Middleware pour mettre en cache les réponses
const cacheMiddleware = (duration, keyGenerator) => {
  return (req, res, next) => {
    // Ignorer les requêtes autres que GET pour le cache
    if (req.method !== 'GET') {
      return next();
    }

    // Générer une clé de cache unique pour cette requête
    const cacheKey = keyGenerator ?
    keyGenerator(req) :
    `cache_${req.originalUrl || req.url}`;

    // Vérifier si la réponse est en cache
    const cachedResponse = defaultCache.get(cacheKey);

    if (cachedResponse) {
      logger.debug(`Cache hit for key: ${cacheKey}`);

      // Vérifier si la réponse est une erreur
      if (cachedResponse.isError) {
        return res.status(cachedResponse.status).json({
          success: false,
          message: cachedResponse.message,
          ...(cachedResponse.details && { details: cachedResponse.details })
        });
      }

      // Renvoyer la réponse mise en cache
      return res.json(cachedResponse);
    }

    // Sauvegarder la méthode originale de réponse
    const originalSend = res.json;

    // Remplacer la méthode json pour intercepter la réponse
    res.json = (body) => {
      // Mettre en cache la réponse si le statut est 200
      if (res.statusCode === 200) {
        logger.debug(`Caching response for key: ${cacheKey} (${duration}s)`);
        defaultCache.set(cacheKey, body, duration || 600); // Utiliser la durée fournie ou 10 minutes par défaut
      }

      // Restaurer la méthode originale et envoyer la réponse
      res.json = originalSend;
      return res.json(body);
    };

    // Passer au middleware suivant
    next();
  };
};

// Middleware pour mettre en cache les erreurs
const cacheError = (error, req, res, next) => {
  const cacheKey = `error_${req.originalUrl || req.url}`;

  // Mettre en cache les erreurs 4xx pendant 1 minute
  if (error.statusCode >= 400 && error.statusCode < 500) {
    logger.debug(`Caching error response for key: ${cacheKey} (60s)`);

    defaultCache.set(cacheKey, {
      isError: true,
      status: error.statusCode,
      message: error.message,
      details: error.details
    }, 60); // 1 minute de cache pour les erreurs
  }

  next(error);
};

// Fonction pour effacer manuellement le cache
const clearCache = (key) => {
  if (key) {
    defaultCache.del(key);
    logger.info(`Cache cleared for key: ${key}`);
  } else {
    defaultCache.flushAll();
    logger.info('All cache cleared');
  }
};

// Middleware pour effacer le cache pour une route spécifique
const clearCacheByRoute = (req, res, next) => {
  const cacheKey = `cache_${req.originalUrl || req.url}`;
  clearCache(cacheKey);
  next();
};

// Middleware pour effacer le cache par préfixe
const clearCacheByPrefix = (prefix) => {
  return (req, res, next) => {
    const keys = defaultCache.keys();
    const keysToDelete = keys.filter((key) => key.startsWith(prefix));

    if (keysToDelete.length > 0) {
      defaultCache.del(keysToDelete);
      logger.info(`Cache cleared for prefix: ${prefix} (${keysToDelete.length} keys)`);
    }

    next();
  };
};

// Fonction utilitaire pour générer une clé de cache basée sur les paramètres de requête
const generateCacheKey = (req) => {
  const { originalUrl, query, params, user } = req;
  const userId = user ? user.id : 'anonymous';
  const queryString = JSON.stringify(query);
  const paramsString = JSON.stringify(params);

  return `cache_${userId}_${originalUrl}_${queryString}_${paramsString}`;
};

module.exports = {
  cache: defaultCache,
  cacheMiddleware,
  cacheError,
  clearCache,
  clearCacheByRoute,
  clearCacheByPrefix,
  generateCacheKey
};
//# sourceMappingURL=cache.js.map