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

interface ActiveCoinsData {
  activeSymbols: string[];
  timestamp: number;
  totalChecked: number;
  apiCallsMade: number;
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
  const [activeCoinsData, setActiveCoinsData] = useState<ActiveCoinsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean>(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        // Fetch both top 100 and active coins data in parallel
        const [top100Response, activeCoinsResponse] = await Promise.all([
          fetch('/api/coinmarketcap/top100'),
          fetch('/api/coinmarketcap/active-coins')
        ]);

        if (!top100Response.ok || !activeCoinsResponse.ok) {
          throw new Error(`HTTP error! status: ${top100Response.status} / ${activeCoinsResponse.status}`);
        }

        const [top100Result, activeCoinsResult] = await Promise.all([
          top100Response.json(),
          activeCoinsResponse.json()
        ]);

        // Check if API key is configured
        if (!top100Result.success || !activeCoinsResult.success) {
          if (top100Result.error === 'API_KEY_NOT_CONFIGURED' || activeCoinsResult.error === 'API_KEY_NOT_CONFIGURED') {
            setApiKeyConfigured(false);
            setError(null); // No error message, just disabled features
          } else {
            throw new Error(top100Result.error || activeCoinsResult.error || 'Failed to fetch market data');
          }
        } else {
          setMarketData(top100Result.data);
          setActiveCoinsData(activeCoinsResult.data);
          setApiKeyConfigured(true);
          setError(null);

          // Log API usage
          if (!activeCoinsResult.cached) {
            console.log(`Active coins check: ${activeCoinsResult.data.apiCallsMade} API calls made`);
          }
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
    if (!activeCoinsData) return true; // If no data, show all

    const normalizedSymbol = symbol.toUpperCase().trim();

    // Check if symbol is in the active coins list
    return activeCoinsData.activeSymbols.includes(normalizedSymbol);
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
