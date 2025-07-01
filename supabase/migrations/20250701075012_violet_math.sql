/*
  # Add User Subscriptions and Usage Tracking

  1. New Tables
    - `user_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `plan_type` (text: 'free', 'pro', 'team')
      - `status` (text: 'active', 'canceled', 'past_due', 'trialing')
      - `current_period_start` (timestamptz)
      - `current_period_end` (timestamptz)
      - `stripe_subscription_id` (text, nullable)
      - `stripe_customer_id` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `usage_tracking`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users, nullable for visitors)
      - `visitor_id` (text, nullable for tracking anonymous users)
      - `action_type` (text: 'video_analysis', 'api_call')
      - `date` (date)
      - `count` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
    - Add policies for usage tracking (including visitor tracking)

  3. Functions
    - Function to check usage limits
    - Function to increment usage
    - Function to get current subscription status
*/

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type text NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'team')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz DEFAULT (now() + interval '1 month'),
  stripe_subscription_id text,
  stripe_customer_id text,
  trial_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  visitor_id text,
  action_type text NOT NULL CHECK (action_type IN ('video_analysis', 'api_call', 'export_pdf', 'export_docx', 'translation')),
  date date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 1,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT usage_user_or_visitor CHECK (
    (user_id IS NOT NULL AND visitor_id IS NULL) OR 
    (user_id IS NULL AND visitor_id IS NOT NULL)
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_visitor_id ON usage_tracking(visitor_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_date ON usage_tracking(date);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_action_type ON usage_tracking(action_type);

-- Create unique constraint for daily usage tracking
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_tracking_user_daily 
ON usage_tracking(user_id, action_type, date) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_tracking_visitor_daily 
ON usage_tracking(visitor_id, action_type, date) 
WHERE visitor_id IS NOT NULL;

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions"
  ON user_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for usage_tracking
CREATE POLICY "Users can view their own usage"
  ON usage_tracking
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
  ON usage_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous users can insert visitor usage"
  ON usage_tracking
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND visitor_id IS NOT NULL);

CREATE POLICY "System can manage all usage"
  ON usage_tracking
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to get user's current subscription
CREATE OR REPLACE FUNCTION get_user_subscription(p_user_id uuid)
RETURNS TABLE (
  plan_type text,
  status text,
  current_period_end timestamptz,
  trial_end timestamptz,
  cancel_at_period_end boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.plan_type,
    us.status,
    us.current_period_end,
    us.trial_end,
    us.cancel_at_period_end
  FROM user_subscriptions us
  WHERE us.user_id = p_user_id
  AND us.status IN ('active', 'trialing')
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- If no subscription found, return default free plan
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      'free'::text as plan_type,
      'active'::text as status,
      (now() + interval '1 month')::timestamptz as current_period_end,
      null::timestamptz as trial_end,
      false as cancel_at_period_end;
  END IF;
END;
$$;

-- Function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id uuid DEFAULT NULL,
  p_visitor_id text DEFAULT NULL,
  p_action_type text DEFAULT 'video_analysis',
  p_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  current_usage integer,
  daily_limit integer,
  monthly_limit integer,
  can_perform_action boolean,
  plan_type text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_daily_usage integer := 0;
  v_monthly_usage integer := 0;
  v_plan_type text := 'free';
  v_daily_limit integer := 5;
  v_monthly_limit integer := 50;
  v_subscription record;
BEGIN
  -- Get subscription info for authenticated users
  IF p_user_id IS NOT NULL THEN
    SELECT * INTO v_subscription FROM get_user_subscription(p_user_id);
    v_plan_type := COALESCE(v_subscription.plan_type, 'free');
    
    -- Set limits based on plan
    CASE v_plan_type
      WHEN 'pro' THEN
        v_daily_limit := 1000;
        v_monthly_limit := 10000;
      WHEN 'team' THEN
        v_daily_limit := 5000;
        v_monthly_limit := 50000;
      ELSE
        v_daily_limit := 5;
        v_monthly_limit := 50;
    END CASE;
    
    -- Get current usage for authenticated user
    SELECT COALESCE(SUM(ut.count), 0) INTO v_daily_usage
    FROM usage_tracking ut
    WHERE ut.user_id = p_user_id
    AND ut.action_type = p_action_type
    AND ut.date = p_date;
    
    SELECT COALESCE(SUM(ut.count), 0) INTO v_monthly_usage
    FROM usage_tracking ut
    WHERE ut.user_id = p_user_id
    AND ut.action_type = p_action_type
    AND ut.date >= date_trunc('month', p_date)::date;
    
  ELSE
    -- For visitors, use visitor_id
    SELECT COALESCE(SUM(ut.count), 0) INTO v_daily_usage
    FROM usage_tracking ut
    WHERE ut.visitor_id = p_visitor_id
    AND ut.action_type = p_action_type
    AND ut.date = p_date;
    
    SELECT COALESCE(SUM(ut.count), 0) INTO v_monthly_usage
    FROM usage_tracking ut
    WHERE ut.visitor_id = p_visitor_id
    AND ut.action_type = p_action_type
    AND ut.date >= date_trunc('month', p_date)::date;
  END IF;
  
  RETURN QUERY
  SELECT 
    v_daily_usage as current_usage,
    v_daily_limit as daily_limit,
    v_monthly_limit as monthly_limit,
    (v_daily_usage < v_daily_limit AND v_monthly_usage < v_monthly_limit) as can_perform_action,
    v_plan_type as plan_type;
END;
$$;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id uuid DEFAULT NULL,
  p_visitor_id text DEFAULT NULL,
  p_action_type text DEFAULT 'video_analysis',
  p_date date DEFAULT CURRENT_DATE,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update usage record
  INSERT INTO usage_tracking (user_id, visitor_id, action_type, date, count, metadata)
  VALUES (p_user_id, p_visitor_id, p_action_type, p_date, 1, p_metadata)
  ON CONFLICT (COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), 
               COALESCE(visitor_id, ''), action_type, date)
  DO UPDATE SET 
    count = usage_tracking.count + 1,
    updated_at = now(),
    metadata = p_metadata;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Function to create default subscription for new users
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free', 'active');
  
  RETURN NEW;
END;
$$;

-- Trigger to create default subscription for new users
DROP TRIGGER IF EXISTS create_user_subscription_trigger ON auth.users;
CREATE TRIGGER create_user_subscription_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();

-- Update function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_tracking_updated_at ON usage_tracking;
CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();