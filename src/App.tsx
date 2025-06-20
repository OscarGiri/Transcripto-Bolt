import React, { useState } from 'react';
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
import { analyzeVideo, saveVideoSummary, updateVideoHighlights, translateAndSaveVideoSummary } from './services/videoService';
import { VideoSummary, HighlightedSegment } from './types';
import { useAuth } from './hooks/useAuth';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [videoData, setVideoData] = useState<VideoSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'analyze' | 'dashboard'>('analyze');
  const [isTranslating, setIsTranslating] = useState(false);
  const { user } = useAuth();

  const handleVideoSubmit = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setVideoData(null);

    try {
      const response = await analyzeVideo(url);
      
      if (response.success && response.data) {
        setVideoData(response.data);
        
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
  };

  const handleSelectVideo = (video: VideoSummary) => {
    setVideoData(video);
    setError(null);
    setCurrentView('analyze');
  };

  const handleUpdateHighlights = async (highlights: HighlightedSegment[]) => {
    if (!videoData || !user) return;

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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="container mx-auto py-8">
          {/* Navigation */}
          <div className="max-w-4xl mx-auto px-4 mb-8">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setCurrentView('analyze')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'analyze'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Analyze Video
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'dashboard'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                My Dashboard
              </button>
            </div>
          </div>

          {currentView === 'dashboard' ? (
            <Dashboard onSelectVideo={handleSelectVideo} />
          ) : (
            <>
              <URLInput onSubmit={handleVideoSubmit} isLoading={isLoading} />
              
              {error && <ErrorMessage message={error} onRetry={handleRetry} />}
              
              {videoData && (
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
                      />
                      
                      <EnhancedTranscript
                        transcript={videoData.transcript}
                        title={videoData.title}
                        highlightedSegments={videoData.highlightedSegments || []}
                        onUpdateHighlights={handleUpdateHighlights}
                      />
                    </div>
                    
                    <div className="space-y-6">
                      <TranslationPanel
                        originalLanguage={videoData.language || 'en'}
                        availableLanguages={[]}
                        onTranslate={handleTranslate}
                        translatedContent={videoData.translatedSummary}
                        isTranslating={isTranslating}
                      />
                      
                      <ExportPanel
                        videoData={videoData}
                        highlightedSegments={videoData.highlightedSegments}
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
      </div>
    </AuthGuard>
  );
}

export default App;