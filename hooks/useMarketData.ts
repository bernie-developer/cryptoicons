import { useState, useEffect } from 'react';

interface CoinData {
  id: number;
  name: string;
  symbol: string;
  cmc_rank: number;
  is_active: number;
}

interface MarketData {
  coins: CoinData[];
  timestamp: number;
}

interface UseMarketDataResult {
  marketData: MarketData | null;
  loading: boolean;
  error: string | null;
  isTop100Coin: (symbol: string) => boolean;
  isActiveCoin: (symbol: string) => boolean;
  apiKeyConfigured: boolean;
}

export const useMarketData = (): UseMarketDataResult => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean>(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch('/api/coinmarketcap/top100');

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          if (result.error === 'API_KEY_NOT_CONFIGURED') {
            setApiKeyConfigured(false);
            setError(null); // No error message, just disabled features
          } else {
            throw new Error(result.error || 'Failed to fetch market data');
          }
        } else {
          setMarketData(result.data);
          setApiKeyConfigured(true);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load market data:', err);
        setError('Failed to load market data. Filter features may be limited.');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  // Helper function to check if a coin is in top 100
  const isTop100Coin = (symbol: string): boolean => {
    if (!marketData) return true; // If no data, show all

    const normalizedSymbol = symbol.toUpperCase().trim();
    return marketData.coins.some(
      coin => coin.symbol.toUpperCase() === normalizedSymbol
    );
  };

  // Helper function to check if a coin is active
  const isActiveCoin = (symbol: string): boolean => {
    if (!marketData) return true; // If no data, show all

    const normalizedSymbol = symbol.toUpperCase().trim();
    const coin = marketData.coins.find(
      c => c.symbol.toUpperCase() === normalizedSymbol
    );

    // If coin not in top 100, we don't have active status, so show it
    if (!coin) return true;

    return coin.is_active === 1;
  };

  return {
    marketData,
    loading,
    error,
    isTop100Coin,
    isActiveCoin,
    apiKeyConfigured,
  };
};
