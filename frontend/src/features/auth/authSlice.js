import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { login as loginApi } from '../../services/api';

// Thunk pour la connexion
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      console.log('Tentative de connexion avec:', email);
      const response = await loginApi(email, password);
      console.log('Réponse de loginApi:', response);
      
      if (response && response.success) {
        console.log('Réponse de connexion réussie:', response);
        
        // Stocker le token et les données utilisateur dans le localStorage
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }
        
        return response;
      } else {
        const errorMsg = response?.message || 'Réponse invalide du serveur';
        console.error('Réponse de connexion invalide:', errorMsg);
        return rejectWithValue(errorMsg);
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Erreur de connexion au serveur';
      return rejectWithValue(errorMessage);
    }
  }
);

// Fonction utilitaire pour vérifier si un token est expiré
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return decoded.exp * 1000 < Date.now();
  } catch (e) {
    return true; // En cas d'erreur, on considère le token comme expiré
  }
};

// Fonction pour charger l'état initial depuis le localStorage
const loadInitialState = () => {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  
  // Vérifier si le token est présent et valide
  const tokenIsValid = token && !isTokenExpired(token);
  
  // Nettoyer le localStorage si le token est expiré
  if (token && !tokenIsValid) {
    console.log('Nettoyage du localStorage: token expiré');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  
  return {
    user: tokenIsValid && userJson ? JSON.parse(userJson) : null,
    token: tokenIsValid ? token : null,
    isAuthenticated: tokenIsValid,
    loading: false,
    error: token && !tokenIsValid ? 'Votre session a expiré. Veuillez vous reconnecter.' : null,
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState(),
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        console.log('loginUser.pending - Mise à jour de l\'état en cours...');
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log('loginUser.fulfilled - Connexion réussie:', {
          hasToken: !!action.payload.token,
          hasUser: !!action.payload.user
        });

        // Vérifier la validité du token
        const token = action.payload.token;
        const tokenIsValid = token && !isTokenExpired(token);
        
        if (tokenIsValid) {
          state.loading = false;
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = token;
          state.error = null;
          
          // Stocker dans le localStorage
          localStorage.setItem('token', token);
          if (action.payload.user) {
            localStorage.setItem('user', JSON.stringify(action.payload.user));
          }
          
          console.log('Connexion réussie - Utilisateur authentifié');
        } else {
          console.error('Token invalide ou expiré');
          state.loading = false;
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
          state.error = 'La session a expiré. Veuillez vous reconnecter.';
          
          // Nettoyer le localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        
        console.log('État après connexion réussie:', {
          isAuthenticated: state.isAuthenticated,
          user: state.user,
          token: state.token ? '***' : null
        });
      })
      .addCase(loginUser.rejected, (state, action) => {
        console.error('loginUser.rejected - Erreur de connexion:', action.payload || action.error);
        state.loading = false;
        state.error = action.payload || 'Échec de la connexion';
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        
        // Nettoyer le localStorage en cas d'erreur
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
