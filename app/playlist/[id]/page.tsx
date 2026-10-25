import type { Metadata } from 'next'
import { PlaylistScreen } from '@/components/catalogue-screens'

export const metadata: Metadata = { title: 'Playlist' }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PlaylistScreen id={id} />
}
