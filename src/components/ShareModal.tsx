import React, { useState } from 'react';
import { X, Share2, Copy, Check, Lock, Globe, Calendar, Eye, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { VideoSummary } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoData: VideoSummary;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, videoData }) => {
  const [shareSettings, setShareSettings] = useState({
    isPublic: false,
    password: '',
    expiresAt: '',
    maxViews: '',
    allowDownloads: true,
    title: videoData.title,
    description: '',
  });
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const createShareLink = async () => {
    setLoading(true);
    try {
      const shareData = {
        video_summary_id: videoData.id,
        title: shareSettings.title,
        description: shareSettings.description,
        is_public: shareSettings.isPublic,
        password_hash: shareSettings.password ? await hashPassword(shareSettings.password) : null,
        expires_at: shareSettings.expiresAt ? new Date(shareSettings.expiresAt).toISOString() : null,
        max_views: shareSettings.maxViews ? parseInt(shareSettings.maxViews) : null,
        allow_downloads: shareSettings.allowDownloads,
      };

      const { data, error } = await supabase
        .from('shared_summaries')
        .insert(shareData)
        .select('share_token')
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/shared/${data.share_token}`;
      setShareUrl(url);
    } catch (error) {
      console.error('Error creating share link:', error);
    } finally {
      setLoading(false);
    }
  };

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const copyToClipboard = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Share2 className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Share Video Summary</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!shareUrl ? (
            <>
              {/* Share Settings */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share Title
                  </label>
                  <input
                    type="text"
                    value={shareSettings.title}
                    onChange={(e) => setShareSettings({ ...shareSettings, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Custom title for shared link..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={shareSettings.description}
                    onChange={(e) => setShareSettings({ ...shareSettings, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Add a description for this shared summary..."
                  />
                </div>

                {/* Visibility Settings */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Visibility</h3>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="private"
                      name="visibility"
                      checked={!shareSettings.isPublic}
                      onChange={() => setShareSettings({ ...shareSettings, isPublic: false })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="private" className="flex items-center space-x-2 text-sm">
                      <Lock className="w-4 h-4 text-gray-500" />
                      <span>Private link (only people with the link can view)</span>
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="public"
                      name="visibility"
                      checked={shareSettings.isPublic}
                      onChange={() => setShareSettings({ ...shareSettings, isPublic: true })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="public" className="flex items-center space-x-2 text-sm">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <span>Public (discoverable and searchable)</span>
                    </label>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Security & Access</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Protection (Optional)
                    </label>
                    <input
                      type="password"
                      value={shareSettings.password}
                      onChange={(e) => setShareSettings({ ...shareSettings, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Set a password to protect this link..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expires On
                      </label>
                      <input
                        type="date"
                        value={shareSettings.expiresAt}
                        onChange={(e) => setShareSettings({ ...shareSettings, expiresAt: e.target.value })}
                        min={getMinDate()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Views
                      </label>
                      <input
                        type="number"
                        value={shareSettings.maxViews}
                        onChange={(e) => setShareSettings({ ...shareSettings, maxViews: e.target.value })}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Unlimited"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allowDownloads"
                      checked={shareSettings.allowDownloads}
                      onChange={(e) => setShareSettings({ ...shareSettings, allowDownloads: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="allowDownloads" className="text-sm text-gray-700">
                      Allow downloads
                    </label>
                  </div>
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={createShareLink}
                disabled={loading || !shareSettings.title.trim()}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Share Link...</span>
                  </div>
                ) : (
                  'Create Share Link'
                )}
              </button>
            </>
          ) : (
            <>
              {/* Share Link Created */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Share Link Created!</h3>
                <p className="text-gray-600 text-sm">
                  Your video summary is now ready to share with others.
                </p>
              </div>

              {/* Share URL */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share URL
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Share Settings Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Share Settings</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <div className="flex items-center space-x-2">
                    {shareSettings.isPublic ? (
                      <Globe className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    <span>{shareSettings.isPublic ? 'Public' : 'Private'} link</span>
                  </div>
                  
                  {shareSettings.password && (
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <span>Password protected</span>
                    </div>
                  )}
                  
                  {shareSettings.expiresAt && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Expires on {new Date(shareSettings.expiresAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {shareSettings.maxViews && (
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>Max {shareSettings.maxViews} views</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Downloads {shareSettings.allowDownloads ? 'allowed' : 'disabled'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShareUrl(null);
                    setShareSettings({
                      isPublic: false,
                      password: '',
                      expiresAt: '',
                      maxViews: '',
                      allowDownloads: true,
                      title: videoData.title,
                      description: '',
                    });
                  }}
                  className="flex-1 text-gray-600 hover:text-gray-800 py-2 transition-colors"
                >
                  Create Another
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};