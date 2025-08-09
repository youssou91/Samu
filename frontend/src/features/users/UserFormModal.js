import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { 
  PersonFill, 
  Envelope, 
  Telephone, 
  ShieldLock,
  XCircle,
  CheckCircle
} from 'react-bootstrap-icons';

const UserFormModal = ({ show, onHide, user, onSubmit, loading = false }) => {
  const isEditMode = !!user?._id;
  
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    role: 'patient',
    actif: true,
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Réinitialiser le formulaire quand l'utilisateur change
  useEffect(() => {
    if (show) {
      setFormData({
        prenom: user?.prenom || '',
        nom: user?.nom || '',
        email: user?.email || '',
        telephone: user?.telephone || '',
        role: user?.role || 'patient',
        actif: user ? user.actif : true,
        password: '',
        confirmPassword: ''
      });
      setErrors({});
    }
  }, [show, user]);

  const validate = () => {
    const newErrors = {};
    
    // Validation du prénom
    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }
    
    // Validation du nom
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }
    
    // Validation de l'email
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    // Validation du mot de passe (uniquement pour la création ou si on le modifie)
    if (!isEditMode) {
      if (!formData.password) {
        newErrors.password = 'Le mot de passe est requis';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    } else if (formData.password && formData.password !== formData.confirmPassword) {
      // En mode édition, valider le mot de passe uniquement s'il est modifié
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
      // Ne pas envoyer les champs de confirmation de mot de passe
      const { confirmPassword, ...userData } = formData;
      
      // Si c'est une mise à jour et que le mot de passe n'a pas été changé, ne pas l'envoyer
      if (isEditMode && !userData.password) {
        delete userData.password;
      }
      
      onSubmit(userData);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {isEditMode ? 'Modifier l\'utilisateur' : 'Ajouter un nouvel utilisateur'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {Object.values(errors).filter(Boolean).length > 0 && (
            <Alert variant="danger" className="d-flex align-items-center">
              <XCircle className="me-2" />
              <div>Veuillez corriger les erreurs ci-dessous avant de continuer.</div>
            </Alert>
          )}
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Prénom <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  isInvalid={!!errors.prenom}
                  placeholder="Prénom"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.prenom}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nom <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  isInvalid={!!errors.nom}
                  placeholder="Nom"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.nom}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                <div className="input-group">
                  <span className="input-group-text">
                    <Envelope />
                  </span>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    isInvalid={!!errors.email}
                    placeholder="email@exemple.com"
                  />
                </div>
                <Form.Control.Feedback type="invalid">
                  {errors.email}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            
            <Col md={6}>
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
                    onChange={handleChange}
                    placeholder="+221 77 123 45 67"
                  />
                </div>
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Rôle <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="patient">Patient</option>
                  <option value="medecin">Médecin</option>
                  <option value="infirmier">Infirmier</option>
                  <option value="secretaire">Secrétaire</option>
                  <option value="admin">Administrateur</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3 d-flex align-items-end h-100">
                <Form.Check
                  type="switch"
                  id="actif-switch"
                  label="Compte actif"
                  name="actif"
                  checked={formData.actif}
                  onChange={handleChange}
                  className="pt-3"
                />
              </Form.Group>
            </Col>
          </Row>
          
          {!isEditMode && (
            <div className="border-top pt-3 mt-3">
              <h5 className="mb-3">
                <ShieldLock className="me-2" />
                Mot de passe
              </h5>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mot de passe <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      isInvalid={!!errors.password}
                      placeholder="••••••••"
                    />
                    <Form.Text className="text-muted">
                      Minimum 8 caractères, avec majuscules, minuscules et chiffres
                    </Form.Text>
                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Confirmer le mot de passe <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      isInvalid={!!errors.confirmPassword}
                      placeholder="••••••••"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.confirmPassword}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="show-password"
                  label="Afficher les mots de passe"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                />
              </Form.Group>
            </div>
          )}
          
          {isEditMode && formData.password && (
            <div className="border-top pt-3 mt-3">
              <h5 className="mb-3">
                <ShieldLock className="me-2" />
                Changer le mot de passe
              </h5>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nouveau mot de passe</Form.Label>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Laissez vide pour ne pas changer"
                    />
                    <Form.Text className="text-muted">
                      Minimum 8 caractères, avec majuscules, minuscules et chiffres
                    </Form.Text>
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Confirmer le nouveau mot de passe</Form.Label>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      isInvalid={!!errors.confirmPassword}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.confirmPassword}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="show-password-edit"
                  label="Afficher les mots de passe"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                />
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircle className="me-2" />
                {isEditMode ? 'Mettre à jour' : 'Créer l\'utilisateur'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default UserFormModal;
