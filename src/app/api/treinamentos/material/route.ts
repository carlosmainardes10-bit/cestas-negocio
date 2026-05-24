import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return null
  return user
}

export async function POST(req: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const formData = await req.formData()
  const lesson_id = formData.get('lesson_id') as string
  const name = formData.get('name') as string
  const type = formData.get('type') as 'image' | 'pdf'
  const position = Number(formData.get('position') ?? 0)
  const file = formData.get('file') as File | null

  if (!lesson_id || !file || !name || !type) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'bin'
  const storage_path = `lessons/${lesson_id}/${Date.now()}.${ext}`

  const supabase = createAdminClient()
  const buffer = new Uint8Array(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('training')
    .upload(storage_path, buffer, { contentType: file.type })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data, error } = await supabase
    .from('training_materials')
    .insert({ lesson_id, type, storage_path, name, position })
    .select()
    .single()

  if (error) {
    await supabase.storage.from('training').remove([storage_path])
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id, storage_path } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase.from('training_materials').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (storage_path) {
    await supabase.storage.from('training').remove([storage_path])
  }

  return NextResponse.json({ ok: true })
}
