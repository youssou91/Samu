import React, { useState, useEffect } from 'react';
import { Card, Row, Col, ListGroup, Badge, Button, Form, Modal, Container } from 'react-bootstrap';
import { 
  Calendar3, 
  PersonCheck, 
  ClockHistory,
  PlusCircle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar2Check,
  Calendar2X,
  PersonLinesFill,
  Telephone,
  Envelope,
  GeoAlt,
  InfoCircle,
  Check2,
  X,
  ClockFill,
  CalendarCheckFill,
  CalendarXFill,
  PersonVcard,
  TelephoneFill,
  GeoAltFill
} from 'react-bootstrap-icons';
import { format, parseISO, isToday, isTomorrow, isAfter, addDays } from 'date-fns';
import fr from 'date-fns/locale/fr';

const DoctorDashboard = ({ user, stats }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date());
  
  // Données de démonstration pour les rendez-vous à venir
  const [upcomingAppointments, setUpcomingAppointments] = useState([
    { 
      id: 1, 
      patient: 'M. Amadou Ndiaye', 
      patientId: 'PAT001',
      time: '10:30', 
      date: new Date(new Date().setHours(10, 30, 0, 0)),
      duration: 30,
      type: 'Consultation', 
      status: 'confirmé',
      notes: 'Patient à surveiller pour hypertension',
      contact: '77 123 45 67',
      email: 'a.ndiaye@email.com',
      address: '123 Rue des Manguiers, Dakar'
    },
    { 
      id: 2, 
      patient: 'Mme Aissatou Diop', 
      patientId: 'PAT002',
      time: '14:15', 
      date: new Date(new Date().setHours(14, 15, 0, 0)),
      duration: 45,
      type: 'Suivi', 
      status: 'confirmé',
      notes: 'Contrôle post-opératoire',
      contact: '76 234 56 78',
      email: 'a.diop@email.com',
      address: '456 Avenue Faidherbe, Dakar'
    },
    { 
      id: 3, 
      patient: 'M. Ibrahima Fall', 
      patientId: 'PAT003',
      time: '15:30', 
      date: new Date(new Date().setHours(15, 30, 0, 0)),
      duration: 30,
      type: 'Première visite', 
      status: 'en attente',
      notes: 'Nouveau patient - Douleurs abdominales',
      contact: '78 345 67 89',
      email: 'i.fall@email.com',
      address: '789 Boulevard du Général De Gaulle, Dakar'
    },
  ]);

  // Générer la semaine actuelle
  useEffect(() => {
    const today = new Date();
    const week = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(today, i);
      week.push(day);
    }
    setCurrentWeek(week);
  }, []);
  
  // Filtrer les rendez-vous en fonction de la recherche, des filtres et du jour sélectionné
  const filteredAppointments = upcomingAppointments.filter(appointment => {
    const matchesSearch = searchTerm === '' || 
      appointment.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || appointment.status === statusFilter;
    const matchesDate = isToday(appointment.date) || 
      (selectedDay && 
       appointment.date.getDate() === selectedDay.getDate() &&
       appointment.date.getMonth() === selectedDay.getMonth() &&
       appointment.date.getFullYear() === selectedDay.getFullYear());
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Confirmer un rendez-vous
  const confirmAppointment = (id) => {
    setUpcomingAppointments(upcomingAppointments.map(appt => 
      appt.id === id ? { ...appt, status: 'confirmé' } : appt
    ));
  };

  // Annuler un rendez-vous
  const cancelAppointment = (id) => {
    setUpcomingAppointments(upcomingAppointments.map(appt => 
      appt.id === id ? { ...appt, status: 'annulé' } : appt
    ));
  };

  // Ouvrir la modale de détails
  const openAppointmentDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  // Formater la date en français
  const formatDate = (date) => {
    return format(date, 'EEEE d MMMM yyyy', { locale: fr });
  };

  return (
    <div className="doctor-dashboard">
      <h4 className="mb-4">Tableau de bord - {user?.name || 'Médecin'}</h4>
      
      {/* Cartes de statistiques */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">RDV du jour</h6>
                  <h3 className="mb-0">
                    {upcomingAppointments.filter(a => isToday(a.date)).length}
                  </h3>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <Calendar3 size={24} className="text-primary" />
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
                  <h6 className="text-muted mb-1">RDV en attente</h6>
                  <h3 className="mb-0">
                    {upcomingAppointments.filter(a => a.status === 'en attente').length}
                  </h3>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <ClockFill size={24} className="text-warning" />
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
                  <h6 className="text-muted mb-1">RDV confirmés</h6>
                  <h3 className="mb-0">
                    {upcomingAppointments.filter(a => a.status === 'confirmé').length}
                  </h3>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <CalendarCheckFill size={24} className="text-success" />
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
                  <h6 className="text-muted mb-1">RDV annulés</h6>
                  <h3 className="mb-0">
                    {upcomingAppointments.filter(a => a.status === 'annulé').length}
                  </h3>
                </div>
                <div className="bg-danger bg-opacity-10 p-3 rounded">
                  <CalendarXFill size={24} className="text-danger" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Planning de la semaine */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Planning de la semaine</h5>
        </Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-between mb-3">
            {currentWeek.map((day, index) => {
              const dayAppointments = upcomingAppointments.filter(appt => 
                appt.date.getDate() === day.getDate() &&
                appt.date.getMonth() === day.getMonth() &&
                appt.date.getFullYear() === day.getFullYear()
              );
              
              return (
                <div 
                  key={index} 
                  className={`text-center p-2 rounded cursor-pointer ${selectedDay && day.getDate() === selectedDay.getDate() && day.getMonth() === selectedDay.getMonth() ? 'bg-primary text-white' : ''}`}
                  onClick={() => setSelectedDay(day)}
                  style={{ width: '14%', cursor: 'pointer' }}
                >
                  <div className="fw-bold">{format(day, 'EEE', { locale: fr })}</div>
                  <div className={`fs-5 fw-bold ${isToday(day) ? 'text-primary' : ''}`}>
                    {day.getDate()}
                  </div>
                  {dayAppointments.length > 0 && (
                    <div className="small">
                      <Badge bg={selectedDay && day.getDate() === selectedDay.getDate() ? 'light text-primary' : 'primary'}>
                        {dayAppointments.length} RDV
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-muted">
              {selectedDay && formatDate(selectedDay)}
            </div>
            <div>
              <Button variant="outline-secondary" size="sm" className="me-2">
                <Calendar3 className="me-1" /> Vue Semaine
              </Button>
              <Button variant="outline-primary" size="sm">
                <PlusCircle className="me-1" /> Nouveau RDV
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>
      
      <Row>
        {/* Prochains rendez-vous */}
        <Col lg={8} className="mb-4">
          <Card className="h-100">
            <Card.Header>
              <Row className="align-items-center">
                <Col md={6}>
                  <h5 className="mb-0">Prochains rendez-vous</h5>
                </Col>
                <Col md={4}>
                  <Form.Control 
                    type="text" 
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-2 mb-md-0"
                  />
                </Col>
                <Col md={2}>
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Tous</option>
                    <option value="confirmé">Confirmés</option>
                    <option value="en attente">En attente</option>
                  </Form.Select>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Heure</th>
                      <th>Patient</th>
                      <th>Type</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.length > 0 ? (
                      filteredAppointments.map(appointment => (
                      <tr key={appointment.id}>
                        <td className="text-nowrap">{appointment.time}</td>
                        <td>{appointment.patient}</td>
                        <td>{appointment.type}</td>
                        <td>
                          <Badge bg={appointment.status === 'confirmé' ? 'success' : 'warning'}>
                            {appointment.status}
                          </Badge>
                        </td>
                        <td className="text-nowrap">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-1"
                            onClick={() => openAppointmentDetails(appointment)}
                          >
                            <InfoCircle className="me-1" /> Détails
                          </Button>
                          {appointment.status === 'en attente' && (
                            <>
                              <Button 
                                variant="outline-success" 
                                size="sm" 
                                className="me-1"
                                onClick={() => confirmAppointment(appointment.id)}
                                title="Confirmer le RDV"
                              >
                                <Check2 size={14} />
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => cancelAppointment(appointment.id)}
                                title="Annuler le RDV"
                              >
                                <X size={14} />
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-3">
                          Aucun rendez-vous trouvé
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Mes disponibilités */}
        <Col lg={4}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Mes disponibilités</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Lundi
                  <span className="text-muted">08:00 - 17:00</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Mardi
                  <span className="text-muted">08:00 - 17:00</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Mercredi
                  <span className="text-muted">08:00 - 17:00</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Jeudi
                  <span className="text-muted">08:00 - 17:00</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Vendredi
                  <span className="text-muted">08:00 - 15:00</span>
                </ListGroup.Item>
              </ListGroup>
              <Button variant="outline-secondary" size="sm" className="mt-3 w-100">
                Modifier les disponibilités
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modale de détails du RDV */}
      <Modal 
        show={showAppointmentModal} 
        onHide={() => setShowAppointmentModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Détails du rendez-vous</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAppointment && (
            <Container>
              <Row className="mb-4">
                <Col md={8}>
                  <h4>{selectedAppointment.patient}</h4>
                  <p className="text-muted mb-0">
                    <PersonVcard className="me-2" /> 
                    ID: {selectedAppointment.patientId}
                  </p>
                </Col>
                <Col md={4} className="text-end">
                  <Badge 
                    bg={
                      selectedAppointment.status === 'confirmé' ? 'success' :
                      selectedAppointment.status === 'en attente' ? 'warning' : 'danger'
                    }
                    className="mb-2"
                  >
                    {selectedAppointment.status.toUpperCase()}
                  </Badge>
                  <p className="mb-0">
                    <Calendar3 className="me-1" />
                    {format(selectedAppointment.date, 'EEEE d MMMM yyyy', { locale: fr })}
                  </p>
                  <p className="mb-0">
                    <Clock className="me-1" />
                    {selectedAppointment.time} - {selectedAppointment.duration} min
                  </p>
                </Col>
              </Row>
              
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Header className="bg-light">
                      <h6 className="mb-0">Informations de contact</h6>
                    </Card.Header>
                    <Card.Body>
                      <p className="mb-2">
                        <TelephoneFill className="me-2 text-primary" />
                        {selectedAppointment.contact}
                      </p>
                      <p className="mb-2">
                        <Envelope className="me-2 text-primary" />
                        {selectedAppointment.email}
                      </p>
                      <p className="mb-0">
                        <GeoAltFill className="me-2 text-primary" />
                        {selectedAppointment.address}
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header className="bg-light">
                      <h6 className="mb-0">Notes et informations</h6>
                    </Card.Header>
                    <Card.Body>
                      <p className="text-muted">
                        {selectedAppointment.notes || 'Aucune note pour ce rendez-vous.'}
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <div className="d-flex justify-content-between">
                <div>
                  {selectedAppointment.status === 'en attente' && (
                    <>
                      <Button 
                        variant="success" 
                        className="me-2"
                        onClick={() => {
                          confirmAppointment(selectedAppointment.id);
                          setShowAppointmentModal(false);
                        }}
                      >
                        <Check2 className="me-1" /> Confirmer le RDV
                      </Button>
                      <Button 
                        variant="outline-danger"
                        className="me-2"
                        onClick={() => {
                          cancelAppointment(selectedAppointment.id);
                          setShowAppointmentModal(false);
                        }}
                      >
                        <X className="me-1" /> Annuler le RDV
                      </Button>
                    </>
                  )}
                  {selectedAppointment.status === 'confirmé' && (
                    <Button 
                      variant="outline-danger"
                      onClick={() => {
                        cancelAppointment(selectedAppointment.id);
                        setShowAppointmentModal(false);
                      }}
                    >
                      <X className="me-1" /> Annuler le RDV
                    </Button>
                  )}
                </div>
                <div>
                  <Button variant="outline-secondary" className="me-2">
                    <Telephone className="me-1" /> Appeler
                  </Button>
                  <Button variant="outline-primary">
                    <Envelope className="me-1" /> Envoyer un message
                  </Button>
                </div>
              </div>
            </Container>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default DoctorDashboard;
