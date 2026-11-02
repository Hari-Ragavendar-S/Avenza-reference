import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import marketDataService from '../services/marketData';
import { usePageLoader } from '../hooks/usePageLoader';
import PageLoader from '../components/PageLoader';
import '../styles/Trading.css';

function Trading() {
  const pageLoading = usePageLoader(3000);
  const [selectedPair, setSelectedPair] = useState('BTC/USD');
  const [orderType, setOrderType] = useState('buy');
  const [limitType, setLimitType] = useState('market');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [timeframe, setTimeframe] = useState('1D');
  const [chartData, setChartData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    loadChartData();
    const interval = setInterval(() => {
      setCurrentPrice(prev => prev + (Math.random() - 0.5) * 100);
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedPair, timeframe]);

  const loadChartData = async () => {
    const days = timeframe === '1H' ? 1 : timeframe === '4H' ? 2 : timeframe === '1D' ? 7 : timeframe === '1W' ? 30 : 90;
    const data = await marketDataService.getMarketHistory(selectedPair, days);
    
    const formattedData = data.map(item => ({
      time: new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      price: item.price
    }));

    setChartData(formattedData);
    if (formattedData.length > 0) {
      setCurrentPrice(formattedData[formattedData.length - 1].price);
    }
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    setShowOrderModal(true);
    setTimeout(() => {
      setShowOrderModal(false);
      setAmount('');
      setPrice('');
    }, 3000);
  };

  const estimatedTotal = amount && price ? (parseFloat(amount) * parseFloat(price)).toFixed(2) : '0.00';
  const fee = estimatedTotal * 0.001;

  if (pageLoading) {
    return <PageLoader message="SYNCING LIVE RATES..." />;
  }

  return (
    <div className="trading-page">
      <div className="trading-header">
        <div className="container">
          <div className="pair-selector">
            <select value={selectedPair} onChange={(e) => setSelectedPair(e.target.value)}>
              <option value="BTC/USD">BTC/USD</option>
              <option value="ETH/USD">ETH/USD</option>
              <option value="USD/EUR">USD/EUR</option>
              <option value="USD/GBP">USD/GBP</option>
              <option value="USD/JPY">USD/JPY</option>
            </select>
          </div>
          <div className="pair-info">
            <div className="current-price">${currentPrice.toFixed(2)}</div>
            <div className="price-change positive">+2.35%</div>
          </div>
        </div>
      </div>

      <div className="container trading-container">
        <div className="trading-main">
          <div className="chart-section">
            <div className="chart-controls">
              <div className="timeframe-selector">
                {['1H', '4H', '1D', '1W', '1M'].map(tf => (
                  <button
                    key={tf}
                    className={`timeframe-btn ${timeframe === tf ? 'active' : ''}`}
                    onClick={() => setTimeframe(tf)}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="rgba(255,255,255,0.5)"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.5)"
                    tick={{ fontSize: 12 }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card-bg)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="var(--primary-color)" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="market-info-section">
            <h3>Market Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">24H High</span>
                <span className="info-value">${(currentPrice * 1.05).toFixed(2)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">24H Low</span>
                <span className="info-value">${(currentPrice * 0.95).toFixed(2)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">24H Volume</span>
                <span className="info-value">$2.5B</span>
              </div>
              <div className="info-item">
                <span className="info-label">Market Cap</span>
                <span className="info-value">$850B</span>
              </div>
            </div>
          </div>
        </div>

        <div className="order-panel">
          <div className="order-type-selector">
            <button
              className={`order-type-btn ${orderType === 'buy' ? 'active buy' : ''}`}
              onClick={() => setOrderType('buy')}
            >
              BUY
            </button>
            <button
              className={`order-type-btn ${orderType === 'sell' ? 'active sell' : ''}`}
              onClick={() => setOrderType('sell')}
            >
              SELL
            </button>
          </div>

          <div className="limit-type-selector">
            <button
              className={`limit-btn ${limitType === 'market' ? 'active' : ''}`}
              onClick={() => setLimitType('market')}
            >
              MARKET
            </button>
            <button
              className={`limit-btn ${limitType === 'limit' ? 'active' : ''}`}
              onClick={() => setLimitType('limit')}
            >
              LIMIT
            </button>
          </div>

          <form onSubmit={handlePlaceOrder} className="order-form">
            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            {limitType === 'limit' && (
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="order-summary">
              <div className="summary-row">
                <span>Estimated Total</span>
                <span>${estimatedTotal}</span>
              </div>
              <div className="summary-row">
                <span>Fee (0.1%)</span>
                <span>${fee.toFixed(2)}</span>
              </div>
            </div>

            <button type="submit" className={`btn-order ${orderType}`}>
              PLACE {orderType.toUpperCase()} ORDER
            </button>
          </form>

          <div className="order-disclaimer">
            <p>⚠️ Demo Trading Mode</p>
            <p>This is a demonstration interface. No real trades are executed.</p>
          </div>
        </div>
      </div>

      {showOrderModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3>Demo Order Submitted</h3>
            <p>Your demo order has been placed successfully</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Trading;
