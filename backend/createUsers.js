const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Modèle User
const User = require('./models/User');

// Configuration de la connexion MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/presence-management';

// Liste des utilisateurs à créer
const users = [
  // Administrateur
  {
    prenom: 'Admin',
    nom: 'Principal',
    email: 'admin@clinique.com',
    telephone: '771234567',
    role: 'admin', 
    actif: true,
    password: 'Admin123!',
    specialite: 'Administration',
    status: 'actif'
  },
  // Médecin
  {
    prenom: 'Jean',
    nom: 'Dupont',
    email: 'jean.dupont@clinique.com',
    telephone: '771234568',
    role: 'medecin',
    actif: true,
    password: 'Medecin123!',
    specialite: 'Cardiologie',
    status: 'en_service'
  },
  // Infirmier
  {
    prenom: 'Marie',
    nom: 'Martin',
    email: 'marie.martin@clinique.com',
    telephone: '771234569',
    role: 'infirmier',
    actif: true,
    password: 'Infirmier123!',
    specialite: 'Urgence',
    status: 'en_service'
  },
  // Secrétaire
  {
    prenom: 'Sophie',
    nom: 'Leroy',
    email: 'sophie.leroy@clinique.com',
    telephone: '771234570',
    role: 'secretaire',
    actif: true,
    password: 'Secretaire123!',
    specialite: 'Accueil',
    status: 'en_service'
  },
  // Patient
  {
    prenom: 'Pierre',
    nom: 'Durand',
    email: 'pierre.durand@example.com',
    telephone: '771234571',
    role: 'patient',
    actif: true,
    password: 'Patient123!',
    specialite: '',
    status: 'actif'
  }
];

async function createUsers() {
  console.log('Démarrage de la création des utilisateurs...');
  
  try {
    // Connexion à MongoDB avec gestion des erreurs
    console.log('Tentative de connexion à MongoDB...');
    await mongoose.connect(MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    }).then(() => {
      console.log('✅ Connecté à MongoDB avec succès');
    }).catch(err => {
      console.error('❌ Erreur de connexion à MongoDB:', err.message);
      process.exit(1);
    });

    // Vérifier la connexion
    const db = mongoose.connection;
    db.on('error', (err) => {
      console.error('❌ Erreur de connexion MongoDB:', err);
    });

    // Parcourir la liste des utilisateurs
    console.log('\nDébut de la création des utilisateurs...');
    let createdCount = 0;
    
    for (const userData of users) {
      try {
        console.log(`\nTraitement de l'utilisateur: ${userData.email}`);
        
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          console.log(`ℹ️  L'utilisateur ${userData.email} existe déjà`);
          continue;
        }

        // Hasher le mot de passe
        console.log('Hachage du mot de passe...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        
        // Créer l'utilisateur
        console.log('Création de l\'utilisateur...');
        const user = new User({
          ...userData,
          password: hashedPassword
        });
        
        await user.save();
        console.log(`✅ Utilisateur créé avec succès: ${user.email}`);
        createdCount++;
        
      } catch (userError) {
        console.error(`❌ Erreur lors de la création de l'utilisateur ${userData.email}:`, userError.message);
        // Continuer avec le prochain utilisateur même en cas d'erreur
      }
    }
    
    // Récapitulatif
    console.log('\n=== RÉCAPITULATIF ===');
    console.log(`Utilisateurs à créer: ${users.length}`);
    console.log(`Utilisateurs créés avec succès: ${createdCount}`);
    console.log(`Utilisateurs existants: ${users.length - createdCount}`);
    
    if (createdCount > 0) {
      console.log('\n=== IDENTIFIANTS CRÉÉS (à conserver en lieu sûr) ===');
      users.forEach(user => {
        console.log('----------------------------------');
        console.log(`Rôle: ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`);
        console.log(`Email: ${user.email}`);
        console.log(`Mot de passe: ${user.password}`);
      });
      console.log('----------------------------------');
      console.log('\n⚠️  IMPORTANT: Changez ces mots de passe après la première connexion !');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ ERREUR CRITIQUE:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    // Fermer la connexion à la fin
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n✅ Connexion à MongoDB fermée');
    }
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ ERREUR NON GÉRÉE:');
  console.error('Raison:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ EXCEPTION NON CAPTURÉE:', error);
  process.exit(1);
});

// Lancer le script
createUsers();
