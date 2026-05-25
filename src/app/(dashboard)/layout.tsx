import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/supabase/dal'
import { Sidebar } from '@/components/layout/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await verifySession()
  if (!user) redirect('/login')

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 pt-14 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}
