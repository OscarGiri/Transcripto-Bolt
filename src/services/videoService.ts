import { supabase } from '../lib/supabase';
import { VideoSummary, ApiResponse, HighlightedSegment } from '../types';
import { translateVideoSummary } from './translationService';

export const saveVideoSummary = async (
  userId: string,
  videoData: VideoSummary
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('video_summaries')
      .upsert({
        user_id: userId,
        video_id: videoData.videoId,
        title: videoData.title,
        thumbnail: videoData.thumbnail,
        duration: videoData.duration,
        channel_name: videoData.channelName,
        summary: videoData.summary,
        bullet_points: videoData.bulletPoints,
        key_quote: videoData.keyQuote,
        transcript: videoData.transcript,
        highlighted_segments: videoData.highlightedSegments || [],
        language: videoData.language || 'en',
        translated_summary: videoData.translatedSummary || {},
        translated_transcript: videoData.translatedTranscript || {},
      });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error saving video summary:', error);
    return { success: false, error: 'Failed to save video summary' };
  }
};

export const updateVideoHighlights = async (
  userId: string,
  videoId: string,
  highlights: HighlightedSegment[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('video_summaries')
      .update({ highlighted_segments: highlights })
      .eq('user_id', userId)
      .eq('video_id', videoId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating highlights:', error);
    return { success: false, error: 'Failed to update highlights' };
  }
};

export const translateAndSaveVideoSummary = async (
  userId: string,
  videoId: string,
  targetLanguage: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get current video data
    const { data: videoData, error: fetchError } = await supabase
      .from('video_summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single();

    if (fetchError) throw fetchError;

    // Translate summary
    const translatedSummary = await translateVideoSummary(
      videoData.summary,
      targetLanguage,
      videoData.language || 'en'
    );

    // Update with translation
    const currentTranslations = videoData.translated_summary || {};
    currentTranslations[targetLanguage] = translatedSummary;

    const { error: updateError } = await supabase
      .from('video_summaries')
      .update({ translated_summary: currentTranslations })
      .eq('user_id', userId)
      .eq('video_id', videoId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error('Error translating video summary:', error);
    return { success: false, error: 'Failed to translate video summary' };
  }
};

export const getUserVideoSummaries = async (
  userId: string
): Promise<{ success: boolean; data?: VideoSummary[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('video_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedVideos: VideoSummary[] = data.map(item => ({
      id: item.id,
      title: item.title,
      thumbnail: item.thumbnail,
      duration: item.duration,
      channelName: item.channel_name,
      summary: item.summary,
      bulletPoints: item.bullet_points,
      keyQuote: item.key_quote,
      transcript: item.transcript,
      videoId: item.video_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      highlightedSegments: item.highlighted_segments || [],
      language: item.language || 'en',
      translatedSummary: item.translated_summary || {},
      translatedTranscript: item.translated_transcript || {},
    }));

    return { success: true, data: formattedVideos };
  } catch (error) {
    console.error('Error fetching video summaries:', error);
    return { success: false, error: 'Failed to fetch video summaries' };
  }
};

// Enhanced mock API with auto-highlighting
export const analyzeVideo = async (url: string): Promise<ApiResponse> => {
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const videoId = extractVideoId(url);
  
  if (!videoId) {
    return {
      success: false,
      error: 'Invalid YouTube URL. Please check the URL and try again.'
    };
  }
  
  // Enhanced mock data with auto-highlighted segments
  const mockVideoData: VideoSummary = {
    videoId,
    title: 'The Science of Productivity: What Actually Works',
    thumbnail: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800',
    duration: '12:34',
    channelName: 'Learning Lab',
    language: 'en',
    summary: 'This comprehensive video explores evidence-based productivity techniques that have been scientifically proven to enhance performance and well-being. The presenter discusses the importance of deep work, time-blocking strategies, and the psychological principles behind effective habit formation. Key insights include the role of focused attention in creative problem-solving and how strategic breaks can actually boost overall productivity rather than hinder it.',
    bulletPoints: [
      'Deep work sessions of 90-120 minutes maximize cognitive performance and creative output',
      'Time-blocking with specific themes reduces decision fatigue and improves task completion rates',
      'The Pomodoro Technique works best when combined with strategic longer breaks every 4 cycles',
      'Environmental design has a profound impact on focus - minimize visual distractions and optimize lighting',
      'Sleep quality directly correlates with next-day productivity - aim for 7-9 hours of consistent sleep',
      'Single-tasking beats multitasking by up to 40% in both speed and accuracy of task completion'
    ],
    keyQuote: 'Productivity isn\'t about doing more things faster - it\'s about doing the right things with complete focus and intentionality.',
    transcript: [
      {
        timestamp: '00:00',
        text: 'Welcome back to Learning Lab. Today we\'re diving deep into the science of productivity and what actually works versus what we think works.',
        start: 0
      },
      {
        timestamp: '00:15',
        text: 'Most productivity advice is based on intuition rather than research. But what does the science actually tell us about peak performance?',
        start: 15
      },
      {
        timestamp: '00:32',
        text: 'Let\'s start with the concept of deep work. Research from Cal Newport and others shows that our brains can sustain focused attention for about 90 to 120 minutes at a time.',
        start: 32
      },
      {
        timestamp: '01:05',
        text: 'This is why the traditional 8-hour workday with constant interruptions is actually counterproductive to getting meaningful work done.',
        start: 65
      },
      {
        timestamp: '01:22',
        text: 'Time-blocking is another strategy that\'s gained popularity, but it only works when you theme your blocks. Random time slots don\'t reduce cognitive load.',
        start: 82
      },
      {
        timestamp: '01:45',
        text: 'The Pomodoro Technique - working in 25-minute bursts - can be effective, but research suggests it works best when you take longer breaks every 4 cycles.',
        start: 105
      },
      {
        timestamp: '02:15',
        text: 'Here\'s something most people don\'t consider: your physical environment has a massive impact on your ability to focus and be productive.',
        start: 135
      },
      {
        timestamp: '02:35',
        text: 'Visual clutter increases cortisol levels and reduces working memory capacity. A clean, organized workspace isn\'t just aesthetic - it\'s functional.',
        start: 155
      },
      {
        timestamp: '03:10',
        text: 'Sleep is perhaps the most underrated productivity tool. Studies show that even one night of poor sleep can reduce cognitive performance by up to 40%.',
        start: 190
      },
      {
        timestamp: '03:45',
        text: 'Finally, let\'s talk about multitasking. Despite what many believe, the human brain cannot truly multitask. What we call multitasking is actually task-switching.',
        start: 225
      },
      {
        timestamp: '04:20',
        text: 'Every time we switch between tasks, there\'s a cognitive cost. Research shows that single-tasking beats multitasking by up to 40% in both speed and accuracy.',
        start: 260
      },
      {
        timestamp: '04:55',
        text: 'Remember, productivity isn\'t about doing more things faster - it\'s about doing the right things with complete focus and intentionality.',
        start: 295
      }
    ],
    // Auto-generated highlights based on content analysis
    highlightedSegments: [
      {
        segmentIndex: 2,
        type: 'key_moment',
        timestamp: '00:32',
        text: 'Let\'s start with the concept of deep work. Research from Cal Newport and others shows that our brains can sustain focused attention for about 90 to 120 minutes at a time.',
        reason: 'Key research finding about attention spans'
      },
      {
        segmentIndex: 8,
        type: 'important',
        timestamp: '03:10',
        text: 'Sleep is perhaps the most underrated productivity tool. Studies show that even one night of poor sleep can reduce cognitive performance by up to 40%.',
        reason: 'Critical statistic about sleep impact'
      },
      {
        segmentIndex: 11,
        type: 'key_moment',
        timestamp: '04:55',
        text: 'Remember, productivity isn\'t about doing more things faster - it\'s about doing the right things with complete focus and intentionality.',
        reason: 'Main takeaway and memorable quote'
      }
    ]
  };
  
  return {
    success: true,
    data: mockVideoData
  };
};

const extractVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};