import type { Metadata } from 'next'
import { AccountScreen } from '@/components/account-screen'

export const metadata: Metadata = { title: 'Profile' }

export default function Page() {
  return <AccountScreen mode="profile" />
}
