import React, { useState } from 'react';
import { Video, Sparkles, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFreeTrial } from '../hooks/useFreeTrial';
import { UserMenu } from './UserMenu';
import { AuthModal } from './AuthModal';

export const Header: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading } = useAuth();
  const { freeUsesRemaining } = useFreeTrial();

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
              {!user && freeUsesRemaining > 0 && (
                <div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
                  <span className="text-sm text-blue-100">
                    {freeUsesRemaining} free {freeUsesRemaining === 1 ? 'use' : 'uses'} left
                  </span>
                </div>
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
                ✨ Try 5 videos for free, no signup required • Advanced features with free account
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