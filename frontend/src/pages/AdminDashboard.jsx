import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UploadCloud, 
  Music, 
  Image, 
  Trash2, 
  Edit3, 
  Plus, 
  Database, 
  Cloud, 
  Users, 
  Disc, 
  HardDrive, 
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Server
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/common/Modal';

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // State
  const [stats, setStats] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form state for new song upload
  const [title, setTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [albumName, setAlbumName] = useState('');
  const [genre, setGenre] = useState('Electronic');
  const [duration, setDuration] = useState('210');
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit song state
  const [editingSong, setEditingSong] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editAlbum, setEditAlbum] = useState('');
  const [editGenre, setEditGenre] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, songsRes] = await Promise.all([
        api.adminGetStats().catch(() => ({ totalSongs: 0, totalUsers: 1, storageMode: 'Local / Cloud Hybrid' })),
        api.getSongs({ limit: 100 })
      ]);
      setStats(statsRes);
      setSongs(Array.isArray(songsRes) ? songsRes : songsRes.songs || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch admin data. Check permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      // If not logged in as admin, show warning / redirect
      return;
    }
    loadData();
  }, [isAdmin]);

  const handleAddSong = async (e) => {
    e.preventDefault();
    if (!title || !artistName) {
      alert('Title and Artist are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMsg(null);

      const formData = new FormData();
      formData.append('title', title);
      formData.append('artistName', artistName);
      formData.append('albumName', albumName || 'Single');
      formData.append('genre', genre);
      formData.append('duration', duration);
      if (coverUrl) formData.append('coverUrl', coverUrl);
      if (audioFile) formData.append('audio', audioFile);
      if (coverFile) formData.append('cover', coverFile);

      await api.adminAddSong(formData);

      setSuccessMsg(`Successfully uploaded "${title}" to CloudTune and Cloud Storage!`);
      // Reset form
      setTitle('');
      setArtistName('');
      setAlbumName('');
      setAudioFile(null);
      setCoverFile(null);
      setCoverUrl('');

      // Reload song table
      await loadData();
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSong = async (id, songTitle) => {
    if (!window.confirm(`Permanently delete "${songTitle}" from database and Cloud Storage?`)) return;

    try {
      await api.adminDeleteSong(id);
      setSongs(prev => prev.filter(s => s.id !== id));
      setSuccessMsg(`Deleted track "${songTitle}" successfully.`);
    } catch (err) {
      alert(`Could not delete song: ${err.message}`);
    }
  };

  const handleOpenEdit = (song) => {
    setEditingSong(song);
    setEditTitle(song.title);
    setEditArtist(song.artistName || '');
    setEditAlbum(song.albumName || '');
    setEditGenre(song.genre || 'Electronic');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSong) return;

    try {
      await api.adminUpdateSong(editingSong.id, {
        title: editTitle,
        artistName: editArtist,
        albumName: editAlbum,
        genre: editGenre
      });

      setSongs(prev => prev.map(s => s.id === editingSong.id ? {
        ...s,
        title: editTitle,
        artistName: editArtist,
        albumName: editAlbum,
        genre: editGenre
      } : s));

      setEditingSong(null);
      setSuccessMsg(`Updated metadata for "${editTitle}".`);
    } catch (err) {
      alert(`Failed to update song: ${err.message}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-full pb-28 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Administrator Access Required</h2>
        <p className="text-sm text-zinc-400 mt-2 max-w-md mb-6">
          This dashboard requires server-side admin claims verified through Firebase Authentication &amp; Firestore.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2.5 rounded-full bg-amber-400 text-black font-bold text-xs uppercase tracking-wider hover:bg-amber-300 transition"
        >
          Log in with Admin Account
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-28 p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-amber-400" />
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Console</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Catalogue Management, Google Cloud Storage Media Pipeline, and System Diagnostics
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-xs text-red-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Cloud Architecture Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-spotify-green/10 text-spotify-green flex items-center justify-center">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">Total Songs</p>
            <h3 className="text-2xl font-bold text-white">{songs.length}</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">Cloud Run Service</p>
            <h3 className="text-sm font-bold text-emerald-400">ACTIVE (Scales 0-N)</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">Firestore Engine</p>
            <h3 className="text-sm font-bold text-white">NoSQL Connected</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">Media Storage</p>
            <h3 className="text-sm font-bold text-white">Cloud Storage Bucket</h3>
          </div>
        </div>
      </div>

      {/* Microservices Topology & Database-per-Service Monitor */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-spotify-green" />
            <h2 className="text-base font-bold text-white tracking-tight">Microservices Architecture & Isolated Databases</h2>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5 self-start">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Database-per-Service Pattern Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {(stats?.microservices || [
            { name: 'API Gateway', port: 5000, role: 'Edge Router & Proxy' },
            { name: 'Catalog Service', port: 5001, role: 'Songs & Artists DB' },
            { name: 'Playlist Service', port: 5002, role: 'Playlists DB' },
            { name: 'User Service', port: 5003, role: 'Users & Likes DB' },
            { name: 'Admin Service', port: 5004, role: 'Audit Logs DB' }
          ]).map((ms, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{ms.name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">Port: {ms.port}</p>
              <p className="text-[10px] text-zinc-500 truncate">{ms.role || 'Microservice'}</p>
              <div className="pt-1 border-t border-zinc-700/40 flex items-center justify-between text-[10px]">
                <span className="text-zinc-400">Isolated DB:</span>
                <span className="text-spotify-green font-semibold">Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Song Form */}
      <div className="p-6 md:p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl">
        <h2 className="text-xl font-bold text-white tracking-tight mb-2 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-spotify-green" />
          <span>Upload New Track to Cloud Storage</span>
        </h2>
        <p className="text-xs text-zinc-400 mb-6">
          Upload MP3/FLAC audio files and album artwork. Files are saved to Google Cloud Storage and metadata is committed to Firestore.
        </p>

        <form onSubmit={handleAddSong} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Song Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Midnight Groove, Cloud Nine"
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-800 text-white placeholder-zinc-500 border border-zinc-700 focus:border-spotify-green focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Artist Name *</label>
              <input
                type="text"
                required
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="e.g., Cloud Collective, DJ Horizon"
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-800 text-white placeholder-zinc-500 border border-zinc-700 focus:border-spotify-green focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Album Name</label>
              <input
                type="text"
                value={albumName}
                onChange={(e) => setAlbumName(e.target.value)}
                placeholder="e.g., Cloud Horizon Vol. 1"
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-800 text-white placeholder-zinc-500 border border-zinc-700 focus:border-spotify-green focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Genre</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-800 text-white border border-zinc-700 focus:border-spotify-green focus:outline-none text-xs"
              >
                <option value="Electronic">Electronic</option>
                <option value="Pop">Pop</option>
                <option value="Rock">Rock</option>
                <option value="Lofi">Lofi</option>
                <option value="Hip Hop">Hip Hop</option>
                <option value="Classical">Classical</option>
                <option value="Ambient">Ambient</option>
                <option value="Jazz">Jazz</option>
              </select>
            </div>
          </div>

          {/* Media Files Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Audio File */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-dashed border-zinc-700 flex flex-col items-center justify-center text-center">
              <Music className="w-8 h-8 text-spotify-green mb-2" />
              <p className="text-xs font-semibold text-white mb-1">Audio File (MP3, WAV, FLAC)</p>
              <p className="text-[11px] text-zinc-500 mb-3">Upload media object to GCS Bucket</p>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files[0])}
                className="text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer"
              />
              {audioFile && (
                <span className="text-[11px] text-spotify-green mt-2 font-mono truncate max-w-xs">
                  Selected: {audioFile.name} ({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              )}
            </div>

            {/* Cover Artwork */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-dashed border-zinc-700 flex flex-col items-center justify-center text-center">
              <Image className="w-8 h-8 text-sky-400 mb-2" />
              <p className="text-xs font-semibold text-white mb-1">Album Cover Artwork (JPEG, PNG, WebP)</p>
              <p className="text-[11px] text-zinc-500 mb-3">Upload cover image or provide image URL below</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files[0])}
                className="text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer"
              />
              <div className="w-full mt-3">
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="Or paste image URL (Unsplash / CDN)..."
                  className="w-full px-3 py-1.5 rounded bg-zinc-800 text-white placeholder-zinc-500 border border-zinc-700 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black font-bold text-xs uppercase tracking-wider transition shadow-lg hover:scale-105 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Uploading to Google Cloud...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Publish Song to CloudTune</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Song Catalogue Table */}
      <div className="p-6 md:p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl">
        <h2 className="text-xl font-bold text-white tracking-tight mb-4 flex items-center gap-2">
          <Disc className="w-5 h-5 text-spotify-green" />
          <span>Active Catalogue Management ({songs.length} tracks)</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 px-3">Cover</th>
                <th className="pb-3 px-3">Title</th>
                <th className="pb-3 px-3">Artist</th>
                <th className="pb-3 px-3">Album</th>
                <th className="pb-3 px-3">Genre</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {songs.map((song) => (
                <tr key={song.id} className="hover:bg-zinc-800/40 transition">
                  <td className="py-2.5 px-3">
                    <img
                      src={api.resolveMediaUrl(song.coverUrl || song.coverObjectPath) || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=60&auto=format&fit=crop&q=80"}
                      alt={song.title}
                      className="w-9 h-9 rounded object-cover shadow"
                    />
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-white">{song.title}</td>
                  <td className="py-2.5 px-3 text-zinc-300">{song.artistName}</td>
                  <td className="py-2.5 px-3 text-zinc-400">{song.albumName || 'Single'}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] uppercase font-mono text-zinc-300 border border-zinc-700">
                      {song.genre || 'Electronic'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(song)}
                        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                        title="Edit metadata"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSong(song.id, song.title)}
                        className="p-1.5 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition"
                        title="Delete song"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Metadata Modal */}
      <Modal
        isOpen={Boolean(editingSong)}
        onClose={() => setEditingSong(null)}
        title="Edit Song Metadata"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Title</label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 rounded bg-zinc-800 text-white border border-zinc-700 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Artist</label>
            <input
              type="text"
              required
              value={editArtist}
              onChange={(e) => setEditArtist(e.target.value)}
              className="w-full px-3 py-2 rounded bg-zinc-800 text-white border border-zinc-700 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Album</label>
            <input
              type="text"
              value={editAlbum}
              onChange={(e) => setEditAlbum(e.target.value)}
              className="w-full px-3 py-2 rounded bg-zinc-800 text-white border border-zinc-700 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Genre</label>
            <input
              type="text"
              value={editGenre}
              onChange={(e) => setEditGenre(e.target.value)}
              className="w-full px-3 py-2 rounded bg-zinc-800 text-white border border-zinc-700 text-xs"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditingSong(null)}
              className="px-4 py-2 rounded text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-spotify-green text-black font-semibold text-xs hover:bg-spotify-green-hover"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
