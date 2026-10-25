import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search as SearchIcon, 
  User, 
  LogOut, 
  ShieldCheck, 
  Settings, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Topbar = () => {
  const { user, isAdmin, logout, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSearchPage = location.pathname === '/search';

  // Helper for quick viva demo login switch
  const handleQuickDemoSwitch = async (role) => {
    if (role === 'admin') {
      await login('admin@cloudtune.io', 'admin123');
    } else {
      await login('listener@cloudtune.io', 'listener123');
    }
    setDropdownOpen(false);
  };

  return (
    <header className="h-16 px-6 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between border-b border-zinc-900/50">
      {/* Navigation arrows & Search Bar */}
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => navigate(1)}
            aria-label="Go forward"
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Global Quick Search prompt if not on Search page */}
        {!isSearchPage && (
          <button
            onClick={() => navigate('/search')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 text-xs border border-zinc-800 transition max-w-xs w-full"
          >
            <SearchIcon className="w-3.5 h-3.5" />
            <span>Search songs, artists, genres...</span>
          </button>
        )}
      </div>

      {/* Right controls: Demo Switch, Auth Buttons, Profile Menu */}
      <div className="flex items-center gap-3">
        {/* Viva Fast Demo Switch button */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
          <Sparkles className="w-3.5 h-3.5 text-spotify-green" />
          <span>Demo Role:</span>
          <button
            onClick={() => handleQuickDemoSwitch('user')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
              user && !isAdmin ? 'bg-zinc-700 text-white' : 'hover:text-white'
            }`}
          >
            User
          </button>
          <span className="text-zinc-600">|</span>
          <button
            onClick={() => handleQuickDemoSwitch('admin')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
              isAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'hover:text-amber-300'
            }`}
          >
            Admin
          </button>
        </div>

        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 p-1 pr-3 rounded-full bg-black/80 hover:bg-zinc-800/80 border border-zinc-800 text-sm font-semibold transition"
            >
              <img
                src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'user'}`}
                alt="Avatar"
                className="w-7 h-7 rounded-full bg-zinc-700 object-cover"
              />
              <span className="max-w-[120px] truncate text-xs text-white">
                {user.displayName || user.email?.split('@')[0] || 'User'}
              </span>
              {isAdmin && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded font-bold">
                  ADMIN
                </span>
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl py-1 z-50 text-xs animate-fade-in">
                <div className="px-3 py-2 border-b border-zinc-800">
                  <p className="text-white font-semibold truncate">{user.displayName || 'User'}</p>
                  <p className="text-zinc-500 truncate text-[11px]">{user.email}</p>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
                >
                  <User className="w-4 h-4" />
                  <span>Profile & GCP Info</span>
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-amber-300 hover:bg-amber-500/10 transition"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}

                <div className="border-t border-zinc-800 my-1" />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 transition text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="text-zinc-400 hover:text-white text-xs font-semibold px-3 py-1.5 transition"
            >
              Sign up
            </Link>
            <Link
              to="/login"
              className="bg-white hover:bg-zinc-200 text-black text-xs font-bold px-4 py-2 rounded-full transition hover:scale-105"
            >
              Log in
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
