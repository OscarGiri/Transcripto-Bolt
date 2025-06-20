import { supabase } from '../lib/supabase';
import { VideoSummary, ApiResponse } from '../types';

export interface ApiKeyValidation {
  isValid: boolean;
  userId?: string;
  keyId?: string;
  error?: string;
}

export const validateApiKey = async (apiKey: string): Promise<ApiKeyValidation> => {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, user_id, is_active')
      .eq('key', apiKey)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { isValid: false, error: 'Invalid API key' };
    }

    return {
      isValid: true,
      userId: data.user_id,
      keyId: data.id
    };
  } catch (error) {
    return { isValid: false, error: 'API key validation failed' };
  }
};

export const incrementApiKeyUsage = async (keyId: string): Promise<void> => {
  try {
    await supabase.rpc('increment_api_key_usage', { key_id: keyId });
  } catch (error) {
    console.error('Failed to increment API key usage:', error);
  }
};

export const analyzeVideoViaApi = async (
  url: string,
  apiKey: string
): Promise<ApiResponse> => {
  // Validate API key
  const validation = await validateApiKey(apiKey);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error || 'Invalid API key'
    };
  }

  try {
    // Use the same analysis logic as the web interface
    const { analyzeVideo } = await import('./videoService');
    const result = await analyzeVideo(url);

    // Increment usage count
    if (validation.keyId) {
      await incrementApiKeyUsage(validation.keyId);
    }

    // Save to user's account if analysis was successful
    if (result.success && result.data && validation.userId) {
      const { saveVideoSummary } = await import('./videoService');
      await saveVideoSummary(validation.userId, result.data);
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: 'Video analysis failed'
    };
  }
};

// API endpoint handler (would be used in a serverless function)
export const handleApiRequest = async (
  request: {
    method: string;
    headers: { [key: string]: string };
    body: string;
  }
): Promise<{
  status: number;
  body: string;
  headers: { [key: string]: string };
}> => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return {
      status: 200,
      body: '',
      headers: corsHeaders
    };
  }

  if (request.method !== 'POST') {
    return {
      status: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: corsHeaders
    };
  }

  // Extract API key from Authorization header
  const authHeader = request.headers.authorization || request.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      status: 401,
      body: JSON.stringify({ error: 'Missing or invalid Authorization header' }),
      headers: corsHeaders
    };
  }

  const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const { url } = JSON.parse(request.body);
    if (!url) {
      return {
        status: 400,
        body: JSON.stringify({ error: 'Missing required field: url' }),
        headers: corsHeaders
      };
    }

    const result = await analyzeVideoViaApi(url, apiKey);

    return {
      status: result.success ? 200 : 400,
      body: JSON.stringify(result),
      headers: corsHeaders
    };
  } catch (error) {
    return {
      status: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
      headers: corsHeaders
    };
  }
};