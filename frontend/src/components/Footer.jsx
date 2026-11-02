import { Link } from 'react-router-dom';
import logoSymbol from '../assets/image/a.png';
import logoName from '../assets/image/name.png';
import '../styles/Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <img src={logoSymbol} alt="AVENZA Symbol" className="footer-logo-symbol" />
              <img src={logoName} alt="AVENZA" className="footer-logo-name" />
            </div>
            <p className="footer-description">
              A modern platform for exploring global financial markets and market movements.
            </p>
          </div>

          <div className="footer-section">
            <h4>Platform</h4>
            <ul>
              <li><Link to="/markets">Markets</Link></li>
              <li><Link to="/trading">Trading</Link></li>
              <li><Link to="/features">Features</Link></li>
              <li><Link to="/about">About</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><a href="#help">Help</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><a href="#privacy">Privacy</a></li>
              <li><a href="#terms">Terms</a></li>
              <li><a href="#risk">Risk Disclosure</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 AVENZA. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
