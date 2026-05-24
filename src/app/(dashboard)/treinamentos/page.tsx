'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Lock, ChevronDown, ChevronUp, FileText, Plus,
  Edit2, Trash2, ArrowUp, ArrowDown, Upload, X, Check, GraduationCap,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

type Material = {
  id: string
  lesson_id: string
  type: 'image' | 'pdf'
  storage_path: string
  name: string
  position: number
}

type Lesson = {
  id: string
  position: number
  title: string
  description: string | null
  youtube_url: string | null
  is_free: boolean
  created_at: string
  materials: Material[]
}

type Profile = { plan: string; stripe_subscription_id: string | null; created_at: string }

function storageUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/training/${path}`
}

function youtubeEmbed(url: string): string | null {
  const watchMatch = url.match(/[?&]v=([^&]+)/)
  const shortMatch = url.match(/youtu\.be\/([^?/]+)/)
  const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/)
  const id = watchMatch?.[1] ?? shortMatch?.[1] ?? embedMatch?.[1] ?? null
  return id ? `https://www.youtube.com/embed/${id}` : null
}

function canUsePremium(profile: Profile): boolean {
  if (profile.plan === 'premium' && profile.stripe_subscription_id) return true
  const diffMs = Date.now() - new Date(profile.created_at).getTime()
  if (!profile.stripe_subscription_id && diffMs < 7 * 24 * 60 * 60 * 1000) return true
  return false
}

type LessonFormState = {
  title: string
  description: string
  youtube_url: string
  is_free: boolean
}

const emptyForm: LessonFormState = { title: '', description: '', youtube_url: '', is_free: false }

export default function TreinamentosPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<LessonFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploadingTo, setUploadingTo] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadLessonId = useRef<string>('')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const [profileRes, lessonsRes, materialsRes, userRes] = await Promise.all([
      supabase.from('users').select('plan, stripe_subscription_id, created_at').single(),
      supabase.from('training_lessons').select('*').order('position'),
      supabase.from('training_materials').select('*').order('position'),
      supabase.auth.getUser(),
    ])

    if (profileRes.data) setIsPremium(canUsePremium(profileRes.data as Profile))
    if (userRes.data.user?.email === ADMIN_EMAIL) setIsAdmin(true)

    const mats = (materialsRes.data ?? []) as Material[]
    const combined = ((lessonsRes.data ?? []) as Omit<Lesson, 'materials'>[]).map((l) => ({
      ...l,
      materials: mats.filter((m) => m.lesson_id === l.id).sort((a, b) => a.position - b.position),
    }))
    setLessons(combined)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveLesson() {
    if (!form.title.trim()) { toast.error('Título obrigatório'); return }
    setSaving(true)

    const isNew = editingId === 'new'
    const url = '/api/treinamentos/lesson'
    const body = isNew
      ? { ...form, position: lessons.length }
      : { id: editingId, ...form }

    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setSaving(false)
    if (!res.ok) { toast.error('Erro ao salvar aula'); return }
    toast.success(isNew ? 'Aula criada!' : 'Aula atualizada!')
    setEditingId(null)
    setForm(emptyForm)
    load()
  }

  async function deleteLesson(id: string) {
    if (!confirm('Excluir esta aula e todos os seus materiais?')) return
    const res = await fetch('/api/treinamentos/lesson', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) { toast.error('Erro ao excluir'); return }
    toast.success('Aula excluída')
    load()
  }

  async function moveLesson(id: string, dir: 'up' | 'down') {
    const idx = lessons.findIndex((l) => l.id === id)
    const swap = dir === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= lessons.length) return

    const updated = [...lessons]
    const posA = updated[idx].position
    const posB = updated[swap].position

    await Promise.all([
      fetch('/api/treinamentos/lesson', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: updated[idx].id, position: posB }),
      }),
      fetch('/api/treinamentos/lesson', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: updated[swap].id, position: posA }),
      }),
    ])
    load()
  }

  function startEdit(lesson: Lesson) {
    setEditingId(lesson.id)
    setForm({
      title: lesson.title,
      description: lesson.description ?? '',
      youtube_url: lesson.youtube_url ?? '',
      is_free: lesson.is_free,
    })
    setExpanded(lesson.id)
  }

  function startNew() {
    setEditingId('new')
    setForm(emptyForm)
  }

  function triggerUpload(lessonId: string) {
    uploadLessonId.current = lessonId
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const lesson_id = uploadLessonId.current
    const type = file.type.startsWith('image/') ? 'image' : 'pdf'
    const lesson = lessons.find((l) => l.id === lesson_id)
    const position = (lesson?.materials.length ?? 0)

    setUploadingTo(lesson_id)
    const fd = new FormData()
    fd.append('lesson_id', lesson_id)
    fd.append('name', file.name.replace(/\.[^.]+$/, ''))
    fd.append('type', type)
    fd.append('position', String(position))
    fd.append('file', file)

    const res = await fetch('/api/treinamentos/material', { method: 'POST', body: fd })
    setUploadingTo(null)
    e.target.value = ''

    if (!res.ok) { toast.error('Erro ao enviar arquivo'); return }
    toast.success('Material adicionado!')
    load()
  }

  async function deleteMaterial(id: string, storage_path: string) {
    if (!confirm('Excluir este material?')) return
    const res = await fetch('/api/treinamentos/material', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, storage_path }),
    })
    if (!res.ok) { toast.error('Erro ao excluir material'); return }
    toast.success('Material removido')
    load()
  }

  const canView = isPremium || isAdmin

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-amber-700" />
            Treinamentos
          </h1>
          <p className="text-muted-foreground">Aprenda a montar e vender cestas com sucesso</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {editMode && (
              <Button size="sm" onClick={startNew} className="gap-1">
                <Plus className="h-4 w-4" /> Nova Aula
              </Button>
            )}
            <Button
              size="sm"
              variant={editMode ? 'default' : 'outline'}
              onClick={() => { setEditMode(!editMode); setEditingId(null) }}
              className="gap-1"
            >
              <Edit2 className="h-4 w-4" />
              {editMode ? 'Pronto' : 'Editar'}
            </Button>
          </div>
        )}
      </div>

      {/* Hidden file input for material upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* New lesson form */}
      {editingId === 'new' && (
        <Card className="mb-4 border-amber-200">
          <CardContent className="pt-4 space-y-3">
            <p className="font-medium text-sm">Nova aula</p>
            <LessonForm form={form} onChange={setForm} />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                <X className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={saveLesson} disabled={saving}>
                <Check className="h-4 w-4 mr-1" />{saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : lessons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {isAdmin ? 'Nenhuma aula ainda. Clique em "Editar" para adicionar.' : 'Nenhuma aula disponível ainda.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson, idx) => {
            const isLocked = !lesson.is_free && !canView
            const isExpanded = expanded === lesson.id
            const isEditing = editingId === lesson.id
            const embedUrl = lesson.youtube_url ? youtubeEmbed(lesson.youtube_url) : null

            return (
              <Card key={lesson.id} className={isLocked ? 'opacity-75' : ''}>
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {/* Position number */}
                    <span className="text-sm font-bold text-muted-foreground w-6 text-center shrink-0">
                      {idx + 1}
                    </span>

                    {/* Title + badges */}
                    <button
                      className="flex-1 text-left flex items-center gap-2 min-w-0"
                      onClick={() => !isLocked && setExpanded(isExpanded ? null : lesson.id)}
                    >
                      <span className={`font-medium text-sm truncate ${isLocked ? 'text-muted-foreground' : ''}`}>
                        {lesson.title}
                      </span>
                      {lesson.is_free && (
                        <Badge variant="outline" className="text-xs text-green-700 border-green-300 shrink-0">
                          Grátis
                        </Badge>
                      )}
                      {isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                    </button>

                    {/* Admin controls */}
                    {editMode && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => moveLesson(lesson.id, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => moveLesson(lesson.id, 'down')}
                          disabled={idx === lessons.length - 1}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => isEditing ? setEditingId(null) : startEdit(lesson)}
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteLesson(lesson.id)}
                          className="p-1 text-muted-foreground hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Expand chevron (non-locked) */}
                    {!isLocked && (
                      <button onClick={() => setExpanded(isExpanded ? null : lesson.id)}>
                        {isExpanded
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        }
                      </button>
                    )}
                  </div>
                </CardHeader>

                {/* Locked state CTA */}
                {isLocked && (
                  <CardContent className="pt-0 pb-4 px-4">
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                      <Lock className="h-4 w-4 text-amber-700 shrink-0" />
                      <p className="text-sm text-amber-800 flex-1">
                        Conteúdo exclusivo para assinantes Premium.
                      </p>
                      <Link href="/assinatura">
                        <Button size="sm" className="shrink-0 text-xs h-7">Assinar</Button>
                      </Link>
                    </div>
                  </CardContent>
                )}

                {/* Inline edit form */}
                {isEditing && (
                  <CardContent className="pt-0 pb-4 px-4">
                    <div className="border rounded-lg p-3 bg-gray-50 space-y-3">
                      <LessonForm form={form} onChange={setForm} />
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={saveLesson} disabled={saving}>
                          <Check className="h-4 w-4 mr-1" />{saving ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}

                {/* Expanded content */}
                {isExpanded && !isLocked && (
                  <CardContent className="pt-0 pb-4 px-4 space-y-4">
                    {lesson.description && (
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{lesson.description}</p>
                    )}

                    {embedUrl && (
                      <div className="aspect-video rounded-lg overflow-hidden bg-black">
                        <iframe
                          src={embedUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}

                    {/* Images */}
                    {lesson.materials.filter((m) => m.type === 'image').length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {lesson.materials
                          .filter((m) => m.type === 'image')
                          .map((m) => (
                            <div key={m.id} className="relative group">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={storageUrl(m.storage_path)}
                                alt={m.name}
                                className="w-full aspect-video object-cover rounded-lg"
                              />
                              <p className="text-xs text-muted-foreground mt-1 truncate">{m.name}</p>
                              {editMode && (
                                <button
                                  onClick={() => deleteMaterial(m.id, m.storage_path)}
                                  className="absolute top-1 right-1 bg-white/80 rounded p-0.5 opacity-0 group-hover:opacity-100 text-red-600 hover:bg-white"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                      </div>
                    )}

                    {/* PDFs */}
                    {lesson.materials.filter((m) => m.type === 'pdf').length > 0 && (
                      <div className="space-y-1.5">
                        {lesson.materials
                          .filter((m) => m.type === 'pdf')
                          .map((m) => (
                            <div key={m.id} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="h-4 w-4 text-red-500 shrink-0" />
                                <span className="text-sm truncate">{m.name}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <a
                                  href={storageUrl(m.storage_path)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Abrir
                                </a>
                                {editMode && (
                                  <button
                                    onClick={() => deleteMaterial(m.id, m.storage_path)}
                                    className="p-1 text-muted-foreground hover:text-red-600"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Admin: add material */}
                    {editMode && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs"
                        disabled={uploadingTo === lesson.id}
                        onClick={() => triggerUpload(lesson.id)}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {uploadingTo === lesson.id ? 'Enviando...' : 'Adicionar imagem / PDF'}
                      </Button>
                    )}

                    {lesson.materials.length === 0 && !embedUrl && !lesson.description && (
                      <p className="text-sm text-muted-foreground">Nenhum material ainda.</p>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function LessonForm({
  form,
  onChange,
}: {
  form: { title: string; description: string; youtube_url: string; is_free: boolean }
  onChange: (f: { title: string; description: string; youtube_url: string; is_free: boolean }) => void
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label className="text-xs">Título</Label>
        <Input
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
          placeholder="Nome da aula"
          className="h-8 text-sm"
        />
      </div>
      <div>
        <Label className="text-xs">Descrição (opcional)</Label>
        <textarea
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="Descrição da aula..."
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
      </div>
      <div>
        <Label className="text-xs">URL do YouTube (opcional)</Label>
        <Input
          value={form.youtube_url}
          onChange={(e) => onChange({ ...form, youtube_url: e.target.value })}
          placeholder="https://youtu.be/..."
          className="h-8 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.is_free}
          onChange={(e) => onChange({ ...form, is_free: e.target.checked })}
          className="rounded"
        />
        <span className="text-xs">Aula gratuita (visível para todos)</span>
      </label>
    </div>
  )
}
