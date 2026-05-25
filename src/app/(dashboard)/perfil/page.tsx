'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Camera, Crown, Trash2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

type Profile = {
  name: string
  business_name: string | null
  whatsapp: string | null
  avatar_url: string | null
  stripe_subscription_id: string | null
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // business info form
  const [businessName, setBusinessName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [savingInfo, setSavingInfo] = useState(false)

  // password form
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // avatar
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('users')
        .select('name, business_name, whatsapp, avatar_url, stripe_subscription_id')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setProfile(data as Profile)
            setBusinessName(data.business_name ?? '')
            setWhatsapp(data.whatsapp ?? '')
          }
          setLoading(false)
        })
    })
  }, [])

  function formatWhatsapp(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  async function handleSaveInfo() {
    setSavingInfo(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from('users')
      .update({ business_name: businessName || null, whatsapp: whatsapp || null })
      .eq('id', user.id)
    if (error) toast.error('Erro ao salvar')
    else { toast.success('Informações salvas!'); setProfile(p => p ? { ...p, business_name: businessName || null, whatsapp: whatsapp || null } : p) }
    setSavingInfo(false)
  }

  async function handleChangePassword() {
    if (newPassword.length < 6) { toast.error('A senha precisa ter pelo menos 6 caracteres'); return }
    if (newPassword !== confirmPassword) { toast.error('As senhas não coincidem'); return }
    setSavingPassword(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) toast.error(error.message)
    else { toast.success('Senha alterada com sucesso!'); setNewPassword(''); setConfirmPassword('') }
    setSavingPassword(false)
  }

  async function handleAvatarUpload(file: File) {
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error('Formato inválido — use JPG ou PNG')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Sua imagem está muito pesada — reduz para menos de 2MB e tenta de novo')
      return
    }
    setUploadingAvatar(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/profile/avatar', { method: 'POST', body: form })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error); setUploadingAvatar(false); return }
    setProfile(p => p ? { ...p, avatar_url: json.url } : p)
    toast.success('Foto atualizada!')
    setUploadingAvatar(false)
  }

  async function handleRemoveAvatar() {
    setUploadingAvatar(true)
    const res = await fetch('/api/profile/avatar', { method: 'DELETE' })
    if (!res.ok) { toast.error('Erro ao remover foto'); setUploadingAvatar(false); return }
    setProfile(p => p ? { ...p, avatar_url: null } : p)
    toast.success('Foto removida')
    setUploadingAvatar(false)
  }

  if (loading) return <p className="text-muted-foreground text-sm p-8">Carregando...</p>

  if (!profile?.stripe_subscription_id) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <Crown className="h-12 w-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Recurso exclusivo para assinantes</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Assine um plano para personalizar seu perfil e logo do negócio.
        </p>
        <Button asChild className="bg-amber-600 hover:bg-amber-700">
          <Link href="/assinatura">Ver planos</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Perfil</h1>
        <p className="text-muted-foreground mt-1">Personalize seu negócio no app.</p>
      </div>

      {/* Avatar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Foto / Logo do negócio</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-5">
            <div className="relative">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Logo"
                  className="w-20 h-20 rounded-xl object-cover border"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-amber-100 border flex items-center justify-center text-amber-400">
                  <Camera className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={uploadingAvatar}
                onClick={() => fileRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-2" />
                {uploadingAvatar ? 'Enviando...' : profile.avatar_url ? 'Trocar foto' : 'Adicionar foto'}
              </Button>
              {profile.avatar_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={uploadingAvatar}
                  onClick={handleRemoveAvatar}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              )}
            </div>
          </div>
          <div className="rounded-lg bg-muted px-4 py-3 text-xs text-muted-foreground space-y-1">
            <p>• Tamanho ideal: <strong>500×500px</strong> (quadrado)</p>
            <p>• Formatos aceitos: <strong>JPG ou PNG</strong></p>
            <p>• Tamanho máximo: <strong>2MB</strong></p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleAvatarUpload(file)
              e.target.value = ''
            }}
          />
        </CardContent>
      </Card>

      {/* Business info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações do negócio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Nome do negócio</Label>
            <Input
              placeholder="Ex: Cestas da Maria"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>WhatsApp</Label>
            <Input
              type="tel"
              placeholder="(11) 99999-9999"
              value={whatsapp}
              onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))}
            />
          </div>
          <Button onClick={handleSaveInfo} disabled={savingInfo} className="bg-amber-600 hover:bg-amber-700">
            {savingInfo ? 'Salvando...' : 'Salvar informações'}
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trocar senha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Nova senha</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Confirmar nova senha</Label>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Repita a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button onClick={handleChangePassword} disabled={savingPassword} variant="outline">
            {savingPassword ? 'Alterando...' : 'Alterar senha'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
