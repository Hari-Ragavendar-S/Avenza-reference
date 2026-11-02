import { useState } from 'react';

export default function SearchFilter({ onSearch, onDateFilter, showDateFilter = true }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleDateFilter = () => {
    if (onDateFilter) {
      onDateFilter({ from: dateFrom, to: dateTo });
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    if (onSearch) onSearch('');
    if (onDateFilter) onDateFilter({ from: '', to: '' });
  };

  return (
    <div className="search-filter-container">
      <div className="search-filter-row">
        {/* Search Input */}
        <div className="search-input-wrapper">
          <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={() => handleSearch('')} className="clear-search-btn">
              <svg className="clear-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        {showDateFilter && (
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
          >
            <svg className="filter-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {(dateFrom || dateTo) && <span className="filter-active-dot"></span>}
          </button>
        )}
      </div>

      {/* Date Filters (collapsible) */}
      {showDateFilter && showFilters && (
        <div className="date-filters">
          <div className="date-filter-group">
            <label className="date-label">From Date:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="date-filter-group">
            <label className="date-label">To Date:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="date-filter-actions">
            <button onClick={handleDateFilter} className="apply-filter-btn">
              Apply
            </button>
            <button onClick={handleClearFilters} className="clear-filter-btn">
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
