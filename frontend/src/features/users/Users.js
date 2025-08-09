import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Container, Button, Modal, Row, Col, Form, InputGroup } from 'react-bootstrap';
import { PlusCircle, Search, Funnel, X } from 'react-bootstrap-icons';
import UserList from './UserList';
import UserForm from './UserForm';
import SearchAndFilter from '../../components/common/SearchAndFilter';
import ExportButton from '../../components/common/ExportButton';

// Données de démonstration
const initialUsers = [
  { 
    id: 1, 
    name: 'Admin User', 
    email: 'admin@example.com', 
    role: 'admin', 
    status: 'active',
    createdAt: '2023-01-15',
    lastLogin: '2023-06-20T14:30:00Z'
  },
  { 
    id: 2, 
    name: 'Dr. Marie Diop', 
    email: 'marie.diop@example.com', 
    role: 'medecin', 
    status: 'active',
    specialite: 'Cardiologie',
    telephone: '+221 77 123 45 67',
    createdAt: '2023-02-10',
    lastLogin: '2023-06-21T09:15:00Z'
  },
  { 
    id: 3, 
    name: 'Inf. Awa Fall', 
    email: 'awa.fall@example.com', 
    role: 'infirmier', 
    status: 'active',
    specialite: 'Soins généraux',
    telephone: '+221 77 234 56 78',
    createdAt: '2023-03-05',
    lastLogin: '2023-06-20T16:45:00Z'
  },
  { 
    id: 4, 
    name: 'Dr. Jean Ndiaye', 
    email: 'jean.ndiaye@example.com', 
    role: 'medecin', 
    status: 'inactive',
    specialite: 'Pédiatrie',
    telephone: '+221 77 345 67 89',
    createdAt: '2023-01-20',
    lastLogin: '2023-05-15T11:20:00Z'
  },
  { 
    id: 5, 
    name: 'Inf. Ibrahima Diouf', 
    email: 'ibrahima.diouf@example.com', 
    role: 'infirmier', 
    status: 'en_conges',
    specialite: 'Urgences',
    telephone: '+221 77 456 78 90',
    createdAt: '2023-04-12',
    lastLogin: '2023-06-18T08:10:00Z'
  },
];

// Options pour les filtres
const roleOptions = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'medecin', label: 'Médecin' },
  { value: 'infirmier', label: 'Infirmier' },
  { value: 'secretaire', label: 'Secrétaire' },
];

const statusOptions = [
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
  { value: 'en_conges', label: 'En congés' },
  { value: 'pending', label: 'En attente' },
];

const Users = () => {
  const { user: currentUser } = useSelector(state => state.auth);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // États pour la recherche et le filtrage
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });
  
  // Colonnes pour l'export
  const exportColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { 
      key: 'role', 
      label: 'Rôle',
      format: (value) => {
        const role = roleOptions.find(r => r.value === value);
        return role ? role.label : value;
      }
    },
    { 
      key: 'status', 
      label: 'Statut',
      format: (value) => {
        const status = statusOptions.find(s => s.value === value);
        return status ? status.label : value;
      }
    },
    { key: 'createdAt', label: 'Date de création' },
    { key: 'lastLogin', label: 'Dernière connexion' },
  ];

  // Chargement initial des utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // Remplacer par un appel API réel
        // const response = await api.get('/api/users');
        // const data = response.data;
        
        // Simulation de chargement
        await new Promise(resolve => setTimeout(resolve, 1000));
        setUsers(initialUsers);
        setFilteredUsers(initialUsers);
      } catch (err) {
        console.error('Erreur lors du chargement des utilisateurs:', err);
        setError('Impossible de charger les utilisateurs. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);
  
  // Filtrage des utilisateurs
  useEffect(() => {
    if (!users.length) return;
    
    let result = [...users];
    
    // Filtre par terme de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.name.toLowerCase().includes(term) || 
        user.email.toLowerCase().includes(term) ||
        (user.telephone && user.telephone.includes(term)) ||
        (user.specialite && user.specialite.toLowerCase().includes(term))
      );
    }
    
    // Filtres avancés
    if (filters.role) {
      result = result.filter(user => user.role === filters.role);
    }
    
    if (filters.status) {
      result = result.filter(user => user.status === filters.status);
    }
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      result = result.filter(user => new Date(user.createdAt) >= fromDate);
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Fin de la journée
      result = result.filter(user => new Date(user.createdAt) <= toDate);
    }
    
    setFilteredUsers(result);
  }, [users, searchTerm, filters]);
  
  // Gestion de la recherche
  const handleSearch = (term) => {
    setSearchTerm(term);
  };
  
  // Gestion des changements de filtre
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };
  
  // Réinitialisation des filtres
  const resetFilters = () => {
    setSearchTerm('');
    setFilters({
      role: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    });
  };
  
  // Préparation des données pour l'export
  const getExportData = useMemo(() => {
    return filteredUsers.map(user => {
      const userData = { ...user };
      // Formater les données pour l'export si nécessaire
      if (userData.role) {
        const role = roleOptions.find(r => r.value === userData.role);
        userData.role = role ? role.label : userData.role;
      }
      if (userData.status) {
        const status = statusOptions.find(s => s.value === userData.status);
        userData.status = status ? status.label : userData.status;
      }
      return userData;
    });
  }, [filteredUsers]);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEditUser = (userId) => {
    const user = users.find(u => u.id === userId);
    setEditingUser(user);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      // Remplacer par un appel API réel
      // await api.delete(`/api/users/${userId}`);
      
      // Simulation de suppression
      await new Promise(resolve => setTimeout(resolve, 500));
      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
      
      // Mettre à jour les utilisateurs filtrés
      setFilteredUsers(updatedUsers);
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', err);
      setError('Impossible de supprimer l\'utilisateur. Veuillez réessayer.');
    }
  };

  const handleViewUser = (userId) => {
    // Rediriger vers la page de détail de l'utilisateur
    console.log('Voir l\'utilisateur:', userId);
  };

  const handleSubmit = async (userData) => {
    try {
      let updatedUsers;
      
      if (isEditing && editingUser) {
        // Simulation de mise à jour d'un utilisateur existant
        // const response = await api.put(`/api/users/${editingUser.id}`, userData);
        
        // Simulation de délai pour l'appel API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mise à jour de l'utilisateur avec les nouvelles données
        const updatedUser = {
          ...editingUser, 
          ...userData,
          id: editingUser.id,
          createdAt: editingUser.createdAt,
          lastLogin: editingUser.lastLogin
        };
        
        // Mise à jour de la liste des utilisateurs
        updatedUsers = users.map(user => 
          user.id === editingUser.id ? updatedUser : user
        );
      } else {
        // Ajout d'un nouvel utilisateur
        // Remplacer par un appel API réel
        // const response = await api.post('/api/users', userData);
        // const newUser = response.data;
        
        // Simulation d'ajout
        await new Promise(resolve => setTimeout(resolve, 500));
        const newUser = {
          ...userData,
          id: Math.max(...users.map(u => u.id), 0) + 1,
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0],
          lastLogin: null
        };
        
        updatedUsers = [...users, newUser];
      }
      
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      setShowModal(false);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de l\'utilisateur:', err);
      setError(`Impossible de ${isEditing ? 'mettre à jour' : 'ajouter'} l'utilisateur. Veuillez réessayer.`);
    }
  };
  
  // Options pour les filtres du composant SearchAndFilter
  const filterOptions = [
    {
      id: 'role',
      label: 'Rôle',
      type: 'select',
      options: [{ value: '', label: 'Tous les rôles' }, ...roleOptions]
    },
    {
      id: 'status',
      label: 'Statut',
      type: 'select',
      options: [{ value: '', label: 'Tous les statuts' }, ...statusOptions]
    },
    {
      id: 'dateFrom',
      label: 'Date de création (début)',
      type: 'date'
    },
    {
      id: 'dateTo',
      label: 'Date de création (fin)',
      type: 'date'
    }
  ];

  if (loading && users.length === 0) {
    return (
      <Container className="py-4 text-center">
        <div className="py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3">Chargement des utilisateurs...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <Button variant="primary" onClick={() => window.location.reload()} className="mt-3">
          Réessayer
        </Button>
      </Container>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestion des utilisateurs</h2>
        <div>
          <ExportButton 
            data={getExportData}
            fileName="utilisateurs"
            title="Liste des utilisateurs"
            columns={exportColumns}
            buttonText="Exporter"
            buttonVariant="outline-secondary"
            buttonSize="sm"
            className="me-2"
            tooltip="Exporter les utilisateurs"
          />
          <Button 
            variant="primary" 
            onClick={handleAddUser}
            size="sm"
          >
            <PlusCircle className="me-1" />
            Ajouter un utilisateur
          </Button>
        </div>
      </div>
      
      {error && <div className="alert alert-warning">{error}</div>}
      
      {/* Barre de recherche et filtres */}
      <SearchAndFilter
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        filterOptions={filters}
        filters={filterOptions}
        searchPlaceholder="Rechercher un utilisateur..."
        className="mb-4"
      />
      
      {/* Résultats de la recherche */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="text-muted small">
          {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''} trouvé{filteredUsers.length !== 1 ? 's' : ''}
          {(searchTerm || Object.values(filters).some(Boolean)) && (
            <Button 
              variant="link" 
              size="sm" 
              className="ms-2 p-0 align-baseline"
              onClick={resetFilters}
            >
              <X size={14} className="me-1" />
              Réinitialiser les filtres
            </Button>
          )}
        </div>
        
        <div className="d-flex align-items-center">
          <Form.Select 
            size="sm" 
            className="ms-2"
            style={{ width: 'auto' }}
            value={filters.sortBy || ''}
            onChange={(e) => handleFilterChange({ sortBy: e.target.value || null })}
          >
            <option value="">Trier par</option>
            <option value="name-asc">Nom (A-Z)</option>
            <option value="name-desc">Nom (Z-A)</option>
            <option value="createdAt-desc">Date de création (récent)</option>
            <option value="createdAt-asc">Date de création (ancien)</option>
          </Form.Select>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">Aucun utilisateur ne correspond à vos critères de recherche.</p>
          <Button 
            variant="outline-primary" 
            onClick={resetFilters}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      ) : (
        <UserList 
          users={filteredUsers} 
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onView={handleViewUser}
        />
      )}

      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        size="xl"
        dialogClassName="modal-90w"
        aria-labelledby="user-form-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? 'Modifier un utilisateur' : 'Ajouter un utilisateur'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <UserForm 
            user={editingUser}
            onSubmit={handleSubmit}
            onCancel={() => setShowModal(false)}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Users;
