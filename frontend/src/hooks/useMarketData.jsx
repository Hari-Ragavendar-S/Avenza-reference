import { useState, useEffect } from 'react';
import marketDataService from '../services/marketData';

export function useMarketData(autoRefresh = true) {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    let subscriptionId = null;

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await marketDataService.getAllMarkets();
        setMarkets(data);
        setLastUpdate(Date.now());
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if (autoRefresh) {
      subscriptionId = marketDataService.subscribe((data) => {
        setMarkets(data);
        setLastUpdate(Date.now());
      });
    }

    return () => {
      if (subscriptionId) {
        marketDataService.unsubscribe(subscriptionId);
      }
    };
  }, [autoRefresh]);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await marketDataService.getAllMarkets();
      setMarkets(data);
      setLastUpdate(Date.now());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { markets, loading, error, lastUpdate, refresh };
}

export function useLivePrice(pair) {
  const { markets } = useMarketData(true);
  const market = markets.find(m => m.pair === pair);
  return market || null;
}
