import { VideoSummary, ApiResponse } from '../types';

// Mock data for demonstration
const mockVideoData: VideoSummary = {
  videoId: 'dQw4w9WgXcQ',
  title: 'The Science of Productivity: What Actually Works',
  thumbnail: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800',
  duration: '12:34',
  channelName: 'Learning Lab',
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
  ]
};

export const analyzeVideo = async (url: string): Promise<ApiResponse> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Extract video ID from URL for demo purposes
  const videoId = extractVideoId(url);
  
  if (!videoId) {
    return {
      success: false,
      error: 'Invalid YouTube URL. Please check the URL and try again.'
    };
  }
  
  // In a real implementation, this would call your backend API
  // For demo purposes, we'll return mock data
  return {
    success: true,
    data: {
      ...mockVideoData,
      videoId
    }
  };
};

const extractVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};