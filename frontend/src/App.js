import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from './features/auth/authSlice';

// Components
import Layout from './components/Layout';
import Login from './features/auth/Login';
import Users from './features/users/Users';
import Presences from './features/presences/Presences';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Features
import RendezVous from './features/rendezvous/RendezVous';
import Planning from './features/planning/Planning';
import Dashboard from './features/dashboard/Dashboard';

// Pages à implémenter
const Rapports = () => (
  <div className="p-4">
    <h2>Rapports</h2>
    <p>Page en construction</p>
  </div>
);

const Statistiques = () => (
  <div className="p-4">
    <h2>Statistiques</h2>
    <p>Page en construction</p>
  </div>
);

const Parametres = () => (
  <div className="p-4">
    <h2>Paramètres</h2>
    <p>Page en construction</p>
  </div>
);

// Composant pour les routes protégées
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useSelector(state => state.auth);
  
  console.log('ProtectedRoute - État:', { isAuthenticated, user, loading });
  
  if (loading) {
    console.log('Chargement en cours...');
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    console.log('Non authentifié, redirection vers /');
    return <Navigate to="/" replace />;
  }
  
  if (requiredRole) {
    const hasAccess = Array.isArray(requiredRole) 
      ? requiredRole.includes(user?.role)
      : user?.role === requiredRole;
    
    if (!hasAccess) {
      console.log('Accès refusé, redirection vers /dashboard');
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  console.log('Accès autorisé, rendu du composant enfant');
  return children;
};

const AppContent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading } = useSelector(state => state.auth);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          // Vérifier la validité du token côté serveur si nécessaire
          // Par exemple, en effectuant une requête de validation
          // Si le token est valide, mettre à jour l'état d'authentification
          dispatch(loginUser.fulfilled({
            user: JSON.parse(storedUser),
            token: token
          }));
        } catch (error) {
          console.error('Erreur de vérification de l\'authentification:', error);
          // En cas d'erreur, déconnecter l'utilisateur
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    };

    checkAuth();
  }, [dispatch]);

  // Rediriger vers le tableau de bord si authentifié
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Redirection vers /dashboard car isAuthenticated =', isAuthenticated);
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={
          isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <Login />
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Routes protégées */}
        <Route path="/utilisateurs" element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <div className="p-4">
                <Users />
              </div>
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/presences" element={
          <ProtectedRoute>
            <Layout>
              <div className="p-4">
                <Presences />
              </div>
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/rendez-vous" element={
          <ProtectedRoute>
            <Layout>
              <div className="p-4">
                <RendezVous />
              </div>
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/planning" element={
          <ProtectedRoute>
            <Layout>
              <div className="p-4">
                <Planning />
              </div>
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/rapports" element={
          <ProtectedRoute>
            <Layout>
              <div className="p-4">
                <Rapports />
              </div>
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/statistiques" element={
          <ProtectedRoute>
            <Layout>
              <div className="p-4">
                <Statistiques />
              </div>
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/parametres" element={
          <ProtectedRoute>
            <Layout>
              <div className="p-4">
                <Parametres />
              </div>
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="*" element={
          isAuthenticated ? 
            <Navigate to="/dashboard" /> : 
            <Navigate to="/" />
        } />
      </Routes>
    </div>
  );
};

const App = () => {
  return <AppContent />;
};

export default App;
