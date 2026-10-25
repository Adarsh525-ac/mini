import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
  const { user } = useAuth();
  const audioRef = useRef(new Audio());
  
  // Player state
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState(null);

  // Queue and playlists
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);

  // User likes cache
  const [likedSongIds, setLikedSongIds] = useState(new Set());

  // Load user likes when user changes
  useEffect(() => {
    const fetchLikes = async () => {
      if (user) {
        try {
          const res = await api.getUserLikes();
          const likes = res.likes || res || [];
          setLikedSongIds(new Set(likes.map(item => item.songId || item.id || item)));
        } catch (err) {
          console.warn('Could not load user likes:', err.message);
        }
      } else {
        setLikedSongIds(new Set());
      }
    };
    fetchLikes();
  }, [user]);

  // Configure Audio Event Listeners
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoadingAudio(false);
    };

    const handleCanPlay = () => {
      setIsLoadingAudio(false);
      setAudioError(null);
    };

    const handleWaiting = () => {
      setIsLoadingAudio(true);
    };

    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        handleNextTrack();
      }
    };

    const handleError = (e) => {
      console.warn('HTML5 Audio error event:', e);
      setIsLoadingAudio(false);
      setIsPlaying(false);
      setAudioError('Failed to load audio stream. Checking alternative source...');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [isRepeat, queueIndex, queue, isShuffle]);

  // Play a specific song with optional queue list
  const playSong = async (song, newQueue = null) => {
    if (!song) return;

    try {
      setIsLoadingAudio(true);
      setAudioError(null);

      // Determine stream URL:
      // 1. Direct audioUrl if song already has one (e.g. demo track)
      // 2. Fetch signed stream URL from backend API /api/songs/:id/stream
      let streamUrl = song.audioUrl;
      if (!streamUrl && song.id) {
        try {
          const streamData = await api.getSongStreamUrl(song.id);
          streamUrl = streamData.streamUrl || streamData.url;
        } catch (streamErr) {
          console.warn('API stream fetch failed, using fallback URL:', streamErr.message);
          streamUrl = song.audioObjectPath ? `/demo-audio/${song.audioObjectPath}` : '/demo-audio/soundhelix-1.mp3';
        }
      }

      if (!streamUrl) {
        // Fallback default legal royalty-free track
        streamUrl = '/demo-audio/soundhelix-1.mp3';
      }

      // If streamUrl is a relative backend endpoint (/api/... or /uploads/...), resolve with backend origin
      if (streamUrl && (streamUrl.startsWith('/api') || streamUrl.startsWith('/uploads'))) {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        if (apiBase.startsWith('http')) {
          const origin = apiBase.replace(/\/api\/?$/, '');
          streamUrl = `${origin}${streamUrl}`;
        }
      }

      const audio = audioRef.current;
      audio.src = streamUrl;
      audio.load();

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }

      setCurrentSong({ ...song, streamUrl });
      setIsPlaying(true);
      setIsLoadingAudio(false);

      // Update queue if provided
      if (newQueue && Array.isArray(newQueue)) {
        setQueue(newQueue);
        const idx = newQueue.findIndex(s => s.id === song.id);
        setQueueIndex(idx >= 0 ? idx : 0);
      } else if (!queue.some(s => s.id === song.id)) {
        setQueue(prev => [...prev, song]);
        setQueueIndex(queue.length);
      }

      // Record listening history in backend if user logged in
      if (user && song.id) {
        api.recordHistory(song.id).catch(() => {});
      }
    } catch (err) {
      console.error('Audio playback error:', err);
      setIsPlaying(false);
      setIsLoadingAudio(false);
      setAudioError('Playback failed. Please try another track.');
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!currentSong) {
      if (queue.length > 0) {
        playSong(queue[0]);
      }
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Audio play error:', err);
      });
    }
  };

  // Next Track
  const handleNextTrack = () => {
    if (queue.length === 0) return;

    let nextIdx = queueIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (nextIdx >= queue.length) {
      nextIdx = 0; // Loop back to start of queue
    }

    setQueueIndex(nextIdx);
    playSong(queue[nextIdx]);
  };

  // Previous Track
  const handlePrevTrack = () => {
    const audio = audioRef.current;
    // If playing for more than 3 seconds, restart current track
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    if (queue.length === 0) return;
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = queue.length - 1;
    }
    setQueueIndex(prevIdx);
    playSong(queue[prevIdx]);
  };

  // Seek
  const seek = (timeInSeconds) => {
    const audio = audioRef.current;
    if (audio && !isNaN(timeInSeconds)) {
      audio.currentTime = timeInSeconds;
      setCurrentTime(timeInSeconds);
    }
  };

  // Volume
  const changeVolume = (newVolume) => {
    const vol = Math.max(0, Math.min(1, newVolume));
    setVolume(vol);
    audioRef.current.volume = vol;
    if (vol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Mute toggle
  const toggleMute = () => {
    const audio = audioRef.current;
    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  // Like / Unlike song
  const toggleLike = async (song) => {
    if (!song || !song.id) return;
    const songId = song.id;
    const isCurrentlyLiked = likedSongIds.has(songId);

    // Optimistic UI update
    setLikedSongIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyLiked) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });

    try {
      if (isCurrentlyLiked) {
        await api.unlikeSong(songId);
      } else {
        await api.likeSong(songId);
      }
    } catch (err) {
      console.warn('Failed to sync like with backend:', err.message);
      // Revert on error
      setLikedSongIds(prev => {
        const next = new Set(prev);
        if (isCurrentlyLiked) next.add(songId);
        else next.delete(songId);
        return next;
      });
    }
  };

  return (
    <PlayerContext.Provider value={{
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
      queueIndex,
      likedSongIds,
      playSong,
      togglePlay,
      nextTrack: handleNextTrack,
      previousTrack: handlePrevTrack,
      seek,
      setVolume: changeVolume,
      toggleMute,
      toggleShuffle: () => setIsShuffle(prev => !prev),
      toggleRepeat: () => setIsRepeat(prev => !prev),
      toggleLike,
      isLiked: (songId) => likedSongIds.has(songId),
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
export default PlayerContext;
