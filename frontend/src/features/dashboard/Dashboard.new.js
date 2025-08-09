import React from 'react';
import { useUser } from '../../contexts/UserContext';
import DoctorDashboard from './DoctorDashboard';
import NurseDashboard from './NurseDashboard';
import AdminDashboard from './AdminDashboard';

const Dashboard = ({ stats = {} }) => {
  const { currentUser } = useUser();
  
  // Rendu conditionnel en fonction du rôle de l'utilisateur
  const renderDashboard = () => {
    if (!currentUser) return null;
    
    switch(currentUser.role) {
      case 'admin':
        return <AdminDashboard user={currentUser} stats={stats} />;
      case 'medecin':
        return <DoctorDashboard user={currentUser} stats={stats} />;
      case 'infirmier':
        return <NurseDashboard user={currentUser} stats={stats} />;
      default:
        return <DefaultDashboard user={currentUser} />;
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
