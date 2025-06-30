import React, { useState } from 'react';
import { Video, Sparkles, LogIn, Clock, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUsageTracking } from '../hooks/useUsageTracking';
import { useUserPlan } from '../hooks/useUserPlan';
import { UserMenu } from './UserMenu';
import { AuthModal } from './AuthModal';
import { PlanBadge } from './PlanBadge';

export const Header: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading } = useAuth();
  const { usageData, loading: usageLoading } = useUsageTracking(user);
  const userPlan = useUserPlan(user);

  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilReset = tomorrow.getTime() - now.getTime();
    const hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60));
    
    if (hoursUntilReset > 1) {
      return `${hoursUntilReset}h`;
    }
    const minutesUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutesUntilReset}m`;
  };

  const getRemainingUses = () => {
    if (usageData.planType !== 'free') return 999;
    return Math.max(0, usageData.dailyLimit - usageData.currentUsage);
  };

  return (
    <>
      <header className="bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Transcripto
              </h1>
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Usage Display */}
              {!usageLoading && (
                <>
                  {user && !userPlan.loading && (
                    <div className="flex items-center space-x-3">
                      <PlanBadge plan={userPlan.plan} />
                    </div>
                  )}
                  
                  {usageData.planType === 'free' && (
                    <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {usageData.canPerformAction ? (
                          <Zap className="w-4 h-4 text-green-300" />
                        ) : (
                          <Clock className="w-4 h-4 text-orange-300" />
                        )}
                        <div className="text-sm">
                          <div className="font-semibold">
                            {getRemainingUses()} {getRemainingUses() === 1 ? 'use' : 'uses'} today
                          </div>
                          {!usageData.canPerformAction && (
                            <div className="text-xs text-blue-200">
                              Resets in {getTimeUntilReset()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {!loading && (
                user ? (
                  <UserMenu />
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-300"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </button>
                )
              )}
            </div>
          </div>
          
          <p className="text-center text-blue-100 text-lg max-w-2xl mx-auto">
            Transform YouTube videos into concise summaries, bullet points, and key quotes using AI transcription and analysis
          </p>
          
          {!user && (
            <div className="text-center mt-4">
              <p className="text-blue-200 text-sm">
                ✨ 5 free analyses daily • Advanced features with Pro account
              </p>
            </div>
          )}
        </div>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};