import type { Metadata } from 'next'
import { LikedScreen } from '@/components/catalogue-screens'

export const metadata: Metadata = { title: 'Liked Songs' }

export default function Page() {
  return <LikedScreen />
}
