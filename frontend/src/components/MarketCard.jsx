import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../styles/MarketCard.css';

function MarketCard({ market }) {
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  useEffect(() => {
    const watchlist = JSON.parse(localStorage.getItem('avenza-watchlist') || '[]');
    setIsInWatchlist(watchlist.includes(market.pair));
  }, [market.pair]);

  const toggleWatchlist = (e) => {
    e.preventDefault();
    const watchlist = JSON.parse(localStorage.getItem('avenza-watchlist') || '[]');
    
    if (isInWatchlist) {
      const updated = watchlist.filter(p => p !== market.pair);
      localStorage.setItem('avenza-watchlist', JSON.stringify(updated));
      setIsInWatchlist(false);
    } else {
      watchlist.push(market.pair);
      localStorage.setItem('avenza-watchlist', JSON.stringify(watchlist));
      setIsInWatchlist(true);
    }
  };

  return (
    <div className="market-card">
      <div className="market-card-header">
        <div className="market-info">
          <h3 className="market-pair">{market.pair}</h3>
          {market.name && <span className="market-name">{market.name}</span>}
        </div>
        <button 
          className={`watchlist-btn ${isInWatchlist ? 'active' : ''}`}
          onClick={toggleWatchlist}
          title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          <svg viewBox="0 0 24 24" fill={isInWatchlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      <div className="market-price">
        ${market.price.toFixed(market.type === 'forex' ? 4 : 2)}
      </div>

      <div className="market-stats">
        <div className="stat">
          <span className="stat-label">24H Change</span>
          <span className={`stat-value ${market.change24h >= 0 ? 'positive' : 'negative'}`}>
            {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
          </span>
        </div>
        {market.volume && (
          <div className="stat">
            <span className="stat-label">Volume</span>
            <span className="stat-value">
              ${(market.volume / 1000000).toFixed(2)}M
            </span>
          </div>
        )}
      </div>

      <div className="market-chart-mini">
        <svg viewBox="0 0 100 30">
          <path
            d="M 0 15 Q 25 10, 50 12 T 100 8"
            fill="none"
            stroke={market.change24h >= 0 ? 'var(--success-color)' : 'var(--danger-color)'}
            strokeWidth="1.5"
          />
        </svg>
      </div>

      <Link to="/trading" className="btn-primary btn-block">
        TRADE
      </Link>
    </div>
  );
}

export default MarketCard;
