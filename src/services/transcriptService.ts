import { supabase } from '../lib/supabase';

export interface TranscriptSegment {
  start: number;
  duration: number;
  text: string;
}

export interface TranscriptResponse {
  success: boolean;
  data?: {
    videoId: string;
    transcript: any[]; // Frontend format with timestamp, text, start
    language: string;
    title?: string;
    duration?: string;
    channelName?: string;
    thumbnail?: string;
  };
  error?: string;
}

/**
 * Fetch real YouTube transcript using Supabase Edge Function
 */
export const fetchYouTubeTranscript = async (url: string): Promise<TranscriptResponse> => {
  try {
    console.log('🎬 Fetching real transcript for URL:', url);

    const { data, error } = await supabase.functions.invoke('fetch-transcript', {
      body: { url }
    });

    if (error) {
      console.error('❌ Supabase function error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch transcript'
      };
    }

    if (!data.success) {
      console.error('❌ Transcript fetch failed:', data.error);
      return {
        success: false,
        error: data.error || 'Failed to fetch transcript'
      };
    }

    console.log('✅ Transcript fetched successfully:', {
      videoId: data.data.videoId,
      segmentCount: data.data.transcript.length,
      language: data.data.language
    });

    return {
      success: true,
      data: data.data
    };

  } catch (error) {
    console.error('❌ Network error fetching transcript:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.'
    };
  }
};

/**
 * Fallback to mock transcript if real transcript fails
 */
export const fetchTranscriptWithFallback = async (url: string): Promise<TranscriptResponse> => {
  // First try to fetch real transcript
  const realTranscript = await fetchYouTubeTranscript(url);
  
  if (realTranscript.success) {
    return realTranscript;
  }

  console.warn('⚠️ Real transcript failed, using fallback:', realTranscript.error);

  // Fallback to mock transcript (existing logic)
  const { analyzeVideo } = await import('./videoService');
  const mockResult = await analyzeVideo(url);

  if (mockResult.success && mockResult.data) {
    return {
      success: true,
      data: {
        videoId: mockResult.data.videoId,
        transcript: mockResult.data.transcript,
        language: mockResult.data.language || 'en',
        title: mockResult.data.title,
        duration: mockResult.data.duration,
        channelName: mockResult.data.channelName,
        thumbnail: mockResult.data.thumbnail
      }
    };
  }

  return {
    success: false,
    error: realTranscript.error || 'Failed to fetch transcript'
  };
};