import '../styles/TradingSplashScreen.css';

function TradingSplashScreen() {
  return (
    <div className="trading-splash">
      <div className="splash-content">
        {/* Blue Glowing Candlestick Pattern */}
        <div className="candlestick-chart">
          {/* Rising pattern */}
          <div className="candle" style={{ height: '30px' }}><div className="wick"></div><div className="body"></div></div>
          <div className="candle" style={{ height: '35px' }}><div className="wick"></div><div className="body"></div></div>
          <div className="candle" style={{ height: '40px' }}><div className="wick"></div><div className="body"></div></div>
          <div className="candle" style={{ height: '50px' }}><div className="wick"></div><div className="body"></div></div>
          <div className="candle" style={{ height: '55px' }}><div className="wick"></div><div className="body"></div></div>
          <div className="candle" style={{ height: '45px' }}><div className="wick"></div><div className="body"></div></div>
          <div className="candle" style={{ height: '60px' }}><div className="wick"></div><div className="body"></div></div>
          <div className="candle" style={{ height: '65px' }}><div className="wick"></div><div className="body"></div></div>
          <div className="candle" style={{ height: '70px' }}><div className="wick"></div><div className="body"></div></div>
          
          {/* Peak */}
          <div className="candle" style={{ height: '80px' }}><div className="wick"></div><div className="body"></div></div>
          <div className="candle" style={{ height: '90px' }}><div className="wick"></div><div className="body"></div></div>
          <div className="candle" style={{ height: '95px' }}><div className="wick"></div><div className="body"></div></div>
          <div className="candle" style={{ height: '100px' }}><div className="wick"></div><div className="body"></div></div>
          <div className="candle" style={{ height: '95px' }}><div className="wick"></div><div className="body"></div></div>
          <div className="candle" style={{ height: '90px' }}><div className="wick"></div><div className="body"></div></div>
          
          {/* Declining */}
          <div className="candle" style={{ height: '75px' }}><div className="wick"></div><div className="body"></div></div>
          <div className="candle" style={{ height: '70px' }}><div className="wick"></div><div className="body"></div></div>
          <div className="candle" style={{ height: '55px' }}><div className="wick"></div><div className="body"></div></div>
          <div className="candle" style={{ height: '50px' }}><div className="wick"></div><div className="body"></div></div>
          <div className="candle" style={{ height: '45px' }}><div className="wick"></div><div className="body"></div></div>
        </div>
      </div>
    </div>
  );
}

export default TradingSplashScreen;
