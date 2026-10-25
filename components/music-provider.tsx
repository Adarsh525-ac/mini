'use client'

import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import useSWR from 'swr'
import { api, IS_DEMO, type Track, type Queue } from '@/lib/api'

function useMusicState() {
 const audio = useRef<HTMLAudioElement>(null)
 const [current, setCurrent] = useState<Track | null>(null)
 const [playing, setPlaying] = useState(false)
 const [loading, setLoading] = useState(false)
 const [position, setPosition] = useState(0)
 const [volume, setVolume] = useState(0.7)
 const [error, setError] = useState('')
 const [queue, setQueue] = useState<Queue | null>(null)
 const [queueOpen, setQueueOpen] = useState(false)
 const [queueLoading, setQueueLoading] = useState(false)
 const [queueError, setQueueError] = useState('')
 const { data: likes = [], mutate: mutateLikes } = useSWR('likes', api.likes)
 const event = (type: 'play' | 'pause' | 'ended' | 'skip') => { if (current) void api.event({ trackId: current.id, type, position }).catch(() => {}) }
 async function select(track: Track) {
  audio.current?.pause(); setPlaying(false); setPosition(0); setError(''); setCurrent(track)
  if (IS_DEMO) { setError('Demo preview · Audio is not connected'); return }
  setLoading(true)
  try { const full = await api.track(track.id); setCurrent(full); if (!full.audioUrl) throw new Error('Audio is unavailable for this track.'); if (audio.current) { audio.current.src = full.audioUrl; audio.current.volume = volume; await audio.current.play(); await api.event({ trackId: full.id, type: 'play', position: 0 }) } }
  catch (e) { setError(e instanceof Error ? e.message : 'Playback failed. Select the track to retry.') }
  finally { setLoading(false) }
 }
 async function toggle() { if (!current) return; if (!current.audioUrl) { setError('Demo preview · Audio is not connected'); return } if (playing) { audio.current?.pause(); event('pause') } else { try { await audio.current?.play(); event('play') } catch { setError('Playback failed. Select the track to retry.') } } }
 function step(direction: number) { if (!queue?.items.length) return; const index = queue.items.findIndex(i => i.track.id === current?.id); const next = index + direction; if (next >= 0 && next < queue.items.length) { event('skip'); void select(queue.items[next].track) } }
 async function generate(mode: Queue['mode'], playlistId?: string, refresh = false) { setQueueOpen(true); setQueueLoading(true); setQueueError(''); try { setQueue(refresh && queue ? await api.refreshQueue(queue.id, mode, playlistId) : await api.queue(mode, playlistId)) } catch(e) { setQueueError(e instanceof Error ? e.message : 'Unable to load queue') } finally { setQueueLoading(false) } }
 async function like(id: string) { try { await api.like(id, !likes.includes(id)); await mutateLikes() } catch(e) { setError(e instanceof Error ? e.message : 'Unable to save track') } }
 function seek(value: number) { if (audio.current && current?.audioUrl) { audio.current.currentTime = value; setPosition(value) } }
 function changeVolume(value: number) { setVolume(value); if (audio.current) audio.current.volume = value }
 return { audio, current, playing, loading, position, volume, error, queue, queueOpen, queueLoading, queueError, likes, select, toggle, step, generate, like, seek, changeVolume, setQueueOpen, setPlaying, setPosition, setError, event }
}
type MusicState = ReturnType<typeof useMusicState>
const MusicContext = createContext<MusicState | null>(null)
export function MusicProvider({ children }: { children: ReactNode }) {
 const state = useMusicState()
 return <MusicContext.Provider value={state}>{children}<audio ref={state.audio} onPlaying={() => state.setPlaying(true)} onPause={() => state.setPlaying(false)} onTimeUpdate={e => state.setPosition(e.currentTarget.currentTime)} onEnded={() => { state.event('ended'); state.step(1) }} onError={() => { state.setPlaying(false); state.setError('Audio could not be loaded. Select the track to retry.') }} /></MusicContext.Provider>
}
export function useMusic() { const value = useContext(MusicContext); if (!value) throw new Error('MusicProvider is required'); return value }
