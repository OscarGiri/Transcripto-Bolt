import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

interface TranscriptSegment {
  start: number;
  duration: number;
  text: string;
}

interface TranscriptResponse {
  success: boolean;
  data?: {
    videoId: string;
    transcript: TranscriptSegment[];
    language: string;
    title?: string;
    duration?: string;
    channelName?: string;
    thumbnail?: string;
  };
  error?: string;
}

/**
 * Enhanced YouTube video ID extraction function
 * Supports all YouTube URL formats
 */
function extractVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const cleanUrl = url.trim();

  // Comprehensive regex patterns for different YouTube URL formats
  const patterns = [
    // Standard watch URLs: https://www.youtube.com/watch?v=VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    
    // Short URLs: https://youtu.be/VIDEO_ID
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    
    // Embed URLs: https://www.youtube.com/embed/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    
    // YouTube mobile URLs: https://m.youtube.com/watch?v=VIDEO_ID
    /(?:https?:\/\/)?m\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    
    // YouTube gaming URLs: https://gaming.youtube.com/watch?v=VIDEO_ID
    /(?:https?:\/\/)?gaming\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    
    // YouTube music URLs: https://music.youtube.com/watch?v=VIDEO_ID
    /(?:https?:\/\/)?music\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    
    // Direct video ID (11 characters, alphanumeric + _ -)
    /^([a-zA-Z0-9_-]{11})$/
  ];

  // Try each pattern
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    
    if (match && match[1]) {
      const videoId = match[1];
      
      // Validate video ID format (11 characters, alphanumeric + underscore + hyphen)
      if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return videoId;
      }
    }
  }

  return null;
}

/**
 * Fetch YouTube video metadata using YouTube Data API v3
 */
async function fetchVideoMetadata(videoId: string): Promise<{
  title?: string;
  duration?: string;
  channelName?: string;
  thumbnail?: string;
} | null> {
  try {
    // Note: In production, you would use the YouTube Data API v3
    // For now, we'll return null and let the transcript fetcher handle metadata
    return null;
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    return null;
  }
}

/**
 * Fetch transcript using YouTube's internal API
 * This mimics the functionality of youtube-transcript-api
 */
async function fetchYouTubeTranscript(videoId: string): Promise<{
  transcript: TranscriptSegment[];
  language: string;
  title?: string;
  duration?: string;
  channelName?: string;
  thumbnail?: string;
}> {
  try {
    // Step 1: Get the video page to extract necessary data
    const videoPageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!videoPageResponse.ok) {
      throw new Error(`Failed to fetch video page: ${videoPageResponse.status}`);
    }

    const videoPageHtml = await videoPageResponse.text();

    // Extract video metadata from the page
    const titleMatch = videoPageHtml.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : undefined;

    // Extract channel name
    const channelMatch = videoPageHtml.match(/"ownerChannelName":"([^"]+)"/);
    const channelName = channelMatch ? channelMatch[1] : undefined;

    // Extract thumbnail
    const thumbnailMatch = videoPageHtml.match(/"videoDetails":\s*{[^}]*"thumbnail":\s*{[^}]*"thumbnails":\s*\[([^\]]+)\]/);
    let thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`; // Default thumbnail

    // Extract duration
    const durationMatch = videoPageHtml.match(/"lengthSeconds":"(\d+)"/);
    let duration = undefined;
    if (durationMatch) {
      const seconds = parseInt(durationMatch[1]);
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
      
      if (hours > 0) {
        duration = `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
      } else {
        duration = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
      }
    }

    // Extract caption tracks
    const captionTracksMatch = videoPageHtml.match(/"captionTracks":\s*(\[[^\]]+\])/);
    
    if (!captionTracksMatch) {
      throw new Error('No captions available for this video');
    }

    const captionTracks = JSON.parse(captionTracksMatch[1]);
    
    if (!captionTracks || captionTracks.length === 0) {
      throw new Error('No caption tracks found');
    }

    // Find the best caption track (prefer auto-generated English, then manual, then any available)
    let selectedTrack = captionTracks.find((track: any) => 
      track.languageCode === 'en' && track.kind === 'asr'
    ) || captionTracks.find((track: any) => 
      track.languageCode === 'en'
    ) || captionTracks[0];

    if (!selectedTrack || !selectedTrack.baseUrl) {
      throw new Error('No valid caption track found');
    }

    // Step 2: Fetch the transcript XML
    const transcriptResponse = await fetch(selectedTrack.baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!transcriptResponse.ok) {
      throw new Error(`Failed to fetch transcript: ${transcriptResponse.status}`);
    }

    const transcriptXml = await transcriptResponse.text();

    // Step 3: Parse the XML transcript
    const transcript = parseTranscriptXml(transcriptXml);

    return {
      transcript,
      language: selectedTrack.languageCode || 'en',
      title,
      duration,
      channelName,
      thumbnail
    };

  } catch (error) {
    console.error('Error fetching YouTube transcript:', error);
    throw error;
  }
}

/**
 * Parse YouTube transcript XML into structured data
 */
function parseTranscriptXml(xml: string): TranscriptSegment[] {
  const transcript: TranscriptSegment[] = [];
  
  // Extract text elements using regex (since we don't have a full XML parser)
  const textMatches = xml.matchAll(/<text start="([^"]+)" dur="([^"]+)"[^>]*>([^<]+)<\/text>/g);
  
  for (const match of textMatches) {
    const start = parseFloat(match[1]);
    const duration = parseFloat(match[2]);
    let text = match[3];
    
    // Decode HTML entities
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
    
    // Clean up the text
    text = text.trim();
    
    if (text && !isNaN(start) && !isNaN(duration)) {
      transcript.push({
        start: Math.round(start * 1000) / 1000, // Round to 3 decimal places
        duration: Math.round(duration * 1000) / 1000,
        text
      });
    }
  }
  
  return transcript;
}

/**
 * Convert transcript segments to the format expected by the frontend
 */
function formatTranscriptForFrontend(segments: TranscriptSegment[]): any[] {
  return segments.map(segment => {
    const totalSeconds = Math.floor(segment.start);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    let timestamp: string;
    if (hours > 0) {
      timestamp = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return {
      timestamp,
      text: segment.text,
      start: segment.start
    };
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Method not allowed. Use POST.' 
      }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required field: url' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract video ID from URL
    const videoId = extractVideoId(url);
    
    if (!videoId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid YouTube URL. Please provide a valid YouTube video URL.' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Fetching transcript for video ID: ${videoId}`);

    // Fetch the transcript
    const transcriptData = await fetchYouTubeTranscript(videoId);
    
    // Format transcript for frontend compatibility
    const formattedTranscript = formatTranscriptForFrontend(transcriptData.transcript);

    const response: TranscriptResponse = {
      success: true,
      data: {
        videoId,
        transcript: formattedTranscript,
        language: transcriptData.language,
        title: transcriptData.title,
        duration: transcriptData.duration,
        channelName: transcriptData.channelName,
        thumbnail: transcriptData.thumbnail
      }
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Transcript fetch error:', error);
    
    let errorMessage = 'Failed to fetch transcript';
    
    if (error instanceof Error) {
      if (error.message.includes('No captions available')) {
        errorMessage = 'This video does not have captions available';
      } else if (error.message.includes('Failed to fetch video page')) {
        errorMessage = 'Video not found or is private/unavailable';
      } else if (error.message.includes('No caption tracks found')) {
        errorMessage = 'No transcript available for this video';
      } else {
        errorMessage = error.message;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});