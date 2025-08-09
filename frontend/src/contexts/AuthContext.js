import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, logout as logoutApi, checkAuth, refreshUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { isAuthenticated: authStatus, user: userData } = checkAuth();
        
        if (authStatus && userData) {
          // Rafraîchir les données utilisateur
          const refreshedUser = await refreshUser();
          setUser(refreshedUser || userData);
        }
        
        setIsAuthenticated(authStatus);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'authentification:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Connexion
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await loginApi(email, password);
      console.log('Réponse complète de loginApi:', response);
      
      if (response && response.success) {
        const { user: userData, token } = response;
        
        // Stocker le token si présent
        if (token) {
          localStorage.setItem('token', token);
        }
        
        // Mettre à jour l'état
        setUser(userData);
        setIsAuthenticated(true);
        
        // Retourner la réponse complète
        return response;
      } else {
        const errorMessage = response?.message || 'Échec de la connexion';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      const errorMessage = error.message || 'Une erreur est survenue lors de la connexion';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Déconnexion
  const logout = async () => {
    try {
      await logoutApi();
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      return { success: false, message: error.message };
    }
  };

  // Rafraîchir les données utilisateur
  const refreshUserData = async () => {
    try {
      const userData = await refreshUser();
      if (userData) {
        setUser(userData);
        return { success: true, user: userData };
      }
      return { success: false };
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données utilisateur:', error);
      return { success: false, error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        refreshUser: refreshUserData,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};

export default AuthContext;
