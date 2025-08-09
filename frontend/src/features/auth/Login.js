import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Card, 
  Form, 
  Button, 
  InputGroup,
  FormControl,
  Alert
} from 'react-bootstrap';
import { Eye, EyeSlash } from 'react-bootstrap-icons';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from './authSlice';

const Login = () => {
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error: authError } = useSelector(state => state.auth);

  // Redirection si authentifié
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Gestion des erreurs
  useEffect(() => {
    if (authError) {
      // Extraction du message d'erreur depuis l'objet erreur Redux
      const errorMessage = authError.message || 'Erreur de connexion';
      setError(errorMessage);
      dispatch(clearError());
    }
  }, [authError, dispatch]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    if (!validateEmail(formData.email)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }
    
    try {
      const resultAction = await dispatch(loginUser(formData));
      
      // Gestion spécifique de l'erreur 401
      if (loginUser.rejected.match(resultAction)) {
        if (resultAction.payload?.status === 401) {
          setError(resultAction.payload.message || 'Identifiants incorrects');
        } else {
          setError(resultAction.payload?.message || 
                 resultAction.error?.message || 
                 'Erreur de connexion');
        }
      }
    } catch (error) {
      console.error('Erreur inattendue:', error);
      setError('Une erreur technique est survenue');
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="w-100" style={{ maxWidth: '400px' }}>
        <Card className="shadow">
          <Card.Body className="p-4">
            <div className="text-center mb-4">
              <img 
                src="/logo192.png" 
                alt="Logo" 
                style={{ width: '80px', height: '80px', objectFit: 'contain' }} 
                className="mb-3"
              />
              <h2>Connexion</h2>
              {error && (
                <Alert variant="danger" className="mt-3" onClose={() => setError('')} dismissible>
                  {error}
                </Alert>
              )}
            </div>
            
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="email">
                <Form.Label>Adresse email</Form.Label>
                <FormControl
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="email@exemple.com"
                  autoComplete="username"
                  autoFocus
                />
              </Form.Group>

              <Form.Group className="mb-4" controlId="password">
                <Form.Label>Mot de passe</Form.Label>
                <InputGroup>
                  <FormControl
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    minLength="6"
                  />
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeSlash /> : <Eye />}
                  </Button>
                </InputGroup>
              </Form.Group>

              <Button 
                variant="primary" 
                type="submit" 
                className="w-100 py-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Connexion...
                  </>
                ) : 'Se connecter'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default Login;