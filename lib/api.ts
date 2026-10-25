export const BRAND = 'SONORA'
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '')
export const IS_DEMO = !API_BASE_URL
export interface Artist { id: string; name: string }
export interface Album { id: string; title: string; artwork: number }
export interface Track { id: string; title: string; artist: Artist; album: Album; genre: string; duration: number; audioUrl?: string }
export interface User { id: string; name: string; email: string; favoriteGenre?: string }
export interface Playlist { id: string; name: string; description: string; artwork: number; trackIds: string[] }
export interface PlaybackEvent { trackId: string; type: 'play' | 'pause' | 'ended' | 'skip'; position: number }
export interface QueueItem { track: Track; position: number; explanation?: string }
export interface Queue { id: string; items: QueueItem[]; mode: 'normal' | 'smart' }
export class ApiError extends Error { constructor(message: string, public status = 0, public fields?: Record<string, string>) { super(message) } }
// Provisional REST contract: confirm paths, cookie/CSRF policy and JSON envelopes with the Express team before enabling live mode.
export const endpoints = { tracks: '/tracks', playlists: '/playlists', likes: '/me/likes', history: '/me/history', profile: '/me', login: '/auth/login', register: '/auth/register', logout: '/auth/logout', events: '/playback/events', queues: '/queues' }
async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response
  try { response = await fetch(`${API_BASE_URL}${path}`, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) }) }
  catch { throw new ApiError('Cannot reach the music service. Please try again.') }
  const data = response.status === 204 ? undefined : await response.json().catch(() => undefined)
  if (!response.ok) throw new ApiError(response.status === 401 ? 'Please sign in to continue.' : data?.message || 'Something went wrong. Please try again.', response.status, data?.errors)
  return data as T
}
const names = [['Golden Hour', 'Solstice', 'Daydreams', 'Indie Pop'], ['Weightless', 'Luna Bay', 'Soft Focus', 'Ambient'], ['Tides', 'Parallel', 'Underwater', 'Electronic'], ['Bloom', 'Iris Vale', 'In Full Color', 'Alternative'], ['Midnight City Lights', 'Northbound', 'After Dark', 'Electronic'], ['Slow Sunday', 'The Sunday Club', 'Somewhere Quiet', 'Lo-fi'], ['Open Skies', 'Solstice', 'Daydreams', 'Indie Pop'], ['Stay A Little', 'Luna Bay', 'Soft Focus', 'Ambient']]
export const demoTracks: Track[] = names.map(([title, artist, album, genre], i) => ({ id: `track-${i + 1}`, title, artist: { id: artist.toLowerCase().replaceAll(' ', '-'), name: artist }, album: { id: `album-${i % 6}`, title: album, artwork: i % 6 }, genre, duration: [224, 198, 247, 213, 236, 185, 208, 231][i] }))
let demoPlaylists: Playlist[] = [
 { id: 'after-hours', name: 'After Hours', description: 'When the world slows down, turn it up. A little electronic, a little atmospheric, entirely your own.', artwork: -1, trackIds: demoTracks.map(t => t.id) },
 { id: 'daydreams', name: 'Daydreams', description: 'A little sunshine for your headphones.', artwork: 0, trackIds: ['track-1', 'track-7', 'track-4'] },
 { id: 'soft-focus', name: 'Soft Focus', description: 'Clear your head. Find your flow.', artwork: 1, trackIds: ['track-2', 'track-8', 'track-6'] },
 { id: 'deep-current', name: 'Deep Current', description: 'Dive into a different frequency.', artwork: 2, trackIds: ['track-3', 'track-5'] },
 { id: 'in-bloom', name: 'In Bloom', description: 'Fresh sounds, in full color.', artwork: 3, trackIds: ['track-4', 'track-1'] },
 { id: 'night-drive', name: 'Night Drive', description: 'The soundtrack to the long way home.', artwork: 4, trackIds: ['track-5', 'track-3'] },
 { id: 'slow-living', name: 'Slow Living', description: 'Less rush. More rhythm.', artwork: 5, trackIds: ['track-6', 'track-2'] },
]
let liked = ['track-2', 'track-4']
const demo = async <T>(value: T): Promise<T> => { await new Promise(resolve => setTimeout(resolve, 180)); return value }
const authUnavailable = () => Promise.reject<User>(new ApiError('Account actions require your Express backend. Demo mode never creates an account or session.'))
export const api = {
 tracks: (query = '') => IS_DEMO ? demo(demoTracks.filter(t => `${t.title} ${t.artist.name} ${t.genre}`.toLowerCase().includes(query.toLowerCase()))) : request<Track[]>(`${endpoints.tracks}?q=${encodeURIComponent(query)}`),
 track: (id: string) => IS_DEMO ? demo(demoTracks.find(t => t.id === id)!) : request<Track>(`${endpoints.tracks}/${encodeURIComponent(id)}`),
 playlists: () => IS_DEMO ? demo([...demoPlaylists]) : request<Playlist[]>(endpoints.playlists),
 playlist: (id: string) => IS_DEMO ? demo(demoPlaylists.find(p => p.id === id)) : request<Playlist>(`${endpoints.playlists}/${encodeURIComponent(id)}`),
 createPlaylist: (name: string) => { if (!IS_DEMO) return request<Playlist>(endpoints.playlists, 'POST', { name }); const p = { id: crypto.randomUUID(), name, description: 'Your next favorite collection.', artwork: 1, trackIds: [] }; demoPlaylists = [...demoPlaylists, p]; return demo(p) },
 updatePlaylist: (id: string, changes: Partial<Pick<Playlist, 'name' | 'description' | 'trackIds'>>) => { if (!IS_DEMO) return request<Playlist>(`${endpoints.playlists}/${encodeURIComponent(id)}`, 'PATCH', changes); demoPlaylists = demoPlaylists.map(p => p.id === id ? { ...p, ...changes } : p); return demo(demoPlaylists.find(p => p.id === id)!) },
 deletePlaylist: (id: string) => { if (!IS_DEMO) return request<void>(`${endpoints.playlists}/${encodeURIComponent(id)}`, 'DELETE'); demoPlaylists = demoPlaylists.filter(p => p.id !== id); return demo(undefined) },
 likes: () => IS_DEMO ? demo([...liked]) : request<string[]>(endpoints.likes),
 like: (id: string, value: boolean) => { if (!IS_DEMO) return request<void>(`${endpoints.likes}/${encodeURIComponent(id)}`, value ? 'PUT' : 'DELETE'); liked = value ? [...new Set([...liked, id])] : liked.filter(v => v !== id); return demo(undefined) },
 history: () => IS_DEMO ? demo(demoTracks.slice(0, 4)) : request<Track[]>(endpoints.history),
 profile: () => IS_DEMO ? demo<User | null>(null) : request<User>(endpoints.profile),
 updateProfile: (data: Partial<User>) => IS_DEMO ? authUnavailable() : request<User>(endpoints.profile, 'PATCH', data),
 login: (email: string, password: string) => IS_DEMO ? authUnavailable() : request<User>(endpoints.login, 'POST', { email, password }),
 register: (name: string, email: string, password: string) => IS_DEMO ? authUnavailable() : request<User>(endpoints.register, 'POST', { name, email, password }),
 logout: () => IS_DEMO ? demo(undefined) : request<void>(endpoints.logout, 'POST'),
 event: (event: PlaybackEvent) => IS_DEMO ? demo(undefined) : request<void>(endpoints.events, 'POST', event),
 queue: (mode: Queue['mode'], playlistId?: string) => IS_DEMO ? demo<Queue>({ id: 'demo-queue', mode, items: demoTracks.filter(t => !playlistId || demoPlaylists.find(p => p.id === playlistId)?.trackIds.includes(t.id)).map((track, position) => ({ track, position })) }) : request<Queue>(endpoints.queues, 'POST', { mode, playlistId }),
 refreshQueue: (id: string, mode: Queue['mode'], playlistId?: string): Promise<Queue> => IS_DEMO ? api.queue(mode, playlistId) : request<Queue>(`${endpoints.queues}/${encodeURIComponent(id)}/refresh`, 'POST'),
}
export const time = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
