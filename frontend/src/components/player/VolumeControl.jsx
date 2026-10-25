import React from 'react';
import { Volume2, Volume1, VolumeX } from 'lucide-react';

const VolumeControl = ({ volume, isMuted, onVolumeChange, onToggleMute }) => {
  const currentVolume = isMuted ? 0 : volume;

  const handleSliderChange = (e) => {
    onVolumeChange(parseFloat(e.target.value));
  };

  const renderIcon = () => {
    if (isMuted || currentVolume === 0) {
      return <VolumeX className="w-5 h-5 text-zinc-400 hover:text-white transition-colors" />;
    }
    if (currentVolume < 0.5) {
      return <Volume1 className="w-5 h-5 text-zinc-400 hover:text-white transition-colors" />;
    }
    return <Volume2 className="w-5 h-5 text-zinc-400 hover:text-white transition-colors" />;
  };

  return (
    <div className="flex items-center gap-2 group w-32">
      <button 
        type="button"
        onClick={onToggleMute}
        title={isMuted ? "Unmute" : "Mute"}
        className="focus:outline-none"
      >
        {renderIcon()}
      </button>

      <div className="relative flex-1 flex items-center h-4 cursor-pointer">
        <div className="w-full h-1 bg-zinc-700 rounded-full overflow-hidden group-hover:h-1.5 transition-all">
          <div 
            className="h-full bg-white group-hover:bg-spotify-green transition-colors"
            style={{ width: `${currentVolume * 100}%` }}
          />
        </div>

        <input
          type="range"
          min="0"
          max="1"
          step="0.02"
          value={currentVolume}
          onChange={handleSliderChange}
          aria-label="Volume control"
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-4"
        />

        <div 
          className="absolute w-2.5 h-2.5 bg-white rounded-full shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2"
          style={{ left: `${currentVolume * 100}%` }}
        />
      </div>
    </div>
  );
};

export default VolumeControl;
