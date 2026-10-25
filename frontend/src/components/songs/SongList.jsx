import React from 'react';
import { Clock } from 'lucide-react';
import SongRow from './SongRow';

const SongList = ({ 
  songs = [], 
  playlist = [], 
  onRemove = null,
  userPlaylists = [] 
}) => {
  if (songs.length === 0) {
    return (
      <div className="py-12 text-center text-zinc-500">
        <p className="text-sm">No songs found in this selection.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/80 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
        <div className="flex items-center gap-3.5 flex-1 pr-4">
          <span className="w-6 text-center">#</span>
          <span>Title</span>
        </div>
        <div className="hidden md:block w-1/4 pr-4">
          <span>Album</span>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <span className="w-4" /> {/* Space for like icon */}
          <Clock className="w-4 h-4 text-zinc-400" />
          <span className="w-4" /> {/* Space for options icon */}
        </div>
      </div>

      {/* Song Rows */}
      <div className="space-y-0.5">
        {songs.map((song, index) => (
          <SongRow
            key={song.id || index}
            song={song}
            index={index}
            playlist={playlist.length > 0 ? playlist : songs}
            onRemove={onRemove}
            userPlaylists={userPlaylists}
          />
        ))}
      </div>
    </div>
  );
};

export default SongList;
