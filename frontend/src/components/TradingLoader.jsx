import { useEffect } from 'react';
import '../styles/TradingLoader.css';

function TradingLoader({ message = 'LOADING...' }) {
  useEffect(() => {
    // Add class to body when loader is mounted
    document.body.classList.add('page-loading');
    
    // Remove class when loader unmounts
    return () => {
      document.body.classList.remove('page-loading');
    };
  }, []);

  return (
    <div className="trading-loader">
      <div className="loader-content">
        {/* Wave Line with Arrow attached */}
        <div className="loader-wave">
          <svg viewBox="0 0 350 100" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="40%" stopColor="#10b981" stopOpacity="1" />
                <stop offset="80%" stopColor="#3b82f6" stopOpacity="1" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="1" />
              </linearGradient>
            </defs>
            
            <g className="wave-group">
              {/* Curve + straight line + arrow */}
              <path
                className="wave-path"
                d="M 20 50 Q 50 30, 80 50 T 140 50 Q 170 30, 200 50 T 260 50 L 285 50"
                fill="none"
                stroke="url(#waveGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Triangle arrow pointing RIGHT → */}
              <polygon
                className="arrow-head"
                points="310,50 285,42 285,58"
                fill="#60a5fa"
              />
            </g>
          </svg>
        </div>

        {/* Message */}
        <div className="loader-message">{message}</div>
      </div>
    </div>
  );
}

export default TradingLoader;
