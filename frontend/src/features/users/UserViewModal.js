import React, { useState } from 'react';
import { Modal, Button, Tab, Alert } from 'react-bootstrap';
import { 
  EnvelopeFill, 
  PersonFill, 
  PencilFill,
  CheckCircleFill,
  ClockHistory,
  GearFill,
  ShieldCheck,
  PersonBadgeFill,
  CheckCircle
} from 'react-bootstrap-icons';

// Import des composants décomposés
import UserProfileHeader from './components/UserProfileHeader';
import UserProfilePhoto from './components/UserProfilePhoto';
import UserProfileTabs from './components/UserProfileTabs';
import ProfileTab from './components/ProfileTab';

// Fonction utilitaire pour formater la date
const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return 'Non spécifié';
  
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    ...(includeTime && { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    })
  };
  
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  } catch (e) {
    return dateString;
  }
};

// Fonction utilitaire pour formater le numéro de téléphone
const formatPhone = (phone) => {
  if (!phone) return 'Non renseigné';
  // Supprime tous les caractères non numériques
  const cleaned = phone.replace(/\D/g, '');
  // Format international pour la France
  if (cleaned.startsWith('33')) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '+$1 $2 $3 $4 $5');
  }
  // Autres formats
  return cleaned.replace(/(\d{2})(?=\d)/g, '$1 ');
};

// Fonction utilitaire pour obtenir les informations du rôle
const getRoleInfo = (role) => {
  const roleMap = {
    admin: { 
      label: 'Administrateur', 
      variant: 'primary', 
      icon: <ShieldCheck className="me-1" />,
      description: 'Accès complet au système avec tous les privilèges.'
    },
    medecin: { 
      label: 'Médecin', 
      variant: 'info', 
      icon: <PersonFill className="me-1" />,
      description: 'Peut gérer les patients, les rendez-vous et les prescriptions.'
    },
    infirmier: { 
      label: 'Infirmier', 
      variant: 'success', 
      icon: <PersonFill className="me-1" />,
      description: 'Peut gérer les soins et les dossiers des patients.'
    },
    secretaire: { 
      label: 'Secrétaire', 
      variant: 'secondary', 
      icon: <PersonBadgeFill className="me-1" />,
      description: 'Peut gérer les rendez-vous et les dossiers des patients.'
    }
  };
  return roleMap[role] || { 
    label: 'Inconnu', 
    variant: 'dark',
    icon: <PersonFill className="me-1" />,
    description: 'Rôle non défini.'
  };
};

// Fonction utilitaire pour obtenir les informations du statut
const getStatusInfo = (status) => {
  const statusMap = {
    active: { 
      label: 'Actif', 
      variant: 'success', 
      icon: <CheckCircle className="me-1" />,
      description: 'Utilisateur actif et pouvant se connecter.'
    },
    inactive: { 
      label: 'Inactif', 
      variant: 'danger', 
      icon: <CheckCircle className="me-1" />,
      description: 'Compte désactivé, pas d\'accès au système.'
    },
    pending: { 
      label: 'En attente', 
      variant: 'warning', 
      icon: <ClockHistory className="me-1" />,
      description: 'En attente de validation par un administrateur.'
    }
  };
  return statusMap[status] || { 
    label: 'Inconnu', 
    variant: 'dark',
    icon: <ClockHistory className="me-1" />,
    description: 'Statut non défini.'
  };
};

const UserViewModal = ({ 
  show, 
  onHide, 
  user,
  onEdit
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  
  if (!user) return null;

  // Récupérer les informations du rôle et du statut
  const roleInfo = getRoleInfo(user.role);
  const statusInfo = getStatusInfo(user.status);

  // Données factices pour les statistiques
  const userStats = {
    completedTasks: 124,
    pendingTasks: 12,
    successRate: 89,
    lastActivity: user.lastLogin || new Date().toISOString()
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl"
      dialogClassName="modal-90w"
      aria-labelledby="user-view-modal"
      scrollable
    >
      <UserProfileHeader 
        user={user} 
        roleInfo={roleInfo} 
        statusInfo={statusInfo} 
        onHide={onHide}
      />
      
      <Modal.Body className="p-0">
        <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
          <div className="row g-0">
            {/* Colonne de gauche - Photo et informations principales */}
            <div className="col-md-4 border-end">
              <div className="p-4 text-center">
                <UserProfilePhoto statusVariant={statusInfo.variant} />
                
                <h4 className="mb-1 fw-bold">{user.name || 'Nom non spécifié'}</h4>
                <p className="text-muted mb-3">{user.specialite || 'Aucune spécialité renseignée'}</p>
                
                <div className="d-flex justify-content-center gap-2 mb-4">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="d-flex align-items-center"
                    onClick={() => onEdit(user.id)}
                  >
                    <PencilFill className="me-1" /> Modifier
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    className="d-flex align-items-center"
                  >
                    <EnvelopeFill className="me-1" /> Envoyer un message
                  </Button>
                </div>
                
                {/* Métriques rapides */}
                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <div className="border rounded p-2 text-center">
                      <div className="text-primary fw-bold">{userStats.completedTasks}</div>
                      <div className="text-muted small">Tâches</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded p-2 text-center">
                      <div className="text-success fw-bold">{userStats.successRate}%</div>
                      <div className="text-muted small">Taux de réussite</div>
                    </div>
                  </div>
                </div>
                
                {/* Dernière activité */}
                <div className="text-start">
                  <h6 className="text-uppercase text-muted small fw-bold mb-2">Dernière activité</h6>
                  <div className="d-flex align-items-center text-muted">
                    <ClockHistory size={14} className="me-2" />
                    <small>
                      {user.lastLogin 
                        ? `Dernière connexion le ${formatDate(user.lastLogin, true)}` 
                        : 'Aucune activité enregistrée'}
                    </small>
                  </div>
                </div>
              </div>
              
              <UserProfileTabs 
                activeKey={activeTab}
                onSelect={setActiveTab}
              />
            </div>
            
            {/* Colonne de droite - Contenu des onglets */}
            <div className="col-md-8">
              <Tab.Content className="p-4">
                <ProfileTab 
                  user={user} 
                  userStats={userStats} 
                  formatDate={formatDate} 
                  formatPhone={formatPhone} 
                />
                
                {/* Onglet Activité */}
                <Tab.Pane eventKey="activity">
                  <Alert variant="info" className="d-flex align-items-center">
                    <ClockHistory className="me-2" />
                    <div>
                      <h6>En cours de développement</h6>
                      <p className="mb-0">Cette section affichera bientôt l'activité récente de l'utilisateur.</p>
                    </div>
                  </Alert>
                </Tab.Pane>
                
                {/* Onglet Paramètres */}
                <Tab.Pane eventKey="settings">
                  <Alert variant="info" className="d-flex align-items-center">
                    <GearFill className="me-2" />
                    <div>
                      <h6>Paramètres utilisateur</h6>
                      <p className="mb-0">Cette section vous permettra de gérer les paramètres de l'utilisateur.</p>
                    </div>
                  </Alert>
                </Tab.Pane>
              </Tab.Content>
            </div>
          </div>
        </Tab.Container>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UserViewModal;
