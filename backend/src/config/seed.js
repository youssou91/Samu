const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');
const { generateDossierNumber } = require('../utils');

// Modèles
const Utilisateur = require('../models/Utilisateur');
const RendezVous = require('../models/RendezVous');
const { connectDB } = require('./database');

// Données de démonstration
const utilisateursDemo = [
  {
    _id: new mongoose.Types.ObjectId(),
    nom: 'Admin',
    prenom: 'Système',
    email: 'admin@example.com',
    motDePasse: 'Admin123!',
    role: 'admin',
    telephone: '0612345678',
    dateNaissance: new Date('1990-01-01'),
    adresse: {
      rue: '1 rue de la Paix',
      codePostal: '75001',
      ville: 'Paris',
      pays: 'France',
    },
    emailVerifie: true,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean.dupont@example.com',
    motDePasse: 'Medecin123!',
    role: 'medecin',
    specialite: 'Médecine Générale',
    telephone: '0698765432',
    dateNaissance: new Date('1985-05-15'),
    adresse: {
      rue: '15 Avenue des Champs-Élysées',
      codePostal: '75008',
      ville: 'Paris',
      pays: 'France',
    },
    emailVerifie: true,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    nom: 'Martin',
    prenom: 'Sophie',
    email: 'sophie.martin@example.com',
    motDePasse: 'Secretaire123!',
    role: 'secretaire',
    telephone: '0678912345',
    dateNaissance: new Date('1992-08-20'),
    adresse: {
      rue: '25 Rue de Rivoli',
      codePostal: '75004',
      ville: 'Paris',
      pays: 'France',
    },
    emailVerifie: true,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    nom: 'Durand',
    prenom: 'Marie',
    email: 'marie.durand@example.com',
    motDePasse: 'Patient123!',
    role: 'patient',
    telephone: '0687654321',
    dateNaissance: new Date('1995-11-10'),
    adresse: {
      rue: '10 Rue de la République',
      codePostal: '69002',
      ville: 'Lyon',
      pays: 'France',
    },
    numeroSecuriteSociale: '189127512345678',
    emailVerifie: true,
  },
];

/**
 * Initialise la base de données avec des données de démonstration
 */
const seedDatabase = async () => {
  try {
    // Connexion à la base de données
    await connectDB();
    
    logger.info('Début de l\'initialisation de la base de données...');
    
    // Supprimer toutes les données existantes
    await Promise.all([
      Utilisateur.deleteMany({}),
      RendezVous.deleteMany({}),
    ]);
    
    logger.info('Anciennes données supprimées avec succès');
    
    // Hacher les mots de passe
    const utilisateursAvecMdpHache = await Promise.all(
      utilisateursDemo.map(async (utilisateur) => {
        const salt = await bcrypt.genSalt(10);
        const motDePasseHache = await bcrypt.hash(utilisateur.motDePasse, salt);
        return {
          ...utilisateur,
          motDePasse: motDePasseHache,
        };
      })
    );
    
    // Créer les utilisateurs
    const utilisateursCrees = await Utilisateur.insertMany(utilisateursAvecMdpHache);
    logger.info(`${utilisateursCrees.length} utilisateurs créés avec succès`);
    
    // Récupérer l'ID du médecin et du patient
    const medecin = utilisateursCrees.find(u => u.role === 'medecin');
    const patient = utilisateursCrees.find(u => u.role === 'patient');
    
    if (!medecin || !patient) {
      throw new Error('Médecin ou patient non trouvé dans les données de démonstration');
    }
    
    // Créer des rendez-vous de démonstration
    const maintenant = new Date();
    const rendezVousDemo = [
      {
        _id: new mongoose.Types.ObjectId(),
        numeroDossier: generateDossierNumber(),
        patientId: patient._id,
        patientNom: `${patient.prenom} ${patient.nom}`,
        patientTelephone: patient.telephone,
        medecinId: medecin._id,
        medecinNom: `${medecin.prenom} ${medecin.nom}`,
        dateDebut: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // Demain
        dateFin: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 minutes plus tard
        type: 'consultation',
        motif: 'Consultation de routine',
        statut: 'confirme',
        duree: 30,
        notes: 'Première consultation',
        createdAt: maintenant,
        updatedAt: maintenant,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        numeroDossier: generateDossierNumber(),
        patientId: patient._id,
        patientNom: `${patient.prenom} ${patient.nom}`,
        patientTelephone: patient.telephone,
        medecinId: medecin._id,
        medecinNom: `${medecin.prenom} ${medecin.nom}`,
        dateDebut: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Dans une semaine
        dateFin: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 minutes plus tard
        type: 'controle',
        motif: 'Contrôle après traitement',
        statut: 'en_attente',
        duree: 30,
        notes: 'Vérifier l\'efficacité du traitement',
        createdAt: maintenant,
        updatedAt: maintenant,
      },
    ];
    
    const rendezVousCrees = await RendezVous.insertMany(rendezVousDemo);
    logger.info(`${rendezVousCrees.length} rendez-vous créés avec succès`);
    
    logger.info('Base de données initialisée avec succès !');
    
    // Afficher les identifiants de connexion
    console.log('\n=== IDENTIFIANTS DE DÉMONSTRATION ===');
    console.log('Admin:');
    console.log(`Email: admin@example.com`);
    console.log(`Mot de passe: Admin123!\n`);
    
    console.log('Médecin:');
    console.log(`Email: jean.dupont@example.com`);
    console.log(`Mot de passe: Medecin123!\n`);
    
    console.log('Secrétaire:');
    console.log(`Email: sophie.martin@example.com`);
    console.log(`Mot de passe: Secretaire123!\n`);
    
    console.log('Patient:');
    console.log(`Email: marie.durand@example.com`);
    console.log(`Mot de passe: Patient123!\n`);
    
    // Arrêter le processus
    process.exit(0);
  } catch (error) {
    logger.error('Erreur lors de l\'initialisation de la base de données:', error);
    process.exit(1);
  }
};

// Exécuter le script si appelé directement
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
