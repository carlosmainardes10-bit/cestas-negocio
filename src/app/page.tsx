import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/supabase/dal'

export default async function Home() {
  const user = await verifySession()
  if (user) redirect('/calculadora')
  redirect('/login')
}
