import React from 'react';
import { Gift, Clock, Star } from 'lucide-react';

interface FreeTrialBannerProps {
  usesRemaining: number;
  onSignUp: () => void;
}

export const FreeTrialBanner: React.FC<FreeTrialBannerProps> = ({ 
  usesRemaining, 
  onSignUp 
}) => {
  if (usesRemaining === 0) {
    return (
      <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-4 rounded-xl shadow-lg mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Free Trial Expired</h3>
              <p className="text-sm opacity-90">Sign up to continue using Transcripto</p>
            </div>
          </div>
          <button
            onClick={onSignUp}
            className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Sign Up Free
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl shadow-lg mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Gift className="w-6 h-6" />
          <div>
            <h3 className="font-semibold">Free Trial Active</h3>
            <p className="text-sm opacity-90">
              {usesRemaining} free {usesRemaining === 1 ? 'analysis' : 'analyses'} remaining
            </p>
          </div>
        </div>
        <button
          onClick={onSignUp}
          className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
        >
          <Star className="w-4 h-4" />
          <span>Upgrade</span>
        </button>
      </div>
    </div>
  );
};