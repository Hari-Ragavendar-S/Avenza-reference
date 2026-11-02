import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoSymbol from '../assets/image/a.png';
import logoName from '../assets/image/name.png';
import '../styles/Header.css';

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Hide header on login and register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    
    // CRITICAL: Always clean up on unmount to prevent scroll lock
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [mobileMenuOpen]);

  const toggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/markets', label: 'Markets' },
    { path: '/trading', label: 'Trading' },
    { path: '/about', label: 'About' },
    { path: '/features', label: 'Features' },
    { path: '/faq', label: 'FAQ' },
    { path: '/contact', label: 'Contact' }
  ];

  return (
    <>
      <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container header-container">
          <Link to="/" className="logo">
            <img src={logoSymbol} alt="AVENZA Symbol" className="logo-symbol-img" />
            <img src={logoName} alt="AVENZA" className="logo-name-img" />
          </Link>

          <nav className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
            {navLinks.map(link => {
              // Fix: Exact match for home, and proper path matching for others
              const isActive = location.pathname === link.path;
              
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              );
            })}
            
            {/* Mobile-only buttons */}
            <div className="mobile-menu-buttons">
              <Link to="/login" className="btn-text mobile-btn" onClick={closeMenu}>
                Login
              </Link>
              <Link to="/register" className="btn-primary mobile-btn" onClick={closeMenu}>
                Get Started
              </Link>
            </div>
          </nav>

          <div className="header-actions">
            <Link to="/login" className="btn-text">Login</Link>
            <Link to="/register" className="btn-primary">Get Started</Link>
            <button
              className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div 
          className="mobile-menu-overlay" 
          onClick={closeMenu}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}
    </>
  );
}

export default Header;
