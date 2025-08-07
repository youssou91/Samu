const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Configuration
const PORT = 3001; // Port fixe
const MONGODB_URI = 'mongodb://localhost:27017/presence-management';

// Import des routes
const userRoutes = require('./routes/userRoutes');
const rendezVousRoutes = require('./routes/rendezVousRoutes');

// Initialisation de l'application
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/rendezvous', rendezVousRoutes);

// Route de test
app.get('/api', (req, res) => {
  res.json({
    status: 'success',
    message: 'API de gestion des présences',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      users: {
        create: 'POST /api/users',
        getAll: 'GET /api/users',
        getOne: 'GET /api/users/:id',
        update: 'PATCH /api/users/:id',
        delete: 'DELETE /api/users/:id'
      },
      rendezvous: {
        create: 'POST /api/rendezvous',
        getAll: 'GET /api/rendezvous',
        getOne: 'GET /api/rendezvous/:id',
        update: 'PATCH /api/rendezvous/:id',
        delete: 'DELETE /api/rendezvous/:id',
        byPatient: 'GET /api/rendezvous/patient/:patientId',
        byMedecin: 'GET /api/rendezvous/medecin/:medecinId'
      }
    }
  });
});

// Connexion à MongoDB et démarrage du serveur
async function startServer() {
  try {
    console.log('🔍 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connecté à MongoDB');
    
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log('📅', new Date().toLocaleString());
    });
    
  } catch (error) {
    console.error('❌ Erreur de démarrage du serveur:', error);
    process.exit(1);
  }
}

// Démarrer le serveur
startServer();
