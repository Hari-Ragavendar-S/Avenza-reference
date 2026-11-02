import { usePageLoader } from '../hooks/usePageLoader';
import PageLoader from '../components/PageLoader';
import '../styles/About.css';

function About() {
  const pageLoading = usePageLoader(3000);

  if (pageLoading) return <PageLoader message="INITIALIZING AVENZA..." />;

  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="container">
          <h1>About AVENZA</h1>
          <p>A modern platform for exploring global financial markets</p>
        </div>
      </div>

      <div className="container about-container">
        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            AVENZA is built to democratize access to global financial markets. We provide traders and
            investors with professional-grade tools, real-time market data, and intuitive interfaces
            that make market exploration accessible to everyone.
          </p>
        </section>

        <section className="about-section">
          <h2>Our Vision</h2>
          <p>
            We envision a world where anyone can confidently navigate financial markets with clarity
            and precision. AVENZA combines cutting-edge technology with user-centered design to create
            a platform that serves both beginners and experienced traders.
          </p>
        </section>

        <section className="about-section">
          <h2>Our Approach</h2>
          <div className="approach-grid">
            <div className="approach-card">
              <h3>Data-First</h3>
              <p>Real-time market data from trusted sources powers every decision</p>
            </div>
            <div className="approach-card">
              <h3>User-Centered</h3>
              <p>Clean, intuitive design that prioritizes user experience</p>
            </div>
            <div className="approach-card">
              <h3>Transparent</h3>
              <p>Clear information with no hidden complexities</p>
            </div>
            <div className="approach-card">
              <h3>Accessible</h3>
              <p>Professional tools available to traders at all levels</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Technology</h2>
          <p>
            AVENZA leverages modern web technologies to deliver fast, responsive, and reliable
            market experiences. Our platform is built on cutting-edge frameworks and integrates
            with leading market data providers to ensure accuracy and timeliness.
          </p>
        </section>

        <section className="about-section">
          <h2>Market Experience</h2>
          <p>
            From forex to cryptocurrencies, AVENZA provides comprehensive coverage of major financial
            markets. Our platform displays live prices, historical charts, and market analytics to
            help you understand market dynamics and make informed decisions.
          </p>
        </section>

        <section className="about-section values-section">
          <h2>Why Choose AVENZA?</h2>
          <div className="values-grid">
            <div className="value-item">
              <div className="value-icon">✓</div>
              <h3>Professional Tools</h3>
              <p>Enterprise-grade charting and analytics</p>
            </div>
            <div className="value-item">
              <div className="value-icon">✓</div>
              <h3>Live Market Data</h3>
              <p>Real-time prices from global exchanges</p>
            </div>
            <div className="value-item">
              <div className="value-icon">✓</div>
              <h3>Modern Design</h3>
              <p>Clean interface that works everywhere</p>
            </div>
            <div className="value-item">
              <div className="value-icon">✓</div>
              <h3>Continuous Innovation</h3>
              <p>Regular updates and feature improvements</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default About;
