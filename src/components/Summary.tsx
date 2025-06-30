import React from 'react';
import { FileText, List, Quote, Download, Sparkles } from 'lucide-react';

interface SummaryProps {
  summary: string;
  bulletPoints: string[];
  keyQuote: string;
  title: string;
  enhancedAI?: boolean;
}

export const Summary: React.FC<SummaryProps> = ({
  summary,
  bulletPoints,
  keyQuote,
  title,
  enhancedAI = false,
}) => {
  const downloadSummary = () => {
    const content = `${title}\n\n` +
      `SUMMARY:\n${summary}\n\n` +
      `KEY POINTS:\n${bulletPoints.map(point => `• ${point}`).join('\n')}\n\n` +
      `KEY QUOTE:\n"${keyQuote}"`;
    
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

      {/* Key Quote Section */}
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