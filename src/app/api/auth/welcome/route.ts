import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail, sendNewUserNotificationEmail } from '@/lib/resend'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .single()

    const name = profile?.name ?? user.email?.split('@')[0] ?? 'empreendedora'
    const email = user.email!

    await Promise.all([
      sendWelcomeEmail(email, name),
      sendNewUserNotificationEmail(name, email),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    // Never block signup due to email failure
    console.error('welcome email error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false })
  }
}
