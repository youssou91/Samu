const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
// Créer une instance d'application Express pour les tests
const express = require('express');
const app = express();

// Middleware pour parser le JSON
app.use(express.json());

// Importer les routes
const rapportsRouter = require('../src/routes/rapports');
app.use('/api/rapports', rapportsRouter);

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Erreur serveur' });
});
const RendezVous = require('../src/models/RendezVous');
const Utilisateur = require('../src/models/User');
const { generateAuthToken } = require('../src/utils/auth');

// Variables globales
let mongoServer;
let adminToken;
let medecin;
let patient;
let rendezVous;

// Données de test
const adminData = {
  nom: 'Admin',
  prenom: 'System',
  email: 'admin@example.com',
  motDePasse: 'Password123!',
  role: 'admin',
  statut: 'actif'
};

const medecinData = {
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean.dupont@example.com',
  motDePasse: 'Medecin123!',
  role: 'medecin',
  specialite: 'Cardiologie',
  statut: 'actif'
};

const patientData = {
  nom: 'Martin',
  prenom: 'Sophie',
  email: 'sophie.martin@example.com',
  motDePasse: 'Patient123!',
  role: 'patient',
  dateNaissance: '1985-05-15',
  genre: 'F',
  statut: 'actif'
};

// Configuration des tests
beforeAll(async () => {
  // Démarrer un serveur MongoDB en mémoire
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Créer un utilisateur admin pour les tests
  const admin = new Utilisateur(adminData);
  await admin.save();
  adminToken = generateAuthToken(admin);

  // Créer un médecin pour les tests
  medecin = new Utilisateur(medecinData);
  await medecin.save();

  // Créer un patient pour les tests
  patient = new Utilisateur(patientData);
  await patient.save();

  // Créer des rendez-vous de test
  const now = new Date();
  const rendezVousData = [
    {
      patient: patient._id,
      medecin: medecin._id,
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
    },
    {
      patient: patient._id,
      medecin: medecin._id,
      dateDebut: new Date(now.getFullYear(), now.getMonth() - 1, 15, 14, 0),
      dateFin: new Date(now.getFullYear(), now.getMonth() - 1, 15, 14, 30),
      type: 'Consultation',
      statut: 'annule',
      motifAnnulation: 'Patient absent',
      statutPaiement: 'annule',
      montant: 0
    },
    {
      patient: patient._id,
      medecin: medecin._id,
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
    }
  ];

  await RendezVous.insertMany(rendezVousData);
  rendezVous = await RendezVous.findOne();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('API Rapports', () => {
  describe('GET /api/rapports/performance-medecins', () => {
    it('devrait retourner les statistiques de performance des médecins', async () => {
      const res = await request(app)
        .get('/api/rapports/performance-medecins')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.donnees).toHaveProperty('resultats');
      expect(Array.isArray(res.body.donnees.resultats)).toBe(true);
      
      if (res.body.donnees.resultats.length > 0) {
        const medecinStats = res.body.donnees.resultats[0];
        expect(medecinStats).toHaveProperty('medecin');
        expect(medecinStats).toHaveProperty('statistiques');
        expect(medecinStats.statistiques).toHaveProperty('totalRdv');
        expect(medecinStats.statistiques).toHaveProperty('tauxFrequentation');
      }
    });

    it('devrait échouer sans authentification', async () => {
      const res = await request(app)
        .get('/api/rapports/performance-medecins');

      expect(res.statusCode).toEqual(401);
    });

    it('devrait échouer sans les droits administrateur', async () => {
      // Créer un token pour un utilisateur non admin
      const user = new Utilisateur({
        nom: 'User',
        prenom: 'Test',
        email: 'user@example.com',
        motDePasse: 'User123!',
        role: 'secretaire',
        statut: 'actif'
      });
      await user.save();
      const userToken = generateAuthToken(user);

      const res = await request(app)
        .get('/api/rapports/performance-medecins')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('GET /api/rapports/satisfaction', () => {
    it('devrait retourner les statistiques de satisfaction', async () => {
      const res = await request(app)
        .get('/api/rapports/satisfaction')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.donnees).toHaveProperty('resultats');
      expect(Array.isArray(res.body.donnees.resultats)).toBe(true);
      
      if (res.body.donnees.resultats.length > 0) {
        const satisfaction = res.body.donnees.resultats[0];
        expect(satisfaction).toHaveProperty('medecin');
        expect(satisfaction).toHaveProperty('statistiques');
        expect(satisfaction.statistiques).toHaveProperty('noteMoyenne');
        expect(satisfaction.statistiques).toHaveProperty('repartitionNotes');
      }
    });

    it('devrait filtrer par médecin si medecinId est fourni', async () => {
      const res = await request(app)
        .get(`/api/rapports/satisfaction?medecinId=${medecin._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.donnees.resultats.length).toBeGreaterThan(0);
      expect(res.body.donnees.resultats[0].medecin.id).toBe(medecin._id.toString());
    });
  });

  describe('POST /api/rapports/personnalise', () => {
    it('devrait générer un rapport personnalisé', async () => {
      const res = await request(app)
        .post('/api/rapports/personnalise')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          typeRapport: 'rendez-vous',
          dateDebut: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
          dateFin: new Date().toISOString().split('T')[0],
          groupBy: 'month',
          colonnes: ['periode', 'nbRendezVous', 'dureeMoyenne']
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.donnees).toHaveProperty('resultats');
      expect(Array.isArray(res.body.donnees.resultats)).toBe(true);
    });

    it('devrait valider les données de la requête', async () => {
      const res = await request(app)
        .post('/api/rapports/personnalise')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          // typeRapport manquant
          dateDebut: 'date-invalide',
          groupBy: 'invalid-group'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty('erreurs');
      expect(res.body.erreurs.some(e => e.champ === 'typeRapport')).toBe(true);
      expect(res.body.erreurs.some(e => e.champ === 'dateDebut')).toBe(true);
      expect(res.body.erreurs.some(e => e.champ === 'groupBy')).toBe(true);
    });
  });

  describe('POST /api/rapports/export', () => {
    it('devrait exporter un rapport au format CSV', async () => {
      const res = await request(app)
        .post('/api/rapports/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          format: 'csv',
          typeRapport: 'rendez-vous',
          dateDebut: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
          dateFin: new Date().toISOString().split('T')[0]
        });

      expect(res.statusCode).toEqual(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment');
    });

    it('devrait exporter un rapport au format Excel', async () => {
      const res = await request(app)
        .post('/api/rapports/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          format: 'excel',
          typeRapport: 'medecins',
          dateDebut: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
          dateFin: new Date().toISOString().split('T')[0]
        });

      expect(res.statusCode).toEqual(200);
      expect(res.headers['content-type']).toContain('spreadsheetml.sheet');
      expect(res.headers['content-disposition']).toContain('attachment');
    });
  });
});
