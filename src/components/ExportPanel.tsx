import React, { useState } from 'react';
import { Download, FileText, File, FileImage, Loader2 } from 'lucide-react';
import { VideoSummary } from '../types';
import { exportToTxt, exportToPdf, exportToDocx } from '../utils/exportUtils';

interface ExportPanelProps {
  videoData: VideoSummary;
  highlightedSegments?: any[];
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ 
  videoData, 
  highlightedSegments = [] 
}) => {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExport = async (format: 'txt' | 'pdf' | 'docx') => {
    setIsExporting(format);
    
    try {
      const filename = `${videoData.title.replace(/[^a-zA-Z0-9]/g, '_')}_summary`;
      
      switch (format) {
        case 'txt':
          await exportToTxt(videoData, highlightedSegments, filename);
          break;
        case 'pdf':
          await exportToPdf(videoData, highlightedSegments, filename);
          break;
        case 'docx':
          await exportToDocx(videoData, highlightedSegments, filename);
          break;
      }
    } catch (error) {
      console.error(`Export to ${format} failed:`, error);
    } finally {
      setIsExporting(null);
    }
  };

  const exportOptions = [
    {
      format: 'txt' as const,
      icon: FileText,
      label: 'Text File (.txt)',
      description: 'Simple text format with all content',
    },
    {
      format: 'pdf' as const,
      icon: FileImage,
      label: 'PDF Document (.pdf)',
      description: 'Formatted document with styling',
    },
    {
      format: 'docx' as const,
      icon: File,
      label: 'Word Document (.docx)',
      description: 'Editable Microsoft Word format',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Download className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Export Options</h3>
      </div>

      <div className="space-y-3">
        {exportOptions.map(({ format, icon: Icon, label, description }) => (
          <button
            key={format}
            onClick={() => handleExport(format)}
            disabled={isExporting !== null}
            className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center space-x-3">
              <Icon className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">{label}</div>
                <div className="text-sm text-gray-500">{description}</div>
              </div>
            </div>
            
            {isExporting === format ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <Download className="w-5 h-5 text-gray-400" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Export includes:</strong> Video details, summary, bullet points, key quote, 
          full transcript, and highlighted segments.
        </p>
      </div>
    </div>
  );
};