import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

interface VideoSummary {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: string;
  channelName: string;
  summary: string;
  bulletPoints: string[];
  keyQuote: string;
  transcript: any[];
  highlightedSegments?: any[];
  language?: string;
}

const mockVideoData: VideoSummary = {
  videoId: 'dQw4w9WgXcQ',
  title: 'The Science of Productivity: What Actually Works',
  thumbnail: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800',
  duration: '12:34',
  channelName: 'Learning Lab',
  language: 'en',
  summary: 'This comprehensive video explores evidence-based productivity techniques that have been scientifically proven to enhance performance and well-being.',
  bulletPoints: [
    'Deep work sessions of 90-120 minutes maximize cognitive performance',
    'Time-blocking with specific themes reduces decision fatigue',
    'Environmental design has a profound impact on focus',
    'Sleep quality directly correlates with next-day productivity'
  ],
  keyQuote: 'Productivity isn\'t about doing more things faster - it\'s about doing the right things with complete focus.',
  transcript: [
    {
      timestamp: '00:00',
      text: 'Welcome to this comprehensive guide on productivity science.',
      start: 0
    }
  ],
  highlightedSegments: []
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Extract API key from Authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const apiKey = authHeader.substring(7)

    // Validate API key
    const { data: keyData, error: keyError } = await supabaseClient
      .from('api_keys')
      .select('id, user_id, is_active')
      .eq('key', apiKey)
      .eq('is_active', true)
      .single()

    if (keyError || !keyData) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { url } = await req.json()
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: url' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Extract video ID from URL
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
    if (!videoIdMatch) {
      return new Response(
        JSON.stringify({ error: 'Invalid YouTube URL' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const videoId = videoIdMatch[1]

    // Simulate video analysis (replace with actual implementation)
    await new Promise(resolve => setTimeout(resolve, 1000))

    const videoData = {
      ...mockVideoData,
      videoId
    }

    // Save to user's account
    const { error: saveError } = await supabaseClient
      .from('video_summaries')
      .upsert({
        user_id: keyData.user_id,
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
      })

    if (saveError) {
      console.error('Failed to save video summary:', saveError)
    }

    // Increment API key usage
    await supabaseClient
      .from('api_keys')
      .update({ 
        usage_count: supabaseClient.raw('usage_count + 1'),
        last_used: new Date().toISOString()
      })
      .eq('id', keyData.id)

    return new Response(
      JSON.stringify({
        success: true,
        data: videoData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})