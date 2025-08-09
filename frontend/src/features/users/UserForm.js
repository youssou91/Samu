import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Button, 
  Row, 
  Col, 
  Alert, 
  Card, 
  InputGroup,
  Spinner
} from 'react-bootstrap';
import { 
  PersonFill, 
  EnvelopeFill, 
  LockFill, 
  TelephoneFill, 
  PersonBadgeFill,
  CalendarFill,
  XCircleFill,
  CheckCircleFill
} from 'react-bootstrap-icons';

const UserForm = ({ user, onSubmit, onCancel, loading = false }) => {
  const isEditMode = !!user?.id;
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    role: 'student',
    status: 'active',
    birthDate: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        id: user.id || '',
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'student',
        status: user.status || 'active',
        birthDate: user.birthDate || '',
        address: user.address || '',
        // Ne pas préremplir les champs de mot de passe en mode édition
        ...(isEditMode ? {} : { password: '', confirmPassword: '' })
      }));
    }
  }, [user, isEditMode]);

  const validate = () => {
    const newErrors = {};
    
    // Validation du nom
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }
    
    // Validation de l'email
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    // Validation du téléphone (optionnel mais doit être valide si fourni)
    if (formData.phone && !/^[+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]*$/.test(formData.phone)) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }
    
    // Validation du mot de passe (uniquement pour la création ou si on le modifie)
    if (!isEditMode || formData.password) {
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
    }
    
    // Validation de la date de naissance (optionnelle mais doit être valide si fournie)
    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const minAgeDate = new Date(
        today.getFullYear() - 18, 
        today.getMonth(), 
        today.getDate()
      );
      
      if (birthDate > minAgeDate) {
        newErrors.birthDate = 'L\'utilisateur doit avoir au moins 18 ans';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    console.log('handleSubmit appelé');
    e.preventDefault();
    console.log('Validation du formulaire...');
    const isValid = validate();
    console.log('Résultat de la validation:', isValid);
    
    if (isValid) {
      // Ne pas envoyer les champs de confirmation de mot de passe
      const { confirmPassword, ...userData } = formData;
      console.log('Données du formulaire:', userData);
      
      // Si c'est une mise à jour et que le mot de passe n'a pas été changé, ne pas l'envoyer
      if (isEditMode && !userData.password) {
        console.log('Suppression du mot de passe non modifié');
        delete userData.password;
      }
      
      console.log('Appel de la fonction onSubmit avec les données:', userData);
      onSubmit(userData);
    } else {
      console.log('Le formulaire contient des erreurs:', errors);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="user-form-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <Card className="shadow-lg">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0 d-flex align-items-center">
            <PersonFill className="me-2" />
            {isEditMode ? 'Modifier un utilisateur' : 'Ajouter un nouvel utilisateur'}
          </h4>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {Object.values(errors).filter(Boolean).length > 0 && (
              <Alert variant="danger" className="d-flex align-items-center">
                <XCircleFill className="me-2" />
                <div>Veuillez corriger les erreurs ci-dessous avant de continuer.</div>
              </Alert>
            )}
            
            <div className="row">
              <div className="col-md-6 mb-4">
                <h5 className="border-bottom pb-2 mb-3">
                  <PersonFill className="me-2 text-primary" />
                  Identité
                </h5>
                
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Nom complet <span className="text-danger">*</span></Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light">
                      <PersonFill className="text-primary" />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      isInvalid={!!errors.name}
                      placeholder="Jean Dupont"
                      className="py-2"
                    />
                  </InputGroup>
                  <Form.Control.Feedback type="invalid" className="d-flex align-items-center">
                    <XCircleFill className="me-1" />
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Email <span className="text-danger">*</span></Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light">
                      <EnvelopeFill className="text-primary" />
                    </InputGroup.Text>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      isInvalid={!!errors.email}
                      placeholder="jean.dupont@example.com"
                      className="py-2"
                    />
                  </InputGroup>
                  <Form.Control.Feedback type="invalid" className="d-flex align-items-center">
                    <XCircleFill className="me-1" />
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              
              <div className="col-md-6 mb-4">
                <h5 className="border-bottom pb-2 mb-3">
                  <PersonBadgeFill className="me-2 text-primary" />
                  Rôle et statut
                </h5>
                
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Rôle <span className="text-danger">*</span></Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light">
                      <PersonBadgeFill className="text-primary" />
                    </InputGroup.Text>
                    <Form.Select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      isInvalid={!!errors.role}
                      className="py-2"
                    >
                      <option value="student">Étudiant</option>
                      <option value="teacher">Enseignant</option>
                      <option value="admin">Administrateur</option>
                    </Form.Select>
                  </InputGroup>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Statut <span className="text-danger">*</span></Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light">
                      {formData.status === 'active' ? 
                        <CheckCircleFill className="text-success" /> : 
                        <XCircleFill className="text-danger" />
                      }
                    </InputGroup.Text>
                    <Form.Select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      isInvalid={!!errors.status}
                      className="py-2"
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                    </Form.Select>
                  </InputGroup>
                </Form.Group>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6 mb-4">
                <h5 className="border-bottom pb-2 mb-3">
                  <TelephoneFill className="me-2 text-primary" />
                  Coordonnées
                </h5>
                
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Téléphone</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light">
                      <TelephoneFill className="text-primary" />
                    </InputGroup.Text>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      isInvalid={!!errors.phone}
                      placeholder="+33 6 12 34 56 78"
                      className="py-2"
                    />
                  </InputGroup>
                  <Form.Control.Feedback type="invalid" className="d-flex align-items-center">
                    <XCircleFill className="me-1" />
                    {errors.phone}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Adresse</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    placeholder="123 Rue Exemple, Ville"
                    className="py-2"
                  />
                </Form.Group>
              </div>
              
              <div className="col-md-6 mb-4">
                <h5 className="border-bottom pb-2 mb-3">
                  <CalendarFill className="me-2 text-primary" />
                  Informations personnelles
                </h5>
                
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Date de naissance</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light">
                      <CalendarFill className="text-primary" />
                    </InputGroup.Text>
                    <Form.Control
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleChange}
                      isInvalid={!!errors.birthDate}
                      max={new Date().toISOString().split('T')[0]}
                      className="py-2"
                    />
                  </InputGroup>
                  <Form.Control.Feedback type="invalid" className="d-flex align-items-center">
                    <XCircleFill className="me-1" />
                    {errors.birthDate}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>
            
            {!isEditMode && (
              <div className="row">
                <div className="col-12 mb-4">
                  <h5 className="border-bottom pb-2 mb-3">
                    <LockFill className="me-2 text-primary" />
                    Sécurité
                  </h5>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">Mot de passe <span className="text-danger">*</span></Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light">
                            <LockFill className="text-primary" />
                          </InputGroup.Text>
                          <Form.Control
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            isInvalid={!!errors.password}
                            placeholder="••••••••"
                            className="py-2"
                          />
                          <Button 
                            variant="outline-secondary" 
                            onClick={togglePasswordVisibility}
                            className="d-flex align-items-center"
                          >
                            {showPassword ? 'Masquer' : 'Afficher'}
                          </Button>
                        </InputGroup>
                        <Form.Text className="text-muted small">
                          Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.
                        </Form.Text>
                        <Form.Control.Feedback type="invalid" className="d-flex align-items-center">
                          <XCircleFill className="me-1" />
                          {errors.password}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </div>
                    
                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">Confirmation <span className="text-danger">*</span></Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light">
                            <LockFill className="text-primary" />
                          </InputGroup.Text>
                          <Form.Control
                            type={showPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            isInvalid={!!errors.confirmPassword}
                            placeholder="••••••••"
                            className="py-2"
                          />
                        </InputGroup>
                        <Form.Control.Feedback type="invalid" className="d-flex align-items-center">
                          <XCircleFill className="me-1" />
                          {errors.confirmPassword}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </div>
                  </div>
                  <Form.Group className="mb-3">
                    <Form.Label>Statut <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      isInvalid={!!errors.status}
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                      <option value="pending">En attente</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.status}
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>
              </div>
            )}
            
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
                    <CheckCircleFill className="me-1" />
                    {isEditMode ? 'Mettre à jour' : 'Créer l\'utilisateur'}
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default UserForm;
