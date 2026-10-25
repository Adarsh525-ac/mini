import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  FolderPlus, 
  History, 
  ListMusic, 
  Play, 
  Trash2,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import api from '../services/api';
import SongList from '../components/songs/SongList';
import { CardSkeleton } from '../components/common/LoadingSkeleton';

const Library = () => {
  const { user } = useAuth();
  const { playSong } = usePlayer();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('playlists'); // 'playlists' | 'history'
  const [playlists, setPlaylists] = useState([]);
  const [history, setHistory] = useState([]);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLibraryData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch playlists
        const plData = await api.getPlaylists();
        setPlaylists(Array.isArray(plData) ? plData : plData.playlists || []);

        // Fetch likes count
        const likesData = await api.getUserLikes();
        const lList = Array.isArray(likesData) ? likesData : likesData.likes || [];
        setLikesCount(lList.length);

        // Fetch history
        const histData = await api.getHistory();
        const hList = Array.isArray(histData) ? histData : histData.history || [];
        setHistory(hList);
      } catch (err) {
        console.warn('Library data load error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLibraryData();
  }, [user]);

  const handleDeletePlaylist = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;
    try {
      await api.deletePlaylist(id);
      setPlaylists(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(`Could not delete playlist: ${err.message}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-full pb-28 p-8 flex flex-col items-center justify-center text-center">
        <ListMusic className="w-16 h-16 text-zinc-600 mb-4" />
        <h2 className="text-2xl font-bold text-white">Enjoy Your Library</h2>
        <p className="text-sm text-zinc-400 mt-2 max-w-sm mb-6">
          Log in to see your liked songs, personal playlists, and cloud listening history.
        </p>
        <Link
          to="/login"
          className="px-6 py-3 rounded-full bg-white text-black font-bold text-sm hover:scale-105 transition"
        >
          Log in to CloudTune
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-28 p-6 md:p-8">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Library</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('playlists')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              activeTab === 'playlists'
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            Playlists &amp; Collections
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Recently Played</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : activeTab === 'playlists' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Liked Songs Hero Card */}
          <Link
            to="/liked-songs"
            className="p-5 rounded-2xl bg-gradient-to-br from-indigo-800 via-purple-700 to-indigo-950 flex flex-col justify-between hover:scale-[1.02] transition-transform shadow-lg cursor-pointer h-56"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Liked Songs</h3>
              <p className="text-xs text-indigo-200 mt-1 font-medium">
                {likesCount} liked track{likesCount === 1 ? '' : 's'}
              </p>
            </div>
          </Link>

          {/* User Playlists */}
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => navigate(`/playlist/${pl.id}`)}
              className="group p-4 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/40 flex flex-col justify-between hover:shadow-xl transition-all cursor-pointer h-56 relative"
            >
              <div className="aspect-square w-full max-h-32 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden mb-2">
                <ListMusic className="w-12 h-12 text-zinc-600 group-hover:text-spotify-green transition-colors" />
              </div>

              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-2">
                  <h4 className="text-sm font-bold text-white truncate">{pl.name}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {pl.songIds ? pl.songIds.length : (pl.songs?.length || 0)} song(s)
                  </p>
                </div>

                <button
                  onClick={(e) => handleDeletePlaylist(pl.id, e)}
                  title="Delete playlist"
                  className="p-1.5 rounded-full text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Listening History Section */
        <div className="bg-zinc-950/40 p-6 rounded-2xl border border-zinc-800/40">
          <div className="flex items-center gap-2 mb-4 text-zinc-400 text-xs">
            <Clock className="w-4 h-4 text-spotify-green" />
            <span>Tracks recorded to Firestore `listeningHistory` collection</span>
          </div>

          {history.length === 0 ? (
            <p className="text-zinc-500 text-sm py-8 text-center italic">
              No recently played tracks yet. Start listening to any track!
            </p>
          ) : (
            <SongList
              songs={history.map(item => item.song || item)}
              playlist={history.map(item => item.song || item)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Library;
