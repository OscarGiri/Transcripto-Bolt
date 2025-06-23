import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFreeTrial } from '../hooks/useFreeTrial';
import { AuthModal } from './AuthModal';
import { FreeTrialBanner } from './FreeTrialBanner';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireAuth = false }) => {
  const { user, loading } = useAuth();
  const { freeUsesRemaining, hasExceededLimit } = useFreeTrial();
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated and has exceeded free trial limit, show auth modal
  if (!user && (hasExceededLimit || requireAuth)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {hasExceededLimit ? 'Free Trial Expired' : 'Sign In Required'}
            </h1>
            <p className="text-gray-600 mb-8">
              {hasExceededLimit 
                ? 'You\'ve used all 5 free analyses. Sign up to continue with unlimited access!'
                : 'Please sign in to access this feature.'
              }
            </p>
            <AuthModal isOpen={true} onClose={() => {}} />
          </div>
        </div>
      </div>
    );
  }

  // Show free trial banner for non-authenticated users
  const shouldShowBanner = !user && (freeUsesRemaining > 0 || hasExceededLimit);

  return (
    <>
      {shouldShowBanner && (
        <div className="bg-gray-50 py-4">
          <div className="container mx-auto px-4">
            <FreeTrialBanner
              usesRemaining={freeUsesRemaining}
              onSignUp={() => setShowAuthModal(true)}
            />
          </div>
        </div>
      )}
      {children}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};