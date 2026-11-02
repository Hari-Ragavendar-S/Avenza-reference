import { usePageLoader } from '../hooks/usePageLoader';
import PageLoader from '../components/PageLoader';
import '../styles/FeaturesPage.css';

function FeaturesPage() {
  const pageLoading = usePageLoader(3000);

  if (pageLoading) return <PageLoader message="LOADING PLATFORM FEATURES..." />;

  return (
    <div className="features-page">
      <div className="features-hero">
        <div className="container">
          <h1>Platform Features</h1>
          <p>Everything you need for professional market trading and analysis</p>
        </div>
      </div>

      <div className="container features-container">
        <div className="features-grid">
          <div className="feature-detail">
          <div className="feature-icon-large">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h2>Live Market Data</h2>
          <p>
            Access real-time market prices from global exchanges. AVENZA integrates with leading
            market data providers to ensure you always have the most current information.
          </p>
          <ul>
            <li>Real-time price updates</li>
            <li>24-hour price changes and trends</li>
            <li>High, low, and volume data</li>
            <li>Multi-currency support</li>
          </ul>
        </div>

        <div className="feature-detail">
          <div className="feature-icon-large">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <h2>Advanced Charts</h2>
          <p>
            Professional charting tools with multiple timeframes and clean visualizations.
            Analyze market trends with precision.
          </p>
          <ul>
            <li>Multiple timeframe support (1H, 4H, 1D, 1W, 1M)</li>
            <li>Interactive chart controls</li>
            <li>Historical price data</li>
            <li>Responsive chart rendering</li>
          </ul>
        </div>

        <div className="feature-detail">
          <div className="feature-icon-large">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <h2>Market Discovery</h2>
          <p>
            Find and track markets that matter to you with powerful search and filtering capabilities.
          </p>
          <ul>
            <li>Fast search across all markets</li>
            <li>Category filters (Forex, Crypto)</li>
            <li>Custom watchlists</li>
            <li>Market comparison tools</li>
          </ul>
        </div>

        <div className="feature-detail">
          <div className="feature-icon-large">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h2>Watchlists</h2>
          <p>
            Create personalized watchlists to monitor your favorite trading pairs and never miss
            important market movements.
          </p>
          <ul>
            <li>One-click add/remove from watchlist</li>
            <li>Persistent storage across sessions</li>
            <li>Quick access to watched markets</li>
            <li>Real-time updates for watched pairs</li>
          </ul>
        </div>

        <div className="feature-detail">
          <div className="feature-icon-large">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <h2>Trading Interface</h2>
          <p>
            Clean, intuitive trading interface designed for fast order placement and market analysis.
          </p>
          <ul>
            <li>Buy/Sell order placement</li>
            <li>Market and limit order types</li>
            <li>Real-time order calculations</li>
            <li>Demo trading mode</li>
          </ul>
        </div>

        <div className="feature-detail">
          <div className="feature-icon-large">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <h2>Responsive Design</h2>
          <p>
            AVENZA works seamlessly across all devices. Trade and monitor markets from desktop,
            tablet, or mobile.
          </p>
          <ul>
            <li>Mobile-optimized interface</li>
            <li>Tablet-friendly layouts</li>
            <li>Desktop power user features</li>
            <li>Consistent experience everywhere</li>
          </ul>
        </div>

        <div className="feature-detail">
          <div className="feature-icon-large">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h2>Market Analytics</h2>
          <p>
            Comprehensive market statistics and analytics to help you understand market dynamics.
          </p>
          <ul>
            <li>24-hour price statistics</li>
            <li>Volume tracking</li>
            <li>Price change percentages</li>
            <li>Market trend indicators</li>
          </ul>
        </div>

        <div className="feature-detail">
          <div className="feature-icon-large">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
            </svg>
          </div>
          <h2>Theme Customization</h2>
          <p>
            Choose between dark and light modes to match your preference and reduce eye strain.
          </p>
          <ul>
            <li>Dark mode for low-light trading</li>
            <li>Light mode for daytime use</li>
            <li>Persistent theme selection</li>
            <li>Smooth theme transitions</li>
          </ul>
        </div>
        </div>
      </div>
    </div>
  );
}

export default FeaturesPage;
