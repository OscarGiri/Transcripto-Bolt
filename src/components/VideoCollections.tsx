import React, { useState, useEffect } from 'react';
import { Folder, Plus, Edit3, Trash2, Star, Lock, Globe, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { VideoSummary } from '../types';

interface Collection {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  color: string;
  icon: string;
  createdAt: string;
  itemCount: number;
  items?: VideoSummary[];
}

interface VideoCollectionsProps {
  onSelectVideo?: (video: VideoSummary) => void;
}

export const VideoCollections: React.FC<VideoCollectionsProps> = ({ onSelectVideo }) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    isPublic: false,
    color: '#3B82F6',
    icon: 'folder'
  });
  const { user } = useAuth();

  const iconOptions = [
    { value: 'folder', label: 'Folder', icon: Folder },
    { value: 'star', label: 'Star', icon: Star },
    { value: 'lock', label: 'Lock', icon: Lock },
    { value: 'globe', label: 'Globe', icon: Globe },
  ];

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  useEffect(() => {
    if (user) {
      fetchCollections();
    }
  }, [user]);

  const fetchCollections = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch collections with item counts
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('video_collections')
        .select(`
          *,
          collection_items(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (collectionsError) throw collectionsError;

      const formattedCollections: Collection[] = collectionsData.map(collection => ({
        id: collection.id,
        name: collection.name,
        description: collection.description || '',
        isPublic: collection.is_public,
        color: collection.color,
        icon: collection.icon,
        createdAt: collection.created_at,
        itemCount: collection.collection_items?.length || 0,
      }));

      setCollections(formattedCollections);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionItems = async (collectionId: string) => {
    try {
      const { data, error } = await supabase
        .from('collection_items')
        .select(`
          *,
          video_summaries(*)
        `)
        .eq('collection_id', collectionId)
        .order('position', { ascending: true });

      if (error) throw error;

      const items: VideoSummary[] = data.map(item => ({
        id: item.video_summaries.id,
        title: item.video_summaries.title,
        thumbnail: item.video_summaries.thumbnail,
        duration: item.video_summaries.duration,
        channelName: item.video_summaries.channel_name,
        summary: item.video_summaries.summary,
        bulletPoints: item.video_summaries.bullet_points,
        keyQuote: item.video_summaries.key_quote,
        transcript: item.video_summaries.transcript,
        videoId: item.video_summaries.video_id,
        createdAt: item.video_summaries.created_at,
        updatedAt: item.video_summaries.updated_at,
        highlightedSegments: item.video_summaries.highlighted_segments || [],
        language: item.video_summaries.language || 'en',
        translatedSummary: item.video_summaries.translated_summary || {},
        translatedTranscript: item.video_summaries.translated_transcript || {},
      }));

      // Update the collection with items
      setCollections(prev => prev.map(collection => 
        collection.id === collectionId 
          ? { ...collection, items }
          : collection
      ));

    } catch (error) {
      console.error('Error fetching collection items:', error);
    }
  };

  const toggleCollection = async (collectionId: string) => {
    const isExpanded = expandedCollections.has(collectionId);
    
    if (isExpanded) {
      setExpandedCollections(prev => {
        const newSet = new Set(prev);
        newSet.delete(collectionId);
        return newSet;
      });
    } else {
      setExpandedCollections(prev => new Set([...prev, collectionId]));
      
      // Fetch items if not already loaded
      const collection = collections.find(c => c.id === collectionId);
      if (collection && !collection.items) {
        await fetchCollectionItems(collectionId);
      }
    }
  };

  const createCollection = async () => {
    if (!user || !newCollection.name.trim()) return;

    try {
      const { error } = await supabase
        .from('video_collections')
        .insert({
          user_id: user.id,
          name: newCollection.name.trim(),
          description: newCollection.description.trim(),
          is_public: newCollection.isPublic,
          color: newCollection.color,
          icon: newCollection.icon,
        });

      if (error) throw error;

      setNewCollection({
        name: '',
        description: '',
        isPublic: false,
        color: '#3B82F6',
        icon: 'folder'
      });
      setShowCreateForm(false);
      await fetchCollections();
    } catch (error) {
      console.error('Error creating collection:', error);
    }
  };

  const updateCollection = async () => {
    if (!user || !editingCollection) return;

    try {
      const { error } = await supabase
        .from('video_collections')
        .update({
          name: editingCollection.name,
          description: editingCollection.description,
          is_public: editingCollection.isPublic,
          color: editingCollection.color,
          icon: editingCollection.icon,
        })
        .eq('id', editingCollection.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setEditingCollection(null);
      await fetchCollections();
    } catch (error) {
      console.error('Error updating collection:', error);
    }
  };

  const deleteCollection = async (collectionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('video_collections')
        .delete()
        .eq('id', collectionId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchCollections();
    } catch (error) {
      console.error('Error deleting collection:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(option => option.value === iconName);
    return iconOption ? iconOption.icon : Folder;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Video Collections</h2>
          <p className="text-gray-600">Organize your videos into custom collections</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Create/Edit Collection Form */}
      {(showCreateForm || editingCollection) && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingCollection ? 'Edit Collection' : 'Create New Collection'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={editingCollection ? editingCollection.name : newCollection.name}
                onChange={(e) => {
                  if (editingCollection) {
                    setEditingCollection({ ...editingCollection, name: e.target.value });
                  } else {
                    setNewCollection({ ...newCollection, name: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Collection name..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <select
                value={editingCollection ? editingCollection.icon : newCollection.icon}
                onChange={(e) => {
                  if (editingCollection) {
                    setEditingCollection({ ...editingCollection, icon: e.target.value });
                  } else {
                    setNewCollection({ ...newCollection, icon: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {iconOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={editingCollection ? editingCollection.description : newCollection.description}
              onChange={(e) => {
                if (editingCollection) {
                  setEditingCollection({ ...editingCollection, description: e.target.value });
                } else {
                  setNewCollection({ ...newCollection, description: e.target.value });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Optional description..."
            />
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex space-x-2">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    onClick={() => {
                      if (editingCollection) {
                        setEditingCollection({ ...editingCollection, color });
                      } else {
                        setNewCollection({ ...newCollection, color });
                      }
                    }}
                    className={`w-8 h-8 rounded-full border-2 ${
                      (editingCollection ? editingCollection.color : newCollection.color) === color
                        ? 'border-gray-800'
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={editingCollection ? editingCollection.isPublic : newCollection.isPublic}
                onChange={(e) => {
                  if (editingCollection) {
                    setEditingCollection({ ...editingCollection, isPublic: e.target.checked });
                  } else {
                    setNewCollection({ ...newCollection, isPublic: e.target.checked });
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700">
                Make public
              </label>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={editingCollection ? updateCollection : createCollection}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingCollection ? 'Update' : 'Create'}
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingCollection(null);
              }}
              className="text-gray-600 hover:text-gray-800 px-4 py-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Collections List */}
      <div className="space-y-4">
        {collections.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Collections Yet</h3>
            <p className="text-gray-600 mb-4">Create your first collection to organize your videos.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Collection
            </button>
          </div>
        ) : (
          collections.map((collection) => {
            const IconComponent = getIconComponent(collection.icon);
            const isExpanded = expandedCollections.has(collection.id);

            return (
              <div key={collection.id} className="bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleCollection(collection.id)}
                      className="flex items-center space-x-3 flex-1 text-left"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${collection.color}20` }}
                      >
                        <IconComponent 
                          className="w-5 h-5" 
                          style={{ color: collection.color }}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{collection.name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{collection.itemCount} videos</span>
                          {collection.isPublic && (
                            <>
                              <span>•</span>
                              <div className="flex items-center space-x-1">
                                <Globe className="w-3 h-3" />
                                <span>Public</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingCollection(collection)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit collection"
                      >
                        <Edit3 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => deleteCollection(collection.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete collection"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {collection.description && (
                    <p className="text-gray-600 text-sm mt-2 ml-8">{collection.description}</p>
                  )}
                </div>

                {/* Collection Items */}
                {isExpanded && collection.items && (
                  <div className="border-t border-gray-200 p-4">
                    {collection.items.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No videos in this collection yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {collection.items.map((video) => (
                          <div
                            key={video.id}
                            onClick={() => onSelectVideo?.(video)}
                            className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-24 object-cover rounded mb-2"
                            />
                            <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                              {video.title}
                            </h4>
                            <p className="text-xs text-gray-500">{video.channelName}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};