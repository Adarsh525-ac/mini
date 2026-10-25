import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, Music, Disc, Mic2, Radio } from 'lucide-react';
import api from '../services/api';
import SongCard from '../components/songs/SongCard';
import SongList from '../components/songs/SongList';
import { CardSkeleton } from '../components/common/LoadingSkeleton';

const GENRES = [
  { name: 'All', color: 'from-zinc-700 to-zinc-900' },
  { name: 'Electronic', color: 'from-blue-600 to-indigo-900' },
  { name: 'Pop', color: 'from-pink-600 to-rose-900' },
  { name: 'Rock', color: 'from-red-600 to-amber-900' },
  { name: 'Lofi', color: 'from-purple-600 to-slate-900' },
  { name: 'Hip Hop', color: 'from-orange-600 to-amber-800' },
  { name: 'Classical', color: 'from-emerald-700 to-teal-950' },
  { name: 'Ambient', color: 'from-teal-600 to-cyan-950' },
  { name: 'Jazz', color: 'from-yellow-600 to-amber-950' },
];

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const queryParams = {};
        if (searchTerm.trim()) queryParams.search = searchTerm.trim();
        if (selectedGenre !== 'All') queryParams.genre = selectedGenre;

        const data = await api.getSongs(queryParams);
        const list = Array.isArray(data) ? data : data.songs || [];
        setResults(list);
      } catch (err) {
        console.error('Search query failed:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, selectedGenre]);

  return (
    <div className="min-h-full pb-28 p-6 md:p-8">
      {/* Top Search Bar */}
      <div className="max-w-2xl mb-6">
        <div className="relative flex items-center">
          <SearchIcon className="absolute left-4 w-5 h-5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="What do you want to listen to? (Title, artist, genre...)"
            autoFocus
            className="w-full pl-12 pr-10 py-3.5 rounded-full bg-zinc-800 text-white placeholder-zinc-400 border border-zinc-700/60 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20 text-sm font-medium transition shadow-lg"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Genre Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
        {GENRES.map((g) => (
          <button
            key={g.name}
            onClick={() => setSelectedGenre(g.name)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              selectedGenre === g.name
                ? 'bg-white text-black'
                : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* When Search is Active */}
      {(searchTerm || selectedGenre !== 'All') ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Search Results {searchTerm ? `for "${searchTerm}"` : `in ${selectedGenre}`}
            </h2>
            <span className="text-xs text-zinc-400">{results.length} found</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : results.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 bg-zinc-900/40 rounded-2xl border border-zinc-800/40">
              <Music className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No results found</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Please check the spelling or try searching for another artist or genre.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Result Card & Matches */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {results[0] && (
                  <div className="lg:col-span-1 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/60 flex flex-col justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Top Result</span>
                    <div className="space-y-3">
                      <img
                        src={results[0].coverUrl || results[0].coverObjectPath || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80"}
                        alt={results[0].title}
                        className="w-24 h-24 rounded-lg object-cover shadow-lg"
                      />
                      <h3 className="text-2xl font-extrabold text-white">{results[0].title}</h3>
                      <p className="text-xs text-zinc-400">{results[0].artistName} &bull; <span className="uppercase text-spotify-green">{results[0].genre || 'Track'}</span></p>
                    </div>
                  </div>
                )}

                <div className="lg:col-span-2 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/40">
                  <SongList songs={results} playlist={results} />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Explore All Categories Grid */
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight mb-4">
            Browse All Genres &amp; Moods
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {GENRES.filter(g => g.name !== 'All').map((genre) => (
              <div
                key={genre.name}
                onClick={() => setSelectedGenre(genre.name)}
                className={`relative aspect-square p-4 rounded-xl bg-gradient-to-br ${genre.color} cursor-pointer overflow-hidden shadow-lg hover:scale-105 transition-transform duration-200`}
              >
                <h3 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
                  {genre.name}
                </h3>
                <Radio className="absolute -bottom-2 -right-2 w-16 h-16 text-white/20 transform rotate-12" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
