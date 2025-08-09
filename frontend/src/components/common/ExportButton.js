import React, { useState } from 'react';
import { Button, Dropdown, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Download, FileEarmarkExcel, FileEarmarkText, FileEarmarkPdf } from 'react-bootstrap-icons';
import { exportData } from '../../utils/exportUtils';

const ExportButton = ({
  data = [],
  fileName = 'export',
  title = 'Export',
  columns = [],
  disabled = false,
  buttonText = 'Exporter',
  buttonVariant = 'outline-secondary',
  buttonSize = 'sm',
  showIcon = true,
  className = '',
  onExportStart = () => {},
  onExportComplete = () => {},
  onExportError = (error) => { console.error('Erreur lors de l\'export:', error); },
  availableFormats = ['excel', 'csv', 'pdf'],
  tooltip = 'Exporter les données',
  placement = 'bottom'
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportFormat, setLastExportFormat] = useState(null);

  const handleExport = async (format) => {
    if (!data || data.length === 0 || disabled) return;
    
    try {
      setIsExporting(true);
      setLastExportFormat(format);
      onExportStart(format);
      
      const success = await exportData(
        format,
        data,
        fileName,
        title,
        columns
      );
      
      if (success) {
        onExportComplete(format);
      } else {
        throw new Error(`Échec de l'export au format ${format}`);
      }
    } catch (error) {
      console.error(`Erreur lors de l'export ${format}:`, error);
      onExportError(error, format);
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'excel':
        return <FileEarmarkExcel className="me-1" />;
      case 'csv':
        return <FileEarmarkText className="me-1" />;
      case 'pdf':
        return <FileEarmarkPdf className="me-1" />;
      default:
        return <Download className="me-1" />;
    }
  };

  const getFormatLabel = (format) => {
    switch (format) {
      case 'excel':
        return 'Excel (.xlsx)';
      case 'csv':
        return 'CSV (.csv)';
      case 'pdf':
        return 'PDF (.pdf)';
      default:
        return format;
    }
  };

  // Si un seul format est disponible, affichez un simple bouton
  if (availableFormats.length === 1) {
    const format = availableFormats[0];
    const isCurrentlyExporting = isExporting && lastExportFormat === format;
    
    return (
      <OverlayTrigger
        overlay={<Tooltip>{tooltip} ({getFormatLabel(format)})</Tooltip>}
        placement={placement}
      >
        <Button
          variant={buttonVariant}
          size={buttonSize}
          disabled={disabled || isExporting}
          onClick={() => handleExport(format)}
          className={className}
        >
          {isCurrentlyExporting ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-1"
              />
              Export en cours...
            </>
          ) : (
            <>
              {showIcon && getFormatIcon(format)}
              {buttonText}
            </>
          )}
        </Button>
      </OverlayTrigger>
    );
  }

  // Pour plusieurs formats, affichez un menu déroulant
  return (
    <Dropdown className={`d-inline-block ${className}`}>
      <OverlayTrigger
        overlay={<Tooltip>{tooltip}</Tooltip>}
        placement={placement}
      >
        <Dropdown.Toggle 
          variant={buttonVariant} 
          size={buttonSize}
          disabled={disabled || isExporting}
          id="dropdown-export"
        >
          {isExporting ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-1"
              />
              Export en cours...
            </>
          ) : (
            <>
              {showIcon && <Download className="me-1" />}
              {buttonText}
            </>
          )}
        </Dropdown.Toggle>
      </OverlayTrigger>

      <Dropdown.Menu>
        {availableFormats.map((format) => (
          <Dropdown.Item 
            key={format} 
            onClick={() => handleExport(format)}
            disabled={isExporting}
          >
            {getFormatIcon(format)}
            {getFormatLabel(format)}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default ExportButton;
