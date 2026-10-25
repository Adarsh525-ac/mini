import type { Metadata } from 'next'
import { AccountScreen } from '@/components/account-screen'

export const metadata: Metadata = { title: 'Sign in' }

export default function Page() {
  return <AccountScreen mode="login" />
}
