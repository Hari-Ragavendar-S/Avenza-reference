import { usePageLoader } from '../hooks/usePageLoader';
import PageLoader from '../components/PageLoader';
import '../styles/FAQPage.css';

function FAQPage() {
  const pageLoading = usePageLoader(3000);

  if (pageLoading) return <PageLoader message="ANALYZING MARKET DATA..." />;

  return (
    <div className="faq-page">
      <div className="faq-hero">
        <div className="container">
          <h1>Frequently Asked Questions</h1>
          <p>Find answers to common questions about AVENZA</p>
        </div>
      </div>

      <div className="container faq-container">
        <div className="faq-section">
          <h2>General Questions</h2>
          
          <details className="faq-item" open>
            <summary>What is AVENZA?</summary>
            <p>
              AVENZA is a modern trading platform designed for exploring global financial markets.
              We provide real-time market data, advanced charting tools, and a clean interface for
              market analysis and trading. Our platform covers forex, cryptocurrencies, and other
              financial instruments.
            </p>
          </details>

          <details className="faq-item">
            <summary>Who can use AVENZA?</summary>
            <p>
              AVENZA is designed for traders and investors of all experience levels. Whether you're
              new to trading or an experienced professional, our platform provides the tools and
              data you need to explore and analyze markets effectively.
            </p>
          </details>

          <details className="faq-item">
            <summary>Is AVENZA free to use?</summary>
            <p>
              You can explore markets, view live data, and use our charting tools. The platform
              currently operates in demo mode for trading functionality.
            </p>
          </details>
        </div>

        <div className="faq-section">
          <h2>Market Data</h2>
          
          <details className="faq-item">
            <summary>What markets can I explore?</summary>
            <p>
              AVENZA provides access to multiple market categories including forex pairs (USD, EUR,
              GBP, JPY, and more) and major cryptocurrencies (Bitcoin, Ethereum, Ripple, Solana, etc.).
              We continually expand our market coverage.
            </p>
          </details>

          <details className="faq-item">
            <summary>Are market prices updated in real time?</summary>
            <p>
              Yes! AVENZA displays live market prices from external market data providers. Prices
              update automatically to reflect current market conditions. You'll see a "LIVE" indicator
              when market data is actively streaming.
            </p>
          </details>

          <details className="faq-item">
            <summary>Where does the market data come from?</summary>
            <p>
              We integrate with reputable market data APIs including currency exchange rate providers
              and cryptocurrency price feeds. This ensures you receive accurate, reliable market
              information.
            </p>
          </details>

          <details className="faq-item">
            <summary>How often is market data refreshed?</summary>
            <p>
              Market data refreshes automatically every 30 seconds. The platform displays when data
              was last updated so you always know how current your information is.
            </p>
          </details>
        </div>

        <div className="faq-section">
          <h2>Features & Tools</h2>
          
          <details className="faq-item">
            <summary>Can I view live charts?</summary>
            <p>
              Absolutely! AVENZA includes professional charting tools with support for multiple
              timeframes (1H, 4H, 1D, 1W, 1M). Charts display historical price data and update
              with current market information.
            </p>
          </details>

          <details className="faq-item">
            <summary>How do watchlists work?</summary>
            <p>
              Watchlists let you bookmark your favorite trading pairs for quick access. Simply click
              the heart icon on any market to add it to your watchlist. Your watchlist is saved
              locally and persists across sessions.
            </p>
          </details>

          <details className="faq-item">
            <summary>Can I search for specific markets?</summary>
            <p>
              Yes! Use the search bar on the Markets page to find specific currency pairs or
              cryptocurrencies. You can search by symbol (like "BTC" or "EUR") or name.
            </p>
          </details>
        </div>

        <div className="faq-section">
          <h2>Trading</h2>
          
          <details className="faq-item">
            <summary>How does the trading interface work?</summary>
            <p>
              The trading interface allows you to place demo orders (buy/sell) with market or limit
              order types. You can specify amounts, view estimated totals, and see fee calculations.
              Currently, this operates in demo mode for practice and learning.
            </p>
          </details>

          <details className="faq-item">
            <summary>Is this real trading?</summary>
            <p>
              The current version operates in demo mode. When you place an order, it's processed
              as a demonstration. No real money or assets are exchanged. This allows you to practice
              and learn without financial risk.
            </p>
          </details>

          <details className="faq-item">
            <summary>What order types are supported?</summary>
            <p>
              AVENZA supports market orders (executed at current market price) and limit orders
              (executed when price reaches your specified level). Both buy and sell orders are available.
            </p>
          </details>
        </div>

        <div className="faq-section">
          <h2>Technical</h2>
          
          <details className="faq-item">
            <summary>Is AVENZA responsive on mobile?</summary>
            <p>
              Yes! AVENZA is fully responsive and works seamlessly on desktop, tablet, and mobile
              devices. The interface adapts to your screen size while maintaining full functionality.
            </p>
          </details>

          <details className="faq-item">
            <summary>Which browsers are supported?</summary>
            <p>
              AVENZA works on all modern browsers including Chrome, Firefox, Safari, and Edge.
              For the best experience, we recommend using the latest browser version.
            </p>
          </details>

          <details className="faq-item">
            <summary>Can I switch between dark and light themes?</summary>
            <p>
              Absolutely! Click the theme toggle icon in the header to switch between dark and
              light modes. Your preference is saved and will be remembered on your next visit.
            </p>
          </details>
        </div>

        <div className="faq-section">
          <h2>Support</h2>
          
          <details className="faq-item">
            <summary>How can I contact AVENZA?</summary>
            <p>
              You can reach us through the Contact page. Fill out the contact form with your
              question or concern, and we'll get back to you as soon as possible.
            </p>
          </details>

          <details className="faq-item">
            <summary>Do you offer customer support?</summary>
            <p>
              Yes, we provide support for technical issues, feature questions, and general inquiries.
              Visit our Contact page or check the FAQ for immediate answers to common questions.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}

export default FAQPage;
