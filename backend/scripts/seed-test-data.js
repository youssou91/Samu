const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Utilisateur = require('../src/models/User');
const RendezVous = require('../src/models/RendezVous');

// Charger les variables d'environnement
dotenv.config();

// Connexion à la base de données
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connecté à MongoDB');
  } catch (err) {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
  }
};

// Données de test
const seedData = async () => {
  try {
    // Supprimer les données existantes
    await Promise.all([
      Utilisateur.deleteMany({}),
      RendezVous.deleteMany({})
    ]);

    console.log('Anciennes données supprimées');

    // Créer un administrateur
    const admin = new Utilisateur({
      nom: 'Admin',
      prenom: 'System',
      email: 'admin@example.com',
      motDePasse: 'Admin123!',
      role: 'admin',
      statut: 'actif'
    });
    await admin.save();

    // Créer des médecins
    const medecin1 = new Utilisateur({
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@example.com',
      motDePasse: 'Medecin123!',
      role: 'medecin',
      specialite: 'Cardiologie',
      statut: 'actif'
    });
    await medecin1.save();

    const medecin2 = new Utilisateur({
      nom: 'Martin',
      prenom: 'Sophie',
      email: 'sophie.martin@example.com',
      motDePasse: 'Medecin123!',
      role: 'medecin',
      specialite: 'Dermatologie',
      statut: 'actif'
    });
    await medecin2.save();

    // Créer des patients
    const patient1 = new Utilisateur({
      nom: 'Durand',
      prenom: 'Pierre',
      email: 'pierre.durand@example.com',
      motDePasse: 'Patient123!',
      role: 'patient',
      dateNaissance: new Date('1980-05-15'),
      genre: 'M',
      statut: 'actif'
    });
    await patient1.save();

    const patient2 = new Utilisateur({
      nom: 'Leroy',
      prenom: 'Marie',
      email: 'marie.leroy@example.com',
      motDePasse: 'Patient123!',
      role: 'patient',
      dateNaissance: new Date('1990-08-22'),
      genre: 'F',
      statut: 'actif'
    });
    await patient2.save();

    // Créer des rendez-vous
    const now = new Date();
    const rdv1 = new RendezVous({
      patient: patient1._id,
      medecin: medecin1._id,
      dateDebut: new Date(now.getFullYear(), now.getMonth() - 1, 10, 9, 0),
      dateFin: new Date(now.getFullYear(), now.getMonth() - 1, 10, 9, 30),
      type: 'Consultation',
      statut: 'termine',
      statutPaiement: 'paye',
      montant: 50,
      avis: {
        note: 5,
        commentaire: 'Très bon médecin, à l\'écoute',
        dateAvis: new Date(now.getFullYear(), now.getMonth() - 1, 10, 10, 0)
      }
    });
    await rdv1.save();

    const rdv2 = new RendezVous({
      patient: patient2._id,
      medecin: medecin1._id,
      dateDebut: new Date(now.getFullYear(), now.getMonth() - 1, 15, 14, 0),
      dateFin: new Date(now.getFullYear(), now.getMonth() - 1, 15, 14, 30),
      type: 'Consultation',
      statut: 'annule',
      motifAnnulation: 'Patient absent',
      statutPaiement: 'annule',
      montant: 0
    });
    await rdv2.save();

    const rdv3 = new RendezVous({
      patient: patient1._id,
      medecin: medecin2._id,
      dateDebut: new Date(now.getFullYear(), now.getMonth(), 5, 10, 0),
      dateFin: new Date(now.getFullYear(), now.getMonth(), 5, 10, 30),
      type: 'Suivi',
      statut: 'termine',
      retard: { minutes: 10 },
      statutPaiement: 'paye',
      montant: 60,
      avis: {
        note: 4,
        commentaire: 'Bonne consultation',
        dateAvis: new Date(now.getFullYear(), now.getMonth(), 5, 11, 0)
      }
    });
    await rdv3.save();

    console.log('Données de test insérées avec succès');
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors de l\'insertion des données de test:', err);
    process.exit(1);
  }
};

// Exécuter le script
(async () => {
  await connectDB();
  await seedData();
})();
