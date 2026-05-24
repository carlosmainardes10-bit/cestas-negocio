'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Copy, MessageCircle, AtSign, Sparkles, ShoppingBasket } from 'lucide-react'
import Link from 'next/link'
import {
  SCRIPTS,
  OCCASION_LABELS,
  CATEGORY_LABELS,
  type ScriptOccasion,
  type ScriptCategory,
} from '@/lib/scripts-data'

const CATEGORIES: ScriptCategory[] = ['geral', 'romantica', 'premium', 'fitness', 'corporativa', 'economica']
const OCCASIONS: ScriptOccasion[] = ['geral', 'dia_maes', 'dia_namorados', 'natal', 'pascoa', 'aniversario', 'dia_pais']

type Basket = { id: string; name: string; category: string; sale_price: number }

export default function ScriptsPage() {
  const [category, setCategory] = useState<ScriptCategory | 'all'>('all')
  const [occasion, setOccasion] = useState<ScriptOccasion | 'all'>('all')

  // IA state
  const [baskets, setBaskets] = useState<Basket[]>([])
  const [selectedBasket, setSelectedBasket] = useState('')
  const [platform, setPlatform] = useState<'whatsapp' | 'instagram'>('whatsapp')
  const [prompt, setPrompt] = useState('')
  const [generatedScript, setGeneratedScript] = useState('')
  const [generating, setGenerating] = useState(false)
  const [scriptUsage, setScriptUsage] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const [{ data: bData }, { data: uData }] = await Promise.all([
        supabase.from('baskets').select('id, name, category, sale_price').eq('user_id', user.id).order('name'),
        supabase
          .from('ai_usage')
          .select('script_count')
          .eq('user_id', user.id)
          .eq('year_month', new Date().toISOString().slice(0, 7))
          .maybeSingle(),
      ])
      setBaskets(bData ?? [])
      setScriptUsage(uData?.script_count ?? 0)
    })
  }, [])

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Texto copiado!')
  }

  async function handleGenerate() {
    if (!selectedBasket) { toast.error('Selecione uma cesta'); return }
    setGenerating(true)
    setGeneratedScript('')
    try {
      const res = await fetch('/api/ia/gerar-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basketId: selectedBasket, platform, prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGeneratedScript(data.script)
      setScriptUsage(data.usageCount)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar script')
    } finally {
      setGenerating(false)
    }
  }

  const whatsapp = SCRIPTS.filter(
    (s) =>
      s.platform === 'whatsapp' &&
      (category === 'all' || s.category === category) &&
      (occasion === 'all' || s.occasion === occasion)
  )

  const instagram = SCRIPTS.filter(
    (s) =>
      s.platform === 'instagram' &&
      (category === 'all' || s.category === category) &&
      (occasion === 'all' || s.occasion === occasion)
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Scripts de Venda</h1>
        <p className="text-muted-foreground mt-1">Textos prontos para WhatsApp e Instagram. Copie, personalize e envie.</p>
      </div>

      {/* ── IA Generator ───────────────────────────────────────────────── */}
      <Card className="p-5 mb-8 border-amber-200 bg-amber-50/40">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-amber-600" />
          <h2 className="font-semibold text-sm">Gerar script com IA</h2>
          <span className="ml-auto text-xs text-muted-foreground">{scriptUsage}/3 este mês</span>
        </div>

        {baskets.length === 0 ? (
          <div className="flex items-center gap-3 py-2">
            <ShoppingBasket className="h-5 w-5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              Você ainda não tem cestas cadastradas.{' '}
              <Link href="/cestas" className="text-amber-700 underline underline-offset-2">
                Crie uma no Montador
              </Link>{' '}
              para gerar scripts personalizados.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Basket select */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Cesta</label>
              <select
                value={selectedBasket}
                onChange={(e) => setSelectedBasket(e.target.value)}
                className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Selecione uma cesta...</option>
                {baskets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} — R${b.sale_price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {/* Platform */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Plataforma</label>
              <div className="flex gap-2">
                {(['whatsapp', 'instagram'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors ${
                      platform === p
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'border-gray-200 text-muted-foreground hover:border-amber-300'
                    }`}
                  >
                    {p === 'whatsapp' ? <MessageCircle className="h-3.5 w-3.5" /> : <AtSign className="h-3.5 w-3.5" />}
                    {p === 'whatsapp' ? 'WhatsApp' : 'Instagram'}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Instrução adicional{' '}
                <span className="font-normal">(opcional • {300 - prompt.length} caracteres restantes)</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, 300))}
                placeholder="Ex: citar que aceita pagamento no Pix, entrega grátis hoje, promoção especial..."
                rows={2}
                className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating || !selectedBasket || scriptUsage >= 3}
              className="bg-amber-600 hover:bg-amber-700 gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {generating ? 'Gerando...' : scriptUsage >= 3 ? 'Limite atingido' : 'Gerar script'}
            </Button>

            {/* Result */}
            {generatedScript && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Script gerado</p>
                  <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => copy(generatedScript)}>
                    <Copy className="h-3 w-3" />
                    Copiar
                  </Button>
                </div>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-white rounded-md p-4 border">
                  {generatedScript}
                </pre>
              </div>
            )}
          </div>
        )}
      </Card>

      <Separator className="mb-6" />

      {/* ── Static scripts ─────────────────────────────────────────────── */}
      <div className="mb-1">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">Scripts prontos</h2>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Tipo de cesta</p>
          <div className="flex flex-wrap gap-2">
            <FilterBtn active={category === 'all'} onClick={() => setCategory('all')}>Todos</FilterBtn>
            {CATEGORIES.map((c) => (
              <FilterBtn key={c} active={category === c} onClick={() => setCategory(c)}>
                {CATEGORY_LABELS[c]}
              </FilterBtn>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Ocasião</p>
          <div className="flex flex-wrap gap-2">
            <FilterBtn active={occasion === 'all'} onClick={() => setOccasion('all')}>Todas</FilterBtn>
            {OCCASIONS.map((o) => (
              <FilterBtn key={o} active={occasion === o} onClick={() => setOccasion(o)}>
                {OCCASION_LABELS[o]}
              </FilterBtn>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="whatsapp">
        <TabsList className="mb-4">
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp ({whatsapp.length})
          </TabsTrigger>
          <TabsTrigger value="instagram" className="gap-2">
            <AtSign className="h-4 w-4" />
            Instagram ({instagram.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp">
          {whatsapp.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum script encontrado para esse filtro.</p>
          ) : (
            <div className="space-y-4">
              {whatsapp.map((script) => (
                <ScriptCard key={script.id} script={script} onCopy={copy} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="instagram">
          {instagram.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum script encontrado para esse filtro.</p>
          ) : (
            <div className="space-y-4">
              {instagram.map((script) => (
                <ScriptCard key={script.id} script={script} onCopy={copy} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
        active
          ? 'bg-amber-600 text-white border-amber-600'
          : 'border-gray-200 text-muted-foreground hover:border-amber-300'
      }`}
    >
      {children}
    </button>
  )
}

function ScriptCard({
  script,
  onCopy,
}: {
  script: (typeof SCRIPTS)[number]
  onCopy: (text: string) => void
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-medium text-sm">{script.title}</p>
          <div className="flex gap-2 mt-1.5">
            {script.category !== 'geral' && (
              <Badge variant="secondary" className="text-xs">{CATEGORY_LABELS[script.category]}</Badge>
            )}
            {script.occasion !== 'geral' && (
              <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">
                {OCCASION_LABELS[script.occasion]}
              </Badge>
            )}
          </div>
        </div>
        <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={() => onCopy(script.text)}>
          <Copy className="h-3.5 w-3.5" />
          Copiar
        </Button>
      </div>
      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-md p-4 border">
        {script.text}
      </pre>
    </Card>
  )
}
