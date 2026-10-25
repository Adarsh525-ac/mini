import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Heart, 
  MoreHorizontal, 
  Plus, 
  Trash2, 
  Check 
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '3:45';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const SongRow = ({ 
  song, 
  index, 
  playlist = [], 
  onRemove = null,
  userPlaylists = [] 
}) => {
  const { currentSong, isPlaying, playSong, togglePlay, toggleLike, isLiked } = usePlayer();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [addedStatus, setAddedStatus] = useState(null);

  const isCurrentSong = currentSong?.id === song.id;
  const isPlayingCurrent = isCurrentSong && isPlaying;
  const liked = isLiked(song.id);

  const handlePlayClick = () => {
    if (isCurrentSong) {
      togglePlay();
    } else {
      playSong(song, playlist.length > 0 ? playlist : [song]);
    }
  };

  const handleAddToPlaylist = async (playlistId) => {
    try {
      await api.addSongToPlaylist(playlistId, song.id);
      setAddedStatus(playlistId);
      setTimeout(() => {
        setAddedStatus(null);
        setMenuOpen(false);
      }, 1200);
    } catch (err) {
      alert(`Could not add song: ${err.message}`);
    }
  };

  return (
    <div 
      className={`group relative flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors select-none ${
        isCurrentSong 
          ? 'bg-white/10 text-spotify-green' 
          : 'hover:bg-white/5 text-zinc-300'
      }`}
    >
      {/* Left: Index / Play Icon & Track Title */}
      <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-4">
        {/* Index or Animated Equalizer or Play Button */}
        <div className="w-6 flex items-center justify-center flex-shrink-0 text-xs">
          {isPlayingCurrent ? (
            <div className="flex items-end gap-0.5 h-4">
              <span className="w-1 bg-spotify-green soundwave-bar" />
              <span className="w-1 bg-spotify-green soundwave-bar" />
              <span className="w-1 bg-spotify-green soundwave-bar" />
            </div>
          ) : (
            <>
              <span className="group-hover:hidden text-zinc-500 font-mono">
                {index + 1}
              </span>
              <button
                type="button"
                onClick={handlePlayClick}
                className="hidden group-hover:flex items-center justify-center text-white"
                aria-label={isCurrentSong && isPlaying ? "Pause" : "Play"}
              >
                {isCurrentSong && isPlaying ? (
                  <Pause className="w-4 h-4 fill-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white translate-x-0.5" />
                )}
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Cover */}
        <div className="w-10 h-10 rounded overflow-hidden bg-zinc-800 flex-shrink-0 shadow-sm">
          <img
            src={api.resolveMediaUrl(song.coverUrl || song.coverObjectPath) || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&auto=format&fit=crop&q=80"}
            alt={song.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80";
            }}
          />
        </div>

        {/* Title and Artist */}
        <div className="flex flex-col min-w-0">
          <span 
            onClick={handlePlayClick}
            className={`text-sm font-semibold truncate cursor-pointer ${
              isCurrentSong ? 'text-spotify-green' : 'text-white hover:underline'
            }`}
          >
            {song.title}
          </span>
          <span className="text-xs text-zinc-400 truncate hover:underline cursor-pointer">
            {song.artistName || 'Unknown Artist'}
          </span>
        </div>
      </div>

      {/* Middle: Album Name (Desktop) */}
      <div className="hidden md:block w-1/4 truncate text-xs text-zinc-400 pr-4">
        {song.albumName || 'Single'}
      </div>

      {/* Right: Like, Duration, Actions */}
      <div className="flex items-center gap-4 text-xs text-zinc-400 flex-shrink-0">
        {/* Like Button */}
        <button
          type="button"
          onClick={() => toggleLike(song)}
          title={liked ? "Unlike" : "Like"}
          className="transition p-1 hover:text-white"
        >
          <Heart 
            className={`w-4 h-4 ${
              liked 
                ? 'text-spotify-green fill-spotify-green opacity-100' 
                : 'opacity-0 group-hover:opacity-100 hover:text-white'
            }`} 
          />
        </button>

        {/* Track Duration */}
        <span className="font-mono w-10 text-right">
          {formatDuration(song.duration)}
        </span>

        {/* More Actions Dropdown (Add to Playlist / Remove) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(prev => !prev)}
            className="p-1 rounded hover:text-white opacity-0 group-hover:opacity-100 transition"
            title="More options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div 
              className="absolute right-0 top-6 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl py-1 z-50 animate-fade-in text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              {onRemove && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onRemove(song.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove from playlist</span>
                </button>
              )}

              {userPlaylists.length > 0 ? (
                <>
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                    Add to Playlist
                  </div>
                  <div className="max-h-36 overflow-y-auto">
                    {userPlaylists.map(pl => (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => handleAddToPlaylist(pl.id)}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 text-left truncate"
                      >
                        <span className="truncate">{pl.name}</span>
                        {addedStatus === pl.id ? (
                          <Check className="w-3.5 h-3.5 text-spotify-green" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-zinc-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="px-3 py-2 text-zinc-500 italic text-[11px]">
                  No playlists available
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SongRow;
