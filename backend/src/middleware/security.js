const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const config = require('../config/config');

/**
 * Configuration de la sécurité HTTP avec Helmet
 */
const configureHelmet = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'https://api.mapbox.com'],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: { maxAge: 15552000, includeSubDomains: true },
    ieNoOpen: true,
    noCache: true,
    noSniff: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'no-referrer' },
    xssFilter: true,
  });
};

/**
 * Configuration de la limitation de taux
 */
const configureRateLimit = () => {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: 'Trop de requêtes depuis cette adresse IP. Veuillez réessayer plus tard.',
    standardHeaders: true,
    legacyHeaders: false,
  });
};

/**
 * Configuration CORS
 */
const configureCors = () => {
  const corsOptions = {
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origine (comme les applications mobiles ou Postman)
      if (!origin) return callback(null, true);
      
      // Vérifier si l'origine est autorisée
      const allowedOrigins = [
        config.clientUrl,
        'http://localhost:3000',
        'http://localhost:5000',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5000',
      ];
      
      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  };
  
  return cors(corsOptions);
};

/**
 * Configuration de la protection contre les injections NoSQL
 */
const configureMongoSanitize = () => {
  return mongoSanitize({
    onSanitize: ({ req, key }) => {
      console.warn(`Requête avec clé non autorisée: ${key} sur ${req.originalUrl}`);
    },
    replaceWith: '_',
  });
};

/**
 * Configuration de la protection contre les attaques XSS
 */
const configureXss = () => {
  return xss();
};

/**
 * Configuration de la protection contre la pollution des paramètres HTTP
 */
const configureHpp = () => {
  return hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  });
};

/**
 * Configuration de la sécurité des en-têtes
 */
const configureSecurityHeaders = (req, res, next) => {
  // Protège contre les attaques de type clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Active le filtre XSS dans les navigateurs
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Empêche le navigateur de détecter automatiquement les types MIME
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Contrôle strict de la politique de référencement
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Désactive la mise en cache côté client
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  
  next();
};

/**
 * Middleware pour limiter la taille du corps des requêtes
 * @param {number} limit - Taille maximale en octets (par défaut: 10KB)
 */
const limitBodySize = (limit = '10kb') => {
  return (req, res, next) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength && parseInt(contentLength, 10) > limit) {
      return res.status(413).json({
        success: false,
        message: `La taille du corps de la requête ne doit pas dépasser ${limit}`,
      });
    }
    
    next();
  };
};

module.exports = {
  configureHelmet,
  configureRateLimit,
  configureCors,
  configureMongoSanitize,
  configureXss,
  configureHpp,
  configureSecurityHeaders,
  limitBodySize,
};
