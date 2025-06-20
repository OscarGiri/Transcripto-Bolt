import { TranslationRequest, TranslationResponse } from '../types';

// Mock translation service - replace with real translation API
export const translateText = async (
  request: TranslationRequest
): Promise<TranslationResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock translation - in production, use Google Translate API, Azure Translator, or similar
  const mockTranslations: { [key: string]: { [key: string]: string } } = {
    'es': {
      'The Science of Productivity: What Actually Works': 'La Ciencia de la Productividad: Lo Que Realmente Funciona',
      'This comprehensive video explores evidence-based productivity techniques': 'Este video integral explora técnicas de productividad basadas en evidencia',
    },
    'fr': {
      'The Science of Productivity: What Actually Works': 'La Science de la Productivité : Ce Qui Fonctionne Vraiment',
      'This comprehensive video explores evidence-based productivity techniques': 'Cette vidéo complète explore les techniques de productivité basées sur des preuves',
    },
    'de': {
      'The Science of Productivity: What Actually Works': 'Die Wissenschaft der Produktivität: Was Wirklich Funktioniert',
      'This comprehensive video explores evidence-based productivity techniques': 'Dieses umfassende Video erforscht evidenzbasierte Produktivitätstechniken',
    },
  };

  const translatedText = mockTranslations[request.targetLanguage]?.[request.text] || 
    `[${request.targetLanguage.toUpperCase()}] ${request.text}`;

  return {
    translatedText,
    sourceLanguage: request.sourceLanguage || 'en',
    targetLanguage: request.targetLanguage,
  };
};

export const translateVideoSummary = async (
  summary: string,
  targetLanguage: string,
  sourceLanguage: string = 'en'
): Promise<string> => {
  const response = await translateText({
    text: summary,
    targetLanguage,
    sourceLanguage,
  });
  
  return response.translatedText;
};

export const translateTranscript = async (
  transcript: any[],
  targetLanguage: string,
  sourceLanguage: string = 'en'
): Promise<any[]> => {
  // In production, batch translate all segments
  const translatedSegments = await Promise.all(
    transcript.map(async (segment) => {
      const response = await translateText({
        text: segment.text,
        targetLanguage,
        sourceLanguage,
      });
      
      return {
        ...segment,
        text: response.translatedText,
      };
    })
  );
  
  return translatedSegments;
};