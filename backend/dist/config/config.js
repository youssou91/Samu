"use strict";require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

const baseConfig = {
  // Application
  env,
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'Gestion de Présence Médicale',
  appVersion: process.env.APP_VERSION || '1.0.0',
  appDescription: 'API pour la gestion des rendez-vous médicaux',

  // URL de l'application
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'votre_secret_jwt_tres_securise',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d', // 1 jour
  jwtCookieExpiresIn: process.env.JWT_COOKIE_EXPIRES_IN || 30, // 30 jours

  // Cookies
  cookieSecret: process.env.COOKIE_SECRET || 'votre_secret_cookie',

  // Base de données
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/presence-management',
    testUri: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/presence-management-test',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  },

  // Email
  email: {
    from: process.env.EMAIL_FROM || 'no-reply@presence-medicale.com',
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USERNAME || 'user',
      pass: process.env.SMTP_PASSWORD || 'password'
    }
  },

  // Limitation de taux
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100 // Limite chaque IP à 100 requêtes par fenêtre
  },

  // Sécurité
  security: {
    passwordSaltRounds: parseInt(process.env.PASSWORD_SALT_ROUNDS, 10) || 10,
    resetPasswordExpiresIn: 3600000, // 1 heure en millisecondes
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000 // 15 minutes en millisecondes
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    directory: process.env.LOG_DIR || 'logs',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d'
  },

  // CORS
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
};

const environmentConfigs = {
  development: {
    // Configuration spécifique au développement
    logging: {
      level: 'debug'
    },
    database: {
      debug: true
    }
  },
  test: {
    // Configuration spécifique aux tests
    port: 0, // Utilise un port aléatoire
    database: {
      uri: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/presence-management-test'
    }
  },
  production: {
    // Configuration spécifique à la production
    logging: {
      level: 'info'
    },
    database: {
      uri: process.env.MONGODB_URI,
      options: {
        ...baseConfig.database.options,
        ssl: true,
        sslValidate: true,
        sslCA: process.env.MONGODB_CA_CERT,
        authSource: 'admin',
        user: process.env.MONGODB_USER,
        pass: process.env.MONGODB_PASSWORD
      }
    }
  }
};

// Fusionner la configuration de base avec la configuration spécifique à l'environnement
const config = {
  ...baseConfig,
  ...(environmentConfigs[env] || {})
};

// Vérifier les variables d'environnement requises en production
if (env === 'production') {
  const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'EMAIL_FROM',
  'SMTP_HOST',
  'SMTP_USERNAME',
  'SMTP_PASSWORD'];


  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error(
      `Erreur: Les variables d'environnement suivantes sont requises en production: ${missingVars.join(
        ', '
      )}`
    );
    process.exit(1);
  }
}

module.exports = config;
//# sourceMappingURL=config.js.map