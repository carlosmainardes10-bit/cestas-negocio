import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Crown, Clock, UserX } from 'lucide-react'

type UserRow = {
  id: string
  name: string
  email: string
  plan: 'basic' | 'premium'
  stripe_subscription_id: string | null
  whatsapp: string | null
  business_name: string | null
  created_at: string
}

function planBadge(user: UserRow) {
  if (user.stripe_subscription_id) {
    return user.plan === 'premium'
      ? <Badge className="bg-amber-600 text-white gap-1"><Crown className="h-3 w-3" />Premium</Badge>
      : <Badge variant="secondary" className="gap-1">Básico</Badge>
  }
  const diffDays = (Date.now() - new Date(user.created_at).getTime()) / 86_400_000
  if (diffDays < 7) {
    return <Badge variant="outline" className="gap-1 text-blue-600 border-blue-200"><Clock className="h-3 w-3" />Trial</Badge>
  }
  return <Badge variant="outline" className="gap-1 text-gray-400"><UserX className="h-3 w-3" />Inativo</Badge>
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    redirect('/calculadora')
  }

  const admin = createAdminClient()
  const { data: users } = await admin
    .from('users')
    .select('id, name, email, plan, stripe_subscription_id, whatsapp, business_name, created_at')
    .order('created_at', { ascending: false })

  const rows = (users ?? []) as UserRow[]

  const total = rows.length
  const active = rows.filter(u => u.stripe_subscription_id).length
  const trial = rows.filter(u => !u.stripe_subscription_id && (Date.now() - new Date(u.created_at).getTime()) < 7 * 86_400_000).length
  const inactive = total - active - trial

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel Admin</h1>
        <p className="text-muted-foreground mt-1">Usuários cadastrados na plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: total, color: 'text-gray-900' },
          { label: 'Assinantes', value: active, color: 'text-amber-700' },
          { label: 'Em trial', value: trial, color: 'text-blue-600' },
          { label: 'Inativos', value: inactive, color: 'text-gray-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border bg-white p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Nome</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">E-mail</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Negócio</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">WhatsApp</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Plano</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u, i) => (
                <tr key={u.id} className={`border-b last:border-0 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.business_name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.whatsapp ?? '—'}</td>
                  <td className="px-4 py-3">{planBadge(u)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmt(u.created_at)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum usuário cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
