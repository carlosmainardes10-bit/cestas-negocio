import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { canUsePremium } from '@/lib/supabase/dal'

const MONTHLY_LIMIT = 3

export async function POST(req: NextRequest) {
  try {
    const { basketId, platform, prompt } = await req.json()

    if (!basketId || !platform) {
      return NextResponse.json({ error: 'basketId e platform são obrigatórios' }, { status: 400 })
    }
    if (prompt && prompt.length > 300) {
      return NextResponse.json({ error: 'Prompt deve ter no máximo 300 caracteres' }, { status: 400 })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('plan, stripe_subscription_id, created_at')
      .eq('id', user.id)
      .single()

    if (!profile || !canUsePremium(profile)) {
      return NextResponse.json(
        { error: 'Este recurso é exclusivo do Plano Premium. Faça upgrade para continuar.' },
        { status: 403 }
      )
    }

    const yearMonth = new Date().toISOString().slice(0, 7)
    const { data: usageRow } = await supabase
      .from('ai_usage')
      .select('script_count')
      .eq('user_id', user.id)
      .eq('year_month', yearMonth)
      .maybeSingle()

    const currentCount = usageRow?.script_count ?? 0
    if (currentCount >= MONTHLY_LIMIT) {
      const resetDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
        .toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
      return NextResponse.json(
        { error: `Limite de ${MONTHLY_LIMIT} scripts por mês atingido. Renova em ${resetDate}.` },
        { status: 429 }
      )
    }

    // Busca cesta + itens + produtos
    const { data: basket } = await supabase
      .from('baskets')
      .select('name, category, sale_price')
      .eq('id', basketId)
      .eq('user_id', user.id)
      .single()

    if (!basket) return NextResponse.json({ error: 'Cesta não encontrada' }, { status: 404 })

    const { data: rawItems } = await supabase
      .from('basket_items')
      .select('quantity, products(name, unit)')
      .eq('basket_id', basketId)

    type ItemRow = { quantity: number; products: { name: string; unit: string } | null }
    const items = (rawItems ?? []) as ItemRow[]

    const itemLines = items
      .filter((i) => i.products)
      .map((i) => `• ${i.quantity}x ${i.products!.name}`)

    const itemsContext = itemLines.length > 0
      ? itemLines.slice(0, 6).join('\n') + (itemLines.length > 6 ? '\n• e mais...' : '')
      : '(sem itens cadastrados — use produtos típicos para esse tipo de cesta)'

    const platformName = platform === 'whatsapp' ? 'WhatsApp' : 'Instagram'

    const userMessage = `Gere um script de venda para ${platformName}.

CESTA: ${basket.name}
VALOR: R$${basket.sale_price.toFixed(2)}
ITENS PRINCIPAIS:
${itemsContext}

${prompt ? `INSTRUÇÃO DA EMPREENDEDORA: ${prompt}` : ''}

Escreva um texto envolvente e natural para ${platformName}, citando os ingredientes reais da cesta (use alguns e finalize com "e mais!" se houver muitos). Tom brasileiro, feminino, acolhedor.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: platform === 'whatsapp'
        ? `Você escreve scripts de venda para WhatsApp de empreendedoras de cestas de café da manhã no Brasil.
Regras:
- Máximo 250 palavras
- Tom casual, acolhedor, com emojis moderados
- Use *negrito* para destacar o nome da cesta
- Termine com chamada para ação (ex: "Me chama aqui! 😊")
- Cite alguns ingredientes reais, finalize com "e mais!" quando tiver muitos
- Não invente itens que não estão na lista`
        : `Você escreve legendas para Instagram de empreendedoras de cestas de café da manhã no Brasil.
Regras:
- Máximo 200 palavras + hashtags
- Tom inspirador, visual, com emojis
- Cite alguns ingredientes reais, finalize com "e mais!" quando tiver muitos
- Termine com CTA para o direct ou link da bio
- Inclua 8-12 hashtags relevantes no final
- Não invente itens que não estão na lista`,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    await supabase.from('ai_usage').upsert(
      { user_id: user.id, year_month: yearMonth, script_count: currentCount + 1 },
      { onConflict: 'user_id,year_month' }
    )

    return NextResponse.json({
      script: text,
      usageCount: currentCount + 1,
      usageLimit: MONTHLY_LIMIT,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('gerar-script error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
