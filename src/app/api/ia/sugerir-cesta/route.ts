import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { canUsePremium } from '@/lib/supabase/dal'
import type { Product } from '@/types'

const MONTHLY_LIMIT = 3

const CATEGORY_NAMES: Record<string, string> = {
  romantica: 'Romântica (para casais, datas especiais — chocolates, flores, itens delicados)',
  premium: 'Premium (produtos gourmet e diferenciados — croissant, queijos finos, frutas exóticas)',
  fitness: 'Fitness (saudável e natural — granola, frutas, iogurte, castanhas, pão integral)',
  corporativa: 'Corporativa (café da manhã empresarial — prático, simples)',
  economica: 'Econômica (acessível e de qualidade — itens básicos do café da manhã)',
}

export async function POST(req: NextRequest) {
  try {
    const { category, customType, targetPrice, margin, instructions } = await req.json()

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
      .select('basket_count')
      .eq('user_id', user.id)
      .eq('year_month', yearMonth)
      .maybeSingle()

    const currentCount = usageRow?.basket_count ?? 0
    if (currentCount >= MONTHLY_LIMIT) {
      const resetDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
        .toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
      return NextResponse.json(
        { error: `Limite de ${MONTHLY_LIMIT} cestas por mês atingido. Renova em ${resetDate}.` },
        { status: 429 }
      )
    }

    const { data: products } = await supabase
      .from('products')
      .select('*')
      .order('category')
      .order('name')

    const targetCost = targetPrice * (1 - margin / 100)

    const catalogContext = products && products.length > 0
      ? `\nPRODUTOS DO CATÁLOGO DA EMPREENDEDORA (use-os com prioridade):\n${
          (products as Product[]).map(p =>
            `ID:${p.id} | ${p.name} | R$${p.cost.toFixed(2)}/${p.unit} | cat:${p.category}`
          ).join('\n')
        }`
      : '\n(empreendedora sem produtos cadastrados — use produtos genéricos típicos)'

    const typeDescription = customType || CATEGORY_NAMES[category] || category
    const userMessage = `Monte uma cesta ${typeDescription}.
Preço de venda: R$${targetPrice.toFixed(2)} | Margem desejada: ${margin}% | Custo máximo dos produtos: R$${targetCost.toFixed(2)}
${catalogContext}

Sugira entre 6 e 10 itens que formem uma cesta bonita e equilibrada para esse tipo.
O custo total dos itens deve ficar próximo de R$${targetCost.toFixed(2)}.${
  instructions ? `\n\nInstruções adicionais da empreendedora: ${instructions}` : ''
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1536,
      system: `Você é especialista em montagem de cestas de café da manhã para empreendedoras brasileiras.
Use produtos do catálogo da empreendedora sempre que disponíveis e adequados.

Retorne APENAS JSON válido, sem markdown, neste formato exato:
{"basketName":"Nome sugestivo","concept":"Uma frase curta descrevendo o conceito e equilíbrio da cesta.","items":[{"name":"nome","costPerUnit":0.00,"unit":"un","quantity":1,"fromDb":false,"productId":null}]}

Regras de composição — equilibre os itens por tipo quando possível:
- Padaria: pão artesanal, croissant, bolo, pão de queijo
- Queijo/laticínios: queijo, manteiga, requeijão, iogurte
- Charcutaria: presunto, peito de peru, salame
- Oleaginosas: castanha, amêndoa, mix de nuts
- Doces/confeitaria: chocolate, geleia, mel, brownie
- Frutas frescas ou secas
- Bebidas: suco, café, chá
- Embalagem e acessórios: plástico, fita, tag, cesta — use os do catálogo se cadastrados
- Adapte à proposta da cesta (fitness evita doces, econômica prioriza básicos, etc.)

Outras regras:
- Produto do catálogo: fromDb=true, productId=o ID exato (string), costPerUnit=custo exato do catálogo
- Produto fora do catálogo: fromDb=false, productId=null, estime custo realista em BRL
- custo total = soma(costPerUnit × quantity) deve ser próximo ao custo máximo informado
- Quantidades realistas: pão de queijo 6un, café 1 pacote, etc.
- Nomes em português brasileiro`,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Resposta da IA sem JSON válido')
    const result = JSON.parse(jsonMatch[0])

    await supabase.from('ai_usage').upsert(
      { user_id: user.id, year_month: yearMonth, basket_count: currentCount + 1 },
      { onConflict: 'user_id,year_month' }
    )

    return NextResponse.json({
      ...result,
      usageCount: currentCount + 1,
      usageLimit: MONTHLY_LIMIT,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('sugerir-cesta error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
