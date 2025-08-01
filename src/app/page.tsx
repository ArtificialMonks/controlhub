import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'

export default async function Home() {
  const user = await verifySession()

  if (user) {
    redirect('/dashboard')
  } else {
    // Redirect unauthenticated users directly to login
    redirect('/login')
  }
}
