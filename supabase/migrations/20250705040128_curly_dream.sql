/*
  # Analytics and Sharing Features

  1. New Tables
    - `video_analytics`
      - Track video performance metrics
      - View counts, engagement metrics
      - Popular videos and trending content
    
    - `shared_summaries`
      - Public sharing of video summaries
      - Share links with expiration
      - View tracking for shared content
    
    - `user_preferences`
      - User customization settings
      - Theme preferences, notification settings
      - Default export formats and languages
    
    - `video_collections`
      - User-created playlists/collections
      - Organize videos by topic or project
      - Collaborative collections for teams

  2. Enhanced Features
    - Analytics dashboard for content creators
    - Social sharing capabilities
    - Advanced search and filtering
    - Collaborative features for teams
*/

-- Video Analytics Table
CREATE TABLE IF NOT EXISTS video_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_summary_id uuid REFERENCES video_summaries(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('view', 'export', 'share', 'highlight', 'search')),
  event_data jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Shared Summaries Table
CREATE TABLE IF NOT EXISTS shared_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_summary_id uuid REFERENCES video_summaries(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64url'),
  title text,
  description text,
  is_public boolean DEFAULT false,
  password_hash text,
  expires_at timestamptz,
  view_count integer DEFAULT 0,
  max_views integer,
  allow_downloads boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  default_language text DEFAULT 'en',
  default_export_format text DEFAULT 'txt' CHECK (default_export_format IN ('txt', 'pdf', 'docx')),
  email_notifications boolean DEFAULT true,
  auto_save_highlights boolean DEFAULT true,
  transcript_font_size text DEFAULT 'medium' CHECK (transcript_font_size IN ('small', 'medium', 'large')),
  dashboard_layout text DEFAULT 'grid' CHECK (dashboard_layout IN ('grid', 'list')),
  timezone text DEFAULT 'UTC',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Video Collections Table
CREATE TABLE IF NOT EXISTS video_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'folder',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Collection Items Table (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES video_collections(id) ON DELETE CASCADE,
  video_summary_id uuid REFERENCES video_summaries(id) ON DELETE CASCADE,
  position integer DEFAULT 0,
  notes text,
  added_at timestamptz DEFAULT now(),
  UNIQUE(collection_id, video_summary_id)
);

-- Team Collaborators Table
CREATE TABLE IF NOT EXISTS team_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  collaborator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  permissions jsonb DEFAULT '{"can_view": true, "can_edit": false, "can_delete": false, "can_share": false}',
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
  UNIQUE(team_owner_id, collaborator_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_analytics_video_summary_id ON video_analytics(video_summary_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_user_id ON video_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_event_type ON video_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_video_analytics_created_at ON video_analytics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shared_summaries_share_token ON shared_summaries(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_summaries_user_id ON shared_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_summaries_is_public ON shared_summaries(is_public);
CREATE INDEX IF NOT EXISTS idx_shared_summaries_expires_at ON shared_summaries(expires_at);

CREATE INDEX IF NOT EXISTS idx_video_collections_user_id ON video_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_video_collections_is_public ON video_collections(is_public);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_video_summary_id ON collection_items(video_summary_id);

CREATE INDEX IF NOT EXISTS idx_team_collaborators_team_owner_id ON team_collaborators(team_owner_id);
CREATE INDEX IF NOT EXISTS idx_team_collaborators_collaborator_id ON team_collaborators(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_team_collaborators_status ON team_collaborators(status);

-- Enable RLS
ALTER TABLE video_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_analytics
CREATE POLICY "Users can view analytics for their own videos"
  ON video_analytics
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM video_summaries vs 
      WHERE vs.id = video_analytics.video_summary_id 
      AND vs.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert analytics"
  ON video_analytics
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- RLS Policies for shared_summaries
CREATE POLICY "Users can manage their own shared summaries"
  ON shared_summaries
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view public shared summaries"
  ON shared_summaries
  FOR SELECT
  TO authenticated, anon
  USING (is_public = true AND (expires_at IS NULL OR expires_at > now()));

-- RLS Policies for user_preferences
CREATE POLICY "Users can manage their own preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for video_collections
CREATE POLICY "Users can manage their own collections"
  ON video_collections
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view public collections"
  ON video_collections
  FOR SELECT
  TO authenticated, anon
  USING (is_public = true);

-- RLS Policies for collection_items
CREATE POLICY "Users can manage items in their own collections"
  ON collection_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM video_collections vc 
      WHERE vc.id = collection_items.collection_id 
      AND vc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM video_collections vc 
      WHERE vc.id = collection_items.collection_id 
      AND vc.user_id = auth.uid()
    )
  );

-- RLS Policies for team_collaborators
CREATE POLICY "Team owners can manage collaborators"
  ON team_collaborators
  FOR ALL
  TO authenticated
  USING (team_owner_id = auth.uid())
  WITH CHECK (team_owner_id = auth.uid());

CREATE POLICY "Collaborators can view their invitations"
  ON team_collaborators
  FOR SELECT
  TO authenticated
  USING (collaborator_id = auth.uid());

CREATE POLICY "Collaborators can update their own status"
  ON team_collaborators
  FOR UPDATE
  TO authenticated
  USING (collaborator_id = auth.uid())
  WITH CHECK (collaborator_id = auth.uid());

-- Functions for enhanced features

-- Function to track video analytics
CREATE OR REPLACE FUNCTION track_video_event(
  p_video_summary_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_event_type text DEFAULT 'view',
  p_event_data jsonb DEFAULT '{}',
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO video_analytics (
    video_summary_id, 
    user_id, 
    event_type, 
    event_data, 
    ip_address, 
    user_agent
  )
  VALUES (
    p_video_summary_id, 
    p_user_id, 
    p_event_type, 
    p_event_data, 
    p_ip_address, 
    p_user_agent
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Function to get user analytics summary
CREATE OR REPLACE FUNCTION get_user_analytics_summary(p_user_id uuid)
RETURNS TABLE (
  total_videos integer,
  total_views integer,
  total_exports integer,
  total_shares integer,
  most_viewed_video_id uuid,
  recent_activity_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_videos AS (
    SELECT vs.id 
    FROM video_summaries vs 
    WHERE vs.user_id = p_user_id
  ),
  analytics_summary AS (
    SELECT 
      COUNT(DISTINCT va.video_summary_id) as video_count,
      COUNT(CASE WHEN va.event_type = 'view' THEN 1 END) as view_count,
      COUNT(CASE WHEN va.event_type = 'export' THEN 1 END) as export_count,
      COUNT(CASE WHEN va.event_type = 'share' THEN 1 END) as share_count,
      COUNT(CASE WHEN va.created_at >= now() - interval '7 days' THEN 1 END) as recent_count
    FROM video_analytics va
    WHERE va.video_summary_id IN (SELECT id FROM user_videos)
  ),
  most_viewed AS (
    SELECT va.video_summary_id
    FROM video_analytics va
    WHERE va.video_summary_id IN (SELECT id FROM user_videos)
    AND va.event_type = 'view'
    GROUP BY va.video_summary_id
    ORDER BY COUNT(*) DESC
    LIMIT 1
  )
  SELECT 
    (SELECT COUNT(*)::integer FROM user_videos),
    COALESCE(a.view_count::integer, 0),
    COALESCE(a.export_count::integer, 0),
    COALESCE(a.share_count::integer, 0),
    mv.video_summary_id,
    COALESCE(a.recent_count::integer, 0)
  FROM analytics_summary a
  CROSS JOIN most_viewed mv;
END;
$$;

-- Function to create default user preferences
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to create default preferences for new users
DROP TRIGGER IF EXISTS create_user_preferences_trigger ON auth.users;
CREATE TRIGGER create_user_preferences_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_preferences();

-- Add updated_at triggers for new tables
CREATE TRIGGER update_shared_summaries_updated_at
  BEFORE UPDATE ON shared_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_collections_updated_at
  BEFORE UPDATE ON video_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();