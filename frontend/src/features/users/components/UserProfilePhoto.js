import React from 'react';
import { PersonFill } from 'react-bootstrap-icons';

const UserProfilePhoto = ({ statusVariant }) => (
  <div className="position-relative d-inline-block mb-3">
    <div 
      className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto overflow-hidden" 
      style={{ 
        width: '150px', 
        height: '150px', 
        fontSize: '4.5rem',
        border: `4px solid var(--bs-${statusVariant}-bg-subtle)`,
        boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.05)'
      }}
    >
      <PersonFill className="text-muted" />
    </div>
    <div 
      className="position-absolute bottom-0 end-0 bg-white rounded-circle p-1 border"
      style={{
        width: '36px',
        height: '36px',
        borderColor: `var(--bs-${statusVariant}) !important`
      }}
    >
      <div 
        className="w-100 h-100 rounded-circle d-flex align-items-center justify-content-center"
        style={{ 
          backgroundColor: `var(--bs-${statusVariant}-bg-subtle)`,
          color: `var(--bs-${statusVariant})`
        }}
      >
        {statusVariant === 'success' ? 'A' : 'I'}
      </div>
    </div>
  </div>
);

export default UserProfilePhoto;
