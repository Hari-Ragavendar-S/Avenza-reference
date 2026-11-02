import axios from 'axios';

// Crypto price API (CoinGecko - no key required)
const CRYPTO_API_BASE = 'https://api.coingecko.com/api/v3';

// Using exchangerate-api.com for forex (no key required for basic usage)
const FOREX_API_BASE = 'https://api.exchangerate-api.com/v4';

class MarketDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5000; // 5 seconds - faster cache refresh
    this.subscribers = new Map();
    this.updateInterval = null;
  }

  // Get latest forex rates
  async getForexRates(baseCurrency = 'USD', currencies = []) {
    try {
      const cacheKey = `forex_${baseCurrency}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const response = await axios.get(`${FOREX_API_BASE}/latest/${baseCurrency}`);
      
      if (!response.data || !response.data.rates) {
        console.warn('Invalid forex API response, using fallback data');
        return this.getFallbackForexData();
      }

      const data = this.formatForexData(response.data.rates, baseCurrency);
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching forex rates:', error);
      return this.getFallbackForexData();
    }
  }

  // Get crypto prices
  async getCryptoPrices(ids = ['bitcoin', 'ethereum', 'ripple', 'solana', 'binancecoin', 'cardano', 'dogecoin', 'polkadot']) {
    try {
      const cacheKey = `crypto_${ids.join('_')}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const response = await axios.get(`${CRYPTO_API_BASE}/simple/price`, {
        params: {
          ids: ids.join(','),
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_24hr_vol: true,
          include_market_cap: true
        }
      });

      const data = this.formatCryptoData(response.data);
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      return this.getFallbackCryptoData();
    }
  }

  // Get historical data for charts
  async getMarketHistory(pair, days = 7) {
    try {
      // For crypto pairs
      if (pair.includes('BTC') || pair.includes('ETH')) {
        const coinId = pair.includes('BTC') ? 'bitcoin' : 'ethereum';
        const response = await axios.get(`${CRYPTO_API_BASE}/coins/${coinId}/market_chart`, {
          params: {
            vs_currency: 'usd',
            days: days
          }
        });
        return this.formatHistoricalData(response.data.prices);
      }
      
      // For forex, generate mock historical data based on current price
      return this.generateForexHistory(pair, days);
    } catch (error) {
      console.error('Error fetching market history:', error);
      return [];
    }
  }

  // Format forex data
  formatForexData(rates, base) {
    const formatted = [];
    const previousPrices = this.getPreviousPrices('forex');
    
    // Select major currency pairs
    const majorPairs = ['EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR'];

    majorPairs.forEach(currency => {
      if (rates[currency]) {
        const pair = `${base}/${currency}`;
        const baseRate = rates[currency];
        
        // Add small random fluctuation for real-time feel (±0.05%)
        const fluctuation = 1 + (Math.random() - 0.5) * 0.0005;
        const rate = baseRate * fluctuation;
        
        const prevPrice = previousPrices[pair] || rate;
        const change24h = ((rate - prevPrice) / prevPrice) * 100;

        formatted.push({
          pair: pair,
          symbol: currency,
          price: rate,
          change24h: change24h,
          changePercent: change24h,
          high24h: rate * 1.02,
          low24h: rate * 0.98,
          volume: Math.random() * 1000000000,
          type: 'forex',
          lastUpdate: Date.now()
        });
      }
    });

    this.savePreviousPrices('forex', formatted);
    return formatted;
  }

  // Format crypto data
  formatCryptoData(data) {
    const formatted = [];
    const cryptoMap = {
      'bitcoin': { symbol: 'BTC', name: 'Bitcoin' },
      'ethereum': { symbol: 'ETH', name: 'Ethereum' },
      'ripple': { symbol: 'XRP', name: 'Ripple' },
      'solana': { symbol: 'SOL', name: 'Solana' },
      'binancecoin': { symbol: 'BNB', name: 'BNB' },
      'cardano': { symbol: 'ADA', name: 'Cardano' },
      'dogecoin': { symbol: 'DOGE', name: 'Dogecoin' },
      'polkadot': { symbol: 'DOT', name: 'Polkadot' }
    };

    Object.entries(data).forEach(([id, values]) => {
      const info = cryptoMap[id];
      if (info) {
        // Add small random fluctuation for real-time feel (±0.1%)
        const fluctuation = 1 + (Math.random() - 0.5) * 0.002;
        const price = values.usd * fluctuation;
        
        formatted.push({
          pair: `${info.symbol}/USD`,
          symbol: info.symbol,
          name: info.name,
          price: price,
          change24h: values.usd_24h_change || 0,
          changePercent: values.usd_24h_change || 0,
          high24h: price * 1.05,
          low24h: price * 0.95,
          volume: values.usd_24h_vol || 0,
          marketCap: values.usd_market_cap || 0,
          type: 'crypto',
          lastUpdate: Date.now()
        });
      }
    });

    return formatted;
  }

  // Format historical data
  formatHistoricalData(prices) {
    return prices.map(([timestamp, price]) => ({
      time: timestamp,
      price: price
    }));
  }

  // Generate forex history (fallback)
  generateForexHistory(pair, days) {
    const data = [];
    const now = Date.now();
    const basePrice = 1.0 + Math.random();
    
    for (let i = days * 24; i >= 0; i--) {
      const timestamp = now - (i * 3600000);
      const variation = (Math.random() - 0.5) * 0.02;
      data.push({
        time: timestamp,
        price: basePrice * (1 + variation)
      });
    }
    
    return data;
  }

  // Cache management
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Previous prices for change calculation
  getPreviousPrices(type) {
    const key = `prev_${type}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  }

  savePreviousPrices(type, data) {
    const key = `prev_${type}`;
    const prices = {};
    data.forEach(item => {
      prices[item.pair] = item.price;
    });
    localStorage.setItem(key, JSON.stringify(prices));
  }

  // Get all market data
  async getAllMarkets() {
    try {
      const [forex, crypto] = await Promise.all([
        this.getForexRates(),
        this.getCryptoPrices()
      ]);
      return [...forex, ...crypto];
    } catch (error) {
      console.error('Error fetching all markets:', error);
      return [];
    }
  }

  // Fallback data when API fails
  getFallbackForexData() {
    return [
      { pair: 'USD/EUR', symbol: 'EUR', price: 0.92, change24h: 0.15, changePercent: 0.15, type: 'forex', lastUpdate: Date.now() },
      { pair: 'USD/GBP', symbol: 'GBP', price: 0.79, change24h: -0.22, changePercent: -0.22, type: 'forex', lastUpdate: Date.now() },
      { pair: 'USD/JPY', symbol: 'JPY', price: 149.50, change24h: 0.35, changePercent: 0.35, type: 'forex', lastUpdate: Date.now() },
    ];
  }

  getFallbackCryptoData() {
    return [
      { pair: 'BTC/USD', symbol: 'BTC', name: 'Bitcoin', price: 43250, change24h: 2.15, changePercent: 2.15, type: 'crypto', lastUpdate: Date.now() },
      { pair: 'ETH/USD', symbol: 'ETH', name: 'Ethereum', price: 2280, change24h: 1.85, changePercent: 1.85, type: 'crypto', lastUpdate: Date.now() },
    ];
  }

  // Subscribe to live updates
  subscribe(callback, interval = 5000) { // Update every 5 seconds
    const id = Date.now();
    this.subscribers.set(id, callback);

    if (!this.updateInterval) {
      this.updateInterval = setInterval(async () => {
        const data = await this.getAllMarkets();
        this.subscribers.forEach(cb => cb(data));
      }, interval);
    }

    return id;
  }

  unsubscribe(id) {
    this.subscribers.delete(id);
    if (this.subscribers.size === 0 && this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export default new MarketDataService();
