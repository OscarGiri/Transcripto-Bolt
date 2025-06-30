import React from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

interface UsageMeterProps {
  current: number;
  limit: number | null;
  label: string;
  period: string;
  className?: string;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({
  current,
  limit,
  label,
  period,
  className = '',
}) => {
  if (limit === null) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-green-900">{label}</span>
        </div>
        <div className="text-2xl font-bold text-green-700 mb-1">{current}</div>
        <div className="text-sm text-green-600">Unlimited {period}</div>
      </div>
    );
  }

  const percentage = Math.min((current / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-2">
        <BarChart3 className="w-4 h-4 text-gray-600" />
        <span className="font-semibold text-gray-900">{label}</span>
      </div>
      
      <div className="flex items-baseline space-x-2 mb-2">
        <span className="text-2xl font-bold text-gray-900">{current}</span>
        <span className="text-sm text-gray-500">/ {limit}</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            isAtLimit
              ? 'bg-red-500'
              : isNearLimit
              ? 'bg-yellow-500'
              : 'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className={`text-sm ${
        isAtLimit
          ? 'text-red-600'
          : isNearLimit
          ? 'text-yellow-600'
          : 'text-gray-600'
      }`}>
        {limit - current} remaining this {period}
      </div>
    </div>
  );
};