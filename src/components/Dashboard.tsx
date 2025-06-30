import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Clock, Star, TrendingUp, Search, Filter, Trash2, Eye, Calendar, Play, MoreVertical, X, RefreshCw } from 'lucide-react';
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
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'duration' | 'channel'>('recent');
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { user } = useAuth();
  const userPlan = useUserPlan(user);

  // Optimized fetch function with caching and immediate loading
  const fetchVideos = useCallback(async (showLoader = true) => {
    if (!user) return;

    if (showLoader) setLoading(true);
    setRefreshing(!showLoader);

    try {
      // Use a more optimized query with specific columns and indexing
      let query = supabase
        .from('video_summaries')
        .select(`
          id,
          video_id,
          title,
          thumbnail,
          duration,
          channel_name,
          summary,
          bullet_points,
          key_quote,
          transcript,
          highlighted_segments,
          language,
          translated_summary,
          translated_transcript,
          created_at,
          updated_at
        `)
        .eq('user_id', user.id);

      // Apply sorting with database-level optimization
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
        case 'channel':
          query = query.order('channel_name', { ascending: true });
          break;
      }

      // Limit initial load for faster response, then load more if needed
      const { data, error } = await query.limit(50);
      
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
        translatedSummary: item.translated_summary || {},
        translatedTranscript: item.translated_transcript || {},
      }));

      setVideos(formattedVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, sortBy]);

  // Immediate load on component mount and user change
  useEffect(() => {
    if (user) {
      fetchVideos(true);
    }
  }, [user, fetchVideos]);

  // Quick refresh when sort changes (without full loader)
  useEffect(() => {
    if (user && videos.length > 0) {
      fetchVideos(false);
    }
  }, [sortBy]);

  // Auto-refresh every 30 seconds to catch new videos
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchVideos(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [user, fetchVideos]);

  const handleRefresh = () => {
    fetchVideos(false);
  };

  const deleteVideo = async (videoId: string) => {
    if (!user) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('video_summaries')
        .delete()
        .eq('id', videoId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Optimistically update UI
      setVideos(prevVideos => prevVideos.filter(video => video.id !== videoId));
      setSelectedVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      // Refresh on error to ensure consistency
      fetchVideos(false);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(null);
    }
  };

  const deleteSelectedVideos = async () => {
    if (!user || selectedVideos.size === 0) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('video_summaries')
        .delete()
        .in('id', Array.from(selectedVideos))
        .eq('user_id', user.id);

      if (error) throw error;

      // Optimistically update UI
      setVideos(prevVideos => prevVideos.filter(video => !selectedVideos.has(video.id!)));
      setSelectedVideos(new Set());
    } catch (error) {
      console.error('Error deleting videos:', error);
      // Refresh on error to ensure consistency
      fetchVideos(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const selectAllVideos = () => {
    if (selectedVideos.size === filteredVideos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(filteredVideos.map(video => video.id!)));
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  if (loading || userPlan.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your recent searches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-6">
      {/* Plan and Usage Overview */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <PlanBadge plan={userPlan.plan} />
            {refreshing && (
              <div className="flex items-center space-x-2 text-blue-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Updating...</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh recent searches"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh</span>
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Upgrade Plan
            </button>
          </div>
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

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Recent Searches</p>
              <p className="text-2xl font-bold">{stats.totalVideos}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Watch Time</p>
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
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search your recent videos..."
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
                <option value="channel">Channel</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {selectedVideos.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedVideos.size} selected
                </span>
                <button
                  onClick={deleteSelectedVideos}
                  disabled={isDeleting}
                  className="flex items-center space-x-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
            
            <button
              onClick={selectAllVideos}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {selectedVideos.size === filteredVideos.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Searches Grid/List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Searches ({filteredVideos.length})
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
        </div>

        {filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No videos found' : 'No recent searches yet'}
            </h4>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search terms or filters.'
                : 'Start by analyzing your first video to see it appear here instantly.'
              }
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className={`relative bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group ${
                  selectedVideos.has(video.id!) ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={selectedVideos.has(video.id!)}
                    onChange={() => toggleVideoSelection(video.id!)}
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Actions Menu */}
                <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(video.id!);
                      }}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete video"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                <div onClick={() => onSelectVideo(video)}>
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
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                        <Star className="w-3 h-3" />
                        <span>{video.highlightedSegments.length}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                      {video.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">{video.channelName}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDate(video.createdAt!)}</span>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className={`flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group ${
                  selectedVideos.has(video.id!) ? 'bg-blue-50 border border-blue-200' : 'border border-gray-200'
                }`}
                onClick={() => onSelectVideo(video)}
              >
                <input
                  type="checkbox"
                  checked={selectedVideos.has(video.id!)}
                  onChange={() => toggleVideoSelection(video.id!)}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
                
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-20 h-14 object-cover rounded flex-shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {video.title}
                  </h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <span>{video.channelName}</span>
                    <span>•</span>
                    <span>{video.duration}</span>
                    <span>•</span>
                    <span>{formatDate(video.createdAt!)}</span>
                    {video.highlightedSegments && video.highlightedSegments.length > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span>{video.highlightedSegments.length} highlights</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectVideo(video);
                    }}
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    title="View video"
                  >
                    <Eye className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(video.id!);
                    }}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete video"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Video</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this video summary? This action cannot be undone.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => deleteVideo(showDeleteConfirm)}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={isDeleting}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};