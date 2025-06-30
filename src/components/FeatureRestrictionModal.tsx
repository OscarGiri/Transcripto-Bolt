import React from 'react';
import { X, Lock, Star, Zap } from 'lucide-react';

interface FeatureRestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  requiredPlan: 'pro' | 'team';
  description: string;
}

export const FeatureRestrictionModal: React.FC<FeatureRestrictionModalProps> = ({
  isOpen,
  onClose,
  feature,
  requiredPlan,
  description,
}) => {
  if (!isOpen) return null;

  const planDetails = {
    pro: {
      name: 'Pro',
      price: '$20/month',
      icon: Zap,
      color: 'blue',
    },
    team: {
      name: 'Team',
      price: '$40/month',
      icon: Star,
      color: 'purple',
    },
  };

  const plan = planDetails[requiredPlan];
  const Icon = plan.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-${plan.color}-100`}>
              <Lock className={`w-5 h-5 text-${plan.color}-600`} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Premium Feature</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 bg-${plan.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Icon className={`w-8 h-8 text-${plan.color}-600`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature}</h3>
            <p className="text-gray-600 text-sm">{description}</p>
          </div>

          <div className={`bg-${plan.color}-50 border border-${plan.color}-200 rounded-xl p-4 mb-6`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">{plan.name} Plan Required</span>
              <span className={`text-${plan.color}-600 font-bold`}>{plan.price}</span>
            </div>
            <p className={`text-${plan.color}-800 text-sm`}>
              Upgrade to unlock this feature and many more advanced capabilities.
            </p>
          </div>

          <div className="space-y-3">
            <button className={`w-full bg-gradient-to-r from-${plan.color}-600 to-${plan.color}-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-${plan.color}-700 hover:to-${plan.color}-800 transition-all duration-300`}>
              Upgrade to {plan.name}
            </button>
            <button
              onClick={onClose}
              className="w-full text-gray-600 hover:text-gray-800 py-2 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};