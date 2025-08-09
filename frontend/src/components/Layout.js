import React from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  HouseDoor, 
  CalendarCheck,
  FileEarmarkText,
  Calendar2Plus,
  Gear,
  BoxArrowRight,
  PersonCircle
} from 'react-bootstrap-icons';
import { logout } from '../features/auth/authSlice';

const Layout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(state => state.auth);

  const handleLogoutClick = () => {
    dispatch(logout());
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const renderNavLink = (to, icon, text, roles = []) => {
    // Vérifier si l'utilisateur est connecté et si des rôles sont requis
    if (!user || (roles.length > 0 && !roles.includes(user.role))) {
      return null;
    }
    
    const IconComponent = icon;
    return (
      <Nav.Link 
        as={Link} 
        to={to} 
        className={`d-flex align-items-center ${isActive(to)}`}
      >
        <IconComponent className="me-2" size={18} />
        {text}
      </Nav.Link>
    );
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar bg="primary" variant="dark" expand="lg" className="shadow-sm">
        <Container fluid>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <img
              src="/logo192.png"
              width="30"
              height="30"
              className="d-inline-block align-top me-2"
              alt="Logo SAMU"
            />
            <span className="fw-bold">SAMU</span>
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="main-navbar" />
          
          <Navbar.Collapse id="main-navbar">
            <Nav className="me-auto">
              {renderNavLink('/', HouseDoor, 'Tableau de bord')}
              
              {/* Menu Présences */}
              {user && (user.role === 'admin' || user.role === 'medecin' || user.role === 'infirmier' || user.role === 'chef_service') && (
                <NavDropdown 
                  title={
                    <span className="d-flex align-items-center">
                      <CalendarCheck className="me-2" size={18} />
                      Présences
                    </span>
                  } 
                  id="presences-dropdown"
                  className={isActive('/presences')}
                >
                  <NavDropdown.Item as={Link} to="/presences" className={isActive('/presences')}>
                    Liste des présences
                  </NavDropdown.Item>
                  {user?.role && (user.role === 'medecin' || user.role === 'infirmier') && (
                    <NavDropdown.Item as={Link} to="/presences/declarer" className={isActive('/presences/declarer')}>
                      Déclarer ma présence
                    </NavDropdown.Item>
                  )}
                  {user?.role && (user.role === 'admin' || user.role === 'chef_service') && (
                    <NavDropdown.Item as={Link} to="/presences/validation" className={isActive('/presences/validation')}>
                      Valider les présences
                    </NavDropdown.Item>
                  )}
                </NavDropdown>
              )}
              
              {/* Menu Rendez-vous */}
              {user?.role && (user.role === 'admin' || user.role === 'secretaire') && (
                <NavDropdown 
                  title={
                    <span className="d-flex align-items-center">
                      <Calendar2Plus className="me-2" size={18} />
                      Rendez-vous
                    </span>
                  } 
                  id="rdv-dropdown"
                >
                  <NavDropdown.Item as={Link} to="/rendez-vous" className={isActive('/rendez-vous')}>
                    Prendre RDV
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/planning" className={isActive('/planning')}>
                    Planning
                  </NavDropdown.Item>
                </NavDropdown>
              )}
              
              {/* Menu Rapports */}
              {user?.role && (user.role === 'admin' || user.role === 'chef_service') && (
                <NavDropdown 
                  title={
                    <span className="d-flex align-items-center">
                      <FileEarmarkText className="me-2" size={18} />
                      Rapports
                    </span>
                  } 
                  id="reports-dropdown"
                >
                  <NavDropdown.Item as={Link} to="/rapports" className={isActive('/rapports')}>
                    Générer un rapport
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/statistiques" className={isActive('/statistiques')}>
                    Statistiques
                  </NavDropdown.Item>
                </NavDropdown>
              )}
              
              {/* Menu Administration */}
              {user?.role === 'admin' && (
                <NavDropdown 
                  title={
                    <span className="d-flex align-items-center">
                      <Gear className="me-2" size={18} />
                      Administration
                    </span>
                  } 
                  id="admin-dropdown"
                >
                  <NavDropdown.Item as={Link} to="/utilisateurs" className={isActive('/utilisateurs')}>
                    Gestion des utilisateurs
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/parametres" className={isActive('/parametres')}>
                    Paramètres
                  </NavDropdown.Item>
                </NavDropdown>
              )}
            </Nav>
            
            {/* Menu utilisateur */}
            <Nav>
              <NavDropdown
                title={
                  <span className="d-flex align-items-center">
                    <PersonCircle className="me-2" />
                    {user?.prenom || 'Utilisateur'}
                  </span>
                }
                id="basic-nav-dropdown"
                align="end"
                className="user-dropdown"
              >
                <NavDropdown.ItemText className="text-muted small">
                  {user?.role ? `Rôle: ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}` : ''}
                </NavDropdown.ItemText>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogoutClick}>
                  <BoxArrowRight className="me-2" />
                  Déconnexion
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Contenu principal */}
      <main className="flex-grow-1 bg-light">
        <Container fluid className="py-4">
          {children}
        </Container>
      </main>

      <footer className="bg-white py-3 border-top mt-auto">
        <Container>
          <div className="text-center text-muted">
            <small>© {new Date().getFullYear()} Gestion des Présences - SAMU. Tous droits réservés.</small>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default Layout;
