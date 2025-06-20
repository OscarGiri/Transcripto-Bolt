import React, { useState } from 'react';
import { Languages, Loader2, CheckCircle2 } from 'lucide-react';

interface TranslationPanelProps {
  originalLanguage: string;
  availableLanguages: { code: string; name: string }[];
  onTranslate: (targetLanguage: string) => Promise<void>;
  translatedContent?: {
    summary?: string;
    transcript?: any[];
  };
  isTranslating: boolean;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
];

export const TranslationPanel: React.FC<TranslationPanelProps> = ({
  originalLanguage,
  onTranslate,
  translatedContent,
  isTranslating,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [translatedLanguages, setTranslatedLanguages] = useState<Set<string>>(new Set());

  const handleTranslate = async () => {
    if (!selectedLanguage || selectedLanguage === originalLanguage) return;
    
    try {
      await onTranslate(selectedLanguage);
      setTranslatedLanguages(prev => new Set([...prev, selectedLanguage]));
    } catch (error) {
      console.error('Translation failed:', error);
    }
  };

  const availableTargetLanguages = SUPPORTED_LANGUAGES.filter(
    lang => lang.code !== originalLanguage
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Languages className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Translation</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Original Language
          </label>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium">
              {SUPPORTED_LANGUAGES.find(l => l.code === originalLanguage)?.name || originalLanguage}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Translate to
          </label>
          <div className="flex items-center space-x-2">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isTranslating}
            >
              <option value="">Select language...</option>
              {availableTargetLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleTranslate}
              disabled={!selectedLanguage || isTranslating || selectedLanguage === originalLanguage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Translating...</span>
                </>
              ) : (
                <span>Translate</span>
              )}
            </button>
          </div>
        </div>

        {translatedLanguages.size > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Translations
            </label>
            <div className="flex flex-wrap gap-2">
              {Array.from(translatedLanguages).map(langCode => {
                const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
                return (
                  <div
                    key={langCode}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-sm"
                  >
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <span className="text-green-800">{lang?.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {translatedContent && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Translated Summary</h4>
            <p className="text-gray-700 text-sm leading-relaxed">
              {translatedContent.summary || 'Translation in progress...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};