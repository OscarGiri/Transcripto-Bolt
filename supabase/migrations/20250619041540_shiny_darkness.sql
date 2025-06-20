/*
  # Create video summaries schema

  1. New Tables
    - `video_summaries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `video_id` (text, YouTube video ID)
      - `title` (text)
      - `thumbnail` (text, URL)
      - `duration` (text)
      - `channel_name` (text)
      - `summary` (text)
      - `bullet_points` (jsonb, array of strings)
      - `key_quote` (text)
      - `transcript` (jsonb, array of transcript segments)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `video_summaries` table
    - Add policies for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS video_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_id text NOT NULL,
  title text NOT NULL,
  thumbnail text NOT NULL,
  duration text NOT NULL,
  channel_name text NOT NULL,
  summary text NOT NULL,
  bullet_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  key_quote text NOT NULL,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Enable Row Level Security
ALTER TABLE video_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own video summaries"
  ON video_summaries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own video summaries"
  ON video_summaries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video summaries"
  ON video_summaries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own video summaries"
  ON video_summaries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_summaries_user_id ON video_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_video_summaries_created_at ON video_summaries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_summaries_video_id ON video_summaries(video_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_video_summaries_updated_at
  BEFORE UPDATE ON video_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();