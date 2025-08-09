import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Table, 
  Badge, 
  Button, 
  Form, 
  Tabs,
  Tab,
  Spinner,
  Alert
} from 'react-bootstrap';
import { 
  PeopleFill, 
  CalendarCheck, 
  PlusCircle,
  Pencil,
  Trash,
  Search,
  ExclamationTriangle
} from 'react-bootstrap-icons';
import { userApi, rendezVousApi } from '../../services/api';
import { useSelector } from 'react-redux';
import UserFormModal from '../users/UserFormModal';

const AdminDashboard = () => {
  const { user: authUser } = useSelector(state => state.auth);
  const [stats, setStats] = useState({
    totalUsers: 0,
    doctorCount: 0,
    nurseCount: 0,
    presentToday: 0,
    upcomingAppointments: 0,
    completedAppointments: 0
  });
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Récupérer les utilisateurs
  const fetchUsers = async () => {
    try {
      console.log('Début de la récupération des utilisateurs...');
      setIsLoading(true);
      
      // Vérifier le token dans le localStorage
      const token = localStorage.getItem('token');
      console.log('Token présent dans le localStorage:', !!token);
      
      // Afficher les en-têtes de la requête
      console.log('En-têtes de la requête:', {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : 'Non défini'
      });
      
      const response = await userApi.getAll();
      console.log('Réponse de userApi.getAll():', response);
      
      const userData = response && response.success ? response.data : [];
      console.log('Données utilisateurs extraites:', userData);
      
      setUsers(userData);
      
      // Mettre à jour les statistiques
      setStats(prev => ({
        ...prev,
        totalUsers: userData.length,
        doctorCount: userData.filter(u => u.role === 'medecin').length,
        nurseCount: userData.filter(u => u.role === 'infirmier').length,
        presentToday: userData.filter(u => u.actif).length
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      setError('Impossible de charger les utilisateurs');
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer les rendez-vous
  const fetchAppointments = async () => {
    try {
      const response = await rendezVousApi.getAll();
      const appointmentsData = response.success ? response.data : [];
      
      setAppointments(appointmentsData);
      
      // Mettre à jour les statistiques
      const today = new Date().toISOString().split('T')[0];
      const upcoming = appointmentsData.filter(a => new Date(a.date) >= new Date(today));
      const completed = appointmentsData.filter(a => new Date(a.date) < new Date(today));
      
      setStats(prev => ({
        ...prev,
        upcomingAppointments: upcoming.length,
        completedAppointments: completed.length
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des rendez-vous:', error);
      setError('Impossible de charger les rendez-vous');
    }
  };

  // Gérer l'ajout d'un nouvel utilisateur
  const handleAddUser = () => {
    setEditingUser(null);
    setShowUserModal(true);
  };

  // Gérer l'édition d'un utilisateur
  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  // Gérer la suppression d'un utilisateur
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        setIsSubmitting(true);
        const response = await userApi.delete(userId);
        if (response.success) {
          await fetchUsers(); // Recharger la liste des utilisateurs
        } else {
          setError(response.message || 'Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        setError('Erreur lors de la suppression');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Gérer la soumission du formulaire utilisateur
  const handleUserSubmit = async (userData) => {
    try {
      setIsSubmitting(true);
      let response;
      
      if (editingUser) {
        // Mise à jour d'un utilisateur existant
        response = await userApi.update(editingUser._id, userData);
      } else {
        // Création d'un nouvel utilisateur
        response = await userApi.create(userData);
      }

      if (response.success) {
        setShowUserModal(false);
        await fetchUsers(); // Recharger la liste des utilisateurs
      } else {
        setError(response.message || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Obtenir le badge pour le rôle
  const getRoleBadge = (role) => {
    const roles = {
      admin: { label: 'Admin', variant: 'danger' },
      medecin: { label: 'Médecin', variant: 'primary' },
      infirmier: { label: 'Infirmier', variant: 'info' },
      secretaire: { label: 'Secrétaire', variant: 'warning' },
      patient: { label: 'Patient', variant: 'secondary' }
    };
    const roleInfo = roles[role] || { label: role, variant: 'light' };
    return <Badge bg={roleInfo.variant}>{roleInfo.label}</Badge>;
  };

  // Obtenir le badge pour le statut
  const getStatusBadge = (status) => {
    const statuses = {
      actif: { label: 'Actif', variant: 'success' },
      inactif: { label: 'Inactif', variant: 'secondary' },
      en_conges: { label: 'En congés', variant: 'warning' }
    };
    const statusInfo = statuses[status] || { label: status, variant: 'light' };
    return <Badge bg={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  // Mettre à jour les statistiques
  const updateStats = () => {
    const doctorCount = users.filter(u => u.role === 'medecin').length;
    const nurseCount = users.filter(u => u.role === 'infirmier').length;
    const today = new Date().toISOString().split('T')[0];
    const presentToday = users.filter(u => 
      u.derniereConnexion && 
      new Date(u.derniereConnexion).toISOString().split('T')[0] === today
    ).length;

    setStats({
      ...stats,
      totalUsers: users.length,
      doctorCount,
      nurseCount,
      presentToday,
      upcomingAppointments: appointments.filter(a => new Date(a.dateHeureDebut) > new Date()).length,
      completedAppointments: appointments.filter(a => new Date(a.dateHeureFin) < new Date()).length
    });
  };

  // Charger les données au montage du composant
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        await Promise.all([
          fetchUsers(),
          fetchAppointments()
        ]);
        updateStats();
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError('Une erreur est survenue lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Filtrer les utilisateurs par recherche et rôle
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesRole = !roleFilter || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });
  
  const statsData = [
    { title: 'Total Utilisateurs', value: stats.totalUsers, icon: <PeopleFill />, variant: 'primary' },
    { title: 'Médecins', value: stats.doctorCount, icon: <PeopleFill />, variant: 'info' },
    { title: 'Infirmiers', value: stats.nurseCount, icon: <PeopleFill />, variant: 'success' },
    { title: 'Présents Aujourd\'hui', value: stats.presentToday, icon: <CalendarCheck />, variant: 'warning' },
    { title: 'Rendez-vous à venir', value: stats.upcomingAppointments, icon: <CalendarCheck />, variant: 'info' },
    { title: 'Rendez-vous terminés', value: stats.completedAppointments, icon: <CalendarCheck />, variant: 'success' },
  ];



  return (
    <div className="admin-dashboard">
      <h4 className="mb-4">Tableau de bord Administrateur</h4>
      
      {error && (
        <Alert variant="danger" className="d-flex align-items-center">
          <ExclamationTriangle className="me-2" />
          {error}
        </Alert>
      )}
      
      {/* Cartes de statistiques */}
      <Row className="mb-4">
        {statsData.map((stat, index) => (
          <Col key={index} md={4} className="mb-3">
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1">{stat.title}</h6>
                    <h3 className="mb-0">{stat.value}</h3>
                  </div>
                  <div className={`bg-${stat.variant} bg-opacity-10 p-3 rounded`}>
                    {React.cloneElement(stat.icon, { className: `text-${stat.variant}`, size: 24 })}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      
      {/* Onglets */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3"
      >
        <Tab eventKey="users" title="Utilisateurs">
          <Card>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Liste des Utilisateurs</h5>
              <Button 
                variant="primary" 
                size="sm"
                onClick={handleAddUser}
                disabled={isLoading || isSubmitting}
              >
                <PlusCircle className="me-1" /> Ajouter un utilisateur
              </Button>
            </div>
            <Card.Body className="p-0">
              <div className="p-3 border-bottom">
                <Row className="g-2">
                  <Col md={8}>
                    <div className="input-group">
                      <span className="input-group-text">
                        <Search size={16} />
                      </span>
                      <Form.Control
                        type="text"
                        placeholder="Rechercher un utilisateur..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </Col>
                  <Col md={4}>
                    <Form.Select 
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value || '')}
                    >
                      <option value="">Tous les rôles</option>
                      <option value="admin">Administrateur</option>
                      <option value="medecin">Médecin</option>
                      <option value="infirmier">Infirmier</option>
                      <option value="secretaire">Secrétaire</option>
                      <option value="patient">Patient</option>
                    </Form.Select>
                  </Col>
                </Row>
              </div>
              
              {isLoading ? (
                <div className="text-center my-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Chargement des utilisateurs...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Rôle</th>
                        <th>Statut</th>
                        <th>Dernière connexion</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <tr key={user._id}>
                            <td>{user.prenom} {user.nom}</td>
                            <td>{user.email}</td>
                            <td>{getRoleBadge(user.role)}</td>
                            <td>{getStatusBadge(user.actif ? 'actif' : 'inactif')}</td>
                            <td>
                              {user.derniereConnexion 
                                ? new Date(user.derniereConnexion).toLocaleString()
                                : 'Jamais'}
                            </td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-1"
                                onClick={() => handleEditUser(user)}
                                disabled={isSubmitting}
                              >
                                <Pencil size={16} />
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleDeleteUser(user._id)}
                                disabled={user._id === authUser?._id || isSubmitting}
                              >
                                <Trash size={16} />
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-4">
                            Aucun utilisateur trouvé
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="appointments" title="Rendez-vous">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Liste des Rendez-vous</h5>
            </Card.Header>
            <Card.Body>
              {isLoading ? (
                <div className="text-center my-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Chargement des rendez-vous...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Patient</th>
                        <th>Médecin</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.length > 0 ? (
                        appointments.map((appointment) => (
                          <tr key={appointment._id}>
                            <td>{new Date(appointment.dateHeureDebut).toLocaleString()}</td>
                            <td>{appointment.patientId?.prenom} {appointment.patientId?.nom}</td>
                            <td>{appointment.medecinId?.prenom} {appointment.medecinId?.nom}</td>
                            <td>
                              <Badge bg={appointment.statut === 'confirme' ? 'success' : 'warning'}>
                                {appointment.statut === 'confirme' ? 'Confirmé' : 'En attente'}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-4">
                            Aucun rendez-vous trouvé
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
      
      {/* Modal d'ajout/édition d'utilisateur */}
      <UserFormModal
        show={showUserModal}
        onHide={() => setShowUserModal(false)}
        onSubmit={handleUserSubmit}
        user={editingUser}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default AdminDashboard;
