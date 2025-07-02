import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle2, Lock, Clock, Zap } from 'lucide-react';
import { UsageData } from '../hooks/useUsageTracking';
import { validateYouTubeURL, extractVideoId } from '../services/videoService';

interface URLInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  canAnalyze: boolean;
  remainingUses: number;
  usageData: UsageData;
}

export const URLInput: React.FC<URLInputProps> = ({ 
  onSubmit, 
  isLoading, 
  canAnalyze,
  remainingUses,
  usageData
}) => {
  const [url, setUrl] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [extractedVideoId, setExtractedVideoId] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('🔍 URLInput: URL changed:', value);
    setUrl(value);
    
    if (value.length > 0) {
      const valid = validateYouTubeURL(value);
      const videoId = extractVideoId(value);
      
      console.log('✅ URLInput: Validation result:', { valid, videoId });
      setIsValid(valid);
      setExtractedVideoId(videoId);
    } else {
      setIsValid(null);
      setExtractedVideoId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && url.trim() && canAnalyze) {
      console.log('🚀 URLInput: Submitting URL:', url);
      console.log('🎯 URLInput: Extracted video ID:', extractedVideoId);
      onSubmit(url.trim());
    }
  };

  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilReset = tomorrow.getTime() - now.getTime();
    const hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60));
    const minutesUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hoursUntilReset > 0) {
      return `${hoursUntilReset}h ${minutesUntilReset}m`;
    }
    return `${minutesUntilReset}m`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Usage Status Banner */}
      {usageData.planType === 'free' && (
        <div className="mb-6">
          {canAnalyze ? (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">
                      {remainingUses} Free {remainingUses === 1 ? 'Analysis' : 'Analyses'} Today
                    </h3>
                    <p className="text-green-700 text-sm">
                      Resets in {getTimeUntilReset()} • Upgrade for unlimited access
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{remainingUses}</div>
                  <div className="text-xs text-green-600">remaining</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-900">Daily Limit Reached</h3>
                    <p className="text-orange-700 text-sm">
                      Resets in {getTimeUntilReset()} • Upgrade for unlimited access
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">0</div>
                  <div className="text-xs text-orange-600">remaining</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="url"
            value={url}
            onChange={handleChange}
            placeholder="Paste your YouTube video URL here..."
            className={`w-full px-4 py-4 pr-12 text-lg border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 ${
              !canAnalyze
                ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                : isValid === null
                ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                : isValid
                ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                : 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            }`}
            disabled={isLoading || !canAnalyze}
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            {!canAnalyze ? (
              <Lock className="w-6 h-6 text-gray-400" />
            ) : isValid === null ? (
              <Search className="w-6 h-6 text-gray-400" />
            ) : isValid ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-500" />
            )}
          </div>
        </div>
        
        {/* URL Validation Feedback */}
        {isValid === false && (
          <div className="text-red-600 text-sm flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>Please enter a valid YouTube URL</span>
          </div>
        )}

        {/* Video ID Display for Debugging */}
        {extractedVideoId && isValid && (
          <div className="text-green-600 text-sm flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Video ID: <code className="bg-green-50 px-2 py-1 rounded font-mono">{extractedVideoId}</code></span>
          </div>
        )}

        {/* Usage Limit Warning */}
        {!canAnalyze && usageData.planType === 'free' && (
          <div className="text-orange-600 text-sm flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Daily limit reached. Resets in {getTimeUntilReset()} or upgrade for unlimited access.</span>
          </div>
        )}
        
        <button
          type="submit"
          disabled={!isValid || isLoading || !canAnalyze}
          className={`w-full py-4 px-6 text-lg font-semibold rounded-xl transition-all duration-300 ${
            isValid && !isLoading && canAnalyze
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Analyzing Video...</span>
            </div>
          ) : !canAnalyze ? (
            usageData.planType === 'free' ? 'Daily Limit Reached' : 'Upgrade Required'
          ) : (
            'Analyze Video'
          )}
        </button>
      </form>

      {/* Supported URL Formats */}
      {url.length === 0 && (
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="font-semibold text-blue-900 mb-3">📺 Supported YouTube URL Formats</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <code className="bg-white px-2 py-1 rounded">https://www.youtube.com/watch?v=VIDEO_ID</code>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <code className="bg-white px-2 py-1 rounded">https://youtu.be/VIDEO_ID</code>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <code className="bg-white px-2 py-1 rounded">https://youtube.com/embed/VIDEO_ID</code>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>URLs with timestamps and parameters are supported</span>
            </div>
          </div>
        </div>
      )}

      {/* Pro Features Teaser */}
      {usageData.planType === 'free' && (
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-3">🚀 Unlock More with Pro</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Unlimited daily analyses</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Advanced AI insights</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>PDF & DOCX exports</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Multi-language translation</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className="text-blue-600 font-semibold">Starting at $19/month</span>
          </div>
        </div>
      )}
    </div>
  );
};