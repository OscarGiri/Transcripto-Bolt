import React, { useState } from 'react';
import { FileText, List, Quote, Download, Sparkles, Star, Zap, Heart, Copy, Check } from 'lucide-react';

interface SummaryProps {
  summary: string;
  bulletPoints: string[];
  keyQuote: string;
  memorableQuotes?: {
    best: string;
    viral: string;
    powerful: string;
  };
  title: string;
  enhancedAI?: boolean;
}

export const Summary: React.FC<SummaryProps> = ({
  summary,
  bulletPoints,
  keyQuote,
  memorableQuotes,
  title,
  enhancedAI = false,
}) => {
  const [copiedQuote, setCopiedQuote] = useState<string | null>(null);

  const downloadSummary = () => {
    let content = `${title}\n\n` +
      `SUMMARY:\n${summary}\n\n` +
      `KEY POINTS:\n${bulletPoints.map(point => `• ${point}`).join('\n')}\n\n` +
      `KEY QUOTE:\n"${keyQuote}"`;

    if (memorableQuotes) {
      content += `\n\nMEMORABLE QUOTES:\n\n` +
        `BEST QUOTE:\n"${memorableQuotes.best}"\n\n` +
        `VIRAL QUOTE:\n"${memorableQuotes.viral}"\n\n` +
        `POWERFUL QUOTE:\n"${memorableQuotes.powerful}"`;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyQuote = async (quote: string, type: string) => {
    try {
      await navigator.clipboard.writeText(`"${quote}"`);
      setCopiedQuote(type);
      setTimeout(() => setCopiedQuote(null), 2000);
    } catch (err) {
      console.error('Failed to copy quote: ', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
          {enhancedAI && (
            <div className="flex items-center space-x-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
              <Sparkles className="w-3 h-3" />
              <span>Enhanced AI</span>
            </div>
          )}
        </div>
        <p className="text-gray-700 leading-relaxed">{summary}</p>
        {enhancedAI && (
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>AI Enhancement:</strong> This summary includes deeper context analysis, 
              sentiment insights, and improved readability powered by advanced AI models.
            </p>
          </div>
        )}
      </div>

      {/* Bullet Points Section */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-center space-x-2 mb-4">
          <List className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Key Learning Points</h3>
          {enhancedAI && (
            <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
              <Sparkles className="w-3 h-3" />
              <span>AI Curated</span>
            </div>
          )}
        </div>
        <ul className="space-y-3">
          {bulletPoints.map((point, index) => (
            <li key={index} className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-700">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Enhanced Quotes Section */}
      {memorableQuotes ? (
        <div className="space-y-4">
          {/* Best Quote */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">Best Quote</h3>
                <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
                  <Star className="w-3 h-3" />
                  <span>Most Insightful</span>
                </div>
              </div>
              <button
                onClick={() => copyQuote(memorableQuotes.best, 'best')}
                className="p-2 hover:bg-yellow-100 rounded-lg transition-colors"
                title="Copy quote"
              >
                {copiedQuote === 'best' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-yellow-600" />
                )}
              </button>
            </div>
            <blockquote className="text-gray-700 italic text-lg leading-relaxed">
              "{memorableQuotes.best}"
            </blockquote>
          </div>

          {/* Viral Quote */}
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-pink-600" />
                <h3 className="text-lg font-semibold text-gray-900">Viral Quote</h3>
                <div className="flex items-center space-x-1 bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs">
                  <Zap className="w-3 h-3" />
                  <span>Most Shareable</span>
                </div>
              </div>
              <button
                onClick={() => copyQuote(memorableQuotes.viral, 'viral')}
                className="p-2 hover:bg-pink-100 rounded-lg transition-colors"
                title="Copy quote"
              >
                {copiedQuote === 'viral' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-pink-600" />
                )}
              </button>
            </div>
            <blockquote className="text-gray-700 italic text-lg leading-relaxed">
              "{memorableQuotes.viral}"
            </blockquote>
          </div>

          {/* Powerful Quote */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Powerful Quote</h3>
                <div className="flex items-center space-x-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                  <Heart className="w-3 h-3" />
                  <span>Most Impactful</span>
                </div>
              </div>
              <button
                onClick={() => copyQuote(memorableQuotes.powerful, 'powerful')}
                className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                title="Copy quote"
              >
                {copiedQuote === 'powerful' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-purple-600" />
                )}
              </button>
            </div>
            <blockquote className="text-gray-700 italic text-lg leading-relaxed">
              "{memorableQuotes.powerful}"
            </blockquote>
          </div>
        </div>
      ) : (
        /* Fallback to single quote */
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
          <div className="flex items-center space-x-2 mb-4">
            <Quote className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Memorable Quote</h3>
            {enhancedAI && (
              <div className="flex items-center space-x-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                <Sparkles className="w-3 h-3" />
                <span>AI Selected</span>
              </div>
            )}
          </div>
          <blockquote className="text-gray-700 italic text-lg leading-relaxed">
            "{keyQuote}"
          </blockquote>
        </div>
      )}

      {/* Download Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={downloadSummary}
          className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Download className="w-4 h-4" />
          <span>Download Summary</span>
        </button>
      </div>
    </div>
  );
};