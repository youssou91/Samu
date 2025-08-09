import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button, InputGroup, Dropdown, Badge } from 'react-bootstrap';
import { Funnel, X, Search, FunnelFill } from 'react-bootstrap-icons';

export const SearchAndFilter = ({
  onSearch,
  onFilterChange,
  filterOptions = {},
  searchPlaceholder = 'Rechercher...',
  filters = [],
  showActiveFilters = true,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // Mettre à jour les filtres actifs quand filterOptions change
  useEffect(() => {
    const newActiveFilters = {};
    filters.forEach(filter => {
      if (filterOptions[filter.id] && filterOptions[filter.id] !== '') {
        newActiveFilters[filter.id] = filterOptions[filter.id];
      }
    });
    setActiveFilters(newActiveFilters);
  }, [filterOptions, filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleFilterChange = (filterId, value) => {
    onFilterChange({ ...filterOptions, [filterId]: value });
  };

  const removeFilter = (filterId) => {
    const newFilters = { ...filterOptions };
    delete newFilters[filterId];
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    onFilterChange({});
    setSearchTerm('');
    onSearch('');
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className={`search-and-filter ${className}`}>
      <Form onSubmit={handleSearch} className="mb-3">
        <Row className="g-2">
          <Col md={showFilters ? 8 : 10}>
            <InputGroup>
              <InputGroup.Text className="bg-white">
                <Search />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-start-0"
              />
              {hasActiveFilters && (
                <Button 
                  variant="outline-secondary" 
                  onClick={clearAllFilters}
                  title="Effacer tous les filtres"
                >
                  <X />
                </Button>
              )}
              <Button 
                variant={hasActiveFilters ? "primary" : "outline-secondary"}
                onClick={() => setShowFilters(!showFilters)}
                title={hasActiveFilters ? `${Object.keys(activeFilters).length} filtre(s) actif(s)` : "Filtres"}
              >
                <FunnelFill className={hasActiveFilters ? "text-white" : ""} />
                {hasActiveFilters && (
                  <Badge bg="light" text="primary" className="ms-1">
                    {Object.keys(activeFilters).length}
                  </Badge>
                )}
              </Button>
            </InputGroup>
          </Col>
          <Col md={showFilters ? 4 : 2}>
            <div className="d-flex">
              <Button 
                type="submit" 
                variant="primary" 
                className="me-2 flex-grow-1"
              >
                Rechercher
              </Button>
              <Button 
                variant="outline-secondary"
                onClick={() => {
                  setSearchTerm('');
                  onSearch('');
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </Col>
        </Row>
      </Form>

      {/* Filtres avancés */}
      {showFilters && (
        <div className="advanced-filters p-3 bg-light rounded mb-3">
          <Row className="g-3">
            {filters.map((filter) => (
              <Col key={filter.id} md={4} sm={6}>
                <Form.Group>
                  <Form.Label className="small text-muted mb-1">
                    {filter.label}
                  </Form.Label>
                  {filter.type === 'select' ? (
                    <Form.Select
                      value={filterOptions[filter.id] || ''}
                      onChange={(e) => handleFilterChange(filter.id, e.target.value || null)}
                      size="sm"
                    >
                      <option value="">Tous</option>
                      {filter.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  ) : filter.type === 'date' ? (
                    <Form.Control
                      type="date"
                      value={filterOptions[filter.id] || ''}
                      onChange={(e) => handleFilterChange(filter.id, e.target.value || null)}
                      size="sm"
                    />
                  ) : (
                    <Form.Control
                      type="text"
                      placeholder={filter.placeholder || ''}
                      value={filterOptions[filter.id] || ''}
                      onChange={(e) => handleFilterChange(filter.id, e.target.value || null)}
                      size="sm"
                    />
                  )}
                </Form.Group>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Filtres actifs */}
      {showActiveFilters && hasActiveFilters && (
        <div className="active-filters mb-3">
          {filters
            .filter((filter) => activeFilters[filter.id])
            .map((filter) => {
              const value = activeFilters[filter.id];
              let displayValue = value;
              
              if (filter.type === 'select') {
                const selectedOption = filter.options.find(opt => opt.value === value);
                displayValue = selectedOption ? selectedOption.label : value;
              }
              
              return (
                <Badge 
                  key={filter.id} 
                  bg="light" 
                  text="dark" 
                  className="me-2 mb-2 d-inline-flex align-items-center"
                >
                  <span className="me-1">{filter.label}:</span>
                  <strong className="me-1">{displayValue}</strong>
                  <X 
                    size={12} 
                    className="cursor-pointer" 
                    onClick={() => removeFilter(filter.id)}
                  />
                </Badge>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;
