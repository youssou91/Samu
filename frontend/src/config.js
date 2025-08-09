// Configuration de l'application

// Mode de l'application: 'mock' ou 'api'
export const APP_MODE = 'api';

// Configuration de l'API
export const API_CONFIG = {
  baseURL: 'http://localhost:5000/api', // Port 5000 pour le backend
  timeout: 10000,
  withCredentials: true
};

// Configuration des données mockées
export const MOCK_CONFIG = {
  // Délai de réponse simulé en millisecondes
  responseDelay: 300,
  // Activer/désactiver les erreurs aléatoires pour les tests
  enableRandomErrors: false,
  // Taux d'erreur (0-1) si enableRandomErrors est vrai
  errorRate: 0.1
};

// Configuration de l'authentification
export const AUTH_CONFIG = {
  // Clé pour stocker le token dans le localStorage
  tokenKey: 'token',
  // Clé pour stocker l'utilisateur dans le localStorage
  userKey: 'currentUser',
  // Durée de validité du token en secondes (24h)
  tokenExpiry: 24 * 60 * 60
};
