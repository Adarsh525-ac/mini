import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Heart, 
  Music,
  Loader2,
  ListMusic
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';
import api from '../../services/api';

const Player = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    isRepeat,
    isLoadingAudio,
    audioError,
    queue,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    isLiked
  } = usePlayer();

  if (!currentSong) {
    // Empty state player banner indicating ready to stream
    return (
      <footer className="h-20 bg-zinc-950 border-t border-zinc-800 px-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-300">No song selected</p>
            <p className="text-xs text-zinc-500">Choose a track to start streaming</p>
          </div>
        </div>

        <div className="flex flex-col items-center max-w-lg w-full">
          <div className="flex items-center gap-4 text-zinc-600">
            <SkipBack className="w-5 h-5 cursor-not-allowed" />
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
              <Play className="w-4 h-4 fill-zinc-600 text-zinc-600 translate-x-0.5" />
            </div>
            <SkipForward className="w-5 h-5 cursor-not-allowed" />
          </div>
        </div>

        <div className="w-40 hidden md:block">
          <VolumeControl
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={setVolume}
            onToggleMute={toggleMute}
          />
        </div>
      </footer>
    );
  }

  const liked = isLiked(currentSong.id);

  return (
    <footer className="h-24 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80 px-4 md:px-6 flex items-center justify-between z-50 transition-all select-none">
      {/* Left section: Track Info */}
      <div className="flex items-center gap-3 w-1/4 min-w-[180px]">
        <div className="relative group w-14 h-14 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0 shadow-lg">
          <img 
            src={api.resolveMediaUrl(currentSong.coverUrl || currentSong.coverObjectPath) || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=80"} 
            alt={currentSong.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80";
            }}
          />
        </div>

        <div className="flex flex-col min-w-0 pr-2">
          <span className="text-sm font-semibold text-white truncate hover:underline cursor-pointer">
            {currentSong.title}
          </span>
          <span className="text-xs text-zinc-400 truncate hover:underline cursor-pointer">
            {currentSong.artistName || 'Unknown Artist'}
          </span>
          {audioError && (
            <span className="text-[10px] text-amber-400 truncate">
              {audioError}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => toggleLike(currentSong)}
          className="text-zinc-400 hover:text-white transition p-1 ml-1"
          title={liked ? "Remove from Liked Songs" : "Save to Liked Songs"}
        >
          <Heart 
            className={`w-5 h-5 transition-transform active:scale-125 ${
              liked ? 'text-spotify-green fill-spotify-green' : 'hover:text-white'
            }`} 
          />
        </button>
      </div>

      {/* Middle section: Playback Controls & Progress Bar */}
      <div className="flex flex-col items-center max-w-2xl w-2/4 px-2">
        <div className="flex items-center gap-6 mb-1">
          {/* Shuffle Button */}
          <button
            type="button"
            onClick={toggleShuffle}
            title={isShuffle ? "Disable shuffle" : "Enable shuffle"}
            className={`transition relative p-1 ${
              isShuffle ? 'text-spotify-green' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Shuffle className="w-4 h-4" />
            {isShuffle && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-spotify-green rounded-full" />
            )}
          </button>

          {/* Previous Track */}
          <button
            type="button"
            onClick={previousTrack}
            title="Previous track"
            className="text-zinc-400 hover:text-white transition active:scale-95 p-1"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Main Play / Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            title={isPlaying ? "Pause" : "Play"}
            className="w-9 h-9 rounded-full bg-white hover:bg-spotify-green hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-md transition-all"
          >
            {isLoadingAudio ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-black" />
            ) : (
              <Play className="w-4 h-4 fill-black translate-x-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            type="button"
            onClick={nextTrack}
            title="Next track"
            className="text-zinc-400 hover:text-white transition active:scale-95 p-1"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Repeat Button */}
          <button
            type="button"
            onClick={toggleRepeat}
            title={isRepeat ? "Disable repeat" : "Repeat track"}
            className={`transition relative p-1 ${
              isRepeat ? 'text-spotify-green' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Repeat className="w-4 h-4" />
            {isRepeat && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-spotify-green rounded-full" />
            )}
          </button>
        </div>

        {/* Real HTML5 Progress Bar */}
        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          onSeek={seek}
        />
      </div>

      {/* Right section: Queue count & Volume Control */}
      <div className="flex items-center justify-end gap-4 w-1/4 min-w-[180px]">
        {/* Queue count indicator */}
        <div 
          className="hidden lg:flex items-center gap-1.5 text-zinc-400 text-xs px-2 py-1 rounded bg-zinc-900 border border-zinc-800"
          title={`${queue.length} track(s) in queue`}
        >
          <ListMusic className="w-3.5 h-3.5 text-spotify-green" />
          <span>Queue ({queue.length})</span>
        </div>

        {/* Volume slider */}
        <VolumeControl
          volume={volume}
          isMuted={isMuted}
          onVolumeChange={setVolume}
          onToggleMute={toggleMute}
        />
      </div>
    </footer>
  );
};

export default Player;
