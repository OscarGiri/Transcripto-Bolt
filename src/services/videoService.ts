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

// Generate unique mock data based on video ID
const generateMockData = (videoId: string): VideoSummary => {
  const hash = hashCode(videoId);
  
  // Topic categories
  const topics = [
    {
      category: 'Technology',
      titles: [
        'Understanding Artificial Intelligence: A Complete Guide',
        'The Future of Web Development in 2024',
        'Machine Learning Fundamentals Explained',
        'Blockchain Technology and Its Applications',
        'Cybersecurity Best Practices for Developers'
      ],
      channels: ['Tech Insights', 'Code Academy', 'Future Tech', 'Digital Trends', 'Tech Explained'],
      summaryTemplates: [
        'This comprehensive video explores the latest developments in {topic}, covering fundamental concepts and practical applications.',
        'An in-depth analysis of {topic} that breaks down complex ideas into understandable segments for viewers.',
        'This educational content provides valuable insights into {topic} with real-world examples and expert commentary.'
      ]
    },
    {
      category: 'Business',
      titles: [
        'Entrepreneurship Secrets: Building a Successful Startup',
        'Digital Marketing Strategies That Actually Work',
        'Leadership Skills for Modern Managers',
        'Financial Planning for Small Business Owners',
        'The Art of Negotiation in Business'
      ],
      channels: ['Business Insider', 'Entrepreneur Hub', 'Success Stories', 'Market Leaders', 'Growth Mindset'],
      summaryTemplates: [
        'This business-focused video examines key strategies for {topic}, offering actionable advice for professionals.',
        'A detailed exploration of {topic} featuring case studies and proven methodologies for success.',
        'This presentation covers essential aspects of {topic} with insights from industry experts and thought leaders.'
      ]
    },
    {
      category: 'Education',
      titles: [
        'The Science of Learning: How Memory Actually Works',
        'Critical Thinking Skills for the Digital Age',
        'Effective Study Techniques Based on Research',
        'The Psychology of Motivation and Achievement',
        'Communication Skills That Transform Relationships'
      ],
      channels: ['Learning Lab', 'Education Plus', 'Knowledge Hub', 'Study Smart', 'Mind Matters'],
      summaryTemplates: [
        'This educational video delves into {topic}, providing evidence-based insights and practical techniques.',
        'A comprehensive guide to {topic} that combines scientific research with actionable strategies.',
        'This informative content explores {topic} through expert analysis and real-world applications.'
      ]
    },
    {
      category: 'Health',
      titles: [
        'The Science of Nutrition: What Your Body Really Needs',
        'Mental Health Strategies for Stress Management',
        'Exercise Science: Building Effective Workout Routines',
        'Sleep Optimization for Better Performance',
        'Mindfulness and Meditation Techniques'
      ],
      channels: ['Health First', 'Wellness Guide', 'Fit Life', 'Mind Body', 'Healthy Living'],
      summaryTemplates: [
        'This health-focused video examines {topic}, offering science-backed recommendations for better wellbeing.',
        'An expert analysis of {topic} that provides practical guidance for improving health and lifestyle.',
        'This wellness content explores {topic} with evidence-based approaches and professional insights.'
      ]
    },
    {
      category: 'Creative',
      titles: [
        'The Creative Process: From Idea to Execution',
        'Photography Techniques for Stunning Visuals',
        'Writing Skills That Captivate Audiences',
        'Design Principles for Non-Designers',
        'Music Theory Made Simple and Practical'
      ],
      channels: ['Creative Studio', 'Art & Design', 'Inspiration Hub', 'Creative Minds', 'Artistic Vision'],
      summaryTemplates: [
        'This creative video explores {topic}, sharing techniques and inspiration for artistic development.',
        'A detailed look at {topic} featuring practical tips and creative insights from experienced practitioners.',
        'This artistic content covers {topic} with step-by-step guidance and creative inspiration.'
      ]
    }
  ];

  // Select topic based on video ID hash
  const topicIndex = hash % topics.length;
  const topic = topics[topicIndex];
  
  // Select specific elements based on different parts of the hash
  const titleIndex = Math.floor(hash / 10) % topic.titles.length;
  const channelIndex = Math.floor(hash / 100) % topic.channels.length;
  const summaryIndex = Math.floor(hash / 1000) % topic.summaryTemplates.length;
  
  const title = topic.titles[titleIndex];
  const channelName = topic.channels[channelIndex];
  const summaryTemplate = topic.summaryTemplates[summaryIndex];
  
  // Generate duration (8-15 minutes)
  const minutes = 8 + (hash % 8);
  const seconds = hash % 60;
  const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  // Generate bullet points based on the topic
  const bulletPoints = generateBulletPoints(topic.category, hash);
  
  // Generate key quote
  const keyQuote = generateKeyQuote(topic.category, hash);
  
  // Generate summary
  const summary = summaryTemplate.replace('{topic}', topic.category.toLowerCase()) + 
    ` The video covers essential concepts, practical applications, and expert insights that viewers can immediately apply. ` +
    `Key topics include methodology, best practices, and real-world examples that demonstrate effective implementation.`;

  // Generate transcript
  const transcript = generateTranscript(title, topic.category, hash);
  
  // Generate thumbnail URL (using different image IDs based on hash)
  const imageId = 3184338 + (hash % 1000);
  const thumbnail = `https://images.pexels.com/photos/${imageId}/pexels-photo-${imageId}.jpeg?auto=compress&cs=tinysrgb&w=800`;

  return {
    videoId,
    title,
    thumbnail,
    duration,
    channelName,
    language: 'en',
    summary,
    bulletPoints,
    keyQuote,
    transcript,
    highlightedSegments: [
      {
        segmentIndex: 2,
        type: 'key_moment',
        timestamp: transcript[2]?.timestamp || '00:32',
        text: transcript[2]?.text || 'Key concept introduction',
        reason: 'Important concept explanation'
      },
      {
        segmentIndex: Math.min(transcript.length - 1, 8),
        type: 'important',
        timestamp: transcript[Math.min(transcript.length - 1, 8)]?.timestamp || '03:45',
        text: keyQuote,
        reason: 'Main takeaway and memorable quote'
      }
    ]
  };
};

const generateBulletPoints = (category: string, hash: number): string[] => {
  const bulletPointSets = {
    Technology: [
      'Understanding core algorithms and their practical applications in modern software development',
      'Implementation strategies that improve system performance and user experience',
      'Best practices for security, scalability, and maintainability in technical projects',
      'Integration techniques for connecting different technologies and platforms effectively',
      'Future trends and emerging technologies that will shape the industry landscape',
      'Troubleshooting methodologies for identifying and resolving complex technical issues'
    ],
    Business: [
      'Strategic planning frameworks that drive sustainable business growth and success',
      'Market analysis techniques for identifying opportunities and competitive advantages',
      'Financial management principles that optimize cash flow and profitability',
      'Leadership strategies that inspire teams and drive organizational performance',
      'Customer relationship management approaches that build loyalty and retention',
      'Innovation processes that foster creativity and competitive differentiation'
    ],
    Education: [
      'Evidence-based learning techniques that improve retention and comprehension rates',
      'Cognitive strategies that enhance critical thinking and problem-solving abilities',
      'Memory optimization methods that accelerate knowledge acquisition and recall',
      'Study methodologies that maximize efficiency and minimize time investment',
      'Assessment approaches that accurately measure progress and identify improvement areas',
      'Motivation techniques that sustain long-term learning engagement and success'
    ],
    Health: [
      'Nutritional principles that support optimal physical and mental performance',
      'Exercise protocols that build strength, endurance, and overall fitness effectively',
      'Stress management techniques that improve resilience and emotional wellbeing',
      'Sleep optimization strategies that enhance recovery and cognitive function',
      'Preventive health measures that reduce disease risk and promote longevity',
      'Mental health practices that support psychological wellness and life satisfaction'
    ],
    Creative: [
      'Creative process frameworks that transform ideas into compelling finished works',
      'Technical skills development that enhances artistic expression and execution quality',
      'Inspiration sources and methods for overcoming creative blocks and limitations',
      'Collaboration techniques that leverage diverse perspectives and collective creativity',
      'Portfolio development strategies that showcase skills and attract opportunities',
      'Business aspects of creative work including marketing, pricing, and client relations'
    ]
  };

  const points = bulletPointSets[category as keyof typeof bulletPointSets] || bulletPointSets.Technology;
  
  // Select 4-6 bullet points based on hash
  const numPoints = 4 + (hash % 3);
  const selectedPoints: string[] = [];
  
  for (let i = 0; i < numPoints; i++) {
    const pointIndex = (hash + i * 17) % points.length;
    if (!selectedPoints.includes(points[pointIndex])) {
      selectedPoints.push(points[pointIndex]);
    }
  }
  
  return selectedPoints;
};

const generateKeyQuote = (category: string, hash: number): string => {
  const quotes = {
    Technology: [
      'The best technology is invisible - it just works seamlessly to solve real problems.',
      'Innovation happens when we combine existing technologies in unexpected ways.',
      'Code is not just instructions for computers - it\'s a way to express human creativity.',
      'The future belongs to those who can adapt to technological change while staying human.',
      'Great software is built by teams who understand both the technical and human elements.'
    ],
    Business: [
      'Success in business comes from solving real problems for real people consistently.',
      'The best business strategy is to create value for others while building sustainable growth.',
      'Leadership is not about having all the answers - it\'s about asking the right questions.',
      'Innovation in business means finding better ways to serve customers and create value.',
      'Sustainable success requires balancing short-term results with long-term vision.'
    ],
    Education: [
      'Learning is not about memorizing facts - it\'s about developing the ability to think.',
      'The best education teaches you how to learn, not just what to learn.',
      'Knowledge becomes powerful when it\'s applied to solve real-world problems.',
      'True understanding comes from connecting new information to existing knowledge.',
      'The goal of education is to turn mirrors into windows - expanding perspectives.'
    ],
    Health: [
      'Health is not just the absence of disease - it\'s a state of complete wellbeing.',
      'The best medicine is prevention, and the best prevention is a healthy lifestyle.',
      'Your body is your most important tool - invest in maintaining it properly.',
      'Mental and physical health are interconnected - you cannot optimize one without the other.',
      'Small, consistent healthy choices compound into transformative life changes.'
    ],
    Creative: [
      'Creativity is not about being original - it\'s about being authentic to your vision.',
      'The creative process requires both inspiration and discipline to reach completion.',
      'Art is not what you see, but what you make others see through your unique perspective.',
      'Creativity flourishes when you combine technical skill with emotional expression.',
      'The best creative work comes from pushing beyond your comfort zone consistently.'
    ]
  };

  const categoryQuotes = quotes[category as keyof typeof quotes] || quotes.Technology;
  const quoteIndex = hash % categoryQuotes.length;
  return categoryQuotes[quoteIndex];
};

const generateTranscript = (title: string, category: string, hash: number): any[] => {
  const baseTranscript = [
    `Welcome to today's video. We're going to explore ${title.toLowerCase()} and discover what makes this topic so important.`,
    'Let\'s start by understanding the fundamental concepts and why they matter in today\'s world.',
    'The key principle here is understanding how these concepts apply to real-world situations and practical applications.',
    'Research and expert analysis show that this approach can significantly improve outcomes and results.',
    'Many people overlook these important details, but they make a crucial difference in implementation.',
    'Let me share some practical examples that demonstrate these principles in action and show their effectiveness.',
    'The data and evidence clearly support this methodology, and the results speak for themselves.',
    'Implementation is absolutely critical - knowing the theory is only the first step toward success.',
    'Industry experts and thought leaders consistently recommend this approach for optimal results.',
    'Remember, success comes from consistent application of these principles over time.'
  ];

  return baseTranscript.map((text, index) => ({
    timestamp: `${Math.floor(index * 0.5)}:${((index * 30) % 60).toString().padStart(2, '0')}`,
    text,
    start: index * 30
  }));
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
  
  // Generate unique mock data based on video ID
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