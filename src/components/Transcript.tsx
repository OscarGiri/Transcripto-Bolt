import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Copy, Check } from 'lucide-react';
import { TranscriptSegment } from '../types';

interface TranscriptProps {
  transcript: TranscriptSegment[];
  title: string;
}

export const Transcript: React.FC<TranscriptProps> = ({ transcript, title }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

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

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Full Transcript</h3>
            <span className="text-sm text-gray-500">({transcript.length} segments)</span>
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
          <div className="flex justify-end mb-4">
            <button
              onClick={downloadTranscript}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Download Transcript</span>
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-4">
            {transcript.map((segment, index) => (
              <div
                key={index}
                className="group flex space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {segment.timestamp}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 leading-relaxed">{segment.text}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(segment.text, index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                  title="Copy segment"
                >
                  {copiedIndex === index ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};