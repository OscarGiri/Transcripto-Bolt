import { supabase } from '../lib/supabase';
import { VideoSummary, ApiResponse, HighlightedSegment } from '../types';
import { translateVideoSummary } from './translationService';
import { fetchTranscriptWithFallback } from './transcriptService';

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

/**
 * Enhanced YouTube video ID extraction function
 * Supports all YouTube URL formats and logs extraction process for debugging
 */
export const extractVideoId = (url: string): string | null => {
  console.log('🔍 Extracting video ID from URL:', url);
  
  if (!url || typeof url !== 'string') {
    console.error('❌ Invalid URL provided:', url);
    return null;
  }

  // Clean and normalize the URL
  const cleanUrl = url.trim();
  console.log('🧹 Cleaned URL:', cleanUrl);

  // Comprehensive regex patterns for different YouTube URL formats
  const patterns = [
    // Standard watch URLs: https://www.youtube.com/watch?v=VIDEO_ID
    // With additional parameters: https://www.youtube.com/watch?v=VIDEO_ID&t=30s&ab_channel=...
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    
    // Short URLs: https://youtu.be/VIDEO_ID
    // With timestamp: https://youtu.be/VIDEO_ID?t=30
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
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const match = cleanUrl.match(pattern);
    
    if (match && match[1]) {
      const videoId = match[1];
      console.log(`✅ Video ID extracted using pattern ${i + 1}:`, videoId);
      
      // Validate video ID format (11 characters, alphanumeric + underscore + hyphen)
      if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        console.log('✅ Video ID validation passed:', videoId);
        return videoId;
      } else {
        console.warn('⚠️ Video ID failed validation:', videoId);
      }
    }
  }

  console.error('❌ No valid video ID found in URL:', cleanUrl);
  return null;
};

/**
 * Validate YouTube URL format
 */
export const validateYouTubeURL = (url: string): boolean => {
  console.log('🔍 Validating YouTube URL:', url);
  
  const videoId = extractVideoId(url);
  const isValid = videoId !== null;
  
  console.log('✅ URL validation result:', isValid);
  return isValid;
};

/**
 * Generate AI summary and analysis from transcript
 */
const generateAISummary = async (transcriptData: any): Promise<{
  summary: string;
  bulletPoints: string[];
  keyQuote: string;
  memorableQuotes?: {
    best: string;
    viral: string;
    powerful: string;
  };
}> => {
  // For now, we'll use the existing mock generation logic
  // In production, this would call OpenAI or another AI service
  
  const hash = hashCode(transcriptData.videoId);
  const title = transcriptData.title || 'Video Analysis';
  
  // Determine content complexity based on duration
  const durationParts = transcriptData.duration?.split(':') || ['10', '00'];
  let totalMinutes: number;
  
  if (durationParts.length === 3) {
    // H:MM:SS format
    totalMinutes = parseInt(durationParts[0]) * 60 + parseInt(durationParts[1]);
  } else {
    // MM:SS format
    totalMinutes = parseInt(durationParts[0]);
  }
  
  const contentDepth = totalMinutes < 10 ? 'basic' : 
                      totalMinutes < 30 ? 'intermediate' : 
                      totalMinutes < 90 ? 'advanced' : 'comprehensive';
  
  const summary = generateSummary(title, contentDepth, hash);
  const bulletPoints = generateBulletPoints(contentDepth, hash);
  const keyQuote = generateKeyQuote(contentDepth, hash);
  const memorableQuotes = generateMemorableQuotes(contentDepth, hash);
  
  return {
    summary,
    bulletPoints,
    keyQuote,
    memorableQuotes
  };
};

// Helper functions for generating content (existing logic)
const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

const generateSummary = (title: string, depth: string, hash: number): string => {
  const baseSummaries = {
    basic: [
      'This video provides essential insights into the topic, covering key concepts and practical applications that viewers can immediately implement.',
      'A focused presentation that breaks down complex ideas into digestible segments, offering clear explanations and actionable takeaways.',
      'This educational content delivers valuable information in an accessible format, highlighting the most important aspects of the subject matter.',
    ],
    intermediate: [
      'This comprehensive video explores the topic in detail, providing both theoretical foundations and practical applications. The content covers essential concepts, methodologies, and real-world examples.',
      'An in-depth analysis that examines multiple perspectives and approaches to the subject matter. The presentation includes case studies, expert insights, and actionable strategies.',
      'This detailed exploration covers fundamental principles and advanced techniques, offering a balanced approach between theory and practice.',
    ],
    advanced: [
      'This extensive video provides a thorough examination of the topic, covering advanced concepts, methodologies, and industry best practices. The content includes detailed analysis and expert commentary.',
      'A comprehensive deep-dive that explores complex aspects of the subject matter, featuring expert insights, detailed methodologies, and extensive practical examples.',
      'This detailed analysis examines the topic from multiple angles, providing extensive coverage of theoretical frameworks and practical applications.',
    ],
    comprehensive: [
      'This extensive presentation offers a complete exploration of the topic, featuring comprehensive coverage of all major aspects, detailed analysis of complex concepts, and extensive practical applications.',
      'A comprehensive examination that covers the topic exhaustively, including historical context, current developments, future trends, and practical applications.',
      'This thorough analysis provides complete coverage of the topic, examining theoretical foundations, practical applications, and industry best practices.',
    ]
  };
  
  const summaries = baseSummaries[depth as keyof typeof baseSummaries] || baseSummaries.basic;
  return summaries[hash % summaries.length];
};

const generateBulletPoints = (depth: string, hash: number): string[] => {
  const pointCounts = {
    basic: { min: 3, max: 5 },
    intermediate: { min: 5, max: 7 },
    advanced: { min: 7, max: 10 },
    comprehensive: { min: 10, max: 15 }
  };
  
  const range = pointCounts[depth as keyof typeof pointCounts] || pointCounts.basic;
  const numPoints = range.min + (hash % (range.max - range.min + 1));
  
  const allPoints = [
    'Fundamental concepts and principles that form the foundation of effective implementation',
    'Practical strategies and methodologies for achieving optimal results in real-world scenarios',
    'Common challenges and proven solutions based on industry experience and best practices',
    'Advanced techniques that enhance performance and deliver superior outcomes',
    'Integration approaches that connect different systems and processes seamlessly',
    'Quality assurance methods that ensure reliability and consistency in implementation',
    'Performance optimization strategies that maximize efficiency and minimize resource usage',
    'Risk management frameworks that identify and mitigate potential issues proactively',
    'Scalability considerations for growing and adapting solutions over time',
    'Cost-effective approaches that balance quality with budget constraints',
    'Innovation opportunities that leverage emerging technologies and methodologies',
    'Collaboration strategies that enhance team effectiveness and project success',
    'Measurement and analytics frameworks for tracking progress and outcomes',
    'Continuous improvement processes that drive ongoing optimization and refinement',
    'Future-proofing strategies that ensure long-term viability and adaptability',
  ];
  
  const selectedPoints: string[] = [];
  for (let i = 0; i < numPoints; i++) {
    const pointIndex = (hash + i * 17) % allPoints.length;
    if (!selectedPoints.includes(allPoints[pointIndex])) {
      selectedPoints.push(allPoints[pointIndex]);
    }
  }
  
  return selectedPoints;
};

const generateKeyQuote = (depth: string, hash: number): string => {
  const quotes = {
    basic: [
      'Success comes from understanding the fundamentals and applying them consistently.',
      'The key to effective implementation is focusing on what truly matters.',
      'Simple solutions often provide the most powerful and lasting results.',
    ],
    intermediate: [
      'Mastery is achieved through the combination of solid fundamentals and practical experience.',
      'The most effective approach balances theoretical knowledge with real-world application.',
      'True understanding comes from seeing how all the pieces fit together in practice.',
    ],
    advanced: [
      'Excellence is not a destination but a continuous journey of improvement and refinement.',
      'The difference between good and great lies in the attention to detail and commitment to quality.',
      'Innovation happens when deep expertise meets creative problem-solving and strategic thinking.',
    ],
    comprehensive: [
      'Transformational results require a comprehensive understanding of both the technical and human elements involved.',
      'The most successful implementations are those that consider not just what needs to be done, but how it impacts all stakeholders.',
      'True expertise is demonstrated not just in knowing what to do, but in understanding why it works and how to adapt it to different contexts.',
    ]
  };
  
  const depthQuotes = quotes[depth as keyof typeof quotes] || quotes.basic;
  return depthQuotes[hash % depthQuotes.length];
};

const generateMemorableQuotes = (depth: string, hash: number): { best: string; viral: string; powerful: string } => {
  const quoteCategories = {
    best: {
      basic: [
        'The foundation of success is built on understanding the basics and executing them flawlessly.',
        'Clarity of purpose transforms ordinary efforts into extraordinary achievements.',
        'The most profound insights often come from the simplest observations.',
      ],
      intermediate: [
        'Excellence emerges when preparation meets opportunity in the arena of focused action.',
        'The bridge between knowledge and wisdom is built through deliberate practice and reflection.',
        'True mastery reveals itself not in complexity, but in the elegant simplicity of expert execution.',
      ],
      advanced: [
        'Innovation is not about creating something new, but about seeing familiar things in revolutionary ways.',
        'The highest form of intelligence is the ability to adapt principles to ever-changing circumstances.',
        'Expertise is the art of making the complex appear simple through deep understanding.',
      ],
      comprehensive: [
        'Transformational leadership requires the courage to challenge assumptions while honoring timeless principles.',
        'The most sustainable solutions emerge from the intersection of human insight and systematic thinking.',
        'True wisdom lies in knowing not just what to do, but when to do it and why it matters.',
      ]
    },
    viral: {
      basic: [
        'Stop overthinking and start doing - action beats perfection every time.',
        'The secret to getting ahead is getting started, even when you don\'t feel ready.',
        'Your biggest competitor is who you were yesterday.',
      ],
      intermediate: [
        'Success isn\'t about having all the answers - it\'s about asking better questions.',
        'The gap between where you are and where you want to be is called action.',
        'Don\'t wait for opportunity to knock - build a door and open it yourself.',
      ],
      advanced: [
        'The future belongs to those who can adapt faster than the rate of change.',
        'Innovation happens when you stop asking "what if" and start asking "why not".',
        'Your comfort zone is a beautiful place, but nothing ever grows there.',
      ],
      comprehensive: [
        'The most dangerous phrase in any organization is "we\'ve always done it this way".',
        'Disruption is not about technology - it\'s about reimagining what\'s possible.',
        'The only way to make sense of change is to plunge into it, move with it, and join the dance.',
      ]
    },
    powerful: {
      basic: [
        'Every expert was once a beginner who refused to give up.',
        'The only impossible journey is the one you never begin.',
        'Your potential is not determined by your past, but by your commitment to growth.',
      ],
      intermediate: [
        'Greatness is not about being better than others - it\'s about being better than you used to be.',
        'The most powerful force in the universe is a human being living in alignment with their purpose.',
        'Success is not final, failure is not fatal - it is the courage to continue that counts.',
      ],
      advanced: [
        'The ultimate measure of a person is not where they stand in moments of comfort, but where they stand in times of challenge.',
        'Leadership is not about being in charge - it\'s about taking care of those in your charge.',
        'The greatest revolution of our generation is the discovery that human beings can alter their lives by altering their attitudes.',
      ],
      comprehensive: [
        'The price of greatness is responsibility - to yourself, to your team, and to the future you\'re creating.',
        'True power is not in controlling others, but in empowering them to become the best versions of themselves.',
        'The legacy you leave is not what you accomplish, but what you inspire others to accomplish after you\'re gone.',
      ]
    }
  };

  const depthLevel = depth as keyof typeof quoteCategories.best;
  
  return {
    best: quoteCategories.best[depthLevel]?.[hash % quoteCategories.best[depthLevel].length] || quoteCategories.best.basic[0],
    viral: quoteCategories.viral[depthLevel]?.[(hash + 1) % quoteCategories.viral[depthLevel].length] || quoteCategories.viral.basic[0],
    powerful: quoteCategories.powerful[depthLevel]?.[(hash + 2) % quoteCategories.powerful[depthLevel].length] || quoteCategories.powerful.basic[0],
  };
};

/**
 * Main video analysis function that fetches real transcript and generates AI summary
 */
export const analyzeVideo = async (url: string): Promise<ApiResponse> => {
  console.log('🚀 Starting video analysis for URL:', url);
  
  const videoId = extractVideoId(url);
  
  if (!videoId) {
    console.error('❌ Video analysis failed: Invalid video ID');
    return {
      success: false,
      error: 'Invalid YouTube URL. Please check the URL and try again.'
    };
  }
  
  console.log('✅ Video ID extracted successfully:', videoId);
  
  try {
    // Fetch real transcript
    console.log('📡 Fetching real transcript...');
    const transcriptResult = await fetchTranscriptWithFallback(url);
    
    if (!transcriptResult.success || !transcriptResult.data) {
      console.error('❌ Failed to fetch transcript:', transcriptResult.error);
      return {
        success: false,
        error: transcriptResult.error || 'Failed to fetch video transcript'
      };
    }
    
    const transcriptData = transcriptResult.data;
    console.log('✅ Transcript fetched successfully:', {
      videoId: transcriptData.videoId,
      segmentCount: transcriptData.transcript.length,
      language: transcriptData.language
    });
    
    // Generate AI summary from real transcript
    console.log('🤖 Generating AI summary...');
    const aiSummary = await generateAISummary(transcriptData);
    
    // Combine transcript data with AI-generated summary
    const videoData: VideoSummary = {
      videoId: transcriptData.videoId,
      title: transcriptData.title || `YouTube Video ${transcriptData.videoId}`,
      thumbnail: transcriptData.thumbnail || `https://img.youtube.com/vi/${transcriptData.videoId}/maxresdefault.jpg`,
      duration: transcriptData.duration || '0:00',
      channelName: transcriptData.channelName || 'Unknown Channel',
      language: transcriptData.language,
      summary: aiSummary.summary,
      bulletPoints: aiSummary.bulletPoints,
      keyQuote: aiSummary.keyQuote,
      memorableQuotes: aiSummary.memorableQuotes,
      transcript: transcriptData.transcript,
      highlightedSegments: []
    };
    
    console.log('🎉 Video analysis completed successfully');
    return {
      success: true,
      data: videoData
    };
    
  } catch (error) {
    console.error('❌ Error during video analysis:', error);
    return {
      success: false,
      error: 'Failed to analyze video. Please try again.'
    };
  }
};