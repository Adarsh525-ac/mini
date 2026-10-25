'use client'
import Link from 'next/link'
import { Heart, Play, ArrowUpRight, Music2, RefreshCw } from 'lucide-react'
import { useMusic } from './music-provider'
import { time, type Track, type Playlist } from '@/lib/api'
import { Button } from '@/components/ui/button'

export function Artwork({ index, className = '' }: { index: number; className?: string }) {
 return <div role="img" aria-label="Original fictional album artwork" className={`artwork ${className}`} style={index === -1 ? { backgroundImage: 'url(/images/afterhours.png)', backgroundSize: 'cover' } : { backgroundImage: 'url(/images/covers.png)', backgroundSize: '300% 200%', backgroundPosition: `${(index % 3) * 50}% ${Math.floor(index / 3) * 100}%` }} />
}
export function SectionTitle({ title, subtitle, href }: { title: string; subtitle?: string; href?: string }) { return <div className="section-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{href && <Link href={href} className="subtle-link">View all <ArrowUpRight size={14}/></Link>}</div> }
export function PlaylistCard({ playlist }: { playlist: Playlist }) { return <Link href={`/playlist/${playlist.id}`} className="playlist-card group"><div className="cover-wrap"><Artwork index={playlist.artwork}/><span className="card-play"><Play size={19} fill="currentColor"/></span><span className="cover-brand">S / SELECTS</span></div><h3>{playlist.name}</h3><p>{playlist.description}</p></Link> }
export function TrackList({ tracks, compact = false }: { tracks: Track[]; compact?: boolean }) {
 const music = useMusic()
 if (!tracks.length) return <Empty title="Nothing here just yet" description="Explore the catalogue and find your next favorite."/>
 return <div className={`track-list ${compact ? 'compact' : ''}`}><div className="track-row table-heading"><span>#</span><span>Title</span><span className="track-album">Album</span><span className="track-genre">Genre</span><span>Time</span><span/></div>{tracks.map((track, i) => <div className={`track-row ${music.current?.id === track.id ? 'selected' : ''}`} key={track.id}><button className="row-number" aria-label={`Select ${track.title}`} onClick={() => music.select(track)}>{music.current?.id === track.id ? <Music2 size={15}/> : <><span>{i + 1}</span><Play size={14}/></>}</button><button className="track-identity" onClick={() => music.select(track)}><Artwork index={track.album.artwork}/><span><strong>{track.title}</strong><small>{track.artist.name}</small></span></button><span className="track-album">{track.album.title}</span><span className="track-genre">{track.genre}</span><span className="track-duration">{time(track.duration)}</span><button className={`icon-button ${music.likes.includes(track.id) ? 'is-liked' : ''}`} aria-label={`${music.likes.includes(track.id) ? 'Unlike' : 'Like'} ${track.title}`} onClick={() => music.like(track.id)}><Heart size={17} fill={music.likes.includes(track.id) ? 'currentColor' : 'none'}/></button></div>)}</div>
}
export function Empty({ title, description }: { title: string; description: string }) { return <div className="empty-state"><Music2 size={30}/><h3>{title}</h3><p>{description}</p><Link href="/search" className="subtle-link">Explore music <ArrowUpRight size={15}/></Link></div> }
export function Loading() { return <div className="loading-state" role="status"><RefreshCw className="animate-spin" size={20}/> Loading your next discovery…</div> }
export function ErrorState({ error, retry }: { error: Error; retry: () => void }) { return <div className="empty-state" role="alert"><h3>Let&apos;s try that again</h3><p>{error.message}</p><Button variant="secondary" onClick={retry}>Retry</Button></div> }
