import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserPlan = 'free' | 'pro' | 'team';

interface UserPlanData {
  plan: UserPlan;
  dailyUsage: number;
  monthlyUsage: number;
  dailyLimit: number;
  monthlyLimit: number;
  features: {
    unlimitedSummaries: boolean;
    enhancedAI: boolean;
    transcriptSearch: boolean;
    autoHighlight: boolean;
    pdfDocxExport: boolean;
    translation: boolean;
    nonEnglishSupport: boolean;
    savedHistory: boolean;
    dashboard: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    teamCollaboration: boolean;
    adminPanel: boolean;
  };
}

export const useUserPlan = (user: User | null) => {
  const [planData, setPlanData] = useState<UserPlanData>({
    plan: 'free',
    dailyUsage: 0,
    monthlyUsage: 0,
    dailyLimit: 5,
    monthlyLimit: 50,
    features: {
      unlimitedSummaries: false,
      enhancedAI: false,
      transcriptSearch: false,
      autoHighlight: false,
      pdfDocxExport: false,
      translation: false,
      nonEnglishSupport: false,
      savedHistory: false,
      dashboard: false,
      apiAccess: false,
      prioritySupport: false,
      teamCollaboration: false,
      adminPanel: false,
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserPlan();
    } else {
      // Set free plan defaults for non-authenticated users
      setPlanData(prev => ({
        ...prev,
        plan: 'free',
        features: {
          unlimitedSummaries: false,
          enhancedAI: false,
          transcriptSearch: false,
          autoHighlight: false,
          pdfDocxExport: false,
          translation: false,
          nonEnglishSupport: false,
          savedHistory: false,
          dashboard: false,
          apiAccess: false,
          prioritySupport: false,
          teamCollaboration: false,
          adminPanel: false,
        }
      }));
      setLoading(false);
    }
  }, [user]);

  const fetchUserPlan = async () => {
    if (!user) return;

    try {
      // For now, we'll simulate plan data since we don't have a subscription system
      // In production, this would fetch from your subscription/billing service
      
      // Get usage data from video_summaries table
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().substring(0, 7);

      const { data: dailyData } = await supabase
        .from('video_summaries')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', today);

      const { data: monthlyData } = await supabase
        .from('video_summaries')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', thisMonth);

      // For demo purposes, assume all authenticated users have Pro plan
      // In production, you'd check their actual subscription status
      const userPlan: UserPlan = 'pro';
      
      const planFeatures = getPlanFeatures(userPlan);
      const limits = getPlanLimits(userPlan);

      setPlanData({
        plan: userPlan,
        dailyUsage: dailyData?.length || 0,
        monthlyUsage: monthlyData?.length || 0,
        dailyLimit: limits.daily,
        monthlyLimit: limits.monthly,
        features: planFeatures
      });
    } catch (error) {
      console.error('Error fetching user plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const canAnalyzeVideo = () => {
    if (!user) {
      // Free tier logic is handled by useFreeTrial hook
      return true;
    }

    if (planData.features.unlimitedSummaries) {
      return true;
    }

    return planData.dailyUsage < planData.dailyLimit;
  };

  const getRemainingAnalyses = () => {
    if (planData.features.unlimitedSummaries) {
      return null; // Unlimited
    }
    return Math.max(0, planData.dailyLimit - planData.dailyUsage);
  };

  return {
    ...planData,
    loading,
    canAnalyzeVideo,
    getRemainingAnalyses,
    refreshUsage: fetchUserPlan
  };
};

const getPlanFeatures = (plan: UserPlan) => {
  switch (plan) {
    case 'free':
      return {
        unlimitedSummaries: false,
        enhancedAI: false,
        transcriptSearch: false,
        autoHighlight: false,
        pdfDocxExport: false,
        translation: false,
        nonEnglishSupport: false,
        savedHistory: false,
        dashboard: false,
        apiAccess: false,
        prioritySupport: false,
        teamCollaboration: false,
        adminPanel: false,
      };
    case 'pro':
      return {
        unlimitedSummaries: true,
        enhancedAI: true,
        transcriptSearch: true,
        autoHighlight: true,
        pdfDocxExport: true,
        translation: true,
        nonEnglishSupport: true,
        savedHistory: true,
        dashboard: true,
        apiAccess: true,
        prioritySupport: true,
        teamCollaboration: false,
        adminPanel: false,
      };
    case 'team':
      return {
        unlimitedSummaries: true,
        enhancedAI: true,
        transcriptSearch: true,
        autoHighlight: true,
        pdfDocxExport: true,
        translation: true,
        nonEnglishSupport: true,
        savedHistory: true,
        dashboard: true,
        apiAccess: true,
        prioritySupport: true,
        teamCollaboration: true,
        adminPanel: true,
      };
    default:
      return getPlanFeatures('free');
  }
};

const getPlanLimits = (plan: UserPlan) => {
  switch (plan) {
    case 'free':
      return { daily: 5, monthly: 50 };
    case 'pro':
      return { daily: 1000, monthly: 10000 }; // Effectively unlimited
    case 'team':
      return { daily: 1000, monthly: 10000 }; // Effectively unlimited
    default:
      return { daily: 5, monthly: 50 };
  }
};