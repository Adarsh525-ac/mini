import type { Metadata } from 'next'
import { LibraryScreen } from '@/components/catalogue-screens'

export const metadata: Metadata = { title: 'Your Library' }

export default function Page() {
  return <LibraryScreen />
}
