import React, { useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Table,
  Badge,
  Modal
} from 'react-bootstrap';
import { 
  CalendarDate, 
  Clock,
  Person,
  Telephone,
  Envelope,
  Plus,
  Search,
  Funnel,
  XCircle
} from 'react-bootstrap-icons';

const RendezVous = () => {
  const [showForm, setShowForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'tous',
    medecin: 'tous',
    date: ''
  });

  // Données de démonstration
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      patient: 'M. Amadou Ndiaye',
      medecin: 'Dr. Marie Diop',
      date: '2025-08-07',
      heure: '10:30',
      motif: 'Consultation de suivi',
      status: 'confirmé',
      telephone: '+221 77 123 45 67',
      email: 'a.ndiaye@email.com'
    },
    {
      id: 2,
      patient: 'Mme Aissatou Diop',
      medecin: 'Dr. Jean Ndiaye',
      date: '2025-08-07',
      heure: '14:15',
      motif: 'Première consultation',
      status: 'en_attente',
      telephone: '+221 77 234 56 78',
      email: 'a.diop@email.com'
    }
  ]);

  const [formData, setFormData] = useState({
    patient: '',
    telephone: '',
    email: '',
    medecin: '',
    date: '',
    heure: '',
    motif: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newAppointment = {
      id: appointments.length + 1,
      ...formData,
      status: 'en_attente'
    };
    setAppointments([...appointments, newAppointment]);
    setShowForm(false);
    // Réinitialiser le formulaire
    setFormData({
      patient: '',
      telephone: '',
      email: '',
      medecin: '',
      date: '',
      heure: '',
      motif: ''
    });
  };

  const filteredAppointments = appointments.filter(appt => {
    const matchesSearch = appt.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appt.medecin.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilters = 
      (filters.status === 'tous' || appt.status === filters.status) &&
      (filters.medecin === 'tous' || appt.medecin === filters.medecin) &&
      (!filters.date || appt.date === filters.date);
    
    return matchesSearch && matchesFilters;
  });

  // Fonction pour confirmer un rendez-vous
  const confirmAppointment = (id) => {
    setAppointments(appointments.map(appt => 
      appt.id === id ? { ...appt, status: 'confirmé' } : appt
    ));
  };

  // Fonction pour annuler un rendez-vous
  const cancelAppointment = (id) => {
    setAppointments(appointments.map(appt => 
      appt.id === id ? { ...appt, status: 'annulé' } : appt
    ));
  };

  // Fonction pour marquer un rendez-vous comme terminé
  const completeAppointment = (id) => {
    setAppointments(appointments.map(appt => 
      appt.id === id ? { ...appt, status: 'terminé' } : appt
    ));
  };

  // Fonction pour ouvrir la modale de détails
  const openAppointmentDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'confirmé':
        return <Badge bg="success">Confirmé</Badge>;
      case 'annulé':
        return <Badge bg="danger">Annulé</Badge>;
      case 'en_attente':
        return <Badge bg="warning" text="dark">En attente</Badge>;
      case 'terminé':
        return <Badge bg="info">Terminé</Badge>;
      default:
        return <Badge bg="secondary">Inconnu</Badge>;
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestion des Rendez-vous</h2>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus className="me-2" />
          Nouveau Rendez-vous
        </Button>
      </div>

      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <h5 className="mb-0">Liste des Rendez-vous</h5>
          </div>
          <div className="d-flex
          ">
            <div className="input-group me-2" style={{ width: '250px' }}>
              <span className="input-group-text">
                <Search />
              </span>
              <Form.Control
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline-secondary">
              <Funnel className="me-1" />
              Filtres
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Table hover responsive>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Médecin</th>
                <th>Date</th>
                <th>Heure</th>
                <th>Motif</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map(appt => (
                <tr key={appt.id}>
                  <td>
                    <div className="fw-bold">{appt.patient}</div>
                    <small className="text-muted">
                      <Telephone size={12} className="me-1" />
                      {appt.telephone}
                    </small>
                  </td>
                  <td>{appt.medecin}</td>
                  <td>{new Date(appt.date).toLocaleDateString('fr-FR')}</td>
                  <td>{appt.heure}</td>
                  <td>
                    <div className="text-truncate" style={{ maxWidth: '200px' }} title={appt.motif}>
                      {appt.motif}
                    </div>
                  </td>
                  <td>{getStatusBadge(appt.status)}</td>
                  <td className="text-nowrap">
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="me-1 mb-1"
                      onClick={() => openAppointmentDetails(appt)}
                    >
                      Détails
                    </Button>
                    {appt.status === 'en_attente' && (
                      <Button 
                        variant="outline-success" 
                        size="sm" 
                        className="me-1 mb-1"
                        onClick={() => confirmAppointment(appt.id)}
                        title="Confirmer le RDV"
                      >
                        Confirmer
                      </Button>
                    )}
                    {appt.status === 'confirmé' && (
                      <Button 
                        variant="outline-info" 
                        size="sm" 
                        className="me-1 mb-1"
                        onClick={() => completeAppointment(appt.id)}
                        title="Marquer comme terminé"
                      >
                        Terminer
                      </Button>
                    )}
                    {appt.status !== 'annulé' && (
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        className="mb-1"
                        onClick={() => cancelAppointment(appt.id)}
                        title="Annuler le RDV"
                      >
                        <XCircle size={16} />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal de création de rendez-vous */}
      <Modal show={showForm} onHide={() => setShowForm(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Nouveau Rendez-vous</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <h5 className="mb-3">Informations du Patient</h5>
                <Form.Group className="mb-3">
                  <Form.Label>Nom complet</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <Person />
                    </span>
                    <Form.Control 
                      type="text" 
                      name="patient"
                      value={formData.patient}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Téléphone</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <Telephone />
                    </span>
                    <Form.Control 
                      type="tel" 
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <Envelope />
                    </span>
                    <Form.Control 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <h5 className="mb-3">Détails du Rendez-vous</h5>
                <Form.Group className="mb-3">
                  <Form.Label>Médecin</Form.Label>
                  <Form.Select 
                    name="medecin"
                    value={formData.medecin}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Sélectionner un médecin</option>
                    <option value="Dr. Marie Diop">Dr. Marie Diop (Cardiologie)</option>
                    <option value="Dr. Jean Ndiaye">Dr. Jean Ndiaye (Pédiatrie)</option>
                  </Form.Select>
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <CalendarDate />
                        </span>
                        <Form.Control 
                          type="date" 
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split('T')[0]}
                          required 
                        />
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Heure</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <Clock />
                        </span>
                        <Form.Control 
                          type="time" 
                          name="heure"
                          value={formData.heure}
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Motif de la consultation</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3}
                    name="motif"
                    value={formData.motif}
                    onChange={handleInputChange}
                    required 
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              Enregistrer le rendez-vous
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de détails du rendez-vous */}
      <Modal 
        show={showDetailsModal} 
        onHide={() => setShowDetailsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Détails du Rendez-vous</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAppointment && (
            <div className="row">
              <div className="col-md-6">
                <h5>Informations du Patient</h5>
                <p className="mb-2">
                  <strong>Nom complet :</strong> {selectedAppointment.patient}
                </p>
                <p className="mb-2">
                  <strong>Téléphone :</strong> {selectedAppointment.telephone}
                </p>
                <p className="mb-3">
                  <strong>Email :</strong> {selectedAppointment.email}
                </p>
              </div>
              <div className="col-md-6">
                <h5>Détails du Rendez-vous</h5>
                <p className="mb-2">
                  <strong>Médecin :</strong> {selectedAppointment.medecin}
                </p>
                <p className="mb-2">
                  <strong>Date :</strong> {new Date(selectedAppointment.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="mb-2">
                  <strong>Heure :</strong> {selectedAppointment.heure}
                </p>
                <p className="mb-2">
                  <strong>Statut :</strong> {getStatusBadge(selectedAppointment.status)}
                </p>
              </div>
              <div className="col-12 mt-3">
                <h5>Motif de la consultation</h5>
                <p className="mb-0">{selectedAppointment.motif}</p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Fermer
          </Button>
          {selectedAppointment?.status === 'en_attente' && (
            <Button 
              variant="success" 
              onClick={() => {
                confirmAppointment(selectedAppointment.id);
                setShowDetailsModal(false);
              }}
            >
              Confirmer le RDV
            </Button>
          )}
          {selectedAppointment?.status === 'confirmé' && (
            <Button 
              variant="info" 
              onClick={() => {
                completeAppointment(selectedAppointment.id);
                setShowDetailsModal(false);
              }}
            >
              Marquer comme terminé
            </Button>
          )}
          {selectedAppointment?.status !== 'annulé' && (
            <Button 
              variant="danger" 
              onClick={() => {
                cancelAppointment(selectedAppointment.id);
                setShowDetailsModal(false);
              }}
            >
              Annuler le RDV
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default RendezVous;
