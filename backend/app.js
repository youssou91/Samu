require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

// Import des routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const presenceRoutes = require('./routes/presenceRoutes');
const rendezVousRoutes = require('./routes/rendezVousRoutes');
const planningRoutes = require('./routes/planningRoutes');

// Initialisation de l'application
const app = express();

// Configuration de base
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/presence-management';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware de sécurité
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logger HTTP
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));

// Configuration CORS optimisée
const corsOptions = {
  origin: (origin, callback) => {
    // En développement, autoriser toutes les origines
    if (NODE_ENV === 'development') {
      console.log('Autorisation CORS pour l\'origine:', origin);
      return callback(null, true);
    }
    
    // En production, n'autoriser que les origines spécifiées
    const allowedOrigins = [
      'http://localhost:3000',
      'https://votre-domaine.com'   // Remplacer par votre domaine de production
    ];
    
    if (allowedOrigins.includes(origin) || !origin) {
      return callback(null, true);
    }

    callback(new Error(`Origine "${origin}" non autorisée par CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Cache-Control',
    'Pragma',
    'Expires'
  ],
  exposedHeaders: [
    'Content-Range',
    'X-Content-Range',
    'Content-Disposition',
    'X-Pagination-Count',
    'X-Pagination-Page',
    'X-Pagination-Limit'
  ],
  optionsSuccessStatus: 204,
  preflightContinue: false,
  maxAge: 600 // Mettre en cache les résultats des requêtes preflight pendant 10 minutes
};

// Application du middleware CORS
app.use(cors(corsOptions));
// Gestion des requêtes OPTIONS (preflight)
app.options('*', cors(corsOptions));

// Limiteur de requêtes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limite chaque IP à 1000 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/presences', presenceRoutes);
app.use('/api/rendezvous', rendezVousRoutes);
app.use('/api/planning', planningRoutes);

// Route santé
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.method} ${req.originalUrl}`
  });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Erreurs CORS
  if (err.message.includes('non autorisée par CORS')) {
    return res.status(403).json({
      success: false,
      message: err.message
    });
  }

  // Autres erreurs
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Connexion MongoDB avec gestion des erreurs
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log('MongoDB connecté avec succès');
    
    app.listen(PORT, () => {
      console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
      console.log(`Environnement: ${NODE_ENV}`);
    });
  } catch (err) {
    console.error('Échec de la connexion MongoDB:', err.message);
    process.exit(1);
  }
};

// Démarrer l'application
connectDB();

// Gestion des erreurs non catchées
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});