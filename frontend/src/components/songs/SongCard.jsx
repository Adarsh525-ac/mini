import React from 'react';
import { Play, Pause } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import api from '../../services/api';

const SongCard = ({ song, playlist = [] }) => {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();
  const isCurrentSong = currentSong?.id === song?.id;

  const handleCardClick = () => {
    if (isCurrentSong) {
      togglePlay();
    } else {
      playSong(song, playlist.length > 0 ? playlist : [song]);
    }
  };

  const rawCover = song.coverUrl || song.coverObjectPath;
  const coverSrc = api.resolveMediaUrl(rawCover) || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80";

  return (
    <div 
      onClick={handleCardClick}
      className="group relative p-4 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 transition-all duration-300 cursor-pointer flex flex-col hover:shadow-xl border border-zinc-800/30"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-3 bg-zinc-800 shadow-md">
        <img
          src={coverSrc}
          alt={song.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80";
          }}
        />

        {/* Floating Green Play Button on Hover */}
        <div className={`absolute bottom-2 right-2 transition-all duration-300 transform ${
          isCurrentSong && isPlaying 
            ? 'opacity-100 translate-y-0 shadow-lg' 
            : 'opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0'
        }`}>
          <button
            type="button"
            className="w-11 h-11 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all"
            aria-label={`Play ${song.title}`}
          >
            {isCurrentSong && isPlaying ? (
              <Pause className="w-5 h-5 fill-black" />
            ) : (
              <Play className="w-5 h-5 fill-black translate-x-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Song Metadata */}
      <div className="flex flex-col min-w-0">
        <h4 className={`text-sm font-semibold truncate ${
          isCurrentSong ? 'text-spotify-green' : 'text-white group-hover:text-white'
        }`}>
          {song.title}
        </h4>
        <p className="text-xs text-zinc-400 truncate mt-1">
          {song.artistName || 'Unknown Artist'}
        </p>
        {song.genre && (
          <span className="text-[10px] text-zinc-500 truncate mt-0.5 uppercase tracking-wide">
            {song.genre}
          </span>
        )}
      </div>
    </div>
  );
};

export default SongCard;
