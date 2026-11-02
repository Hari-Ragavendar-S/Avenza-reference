import { Link } from 'react-router-dom';
import { useMarketData } from '../hooks/useMarketData';
import '../styles/Hero.css';

function Hero() {
  const { markets } = useMarketData(true); // Get real-time market data
  
  // Find BTC and ETH prices from live data
  const btcMarket = markets.find(m => m.symbol === 'BTC') || { price: 43250, change24h: 2.35 };
  const ethMarket = markets.find(m => m.symbol === 'ETH') || { price: 2280, change24h: 1.85 };

  return (
    <section className="hero">
      <div className="container hero-container">
        <div className="hero-content">
          <h1 className="hero-title">
            TRADE SMARTER.<br />
            MOVE WITH THE MARKETS.
          </h1>
          <p className="hero-subtitle">
            Experience a modern trading platform designed to help you explore global markets,
            monitor real-time prices and analyze market movements through a clean and powerful interface.
          </p>
          <div className="hero-actions">
            <Link to="/trading" className="btn-primary btn-large">
              START TRADING
            </Link>
            <Link to="/markets" className="btn-outline btn-large">
              EXPLORE MARKETS
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="chart-container">
            <div className="price-card floating">
              <div className="price-label">BTC/USD</div>
              <div className="price-value">${btcMarket.price.toFixed(2)}</div>
              <div className={`price-change ${btcMarket.change24h >= 0 ? 'positive' : 'negative'}`}>
                {btcMarket.change24h >= 0 ? '+' : ''}{btcMarket.change24h.toFixed(2)}%
              </div>
            </div>

            <div className="price-card floating" style={{ animationDelay: '0.5s', top: '60%', right: '10%' }}>
              <div className="price-label">ETH/USD</div>
              <div className="price-value">${ethMarket.price.toFixed(2)}</div>
              <div className={`price-change ${ethMarket.change24h >= 0 ? 'positive' : 'negative'}`}>
                {ethMarket.change24h >= 0 ? '+' : ''}{ethMarket.change24h.toFixed(2)}%
              </div>
            </div>

            <div className="trading-chart">
              <svg viewBox="0 0 400 200" className="chart-svg">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  className="chart-line"
                  d="M 0 150 Q 50 120, 100 100 T 200 80 T 300 60 T 400 50"
                  fill="none"
                  stroke="var(--primary-color)"
                  strokeWidth="2"
                />
                <path
                  d="M 0 150 Q 50 120, 100 100 T 200 80 T 300 60 T 400 50 L 400 200 L 0 200 Z"
                  fill="url(#chartGradient)"
                />
              </svg>
            </div>

            <div className="glow-effect"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
