import React, { useState, useEffect } from 'react';
import { Heart, Play, Pause, Music } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import SongList from '../components/songs/SongList';
import { RowSkeleton } from '../components/common/LoadingSkeleton';

const LikedSongs = () => {
  const { user } = useAuth();
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikedSongs = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await api.getUserLikes();
        const list = Array.isArray(data) ? data : data.likes || [];
        // Map song items
        const songObjects = list.map(item => item.song || item);
        setSongs(songObjects);
      } catch (err) {
        console.warn('Error loading liked songs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedSongs();
  }, [user]);

  const isCurrentPlayingLikes = currentSong && songs.some(s => s.id === currentSong.id) && isPlaying;

  const handlePlayAll = () => {
    if (songs.length === 0) return;
    if (isCurrentPlayingLikes) {
      togglePlay();
    } else {
      playSong(songs[0], songs);
    }
  };

  return (
    <div className="min-h-full pb-28">
      {/* Liked Songs Purple Gradient Hero */}
      <div className="p-6 md:p-8 spotify-gradient-purple flex flex-col md:flex-row items-start md:items-end gap-6 border-b border-zinc-800/40">
        <div className="w-48 h-48 rounded-xl bg-gradient-to-br from-indigo-700 via-purple-600 to-indigo-900 shadow-2xl flex items-center justify-center flex-shrink-0 border border-white/10">
          <Heart className="w-24 h-24 text-white fill-white shadow-xl" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-200">Playlist</span>
          <h1 className="text-3xl md:text-6xl font-extrabold text-white tracking-tight">
            Liked Songs
          </h1>
          <div className="flex items-center gap-2 text-xs text-purple-200 mt-2 font-medium">
            <span>{user?.displayName || 'CloudTune Listener'}</span>
            <span>&bull;</span>
            <span>{songs.length} song{songs.length === 1 ? '' : 's'}</span>
          </div>
        </div>
      </div>

      {/* Play All Controls */}
      <div className="px-6 md:px-8 py-5 flex items-center gap-4">
        <button
          onClick={handlePlayAll}
          disabled={songs.length === 0}
          className="w-14 h-14 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition disabled:opacity-40"
          title={isCurrentPlayingLikes ? "Pause" : "Play"}
        >
          {isCurrentPlayingLikes ? (
            <Pause className="w-6 h-6 fill-black" />
          ) : (
            <Play className="w-6 h-6 fill-black translate-x-0.5" />
          )}
        </button>
      </div>

      {/* Liked Tracks Table */}
      <div className="px-6 md:px-8">
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <RowSkeleton key={i} />)}
          </div>
        ) : songs.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 bg-zinc-900/30 rounded-2xl border border-zinc-800/40">
            <Heart className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
            <p className="text-sm font-semibold text-zinc-300">Songs you like will appear here</p>
            <p className="text-xs text-zinc-500 mt-1">
              Tap the heart icon on any song to save it to your Liked Songs collection.
            </p>
          </div>
        ) : (
          <SongList songs={songs} playlist={songs} />
        )}
      </div>
    </div>
  );
};

export default LikedSongs;
