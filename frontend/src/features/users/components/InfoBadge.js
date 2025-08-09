import React from 'react';
import { Badge } from 'react-bootstrap';

const InfoBadge = ({ icon, label, variant, className = '' }) => (
  <Badge bg={variant} className={`d-inline-flex align-items-center ${className}`}>
    {icon}
    <span className="ms-1">{label}</span>
  </Badge>
);

export default InfoBadge;
