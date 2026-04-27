import React from 'react';
import { RotateCcw } from 'lucide-react';
import { ModernDropdown } from './ModernDropdown';

interface EventBrowseFilterProps {
  country: string;
  city: string;

  period: string;

  onFilterChange: (type: 'country' | 'city' | 'period', value: string) => void;
  isSticky: boolean;
  resultsCount: number;
}

export const EventBrowseFilter: React.FC<EventBrowseFilterProps> = ({
  country,
  city,
  period,
  onFilterChange,
  isSticky,
  resultsCount,
}) => {
  // Options Data (Ideally could come from props/global data, but hardcoded here as per original file)
  const countryOptions = [
    { label: 'All Countries', value: 'all', icon: '🌍' },
    { label: 'Sweden', value: 'Sweden', icon: '🇸🇪' },
    { label: 'Norway', value: 'Norway', icon: '🇳🇴' },
    { label: 'Denmark', value: 'Denmark', icon: '🇩🇰' },
    { label: 'Finland', value: 'Finland', icon: '🇫🇮' },
    { label: 'Germany', value: 'Germany', icon: '🇩🇪' },
    { label: 'France', value: 'France', icon: '🇫🇷' },
    { label: 'Netherlands', value: 'Netherlands', icon: '🇳🇱' },
  ];

  const cityOptions = [
    { label: 'All Cities', value: 'all' },
    { label: 'Stockholm', value: 'Stockholm' },
    { label: 'Gothenburg', value: 'Gothenburg' },
    { label: 'Falsterbo', value: 'Falsterbo' },
    { label: 'Uppsala', value: 'Uppsala' },
    { label: 'Malmö', value: 'Malmö' },
  ];

  const periodOptions = [
    { label: 'Scheduled', value: 'Scheduled' },
    { label: 'Recent', value: 'Recent' },
    { label: 'Live', value: 'Live', disabled: true },
    { label: 'Last 3 months', value: 'Last 3 months', disabled: true },
    { label: 'Last 1 year', value: 'Last 1 year', disabled: true },
  ];

  const isResetDisabled =
    country === 'all' && city === 'all' && period === 'Scheduled';

  return (
    <div
      className={`block w-full bg-transparent p-0 z-[90] ${isSticky ? 'py-3 bg-white/85 [-webkit-backdrop-filter:blur(12px)] [backdrop-filter:blur(12px)] border-b border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)]' : ''}`}
    >
      <div className="filter-container">
        <div className="flex gap-3 items-center flex-wrap">
          <ModernDropdown
            value={country}
            options={countryOptions}
            onChange={val => onFilterChange('country', val)}
            icon="🇸🇪"
            placeholder="Country"
            label="Country"
            variant="pill"
          />

          <ModernDropdown
            value={city}
            options={cityOptions}
            onChange={val => onFilterChange('city', val)}
            placeholder="City"
            label="City"
            variant="pill"
          />

          <ModernDropdown
            value={period}
            options={periodOptions}
            onChange={val => onFilterChange('period', val)}
            placeholder="Period"
            label="Period"
            variant="pill"
          />

          <button
            className="filter-reset-btn"
            onClick={() => {
              onFilterChange('country', 'all');
              onFilterChange('city', 'all');
              onFilterChange('period', 'Scheduled');
            }}
            title="Reset filters"
            disabled={isResetDisabled}
          >
            <RotateCcw size={18} />
          </button>
        </div>

        <div className="filter-results-count">
          Showing {resultsCount} events
        </div>
      </div>
    </div>
  );
};
