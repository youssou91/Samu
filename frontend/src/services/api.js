// Importation de la configuration
import { APP_MODE, API_CONFIG } from '../config';
import axios from 'axios';
import qs from 'qs';

// Importer les API mockées
import { authApi as mockAuthApi, userApi as mockUserApi } from './mockApi';

// Configuration d'axios pour inclure le token d'authentification
const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Ne pas définir les en-têtes de contrôle de cache ici
  // car ils doivent être gérés par le navigateur et le serveur
  timeout: API_CONFIG.timeout,
  withCredentials: API_CONFIG.withCredentials,
  // Désactiver la mise en cache pour les requêtes GET
  paramsSerializer: params => {
    return qs.stringify(params, { arrayFormat: 'brackets' });
  }
});

// Suppression des en-têtes de contrôle de cache par défaut
// pour éviter les problèmes avec les requêtes préliminaires (preflight)
api.interceptors.request.use(config => {
  // Ne pas ajouter les en-têtes de cache pour les requêtes OPTIONS (preflight)
  if (config.method !== 'options') {
    config.headers['Cache-Control'] = 'no-cache';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
  }
  return config;
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Token utilisé pour la requête:', token ? 'Présent' : 'Absent');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('En-tête d\'autorisation ajouté à la requête');
    } else {
      console.warn('Aucun token trouvé pour cette requête');
    }
    
    console.log('Requête envoyée à:', config.url);
    console.log('Méthode:', config.method);
    console.log('En-têtes:', config.headers);
    
    return config;
  },
  (error) => {
    console.error('Erreur dans l\'intercepteur de requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse pour la gestion des erreurs
api.interceptors.response.use(
  (response) => {
    console.log('Réponse reçue:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    if (error.response) {
      // La requête a été faite et le serveur a répondu avec un code d'erreur
      console.error('Erreur de réponse:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // Gérer les erreurs d'authentification
      if (error.response.status === 401) {
        console.error('Erreur d\'authentification - Déconnexion de l\'utilisateur');
        // Vous pouvez ajouter ici une logique de déconnexion si nécessaire
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      console.error('Aucune réponse du serveur:', error.request);
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      console.error('Erreur de configuration de la requête:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Gestion des erreurs
const handleError = (error) => {
  if (error.response) {
    // La requête a été faite et le serveur a répondu avec un code d'erreur
    console.error('Erreur API:', error.response.data);
    return {
      success: false,
      message: error.response.data.message || 'Une erreur est survenue',
      status: error.response.status,
      data: error.response.data
    };
  } else if (error.request) {
    // La requête a été faite mais aucune réponse n'a été reçue
    console.error('Pas de réponse du serveur:', error.request);
    return {
      success: false,
      message: 'Impossible de se connecter au serveur',
    };
  } else {
    // Une erreur s'est produite lors de la configuration de la requête
    console.error('Erreur de configuration:', error.message);
    return {
      success: false,
      message: error.message || 'Erreur de configuration de la requête',
    };
  }
};

// ========== AUTHENTIFICATION ==========
export const login = async (email, password) => {
  if (APP_MODE === 'mock') {
    return mockAuthApi.login(email, password);
  }
  
  try {
    console.log('Tentative de connexion vers:', '/auth/login');
    const response = await api.post('/auth/login', { email, password });
    console.log('Réponse brute du serveur:', response);
    
    // Vérifier si la réponse contient des données
    if (!response.data) {
      console.error('Aucune donnée dans la réponse du serveur');
      return { success: false, message: 'Aucune donnée reçue du serveur' };
    }
    
    console.log('Données de la réponse:', response.data);
    
    // Retourner directement la réponse du serveur
    // Le stockage du token et des données utilisateur sera géré par le slice Redux
    return response.data;
    
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    
    // Gérer les erreurs de réponse HTTP
    if (error.response) {
      // La requête a été faite et le serveur a répondu avec un statut d'erreur
      console.error('Détails de l\'erreur:', error.response.data);
      return {
        success: false,
        message: error.response.data?.message || 'Erreur lors de la connexion',
        status: error.response.status
      };
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      console.error('Pas de réponse du serveur:', error.request);
      return {
        success: false,
        message: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.'
      };
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      console.error('Erreur de configuration de la requête:', error.message);
      return {
        success: false,
        message: 'Erreur de configuration de la requête: ' + error.message
      };
    }
  }
};

export const logout = async () => {
  if (APP_MODE === 'mock') {
    return mockAuthApi.logout();
  }
  
  try {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// ========== UTILISATEURS ==========
export const userApi = {
  // Créer un utilisateur
  create: async (userData) => {
    if (APP_MODE === 'mock') {
      return mockUserApi.create(userData);
    }
    
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Obtenir tous les utilisateurs
  getAll: async () => {
    if (APP_MODE === 'mock') {
      return mockUserApi.getAll();
    }
    
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Obtenir un utilisateur par ID
  getById: async (id) => {
    if (APP_MODE === 'mock') {
      return mockUserApi.getById(id);
    }
    
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Mettre à jour un utilisateur
  update: async (id, userData) => {
    if (APP_MODE === 'mock') {
      return mockUserApi.update(id, userData);
    }
    
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Supprimer un utilisateur
  delete: async (id) => {
    if (APP_MODE === 'mock') {
      return mockUserApi.delete(id);
    }
    
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// ========== RENDEZ-VOUS ==========
export const presenceApi = {
  // Créer une présence
  create: async (presenceData) => {
    try {
      const response = await api.post('/presences', presenceData);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  // Obtenir toutes les présences
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/presences', { params });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  // Obtenir une présence par ID
  getById: async (id) => {
    try {
      const response = await api.get(`/presences/${id}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  // Mettre à jour une présence
  update: async (id, presenceData) => {
    try {
      const response = await api.put(`/presences/${id}`, presenceData);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  // Supprimer une présence
  delete: async (id) => {
    try {
      const response = await api.delete(`/presences/${id}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

export const planningApi = {
  // Créer un événement de planning
  create: async (planningData) => {
    try {
      const response = await api.post('/planning', planningData);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  // Obtenir tous les événements
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/planning', { params });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  // Obtenir un événement par ID
  getById: async (id) => {
    try {
      const response = await api.get(`/planning/${id}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  // Mettre à jour un événement
  update: async (id, planningData) => {
    try {
      const response = await api.put(`/planning/${id}`, planningData);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  // Supprimer un événement
  delete: async (id) => {
    try {
      const response = await api.delete(`/planning/${id}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

export const rendezVousApi = {
  // Créer un rendez-vous
  create: async (rendezVousData) => {
    try {
      const response = await api.post('/rendezvous', rendezVousData);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Obtenir tous les rendez-vous
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/rendezvous', { params });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Obtenir un rendez-vous par ID
  getById: async (id) => {
    try {
      const response = await api.get(`/rendezvous/${id}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Mettre à jour un rendez-vous
  update: async (id, rendezVousData) => {
    try {
      const response = await api.put(`/rendezvous/${id}`, rendezVousData);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Supprimer un rendez-vous
  delete: async (id) => {
    try {
      const response = await api.delete(`/rendezvous/${id}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Obtenir les rendez-vous d'un patient
  getByPatient: async (patientId) => {
    try {
      const response = await api.get(`/rendezvous/patient/${patientId}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Obtenir les rendez-vous d'un médecin
  getByMedecin: async (medecinId) => {
    try {
      const response = await api.get(`/rendezvous/medecin/${medecinId}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// ========== AUTH CONTEXT ==========
// Vérifier si l'utilisateur est authentifié
export const checkAuth = () => {
  if (APP_MODE === 'mock') {
    return mockAuthApi.checkAuth();
  }
  
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  return {
    isAuthenticated: !!token,
    user,
    token
  };
};

// Rafraîchir les informations de l'utilisateur
export const refreshUser = async () => {
  if (APP_MODE === 'mock') {
    return mockAuthApi.refreshUser();
  }
  
  const { user } = checkAuth();
  if (!user) return null;
  
  try {
    const response = await userApi.getById(user._id);
    if (response.success) {
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Erreur lors du rafraîchissement des données utilisateur:', error);
    return null;
  }
};
