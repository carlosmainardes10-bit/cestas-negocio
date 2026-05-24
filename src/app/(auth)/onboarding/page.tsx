'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MessageCircle } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(false)

  function formatWhatsapp(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  async function handleSave() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').update({ whatsapp }).eq('id', user.id)
    }
    router.push('/calculadora')
  }

  function handleSkip() {
    router.push('/calculadora')
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <CardTitle>Quase lá! 🎉</CardTitle>
        <CardDescription>
          Quer receber suporte e novidades direto no seu WhatsApp?
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="space-y-1">
          <Label htmlFor="whatsapp">Seu WhatsApp</Label>
          <Input
            id="whatsapp"
            type="tel"
            placeholder="(11) 99999-9999"
            value={whatsapp}
            onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">Opcional — só usamos para suporte e avisos importantes.</p>
        </div>

        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {loading ? 'Salvando...' : 'Salvar e entrar'}
        </Button>

        <Button variant="ghost" onClick={handleSkip} className="w-full text-muted-foreground">
          Pular por agora
        </Button>
      </CardContent>
    </Card>
  )
}
