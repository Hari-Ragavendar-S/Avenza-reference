import { useMarketData } from '../hooks/useMarketData';
import '../styles/MarketTicker.css';

function MarketTicker() {
  const { markets, loading } = useMarketData(true);

  if (loading && markets.length === 0) {
    return (
      <div className="market-ticker">
        <div className="ticker-content">
          <div className="ticker-item skeleton">
            <span className="ticker-pair">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  const displayMarkets = markets.slice(0, 10);

  return (
    <div className="market-ticker">
      <div className="ticker-status">
        <span className="live-indicator">● LIVE</span>
      </div>
      <div className="ticker-content">
        {[...displayMarkets, ...displayMarkets].map((market, index) => (
          <div key={`${market.pair}-${index}`} className="ticker-item">
            <span className="ticker-pair">{market.pair}</span>
            <span className="ticker-price">${market.price.toFixed(market.type === 'forex' ? 4 : 2)}</span>
            <span className={`ticker-change ${market.change24h >= 0 ? 'positive' : 'negative'}`}>
              {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MarketTicker;
