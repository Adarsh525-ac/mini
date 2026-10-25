import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Helper to get authorization header with Firebase ID token
 */
const getAuthHeaders = async (isFormData = false) => {
  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Check if local demo user is set in localStorage
      const demoUser = localStorage.getItem('cloudtune_demo_user');
      if (demoUser) {
        const parsed = JSON.parse(demoUser);
        headers['Authorization'] = `Bearer demo-token-${parsed.uid}`;
        headers['X-Demo-User'] = JSON.stringify(parsed);
      }
    }
  } catch (error) {
    console.warn('Could not get auth token, continuing as guest:', error);
  }

  return headers;
};

/**
 * Base fetch wrapper with error handling
 */
const request = async (endpoint, options = {}) => {
  const isFormData = options.body instanceof FormData;
  const headers = await getAuthHeaders(isFormData);

  const config = {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: `Request failed with status ${response.status}` };
    }
    const error = new Error(errorData.error || errorData.message || 'API request failed');
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return response.json();
};

export const api = {
  // System Health
  getHealth: () => request('/health'),

  // Songs
  getSongs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('q', params.search);
    if (params.genre) query.append('genre', params.genre);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const queryString = query.toString();
    return request(`/songs${queryString ? `?${queryString}` : ''}`);
  },

  getSongById: (id) => request(`/songs/${id}`),

  getSongStreamUrl: (id) => request(`/songs/${id}/stream`),

  // Artists & Albums
  getArtists: () => request('/artists'),
  getAlbums: () => request('/albums'),

  // Playlists
  getPlaylists: () => request('/playlists'),
  getPlaylistById: (id) => request(`/playlists/${id}`),
  createPlaylist: (name) => request('/playlists', {
    method: 'POST',
    body: JSON.stringify({ name })
  }),
  updatePlaylist: (id, name) => request(`/playlists/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name })
  }),
  deletePlaylist: (id) => request(`/playlists/${id}`, {
    method: 'DELETE'
  }),
  addSongToPlaylist: (playlistId, songId) => request(`/playlists/${playlistId}/songs`, {
    method: 'POST',
    body: JSON.stringify({ songId })
  }),
  removeSongFromPlaylist: (playlistId, songId) => request(`/playlists/${playlistId}/songs/${songId}`, {
    method: 'DELETE'
  }),

  // Likes
  getUserLikes: () => request('/users/me/likes'),
  likeSong: (songId) => request(`/songs/${songId}/like`, { method: 'POST' }),
  unlikeSong: (songId) => request(`/songs/${songId}/like`, { method: 'DELETE' }),

  // Listening History
  getHistory: () => request('/users/me/history'),
  recordHistory: (songId) => request('/users/me/history', {
    method: 'POST',
    body: JSON.stringify({ songId })
  }),

  // User Profile
  getCurrentUser: () => request('/users/me'),

  // Admin APIs
  adminAddSong: (formData) => request('/admin/songs', {
    method: 'POST',
    body: formData
  }),
  adminUpdateSong: (id, data) => request(`/admin/songs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  adminDeleteSong: (id) => request(`/admin/songs/${id}`, {
    method: 'DELETE'
  }),
  adminGetStats: () => request('/admin/stats'),

  // Media URL resolver
  resolveMediaUrl: (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    if (url.startsWith('/demo-audio')) {
      return url;
    }
    if (url.startsWith('/uploads') || url.startsWith('/api')) {
      const origin = API_BASE_URL.replace(/\/api\/?$/, '');
      return `${origin}${url}`;
    }
    return url;
  }
};

export default api;
