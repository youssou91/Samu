const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../src/models/User');

// Charger les variables d'environnement
dotenv.config();

// Configuration de la connexion à la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/presence-management';

// Données de l'administrateur à créer
const adminData = {
  firstName: 'Admin',
  lastName: 'System',
  email: 'admin@example.com',
  password: 'Admin123!', // Mot de passe fort par défaut
  role: 'admin',
  phone: '+1234567890',
  isActive: true
};

async function createAdmin() {
  try {
    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connecté à la base de données MongoDB');

    // Vérifier si un administrateur existe déjà avec cet email
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('Un administrateur avec cet email existe déjà :', existingAdmin.email);
      console.log('ID :', existingAdmin._id);
      process.exit(0);
    }

    // Créer un nouvel administrateur
    const admin = new User(adminData);
    
    // Le mot de passe sera automatiquement haché par le middleware pre-save du modèle User
    await admin.save();
    
    console.log('\n=== Administrateur créé avec succès ===');
    console.log('Email:', admin.email);
    console.log('Mot de passe:', adminData.password); // Afficher le mot de passe en clair une seule fois
    console.log('ID:', admin._id);
    console.log('===============================\n');
    
  } catch (error) {
    console.error('Erreur lors de la création de l\'administrateur :', error);
  } finally {
    // Fermer la connexion à la base de données
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Exécuter le script
createAdmin();
