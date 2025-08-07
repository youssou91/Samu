const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Charger les variables d'environnement
dotenv.config();

// Modèles
const User = require('../src/models/User');
const RendezVous = require('../src/models/RendezVous');
const Presence = require('../src/models/Presence');

// Données mockées
const mockData = {
  users: [
    {
      id: 1,
      nom: "Admin",
      prenom: "Principal",
      email: "admin@clinique.com",
      password: "admin123",
      role: "admin",
      statut: "actif",
      specialite: "Administration",
      telephone: "+221 77 123 45 67"
    },
    {
      id: 2,
      nom: "Diop",
      prenom: "Marie",
      email: "m.diop@clinique.com",
      password: "medecin123",
      role: "medecin",
      statut: "actif",
      specialite: "Cardiologie",
      telephone: "+221 77 234 56 78"
    },
    {
      id: 3,
      nom: "Ndiaye",
      prenom: "Jean",
      email: "j.ndiaye@clinique.com",
      password: "medecin456",
      role: "medecin",
      statut: "actif",
      specialite: "Pédiatrie",
      telephone: "+221 77 345 67 89"
    },
    {
      id: 4,
      nom: "Fall",
      prenom: "Awa",
      email: "a.fall@clinique.com",
      password: "infirmier123",
      role: "infirmier",
      statut: "actif",
      specialite: "Soins généraux",
      telephone: "+221 77 456 78 90"
    }
  ],
  presences: [
    {
      utilisateur: 2, // Dr. Marie Diop
      date: new Date("2025-08-01"),
      heureDebut: "08:00",
      heureFin: "17:00",
      statut: "present",
      consultations: 12,
      notes: "Journée chargée, plusieurs cas urgents"
    },
    {
      utilisateur: 3, // Dr. Jean Ndiaye
      date: new Date("2025-08-01"),
      heureDebut: "09:30",
      heureFin: "18:00",
      statut: "en_retard",
      consultations: 8,
      notes: "Réunion le matin, arrivée en retard"
    },
    {
      utilisateur: 4, // Inf. Awa Fall
      date: new Date("2025-08-01"),
      heureDebut: "07:30",
      heureFin: "16:30",
      statut: "present",
      garde: "jour",
      notes: "Tournée des chambres effectuée"
    },
    {
      utilisateur: 2, // Dr. Marie Diop
      date: new Date("2025-08-02"),
      statut: "absent",
      motif: "Congé annuel",
      notes: "Congé approuvé"
    },
    {
      utilisateur: 4, // Inf. Awa Fall
      date: new Date("2025-08-02"),
      heureDebut: "19:00",
      heureFin: "07:00",
      statut: "present",
      garde: "nuit",
      notes: "Nuit calme, 2 admissions"
    }
  ],
  rendezVous: [
    {
      patient: {
        nom: "Diallo",
        prenom: "Fatou",
        telephone: "+221 77 123 45 67",
        dateNaissance: new Date("1990-05-15")
      },
      medecin: 2, // Dr. Marie Diop
      date: new Date("2025-08-03T09:00:00"),
      duree: 30,
      type: "Consultation",
      statut: "planifie",
      notes: "Première consultation"
    },
    {
      patient: {
        nom: "Sow",
        prenom: "Mamadou",
        telephone: "+221 77 234 56 78",
        dateNaissance: new Date("1985-10-22")
      },
      medecin: 3, // Dr. Jean Ndiaye
      date: new Date("2025-08-03T10:30:00"),
      duree: 45,
      type: "Suivi",
      statut: "planifie",
      notes: "Contrôle mensuel"
    }
  ]
};

// Connexion à MongoDB
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

// Hacher les mots de passe
const hashPasswords = async (users) => {
  return Promise.all(
    users.map(async (user) => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      return { ...user, password: hashedPassword };
    })
  );
};

// Insérer les données
const importData = async () => {
  try {
    // Vider les collections
    await User.deleteMany({});
    await Presence.deleteMany({});
    await RendezVous.deleteMany({});
    console.log('Anciennes données supprimées');

    // Hacher les mots de passe
    const usersWithHashedPasswords = await hashPasswords(mockData.users);
    
    // Insérer les utilisateurs
    const createdUsers = await User.insertMany(usersWithHashedPasswords);
    console.log(`${createdUsers.length} utilisateurs insérés`);

    // Créer un mappage des anciens ID vers les nouveaux _id MongoDB
    const userIdMap = {};
    createdUsers.forEach(user => {
      userIdMap[user.id] = user._id;
    });

    // Préparer les présences avec les bons _id utilisateur
    const presencesToInsert = mockData.presences.map(presence => ({
      ...presence,
      utilisateur: userIdMap[presence.utilisateur],
      date: new Date(presence.date)
    }));

    // Insérer les présences
    const createdPresences = await Presence.insertMany(presencesToInsert);
    console.log(`${createdPresences.length} présences insérées`);

    // Préparer les rendez-vous avec les bons _id utilisateur
    const rendezVousToInsert = mockData.rendezVous.map(rdv => ({
      ...rdv,
      medecin: userIdMap[rdv.medecin],
      date: new Date(rdv.date),
      patient: {
        ...rdv.patient,
        dateNaissance: new Date(rdv.patient.dateNaissance)
      }
    }));

    // Insérer les rendez-vous
    const createdRendezVous = await RendezVous.insertMany(rendezVousToInsert);
    console.log(`${createdRendezVous.length} rendez-vous insérés`);

    console.log('Données mockées importées avec succès');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'importation des données:', error);
    process.exit(1);
  }
};

// Exécuter le script
(async () => {
  await connectDB();
  await importData();
  mongoose.connection.close();
})();
