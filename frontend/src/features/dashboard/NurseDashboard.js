import React, { useState } from 'react';
import { Card, Row, Col, ListGroup, Badge, Button, ProgressBar, Form } from 'react-bootstrap';
import { 
  Clipboard2Pulse, 
  PeopleFill, 
  ClockHistory,
  CheckCircle,
  ExclamationTriangle,
  PlusCircle
} from 'react-bootstrap-icons';

const NurseDashboard = ({ user, stats }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Données de démonstration pour les tâches
  const tasks = [
    { id: 1, patient: 'M. Amadou Ndiaye', room: 'Ch. 102', task: 'Prise de tension', status: 'à faire', priority: 'haute' },
    { id: 2, patient: 'Mme Aissatou Diop', room: 'Ch. 105', task: 'Prise de sang', status: 'en cours', priority: 'moyenne' },
    { id: 3, patient: 'M. Ibrahima Fall', room: 'Ch. 108', task: 'Médicaments', status: 'terminé', priority: 'basse' },
  ];
  
  // Filtrer les tâches en fonction de la recherche et des filtres
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchTerm === '' || 
      task.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.room.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    const matchesStatus = !statusFilter || task.status === statusFilter;
    
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const getPriorityVariant = (priority) => {
    switch(priority) {
      case 'haute': return 'danger';
      case 'moyenne': return 'warning';
      case 'basse': 
      default: return 'info';
    }
  };

  return (
    <div className="nurse-dashboard">
      <h4 className="mb-4">Tableau de bord - {user?.name || 'Infirmière'}</h4>
      
      {/* Cartes de statistiques */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Patients sous ma charge</h6>
                  <h3 className="mb-0">{stats?.myPatients || 8}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <PeopleFill size={24} className="text-primary" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Tâches en attente</h6>
                  <h3 className="mb-0">{stats?.pendingTasks || 5}</h3>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <ClockHistory size={24} className="text-warning" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Tâches urgentes</h6>
                  <h3 className="mb-0">{stats?.urgentTasks || 2}</h3>
                </div>
                <div className="bg-danger bg-opacity-10 p-3 rounded">
                  <ExclamationTriangle size={24} className="text-danger" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Tâches terminées</h6>
                  <h3 className="mb-0">{stats?.completedTasks || 12}</h3>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <CheckCircle size={24} className="text-success" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        {/* Liste des tâches */}
        <Col lg={8} className="mb-4">
          <Card className="h-100">
            <Card.Header>
              <Row className="align-items-center">
                <Col md={4}>
                  <h5 className="mb-0">Mes tâches du jour</h5>
                </Col>
                <Col md={3} className="mb-2 mb-md-0">
                  <Form.Control 
                    type="text" 
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Col>
                <Col md={2} className="mb-2 mb-md-0">
                  <Form.Select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="">Toutes priorités</option>
                    <option value="haute">Haute</option>
                    <option value="moyenne">Moyenne</option>
                    <option value="basse">Basse</option>
                  </Form.Select>
                </Col>
                <Col md={2} className="mb-2 mb-md-0">
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Tous statuts</option>
                    <option value="à faire">À faire</option>
                    <option value="en cours">En cours</option>
                    <option value="terminé">Terminé</option>
                  </Form.Select>
                </Col>
                <Col md={1} className="text-end">
                  <Button variant="primary" size="sm">
                    <PlusCircle className="me-1" />
                  </Button>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Patient</th>
                      <th>Chambre</th>
                      <th>Tâche</th>
                      <th>Priorité</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.length > 0 ? (
                      filteredTasks.map(task => (
                      <tr key={task.id}>
                        <td>{task.patient}</td>
                        <td>{task.room}</td>
                        <td>{task.task}</td>
                        <td>
                          <Badge bg={getPriorityVariant(task.priority)}>
                            {task.priority}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={task.status === 'terminé' ? 'success' : 
                                    task.status === 'en cours' ? 'primary' : 'secondary'}>
                            {task.status}
                          </Badge>
                        </td>
                        <td>
                          <Button variant="outline-primary" size="sm" className="me-1">
                            Détails
                          </Button>
                        </td>
                      </tr>
                    ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center text-muted py-3">
                          Aucune tâche trouvée
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Statistiques des tâches */}
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Progression des tâches</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>À faire</span>
                  <span>30%</span>
                </div>
                <ProgressBar now={30} variant="secondary" />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>En cours</span>
                  <span>45%</span>
                </div>
                <ProgressBar now={45} variant="primary" />
              </div>
              <div>
                <div className="d-flex justify-content-between mb-1">
                  <span>Terminé</span>
                  <span>25%</span>
                </div>
                <ProgressBar now={25} variant="success" />
              </div>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <h5 className="mb-0">Alertes et notifications</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex align-items-center">
                  <div className="flex-shrink-0 me-3">
                    <div className="bg-danger bg-opacity-10 p-2 rounded-circle">
                      <ExclamationTriangle className="text-danger" />
                    </div>
                  </div>
                  <div>
                    <div className="fw-bold">Pression artérielle élevée</div>
                    <small className="text-muted">M. Ndiaye, Ch. 102 - Il y a 15 min</small>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex align-items-center">
                  <div className="flex-shrink-0 me-3">
                    <div className="bg-warning bg-opacity-10 p-2 rounded-circle">
                      <Clipboard2Pulse className="text-warning" />
                    </div>
                  </div>
                  <div>
                    <div className="fw-bold">Médicaments en retard</div>
                    <small className="text-muted">Mme Diop, Ch. 105 - Il y a 30 min</small>
                  </div>
                </ListGroup.Item>
              </ListGroup>
              <Button variant="outline-secondary" size="sm" className="mt-3 w-100">
                Voir toutes les alertes
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default NurseDashboard;
