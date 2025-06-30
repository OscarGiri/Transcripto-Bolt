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

// Create a simple hash function to generate consistent but varied content
const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Simulate fetching real video metadata from YouTube API
const fetchVideoMetadata = async (videoId: string): Promise<{
  title: string;
  duration: string;
  channelName: string;
  thumbnail: string;
  description?: string;
}> => {
  // In a real implementation, this would call the YouTube Data API
  // For now, we'll generate realistic metadata based on the video ID
  
  const hash = hashCode(videoId);
  
  // Generate realistic durations based on video ID
  const durationTypes = [
    { min: 3, max: 8, weight: 30 },      // Short videos (3-8 min)
    { min: 8, max: 20, weight: 40 },     // Medium videos (8-20 min)
    { min: 20, max: 60, weight: 20 },    // Long videos (20-60 min)
    { min: 60, max: 240, weight: 10 },   // Very long videos (1-4 hours)
  ];
  
  // Select duration type based on hash
  let totalWeight = durationTypes.reduce((sum, type) => sum + type.weight, 0);
  let randomWeight = hash % totalWeight;
  let selectedType = durationTypes[0];
  
  for (const type of durationTypes) {
    if (randomWeight < type.weight) {
      selectedType = type;
      break;
    }
    randomWeight -= type.weight;
  }
  
  // Generate duration within the selected range
  const durationMinutes = selectedType.min + (hash % (selectedType.max - selectedType.min));
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const seconds = hash % 60;
  
  let duration: string;
  if (hours > 0) {
    duration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // Generate realistic titles and channels based on duration
  const { title, channelName } = generateRealisticMetadata(durationMinutes, hash);
  
  // Generate thumbnail URL
  const imageId = 3184338 + (hash % 1000);
  const thumbnail = `https://images.pexels.com/photos/${imageId}/pexels-photo-${imageId}.jpeg?auto=compress&cs=tinysrgb&w=800`;
  
  return {
    title,
    duration,
    channelName,
    thumbnail,
  };
};

const generateRealisticMetadata = (durationMinutes: number, hash: number) => {
  // Different content types based on video length
  if (durationMinutes < 10) {
    // Short videos - tutorials, tips, news
    const shortTitles = [
      'Quick Tutorial: {topic} in Under 10 Minutes',
      '5 Essential Tips for {topic}',
      'Breaking: Latest Updates on {topic}',
      'How to {topic} - Fast Method',
      'Top 3 {topic} Mistakes to Avoid',
    ];
    const shortChannels = ['QuickTips', 'FastLearning', 'TechMinute', 'LifeHacks Pro', 'Instant Skills'];
    const topics = ['Productivity', 'Coding', 'Design', 'Marketing', 'Finance'];
    
    const titleTemplate = shortTitles[hash % shortTitles.length];
    const topic = topics[(hash + 1) % topics.length];
    const title = titleTemplate.replace('{topic}', topic);
    const channelName = shortChannels[(hash + 2) % shortChannels.length];
    
    return { title, channelName };
  } else if (durationMinutes < 30) {
    // Medium videos - detailed tutorials, reviews, discussions
    const mediumTitles = [
      'Complete Guide to {topic}: Everything You Need to Know',
      'In-Depth Review: {topic} Analysis and Recommendations',
      'Mastering {topic}: Advanced Techniques and Strategies',
      'The Ultimate {topic} Tutorial for Beginners',
      'Expert Discussion: The Future of {topic}',
    ];
    const mediumChannels = ['TechReview Hub', 'Learning Academy', 'Expert Insights', 'Skill Builder', 'Knowledge Base'];
    const topics = ['Web Development', 'Digital Marketing', 'Data Science', 'Business Strategy', 'Creative Design'];
    
    const titleTemplate = mediumTitles[hash % mediumTitles.length];
    const topic = topics[(hash + 1) % topics.length];
    const title = titleTemplate.replace('{topic}', topic);
    const channelName = mediumChannels[(hash + 2) % mediumChannels.length];
    
    return { title, channelName };
  } else if (durationMinutes < 90) {
    // Long videos - comprehensive courses, deep dives, documentaries
    const longTitles = [
      'Comprehensive Course: {topic} from Beginner to Expert',
      'Deep Dive: Understanding {topic} at a Professional Level',
      'Documentary: The Evolution and Impact of {topic}',
      'Masterclass: Advanced {topic} Techniques and Case Studies',
      'Complete Workshop: Building Real-World {topic} Projects',
    ];
    const longChannels = ['Professional Academy', 'Masterclass Series', 'Deep Learning Hub', 'Expert Workshops', 'Advanced Studies'];
    const topics = ['Machine Learning', 'Software Architecture', 'Business Leadership', 'Financial Planning', 'Creative Production'];
    
    const titleTemplate = longTitles[hash % longTitles.length];
    const topic = topics[(hash + 1) % topics.length];
    const title = titleTemplate.replace('{topic}', topic);
    const channelName = longChannels[(hash + 2) % longChannels.length];
    
    return { title, channelName };
  } else {
    // Very long videos - full courses, conferences, live streams
    const veryLongTitles = [
      'Full Conference: {topic} Summit 2024 - Complete Sessions',
      'Complete Bootcamp: {topic} Intensive Training Program',
      'Live Workshop: Building {topic} Solutions from Scratch',
      'Full Course: Professional {topic} Certification Program',
      'Conference Keynote: The Future of {topic} - Full Event',
    ];
    const veryLongChannels = ['Conference Central', 'Bootcamp Academy', 'Live Learning', 'Professional Training', 'Summit Series'];
    const topics = ['Software Development', 'Digital Transformation', 'Leadership Excellence', 'Innovation Strategy', 'Technology Trends'];
    
    const titleTemplate = veryLongTitles[hash % veryLongTitles.length];
    const topic = topics[(hash + 1) % topics.length];
    const title = titleTemplate.replace('{topic}', topic);
    const channelName = veryLongChannels[(hash + 2) % veryLongChannels.length];
    
    return { title, channelName };
  }
};

// Generate unique mock data based on video ID with realistic metadata
const generateMockData = async (videoId: string): Promise<VideoSummary> => {
  const hash = hashCode(videoId);
  
  // Fetch realistic video metadata
  const metadata = await fetchVideoMetadata(videoId);
  
  // Determine content complexity based on duration
  const durationParts = metadata.duration.split(':');
  let totalMinutes: number;
  
  if (durationParts.length === 3) {
    // H:MM:SS format
    totalMinutes = parseInt(durationParts[0]) * 60 + parseInt(durationParts[1]);
  } else {
    // MM:SS format
    totalMinutes = parseInt(durationParts[0]);
  }
  
  // Generate content based on video length
  const contentDepth = totalMinutes < 10 ? 'basic' : 
                      totalMinutes < 30 ? 'intermediate' : 
                      totalMinutes < 90 ? 'advanced' : 'comprehensive';
  
  // Generate appropriate summary length and complexity
  const summary = generateSummary(metadata.title, contentDepth, hash);
  const bulletPoints = generateBulletPoints(contentDepth, hash);
  const keyQuote = generateKeyQuote(contentDepth, hash);
  const transcript = generateTranscript(metadata.title, totalMinutes, hash);
  
  return {
    videoId,
    title: metadata.title,
    thumbnail: metadata.thumbnail,
    duration: metadata.duration,
    channelName: metadata.channelName,
    language: 'en',
    summary,
    bulletPoints,
    keyQuote,
    transcript,
    highlightedSegments: generateHighlights(transcript, hash)
  };
};

const generateSummary = (title: string, depth: string, hash: number): string => {
  const baseSummaries = {
    basic: [
      'This concise video provides essential insights into the topic, covering key concepts and practical applications that viewers can immediately implement.',
      'A focused presentation that breaks down complex ideas into digestible segments, offering clear explanations and actionable takeaways.',
      'This educational content delivers valuable information in an accessible format, highlighting the most important aspects of the subject matter.',
    ],
    intermediate: [
      'This comprehensive video explores the topic in detail, providing both theoretical foundations and practical applications. The content covers essential concepts, methodologies, and real-world examples that demonstrate effective implementation strategies.',
      'An in-depth analysis that examines multiple perspectives and approaches to the subject matter. The presentation includes case studies, expert insights, and actionable strategies that viewers can apply in their own contexts.',
      'This detailed exploration covers fundamental principles and advanced techniques, offering a balanced approach between theory and practice. The content is structured to build understanding progressively.',
    ],
    advanced: [
      'This extensive video provides a thorough examination of the topic, covering advanced concepts, methodologies, and industry best practices. The content includes detailed analysis, expert commentary, and comprehensive case studies that demonstrate real-world applications and outcomes.',
      'A comprehensive deep-dive that explores complex aspects of the subject matter, featuring expert insights, detailed methodologies, and extensive practical examples. The presentation covers both foundational concepts and cutting-edge developments in the field.',
      'This detailed analysis examines the topic from multiple angles, providing extensive coverage of theoretical frameworks, practical applications, and industry trends. The content is designed for serious learners seeking comprehensive understanding.',
    ],
    comprehensive: [
      'This extensive presentation offers a complete exploration of the topic, featuring comprehensive coverage of all major aspects, detailed analysis of complex concepts, and extensive practical applications. The content includes expert interviews, case studies, real-world examples, and actionable strategies that provide viewers with a thorough understanding of the subject matter and its practical implications.',
      'A comprehensive examination that covers the topic exhaustively, including historical context, current developments, future trends, and practical applications. The presentation features multiple expert perspectives, detailed methodologies, extensive case studies, and actionable insights that enable viewers to develop deep expertise in the subject area.',
      'This thorough analysis provides complete coverage of the topic, examining theoretical foundations, practical applications, industry best practices, and emerging trends. The content includes comprehensive case studies, expert commentary, detailed methodologies, and extensive practical examples designed to provide viewers with mastery-level understanding.',
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

const generateTranscript = (title: string, durationMinutes: number, hash: number): any[] => {
  // Generate transcript segments based on video duration
  const segmentsPerMinute = 2; // Approximately 2 segments per minute
  const totalSegments = Math.max(8, Math.min(durationMinutes * segmentsPerMinute, 50));
  
  const transcript = [];
  const segmentDuration = (durationMinutes * 60) / totalSegments;
  
  for (let i = 0; i < totalSegments; i++) {
    const startTime = Math.floor(i * segmentDuration);
    const hours = Math.floor(startTime / 3600);
    const minutes = Math.floor((startTime % 3600) / 60);
    const seconds = startTime % 60;
    
    let timestamp: string;
    if (hours > 0) {
      timestamp = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Generate contextual content based on position in video
    let text: string;
    if (i === 0) {
      text = `Welcome to this comprehensive exploration of ${title.toLowerCase()}. Today we'll dive deep into the key concepts and practical applications.`;
    } else if (i === 1) {
      text = 'Let\'s begin by establishing the foundational principles and understanding why this topic is so important in today\'s context.';
    } else if (i < totalSegments * 0.3) {
      text = generateIntroContent(i, hash);
    } else if (i < totalSegments * 0.7) {
      text = generateMainContent(i, hash);
    } else if (i < totalSegments * 0.9) {
      text = generateAdvancedContent(i, hash);
    } else {
      text = generateConclusionContent(i, hash, totalSegments);
    }
    
    transcript.push({
      timestamp,
      text,
      start: startTime
    });
  }
  
  return transcript;
};

const generateIntroContent = (index: number, hash: number): string => {
  const introTexts = [
    'The fundamental concepts we\'ll explore today have been proven effective across multiple industries and use cases.',
    'Understanding the core principles is essential before we move into more advanced applications and techniques.',
    'Let me share some background context that will help you better understand the significance of what we\'re discussing.',
    'These foundational elements form the basis for everything else we\'ll cover in this comprehensive presentation.',
    'It\'s important to establish a clear framework before diving into the specific methodologies and strategies.',
  ];
  return introTexts[(hash + index) % introTexts.length];
};

const generateMainContent = (index: number, hash: number): string => {
  const mainTexts = [
    'Now let\'s examine the practical applications and see how these concepts work in real-world scenarios.',
    'The methodology I\'m about to share has been tested extensively and consistently delivers excellent results.',
    'Here\'s where things get interesting - this approach solves several common challenges simultaneously.',
    'The data clearly demonstrates the effectiveness of this strategy across different contexts and situations.',
    'This particular technique has revolutionized how professionals approach this type of challenge.',
    'Let me walk you through a detailed example that illustrates these principles in action.',
    'The research behind this approach is extensive and the results speak for themselves.',
    'Implementation of these strategies typically results in significant improvements in both efficiency and outcomes.',
  ];
  return mainTexts[(hash + index) % mainTexts.length];
};

const generateAdvancedContent = (index: number, hash: number): string => {
  const advancedTexts = [
    'For those looking to take their skills to the next level, these advanced techniques offer significant advantages.',
    'The optimization strategies we\'re covering now can dramatically improve your results and efficiency.',
    'These sophisticated approaches require more effort but deliver proportionally greater returns on investment.',
    'Industry leaders consistently apply these advanced methodologies to maintain their competitive edge.',
    'The integration of these techniques with existing workflows creates powerful synergies and enhanced outcomes.',
    'This level of implementation separates professionals from experts in the field.',
  ];
  return advancedTexts[(hash + index) % advancedTexts.length];
};

const generateConclusionContent = (index: number, hash: number, totalSegments: number): string => {
  if (index === totalSegments - 1) {
    return 'Thank you for joining me on this comprehensive journey. Remember, consistent application of these principles will lead to transformational results.';
  }
  
  const conclusionTexts = [
    'As we wrap up, let\'s review the key takeaways and how you can immediately apply what you\'ve learned.',
    'The most important thing to remember is that success comes from consistent implementation of these proven strategies.',
    'I encourage you to start with the foundational elements and gradually incorporate the more advanced techniques.',
    'The journey to mastery requires patience and practice, but the results are absolutely worth the investment.',
  ];
  return conclusionTexts[(hash + index) % conclusionTexts.length];
};

const generateHighlights = (transcript: any[], hash: number): HighlightedSegment[] => {
  const highlights: HighlightedSegment[] = [];
  const numHighlights = Math.min(Math.max(2, Math.floor(transcript.length / 8)), 5);
  
  for (let i = 0; i < numHighlights; i++) {
    const segmentIndex = Math.floor((transcript.length / numHighlights) * i) + (hash % 3);
    if (segmentIndex < transcript.length) {
      highlights.push({
        segmentIndex: Math.min(segmentIndex, transcript.length - 1),
        type: i === 0 ? 'key_moment' : 'important',
        timestamp: transcript[Math.min(segmentIndex, transcript.length - 1)].timestamp,
        text: transcript[Math.min(segmentIndex, transcript.length - 1)].text,
        reason: i === 0 ? 'Key concept introduction' : 'Important insight'
      });
    }
  }
  
  return highlights;
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
  
  // Generate unique mock data based on video ID with realistic metadata
  const mockVideoData = await generateMockData(videoId);
  
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