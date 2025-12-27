import React from 'react';

interface FilterBarProps {
  showTop100Only: boolean;
  onToggleTop100: () => void;
  showActiveOnly: boolean;
  onToggleActive: () => void;
  isLoading?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  showTop100Only,
  onToggleTop100,
  showActiveOnly,
  onToggleActive,
  isLoading = false,
}) => {
  return (
    <div className="flex flex-wrap gap-3 items-center justify-center mb-6">
      <div className="flex gap-3">
        {/* Top 100 Filter Button */}
        <button
          onClick={onToggleTop100}
          disabled={isLoading}
          className={`
            px-4 py-2 rounded-lg font-medium transition-all duration-200
            ${showTop100Only
              ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
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
          disabled={isLoading}
          className={`
            px-4 py-2 rounded-lg font-medium transition-all duration-200
            ${showActiveOnly
              ? 'bg-green-600 text-white shadow-md hover:bg-green-700'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-green-400 hover:text-green-600'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
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
  );
};
