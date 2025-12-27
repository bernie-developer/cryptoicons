import React from 'react';

interface FilterBarProps {
  showTop100Only: boolean;
  onToggleTop100: () => void;
  showActiveOnly: boolean;
  onToggleActive: () => void;
  isLoading?: boolean;
  apiKeyConfigured?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  showTop100Only,
  onToggleTop100,
  showActiveOnly,
  onToggleActive,
  isLoading = false,
  apiKeyConfigured = true,
}) => {
  const isDisabled = isLoading || !apiKeyConfigured;

  return (
    <div className="flex flex-col items-center mb-6">
      <div className="flex flex-wrap gap-3 items-center justify-center">
        <div className="flex gap-3">
          {/* Top 100 Filter Button */}
          <button
            onClick={onToggleTop100}
            disabled={isDisabled}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${showTop100Only && apiKeyConfigured
                ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
              }
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <span>Top 100 Only</span>
            </span>
          </button>

          {/* Active Coins Filter Button */}
          <button
            onClick={onToggleActive}
            disabled={isDisabled}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${showActiveOnly && apiKeyConfigured
                ? 'bg-green-600 text-white shadow-md hover:bg-green-700'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-green-400 hover:text-green-600'
              }
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>Active Only</span>
            </span>
          </button>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <span className="text-sm text-gray-500 italic">
            Loading market data...
          </span>
        )}
      </div>

      {/* API Key not configured message */}
      {!apiKeyConfigured && !isLoading && (
        <div className="mt-3 text-xs text-gray-500 text-center max-w-md">
          <span className="inline-flex items-center gap-1">
            <span>ℹ️</span>
            <span>Filter features require a CoinMarketCap API key. Add your key to <code className="bg-gray-100 px-1 rounded">.env.local</code> to enable filtering.</span>
          </span>
        </div>
      )}
    </div>
  );
};
