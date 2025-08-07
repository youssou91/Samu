"use strict";require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Configuration de base
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/presence-management';

// Middleware de base
app.use(cors());
app.use(express.json());

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API de gestion des présences - Serveur simplifié' });
});

// Connexion à MongoDB et démarrage du serveur
const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connecté à MongoDB');

    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error.message);
    process.exit(1);
  }
};

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  console.error('❌ Erreur non gérée (rejection):', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Erreur non capturée (exception):', err);
  process.exit(1);
});

// Démarrer le serveur
startServer();

module.exports = app;
//# sourceMappingURL=simple-server.js.map