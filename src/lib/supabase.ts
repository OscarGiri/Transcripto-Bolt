import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseAnonKey !== 'placeholder-key');

if (!isSupabaseConfigured) {
  console.warn('Supabase environment variables are not configured.');
  console.warn('Please click "Connect to Supabase" in the top right to set up your database.');
}

// Create client with actual values or null if not configured
export const supabase = isSupabaseConfigured 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;

// Helper function to check if Supabase operations can be performed
export const checkSupabaseConnection = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Please connect to Supabase first.');
  }
  return supabase;
};

// Wrapper for Supabase operations that handles configuration errors
export const withSupabaseCheck = async <T>(operation: () => Promise<T>): Promise<T> => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase connection not configured. Please set up your Supabase project first.');
  }
  return operation();
};