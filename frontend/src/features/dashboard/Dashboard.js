import React, { useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DoctorDashboard from './DoctorDashboard';
import NurseDashboard from './NurseDashboard';
import AdminDashboard from './AdminDashboard';

const Dashboard = ({ stats = {} }) => {
  const { user, isAuthenticated, loading } = useSelector(state => state.auth);
  const navigate = useNavigate();
  
  // Rediriger si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, loading, navigate]);
  
  // Afficher un spinner pendant le chargement
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }
  
  // Rendu conditionnel en fonction du rôle de l'utilisateur
  const renderDashboard = () => {
    if (!isAuthenticated || !user) {
      return (
        <div className="alert alert-warning">
          Aucun utilisateur connecté. Redirection en cours...
        </div>
      );
    }
    
    // S'assurer que user.role est défini et en minuscules pour la comparaison
    const userRole = user.role ? user.role.toLowerCase() : '';
    
    switch(userRole) {
      case 'admin':
        return <AdminDashboard user={user} stats={stats} />;
      case 'medecin':
        return <DoctorDashboard user={user} stats={stats} />;
      case 'infirmier':
        return <NurseDashboard user={user} stats={stats} />;
      default:
        return <DefaultDashboard user={user} />;
    }
  };
  
  return (
    <div className="dashboard">
      {renderDashboard()}
    </div>
  );
};

// Tableau de bord par défaut (pour les rôles non spécifiés)
const DefaultDashboard = ({ user }) => {
  return (
    <div className="p-4">
      <h4 className="mb-4">Bienvenue, {user?.name || 'Utilisateur'}</h4>
      <div className="card">
        <div className="card-body">
          <p className="mb-0">
            Ceci est votre tableau de bord. Votre rôle actuel est : 
            <strong className="ms-1">{user?.role || 'non défini'}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
