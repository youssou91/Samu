import React from 'react';
import { ProgressBar } from 'react-bootstrap';

const MetricCard = ({ title, value, icon, variant = 'primary', progress = null, className = '' }) => (
  <div className={`card border-0 shadow-sm mb-3 ${className}`}>
    <div className="card-body">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h6 className="text-uppercase text-muted mb-1 small">{title}</h6>
          <h4 className="mb-0">{value}</h4>
          {progress !== null && (
            <div className="mt-2">
              <ProgressBar now={progress} variant={variant} style={{ height: '4px' }} />
              <small className="text-muted">{progress}% complété</small>
            </div>
          )}
        </div>
        <div className={`bg-${variant} bg-opacity-10 p-3 rounded-circle`}>
          {React.cloneElement(icon, { size: 24, className: `text-${variant}` })}
        </div>
      </div>
    </div>
  </div>
);

export default MetricCard;
