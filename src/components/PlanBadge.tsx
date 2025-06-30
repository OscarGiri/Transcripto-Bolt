import React from 'react';
import { Star, Zap, Building } from 'lucide-react';
import { UserPlan } from '../hooks/useUserPlan';

interface PlanBadgeProps {
  plan: UserPlan;
  className?: string;
}

export const PlanBadge: React.FC<PlanBadgeProps> = ({ plan, className = '' }) => {
  const planConfig = {
    free: {
      name: 'Free',
      icon: Star,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      iconColor: 'text-gray-500',
    },
    pro: {
      name: 'Pro',
      icon: Zap,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
    },
    team: {
      name: 'Team',
      icon: Building,
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
      iconColor: 'text-purple-600',
    },
  };

  const config = planConfig[plan];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor} ${className}`}>
      <Icon className={`w-3 h-3 ${config.iconColor}`} />
      <span>{config.name}</span>
    </div>
  );
};