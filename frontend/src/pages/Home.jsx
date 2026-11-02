import Hero from '../components/Hero';
import MarketTicker from '../components/MarketTicker';
import MarketCard from '../components/MarketCard';
import { useMarketData } from '../hooks/useMarketData';
import { usePageLoader } from '../hooks/usePageLoader';
import PageLoader from '../components/PageLoader';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import '../styles/Home.css';

function Home() {
  const { markets, loading } = useMarketData(true);

  return (
    <div className="home-page">
      <Hero />
      <MarketTicker />

      {/* Public Deposit Section */}
      <section className="section" style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))',
        padding: '60px 0',
        borderTop: '1px solid rgba(16,185,129,0.2)',
        borderBottom: '1px solid rgba(16,185,129,0.2)'
      }}>
        <div className="container">
          <div style={{
            maxWidth: '900px',
            margin: '0 auto',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              💰
            </div>
            <h2 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              PUBLIC DEPOSIT & SHARE
            </h2>
            <p style={{
              fontSize: '18px',
              color: 'var(--text-secondary)',
              marginBottom: '32px',
              lineHeight: '1.6'
            }}>
              Deposit USDT and share it equally with all AVENZA users. 
              Anyone can deposit from anywhere – instant distribution to the entire community!
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '32px',
              textAlign: 'center'
            }}>
              <div style={{
                background: 'rgba(74, 144, 226, 0.1)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(74, 144, 226, 0.2)'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4a90e2', marginBottom: '4px' }}>
                  0%
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Fee
                </div>
              </div>
              
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>
                  ⚡
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Instant
                </div>
              </div>
              
              <div style={{
                background: 'rgba(168, 85, 247, 0.1)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(168, 85, 247, 0.2)'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#a855f7', marginBottom: '4px' }}>
                  👥
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Equal Share
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <Link 
                to="/public-deposit" 
                className="btn-primary btn-large"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  fontSize: '18px',
                  padding: '16px 40px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <span style={{ fontSize: '24px' }}>💰</span>
                DEPOSIT & SHARE NOW
              </Link>
              
              <Link 
                to="/top-up-user" 
                className="btn-primary btn-large"
                style={{
                  background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                  fontSize: '18px',
                  padding: '16px 40px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <span style={{ fontSize: '24px' }}>👤</span>
                TOP UP USER
              </Link>
            </div>

            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(74, 144, 226, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(74, 144, 226, 0.1)'
            }}>
              <p style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: '1.6'
              }}>
                ✨ <strong style={{ color: 'var(--text-primary)' }}>No account required!</strong> Anyone can deposit USDT (BEP20) and it will be distributed equally to all active AVENZA users instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Market Overview Section */}
      <section className="section market-overview">
        <div className="container">
          <div className="section-header">
            <h2>EXPLORE GLOBAL MARKETS</h2>
            <p>Access real-time market data from forex, crypto, and more</p>
          </div>

          <div className="markets-grid">
            {loading && markets.length === 0 ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="market-card skeleton">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-price"></div>
                </div>
              ))
            ) : (
              markets.slice(0, 6).map(market => (
                <MarketCard key={market.pair} market={market} />
              ))
            )}
          </div>

          <div className="section-footer">
            <Link to="/markets" className="btn-outline">View All Markets</Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section features-section">
        <div className="container">
          <div className="section-header">
            <h2>POWERFUL TOOLS. SIMPLIFIED TRADING.</h2>
            <p>Everything you need to explore and analyze financial markets</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3>Real-Time Market Data</h3>
              <p>Access live prices and market movements from global exchanges</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <h3>Advanced Charts</h3>
              <p>Professional charting tools with multiple timeframes and indicators</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3>Market Analytics</h3>
              <p>Comprehensive market analysis and trending pair discovery</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <h3>Watchlists</h3>
              <p>Create custom watchlists to track your favorite markets</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <h3>Responsive Platform</h3>
              <p>Seamless experience across desktop, tablet, and mobile devices</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3>Fast Trading Interface</h3>
              <p>Quick order placement with instant market feedback</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why AVENZA Section */}
      <section className="section why-avenza">
        <div className="container">
          <div className="section-header">
            <h2>WHY CHOOSE AVENZA?</h2>
            <p>Built for traders who demand excellence</p>
          </div>

          <div className="why-grid">
            <div className="why-item">
              <div className="why-number">01</div>
              <h3>Real-Time Market Visibility</h3>
              <p>Stay updated with live market data from multiple sources</p>
            </div>

            <div className="why-item">
              <div className="why-number">02</div>
              <h3>Professional Trading Experience</h3>
              <p>Enterprise-grade platform designed for serious traders</p>
            </div>

            <div className="why-item">
              <div className="why-number">03</div>
              <h3>Modern Interface</h3>
              <p>Clean, intuitive design that puts data first</p>
            </div>

            <div className="why-item">
              <div className="why-number">04</div>
              <h3>Advanced Market Analytics</h3>
              <p>Deep insights into market trends and movements</p>
            </div>

            <div className="why-item">
              <div className="why-number">05</div>
              <h3>Responsive Across Devices</h3>
              <p>Trade anywhere with full mobile and tablet support</p>
            </div>

            <div className="why-item">
              <div className="why-number">06</div>
              <h3>Easy Market Discovery</h3>
              <p>Find and track markets that matter to you</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>HOW IT WORKS</h2>
            <p>Start trading in three simple steps</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3>EXPLORE</h3>
              <p>Explore global markets and discover trading opportunities across forex, crypto, and more</p>
            </div>

            <div className="step-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <h3>ANALYZE</h3>
              <p>Review live prices and market charts with professional trading tools</p>
            </div>

            <div className="step-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <h3>TRADE</h3>
              <p>Use the demo trading interface to practice your strategies</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="section security-section">
        <div className="container">
          <div className="section-header">
            <h2>SECURE & TRANSPARENT</h2>
            <p>Your experience matters to us</p>
          </div>

          <div className="security-grid">
            <div className="security-card">
              <div className="security-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3>Secure User Experience</h3>
              <p>Platform designed with security best practices</p>
            </div>

            <div className="security-card">
              <div className="security-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3>Data Protection</h3>
              <p>Your information is handled with care</p>
            </div>

            <div className="security-card">
              <div className="security-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <h3>Transparent Market Information</h3>
              <p>Clear, accurate market data you can trust</p>
            </div>

            <div className="security-card">
              <div className="security-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>User Controls</h3>
              <p>Full control over your trading preferences</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>READY TO EXPLORE THE MARKETS?</h2>
            <p>Discover live market movements and experience the AVENZA trading platform.</p>
            <div className="cta-actions">
              <Link to="/register" className="btn-primary btn-large">GET STARTED</Link>
              <Link to="/markets" className="btn-outline btn-large">EXPLORE MARKETS</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Preview Section */}
      <section className="section faq-preview">
        <div className="container">
          <div className="section-header">
            <h2>FREQUENTLY ASKED QUESTIONS</h2>
            <p>Find answers to common questions</p>
          </div>

          <div className="faq-list">
            <details className="faq-item">
              <summary>What is AVENZA?</summary>
              <p>AVENZA is a modern trading platform designed for exploring global financial markets. We provide real-time market data, advanced charting tools, and a clean interface for market analysis.</p>
            </details>

            <details className="faq-item">
              <summary>What markets can I explore?</summary>
              <p>You can explore forex pairs, cryptocurrencies, and other financial instruments. Our platform provides live data from multiple sources.</p>
            </details>

            <details className="faq-item">
              <summary>Are market prices updated in real time?</summary>
              <p>Yes, we display live market prices from external market data providers. Prices update automatically to reflect current market conditions.</p>
            </details>

            <details className="faq-item">
              <summary>Is AVENZA responsive on mobile?</summary>
              <p>Absolutely! AVENZA is fully responsive and works seamlessly on desktop, tablet, and mobile devices.</p>
            </details>
          </div>

          <div className="section-footer">
            <Link to="/faq" className="btn-outline">View All FAQs</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
