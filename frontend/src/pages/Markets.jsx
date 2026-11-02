import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMarketData } from '../hooks/useMarketData';
import { usePageLoader } from '../hooks/usePageLoader';
import PageLoader from '../components/PageLoader';
import '../styles/Markets.css';

function Markets() {
  const pageLoading = usePageLoader(3000);
  const { markets, loading, lastUpdate } = useMarketData(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('avenza-watchlist') || '[]');
    setWatchlist(saved);
  }, []);

  const toggleWatchlist = (pair) => {
    let updated;
    if (watchlist.includes(pair)) {
      updated = watchlist.filter(p => p !== pair);
    } else {
      updated = [...watchlist, pair];
    }
    setWatchlist(updated);
    localStorage.setItem('avenza-watchlist', JSON.stringify(updated));
  };

  const filteredMarkets = markets.filter(market => {
    const matchesSearch = market.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (market.name && market.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || 
                          (selectedCategory === 'favorites' && watchlist.includes(market.pair)) ||
                          (selectedCategory === market.type);
    return matchesSearch && matchesCategory;
  });

  const getTimeSinceUpdate = () => {
    if (!lastUpdate) return '';
    const seconds = Math.floor((Date.now() - lastUpdate) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  if (pageLoading) {
    return <PageLoader message="LOADING MARKET PRICES..." />;
  }

  return (
    <div className="markets-page">
      <div className="markets-hero">
        <div className="container">
          <h1>Market Explorer</h1>
          <p>Real-time prices and market data from global exchanges</p>
        </div>
      </div>

      <div className="container markets-container">
        <div className="markets-controls">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search markets (e.g., USD, BTC, EUR)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="category-filters">
            <button
              className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All Markets
            </button>
            <button
              className={`filter-btn ${selectedCategory === 'favorites' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('favorites')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              Favorites
            </button>
            <button
              className={`filter-btn ${selectedCategory === 'forex' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('forex')}
            >
              Forex
            </button>
            <button
              className={`filter-btn ${selectedCategory === 'crypto' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('crypto')}
            >
              Crypto
            </button>
          </div>

          <div className="market-status">
            <span className="live-indicator">● LIVE</span>
            {lastUpdate && <span className="update-time">Updated {getTimeSinceUpdate()}</span>}
          </div>
        </div>

        {loading && markets.length === 0 ? (
          <div className="markets-table-skeleton">
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="no-results">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <h3>No markets found</h3>
            <p>Try another search or browse all markets</p>
          </div>
        ) : (
          <div className="markets-table-wrapper">
            <table className="markets-table">
              <thead>
                <tr>
                  <th></th>
                  <th>PAIR</th>
                  <th>PRICE</th>
                  <th>24H CHANGE</th>
                  <th>HIGH</th>
                  <th>LOW</th>
                  <th>VOLUME</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredMarkets.map(market => (
                  <tr key={market.pair}>
                    <td>
                      <button
                        className={`watchlist-icon ${watchlist.includes(market.pair) ? 'active' : ''}`}
                        onClick={() => toggleWatchlist(market.pair)}
                        title={watchlist.includes(market.pair) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      >
                        <svg viewBox="0 0 24 24" fill={watchlist.includes(market.pair) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </td>
                    <td>
                      <div className="pair-cell">
                        <strong>{market.pair}</strong>
                        {market.name && <span className="pair-name">{market.name}</span>}
                      </div>
                    </td>
                    <td className="price-cell">
                      ${market.price ? market.price.toFixed(market.type === 'forex' ? 4 : 2) : 'N/A'}
                    </td>
                    <td className={market.change24h >= 0 ? 'positive' : 'negative'}>
                      {market.change24h ? (market.change24h >= 0 ? '+' : '') + market.change24h.toFixed(2) + '%' : 'N/A'}
                    </td>
                    <td>
                      ${market.high24h ? market.high24h.toFixed(market.type === 'forex' ? 4 : 2) : 'N/A'}
                    </td>
                    <td>
                      ${market.low24h ? market.low24h.toFixed(market.type === 'forex' ? 4 : 2) : 'N/A'}
                    </td>
                    <td>${market.volume ? (market.volume / 1000000).toFixed(2) + 'M' : 'N/A'}</td>
                    <td>
                      <Link to="/trading" className="btn-primary btn-sm">TRADE</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Markets;
