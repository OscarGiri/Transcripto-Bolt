import React, { useState, useMemo } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { TranscriptSegment } from '../types';

interface TranscriptSearchProps {
  transcript: TranscriptSegment[];
  onHighlight: (segmentIndex: number) => void;
}

export const TranscriptSearch: React.FC<TranscriptSearchProps> = ({
  transcript,
  onHighlight,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(0);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const results: { index: number; segment: TranscriptSegment; matchText: string }[] = [];
    const searchLower = searchTerm.toLowerCase();
    
    transcript.forEach((segment, index) => {
      if (segment.text.toLowerCase().includes(searchLower)) {
        const matchIndex = segment.text.toLowerCase().indexOf(searchLower);
        const start = Math.max(0, matchIndex - 50);
        const end = Math.min(segment.text.length, matchIndex + searchTerm.length + 50);
        const matchText = segment.text.substring(start, end);
        
        results.push({ index, segment, matchText });
      }
    });
    
    return results;
  }, [searchTerm, transcript]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      setCurrentMatch(0);
      onHighlight(searchResults[0].index);
      setIsExpanded(true);
    }
  };

  const navigateMatch = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
    
    let newMatch;
    if (direction === 'next') {
      newMatch = (currentMatch + 1) % searchResults.length;
    } else {
      newMatch = currentMatch === 0 ? searchResults.length - 1 : currentMatch - 1;
    }
    
    setCurrentMatch(newMatch);
    onHighlight(searchResults[newMatch].index);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentMatch(0);
    setIsExpanded(false);
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
      <div className="p-4 border-b border-gray-200">
        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in transcript..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {searchResults.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {currentMatch + 1} of {searchResults.length}
              </span>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => navigateMatch('prev')}
                  className="p-1 hover:bg-gray-100 rounded"
                  disabled={searchResults.length <= 1}
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigateMatch('next')}
                  className="p-1 hover:bg-gray-100 rounded"
                  disabled={searchResults.length <= 1}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {searchResults.length > 0 && isExpanded && (
        <div className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3">
            Search Results ({searchResults.length})
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {searchResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  index === currentMatch
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => {
                  setCurrentMatch(index);
                  onHighlight(result.index);
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {result.segment.timestamp}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  {highlightText(result.matchText, searchTerm)}
                  {result.matchText.length < result.segment.text.length && '...'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};