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
      }, {
        onConflict: 'user_id,video_id'
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

// Generate different mock data based on video ID to simulate different videos
const generateMockData = (videoId: string): VideoSummary => {
  // Create different content based on video ID
  const videoVariants = [
    {
      title: 'The Science of Productivity: What Actually Works',
      channelName: 'Learning Lab',
      summary: 'This comprehensive video explores evidence-based productivity techniques that have been scientifically proven to enhance performance and well-being. The presenter discusses the importance of deep work, time-blocking strategies, and the psychological principles behind effective habit formation.',
      bulletPoints: [
        'Deep work sessions of 90-120 minutes maximize cognitive performance and creative output',
        'Time-blocking with specific themes reduces decision fatigue and improves task completion rates',
        'The Pomodoro Technique works best when combined with strategic longer breaks every 4 cycles',
        'Environmental design has a profound impact on focus - minimize visual distractions and optimize lighting',
        'Sleep quality directly correlates with next-day productivity - aim for 7-9 hours of consistent sleep',
        'Single-tasking beats multitasking by up to 40% in both speed and accuracy of task completion'
      ],
      keyQuote: 'Productivity isn\'t about doing more things faster - it\'s about doing the right things with complete focus and intentionality.',
    },
    {
      title: 'Understanding Machine Learning: A Beginner\'s Guide',
      channelName: 'Tech Explained',
      summary: 'An accessible introduction to machine learning concepts, covering supervised and unsupervised learning, neural networks, and real-world applications. The video breaks down complex algorithms into understandable concepts for beginners.',
      bulletPoints: [
        'Machine learning is a subset of AI that enables computers to learn without explicit programming',
        'Supervised learning uses labeled data to train models for prediction and classification tasks',
        'Unsupervised learning finds hidden patterns in data without predefined labels or outcomes',
        'Neural networks mimic the human brain structure to process complex data relationships',
        'Feature engineering is crucial for model performance and requires domain expertise',
        'Cross-validation helps prevent overfitting and ensures model generalization to new data'
      ],
      keyQuote: 'Machine learning is not magic - it\'s mathematics applied to data with the goal of finding patterns that humans might miss.',
    },
    {
      title: 'The Future of Renewable Energy: Solar and Wind Power',
      channelName: 'Green Tech Today',
      summary: 'This video examines the latest developments in renewable energy technology, focusing on solar panel efficiency improvements and wind turbine innovations. It discusses the economic and environmental impact of transitioning to clean energy sources.',
      bulletPoints: [
        'Solar panel efficiency has increased from 15% to over 22% in the last decade',
        'Wind turbines are becoming larger and more efficient, with offshore installations leading growth',
        'Energy storage solutions like lithium-ion batteries are solving intermittency challenges',
        'Grid modernization is essential for integrating renewable energy sources effectively',
        'Government incentives and falling costs are accelerating renewable energy adoption',
        'Renewable energy jobs are growing faster than traditional energy sector employment'
      ],
      keyQuote: 'The transition to renewable energy is not just an environmental imperative - it\'s becoming an economic necessity.',
    }
  ];

  // Use video ID to determine which variant to use
  const variantIndex = videoId.charCodeAt(0) % videoVariants.length;
  const variant = videoVariants[variantIndex];

  return {
    videoId,
    title: variant.title,
    thumbnail: `https://images.pexels.com/photos/${3184338 + variantIndex}/pexels-photo-${3184338 + variantIndex}.jpeg?auto=compress&cs=tinysrgb&w=800`,
    duration: `${Math.floor(Math.random() * 10) + 8}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
    channelName: variant.channelName,
    language: 'en',
    summary: variant.summary,
    bulletPoints: variant.bulletPoints,
    keyQuote: variant.keyQuote,
    transcript: [
      {
        timestamp: '00:00',
        text: `Welcome to ${variant.channelName}. Today we're exploring ${variant.title.toLowerCase()}.`,
        start: 0
      },
      {
        timestamp: '00:15',
        text: 'Let\'s dive into the key concepts and understand what makes this topic so important.',
        start: 15
      },
      {
        timestamp: '00:32',
        text: variant.summary.substring(0, 100) + '...',
        start: 32
      },
      {
        timestamp: '01:05',
        text: 'This is a fundamental principle that many people overlook in their approach.',
        start: 65
      },
      {
        timestamp: '01:22',
        text: 'Research shows that understanding these concepts can significantly improve outcomes.',
        start: 82
      },
      {
        timestamp: '01:45',
        text: 'Let me share some practical examples that demonstrate these principles in action.',
        start: 105
      },
      {
        timestamp: '02:15',
        text: 'The data clearly supports this approach, and the results speak for themselves.',
        start: 135
      },
      {
        timestamp: '02:35',
        text: 'Implementation is key - knowing the theory is only half the battle.',
        start: 155
      },
      {
        timestamp: '03:10',
        text: 'Many experts in the field agree that this is a game-changing approach.',
        start: 190
      },
      {
        timestamp: '03:45',
        text: variant.keyQuote,
        start: 225
      }
    ],
    highlightedSegments: [
      {
        segmentIndex: 2,
        type: 'key_moment',
        timestamp: '00:32',
        text: variant.summary.substring(0, 100) + '...',
        reason: 'Key concept introduction'
      },
      {
        segmentIndex: 9,
        type: 'important',
        timestamp: '03:45',
        text: variant.keyQuote,
        reason: 'Main takeaway and memorable quote'
      }
    ]
  };
};

export const analyzeVideo = async (url: string): Promise<ApiResponse> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const videoId = extractVideoId(url);
  
  if (!videoId) {
    return {
      success: false,
      error: 'Invalid YouTube URL. Please check the URL and try again.'
    };
  }
  
  // Generate mock data based on video ID to ensure different videos return different content
  const mockVideoData = generateMockData(videoId);
  
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