import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'catalog-images'

// Upload photo
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const form = await request.formData()
  const file = form.get('file') as File | null
  const itemId = form.get('item_id') as string | null

  if (!file || !itemId) return NextResponse.json({ error: 'Campos obrigatórios' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${user.id}/${itemId}/${Date.now()}.${ext}`

  const admin = createAdminClient()
  const { error } = await admin.storage.from(BUCKET).upload(path, file)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: publicUrl, path })
}

// Remove photo by storage path
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { path } = await request.json() as { path: string }
  if (!path) return NextResponse.json({ error: 'Path obrigatório' }, { status: 400 })

  // Only allow deleting own files
  if (!path.startsWith(user.id + '/')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { error } = await admin.storage.from(BUCKET).remove([path])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
