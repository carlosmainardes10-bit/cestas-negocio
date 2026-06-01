import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile, error: dbError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (dbError) {
      console.error('[stripe/portal] Erro ao buscar perfil:', dbError)
      return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 })
    }

    if (!profile?.stripe_customer_id) {
      console.error('[stripe/portal] stripe_customer_id não encontrado para user:', user.id)
      return NextResponse.json({ error: 'Sem assinatura ativa' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      console.error('[stripe/portal] NEXT_PUBLIC_APP_URL não definido')
      return NextResponse.json({ error: 'Configuração de URL ausente' }, { status: 500 })
    }

    const returnUrl = `${appUrl}/assinatura`
    console.log('[stripe/portal] Criando sessão | customer:', profile.stripe_customer_id, '| return_url:', returnUrl)

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[stripe/portal] Erro Stripe:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
