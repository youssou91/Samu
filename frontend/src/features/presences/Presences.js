import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Button,
  Table,
  Form,
  InputGroup,
  Badge,
  Container,
  Modal,
  Alert,
  Spinner,
  Row,
  Col
} from 'react-bootstrap';
import {
  Search,
  PlusCircle,
  CalendarDate,
  SortUp,
  SortDown,
  Pencil,
  Trash2
} from 'react-bootstrap-icons';
import PresenceForm from './PresenceForm';
import { presenceApi } from '../../services/api';

const Presences = () => {
  const [presences, setPresences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPresence, setCurrentPresence] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');

  // Chargement initial des données depuis l'API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await presenceApi.getAll();
        setPresences(Array.isArray(data) ? data : []);
      } catch (error) {
        setError("Erreur lors du chargement des présences");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Gestion du tri
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Fonction de tri
  const sortedPresences = useMemo(() => {
    let sortableItems = [...presences];

    // Filtrage par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      sortableItems = sortableItems.filter(presence =>
        (presence.personnelName?.toLowerCase() || '').includes(term) ||
        (presence.service?.toLowerCase() || '').includes(term) ||
        (presence.notes?.toLowerCase() || '').includes(term)
      );
    }

    // Filtrage par statut
    if (filterStatus !== 'all') {
      sortableItems = sortableItems.filter(presence => presence.status === filterStatus);
    }

    // Filtrage par service
    if (filterCourse !== 'all') {
      sortableItems = sortableItems.filter(presence => presence.service === filterCourse);
    }

    // Tri
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableItems;
  }, [presences, sortConfig, searchTerm, filterStatus, filterCourse]);

  // Gestion des statuts
  const getStatusBadge = (status) => {
    const statusMap = {
      present: { label: 'Présent', variant: 'success' },
      absent: { label: 'Absent', variant: 'danger' },
      en_retard: { label: 'En retard', variant: 'warning' },
      excused: { label: 'Excusé', variant: 'info' }
    };
    const { label, variant } = statusMap[status] || { label: 'Inconnu', variant: 'secondary' };
    return <Badge bg={variant} className="text-uppercase">{label}</Badge>;
  };

  // Gestion de l'ouverture/fermeture de la modale
  const handleShowModal = (presence = null) => {
    setCurrentPresence(presence);
    setIsEditing(!!presence);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentPresence(null);
  };

  // Gestion de la soumission du formulaire
  const handleSubmit = async (formData) => {
    setError(null);
    setSuccess(null);
    try {
      if (isEditing) {
        // Mise à jour d'une présence existante
        const updated = await presenceApi.update(currentPresence._id || currentPresence.id, formData);
        setPresences(presences.map(p => (p._id === updated._id ? updated : p)));
        setSuccess('Présence modifiée avec succès.');
      } else {
        // Ajout d'une nouvelle présence
        const created = await presenceApi.create(formData);
        setPresences([...presences, created]);
        setSuccess('Présence ajoutée avec succès.');
      }
      setShowModal(false);
      setCurrentPresence(null);
    } catch (err) {
      setError("Erreur lors de l'enregistrement de la présence.");
    }
  };

  // Gestion de la suppression
  const handleDelete = async (id) => {
    setError(null);
    setSuccess(null);
    try {
      await presenceApi.delete(id);
      setPresences(presences.filter(p => (p._id || p.id) !== id));
      setSuccess('Présence supprimée avec succès.');
    } catch (err) {
      setError('Erreur lors de la suppression de la présence.');
    }
  };

  // Liste des cours uniques pour le filtre
  const courses = [...new Set(presences.map(p => p.course))];

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Container fluid className="py-4">
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="mb-0">Gestion des présences</h2>
            <Button variant="primary" onClick={() => handleShowModal()}>
              <PlusCircle className="me-2" /> Nouvelle présence
            </Button>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Rechercher</Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <Search />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Nom, cours, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Form.Group>

          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Statut</Form.Label>
                <Form.Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="present">Présent</option>
                  <option value="absent">Absent</option>
                  <option value="late">En retard</option>
                  <option value="excused">Excusé</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Cours</Form.Label>
                <Form.Select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                >
                  <option value="all">Tous les cours</option>
                  {courses.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tableau des présences */}
      <Card>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th
                    className="cursor-pointer"
                    onClick={() => requestSort('personnelName')}
                  >
                    <div className="d-flex align-items-center">
                      Personnel
                      {sortConfig.key === 'personnelName' && (
                        sortConfig.direction === 'asc' ?
                          <SortUp className="ms-1" /> :
                          <SortDown className="ms-1" />
                      )}
                    </div>
                  </th>
                  <th
                    className="cursor-pointer"
                    onClick={() => requestSort('date')}
                  >
                    <div className="d-flex align-items-center">
                      Date
                      {sortConfig.key === 'date' && (
                        sortConfig.direction === 'asc' ?
                          <SortUp className="ms-1" /> :
                          <SortDown className="ms-1" />
                      )}
                    </div>
                  </th>
                  <th>Service</th>
                  <th>Garde</th>
                  <th>Horaires</th>
                  <th>Consultations</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedPresences.length > 0 ? (
                  sortedPresences.map(presence => (
                    <tr key={presence.id}>
                      <td className="align-middle">
                        <div className="fw-medium">{presence.personnelName}</div>
                        <small className="text-muted">{presence.role}</small>
                      </td>
                      <td className="align-middle">
                        <div className="d-flex align-items-center">
                          <CalendarDate className="me-2 text-muted" />
                          {new Date(presence.date).toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short'
                          })}
                        </div>
                      </td>
                      <td className="align-middle">
                        <Badge bg="light" text="dark" className="border">
                          {presence.service}
                        </Badge>
                      </td>
                      <td className="align-middle">
                        {getStatusBadge(presence.status)}
                      </td>
                      <td className="align-middle">
                        {presence.heureDebut} - {presence.heureFin}
                      </td>
                      <td className="align-middle">
                        {presence.consultations > 0 ? (
                          <Badge bg="success" className="rounded-pill">
                            {presence.consultations} patients
                          </Badge>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="text-end align-middle">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleShowModal(presence)}
                          title="Modifier"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(presence.id)}
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      Aucune présence enregistrée
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Modale d'ajout/modification */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        size="xl"
        dialogClassName="modal-90w"
        aria-labelledby="presence-form-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? 'Modifier une présence' : 'Ajouter une présence'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PresenceForm
            presence={currentPresence}
            onSubmit={handleSubmit}
            onCancel={handleCloseModal}
          />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Presences;