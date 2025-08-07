// Configuration globale pour les tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';

// Configuration des variables d'environnement pour les tests
process.env.PORT = 0; // Utilise un port aléatoire pour les tests
process.env.API_PREFIX = '/api';

// Configurer console pour éviter le bruit dans les logs de test
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  // Supprimer les logs pendant les tests
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  // Restaurer les fonctions console
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Gestion des promesses non gérées
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
