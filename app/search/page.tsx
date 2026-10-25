import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SearchScreen } from '@/components/catalogue-screens'
import { Loading } from '@/components/music-ui'

export const metadata: Metadata = { title: 'Search' }

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SearchScreen />
    </Suspense>
  )
}
