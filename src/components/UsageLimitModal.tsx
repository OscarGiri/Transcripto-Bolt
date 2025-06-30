import React from 'react';
import { X, Clock, Zap, Star, ArrowRight } from 'lucide-react';
import { UsageData } from '../hooks/useUsageTracking';

interface UsageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  usageData: UsageData;
  onUpgrade: () => void;
}

export const UsageLimitModal: React.FC<UsageLimitModalProps> = ({
  isOpen,
  onClose,
  usageData,
  onUpgrade,
}) => {
  if (!isOpen) return null;

  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilReset = tomorrow.getTime() - now.getTime();
    const hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60));
    const minutesUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hoursUntilReset > 0) {
      return `${hoursUntilReset} hour${hoursUntilReset > 1 ? 's' : ''} and ${minutesUntilReset} minute${minutesUntilReset > 1 ? 's' : ''}`;
    }
    return `${minutesUntilReset} minute${minutesUntilReset > 1 ? 's' : ''}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Daily Limit Reached</h2>
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
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              You've used all 5 free analyses today
            </h3>
            <p className="text-gray-600 text-sm">
              Your daily limit resets in <strong>{getTimeUntilReset()}</strong>
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            {/* Wait Option */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                  <h4 className="font-semibold text-gray-900">Wait for Reset</h4>
                  <p className="text-sm text-gray-600">
                    Come back in {getTimeUntilReset()} for 5 more free analyses
                  </p>
                </div>
              </div>
            </div>

            {/* Upgrade Option */}
            <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Upgrade to Pro</h4>
                    <p className="text-sm text-blue-700">
                      Unlimited analyses + advanced features
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">$19</div>
                  <div className="text-xs text-blue-600">/month</div>
                </div>
              </div>
              
              <div className="mt-3 space-y-2">
                <div className="flex items-center space-x-2 text-sm text-blue-700">
                  <Star className="w-3 h-3" />
                  <span>Unlimited daily video analyses</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-blue-700">
                  <Star className="w-3 h-3" />
                  <span>Enhanced AI insights & 3 memorable quotes</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-blue-700">
                  <Star className="w-3 h-3" />
                  <span>PDF & DOCX exports</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-blue-700">
                  <Star className="w-3 h-3" />
                  <span>Multi-language translation</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={onUpgrade}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>Upgrade to Pro</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-full text-gray-600 hover:text-gray-800 py-2 transition-colors"
            >
              I'll wait for the reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};