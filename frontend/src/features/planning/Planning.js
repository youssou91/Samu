import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Table, 
  Form,
  Badge,
  ButtonGroup,
  Modal,
  Alert
} from 'react-bootstrap';
import { 
  CalendarDate, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  CalendarWeek,
  CalendarMonth,
  Calendar3,
  Clock,
  Person,
  Type,
  CardText,
  X
} from 'react-bootstrap-icons';

import { planningApi } from '../../services/planningApi';
const Planning = () => {
  const { user: currentUser } = useSelector(state => state.auth);
  const userRole = currentUser?.role || 'patient';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week'); // 'day', 'week', 'month'
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
    type: 'consultation',
    personnel: '',
    patient: '',
    description: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // État pour les événements du planning
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
const [formErrors, setFormErrors] = useState({});
const [filterType, setFilterType] = useState('');
const [filterPersonnel, setFilterPersonnel] = useState('');

  // Charger les événements depuis l'API au montage
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await planningApi.getAll();
        setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Erreur lors du chargement du planning.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric' 
    });
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const renderEvents = () => {
    // Application des filtres simples
    let filtered = events;
    if (filterType) {
      filtered = filtered.filter(ev => ev.type === filterType);
    }
    if (filterPersonnel) {
      filtered = filtered.filter(ev => ev.personnel === filterPersonnel);
    }
    return filtered.map(event => (
      <div key={event._id || event.id} className="mb-2 p-2 border rounded bg-light">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <strong>{event.title}</strong>
            <Badge bg={event.status === 'confirmé' ? 'success' : 'warning'} className="ms-2">
              {event.status}
            </Badge>
          </div>
          <div>
            {(userRole === 'admin' || userRole === 'medecin') && (
              <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEditEvent(event)}>
                Modifier
              </Button>
            )}
            {userRole === 'admin' && (
              <Button variant="outline-danger" size="sm" onClick={() => handleDeleteEvent(event._id || event.id)}>
                Supprimer
              </Button>
            )}
          </div>
        </div>
        <div className="text-muted small">
          {new Date(event.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - 
          {new Date(event.end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </div>
        {event.patient && <div>Patient: {event.patient}</div>}
        <div>Médecin: {event.personnel}</div>
      </div>
    ));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFormErrors({});
    // Validation frontend
    const errors = {};
    if (!newEvent.title || newEvent.title.trim().length < 3) {
      errors.title = "Le titre est obligatoire (3 caractères minimum)";
    }
    if (!newEvent.start || isNaN(Date.parse(newEvent.start))) {
      errors.start = "La date de début est obligatoire et doit être valide";
    }
    if (!newEvent.end || isNaN(Date.parse(newEvent.end))) {
      errors.end = "La date de fin est obligatoire et doit être valide";
    }
    if (newEvent.start && newEvent.end && !isNaN(Date.parse(newEvent.start)) && !isNaN(Date.parse(newEvent.end))) {
      if (Date.parse(newEvent.start) >= Date.parse(newEvent.end)) {
        errors.end = "La date de fin doit être postérieure à la date de début";
      }
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    if (isEditing && editingId) {
      // Modification
      try {
        const updated = await planningApi.update(editingId, newEvent);
        setEvents(events.map(ev => (ev._id || ev.id) === editingId ? updated : ev));
        setSuccess('Événement modifié avec succès.');
        setShowEventModal(false);
        setNewEvent({
          title: '',
          start: '',
          end: '',
          type: 'consultation',
          personnel: '',
          patient: '',
          description: ''
        });
        setIsEditing(false);
        setEditingId(null);
      } catch (err) {
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setError("Action interdite : vous n'avez pas les droits nécessaires.");
        } else {
          setError("Erreur lors de la modification de l'événement.");
        }
      }
    } else {
      // Création
      try {
        const created = await planningApi.create(newEvent);
        setEvents([...events, created]);
        setSuccess('Événement ajouté avec succès.');
        setShowEventModal(false);
        setNewEvent({
          title: '',
          start: '',
          end: '',
          type: 'consultation',
          personnel: '',
          patient: '',
          description: ''
        });
      } catch (err) {
        setError("Erreur lors de l'ajout de l'événement.");
      }
    }
  };

  // Ouvre la modale en mode édition
  const handleEditEvent = (event) => {
    setNewEvent({
      title: event.title || '',
      start: event.start || '',
      end: event.end || '',
      type: event.type || 'consultation',
      personnel: event.personnel || '',
      patient: event.patient || '',
      description: event.description || ''
    });
    setIsEditing(true);
    setEditingId(event._id || event.id);
    setShowEventModal(true);
  };


  const handleDeleteEvent = async (id) => {
    setError(null);
    setSuccess(null);
    try {
      await planningApi.delete(id);
      setEvents(events.filter(ev => (ev._id || ev.id) !== id));
      setSuccess('Événement supprimé avec succès.');
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError("Action interdite : vous n'avez pas les droits nécessaires.");
      } else {
        setError('Erreur lors de la suppression de l\'événement.');
      }
    }
  };

  // (Ajoute ici une fonction handleUpdateEvent si tu veux gérer la modification)

  return (
    <Container fluid className="py-4">
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Planning</h2>
          <div className="text-muted small">Rôle : <strong>{userRole}</strong></div>
        </div>
        {(userRole === 'admin' || userRole === 'medecin') && (
          <Button variant="primary" onClick={() => setShowEventModal(true)}>
            <Plus className="me-2" />
            Nouvel Événement
          </Button>
        )}
      </div>
      {/* Filtres simples */}
      <div className="mb-3 d-flex gap-3">
        <Form.Group>
          <Form.Label>Type d'événement</Form.Label>
          <Form.Select value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Tous</option>
            <option value="consultation">Consultation</option>
            <option value="reunion">Réunion</option>
            <option value="garde">Garde</option>
            <option value="autre">Autre</option>
          </Form.Select>
        </Form.Group>
        <Form.Group>
          <Form.Label>Personnel</Form.Label>
          <Form.Select value={filterPersonnel} onChange={e => setFilterPersonnel(e.target.value)}>
            <option value="">Tout</option>
            <option value="Dr. Marie Diop">Dr. Marie Diop</option>
            <option value="Dr. Jean Ndiaye">Dr. Jean Ndiaye</option>
            <option value="Inf. Awa Fall">Inf. Awa Fall</option>
            <option value="Tous les médecins">Tous les médecins</option>
            <option value="Tout le personnel">Tout le personnel</option>
          </Form.Select>
        </Form.Group>
      </div>

      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <Button variant="outline-secondary" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft />
            </Button>
            <span className="mx-3">
              {formatDate(currentDate)}
            </span>
            <Button variant="outline-secondary" size="sm" onClick={() => navigateDate('next')}>
              <ChevronRight />
            </Button>
          </div>
          <ButtonGroup size="sm">
            <Button 
              variant={view === 'day' ? 'primary' : 'outline-secondary'}
              onClick={() => setView('day')}
            >
              <CalendarDate className="me-1" /> Jour
            </Button>
            <Button 
              variant={view === 'week' ? 'primary' : 'outline-secondary'}
              onClick={() => setView('week')}
            >
              <CalendarWeek className="me-1" /> Semaine
            </Button>
            <Button 
              variant={view === 'month' ? 'primary' : 'outline-secondary'}
              onClick={() => setView('month')}
            >
              <CalendarMonth className="me-1" /> Mois
            </Button>
          </ButtonGroup>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={view === 'month' ? 12 : 8}>
              <div className="bg-white p-3 rounded border">
                {view === 'day' && (
                  <div>
                    <h5>Événements du {formatDate(currentDate)}</h5>
                    {renderEvents()}
                  </div>
                )}
                {view === 'week' && (
                  <div>
                    <h5>Semaine du {formatDate(currentDate)}</h5>
                    <Table bordered hover>
                      <thead>
                        <tr>
                          {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(day => (
                            <th key={day}>{day}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {Array(6).fill().map((_, i) => (
                            <td key={i} style={{ height: '150px', verticalAlign: 'top' }}>
                              {/* Événements du jour */}
                              {i === 0 && renderEvents()}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                )}
                {view === 'month' && (
                  <div>
                    <h5>Mois de {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h5>
                    <Table bordered hover>
                      <thead>
                        <tr>
                          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                            <th key={day}>{day}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4, 5, 6].map(week => (
                          <tr key={week}>
                            {[1, 2, 3, 4, 5, 6, 0].map(day => (
                              <td key={day} style={{ height: '100px', verticalAlign: 'top' }}>
                                {day * week}
                                {day * week === 6 && (
                                  <div className="small text-muted">
                                    <div>Dr. Diop (3)</div>
                                    <div>Inf. Fall (2)</div>
                                  </div>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            </Col>
            
            {view !== 'month' && (
              <Col md={4}>
                <Card>
                  <Card.Header>Filtres</Card.Header>
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Personnel</Form.Label>
                        <Form.Select>
                          <option>Tout le personnel</option>
                          <option>Dr. Marie Diop</option>
                          <option>Dr. Jean Ndiaye</option>
                          <option>Inf. Awa Fall</option>
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Type d'événement</Form.Label>
                        <Form.Select>
                          <option>Tous les types</option>
                          <option>Consultation</option>
                          <option>Réunion</option>
                          <option>Garde</option>
                        </Form.Select>
                      </Form.Group>
                      <Button variant="primary" className="w-100">
                        Appliquer les filtres
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>

      {/* Modal pour ajouter un nouvel événement */}
      <Modal show={showEventModal} onHide={() => setShowEventModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Nouvel Événement</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitEvent}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Titre de l'événement</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <Type />
                    </span>
                    <Form.Control 
                      type="text" 
                      name="title"
                      value={newEvent.title}
                      onChange={handleInputChange}
                      isInvalid={!!formErrors.title}
                      required 
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.title}
                    </Form.Control.Feedback>
                  </div>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Type d'événement</Form.Label>
                  <Form.Select 
                    name="type"
                    value={newEvent.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="consultation">Consultation</option>
                    <option value="reunion">Réunion</option>
                    <option value="garde">Garde</option>
                    <option value="autre">Autre</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Personnel concerné</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <Person />
                    </span>
                    <Form.Select 
                      name="personnel"
                      value={newEvent.personnel}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Sélectionner un membre du personnel</option>
                      <option value="Dr. Marie Diop">Dr. Marie Diop</option>
                      <option value="Dr. Jean Ndiaye">Dr. Jean Ndiaye</option>
                      <option value="Inf. Awa Fall">Inf. Awa Fall</option>
                      <option value="Tous les médecins">Tous les médecins</option>
                      <option value="Tout le personnel">Tout le personnel</option>
                    </Form.Select>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Patient (si applicable)</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="patient"
                    value={newEvent.patient}
                    onChange={handleInputChange}
                    placeholder="Nom du patient"
                  />
                </Form.Group>

                <Row>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Date de début</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <Clock />
                        </span>
                        <Form.Control 
                          type="datetime-local" 
                          name="start"
                          value={newEvent.start}
                          onChange={handleInputChange}
                          isInvalid={!!formErrors.start}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {formErrors.start}
                        </Form.Control.Feedback>
                      </div>
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Date de fin</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <Clock />
                        </span>
                        <Form.Control 
                          type="datetime-local" 
                          name="end"
                          value={newEvent.end}
                          onChange={handleInputChange}
                          isInvalid={!!formErrors.end}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {formErrors.end}
                        </Form.Control.Feedback>
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <CardText />
                    </span>
                    <Form.Control 
                      as="textarea" 
                      rows={3}
                      name="description"
                      value={newEvent.description}
                      onChange={handleInputChange}
                      placeholder="Détails supplémentaires sur l'événement..."
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEventModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              Enregistrer l'événement
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default Planning;
