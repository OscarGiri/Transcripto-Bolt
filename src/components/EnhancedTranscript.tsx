import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import { TranscriptSegment, HighlightedSegment } from '../types';
import { TranscriptSearch } from './TranscriptSearch';
import { HighlightedTranscript } from './HighlightedTranscript';

interface EnhancedTranscriptProps {
  transcript: TranscriptSegment[];
  title: string;
  highlightedSegments: HighlightedSegment[];
  onUpdateHighlights: (highlights: HighlightedSegment[]) => void;
}

export const EnhancedTranscript: React.FC<EnhancedTranscriptProps> = ({
  transcript,
  title,
  highlightedSegments,
  onUpdateHighlights,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchHighlightIndex, setSearchHighlightIndex] = useState<number | undefined>();

  const downloadTranscript = () => {
    const content = `${title}\n\nFULL TRANSCRIPT:\n\n` +
      transcript.map(segment => `[${segment.timestamp}] ${segment.text}`).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSearchHighlight = (segmentIndex: number) => {
    setSearchHighlightIndex(segmentIndex);
    setIsExpanded(true);
  };

  return (
    <div className="space-y-4">
      <TranscriptSearch
        transcript={transcript}
        onHighlight={handleSearchHighlight}
      />

      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">Enhanced Transcript</h3>
              <span className="text-sm text-gray-500">
                ({transcript.length} segments, {highlightedSegments.length} highlighted)
              </span>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-600">
                Click segments to highlight important moments or key information
              </div>
              <button
                onClick={downloadTranscript}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
            
            <HighlightedTranscript
              transcript={transcript}
              highlightedSegments={highlightedSegments}
              onUpdateHighlights={onUpdateHighlights}
              searchHighlightIndex={searchHighlightIndex}
            />
          </div>
        )}
      </div>
    </div>
  );
};