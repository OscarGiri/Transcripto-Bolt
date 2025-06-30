export interface VideoSummary {
  id?: string;
  title: string;
  thumbnail: string;
  duration: string;
  channelName: string;
  summary: string;
  bulletPoints: string[];
  keyQuote: string;
  memorableQuotes?: {
    best: string;
    viral: string;
    powerful: string;
  };
  transcript: TranscriptSegment[];
  videoId: string;
  createdAt?: string;
  updatedAt?: string;
  highlightedSegments?: HighlightedSegment[];
  language?: string;
  translatedSummary?: { [languageCode: string]: string };
  translatedTranscript?: { [languageCode: string]: TranscriptSegment[] };
}

export interface TranscriptSegment {
  timestamp: string;
  text: string;
  start: number;
}

export interface HighlightedSegment {
  segmentIndex: number;
  type: 'important' | 'key_moment';
  timestamp: string;
  text: string;
  reason: string;
}

export interface ApiResponse {
  success: boolean;
  data?: VideoSummary;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}

export interface TranslationRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface TranslationResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}