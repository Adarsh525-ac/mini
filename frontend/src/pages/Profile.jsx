import React from 'react';
import { 
  User, 
  Mail, 
  Key, 
  ShieldCheck, 
  Cloud, 
  Database, 
  HardDrive, 
  LogOut,
  ExternalLink 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, isAdmin, logout, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-full pb-28 p-6 md:p-10 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl mb-8">
        <img
          src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
          alt="User Profile"
          className="w-24 h-24 rounded-full border-2 border-spotify-green object-cover shadow-lg"
        />

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-bold text-white">{user.displayName || 'CloudTune Listener'}</h1>
            {isAdmin ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                ADMINISTRATOR
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300">
                MEMBER
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400 mt-1">{user.email}</p>
          <p className="text-xs text-zinc-500 font-mono mt-1">UID: {user.uid}</p>
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="px-4 py-2 rounded-full border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-semibold flex items-center gap-2 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Cloud Architecture Details (For MCA Exam & Viva) */}
      <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 mb-8">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-spotify-green" />
          <span>GCP Deployment &amp; Cloud Infrastructure</span>
        </h2>
        <p className="text-xs text-zinc-400 mb-4">
          Detailed metadata for the MCA Cloud Computing project demonstration:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cloud Run */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
              <Cloud className="w-4 h-4 text-sky-400" />
              <span>Google Cloud Run</span>
            </div>
            <p className="text-xs text-zinc-400">
              Serverless container deployment of Node/Express backend API. Auto-scales from 0 to N instances on demand.
            </p>
          </div>

          {/* Cloud Firestore */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
              <Database className="w-4 h-4 text-amber-400" />
              <span>Google Cloud Firestore</span>
            </div>
            <p className="text-xs text-zinc-400">
              Fully managed serverless NoSQL document database storing users, tracks, playlists, and listening history.
            </p>
          </div>

          {/* Cloud Storage */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>Google Cloud Storage</span>
            </div>
            <p className="text-xs text-zinc-400">
              High-throughput object storage for audio files (MP3/FLAC) and high-resolution album art covers.
            </p>
          </div>

          {/* Firebase Authentication */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
              <Key className="w-4 h-4 text-orange-400" />
              <span>Firebase Auth &amp; IAM</span>
            </div>
            <p className="text-xs text-zinc-400">
              JWT identity verification with role-based server-side access control for protected admin endpoints.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
