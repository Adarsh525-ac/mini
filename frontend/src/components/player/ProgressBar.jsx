import React from 'react';

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const ProgressBar = ({ currentTime, duration, onSeek }) => {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSliderChange = (e) => {
    const newPercent = parseFloat(e.target.value);
    const targetSeconds = (newPercent / 100) * duration;
    onSeek(targetSeconds);
  };

  return (
    <div className="w-full flex items-center gap-2 group text-xs text-zinc-400">
      <span className="w-10 text-right font-mono select-none">
        {formatTime(currentTime)}
      </span>

      <div className="relative flex-1 flex items-center h-4 cursor-pointer">
        {/* Background track */}
        <div className="w-full h-1 bg-zinc-700 rounded-full overflow-hidden group-hover:h-1.5 transition-all">
          {/* Progress fill */}
          <div 
            className="h-full bg-white group-hover:bg-spotify-green transition-colors"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Real range input overlaid invisibly for accessibility & precise dragging */}
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={isNaN(progressPercent) ? 0 : progressPercent}
          onChange={handleSliderChange}
          aria-label="Seek track"
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-4"
        />

        {/* Seek thumb marker that appears on hover */}
        <div 
          className="absolute w-3 h-3 bg-white rounded-full shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2"
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      <span className="w-10 text-left font-mono select-none">
        {formatTime(duration)}
      </span>
    </div>
  );
};

export default ProgressBar;
