/*
  # Enhanced Video Summaries Schema

  1. New Tables
    - `video_summaries` (enhanced with new fields)
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `video_id` (text, YouTube video ID)
      - `title` (text)
      - `thumbnail` (text)
      - `duration` (text)
      - `channel_name` (text)
      - `summary` (text)
      - `bullet_points` (jsonb)
      - `key_quote` (text)
      - `transcript` (jsonb)
      - `highlighted_segments` (jsonb, new)
      - `language` (text, new)
      - `translated_summary` (jsonb, new)
      - `translated_transcript` (jsonb, new)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `video_summaries` table
    - Add policies for authenticated users to manage their own data

  3. Indexes
    - Add indexes for performance optimization
    - Full-text search support for transcript content
*/

-- Create enhanced video_summaries table
CREATE TABLE IF NOT EXISTS video_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_id text NOT NULL,
  title text NOT NULL,
  thumbnail text NOT NULL,
  duration text NOT NULL,
  channel_name text NOT NULL,
  summary text NOT NULL,
  bullet_points jsonb DEFAULT '[]'::jsonb NOT NULL,
  key_quote text NOT NULL,
  transcript jsonb DEFAULT '[]'::jsonb NOT NULL,
  highlighted_segments jsonb DEFAULT '[]'::jsonb NOT NULL,
  language text DEFAULT 'en' NOT NULL,
  translated_summary jsonb DEFAULT '{}'::jsonb NOT NULL,
  translated_transcript jsonb DEFAULT '{}'::jsonb NOT NULL,
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_summaries_user_id ON video_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_video_summaries_video_id ON video_summaries(video_id);
CREATE INDEX IF NOT EXISTS idx_video_summaries_created_at ON video_summaries(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_video_summaries_updated_at'
  ) THEN
    CREATE TRIGGER update_video_summaries_updated_at
      BEFORE UPDATE ON video_summaries
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;