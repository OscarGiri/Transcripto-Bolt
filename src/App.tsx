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
import { UsageLimitModal } from './components/UsageLimitModal';
import { analyzeVideo, saveVideoSummary, updateVideoHighlights, translateAndSaveVideoSummary, extractVideoId } from './services/videoService';
import { VideoSummary, HighlightedSegment } from './types';
import { useAuth } from './hooks/useAuth';
import { useUsageTracking } from './hooks/useUsageTracking';
import { useUserPlan } from './hooks/useUserPlan';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [videoData, setVideoData] = useState<VideoSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'analyze' | 'dashboard' | 'api' | 'pricing'>('analyze');
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);
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
  const { usageData, loading: usageLoading, incrementUsage, getRemainingUses, refreshUsage } = useUsageTracking(user);
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

  const handleVideoSubmit = async (url: string) => {
    console.log('🎬 App: Starting video submission for URL:', url);
    
    // Extract and validate video ID first
    const newVideoId = extractVideoId(url);
    console.log('🔍 App: Extracted video ID:', newVideoId);
    
    if (!newVideoId) {
      console.error('❌ App: Invalid video ID extracted from URL:', url);
      setError('Invalid YouTube URL. Please check the URL and try again.');
      return;
    }

    // Check if user can analyze video (daily limit)
    if (!usageData.canPerformAction) {
      console.warn('⚠️ App: Usage limit reached, showing modal');
      setShowUsageLimitModal(true);
      return;
    }

    // Check if this is the same video as currently loaded
    if (currentVideoId === newVideoId && videoData) {
      console.log('ℹ️ App: Same video already loaded, skipping analysis');
      return;
    }

    // Clear previous state and start fresh analysis
    console.log('🧹 App: Clearing previous state and starting fresh analysis');
    setVideoData(null);
    setCurrentVideoId(null);
    setError(null);
    setIsLoading(true);

    try {
      console.log('📡 App: Calling analyzeVideo service with URL:', url);
      const response = await analyzeVideo(url);
      console.log('📡 App: Received response from analyzeVideo:', response);
      
      if (response.success && response.data) {
        console.log('✅ App: Analysis successful, setting video data');
        console.log('📊 App: Video data received:', {
          videoId: response.data.videoId,
          title: response.data.title,
          duration: response.data.duration,
          channelName: response.data.channelName
        });
        
        // Verify the video ID matches what we expected
        if (response.data.videoId !== newVideoId) {
          console.warn('⚠️ App: Video ID mismatch!', {
            expected: newVideoId,
            received: response.data.videoId
          });
        }
        
        // Set the new video ID and data
        setCurrentVideoId(response.data.videoId);
        setVideoData(response.data);
        
        // Increment usage count
        console.log('📈 App: Incrementing usage count');
        await incrementUsage('video_analysis', {
          video_id: response.data.videoId,
          video_title: response.data.title,
          channel_name: response.data.channelName
        });
        
        // Save to database if user is logged in
        if (user) {
          console.log('💾 App: Saving video summary to database');
          const saveResult = await saveVideoSummary(user.id, response.data);
          if (!saveResult.success) {
            console.error('❌ App: Failed to save video summary:', saveResult.error);
          } else {
            console.log('✅ App: Video summary saved successfully');
          }
        }
      } else {
        console.error('❌ App: Analysis failed:', response.error);
        setError(response.error || 'Failed to analyze video. Please try again.');
      }
    } catch (err) {
      console.error('❌ App: Network error during analysis:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
      console.log('🏁 App: Video analysis process completed');
    }
  };

  const handleRetry = () => {
    console.log('🔄 App: Retrying - clearing error state');
    setError(null);
    setVideoData(null);
    setCurrentVideoId(null);
  };

  const handleSelectVideo = (video: VideoSummary) => {
    console.log('📺 App: Selecting video from dashboard:', video.videoId);
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

  const remainingUses = getRemainingUses();
  const canAnalyze = usageData.canPerformAction;

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
                remainingUses={remainingUses}
                usageData={usageData}
              />
              
              {error && <ErrorMessage message={error} onRetry={handleRetry} />}
              
              {/* Loading state */}
              {isLoading && (
                <div className="max-w-2xl mx-auto px-4 text-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Analyzing your video...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                  {currentVideoId && (
                    <p className="text-xs text-blue-600 mt-2 font-mono">
                      Video ID: {currentVideoId}
                    </p>
                  )}
                </div>
              )}
              
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
                        memorableQuotes={videoData.memorableQuotes}
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

        <UsageLimitModal
          isOpen={showUsageLimitModal}
          onClose={() => setShowUsageLimitModal(false)}
          usageData={usageData}
          onUpgrade={() => {
            setShowUsageLimitModal(false);
            setCurrentView('pricing');
          }}
        />
      </div>
    </AuthGuard>
  );
}

export default App;