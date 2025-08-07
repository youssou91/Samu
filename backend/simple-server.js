require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/presence-management';

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Log des headers de la requête
app.use((req, res, next) => {
  console.log('Headers:', req.headers);
  next();
});

// Middleware de logging des requêtes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Route de test
app.get('/api', (req, res) => {
  res.json({
    status: 'success',
    message: 'API de gestion des présences',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      rendezvous: '/api/rendezvous',
      presences: '/api/presences'
    }
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err);
  res.status(500).json({
    status: 'error',
    message: 'Une erreur est survenue sur le serveur.'
  });
});

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route non trouvée: ${req.originalUrl}`
  });
});

// Connexion à MongoDB et démarrage du serveur
const startServer = async () => {
  try {
    console.log('🔍 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connecté à MongoDB');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log(`⚙️  Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 URL MongoDB: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur de démarrage du serveur:', error.message);
    process.exit(1);
  }
};

// Démarrer le serveur
startServer();

module.exports = app;
