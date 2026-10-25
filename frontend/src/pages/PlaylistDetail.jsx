import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Trash2, 
  Edit3, 
  ListMusic, 
  Clock, 
  Music 
} from 'lucide-react';
import api from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import SongList from '../components/songs/SongList';
import Modal from '../components/common/Modal';

const PlaylistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();

  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const loadPlaylist = async () => {
    try {
      setLoading(true);
      const data = await api.getPlaylistById(id);
      setPlaylist(data);
      setNewName(data.name || '');
      setSongs(data.songs || []);
    } catch (err) {
      console.error('Failed to load playlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylist();
  }, [id]);

  const handlePlayAll = () => {
    if (songs.length === 0) return;
    const isCurrentPlaying = currentSong && songs.some(s => s.id === currentSong.id);
    if (isCurrentPlaying) {
      togglePlay();
    } else {
      playSong(songs[0], songs);
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await api.updatePlaylist(id, newName.trim());
      setPlaylist(prev => ({ ...prev, name: newName.trim() }));
      setIsEditModalOpen(false);
    } catch (err) {
      alert(`Could not rename playlist: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this playlist permanently?')) return;
    try {
      await api.deletePlaylist(id);
      navigate('/library');
    } catch (err) {
      alert(`Could not delete playlist: ${err.message}`);
    }
  };

  const handleRemoveSong = async (songId) => {
    try {
      await api.removeSongFromPlaylist(id, songId);
      setSongs(prev => prev.filter(s => s.id !== songId));
    } catch (err) {
      alert(`Could not remove track: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <p>Loading playlist...</p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <p>Playlist not found.</p>
        <button onClick={() => navigate('/library')} className="mt-4 px-4 py-2 rounded bg-zinc-800 text-white">
          Back to Library
        </button>
      </div>
    );
  }

  const isCurrentPlayingPlaylist = currentSong && songs.some(s => s.id === currentSong.id) && isPlaying;

  return (
    <div className="min-h-full pb-28">
      {/* Playlist Hero Banner */}
      <div className="p-6 md:p-8 spotify-gradient-blue flex flex-col md:flex-row items-start md:items-end gap-6 border-b border-zinc-800/40">
        {/* Cover Collage or Icon */}
        <div className="w-48 h-48 rounded-xl bg-zinc-800 shadow-2xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-zinc-700/30">
          {songs.length > 0 && (songs[0].coverUrl || songs[0].coverObjectPath) ? (
            <img 
              src={api.resolveMediaUrl(songs[0].coverUrl || songs[0].coverObjectPath)} 
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ListMusic className="w-20 h-20 text-zinc-600" />
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Playlist</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            {playlist.name}
          </h1>
          <div className="flex items-center gap-2 text-xs text-zinc-300 mt-2 font-medium">
            <span>By {playlist.ownerName || user?.displayName || 'CloudTune User'}</span>
            <span>&bull;</span>
            <span>{songs.length} track{songs.length === 1 ? '' : 's'}</span>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="px-6 md:px-8 py-5 flex items-center gap-4">
        {/* Play Button */}
        <button
          onClick={handlePlayAll}
          disabled={songs.length === 0}
          className="w-14 h-14 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition disabled:opacity-40"
          title={isCurrentPlayingPlaylist ? "Pause" : "Play"}
        >
          {isCurrentPlayingPlaylist ? (
            <Pause className="w-6 h-6 fill-black" />
          ) : (
            <Play className="w-6 h-6 fill-black translate-x-0.5" />
          )}
        </button>

        {/* Edit Name Button */}
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="p-2.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          title="Rename playlist"
        >
          <Edit3 className="w-5 h-5" />
        </button>

        {/* Delete Playlist Button */}
        <button
          onClick={handleDelete}
          className="p-2.5 rounded-full text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition"
          title="Delete playlist"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Playlist Songs Table */}
      <div className="px-6 md:px-8">
        {songs.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 bg-zinc-900/30 rounded-2xl border border-zinc-800/40">
            <Music className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
            <p className="text-sm font-semibold text-zinc-300">This playlist is empty</p>
            <p className="text-xs text-zinc-500 mt-1">
              Browse tracks on the Home or Search pages and click the options menu (&bull;&bull;&bull;) to add songs.
            </p>
          </div>
        ) : (
          <SongList
            songs={songs}
            playlist={songs}
            onRemove={handleRemoveSong}
          />
        )}
      </div>

      {/* Rename Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Rename Playlist"
      >
        <form onSubmit={handleRename} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">New Name</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded bg-zinc-800 text-white border border-zinc-700 focus:border-spotify-green focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded text-sm text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-spotify-green text-black font-semibold text-sm hover:bg-spotify-green-hover"
            >
              Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PlaylistDetail;
