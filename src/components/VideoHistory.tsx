import React, { useState, useEffect } from 'react';
import { History, Clock, Trash2, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { VideoSummary } from '../types';
import { useAuth } from '../hooks/useAuth';

interface VideoHistoryProps {
  onSelectVideo: (video: VideoSummary) => void;
}

export const VideoHistory: React.FC<VideoHistoryProps> = ({ onSelectVideo }) => {
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchVideoHistory();
    }
  }, [user]);

  const fetchVideoHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('video_summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

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
      }));

      setVideos(formattedVideos);
    } catch (error) {
      console.error('Error fetching video history:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteVideo = async (videoId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('video_summaries')
        .delete()
        .eq('id', videoId)
        .eq('user_id', user.id);

      if (error) throw error;

      setVideos(videos.filter(video => video.id !== videoId));
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  if (!user || videos.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 mb-8">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Summaries</h3>
              <span className="text-sm text-gray-500">({videos.length})</span>
            </div>
          </button>
        </div>

        {(isExpanded || videos.length > 0) && (
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {videos.slice(0, isExpanded ? videos.length : 4).map((video) => (
                  <div
                    key={video.id}
                    className="group bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-16 h-12 object-cover rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                          {video.title}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                          <Clock className="w-3 h-3" />
                          <span>{video.duration}</span>
                          <span>•</span>
                          <span>{new Date(video.createdAt!).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onSelectVideo(video)}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => deleteVideo(video.id!)}
                            className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {videos.length > 4 && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {isExpanded ? 'Show Less' : `Show All ${videos.length} Summaries`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};