import React, { useState } from 'react';
import { Download, FileText, File, FileImage, Loader2, Lock } from 'lucide-react';
import { VideoSummary } from '../types';
import { exportToTxt, exportToPdf, exportToDocx } from '../utils/exportUtils';

interface ExportPanelProps {
  videoData: VideoSummary;
  highlightedSegments?: any[];
  onExportRestriction?: (format: 'pdf' | 'docx') => boolean;
  pdfDocxEnabled?: boolean;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ 
  videoData, 
  highlightedSegments = [],
  onExportRestriction,
  pdfDocxEnabled = false,
}) => {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExport = async (format: 'txt' | 'pdf' | 'docx') => {
    if ((format === 'pdf' || format === 'docx') && onExportRestriction) {
      if (!onExportRestriction(format)) {
        return;
      }
    }

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
      enabled: true,
    },
    {
      format: 'pdf' as const,
      icon: FileImage,
      label: 'PDF Document (.pdf)',
      description: 'Formatted document with styling',
      enabled: pdfDocxEnabled,
    },
    {
      format: 'docx' as const,
      icon: File,
      label: 'Word Document (.docx)',
      description: 'Editable Microsoft Word format',
      enabled: pdfDocxEnabled,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Download className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Export Options</h3>
      </div>

      <div className="space-y-3">
        {exportOptions.map(({ format, icon: Icon, label, description, enabled }) => (
          <button
            key={format}
            onClick={() => handleExport(format)}
            disabled={isExporting !== null || !enabled}
            className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors ${
              enabled
                ? 'border-gray-200 hover:bg-gray-50'
                : 'border-gray-200 bg-gray-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Icon className={`w-5 h-5 ${enabled ? 'text-gray-600' : 'text-gray-400'}`} />
              <div className="text-left">
                <div className={`font-medium flex items-center space-x-2 ${
                  enabled ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  <span>{label}</span>
                  {!enabled && (
                    <div className="flex items-center space-x-1 bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                      <Lock className="w-3 h-3" />
                      <span>Pro</span>
                    </div>
                  )}
                </div>
                <div className={`text-sm ${enabled ? 'text-gray-500' : 'text-gray-400'}`}>
                  {description}
                </div>
              </div>
            </div>
            
            {isExporting === format ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : enabled ? (
              <Download className="w-5 h-5 text-gray-400" />
            ) : (
              <Lock className="w-5 h-5 text-gray-400" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Export includes:</strong> Video details, summary, bullet points, key quote, 
          full transcript{highlightedSegments.length > 0 ? ', and highlighted segments' : ''}.
        </p>
      </div>
    </div>
  );
};