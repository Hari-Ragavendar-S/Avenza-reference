import { useEffect, useState } from 'react';
import logo from '../assets/image/image.png';
import '../styles/LoadingScreen.css';

function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-logo">
          <img src={logo} alt="AVENZA" className="loading-logo-image" />
        </div>
        <div className="loading-animation">
          <div className="chart-animation">
            <div className="chart-bar" style={{ animationDelay: '0s' }}></div>
            <div className="chart-bar" style={{ animationDelay: '0.1s' }}></div>
            <div className="chart-bar" style={{ animationDelay: '0.2s' }}></div>
            <div className="chart-bar" style={{ animationDelay: '0.3s' }}></div>
            <div className="chart-bar" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
        <div className="loading-text">
          <p>Loading Markets...</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
