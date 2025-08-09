import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { PencilFill, EnvelopeFill, PersonFill } from 'react-bootstrap-icons';
import InfoBadge from './InfoBadge';

const UserProfileHeader = ({ user, onEdit, onHide, roleInfo, statusInfo }) => (
  <Modal.Header closeButton className="bg-light">
    <Modal.Title className="fw-bold d-flex align-items-center">
      <PersonFill className="me-2" />
      Fiche Utilisateur
      <div className="ms-3">
        <InfoBadge 
          icon={roleInfo.icon}
          label={roleInfo.label}
          variant={roleInfo.variant}
          className="me-2"
        />
        <InfoBadge 
          icon={statusInfo.icon}
          label={statusInfo.label}
          variant={statusInfo.variant}
        />
      </div>
    </Modal.Title>
  </Modal.Header>
);

export default UserProfileHeader;
