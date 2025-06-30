import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UsageData {
  currentUsage: number;
  dailyLimit: number;
  canPerformAction: boolean;
  planType: 'free' | 'pro' | 'team';
  resetsAt: string; // When the daily limit resets
}

interface UsageTrackingHook {
  usageData: UsageData;
  loading: boolean;
  checkUsage: (actionType?: string) => Promise<UsageData>;
  incrementUsage: (actionType?: string, metadata?: any) => Promise<boolean>;
  getVisitorId: () => string;
  refreshUsage: () => void;
  getRemainingUses: () => number;
}

const VISITOR_ID_KEY = 'transcripto_visitor_id';
const FREE_DAILY_LIMIT = 5;

export const useUsageTracking = (user: User | null): UsageTrackingHook => {
  const [usageData, setUsageData] = useState<UsageData>({
    currentUsage: 0,
    dailyLimit: FREE_DAILY_LIMIT,
    canPerformAction: true,
    planType: 'free',
    resetsAt: getNextMidnight()
  });
  const [loading, setLoading] = useState(true);

  // Generate or get visitor ID for anonymous users
  const getVisitorId = useCallback((): string => {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    return visitorId;
  }, []);

  // Get next midnight for reset time
  function getNextMidnight(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }

  // Check current usage limits
  const checkUsage = useCallback(async (actionType: string = 'video_analysis'): Promise<UsageData> => {
    try {
      const { data, error } = await supabase.rpc('check_usage_limit', {
        p_user_id: user?.id || null,
        p_visitor_id: user ? null : getVisitorId(),
        p_action_type: actionType,
        p_date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;

      const result = data[0] || {
        current_usage: 0,
        daily_limit: FREE_DAILY_LIMIT,
        monthly_limit: 150, // Not used for daily limits
        can_perform_action: true,
        plan_type: 'free'
      };

      const usageInfo: UsageData = {
        currentUsage: result.current_usage,
        dailyLimit: result.daily_limit,
        canPerformAction: result.can_perform_action,
        planType: result.plan_type as 'free' | 'pro' | 'team',
        resetsAt: getNextMidnight()
      };

      setUsageData(usageInfo);
      return usageInfo;
    } catch (error) {
      console.error('Error checking usage:', error);
      // Return conservative defaults on error
      const defaultUsage: UsageData = {
        currentUsage: FREE_DAILY_LIMIT,
        dailyLimit: FREE_DAILY_LIMIT,
        canPerformAction: false,
        planType: 'free',
        resetsAt: getNextMidnight()
      };
      setUsageData(defaultUsage);
      return defaultUsage;
    }
  }, [user, getVisitorId]);

  // Increment usage count
  const incrementUsage = useCallback(async (
    actionType: string = 'video_analysis',
    metadata: any = {}
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('increment_usage', {
        p_user_id: user?.id || null,
        p_visitor_id: user ? null : getVisitorId(),
        p_action_type: actionType,
        p_date: new Date().toISOString().split('T')[0],
        p_metadata: metadata
      });

      if (error) throw error;

      // Refresh usage data after incrementing
      await checkUsage(actionType);
      
      return data;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  }, [user, getVisitorId, checkUsage]);

  // Get remaining uses for the day
  const getRemainingUses = useCallback((): number => {
    if (usageData.planType !== 'free') {
      return 999; // Unlimited for paid plans
    }
    return Math.max(0, usageData.dailyLimit - usageData.currentUsage);
  }, [usageData]);

  // Refresh usage data
  const refreshUsage = useCallback(() => {
    checkUsage();
  }, [checkUsage]);

  // Load initial usage data
  useEffect(() => {
    const loadUsage = async () => {
      setLoading(true);
      await checkUsage();
      setLoading(false);
    };

    loadUsage();
  }, [user, checkUsage]);

  // Auto-refresh at midnight to reset daily limits
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timeout = setTimeout(() => {
      refreshUsage();
      // Set up daily refresh
      const dailyInterval = setInterval(refreshUsage, 24 * 60 * 60 * 1000);
      return () => clearInterval(dailyInterval);
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, [refreshUsage]);

  return {
    usageData,
    loading,
    checkUsage,
    incrementUsage,
    getVisitorId,
    refreshUsage,
    getRemainingUses
  };
};