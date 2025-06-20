import React from 'react';
import { Clock, User, Calendar } from 'lucide-react';

interface VideoPreviewProps {
  title: string;
  thumbnail: string;
  duration: string;
  channelName: string;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  title,
  thumbnail,
  duration,
  channelName,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
      <div className="relative">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-64 object-cover"
        />
        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{duration}</span>
        </div>
      </div>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
          {title}
        </h2>
        <div className="flex items-center space-x-4 text-gray-600">
          <div className="flex items-center space-x-1">
            <User className="w-4 h-4" />
            <span className="text-sm">{channelName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};