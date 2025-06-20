import React, { useState, useEffect } from 'react';
import { Clock, Copy, Check, Highlighter as Highlight, Star } from 'lucide-react';
import { TranscriptSegment, HighlightedSegment } from '../types';

interface HighlightedTranscriptProps {
  transcript: TranscriptSegment[];
  highlightedSegments: HighlightedSegment[];
  onUpdateHighlights: (highlights: HighlightedSegment[]) => void;
  searchHighlightIndex?: number;
}

export const HighlightedTranscript: React.FC<HighlightedTranscriptProps> = ({
  transcript,
  highlightedSegments,
  onUpdateHighlights,
  searchHighlightIndex,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedSegments, setSelectedSegments] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (searchHighlightIndex !== undefined) {
      const element = document.getElementById(`segment-${searchHighlightIndex}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [searchHighlightIndex]);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const toggleHighlight = (index: number, type: 'important' | 'key_moment' = 'important') => {
    const existingIndex = highlightedSegments.findIndex(h => h.segmentIndex === index);
    
    if (existingIndex >= 0) {
      // Remove highlight
      const newHighlights = highlightedSegments.filter(h => h.segmentIndex !== index);
      onUpdateHighlights(newHighlights);
    } else {
      // Add highlight
      const newHighlight: HighlightedSegment = {
        segmentIndex: index,
        type,
        timestamp: transcript[index].timestamp,
        text: transcript[index].text,
        reason: type === 'key_moment' ? 'Key moment identified' : 'Important information'
      };
      onUpdateHighlights([...highlightedSegments, newHighlight]);
    }
  };

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selectedSegments);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSegments(newSelected);
  };

  const highlightSelected = () => {
    const newHighlights = [...highlightedSegments];
    selectedSegments.forEach(index => {
      if (!highlightedSegments.find(h => h.segmentIndex === index)) {
        newHighlights.push({
          segmentIndex: index,
          type: 'important',
          timestamp: transcript[index].timestamp,
          text: transcript[index].text,
          reason: 'User highlighted'
        });
      }
    });
    onUpdateHighlights(newHighlights);
    setSelectedSegments(new Set());
  };

  const getSegmentHighlight = (index: number) => {
    return highlightedSegments.find(h => h.segmentIndex === index);
  };

  const getSegmentClasses = (index: number) => {
    const highlight = getSegmentHighlight(index);
    const isSelected = selectedSegments.has(index);
    const isSearchHighlight = searchHighlightIndex === index;
    
    let classes = 'group flex space-x-4 p-3 rounded-lg transition-all duration-200 ';
    
    if (isSearchHighlight) {
      classes += 'bg-yellow-100 border-2 border-yellow-300 ';
    } else if (highlight) {
      if (highlight.type === 'key_moment') {
        classes += 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 ';
      } else {
        classes += 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 ';
      }
    } else if (isSelected) {
      classes += 'bg-gray-100 border border-gray-300 ';
    } else {
      classes += 'hover:bg-gray-50 ';
    }
    
    return classes;
  };

  return (
    <div className="space-y-4">
      {selectedSegments.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
          <span className="text-blue-800">
            {selectedSegments.size} segment{selectedSegments.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex space-x-2">
            <button
              onClick={highlightSelected}
              className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              <Highlight className="w-3 h-3" />
              <span>Highlight Selected</span>
            </button>
            <button
              onClick={() => setSelectedSegments(new Set())}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="max-h-96 overflow-y-auto space-y-2">
        {transcript.map((segment, index) => {
          const highlight = getSegmentHighlight(index);
          
          return (
            <div
              key={index}
              id={`segment-${index}`}
              className={getSegmentClasses(index)}
            >
              <div className="flex-shrink-0 flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedSegments.has(index)}
                  onChange={() => toggleSelection(index)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {segment.timestamp}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-gray-700 leading-relaxed">{segment.text}</p>
                {highlight && (
                  <div className="mt-2 flex items-center space-x-2">
                    <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
                      highlight.type === 'key_moment' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      <Star className="w-3 h-3" />
                      <span>{highlight.reason}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleHighlight(index, 'important')}
                  className={`p-1 rounded transition-colors ${
                    highlight && highlight.type === 'important'
                      ? 'bg-blue-200 text-blue-700'
                      : 'hover:bg-gray-200 text-gray-500'
                  }`}
                  title="Highlight as important"
                >
                  <Highlight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleHighlight(index, 'key_moment')}
                  className={`p-1 rounded transition-colors ${
                    highlight && highlight.type === 'key_moment'
                      ? 'bg-purple-200 text-purple-700'
                      : 'hover:bg-gray-200 text-gray-500'
                  }`}
                  title="Mark as key moment"
                >
                  <Star className="w-4 h-4" />
                </button>
                <button
                  onClick={() => copyToClipboard(segment.text, index)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Copy segment"
                >
                  {copiedIndex === index ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};