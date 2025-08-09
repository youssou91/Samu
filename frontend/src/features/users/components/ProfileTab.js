import React from 'react';
import { ListGroup, Tab } from 'react-bootstrap';
import { 
  PersonBadgeFill, 
  BriefcaseFill, 
  CalendarDateFill,
  EnvelopeFill,
  TelephoneFill,
  GeoAltFill,
  ClockHistory,
  CheckCircleFill
} from 'react-bootstrap-icons';
import MetricCard from './MetricCard';

const ProfileTab = ({ user, userStats, formatDate, formatPhone }) => (
  <Tab.Pane eventKey="profile">
    <h5 className="mb-3 fw-bold">Informations personnelles</h5>
    <ListGroup variant="flush" className="mb-4">
      <ListGroup.Item className="d-flex align-items-center">
        <div className="me-3 text-primary">
          <PersonBadgeFill size={20} />
        </div>
        <div className="flex-grow-1">
          <div className="small text-muted">Nom complet</div>
          <div className="fw-medium">{user.name || 'Non spécifié'}</div>
        </div>
      </ListGroup.Item>
      
      <ListGroup.Item className="d-flex align-items-center">
        <div className="me-3 text-primary">
          <EnvelopeFill size={18} />
        </div>
        <div className="flex-grow-1">
          <div className="small text-muted">Email</div>
          <div className="fw-medium">
            <a href={`mailto:${user.email}`} className="text-decoration-none">
              {user.email || 'Non spécifié'}
            </a>
          </div>
        </div>
      </ListGroup.Item>
      
      <ListGroup.Item className="d-flex align-items-center">
        <div className="me-3 text-primary">
          <TelephoneFill size={18} />
        </div>
        <div className="flex-grow-1">
          <div className="small text-muted">Téléphone</div>
          <div className="fw-medium">
            {user.phone ? (
              <a href={`tel:${user.phone}`} className="text-decoration-none">
                {formatPhone(user.phone)}
              </a>
            ) : 'Non spécifié'}
          </div>
        </div>
      </ListGroup.Item>
      
      <ListGroup.Item className="d-flex align-items-center">
        <div className="me-3 text-primary">
          <BriefcaseFill size={18} />
        </div>
        <div className="flex-grow-1">
          <div className="small text-muted">Rôle</div>
          <div className="fw-medium">
            {user.role === 'admin' ? 'Administrateur' : 
             user.role === 'teacher' ? 'Enseignant' : 'Étudiant'}
          </div>
        </div>
      </ListGroup.Item>
      
      <ListGroup.Item className="d-flex align-items-center">
        <div className="me-3 text-primary">
          <CalendarDateFill size={18} />
        </div>
        <div className="flex-grow-1">
          <div className="small text-muted">Dernière activité</div>
          <div className="fw-medium">
            {user.lastLogin 
              ? formatDate(user.lastLogin, true) 
              : 'Aucune activité enregistrée'}
          </div>
        </div>
      </ListGroup.Item>
    </ListGroup>
    
    {/* Statistiques */}
    <h5 className="border-bottom pb-2 mb-3">
      <ClockHistory className="me-2 text-primary" />
      Activité récente
    </h5>
    
    <div className="row">
      <div className="col-md-4">
        <MetricCard 
          title="Tâches terminées"
          value={userStats.completedTasks}
          icon={<CheckCircleFill />}
          variant="success"
        />
      </div>
      <div className="col-md-4">
        <MetricCard 
          title="Tâches en attente"
          value={userStats.pendingTasks}
          icon={<ClockHistory />}
          variant="warning"
        />
      </div>
      <div className="col-md-4">
        <MetricCard 
          title="Taux de réussite"
          value={`${userStats.successRate}%`}
          icon={<ClockHistory />}
          variant="info"
          progress={userStats.successRate}
        />
      </div>
    </div>
  </Tab.Pane>
);

export default ProfileTab;
