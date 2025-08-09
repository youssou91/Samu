import React from 'react';
import { Nav } from 'react-bootstrap';
import { 
  PersonFill, 
  Activity, 
  GearFill 
} from 'react-bootstrap-icons';

const UserProfileTabs = ({ activeKey, onSelect }) => (
  <Nav 
    variant="tabs" 
    className="border-top border-bottom" 
    style={{ backgroundColor: '#f8f9fa' }}
    activeKey={activeKey}
    onSelect={onSelect}
  >
    <Nav.Item>
      <Nav.Link eventKey="profile" className="text-dark">
        <PersonFill className="me-1" /> Profil
      </Nav.Link>
    </Nav.Item>
    <Nav.Item>
      <Nav.Link eventKey="activity" className="text-dark">
        <Activity className="me-1" /> Activité
      </Nav.Link>
    </Nav.Item>
    <Nav.Item>
      <Nav.Link eventKey="settings" className="text-dark">
        <GearFill className="me-1" /> Paramètres
      </Nav.Link>
    </Nav.Item>
  </Nav>
);

export default UserProfileTabs;
