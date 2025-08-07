"use strict";require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const http = require('http');

// Import des routes
const routesAuth = require('./routes/authRoutes');
const routesRendezVous = require('./routes/rendezVousRoutes');
const routesRapports = require('./routes/rapports');

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/presence-management';

// Middleware de sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ?
  process.env.CLIENT_URL :
  'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp({
  whitelist: ['dateDebut', 'dateFin', 'statut', 'sort', 'page', 'limit', 'fields']
}));

// Limite le taux de requêtes
const limiter = rateLimit({
  max: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer dans 15 minutes.'
});
app.use('/api', limiter);

// Routes API
app.use('/api/auth', routesAuth);
app.use('/api/rendez-vous', routesRendezVous);
app.use('/api/rapports', routesRapports);

// Route de test
app.get('/api', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API de gestion des présences en cours d\'exécution',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      rendezVous: '/api/rendez-vous',
      rapports: '/api/rapports'
    }
  });
});

// Gestion des routes non trouvées
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Impossible de trouver ${req.originalUrl} sur ce serveur.`
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  // Erreur de validation
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((el) => ({
      field: el.path,
      message: el.message
    }));

    return res.status(400).json({
      status: 'error',
      message: 'Erreur de validation',
      errors
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token invalide. Veuillez vous reconnecter.'
    });
  }

  // Erreur JWT expiré
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Votre session a expiré. Veuillez vous reconnecter.'
    });
  }

  // Erreur de duplication de clé (MongoDB)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      status: 'error',
      message: `La valeur du champ '${field}' est déjà utilisée.`
    });
  }

  // Erreur de syntaxe JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      status: 'error',
      message: 'Erreur de syntaxe dans le corps de la requête.'
    });
  }

  // Erreur serveur par défaut
  console.error('❌ Erreur:', err);
  res.status(500).json({
    status: 'error',
    message: 'Une erreur est survenue sur le serveur.'
  });
});

// Connexion à la base de données et démarrage du serveur
const startServer = async () => {
  try {
    console.log('🔍 Tentative de connexion à MongoDB...');
    console.log('🔗 URL de connexion:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    console.log('✅ Connecté à MongoDB');

    // Middleware de logging des requêtes
    app.use((req, res, next) => {
      console.log(`🌐 ${req.method} ${req.originalUrl}`);
      next();
    });

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log(`⚙️  Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log('📅', new Date().toLocaleString());
    });

    // Gestion de l'arrêt gracieux
    const gracefulShutdown = async () => {
      console.log('\n🛑 Arrêt gracieux du serveur...');

      // Fermer le serveur
      await new Promise((resolve) => server.close(resolve));
      console.log('✅ Serveur arrêté');

      // Fermer la connexion à MongoDB
      await mongoose.connection.close();
      console.log('✅ Connexion à MongoDB fermée');

      process.exit(0);
    };

    // Gestion des signaux d'arrêt
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('❌ Erreur de démarrage du serveur:', error.message);
    process.exit(1);
  }
};

// Démarrer le serveur
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, startServer };
//# sourceMappingURL=server.js.map