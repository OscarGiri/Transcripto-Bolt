import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle2 } from 'lucide-react';

interface URLInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export const URLInput: React.FC<URLInputProps> = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const validateYouTubeURL = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return youtubeRegex.test(url);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    
    if (value.length > 0) {
      setIsValid(validateYouTubeURL(value));
    } else {
      setIsValid(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="url"
            value={url}
            onChange={handleChange}
            placeholder="Paste your YouTube video URL here..."
            className={`w-full px-4 py-4 pr-12 text-lg border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 ${
              isValid === null
                ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                : isValid
                ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                : 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            }`}
            disabled={isLoading}
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            {isValid === null ? (
              <Search className="w-6 h-6 text-gray-400" />
            ) : isValid ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-500" />
            )}
          </div>
        </div>
        
        {isValid === false && (
          <p className="text-red-600 text-sm flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>Please enter a valid YouTube URL</span>
          </p>
        )}
        
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className={`w-full py-4 px-6 text-lg font-semibold rounded-xl transition-all duration-300 ${
            isValid && !isLoading
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Analyzing Video...</span>
            </div>
          ) : (
            'Summarize Video'
          )}
        </button>
      </form>
    </div>
  );
};