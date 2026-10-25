import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Library, 
  PlusSquare, 
  Heart, 
  ShieldCheck, 
  Cloud, 
  Music2, 
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Modal from '../common/Modal';

const Sidebar = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Load playlists for logged-in user
  const loadPlaylists = async () => {
    if (user) {
      try {
        const data = await api.getPlaylists();
        setPlaylists(Array.isArray(data) ? data : data.playlists || []);
      } catch (err) {
        console.warn('Failed to fetch user playlists:', err.message);
      }
    } else {
      setPlaylists([]);
    }
  };

  useEffect(() => {
    loadPlaylists();
  }, [user]);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      setIsCreating(true);
      const created = await api.createPlaylist(newPlaylistName.trim());
      setPlaylists(prev => [created, ...prev]);
      setNewPlaylistName('');
      setIsCreateModalOpen(false);
      navigate(`/playlist/${created.id}`);
    } catch (err) {
      alert(`Could not create playlist: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <aside className="w-64 bg-black flex flex-col h-full border-r border-zinc-900 select-none flex-shrink-0">
        {/* Brand Header */}
        <div className="p-6 pb-4">
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-600 to-spotify-green flex items-center justify-center shadow-lg shadow-spotify-green/20 group-hover:scale-105 transition-transform">
              <Cloud className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
                CloudTune<span className="text-spotify-green text-xs font-semibold px-1.5 py-0.5 rounded bg-spotify-green/10 border border-spotify-green/20">GCP</span>
              </span>
              <p className="text-[10px] text-zinc-500 font-mono tracking-wider">SPOTIFY ON CLOUD</p>
            </div>
          </NavLink>
        </div>

        {/* Primary Navigation Links */}
        <nav className="px-3 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
              isActive ? 'bg-zinc-800/80 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/search"
            className={({ isActive }) => `flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
              isActive ? 'bg-zinc-800/80 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Search className="w-5 h-5" />
            <span>Search</span>
          </NavLink>

          <NavLink
            to="/library"
            className={({ isActive }) => `flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
              isActive ? 'bg-zinc-800/80 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Library className="w-5 h-5" />
            <span>Your Library</span>
          </NavLink>
        </nav>

        {/* Playlist Action Section */}
        <div className="px-3 mt-6 pt-4 border-t border-zinc-900/80 space-y-1">
          <button
            type="button"
            onClick={() => {
              if (!user) {
                navigate('/login');
              } else {
                setIsCreateModalOpen(true);
              }
            }}
            className="w-full flex items-center gap-4 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900/60 transition group text-left"
          >
            <div className="w-6 h-6 rounded bg-zinc-700 group-hover:bg-white flex items-center justify-center transition-colors">
              <PlusSquare className="w-4 h-4 text-black group-hover:text-black" />
            </div>
            <span>Create Playlist</span>
          </button>

          <NavLink
            to="/liked-songs"
            className={({ isActive }) => `flex items-center gap-4 px-3 py-2 rounded-lg text-sm font-medium transition ${
              isActive ? 'text-white bg-zinc-800/80' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-600 to-purple-400 flex items-center justify-center shadow-sm">
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span>Liked Songs</span>
          </NavLink>
        </div>

        {/* Admin Section if authorized */}
        {isAdmin && (
          <div className="px-3 mt-3 pt-3 border-t border-zinc-900/80">
            <NavLink
              to="/admin"
              className={({ isActive }) => `flex items-center gap-4 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                isActive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Admin Console</span>
            </NavLink>
          </div>
        )}

        {/* Scrollable Personal Playlists list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 mt-2 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 px-2 py-1">
            Personal Playlists
          </p>

          {playlists.length === 0 ? (
            <p className="text-xs text-zinc-600 px-2 py-2 italic">
              {user ? 'No playlists yet. Create one!' : 'Log in to view playlists.'}
            </p>
          ) : (
            playlists.map((pl) => (
              <NavLink
                key={pl.id}
                to={`/playlist/${pl.id}`}
                className={({ isActive }) => `block px-2 py-1.5 rounded text-sm truncate transition ${
                  isActive ? 'text-spotify-green font-medium' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {pl.name}
              </NavLink>
            ))
          )}
        </div>

        {/* Cloud Architecture Footer badge */}
        <div className="p-3 m-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-[11px] text-zinc-400 flex flex-col gap-1">
          <div className="flex items-center justify-between font-mono">
            <span className="text-zinc-300 flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5 text-spotify-green" /> Cloud Run
            </span>
            <span className="text-[10px] text-emerald-400 px-1 py-0.2 rounded bg-emerald-950/60 border border-emerald-800/40">ONLINE</span>
          </div>
          <p className="text-[10px] text-zinc-500">Firestore &bull; Cloud Storage</p>
        </div>
      </aside>

      {/* Modal for creating a new playlist */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Playlist"
      >
        <form onSubmit={handleCreatePlaylist} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Playlist Name</label>
            <input
              type="text"
              required
              autoFocus
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="e.g., Chill Beats, Cloud Computing Vibes"
              className="w-full px-3 py-2 rounded bg-zinc-800 text-white placeholder-zinc-500 border border-zinc-700 focus:border-spotify-green focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded text-sm text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !newPlaylistName.trim()}
              className="px-5 py-2 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black font-semibold text-sm transition disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Sidebar;
