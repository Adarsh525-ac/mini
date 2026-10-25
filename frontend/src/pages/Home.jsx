import React, { useState, useEffect } from 'react';
import { Play, Sparkles, TrendingUp, Music, Disc } from 'lucide-react';
import api from '../services/api';
import SongCard from '../components/songs/SongCard';
import SongList from '../components/songs/SongList';
import { PageSkeleton } from '../components/common/LoadingSkeleton';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const Home = () => {
  const { user } = useAuth();
  const { playSong } = usePlayer();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userPlaylists, setUserPlaylists] = useState([]);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const songsData = await api.getSongs({ limit: 20 });
        const songList = Array.isArray(songsData) ? songsData : songsData.songs || [];
        setSongs(songList);

        if (user) {
          try {
            const plData = await api.getPlaylists();
            setUserPlaylists(Array.isArray(plData) ? plData : plData.playlists || []);
          } catch {}
        }
      } catch (err) {
        console.error('Home load error:', err);
        setError('Failed to connect to backend service. Please verify the Cloud Run backend is running.');
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, [user]);

  if (loading) {
    return <PageSkeleton />;
  }

  const featuredSongs = songs.slice(0, 5);
  const trendingSongs = songs.slice(2, 7);

  return (
    <div className="min-h-full pb-28 spotify-gradient p-6 md:p-8">
      {/* Dynamic Header Greeting */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          {getGreeting()}{user?.displayName ? `, ${user.displayName}` : ''}
        </h1>
        <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
          <span>Google Cloud Platform Music Streaming Engine</span>
          <span className="w-1.5 h-1.5 rounded-full bg-spotify-green" />
          <span>Cloud Run &amp; Firestore</span>
        </p>
      </div>

      {/* Quick Access Cards Grid (Top 6) */}
      {songs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {songs.slice(0, 6).map((song) => (
            <div
              key={`quick-${song.id}`}
              onClick={() => playSong(song, songs)}
              className="group flex items-center gap-4 bg-zinc-800/40 hover:bg-zinc-700/60 transition-all rounded-md overflow-hidden cursor-pointer shadow-md pr-4 border border-zinc-700/20"
            >
              <img
                src={api.resolveMediaUrl(song.coverUrl || song.coverObjectPath) || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&auto=format&fit=crop&q=80"}
                alt={song.title}
                className="w-16 h-16 object-cover flex-shrink-0"
              />
              <span className="font-bold text-sm text-white truncate flex-1">
                {song.title}
              </span>
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-spotify-green text-black flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-105 active:scale-95 shadow-xl transition-all"
                aria-label={`Play ${song.title}`}
              >
                <Play className="w-5 h-5 fill-black translate-x-0.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Section 1: Featured Tracks */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-spotify-green" />
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Featured Tracks</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {featuredSongs.map((song) => (
            <SongCard key={song.id} song={song} playlist={songs} />
          ))}
        </div>
      </section>

      {/* Section 2: Trending Now */}
      {trendingSongs.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Trending On CloudTune</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {trendingSongs.map((song) => (
              <SongCard key={`trending-${song.id}`} song={song} playlist={songs} />
            ))}
          </div>
        </section>
      )}

      {/* Section 3: Song Catalogue Table */}
      <section className="mt-8 bg-zinc-950/40 p-6 rounded-2xl border border-zinc-800/40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Disc className="w-5 h-5 text-spotify-green" />
            <h2 className="text-xl font-bold text-white tracking-tight">All Available Tracks</h2>
          </div>
          <span className="text-xs text-zinc-400">{songs.length} song(s) available</span>
        </div>

        <SongList 
          songs={songs} 
          playlist={songs}
          userPlaylists={userPlaylists}
        />
      </section>
    </div>
  );
};

export default Home;
