import React, { useState, useMemo, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Badge, 
  Spinner,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap';
import { 
  PencilFill, 
  TrashFill, 
  EyeFill,
  SortDown,
  SortUp,
  PersonCheckFill,
  PersonXFill,
  PersonPlusFill,
  ClockHistory,
  CalendarCheck,
  EnvelopeFill,
  TelephoneFill,
  Building,
  GeoAltFill,
  InfoCircle
} from 'react-bootstrap-icons';
import UserViewModal from './UserViewModal';

// Composant pour l'en-tête de tableau triable
const SortableHeader = ({ label, sortKey, sortConfig, onSort, className = '' }) => {
  const isActive = sortConfig && sortConfig.key === sortKey;
  const isAsc = sortConfig && sortConfig.direction === 'asc';
  
  return (
    <th 
      onClick={() => onSort(sortKey)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
      className={`align-middle ${className}`}
    >
      <div className="d-flex align-items-center">
        <span className="me-1">{label}</span>
        {isActive ? (
          isAsc ? <SortUp size={14} /> : <SortDown size={14} />
        ) : (
          <span style={{ opacity: 0.3 }}><SortDown size={14} /></span>
        )}
      </div>
    </th>
  );
};

// Fonction utilitaire pour le tri des données
const sortData = (items, { key, direction }) => {
  return [...items].sort((a, b) => {
    // Gérer les valeurs nulles ou indéfinies
    if (!a[key] && !b[key]) return 0;
    if (!a[key]) return direction === 'asc' ? -1 : 1;
    if (!b[key]) return direction === 'asc' ? 1 : -1;
    
    // Convertir en chaîne pour la comparaison
    const aValue = String(a[key]).toLowerCase();
    const bValue = String(b[key]).toLowerCase();
    
    if (aValue < bValue) {
      return direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

// Fonction utilitaire pour formater la date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  } catch (e) {
    return dateString;
  }
};

// Fonction utilitaire pour obtenir l'icône de rôle
const getRoleIcon = (role) => {
  switch (role) {
    case 'admin':
      return <PersonPlusFill className="text-primary" />;
    case 'medecin':
      return <PersonCheckFill className="text-success" />;
    case 'infirmier':
      return <PersonCheckFill className="text-info" />;
    case 'secretaire':
      return <PersonCheckFill className="text-secondary" />;
    default:
      return <PersonCheckFill className="text-muted" />;
  }
};

// Fonction utilitaire pour obtenir l'icône de statut
const getStatusIcon = (status) => {
  switch (status) {
    case 'active':
      return <span className="text-success">•</span>;
    case 'inactive':
      return <span className="text-danger">•</span>;
    case 'en_conges':
      return <span className="text-warning">•</span>;
    case 'pending':
      return <span className="text-info">•</span>;
    default:
      return <span className="text-muted">•</span>;
  }
};

const UserList = ({ 
  users = [], 
  onEdit, 
  onDelete,
  onView,
  loading = false,
  className = ''
}) => {
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Gestion du tri
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Données triées
  const sortedUsers = useMemo(() => {
    return sortConfig ? sortData(users, sortConfig) : users;
  }, [users, sortConfig]);

  // Gestion de la vue détaillée
  const handleView = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
    if (onView) onView(user.id);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
        <p className="mt-2">Chargement des utilisateurs...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">Aucun utilisateur trouvé.</p>
      </div>
    );
  }

  return (
    <div className={`user-list ${className}`}>
      {/* Tableau des utilisateurs */}
      <div className="table-responsive">
        <Table hover className="align-middle">
          <thead className="table-light">
            <tr>
              <SortableHeader 
                label="Nom" 
                sortKey="name" 
                sortConfig={sortConfig} 
                onSort={requestSort}
                className="min-width-200"
              />
              <th className="min-width-200">Email</th>
              <th className="min-width-150">Téléphone</th>
              <th className="min-width-120">Rôle</th>
              <th className="min-width-120">Statut</th>
              <th className="min-width-150">Date d'ajout</th>
              <th className="text-end min-width-120">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((user) => (
              <tr key={user.id} className={user.status === 'inactive' ? 'table-light' : ''}>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="me-2">
                      {getRoleIcon(user.role)}
                    </div>
                    <div>
                      <div className="fw-medium">{user.name}</div>
                      <div className="text-muted small">{user.specialite || 'Non spécifié'}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <EnvelopeFill className="text-muted me-2" size={14} />
                    <a href={`mailto:${user.email}`} className="text-decoration-none">
                      {user.email}
                    </a>
                  </div>
                </td>
                <td>
                  {user.telephone ? (
                    <div className="d-flex align-items-center">
                      <TelephoneFill className="text-muted me-2" size={14} />
                      <a href={`tel:${user.telephone.replace(/\s+/g, '')}`} className="text-decoration-none">
                        {user.telephone}
                      </a>
                    </div>
                  ) : (
                    <span className="text-muted">Non renseigné</span>
                  )}
                </td>
                <td>
                  <Badge bg={getRoleBadge(user.role).bg} className="d-inline-flex align-items-center">
                    {getRoleIcon(user.role)}
                    <span className="ms-1">{getRoleBadge(user.role).label}</span>
                  </Badge>
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    {getStatusIcon(user.status)}
                    <span className="ms-2">{getStatusBadge(user.status).label}</span>
                  </div>
                </td>
                <td>
                  <div className="d-flex align-items-center text-muted small">
                    <CalendarCheck className="me-1" size={14} />
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                  </div>
                  {user.lastLogin && (
                    <div className="text-muted small">
                      <ClockHistory className="me-1" size={12} />
                      Dernière connexion: {formatDate(user.lastLogin)}
                    </div>
                  )}
                </td>
                <td className="text-end">
                  <div className="d-flex justify-content-end">
                    <OverlayTrigger overlay={<Tooltip>Voir les détails</Tooltip>}>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-primary p-1"
                        onClick={() => handleView(user)}
                      >
                        <EyeFill size={18} />
                      </Button>
                    </OverlayTrigger>
                    
                    <OverlayTrigger overlay={<Tooltip>Modifier</Tooltip>}>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-warning p-1"
                        onClick={() => onEdit(user.id)}
                      >
                        <PencilFill size={18} />
                      </Button>
                    </OverlayTrigger>
                    
                    <OverlayTrigger overlay={<Tooltip>Supprimer</Tooltip>}>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-danger p-1"
                        onClick={() => onDelete(user.id)}
                      >
                        <TrashFill size={18} />
                      </Button>
                    </OverlayTrigger>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Modal de visualisation */}
      {selectedUser && (
        <UserViewModal
          show={showViewModal}
          onHide={() => setShowViewModal(false)}
          user={selectedUser}
        />
      )}
      
      <style jsx global>{`
        .min-width-120 { min-width: 120px; }
        .min-width-150 { min-width: 150px; }
        .min-width-200 { min-width: 200px; }
        .cursor-pointer { cursor: pointer; }
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #f0f2f5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #495057;
        }
        .status-dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 5px;
        }
        .status-active { background-color: #2ecc71; }
        .status-inactive { background-color: #e74c3c; }
        .status-pending { background-color: #f39c12; }
        .status-en_conges { background-color: #3498db; }
      `}</style>
    </div>
  );
};

export default UserList;

// Fonction utilitaire pour obtenir le badge de rôle
const getRoleBadge = (role) => {
  const roleMap = {
    admin: { label: 'Admin', variant: 'primary' },
    teacher: { label: 'Enseignant', variant: 'info' },
    student: { label: 'Étudiant', variant: 'secondary' }
  };
  const { label, variant } = roleMap[role] || { label: 'Inconnu', variant: 'secondary' };
  return <Badge bg={variant} className="text-uppercase">{label}</Badge>;
};

// Fonction utilitaire pour obtenir le badge de statut
const getStatusBadge = (status) => {
  const statusMap = {
    active: { label: 'Actif', variant: 'success' },
    inactive: { label: 'Inactif', variant: 'danger' },
    pending: { label: 'En attente', variant: 'warning' }
  };
  const { label, variant } = statusMap[status] || { label: 'Inconnu', variant: 'secondary' };
  return <Badge bg={variant} className="text-uppercase">{label}</Badge>;
};
