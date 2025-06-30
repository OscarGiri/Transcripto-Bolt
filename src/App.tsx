import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { URLInput } from './components/URLInput';
import { VideoPreview } from './components/VideoPreview';
import { Summary } from './components/Summary';
import { EnhancedTranscript } from './components/EnhancedTranscript';
import { ErrorMessage } from './components/ErrorMessage';
import { Dashboard } from './components/Dashboard';
import { TranslationPanel } from './components/TranslationPanel';
import { ExportPanel } from './components/ExportPanel';
import { AuthGuard } from './components/AuthGuard';
import { ApiKeyManagement } from './components/ApiKeyManagement';
import { PricingPlans } from './components/PricingPlans';
import { FeatureRestrictionModal } from './components/FeatureRestrictionModal';
import { analyzeVideo, saveVideoSummary, updateVideoHighlights, translateAndSaveVideoSummary } from './services/videoService';
import { VideoSummary, HighlightedSegment } from './types';
import { useAuth } from './hooks/useAuth';
import { useFreeTrial } from './hooks/useFreeTrial';
import { useUserPlan } from './hooks/useUserPlan';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [videoData, setVideoData] = useState<VideoSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'analyze' | 'dashboard' | 'api' | 'pricing'>('analyze');
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [restrictionModal, setRestrictionModal] = useState<{
    isOpen: boolean;
    feature: string;
    requiredPlan: 'pro' | 'team';
    description: string;
  }>({
    isOpen: false,
    feature: '',
    requiredPlan: 'pro',
    description: '',
  });

  const { user } = useAuth();
  const { freeUsesRemaining, hasExceededLimit, consumeFreeTrial } = useFreeTrial();
  const userPlan = useUserPlan(user);

  // Clear video data when switching views
  useEffect(() => {
    if (currentView !== 'analyze') {
      setVideoData(null);
      setCurrentVideoId(null);
      setError(null);
    }
  }, [currentView]);

  const showFeatureRestriction = (feature: string, requiredPlan: 'pro' | 'team', description: string) => {
    setRestrictionModal({
      isOpen: true,
      feature,
      requiredPlan,
      description,
    });
  };

  const extractVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleVideoSubmit = async (url: string) => {
    // Extract video ID to check if it's the same video
    const newVideoId = extractVideoId(url);
    
    // If it's the same video, don't reprocess
    if (newVideoId && newVideoId === currentVideoId && videoData) {
      return;
    }

    // Check if user can analyze video
    if (!user && hasExceededLimit) {
      setError('Free trial expired. Please sign up to continue using Transcripto.');
      return;
    }

    if (user && !userPlan.canAnalyzeVideo()) {
      setError(`Daily limit reached. You've used ${userPlan.dailyUsage}/${userPlan.dailyLimit} analyses today.`);
      return;
    }

    // Immediately clear all previous state
    setVideoData(null);
    setCurrentVideoId(null);
    setError(null);
    setIsLoading(true);

    try {
      const response = await analyzeVideo(url);
      
      if (response.success && response.data) {
        // Set the new video ID first
        setCurrentVideoId(response.data.videoId);
        
        // Then set the video data
        setVideoData(response.data);
        
        // Consume free trial if user is not authenticated
        if (!user) {
          consumeFreeTrial();
        } else {
          // Refresh usage for authenticated users
          userPlan.refreshUsage();
        }
        
        // Save to database if user is logged in
        if (user) {
          const saveResult = await saveVideoSummary(user.id, response.data);
          if (!saveResult.success) {
            console.error('Failed to save video summary:', saveResult.error);
          }
        }
      } else {
        setError(response.error || 'Failed to analyze video. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setVideoData(null);
    setCurrentVideoId(null);
  };

  const handleSelectVideo = (video: VideoSummary) => {
    // Clear any existing error when selecting a video from dashboard
    setError(null);
    setCurrentVideoId(video.videoId);
    setVideoData(video);
    setCurrentView('analyze');
  };

  const handleUpdateHighlights = async (highlights: HighlightedSegment[]) => {
    if (!videoData || !user) return;

    if (!userPlan.features.autoHighlight) {
      showFeatureRestriction(
        'Advanced Highlighting',
        'pro',
        'Save and manage highlighted segments with AI-powered insights and custom notes.'
      );
      return;
    }

    // Update local state immediately
    setVideoData(prev => prev ? { ...prev, highlightedSegments: highlights } : null);

    // Save to database
    const result = await updateVideoHighlights(user.id, videoData.videoId, highlights);
    if (!result.success) {
      console.error('Failed to update highlights:', result.error);
    }
  };

  const handleTranslate = async (targetLanguage: string) => {
    if (!videoData || !user) return;

    if (!userPlan.features.translation) {
      showFeatureRestriction(
        'Multi-language Translation',
        'pro',
        'Translate summaries and transcripts into 12+ languages with AI-powered accuracy.'
      );
      return;
    }

    setIsTranslating(true);
    try {
      const result = await translateAndSaveVideoSummary(user.id, videoData.videoId, targetLanguage);
      if (result.success) {
        // Update local state with translation
        setVideoData(prev => prev ? {
          ...prev,
          translatedSummary: {
            ...prev.translatedSummary,
            [targetLanguage]: `[Translated to ${targetLanguage}] ${prev.summary}`
          }
        } : null);
      }
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleExportRestriction = (format: 'pdf' | 'docx') => {
    if (!userPlan.features.pdfDocxExport) {
      showFeatureRestriction(
        'Advanced Export Formats',
        'pro',
        `Export your summaries as formatted ${format.toUpperCase()} documents with professional styling and layouts.`
      );
      return false;
    }
    return true;
  };

  const navigationItems = [
    { id: 'analyze', label: 'Analyze Video' },
    ...(user ? [
      { id: 'dashboard', label: 'My Dashboard' },
      { id: 'api', label: 'API Keys' },
      { id: 'pricing', label: 'Pricing' },
    ] : [])
  ];

  const canAnalyze = user ? userPlan.canAnalyzeVideo() : freeUsesRemaining > 0;
  const remainingAnalyses = user ? userPlan.getRemainingAnalyses() : freeUsesRemaining;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="container mx-auto py-8">
          {/* Navigation */}
          <div className="max-w-4xl mx-auto px-4 mb-8">
            <div className="flex items-center justify-center space-x-4 overflow-x-auto">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as any)}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    currentView === item.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content based on current view */}
          {currentView === 'dashboard' && user && (
            <Dashboard onSelectVideo={handleSelectVideo} />
          )}

          {currentView === 'api' && user && (
            <ApiKeyManagement />
          )}

          {currentView === 'pricing' && (
            <PricingPlans />
          )}

          {currentView === 'analyze' && (
            <>
              <URLInput 
                onSubmit={handleVideoSubmit} 
                isLoading={isLoading}
                canAnalyze={canAnalyze}
                freeUsesRemaining={remainingAnalyses}
              />
              
              {error && <ErrorMessage message={error} onRetry={handleRetry} />}
              
              {/* Only show video data if we have it AND we're not loading */}
              {videoData && !isLoading && (
                <div className="max-w-6xl mx-auto px-4 space-y-8">
                  <VideoPreview
                    title={videoData.title}
                    thumbnail={videoData.thumbnail}
                    duration={videoData.duration}
                    channelName={videoData.channelName}
                  />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <Summary
                        summary={videoData.summary}
                        bulletPoints={videoData.bulletPoints}
                        keyQuote={videoData.keyQuote}
                        title={videoData.title}
                        enhancedAI={userPlan.features.enhancedAI}
                      />
                      
                      <EnhancedTranscript
                        transcript={videoData.transcript}
                        title={videoData.title}
                        highlightedSegments={videoData.highlightedSegments || []}
                        onUpdateHighlights={handleUpdateHighlights}
                        searchEnabled={userPlan.features.transcriptSearch}
                        onSearchRestriction={() => showFeatureRestriction(
                          'Transcript Search',
                          'pro',
                          'Search through video transcripts to quickly find specific topics, keywords, or moments.'
                        )}
                      />
                    </div>
                    
                    <div className="space-y-6">
                      {user && (
                        <TranslationPanel
                          originalLanguage={videoData.language || 'en'}
                          availableLanguages={[]}
                          onTranslate={handleTranslate}
                          translatedContent={videoData.translatedSummary}
                          isTranslating={isTranslating}
                          enabled={userPlan.features.translation}
                        />
                      )}
                      
                      <ExportPanel
                        videoData={videoData}
                        highlightedSegments={videoData.highlightedSegments}
                        onExportRestriction={handleExportRestriction}
                        pdfDocxEnabled={userPlan.features.pdfDocxExport}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Loading state */}
              {isLoading && (
                <div className="max-w-2xl mx-auto px-4 text-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Analyzing your video...</p>
                </div>
              )}
            </>
          )}
        </main>
        
        <footer className="bg-gray-900 text-white py-8 mt-16">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-400">
              Transcripto - AI-powered YouTube video analysis platform
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Transform videos into searchable insights with advanced highlighting and translation
            </p>
          </div>
        </footer>

        <FeatureRestrictionModal
          isOpen={restrictionModal.isOpen}
          onClose={() => setRestrictionModal(prev => ({ ...prev, isOpen: false }))}
          feature={restrictionModal.feature}
          requiredPlan={restrictionModal.requiredPlan}
          description={restrictionModal.description}
        />
      </div>
    </AuthGuard>
  );
}

export default App;