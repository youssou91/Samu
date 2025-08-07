"use strict";const mongoose = require('mongoose');
const logger = require('./logger');

// Options de connexion MongoDB
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout après 5s au lieu de 30s
  socketTimeoutMS: 45000, // Fermeture des sockets inactifs après 45s
  family: 4, // Utilisation d'IPv4, évite les problèmes avec IPv6
  maxPoolSize: 10, // Nombre maximum de connexions dans le pool
  serverSelectionTimeoutMS: 5000, // Timeout pour la sélection du serveur
  socketTimeoutMS: 45000 // Timeout pour les opérations sur le socket
};

// URI de connexion MongoDB
const MONGODB_URI =
process.env.NODE_ENV === 'test' ?
process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/presence-management-test' :
process.env.MONGODB_URI || 'mongodb://localhost:27017/presence-management';

/**
 * Établit une connexion à la base de données MongoDB
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    // Vérifier si une connexion existe déjà
    if (mongoose.connection.readyState === 1) {
      logger.info('Utilisation de la connexion MongoDB existante');
      return;
    }

    logger.info(`Tentative de connexion à MongoDB: ${MONGODB_URI.replace(/:[^:]*@/, ':***@')}`);

    // Événements de connexion
    mongoose.connection.on('connected', () => {
      logger.info(`Connecté à MongoDB avec succès sur la base de données: ${mongoose.connection.db.databaseName}`);
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`Erreur de connexion MongoDB: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Déconnecté de MongoDB');
    });

    // Gestion de la fermeture de l'application
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('Connexion MongoDB fermée suite à l\'arrêt de l\'application');
        process.exit(0);
      } catch (err) {
        logger.error('Erreur lors de la fermeture de la connexion MongoDB:', err);
        process.exit(1);
      }
    });

    // Établir la connexion
    await mongoose.connect(MONGODB_URI, options);

  } catch (error) {
    logger.error(`Échec de la connexion à MongoDB: ${error.message}`);
    // Sortir avec un code d'erreur en cas d'échec critique
    process.exit(1);
  }
};

/**
 * Ferme la connexion à la base de données MongoDB
 * @returns {Promise<void>}
 */
const closeDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info('Connexion MongoDB fermée avec succès');
    }
  } catch (error) {
    logger.error('Erreur lors de la fermeture de la connexion MongoDB:', error);
    throw error;
  }
};

/**
 * Vide la base de données (uniquement en environnement de test)
 * @returns {Promise<void>}
 */
const clearDB = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('clearDB ne peut être appelée qu\'en environnement de test');
  }

  try {
    await mongoose.connection.dropDatabase();
    logger.info('Base de données vidée avec succès');
  } catch (error) {
    logger.error('Erreur lors du vidage de la base de données:', error);
    throw error;
  }
};

module.exports = {
  connectDB,
  closeDB,
  clearDB,
  connection: mongoose.connection
};
//# sourceMappingURL=database.js.map