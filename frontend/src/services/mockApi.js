import { mockUsers } from '../data/mockData';

// Simuler un délai réseau
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Simuler une réponse API réussie
const successResponse = (data) => ({
  success: true,
  data,
  message: 'Opération réussie'
});

// Simuler une erreur API
const errorResponse = (message, status = 400) => ({
  success: false,
  message,
  status
});

// Simuler le stockage local pour les sessions
const mockLocalStorage = {
  _store: {},
  getItem(key) {
    return this._store[key] || null;
  },
  setItem(key, value) {
    this._store[key] = value.toString();
  },
  removeItem(key) {
    delete this._store[key];
  },
  clear() {
    this._store = {};
  }
};

// Simuler l'API d'authentification
export const authApi = {
  async login(email, password) {
    await delay(500); // Simuler un délai réseau
    
    const user = mockUsers.find(u => u.email === email && u.password === btoa(unescape(encodeURIComponent(password))));
    
    if (!user) {
      return {
        success: false,
        message: 'Email ou mot de passe incorrect',
        status: 401
      };
    }
    
    // Créer un token factice
    const token = btoa(JSON.stringify({ id: user.id, role: user.role }));
    
    // Préparer les données utilisateur à renvoyer
    const userData = {
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      specialite: user.specialite,
      telephone: user.telephone,
      status: user.status
    };
    
    // Stocker dans le localStorage simulé
    mockLocalStorage.setItem('token', token);
    mockLocalStorage.setItem('user', JSON.stringify(userData));
    
    // Retourner la réponse attendue par le frontend
    return {
      success: true,
      user: userData,
      token: token,
      message: 'Connexion réussie'
    };
  },
  
  logout() {
    mockLocalStorage.removeItem('token');
    mockLocalStorage.removeItem('currentUser');
    return Promise.resolve(successResponse({}));
  },
  
  async checkAuth() {
    const token = mockLocalStorage.getItem('token');
    const user = mockLocalStorage.getItem('user');
    
    return {
      isAuthenticated: !!token,
      user: user ? JSON.parse(user) : null
    };
  },
  
  async refreshUser() {
    await delay(300);
    const user = JSON.parse(mockLocalStorage.getItem('user') || 'null');
    return user;
  }
};

// Simuler l'API des utilisateurs
export const userApi = {
  async getAll() {
    await delay(500);
    return successResponse(mockUsers.map(({ password, ...user }) => user));
  },
  
  async getById(id) {
    await delay(300);
    const user = mockUsers.find(u => u.id === id);
    if (!user) {
      return errorResponse('Utilisateur non trouvé', 404);
    }
    const { password, ...userData } = user;
    return successResponse(userData);
  },
  
  // Ajoutez d'autres méthodes CRUD selon vos besoins
};

// Exporter un objet API complet pour remplacer l'API réelle
const mockApi = {
  ...authApi,
  userApi,
  // Ajoutez d'autres API mockées ici
};

export default mockApi;
