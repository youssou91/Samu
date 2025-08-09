import React, { useState, useEffect } from 'react';
import { 
  PersonFill, 
  XCircleFill,
  CalendarDateFill,
  Building,
  Clipboard2PulseFill,
  ClockHistory,
  PersonBadgeFill,
  CheckCircleFill
} from 'react-bootstrap-icons';
import { Form, Button, Row, Col, Alert, InputGroup } from 'react-bootstrap';

const PresenceForm = ({ presence, onSubmit, onCancel }) => {
  const isEditMode = !!presence?.id;
  
  const [formData, setFormData] = useState({
    personnelName: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    service: '',
    heureDebut: '08:00',
    heureFin: '17:00',
    consultations: 0,
    garde: 'jour',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialiser le formulaire avec les données de la présence en mode édition
  useEffect(() => {
    if (presence) {
      setFormData({
        studentName: presence.studentName || '',
        date: presence.date || new Date().toISOString().split('T')[0],
        status: presence.status || 'present',
        course: presence.course || '',
        duration: presence.duration || 1,
        notes: presence.notes || ''
      });
    }
  }, [presence]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.personnelName.trim()) {
      newErrors.personnelName = 'Le nom du personnel est requis';
    }
    
    if (!formData.date) {
      newErrors.date = 'La date est requise';
    }
    
    if (!formData.service.trim()) {
      newErrors.service = 'Le service est requis';
    }
    
    if (formData.status === 'present' && !formData.heureDebut) {
      newErrors.heureDebut = 'L\'heure de début est requise';
    }
    
    if (formData.status === 'present' && !formData.heureFin) {
      newErrors.heureFin = 'L\'heure de fin est requise';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseFloat(value) || 0 : value
    }));
    
    // Effacer l'erreur du champ lorsqu'il est modifié
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      setLoading(true);
      
      // Simuler un appel API
      setTimeout(() => {
        onSubmit(formData);
        setLoading(false);
      }, 500);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {Object.values(errors).filter(Boolean).length > 0 && (
        <Alert variant="danger" className="d-flex align-items-center">
          <XCircleFill className="me-2" />
          <div>Veuillez corriger les erreurs ci-dessous avant de continuer.</div>
        </Alert>
      )}
      
      <Row>
        <Col md={6}>
          <h5 className="border-bottom pb-2 mb-3">
            <PersonFill className="me-2 text-primary" />
            Informations du personnel
          </h5>
          
          <Form.Group className="mb-3">
            <Form.Label>Nom du personnel <span className="text-danger">*</span></Form.Label>
            <InputGroup>
              <InputGroup.Text className="bg-light">
                <PersonFill className="text-primary" />
              </InputGroup.Text>
              <Form.Control
                type="text"
                name="personnelName"
                value={formData.personnelName}
                onChange={handleChange}
                isInvalid={!!errors.personnelName}
                placeholder="Nom complet du médecin ou infirmier"
                className="py-2"
              />
            </InputGroup>
            <Form.Control.Feedback type="invalid" className="d-flex align-items-center">
              <XCircleFill className="me-1" />
              {errors.personnelName}
            </Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Date <span className="text-danger">*</span></Form.Label>
            <InputGroup>
              <InputGroup.Text className="bg-light">
                <CalendarDateFill className="text-primary" />
              </InputGroup.Text>
              <Form.Control
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                isInvalid={!!errors.date}
                className="py-2"
              />
            </InputGroup>
            <Form.Control.Feedback type="invalid" className="d-flex align-items-center">
              <XCircleFill className="me-1" />
              {errors.date}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <h5 className="border-bottom pb-2 mb-3">
            <Building className="me-2 text-primary" />
            Détails du service
          </h5>
          
          <Form.Group className="mb-3">
            <Form.Label>Service <span className="text-danger">*</span></Form.Label>
            <InputGroup>
              <InputGroup.Text className="bg-light">
                <Building className="text-primary" />
              </InputGroup.Text>
              <Form.Control
                type="text"
                name="service"
                value={formData.service}
                onChange={handleChange}
                isInvalid={!!errors.service}
                placeholder="Ex: Cardiologie, Pédiatrie, Urgences..."
                className="py-2"
              />
            </InputGroup>
            <Form.Control.Feedback type="invalid" className="d-flex align-items-center">
              <XCircleFill className="me-1" />
              {errors.service}
            </Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Type de garde</Form.Label>
            <InputGroup>
              <InputGroup.Text className="bg-light">
                <Clipboard2PulseFill className="text-primary" />
              </InputGroup.Text>
              <Form.Select
                name="garde"
                value={formData.garde}
                onChange={handleChange}
                className="py-2"
              >
                <option value="jour">Garde de jour</option>
                <option value="nuit">Garde de nuit</option>
                <option value="astreinte">Astreinte</option>
              </Form.Select>
            </InputGroup>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Heure de début <span className="text-danger">*</span></Form.Label>
            <InputGroup>
              <InputGroup.Text className="bg-light">
                <ClockHistory className="text-primary" />
              </InputGroup.Text>
              <Form.Control
                type="time"
                name="heureDebut"
                value={formData.heureDebut}
                onChange={handleChange}
                isInvalid={!!errors.heureDebut}
                className="py-2"
              />
            </InputGroup>
            <Form.Control.Feedback type="invalid" className="d-flex align-items-center">
              <XCircleFill className="me-1" />
              {errors.heureDebut}
            </Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Heure de fin <span className="text-danger">*</span></Form.Label>
            <InputGroup>
              <InputGroup.Text className="bg-light">
                <ClockHistory className="text-primary" />
              </InputGroup.Text>
              <Form.Control
                type="time"
                name="heureFin"
                value={formData.heureFin}
                onChange={handleChange}
                isInvalid={!!errors.heureFin}
                className="py-2"
              />
            </InputGroup>
            <Form.Control.Feedback type="invalid" className="d-flex align-items-center">
              <XCircleFill className="me-1" />
              {errors.heureFin}
            </Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Nombre de consultations</Form.Label>
            <InputGroup>
              <InputGroup.Text className="bg-light">
                <PersonBadgeFill className="text-primary" />
              </InputGroup.Text>
              <Form.Control
                type="number"
                name="consultations"
                min="0"
                value={formData.consultations}
                onChange={handleChange}
                className="py-2"
                placeholder="Nombre de patients vus"
              />
            </InputGroup>
          </Form.Group>
        </Col>
      </Row>
      
      <div className="mt-4">
        <h5 className="border-bottom pb-2 mb-3">
          <i className="bi bi-chat-square-text me-2"></i>
          Notes complémentaires
        </h5>
        
        <Form.Group className="mb-4">
          <Form.Control
            as="textarea"
            rows={3}
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Ajoutez des notes ou des commentaires..."
          />
          <Form.Text className="text-muted">
            Ces informations sont optionnelles mais peuvent être utiles pour le suivi.
          </Form.Text>
        </Form.Group>
      </div>
      
      <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
        <Button 
          variant="outline-secondary" 
          onClick={onCancel}
          disabled={loading}
          className="px-4"
        >
          <XCircleFill className="me-1" /> Annuler
        </Button>
        
        <Button 
          variant="primary" 
          type="submit"
          disabled={loading}
          className="px-4"
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Enregistrement...
            </>
          ) : (
            <>
              <CheckCircleFill className="me-1" />
              {isEditMode ? 'Mettre à jour' : 'Enregistrer'}
            </>
          )}
        </Button>
      </div>
    </Form>
  );
};

export default PresenceForm;
