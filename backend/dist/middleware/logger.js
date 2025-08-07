"use strict";const morgan = require('morgan');
const logger = require('../config/logger');

// Format personnalisé pour les logs de requêtes
const requestFormat = (tokens, req, res) => {
  const requestId = req.id || 'unknown';
  const user = req.user ? req.user.id : 'anonymous';

  return [
  `[${new Date().toISOString()}]`,
  `id:${requestId}`,
  `user:${user}`,
  `${tokens.method(req, res)}`,
  `${tokens.url(req, res)}`,
  `${tokens.status(req, res)}`,
  `${tokens.res(req, res, 'content-length') || '-'}b`,
  `${tokens['response-time'](req, res)}ms`,
  `"${tokens['user-agent'](req, res) || ''}"`,
  `"${tokens.referrer(req, res) || ''}"`].
  join(' ');
};

// Middleware pour ajouter un ID unique à chaque requête
const requestId = (req, res, next) => {
  req.id = require('crypto').randomBytes(8).toString('hex');
  next();
};

// Configuration de Morgan pour la journalisation des requêtes
const requestLogger = () => {
  // Filtre les requêtes de santé et de métriques
  const skip = (req) => {
    const paths = ['/health', '/metrics', '/favicon.ico'];
    return paths.some((path) => req.originalUrl.startsWith(path));
  };

  return morgan(requestFormat, {
    stream: {
      write: (message) => logger.info(message.trim())
    },
    skip
  });
};

// Middleware pour journaliser les erreurs
const errorLogger = (err, req, res, next) => {
  const requestId = req.id || 'unknown';
  const user = req.user ? req.user.id : 'anonymous';

  logger.error({
    timestamp: new Date().toISOString(),
    requestId,
    userId: user,
    method: req.method,
    url: req.originalUrl,
    statusCode: err.statusCode || 500,
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    },
    body: req.body,
    query: req.query,
    params: req.params,
    headers: {
      'user-agent': req.get('user-agent'),
      referer: req.get('referer')
    }
  });

  next(err);
};

// Middleware pour journaliser les requêtes lentes
const slowRequestLogger = (threshold = 1000) => {
  return (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;

      if (duration > threshold) {
        const requestId = req.id || 'unknown';
        const user = req.user ? req.user.id : 'anonymous';

        logger.warn({
          message: 'Requête lente détectée',
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          requestId,
          userId: user,
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode
        });
      }
    });

    next();
  };
};

module.exports = {
  requestId,
  requestLogger,
  errorLogger,
  slowRequestLogger
};
//# sourceMappingURL=logger.js.map