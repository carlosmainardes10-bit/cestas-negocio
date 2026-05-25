import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'avatars'
const MAX_BYTES = 2 * 1024 * 1024 // 2MB

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const form = await request.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })

  const allowed = ['image/jpeg', 'image/png', 'image/jpg']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Formato inválido — use JPG ou PNG' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'Sua imagem está muito pesada — reduz para menos de 2MB e tenta de novo' },
      { status: 400 }
    )
  }

  const ext = file.type === 'image/png' ? 'png' : 'jpg'
  const path = `${user.id}/avatar.${ext}`

  const admin = createAdminClient()

  // Remove old avatar before uploading new one
  await admin.storage.from(BUCKET).remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`])

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path)

  await admin.from('users').update({ avatar_url: publicUrl }).eq('id', user.id)

  return NextResponse.json({ url: publicUrl })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()
  await admin.storage.from(BUCKET).remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`])
  await admin.from('users').update({ avatar_url: null }).eq('id', user.id)

  return NextResponse.json({ ok: true })
}
