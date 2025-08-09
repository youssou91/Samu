import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { 
  HouseDoor, 
  People, 
  CalendarCheck, 
  Calendar2Check,
  FileEarmarkText,
  GraphUp,
  ClockHistory,
  Calendar2Plus,
  PersonCheck,
  Gear,
  BoxArrowRight
} from 'react-bootstrap-icons';

const MainMenu = ({ currentUser, onLogout }) => {
  const location = useLocation();
  
  if (!currentUser) return null;

  // Vérification des rôles
  const isAdmin = currentUser.role === 'admin';
  const isMedecin = currentUser.role === 'medecin';
  const isInfirmier = currentUser.role === 'infirmier';
  const isSecretaire = currentUser.role === 'secretaire';
  const isChefService = currentUser.role === 'chef_service';

  return (
    <Nav variant="pills" className="flex-column mb-4">
      {/* Tableau de bord */}
      <Nav.Item>
        <Nav.Link as={Link} to="/" active={location.pathname === '/'} className="d-flex align-items-center">
          <HouseDoor className="me-2" />
          Tableau de bord
        </Nav.Link>
      </Nav.Item>

      {/* Gestion des utilisateurs (Admin) */}
      {isAdmin && (
        <Nav.Item>
          <Nav.Link as={Link} to="/utilisateurs" active={location.pathname === '/utilisateurs'} className="d-flex align-items-center">
            <People className="me-2" />
            Gestion des utilisateurs
          </Nav.Link>
        </Nav.Item>
      )}

      {/* Gestion des présences */}
      {(isAdmin || isMedecin || isInfirmier || isChefService) && (
        <>
          <div className="text-uppercase small text-muted mt-3 mb-1 px-3">Gestion des présences</div>
          
          <Nav.Item>
            <Nav.Link as={Link} to="/presences" active={location.pathname === '/presences'} className="d-flex align-items-center">
              <CalendarCheck className="me-2" />
              Liste des présences
            </Nav.Link>
          </Nav.Item>
          
          {(isMedecin || isInfirmier) && (
            <Nav.Item>
              <Nav.Link as={Link} to="/presences/declarer" active={location.pathname === '/presences/declarer'} className="d-flex align-items-center">
                <ClockHistory className="me-2" />
                Déclarer ma présence
              </Nav.Link>
            </Nav.Item>
          )}
          
          {(isAdmin || isChefService) && (
            <Nav.Item>
              <Nav.Link as={Link} to="/presences/validation" active={location.pathname === '/presences/validation'} className="d-flex align-items-center">
                <PersonCheck className="me-2" />
                Valider les présences
              </Nav.Link>
            </Nav.Item>
          )}
        </>
      )}

      {/* Gestion des rendez-vous (Secrétaire) */}
      {(isAdmin || isSecretaire) && (
        <>
          <div className="text-uppercase small text-muted mt-3 mb-1 px-3">Rendez-vous</div>
          
          <Nav.Item>
            <Nav.Link as={Link} to="/rendez-vous" active={location.pathname === '/rendez-vous'} className="d-flex align-items-center">
              <Calendar2Plus className="me-2" />
              Prendre RDV
            </Nav.Link>
          </Nav.Item>
          
          <Nav.Item>
            <Nav.Link as={Link} to="/planning" active={location.pathname === '/planning'} className="d-flex align-items-center">
              <Calendar2Check className="me-2" />
              Planning
            </Nav.Link>
          </Nav.Item>
        </>
      )}

      {/* Rapports et statistiques */}
      {(isAdmin || isChefService) && (
        <>
          <div className="text-uppercase small text-muted mt-3 mb-1 px-3">Rapports</div>
          
          <Nav.Item>
            <Nav.Link as={Link} to="/rapports" active={location.pathname === '/rapports'} className="d-flex align-items-center">
              <FileEarmarkText className="me-2" />
              Rapports
            </Nav.Link>
          </Nav.Item>
          
          <Nav.Item>
            <Nav.Link as={Link} to="/statistiques" active={location.pathname === '/statistiques'} className="d-flex align-items-center">
              <GraphUp className="me-2" />
              Statistiques
            </Nav.Link>
          </Nav.Item>
        </>
      )}

      {/* Administration (Admin) */}
      {isAdmin && (
        <>
          <div className="text-uppercase small text-muted mt-3 mb-1 px-3">Administration</div>
          
          <Nav.Item>
            <Nav.Link as={Link} to="/parametres" active={location.pathname === '/parametres'} className="d-flex align-items-center">
              <Gear className="me-2" />
              Paramètres
            </Nav.Link>
          </Nav.Item>
        </>
      )}

      {/* Déconnexion */}
      <div className="mt-auto pt-3 border-top">
        <Nav.Item>
          <Nav.Link onClick={onLogout} className="d-flex align-items-center text-danger">
            <BoxArrowRight className="me-2" />
            Déconnexion
          </Nav.Link>
        </Nav.Item>
      </div>
    </Nav>
  );
};

export default MainMenu;
