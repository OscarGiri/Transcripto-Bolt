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

-- Add new columns to existing video_summaries table if they don't exist
DO $$
BEGIN
  -- Add highlighted_segments column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_summaries' AND column_name = 'highlighted_segments'
  ) THEN
    ALTER TABLE video_summaries ADD COLUMN highlighted_segments jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;

  -- Add language column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_summaries' AND column_name = 'language'
  ) THEN
    ALTER TABLE video_summaries ADD COLUMN language text DEFAULT 'en' NOT NULL;
  END IF;

  -- Add translated_summary column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_summaries' AND column_name = 'translated_summary'
  ) THEN
    ALTER TABLE video_summaries ADD COLUMN translated_summary jsonb DEFAULT '{}'::jsonb NOT NULL;
  END IF;

  -- Add translated_transcript column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_summaries' AND column_name = 'translated_transcript'
  ) THEN
    ALTER TABLE video_summaries ADD COLUMN translated_transcript jsonb DEFAULT '{}'::jsonb NOT NULL;
  END IF;
END $$;

-- Ensure RLS is enabled (safe to run multiple times)
ALTER TABLE video_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't exist
DO $$
BEGIN
  -- Check and create SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'video_summaries' 
    AND policyname = 'Users can view their own video summaries'
  ) THEN
    CREATE POLICY "Users can view their own video summaries"
      ON video_summaries
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Check and create INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'video_summaries' 
    AND policyname = 'Users can insert their own video summaries'
  ) THEN
    CREATE POLICY "Users can insert their own video summaries"
      ON video_summaries
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Check and create UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'video_summaries' 
    AND policyname = 'Users can update their own video summaries'
  ) THEN
    CREATE POLICY "Users can update their own video summaries"
      ON video_summaries
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Check and create DELETE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'video_summaries' 
    AND policyname = 'Users can delete their own video summaries'
  ) THEN
    CREATE POLICY "Users can delete their own video summaries"
      ON video_summaries
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for performance (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_video_summaries_user_id ON video_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_video_summaries_video_id ON video_summaries(video_id);
CREATE INDEX IF NOT EXISTS idx_video_summaries_created_at ON video_summaries(created_at DESC);

-- Create function to update updated_at timestamp (safe to run multiple times)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at (safe to run multiple times)
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