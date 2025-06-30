import React, { useState, useEffect } from 'react';
import { BarChart3, Clock, Star, TrendingUp, Search, Filter } from 'lucide-react';
import { VideoSummary } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useUserPlan } from '../hooks/useUserPlan';
import { PlanBadge } from './PlanBadge';
import { UsageMeter } from './UsageMeter';

interface DashboardProps {
  onSelectVideo: (video: VideoSummary) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectVideo }) => {
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'duration'>('recent');
  const { user } = useAuth();
  const userPlan = useUserPlan(user);

  useEffect(() => {
    if (user) {
      fetchVideos();
    }
  }, [user, sortBy]);

  const fetchVideos = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('video_summaries')
        .select('*')
        .eq('user_id', user.id);

      switch (sortBy) {
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'title':
          query = query.order('title', { ascending: true });
          break;
        case 'duration':
          query = query.order('duration', { ascending: false });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;

      const formattedVideos: VideoSummary[] = data.map(item => ({
        id: item.id,
        title: item.title,
        thumbnail: item.thumbnail,
        duration: item.duration,
        channelName: item.channel_name,
        summary: item.summary,
        bulletPoints: item.bullet_points,
        keyQuote: item.key_quote,
        transcript: item.transcript,
        videoId: item.video_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        highlightedSegments: item.highlighted_segments || [],
        language: item.language || 'en',
      }));

      setVideos(formattedVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.channelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalVideos: videos.length,
    totalWatchTime: videos.reduce((acc, video) => {
      const [minutes, seconds] = video.duration.split(':').map(Number);
      return acc + (minutes * 60) + (seconds || 0);
    }, 0),
    highlightedSegments: videos.reduce((acc, video) => 
      acc + (video.highlightedSegments?.length || 0), 0
    ),
    averageLength: videos.length > 0 
      ? Math.round(videos.reduce((acc, video) => {
          const [minutes] = video.duration.split(':').map(Number);
          return acc + minutes;
        }, 0) / videos.length)
      : 0,
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading || userPlan.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-6">
      {/* Plan and Usage Overview */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <PlanBadge plan={userPlan.plan} />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Upgrade Plan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UsageMeter
            current={userPlan.dailyUsage}
            limit={userPlan.features.unlimitedSummaries ? null : userPlan.dailyLimit}
            label="Daily Usage"
            period="day"
          />
          <UsageMeter
            current={userPlan.monthlyUsage}
            limit={userPlan.features.unlimitedSummaries ? null : userPlan.monthlyLimit}
            label="Monthly Usage"
            period="month"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Videos</p>
              <p className="text-2xl font-bold">{stats.totalVideos}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Watch Time</p>
              <p className="text-2xl font-bold">{formatDuration(stats.totalWatchTime)}</p>
            </div>
            <Clock className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Highlights</p>
              <p className="text-2xl font-bold">{stats.highlightedSegments}</p>
            </div>
            <Star className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Avg Length</p>
              <p className="text-2xl font-bold">{stats.averageLength}m</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search videos, channels, or content..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="recent">Most Recent</option>
              <option value="title">Title A-Z</option>
              <option value="duration">Duration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            onClick={() => onSelectVideo(video)}
            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
          >
            <div className="relative">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm">
                {video.duration}
              </div>
              {video.highlightedSegments && video.highlightedSegments.length > 0 && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                  <Star className="w-3 h-3" />
                  <span>{video.highlightedSegments.length}</span>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                {video.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{video.channelName}</p>
              <p className="text-xs text-gray-500">
                {new Date(video.createdAt!).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredVideos.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {searchTerm ? 'No videos found matching your search.' : 'No videos yet. Start by analyzing your first video!'}
          </p>
        </div>
      )}
    </div>
  );
};