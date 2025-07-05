import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Eye, Download, Share2, Calendar, Users, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface AnalyticsData {
  totalVideos: number;
  totalViews: number;
  totalExports: number;
  totalShares: number;
  mostViewedVideoId: string | null;
  recentActivityCount: number;
}

interface VideoPerformance {
  id: string;
  title: string;
  views: number;
  exports: number;
  shares: number;
  createdAt: string;
}

export const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [topVideos, setTopVideos] = useState<VideoPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get overall analytics summary
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_user_analytics_summary', { p_user_id: user.id });

      if (summaryError) throw summaryError;

      if (summaryData && summaryData.length > 0) {
        const summary = summaryData[0];
        setAnalytics({
          totalVideos: summary.total_videos,
          totalViews: summary.total_views,
          totalExports: summary.total_exports,
          totalShares: summary.total_shares,
          mostViewedVideoId: summary.most_viewed_video_id,
          recentActivityCount: summary.recent_activity_count,
        });
      }

      // Get top performing videos
      const dateFilter = getDateFilter(timeRange);
      const { data: videoData, error: videoError } = await supabase
        .from('video_summaries')
        .select(`
          id,
          title,
          created_at,
          video_analytics!inner(event_type)
        `)
        .eq('user_id', user.id)
        .gte('created_at', dateFilter)
        .limit(10);

      if (videoError) throw videoError;

      // Process video performance data
      const videoPerformance = processVideoPerformance(videoData || []);
      setTopVideos(videoPerformance);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateFilter = (range: string): string => {
    const now = new Date();
    switch (range) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(0).toISOString();
    }
  };

  const processVideoPerformance = (data: any[]): VideoPerformance[] => {
    const videoMap = new Map<string, VideoPerformance>();

    data.forEach(video => {
      if (!videoMap.has(video.id)) {
        videoMap.set(video.id, {
          id: video.id,
          title: video.title,
          views: 0,
          exports: 0,
          shares: 0,
          createdAt: video.created_at,
        });
      }

      const performance = videoMap.get(video.id)!;
      video.video_analytics.forEach((event: any) => {
        switch (event.event_type) {
          case 'view':
            performance.views++;
            break;
          case 'export':
            performance.exports++;
            break;
          case 'share':
            performance.shares++;
            break;
        }
      });
    });

    return Array.from(videoMap.values())
      .sort((a, b) => (b.views + b.exports + b.shares) - (a.views + a.exports + a.shares))
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-600">Start analyzing videos to see your analytics dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Track your video analysis performance and engagement</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Videos</p>
              <p className="text-3xl font-bold">{analytics.totalVideos}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-200" />
          </div>
          <div className="mt-4 flex items-center text-blue-100 text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+{analytics.recentActivityCount} this week</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Views</p>
              <p className="text-3xl font-bold">{analytics.totalViews}</p>
            </div>
            <Eye className="w-8 h-8 text-green-200" />
          </div>
          <div className="mt-4 flex items-center text-green-100 text-sm">
            <Clock className="w-4 h-4 mr-1" />
            <span>Avg {Math.round(analytics.totalViews / Math.max(analytics.totalVideos, 1))} per video</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Exports</p>
              <p className="text-3xl font-bold">{analytics.totalExports}</p>
            </div>
            <Download className="w-8 h-8 text-purple-200" />
          </div>
          <div className="mt-4 flex items-center text-purple-100 text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>{Math.round((analytics.totalExports / Math.max(analytics.totalViews, 1)) * 100)}% conversion</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Total Shares</p>
              <p className="text-3xl font-bold">{analytics.totalShares}</p>
            </div>
            <Share2 className="w-8 h-8 text-orange-200" />
          </div>
          <div className="mt-4 flex items-center text-orange-100 text-sm">
            <Users className="w-4 h-4 mr-1" />
            <span>Social engagement</span>
          </div>
        </div>
      </div>

      {/* Top Performing Videos */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Videos</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>
              {timeRange === '7d' && 'Last 7 days'}
              {timeRange === '30d' && 'Last 30 days'}
              {timeRange === '90d' && 'Last 90 days'}
              {timeRange === 'all' && 'All time'}
            </span>
          </div>
        </div>

        {topVideos.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No video performance data for this period</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topVideos.map((video, index) => (
              <div
                key={video.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 line-clamp-1">{video.title}</h4>
                    <p className="text-sm text-gray-500">
                      Created {new Date(video.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-1 text-green-600">
                    <Eye className="w-4 h-4" />
                    <span>{video.views}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-purple-600">
                    <Download className="w-4 h-4" />
                    <span>{video.exports}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-orange-600">
                    <Share2 className="w-4 h-4" />
                    <span>{video.shares}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Engagement Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Insights</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Average views per video</span>
              <span className="font-semibold">
                {Math.round(analytics.totalViews / Math.max(analytics.totalVideos, 1))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Export rate</span>
              <span className="font-semibold">
                {Math.round((analytics.totalExports / Math.max(analytics.totalViews, 1)) * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Share rate</span>
              <span className="font-semibold">
                {Math.round((analytics.totalShares / Math.max(analytics.totalViews, 1)) * 100)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                {analytics.recentActivityCount} new activities this week
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                {analytics.totalVideos} total videos analyzed
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                {analytics.totalExports} documents exported
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};